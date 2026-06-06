import type {
	OrderStatus,
	PaymentMethod,
	PaymentStatus,
	Prisma,
} from "@prisma/client";
import { publishToChannel } from "../../../lib/ably.js";
import {
	generateFlutterwaveReference,
	initializeBankTransfer,
	initializePayment,
	verifyTransaction,
} from "../../../lib/flutterwave.js";
import {
	sendOrderConfirmationEmail,
	sendOrderStatusEmail,
} from "../../../lib/resend.js";
import type { GQLContext } from "../../context.js";
import {
	GraphQLNotFoundError,
	GraphQLValidationError,
	requireAdmin,
	requireAuth,
} from "../../context.js";

const orderIncludes = {
	user: { select: { id: true, fullName: true, email: true } },
	items: {
		include: {
			product: {
				include: {
					images: { orderBy: { order: "asc" as const } },
				},
			},
			variant: true,
		},
	},
};

export const ordersResolvers = {
	Query: {
		orders: async (
			_: unknown,
			{ pagination }: { pagination?: { page?: number; limit?: number } },
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			const page = pagination?.page ?? 1;
			const limit = Math.min(pagination?.limit ?? 20, 50);
			const skip = (page - 1) * limit;

			const [orders, totalCount] = await Promise.all([
				ctx.prisma.order.findMany({
					where: { userId: user.id },
					include: orderIncludes,
					orderBy: { createdAt: "desc" },
					skip,
					take: limit,
				}),
				ctx.prisma.order.count({ where: { userId: user.id } }),
			]);

			return {
				orders,
				pageInfo: {
					hasNextPage: skip + limit < totalCount,
					hasPreviousPage: page > 1,
					totalCount,
					totalPages: Math.ceil(totalCount / limit),
					currentPage: page,
				},
			};
		},

		order: async (_: unknown, { id }: { id: string }, ctx: GQLContext) => {
			const user = requireAuth(ctx);

			const order = await ctx.prisma.order.findUnique({
				where: { id },
				include: orderIncludes,
			});

			if (!order) throw new GraphQLNotFoundError("Order not found");
			if (order.userId !== user.id && user.role !== "ADMIN") {
				throw new GraphQLNotFoundError("Order not found");
			}

			return order;
		},

		adminOrders: async (
			_: unknown,
			{
				filters,
				pagination,
			}: {
				filters?: {
					status?: string;
					paymentStatus?: string;
					paymentMethod?: string;
					search?: string;
				};
				pagination?: { page?: number; limit?: number };
			},
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const page = pagination?.page ?? 1;
			const limit = Math.min(pagination?.limit ?? 20, 50);
			const skip = (page - 1) * limit;

			const where: Prisma.OrderWhereInput = {};

			if (filters) {
				if (filters.status)
					where.status = filters.status as Prisma.EnumOrderStatusFilter;
				if (filters.paymentStatus)
					where.paymentStatus =
						filters.paymentStatus as Prisma.EnumPaymentStatusFilter;
				if (filters.paymentMethod)
					where.paymentMethod =
						filters.paymentMethod as Prisma.EnumPaymentMethodFilter;
				if (filters.search) {
					where.OR = [
						{ id: { contains: filters.search, mode: "insensitive" } },
						{
							flutterwaveReference: {
								contains: filters.search,
								mode: "insensitive",
							},
						},
						{
							user: {
								OR: [
									{
										fullName: { contains: filters.search, mode: "insensitive" },
									},
									{ email: { contains: filters.search, mode: "insensitive" } },
								],
							},
						},
					];
				}
			}

			const [orders, totalCount] = await Promise.all([
				ctx.prisma.order.findMany({
					where,
					include: orderIncludes,
					orderBy: { createdAt: "desc" },
					skip,
					take: limit,
				}),
				ctx.prisma.order.count({ where }),
			]);

			return {
				orders,
				pageInfo: {
					hasNextPage: skip + limit < totalCount,
					hasPreviousPage: page > 1,
					totalCount,
					totalPages: Math.ceil(totalCount / limit),
					currentPage: page,
				},
			};
		},
	},

	Mutation: {
		createOrder: async (
			_: unknown,
			{
				input,
			}: {
				input: {
					paymentMethod: string;
					shippingAddress: {
						fullName: string;
						phone: string;
						address: string;
						city: string;
						state: string;
						landmark?: string;
					};
					state: string;
				};
			},
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			const cart = await ctx.prisma.cart.findUnique({
				where: { userId: user.id },
				include: {
					items: {
						include: { product: true, variant: true },
					},
				},
			});

			if (!cart || cart.items.length === 0) {
				throw new GraphQLValidationError("Your cart is empty");
			}

			// 1. Validate stock and calculate subtotal
			let subtotal = 0;
			for (const item of cart.items) {
				const price =
					item.product.isOnSale && item.product.salePrice !== null
						? item.product.salePrice
						: item.product.basePrice;

				subtotal += price * item.quantity;

				// Check stock
				if (item.variant) {
					if (item.variant.stock < item.quantity) {
						throw new GraphQLValidationError(
							`Not enough stock for ${item.product.name} (${item.variant.size ?? item.variant.color})`,
						);
					}
				}
			}

			// 2. Get shipping fee
			const shippingRate = await ctx.prisma.shippingRate.findUnique({
				where: { state: input.state },
			});

			if (!shippingRate) {
				throw new GraphQLValidationError(
					`We currently do not ship to ${input.state}`,
				);
			}

			const shippingFee = shippingRate.fee;
			const total = subtotal + shippingFee;

			const reference = generateFlutterwaveReference();

			// 3. Create the order
			const order = await ctx.prisma.order.create({
				data: {
					userId: user.id,
					status: "PENDING",
					subtotal,
					shippingFee,
					total,
					paymentMethod: input.paymentMethod as PaymentMethod,
					paymentStatus: "UNPAID" as PaymentStatus,
					flutterwaveReference: reference,
					shippingAddress:
						input.shippingAddress as unknown as Prisma.InputJsonValue,
					items: {
						create: cart.items.map((item) => ({
							productId: item.productId,
							variantId: item.variantId,
							quantity: item.quantity,
							unitPrice:
								item.product.isOnSale && item.product.salePrice !== null
									? item.product.salePrice
									: item.product.basePrice,
							snapshot: {
								name: item.product.name,
								image: (item.product as any).images?.[0]?.url, // Will only be present if included in cart item query, fallback used
								size: item.variant?.size,
								color: item.variant?.color,
							},
						})),
					},
				},
				include: orderIncludes,
			});

			// 4. Clear the cart
			await ctx.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

			// 5. Initialize Flutterwave
			let flutterwaveResponse: Awaited<ReturnType<typeof initializePayment>>;
			if (input.paymentMethod === "CARD") {
				flutterwaveResponse = await initializePayment({
					email: user.email,
					amount: total,
					reference,
					callbackUrl: `${process.env.FRONTEND_URL}/checkout/verify`,
					metadata: { orderId: order.id },
				});
			} else {
				const [first, ...lastNameParts] = user.fullName.split(" ");
				const firstName = first || "Customer";
				const lastName = lastNameParts.join(" ") || "Name";

				flutterwaveResponse = await initializeBankTransfer({
					email: user.email,
					amount: total,
					reference,
					firstName,
					lastName,
					callbackUrl: `${process.env.FRONTEND_URL}/checkout/verify`,
					metadata: { orderId: order.id },
				});
			}

			// Notify admin
			await publishToChannel("admin-events", "new-order", {
				orderId: order.id,
			});

			return {
				order,
				authorizationUrl: flutterwaveResponse.data.link,
				reference,
			};
		},

		verifyPayment: async (
			_: unknown,
			{ reference, transactionId }: { reference: string; transactionId: string },
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			const order = await ctx.prisma.order.findUnique({
				where: { flutterwaveReference: reference },
				include: orderIncludes,
			});

			if (!order) throw new GraphQLNotFoundError("Order not found");
			if (order.userId !== user.id)
				throw new GraphQLNotFoundError("Order not found");

			if (order.paymentStatus === "PAID") return order;

			const verification = await verifyTransaction(transactionId);

			if (verification.data.status === "successful") {
				// Atomically lock and update payment status to avoid race condition double-processing
				const lockStatus = await ctx.prisma.order.updateMany({
					where: { id: order.id, paymentStatus: { not: "PAID" } },
					data: {
						paymentStatus: "PAID",
						status: "CONFIRMED",
					},
				});

				if (lockStatus.count > 0) {
					// Decrement stock
					for (const item of order.items) {
						if (item.variantId) {
							await ctx.prisma.productVariant.update({
								where: { id: item.variantId },
								data: { stock: { decrement: item.quantity } },
							});
						}
					}

					// Send email
					await sendOrderConfirmationEmail(user.email, {
						orderId: order.id,
						fullName: user.fullName,
						items: (order as any).items.map((i: any) => ({
							name: i.product.name,
							quantity: i.quantity,
							unitPrice: i.unitPrice,
							size: i.variant?.size ?? undefined,
							color: i.variant?.color ?? undefined,
						})),
						subtotal: order.subtotal,
						shippingFee: order.shippingFee,
						total: order.total,
						paymentMethod: order.paymentMethod,
						shippingAddress: order.shippingAddress as any,
					});

					// Publish live update
					await publishToChannel(`order-${order.id}`, "status-update", {
						status: "CONFIRMED",
					});
				}

				// Return latest data
				return ctx.prisma.order.findUnique({
					where: { id: order.id },
					include: orderIncludes,
				});
			}

			if (verification.data.status === "failed") {
				return ctx.prisma.order.update({
					where: { id: order.id },
					data: { paymentStatus: "FAILED" },
					include: orderIncludes,
				});
			}

			return order; // Pending
		},

		markOrderPaid: async (
			_: unknown,
			{ orderId }: { orderId: string },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const order = await ctx.prisma.order.findUnique({
				where: { id: orderId },
				include: orderIncludes,
			});

			if (!order) throw new GraphQLNotFoundError("Order not found");

			if (order.paymentStatus === "PAID") {
				throw new GraphQLValidationError("Order is already paid");
			}

			// Atomically transition status
			const lockStatus = await ctx.prisma.order.updateMany({
				where: { id: orderId, paymentStatus: { not: "PAID" } },
				data: {
					paymentStatus: "PAID",
					status: "CONFIRMED",
				},
			});

			if (lockStatus.count === 0) {
				throw new GraphQLValidationError("Order is already paid");
			}

			// Decrement stock
			for (const item of order.items) {
				if (item.variantId) {
					await ctx.prisma.productVariant.update({
						where: { id: item.variantId },
						data: { stock: { decrement: item.quantity } },
					});
				}
			}

			const updatedOrder = await ctx.prisma.order.findUnique({
				where: { id: orderId },
				include: orderIncludes,
			});

			// Send email
			if (updatedOrder) {
				await sendOrderConfirmationEmail(updatedOrder.user.email, {
					orderId: updatedOrder.id,
					fullName: updatedOrder.user.fullName,
					items: (updatedOrder as any).items.map((i: any) => ({
						name: i.product.name,
						quantity: i.quantity,
						unitPrice: i.unitPrice,
						size: i.variant?.size ?? undefined,
						color: i.variant?.color ?? undefined,
					})),
					subtotal: updatedOrder.subtotal,
					shippingFee: updatedOrder.shippingFee,
					total: updatedOrder.total,
					paymentMethod: updatedOrder.paymentMethod,
					shippingAddress: updatedOrder.shippingAddress as any,
				});

				await publishToChannel(`order-${updatedOrder.id}`, "status-update", {
					status: "CONFIRMED",
				});
			}

			return updatedOrder;
		},

		updateOrderStatus: async (
			_: unknown,
			{
				orderId,
				status,
				trackingInfo,
				cancellationReason,
			}: {
				orderId: string;
				status: string;
				trackingInfo?: string;
				cancellationReason?: string;
			},
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const order = await ctx.prisma.order.findUnique({
				where: { id: orderId },
				include: orderIncludes,
			});

			if (!order) throw new GraphQLNotFoundError("Order not found");

			const updateData: Prisma.OrderUpdateInput = {
				status: status as OrderStatus,
			};

			if (trackingInfo !== undefined) updateData.trackingInfo = trackingInfo;
			if (cancellationReason !== undefined)
				updateData.cancellationReason = cancellationReason;

			const updatedOrder = await ctx.prisma.order.update({
				where: { id: orderId },
				data: updateData,
				include: orderIncludes,
			});

			// Send status email
			if (status !== "PENDING") {
				await sendOrderStatusEmail(
					order.user.email,
					order.user.fullName,
					order.id,
					status,
					trackingInfo,
					cancellationReason,
				);
			}

			await publishToChannel(`order-${order.id}`, "status-update", {
				status,
			});

			return updatedOrder;
		},
	},

	Subscription: {
		// GraphQL Subscriptions via Ably are handled on the frontend client-side directly
		// connecting to the channel `order-${orderId}` or `admin-events`.
		// The type definitions exist to document the events.
	},
};
