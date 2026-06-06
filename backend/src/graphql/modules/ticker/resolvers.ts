import type { GQLContext } from "../../context.js";
import { GraphQLNotFoundError, requireAdmin } from "../../context.js";

export const tickerResolvers = {
	Query: {
		activeTicker: async (_: unknown, __: unknown, ctx: GQLContext) => {
			return ctx.prisma.promoTicker.findFirst({
				where: { isActive: true },
			});
		},
		allTickers: async (_: unknown, __: unknown, ctx: GQLContext) => {
			requireAdmin(ctx);
			return ctx.prisma.promoTicker.findMany({
				orderBy: { createdAt: "desc" },
			});
		},
	},

	Mutation: {
		createPromoTicker: async (
			_: unknown,
			{ message }: { message: string },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			return ctx.prisma.promoTicker.create({
				data: { message },
			});
		},

		setPromoTicker: async (
			_: unknown,
			{ id }: { id: string },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const ticker = await ctx.prisma.promoTicker.findUnique({
				where: { id },
			});

			if (!ticker) throw new GraphQLNotFoundError("Ticker not found");

			// Deactivate all others
			await ctx.prisma.promoTicker.updateMany({
				where: { id: { not: id } },
				data: { isActive: false },
			});

			// Activate the selected one
			return ctx.prisma.promoTicker.update({
				where: { id },
				data: { isActive: true },
			});
		},

		deletePromoTicker: async (
			_: unknown,
			{ id }: { id: string },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const ticker = await ctx.prisma.promoTicker.findUnique({
				where: { id },
			});

			if (!ticker) throw new GraphQLNotFoundError("Ticker not found");

			await ctx.prisma.promoTicker.delete({ where: { id } });
			return true;
		},
	},
};
