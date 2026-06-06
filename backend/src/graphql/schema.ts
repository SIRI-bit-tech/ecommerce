import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { adminResolvers } from "./modules/admin/resolvers.js";
import { adminTypeDefs } from "./modules/admin/typeDefs.js";
import { aiResolvers } from "./modules/ai/resolvers.js";
import { aiTypeDefs } from "./modules/ai/typeDefs.js";
import { authResolvers } from "./modules/auth/resolvers.js";
import { authTypeDefs } from "./modules/auth/typeDefs.js";
import { cartResolvers } from "./modules/cart/resolvers.js";
import { cartTypeDefs } from "./modules/cart/typeDefs.js";
// Resolvers
import { commonResolvers } from "./modules/common/resolvers.js";
// TypeDefs
import { commonTypeDefs } from "./modules/common/typeDefs.js";
import { ordersResolvers } from "./modules/orders/resolvers.js";
import { ordersTypeDefs } from "./modules/orders/typeDefs.js";
import { productResolvers } from "./modules/products/resolvers.js";
import { productTypeDefs } from "./modules/products/typeDefs.js";
import { shippingResolvers } from "./modules/shipping/resolvers.js";
import { shippingTypeDefs } from "./modules/shipping/typeDefs.js";
import { tickerResolvers } from "./modules/ticker/resolvers.js";
import { tickerTypeDefs } from "./modules/ticker/typeDefs.js";
import { wishlistResolvers } from "./modules/wishlist/resolvers.js";
import { wishlistTypeDefs } from "./modules/wishlist/typeDefs.js";

const typeDefs = mergeTypeDefs([
	commonTypeDefs,
	authTypeDefs,
	productTypeDefs,
	cartTypeDefs,
	wishlistTypeDefs,
	ordersTypeDefs,
	shippingTypeDefs,
	tickerTypeDefs,
	adminTypeDefs,
	aiTypeDefs,
]);

const resolvers = mergeResolvers([
	commonResolvers,
	authResolvers,
	productResolvers,
	cartResolvers,
	wishlistResolvers,
	ordersResolvers,
	shippingResolvers,
	tickerResolvers,
	adminResolvers,
	aiResolvers,
]);

export const schema = makeExecutableSchema({
	typeDefs,
	resolvers,
});
