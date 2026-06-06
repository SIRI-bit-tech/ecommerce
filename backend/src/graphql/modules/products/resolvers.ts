import type { Category, Prisma } from "@prisma/client";
import type { GQLContext } from "../../context.js";
import {
	GraphQLNotFoundError,
	GraphQLValidationError,
	requireAdmin,
	requireAuth,
} from "../../context.js";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

const productIncludes = {
	images: { orderBy: { order: "asc" as const } },
	variants: true,
	reviews: {
		include: { user: { select: { fullName: true } } },
		orderBy: { createdAt: "desc" as const },
	},
};

export const productResolvers = {
	Product: {
		averageRating: (parent: { reviews?: Array<{ rating: number }> }) => {
			const reviews = parent.reviews ?? [];
			if (reviews.length === 0) return null;
			const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
			return Math.round((sum / reviews.length) * 10) / 10;
		},
		reviewCount: (parent: { reviews?: unknown[] }) => {
			return parent.reviews?.length ?? 0;
		},
		totalStock: (parent: { variants?: Array<{ stock: number }> }) => {
			const variants = parent.variants ?? [];
			if (variants.length === 0) return 0;
			return variants.reduce((acc, v) => acc + v.stock, 0);
		},
		isLowStock: (parent: {
			lowStockThreshold: number;
			variants?: Array<{ stock: number }>;
		}) => {
			const variants = parent.variants ?? [];
			if (variants.length === 0) return false;
			return variants.some(
				(v) => v.stock > 0 && v.stock <= parent.lowStockThreshold,
			);
		},
	},

	Review: {
		userName: (parent: { user?: { fullName: string } }) => {
			return parent.user?.fullName ?? "Anonymous";
		},
	},

	Query: {
		products: async (
			_: unknown,
			{
				filters,
				sort,
				pagination,
			}: {
				filters?: {
					category?: string;
					categories?: string[];
					minPrice?: number;
					maxPrice?: number;
					color?: string;
					size?: string;
					isOnSale?: boolean;
					isFeatured?: boolean;
					search?: string;
				};
				sort?: { field: string; order?: string };
				pagination?: { page?: number; limit?: number };
			},
			ctx: GQLContext,
		) => {
			const page = pagination?.page ?? 1;
			const limit = Math.min(pagination?.limit ?? 20, 50);
			const skip = (page - 1) * limit;

			// Build where clause
			const where: Prisma.ProductWhereInput = {
				isDeleted: false,
			};

			if (filters) {
				if (filters.category) {
					where.category = filters.category as Prisma.EnumCategoryFilter;
				}
				if (filters.categories && filters.categories.length > 0) {
					where.category = {
						in: filters.categories as import("@prisma/client").Category[],
					};
				}
				if (filters.isOnSale !== undefined) {
					where.isOnSale = filters.isOnSale;
				}
				if (filters.isFeatured !== undefined) {
					where.isFeatured = filters.isFeatured;
				}
				if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
					where.basePrice = {};
					if (filters.minPrice !== undefined) {
						(where.basePrice as Prisma.IntFilter).gte = filters.minPrice;
					}
					if (filters.maxPrice !== undefined) {
						(where.basePrice as Prisma.IntFilter).lte = filters.maxPrice;
					}
				}
				if (filters.color) {
					where.variants = {
						some: { color: { contains: filters.color, mode: "insensitive" } },
					};
				}
				if (filters.size) {
					where.variants = {
						some: {
							...((where.variants as Prisma.ProductVariantListRelationFilter)
								?.some ?? {}),
							size: { contains: filters.size, mode: "insensitive" },
						},
					};
				}
				if (filters.search) {
					where.OR = [
						{ name: { contains: filters.search, mode: "insensitive" } },
						{ description: { contains: filters.search, mode: "insensitive" } },
					];
				}
			}

			// Build orderBy
			let orderBy: Prisma.ProductOrderByWithRelationInput = {
				createdAt: "desc",
			};
			if (sort) {
				switch (sort.field) {
					case "PRICE_LOW_HIGH":
						orderBy = { basePrice: "asc" };
						break;
					case "PRICE_HIGH_LOW":
						orderBy = { basePrice: "desc" };
						break;
					case "NAME":
						orderBy = {
							name: sort.order?.toLowerCase() === "desc" ? "desc" : "asc",
						};
						break;
					case "POPULARITY":
						orderBy = { orderItems: { _count: "desc" } };
						break;
					default:
						orderBy = {
							createdAt: sort.order?.toLowerCase() === "asc" ? "asc" : "desc",
						};
						break;
				}
			}

			const [products, totalCount] = await Promise.all([
				ctx.prisma.product.findMany({
					where,
					include: productIncludes,
					orderBy,
					skip,
					take: limit,
				}),
				ctx.prisma.product.count({ where }),
			]);

			return {
				products,
				pageInfo: {
					hasNextPage: skip + limit < totalCount,
					hasPreviousPage: page > 1,
					totalCount,
					totalPages: Math.ceil(totalCount / limit),
					currentPage: page,
				},
			};
		},

		product: async (
			_: unknown,
			{ slug }: { slug: string },
			ctx: GQLContext,
		) => {
			const product = await ctx.prisma.product.findFirst({
				where: { slug, isDeleted: false },
				include: productIncludes,
			});
			return product;
		},

		featuredProducts: async (
			_: unknown,
			{ limit }: { limit?: number },
			ctx: GQLContext,
		) => {
			return ctx.prisma.product.findMany({
				where: { isFeatured: true, isDeleted: false },
				include: productIncludes,
				take: limit ?? 8,
				orderBy: { createdAt: "desc" },
			});
		},

		relatedProducts: async (
			_: unknown,
			{ productId, limit }: { productId: string; limit?: number },
			ctx: GQLContext,
		) => {
			const product = await ctx.prisma.product.findUnique({
				where: { id: productId },
				select: { category: true, id: true },
			});

			if (!product) return [];

			return ctx.prisma.product.findMany({
				where: {
					category: product.category,
					id: { not: product.id },
					isDeleted: false,
				},
				include: productIncludes,
				take: limit ?? 4,
				orderBy: { createdAt: "desc" },
			});
		},

		inventory: async (
			_: unknown,
			{ pagination }: { pagination?: { page?: number; limit?: number } },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const page = pagination?.page ?? 1;
			const limit = Math.min(pagination?.limit ?? 50, 100);
			const skip = (page - 1) * limit;

			const products = await ctx.prisma.product.findMany({
				where: { isDeleted: false },
				include: {
					...productIncludes,
				},
				skip,
				take: limit,
				orderBy: { updatedAt: "desc" },
			});

			return products.map((p) => ({
				product: p,
				variants: p.variants,
				totalStock: p.variants.reduce((acc, v) => acc + v.stock, 0),
				isLowStock: p.variants.some(
					(v) => v.stock > 0 && v.stock <= p.lowStockThreshold,
				),
			}));
		},
	},

	Mutation: {
		createProduct: async (
			_: unknown,
			{
				input,
			}: {
				input: {
					name: string;
					slug?: string;
					description: string;
					category: string;
					basePrice: number;
					salePrice?: number;
					isOnSale?: boolean;
					isFeatured?: boolean;
					lowStockThreshold?: number;
					images: Array<{ url: string; isPrimary?: boolean; order?: number }>;
					variants?: Array<{
						size?: string;
						color?: string;
						stock: number;
						sku: string;
					}>;
				};
			},
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const slug = input.slug || slugify(input.name);

			// Check slug uniqueness
			const existingSlug = await ctx.prisma.product.findUnique({
				where: { slug },
			});
			if (existingSlug) {
				throw new GraphQLValidationError(
					`A product with slug "${slug}" already exists`,
					"slug",
				);
			}

			if (input.images.length === 0) {
				throw new GraphQLValidationError(
					"At least one product image is required",
					"images",
				);
			}

			const product = await ctx.prisma.product.create({
				data: {
					name: input.name,
					slug,
					description: input.description,
					category: input.category as Category,
					basePrice: input.basePrice,
					salePrice: input.salePrice,
					isOnSale: input.isOnSale ?? false,
					isFeatured: input.isFeatured ?? false,
					lowStockThreshold: input.lowStockThreshold ?? 5,
					images: {
						create: input.images.map((img, idx) => ({
							url: img.url,
							isPrimary: img.isPrimary ?? idx === 0,
							order: img.order ?? idx,
						})),
					},
					...(input.variants && input.variants.length > 0
						? {
								variants: {
									create: input.variants.map((v) => ({
										size: v.size,
										color: v.color,
										stock: v.stock,
										sku: v.sku,
									})),
								},
							}
						: {}),
				},
				include: productIncludes,
			});

			return product;
		},

		updateProduct: async (
			_: unknown,
			{
				id,
				input,
			}: {
				id: string;
				input: {
					name?: string;
					slug?: string;
					description?: string;
					category?: string;
					basePrice?: number;
					salePrice?: number;
					isOnSale?: boolean;
					isFeatured?: boolean;
					lowStockThreshold?: number;
					images?: Array<{ url: string; isPrimary?: boolean; order?: number }>;
					variants?: Array<{
						size?: string;
						color?: string;
						stock: number;
						sku: string;
					}>;
				};
			},
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const existing = await ctx.prisma.product.findUnique({ where: { id } });
			if (!existing || existing.isDeleted) {
				throw new GraphQLNotFoundError("Product not found");
			}

			// Check slug uniqueness if slug is being changed
			if (input.slug && input.slug !== existing.slug) {
				const slugExists = await ctx.prisma.product.findUnique({
					where: { slug: input.slug },
				});
				if (slugExists) {
					throw new GraphQLValidationError(
						`A product with slug "${input.slug}" already exists`,
						"slug",
					);
				}
			}

			// Build update data
			const updateData: Prisma.ProductUpdateInput = {};
			if (input.name !== undefined) updateData.name = input.name;
			if (input.slug !== undefined) updateData.slug = input.slug;
			if (input.description !== undefined)
				updateData.description = input.description;
			if (input.category !== undefined)
				updateData.category = input.category as Category;
			if (input.basePrice !== undefined) updateData.basePrice = input.basePrice;
			if (input.salePrice !== undefined) updateData.salePrice = input.salePrice;
			if (input.isOnSale !== undefined) updateData.isOnSale = input.isOnSale;
			if (input.isFeatured !== undefined)
				updateData.isFeatured = input.isFeatured;
			if (input.lowStockThreshold !== undefined)
				updateData.lowStockThreshold = input.lowStockThreshold;

			// If images are provided, replace all
			if (input.images) {
				await ctx.prisma.productImage.deleteMany({ where: { productId: id } });
				updateData.images = {
					create: input.images.map((img, idx) => ({
						url: img.url,
						isPrimary: img.isPrimary ?? idx === 0,
						order: img.order ?? idx,
					})),
				};
			}

			// If variants are provided, replace all
			if (input.variants) {
				await ctx.prisma.productVariant.deleteMany({
					where: { productId: id },
				});
				updateData.variants = {
					create: input.variants.map((v) => ({
						size: v.size,
						color: v.color,
						stock: v.stock,
						sku: v.sku,
					})),
				};
			}

			const product = await ctx.prisma.product.update({
				where: { id },
				data: updateData,
				include: productIncludes,
			});

			return product;
		},

		deleteProduct: async (
			_: unknown,
			{ id }: { id: string },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const existing = await ctx.prisma.product.findUnique({ where: { id } });
			if (!existing) {
				throw new GraphQLNotFoundError("Product not found");
			}

			// Soft delete
			await ctx.prisma.product.update({
				where: { id },
				data: { isDeleted: true },
			});

			return true;
		},

		updateStock: async (
			_: unknown,
			{ variantId, stock }: { variantId: string; stock: number },
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			if (stock < 0) {
				throw new GraphQLValidationError("Stock cannot be negative", "stock");
			}

			const variant = await ctx.prisma.productVariant.findUnique({
				where: { id: variantId },
			});
			if (!variant) {
				throw new GraphQLNotFoundError("Variant not found");
			}

			return ctx.prisma.productVariant.update({
				where: { id: variantId },
				data: { stock },
			});
		},

		createReview: async (
			_: unknown,
			{
				productId,
				rating,
				comment,
			}: { productId: string; rating: number; comment?: string },
			ctx: GQLContext,
		) => {
			const user = requireAuth(ctx);

			if (rating < 1 || rating > 5) {
				throw new GraphQLValidationError(
					"Rating must be between 1 and 5",
					"rating",
				);
			}

			const product = await ctx.prisma.product.findFirst({
				where: { id: productId, isDeleted: false },
			});
			if (!product) {
				throw new GraphQLNotFoundError("Product not found");
			}

			// Check if user already reviewed
			const existingReview = await ctx.prisma.review.findUnique({
				where: { userId_productId: { userId: user.id, productId } },
			});
			if (existingReview) {
				throw new GraphQLValidationError(
					"You have already reviewed this product",
				);
			}

			const review = await ctx.prisma.review.create({
				data: {
					userId: user.id,
					productId,
					rating,
					comment,
				},
				include: { user: { select: { fullName: true } } },
			});

			return review;
		},
	},
};
