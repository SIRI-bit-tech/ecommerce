import gql from "graphql-tag";

export const cartTypeDefs = gql`
  type Cart {
    id: ID!
    items: [CartItem!]!
    totalItems: Int!
    subtotal: Int!
    updatedAt: DateTime!
  }

  type CartItem {
    id: ID!
    product: Product!
    variant: ProductVariant
    quantity: Int!
    addedAt: DateTime!
  }

  extend type Query {
    cart: Cart
  }

  extend type Mutation {
    addToCart(productId: ID!, variantId: ID, quantity: Int!): Cart!
    updateCartItem(cartItemId: ID!, quantity: Int!): Cart!
    removeFromCart(cartItemId: ID!): Cart!
    clearCart: Boolean!
  }
`;
