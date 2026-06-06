import gql from "graphql-tag";

export const tickerTypeDefs = gql`
  type PromoTicker {
    id: ID!
    message: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Query {
    activeTicker: PromoTicker
    allTickers: [PromoTicker!]!
  }

  extend type Mutation {
    createPromoTicker(message: String!): PromoTicker!
    setPromoTicker(id: ID!): PromoTicker!
    deletePromoTicker(id: ID!): Boolean!
  }
`;
