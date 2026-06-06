import gql from "graphql-tag";

export const ordersTypeDefs = gql`
  enum OrderStatus {
    PENDING
    CONFIRMED
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
  }

  enum PaymentMethod {
    CARD
    BANK_TRANSFER
  }

  enum PaymentStatus {
    UNPAID
    PAID
    FAILED
  }

  type Order {
    id: ID!
    user: User!
    status: OrderStatus!
    subtotal: Int!
    shippingFee: Int!
    total: Int!
    paymentMethod: PaymentMethod!
    paymentStatus: PaymentStatus!
    flutterwaveReference: String
    shippingAddress: JSON!
    trackingInfo: String
    cancellationReason: String
    items: [OrderItem!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrderItem {
    id: ID!
    product: Product!
    variant: ProductVariant
    quantity: Int!
    unitPrice: Int!
    snapshot: JSON!
  }

  input ShippingAddressInput {
    fullName: String!
    phone: String!
    address: String!
    city: String!
    state: String!
    landmark: String
  }

  input CreateOrderInput {
    paymentMethod: PaymentMethod!
    shippingAddress: ShippingAddressInput!
    state: String! # For looking up shipping fee
  }

  type CreateOrderResponse {
    order: Order!
    authorizationUrl: String
    reference: String!
  }

  type OrderConnection {
    orders: [Order!]!
    pageInfo: PageInfo!
  }

  input OrderFilterInput {
    status: OrderStatus
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod
    search: String
  }

  type Subscription {
    orderStatusUpdated(orderId: ID!): Order!
    newOrderReceived: Order!
  }

  extend type Query {
    orders(pagination: PaginationInput): OrderConnection!
    order(id: ID!): Order!
    
    # Admin Queries
    adminOrders(filters: OrderFilterInput, pagination: PaginationInput): OrderConnection!
  }

  extend type Mutation {
    createOrder(input: CreateOrderInput!): CreateOrderResponse!
    verifyPayment(reference: String!, transactionId: String!): Order!
    
    # Admin Mutations
    markOrderPaid(orderId: ID!): Order!
    updateOrderStatus(orderId: ID!, status: OrderStatus!, trackingInfo: String, cancellationReason: String): Order!
  }
`;
