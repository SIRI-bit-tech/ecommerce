import gql from "graphql-tag";

export const adminTypeDefs = gql`
  type OrderStatusCount {
    status: OrderStatus!
    count: Int!
  }

  type AdminStats {
    totalOrders: Int!
    totalRevenue: Int!
    totalProducts: Int!
    newCustomers: Int!
    ordersByStatus: [OrderStatusCount!]!
  }

  type CustomerInfo {
    id: ID!
    fullName: String!
    email: String!
    createdAt: DateTime!
    totalOrders: Int!
    totalSpent: Int!
  }

  type CustomerConnection {
    customers: [CustomerInfo!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    adminStats: AdminStats!
    adminCustomers(pagination: PaginationInput): CustomerConnection!
  }

  extend type Mutation {
    registerAdmin(email: String!, password: String!, fullName: String!): User!
  }
`;
