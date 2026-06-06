import type { GQLContext } from "../../context.js";
import { GraphQLNotFoundError, requireAuth } from "../../context.js";

const wishlistIncludes = {
	items: {
		include: {
			product: {
				include: {
					images: { orderBy: { order: "asc" as const } },
					variants: true,
				},
			},
		},
		orderBy: { addedAt: "desc" as const },
	},
};

export const wishlistResolvers = {
	Query: {
		wishlist: async (_: unknown, __: unknown, ctx: GQLContext) => {
			const user = requireAuth(ctx);

			const wishlist = await ctx.prisma.wishlist.findUnique({
				where: { userId: user.id },
				include: wishlistIncludes,
			});

			if (!wishlist) {
				return ctx.prisma.wishlist.create({
					data: { userId: user.id },
					include: wishlistIncludes,
				});
			}

			return wishlist;
		},
	},

	Mutation: {
		addToWishlist: async (
			_: unknown,
			{ productId }: { productId: string },
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			const product = await ctx.prisma.product.findUnique({
				where: { id: productId, isDeleted: false },
			});

			if (!product) {
				throw new GraphQLNotFoundError("Product not found");
			}

			let wishlist = await ctx.prisma.wishlist.findUnique({
				where: { userId: user.id },
			});

			if (!wishlist) {
				wishlist = await ctx.prisma.wishlist.create({
					data: { userId: user.id },
				});
			}

			// Check if already in wishlist
			const existingItem = await ctx.prisma.wishlistItem.findUnique({
				where: {
					wishlistId_productId: {
						wishlistId: wishlist.id,
						productId,
					},
				},
			});

			if (!existingItem) {
				await ctx.prisma.wishlistItem.create({
					data: {
						wishlistId: wishlist.id,
						productId,
					},
				});
			}

			return ctx.prisma.wishlist.findUniqueOrThrow({
				where: { id: wishlist.id },
				include: wishlistIncludes,
			});
		},

		removeFromWishlist: async (
			_: unknown,
			{ productId }: { productId: string },
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			const wishlist = await ctx.prisma.wishlist.findUnique({
				where: { userId: user.id },
			});

			if (!wishlist) {
				throw new GraphQLNotFoundError("Wishlist not found");
			}

			await ctx.prisma.wishlistItem.deleteMany({
				where: {
					wishlistId: wishlist.id,
					productId,
				},
			});

			return ctx.prisma.wishlist.findUniqueOrThrow({
				where: { id: wishlist.id },
				include: wishlistIncludes,
			});
		},
	},
};
