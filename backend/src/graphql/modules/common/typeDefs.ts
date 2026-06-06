import gql from "graphql-tag";

export const commonTypeDefs = gql`
  scalar JSON
  scalar DateTime

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  input PaginationInput {
    page: Int
    limit: Int
  }

  enum SortOrder {
    ASC
    DESC
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;
