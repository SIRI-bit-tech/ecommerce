import gql from "graphql-tag";

export const productTypeDefs = gql`
  enum Category {
    MALE_WEAR
    FEMALE_WEAR
    SHOE
    SANDAL
    PERFUME
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String!
    category: Category!
    basePrice: Int!
    salePrice: Int
    isOnSale: Boolean!
    isFeatured: Boolean!
    lowStockThreshold: Int!
    images: [ProductImage!]!
    variants: [ProductVariant!]!
    reviews: [Review!]!
    averageRating: Float
    reviewCount: Int!
    totalStock: Int!
    isLowStock: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ProductImage {
    id: ID!
    url: String!
    isPrimary: Boolean!
    order: Int!
  }

  type ProductVariant {
    id: ID!
    size: String
    color: String
    stock: Int!
    sku: String!
  }

  type Review {
    id: ID!
    userId: ID!
    userName: String!
    rating: Int!
    comment: String
    createdAt: DateTime!
  }

  type ProductConnection {
    products: [Product!]!
    pageInfo: PageInfo!
  }

  input ProductFilterInput {
    category: Category
    categories: [Category!]
    minPrice: Int
    maxPrice: Int
    color: String
    size: String
    isOnSale: Boolean
    isFeatured: Boolean
    search: String
  }

  enum ProductSortField {
    CREATED_AT
    PRICE_LOW_HIGH
    PRICE_HIGH_LOW
    NAME
    POPULARITY
  }

  input ProductSortInput {
    field: ProductSortField!
    order: SortOrder
  }

  input ProductImageInput {
    url: String!
    isPrimary: Boolean
    order: Int
  }

  input ProductVariantInput {
    size: String
    color: String
    stock: Int!
    sku: String!
  }

  input CreateProductInput {
    name: String!
    slug: String
    description: String!
    category: Category!
    basePrice: Int!
    salePrice: Int
    isOnSale: Boolean
    isFeatured: Boolean
    lowStockThreshold: Int
    images: [ProductImageInput!]!
    variants: [ProductVariantInput!]
  }

  input UpdateProductInput {
    name: String
    slug: String
    description: String
    category: Category
    basePrice: Int
    salePrice: Int
    isOnSale: Boolean
    isFeatured: Boolean
    lowStockThreshold: Int
    images: [ProductImageInput!]
    variants: [ProductVariantInput!]
  }

  type InventoryItem {
    product: Product!
    variants: [ProductVariant!]!
    totalStock: Int!
    isLowStock: Boolean!
  }

  extend type Query {
    products(
      filters: ProductFilterInput
      sort: ProductSortInput
      pagination: PaginationInput
    ): ProductConnection!
    product(slug: String!): Product
    featuredProducts(limit: Int): [Product!]!
    relatedProducts(productId: ID!, limit: Int): [Product!]!
    inventory(pagination: PaginationInput): [InventoryItem!]!
  }

  extend type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    updateStock(variantId: ID!, stock: Int!): ProductVariant!
    createReview(productId: ID!, rating: Int!, comment: String): Review!
  }
`;
