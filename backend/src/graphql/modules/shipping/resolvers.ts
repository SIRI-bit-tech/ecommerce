import type { GQLContext } from "../../context.js";
import { GraphQLValidationError, requireAdmin } from "../../context.js";

export const shippingResolvers = {
	Query: {
		shippingRates: async (_: unknown, __: unknown, ctx: GQLContext) => {
			return ctx.prisma.shippingRate.findMany({
				orderBy: { state: "asc" },
			});
		},
	},

	Mutation: {
		updateShippingRate: async (
			_: unknown,
			{ state, fee }: { state: string; fee: number },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			if (fee < 0) {
				throw new GraphQLValidationError("Fee cannot be negative", "fee");
			}

			return ctx.prisma.shippingRate.upsert({
				where: { state },
				update: { fee },
				create: { state, fee },
			});
		},
	},
};
