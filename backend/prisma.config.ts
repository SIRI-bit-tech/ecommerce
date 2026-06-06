import { env } from "./src/config/env.js";

export default {
	schema: "./prisma/schema.prisma",
	database: {
		url: env.DATABASE_URL,
	},
};
