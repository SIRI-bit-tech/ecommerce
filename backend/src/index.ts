import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import type { GQLContext } from "./graphql/context.js";
import { schema } from "./graphql/schema.js";
import { ably } from "./lib/ably.js";
import { auth } from "./lib/auth.js";
import { verifyWebhookSignature, verifyTransaction } from "./lib/flutterwave.js";
import { prisma } from "./lib/prisma.js";

async function startServer() {
	const app = express();

	// Middleware
	app.use(
		cors({
			origin: [env.FRONTEND_URL, env.BETTER_AUTH_URL],
			credentials: true,
		}),
	);

	// Flutterwave Webhook (must be parsed raw for signature verification)
	app.post(
		"/webhooks/flutterwave",
		express.json(),
		async (req, res) => {
			const secretHash = req.headers["verif-hash"] as string;
			if (!secretHash) {
				res.status(400).send("No signature");
				return;
			}

			const isValid = verifyWebhookSignature(secretHash);
			if (!isValid) {
				res.status(400).send("Invalid signature");
				return;
			}

			const event = req.body;

			if (event.event === "charge.completed" && event.data?.status === "successful") {
				const transactionId = event.data.id;
				const orderId = event.data.meta?.orderId;

				if (orderId && transactionId) {
					// Verify the transaction server-side
					const verification = await verifyTransaction(String(transactionId));

					if (verification.data.status === "successful") {
						const order = await prisma.order.findUnique({
							where: { id: orderId },
							include: { items: true },
						});

						if (order && order.paymentStatus !== "PAID") {
							const lockStatus = await prisma.order.updateMany({
								where: { id: orderId, paymentStatus: { not: "PAID" } },
								data: {
									paymentStatus: "PAID",
									status: "CONFIRMED",
								},
							});

							if (lockStatus.count > 0) {
								// Decrement stock
								for (const item of order.items) {
									if (item.variantId) {
										await prisma.productVariant.update({
											where: { id: item.variantId },
											data: { stock: { decrement: item.quantity } },
										});
									}
								}

								// Publish live update
								if (ably) {
									const channel = ably.channels.get(`order-${orderId}`);
									await channel.publish("status-update", { status: "CONFIRMED" });
								}
							}
						}
					}
				}
			}

			res.status(200).send("OK");
		},
	);

	// Standard body parsing for the rest
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	// Better Auth endpoints
	app.all("/api/auth/{*splat}", toNodeHandler(auth));

	// UploadThing endpoints (stub for now, setup via express router)
	// We'll configure UploadThing fully when connecting frontend
	app.post("/api/uploadthing", (_req, res) => {
		res.status(200).json({ message: "UploadThing endpoint active" });
	});

	// Apollo GraphQL Server
	const server = new ApolloServer<GQLContext>({
		schema,
		formatError: (formattedError, error) => {
			// Don't expose internal server errors to client
			if (formattedError.extensions?.code === "INTERNAL_SERVER_ERROR") {
				console.error("Internal Error:", error);
			}
			return formattedError;
		},
	});

	await server.start();

	app.use(
		"/graphql",
		expressMiddleware(server, {
			context: async ({ req, res }: { req: express.Request; res: express.Response }): Promise<GQLContext> => {
				// Resolve user session from Better Auth
				const session = await auth.api.getSession({
					headers: req.headers as Record<string, string>,
				});

				let user = null;
				if (session?.user) {
					user = await prisma.user.findUnique({
						where: { id: session.user.id },
					});
				}

				return {
					prisma,
					ably,
					user,
					req,
					res,
				};
			},
		}),
	);

	app.listen(env.PORT, () => {
		console.log(`🚀 Server ready at http://localhost:${env.PORT}/graphql`);
		console.log(`🔐 Auth ready at http://localhost:${env.PORT}/api/auth`);
	});
}

startServer().catch((err) => {
	console.error("Failed to start server:", err);
	process.exit(1);
});
