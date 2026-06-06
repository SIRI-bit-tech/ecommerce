import gql from "graphql-tag";

export const shippingTypeDefs = gql`
  type ShippingRate {
    id: ID!
    state: String!
    fee: Int!
    updatedAt: DateTime!
  }

  extend type Query {
    shippingRates: [ShippingRate!]!
  }

  extend type Mutation {
    updateShippingRate(state: String!, fee: Int!): ShippingRate!
  }
`;
