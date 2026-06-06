import gql from "graphql-tag";

export const wishlistTypeDefs = gql`
  type Wishlist {
    id: ID!
    items: [WishlistItem!]!
  }

  type WishlistItem {
    id: ID!
    product: Product!
    addedAt: DateTime!
  }

  extend type Query {
    wishlist: Wishlist
  }

  extend type Mutation {
    addToWishlist(productId: ID!): Wishlist!
    removeFromWishlist(productId: ID!): Wishlist!
  }
`;
