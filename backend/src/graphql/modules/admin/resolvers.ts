import { auth } from "../../../lib/auth.js";
import type { GQLContext } from "../../context.js";
import { GraphQLValidationError, requireAdmin } from "../../context.js";

export const adminResolvers = {
	Query: {
		adminStats: async (_: unknown, __: unknown, ctx: GQLContext) => {
			requireAdmin(ctx);

			const now = new Date();
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

			const [
				totalOrdersCount,
				totalProductsCount,
				newCustomersCount,
				revenueAgg,
				statusAgg,
			] = await Promise.all([
				ctx.prisma.order.count(),
				ctx.prisma.product.count({ where: { isDeleted: false } }),
				ctx.prisma.user.count({
					where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } },
				}),
				ctx.prisma.order.aggregate({
					where: { paymentStatus: "PAID" },
					_sum: { total: true },
				}),
				ctx.prisma.order.groupBy({
					by: ["status"],
					_count: { status: true },
				}),
			]);

			return {
				totalOrders: totalOrdersCount,
				totalRevenue: revenueAgg._sum.total ?? 0,
				totalProducts: totalProductsCount,
				newCustomers: newCustomersCount,
				ordersByStatus: statusAgg.map((s) => ({
					status: s.status,
					count: s._count.status,
				})),
			};
		},

		adminCustomers: async (
			_: unknown,
			{ pagination }: { pagination?: { page?: number; limit?: number } },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const page = pagination?.page ?? 1;
			const limit = Math.min(pagination?.limit ?? 20, 50);
			const skip = (page - 1) * limit;

			const [customers, totalCount] = await Promise.all([
				ctx.prisma.user.findMany({
					where: { role: "CUSTOMER" },
					orderBy: { createdAt: "desc" },
					skip,
					take: limit,
					include: {
						orders: {
							where: { paymentStatus: "PAID" },
							select: { total: true },
						},
						_count: {
							select: { orders: true },
						},
					},
				}),
				ctx.prisma.user.count({ where: { role: "CUSTOMER" } }),
			]);

			const formattedCustomers = customers.map((c) => ({
				id: c.id,
				fullName: c.fullName,
				email: c.email,
				createdAt: c.createdAt,
				totalOrders: c._count.orders,
				totalSpent: c.orders.reduce((acc, order) => acc + order.total, 0),
			}));

			return {
				customers: formattedCustomers,
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
		registerAdmin: async (
			_: unknown,
			{
				email,
				password,
				fullName,
			}: { email: string; password: string; fullName: string },
			ctx: GQLContext,
		) => {
			if (!fullName || fullName.trim().length < 2) {
				throw new GraphQLValidationError(
					"Full name must be at least 2 characters",
					"fullName",
				);
			}
			if (!email?.includes("@")) {
				throw new GraphQLValidationError("Valid email is required", "email");
			}
			if (!password || password.length < 8) {
				throw new GraphQLValidationError(
					"Password must be at least 8 characters",
					"password",
				);
			}

			// Enforce the single admin rule
			const adminExists = await ctx.prisma.user.findFirst({
				where: { role: "ADMIN" },
			});

			if (adminExists) {
				throw new GraphQLValidationError(
					"Registration failed: An administrator has already been registered.",
				);
			}

			// Check if user already exists under this email (either role)
			const existingUser = await ctx.prisma.user.findUnique({
				where: { email: email.toLowerCase() },
			});

			if (existingUser) {
				throw new GraphQLValidationError(
					"An account with this email already exists",
					"email",
				);
			}

			try {
				// Sign up via Better Auth
				await auth.api.signUpEmail({
					body: {
						name: fullName,
						fullName, // Required by additionalFields config
						email: email.toLowerCase(),
						password,
					},
				});

				// Elevate the role to ADMIN
				const user = await ctx.prisma.user.update({
					where: { email: email.toLowerCase() },
					data: { role: "ADMIN" },
				});

				return user;
			} catch (error: unknown) {
				if (error instanceof GraphQLValidationError) throw error;
				const message =
					error instanceof Error ? error.message : "Registration failed";
				throw new GraphQLValidationError(message);
			}
		},
	},
};
