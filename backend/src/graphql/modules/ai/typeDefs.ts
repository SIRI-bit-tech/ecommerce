import gql from "graphql-tag";

export const aiTypeDefs = gql`
  type AIProductRecommendation {
    product: Product!
    reason: String!
  }

  extend type Query {
    aiRecommendations(productId: ID): [AIProductRecommendation!]!
  }

  extend type Mutation {
    generateProductDescription(name: String!, category: Category!, colors: [String!], sizes: [String!]): String!
    startStyleChat(message: String!): String!
    continueStyleChat(sessionId: String!, message: String!): String!
  }
`;
