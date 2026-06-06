import type { GQLContext } from "../../context.js";
import {
	GraphQLNotFoundError,
	GraphQLValidationError,
	requireAuth,
} from "../../context.js";

const cartIncludes = {
	items: {
		include: {
			product: {
				include: {
					images: { orderBy: { order: "asc" as const } },
				},
			},
			variant: true,
		},
		orderBy: { addedAt: "desc" as const },
	},
};

export const cartResolvers = {
	Cart: {
		totalItems: (parent: { items?: Array<{ quantity: number }> }) => {
			return (parent.items ?? []).reduce((acc, item) => acc + item.quantity, 0);
		},
		subtotal: (parent: {
			items?: Array<{
				quantity: number;
				product: {
					basePrice: number;
					salePrice: number | null;
					isOnSale: boolean;
				};
			}>;
		}) => {
			return (parent.items ?? []).reduce((acc, item) => {
				const price =
					item.product.isOnSale && item.product.salePrice !== null
						? item.product.salePrice
						: item.product.basePrice;
				return acc + price * item.quantity;
			}, 0);
		},
	},

	Query: {
		cart: async (_: unknown, __: unknown, ctx: GQLContext) => {
			const user = requireAuth(ctx);

			const cart = await ctx.prisma.cart.findUnique({
				where: { userId: user.id },
				include: cartIncludes,
			});

			if (!cart) {
				return ctx.prisma.cart.create({
					data: { userId: user.id },
					include: cartIncludes,
				});
			}

			return cart;
		},
	},

	Mutation: {
		addToCart: async (
			_: unknown,
			{
				productId,
				variantId,
				quantity,
			}: { productId: string; variantId?: string; quantity: number },
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			if (quantity < 1) {
				throw new GraphQLValidationError("Quantity must be at least 1");
			}

			const product = await ctx.prisma.product.findUnique({
				where: { id: productId, isDeleted: false },
				include: { variants: true },
			});

			if (!product) {
				throw new GraphQLNotFoundError("Product not found");
			}

			if (product.variants.length > 0 && !variantId) {
				throw new GraphQLValidationError(
					"Variant selection is required for this product",
				);
			}

			let cart = await ctx.prisma.cart.findUnique({
				where: { userId: user.id },
			});
			if (!cart) {
				cart = await ctx.prisma.cart.create({ data: { userId: user.id } });
			}

			// Upsert cart item
			const existingItem = await ctx.prisma.cartItem.findFirst({
				where: {
					cartId: cart.id,
					productId,
					variantId: variantId ?? null,
				},
			});

			if (existingItem) {
				await ctx.prisma.cartItem.update({
					where: { id: existingItem.id },
					data: { quantity: existingItem.quantity + quantity },
				});
			} else {
				await ctx.prisma.cartItem.create({
					data: {
						cartId: cart.id,
						productId,
						variantId: variantId ?? null,
						quantity,
					},
				});
			}

			return ctx.prisma.cart.findUniqueOrThrow({
				where: { id: cart.id },
				include: cartIncludes,
			});
		},

		updateCartItem: async (
			_: unknown,
			{ cartItemId, quantity }: { cartItemId: string; quantity: number },
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			if (quantity < 1) {
				throw new GraphQLValidationError("Quantity must be at least 1");
			}

			const cart = await ctx.prisma.cart.findUnique({
				where: { userId: user.id },
			});

			if (!cart) throw new GraphQLNotFoundError("Cart not found");

			const item = await ctx.prisma.cartItem.findUnique({
				where: { id: cartItemId },
			});

			if (!item || item.cartId !== cart.id) {
				throw new GraphQLNotFoundError("Cart item not found");
			}

			await ctx.prisma.cartItem.update({
				where: { id: cartItemId },
				data: { quantity },
			});

			return ctx.prisma.cart.findUniqueOrThrow({
				where: { id: cart.id },
				include: cartIncludes,
			});
		},

		removeFromCart: async (
			_: unknown,
			{ cartItemId }: { cartItemId: string },
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			const cart = await ctx.prisma.cart.findUnique({
				where: { userId: user.id },
			});

			if (!cart) throw new GraphQLNotFoundError("Cart not found");

			const item = await ctx.prisma.cartItem.findUnique({
				where: { id: cartItemId },
			});

			if (!item || item.cartId !== cart.id) {
				throw new GraphQLNotFoundError("Cart item not found");
			}

			await ctx.prisma.cartItem.delete({
				where: { id: cartItemId },
			});

			return ctx.prisma.cart.findUniqueOrThrow({
				where: { id: cart.id },
				include: cartIncludes,
			});
		},

		clearCart: async (_: unknown, __: unknown, ctx: GQLContext) => {
			const user = requireAuth(ctx);

			const cart = await ctx.prisma.cart.findUnique({
				where: { userId: user.id },
			});

			if (cart) {
				await ctx.prisma.cartItem.deleteMany({
					where: { cartId: cart.id },
				});
			}

			return true;
		},
	},
};
