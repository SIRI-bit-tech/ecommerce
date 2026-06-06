import { GraphQLScalarType, Kind } from "graphql";

export const commonResolvers = {
	JSON: new GraphQLScalarType({
		name: "JSON",
		description: "Arbitrary JSON value",
		parseValue: (value: unknown) => value,
		serialize: (value: unknown) => value,
		parseLiteral: (ast) => {
			if (ast.kind === Kind.STRING) {
				try {
					return JSON.parse(ast.value);
				} catch {
					return ast.value;
				}
			}
			return null;
		},
	}),

	DateTime: new GraphQLScalarType({
		name: "DateTime",
		description: "ISO 8601 date string",
		parseValue: (value: unknown) => {
			if (typeof value === "string" || typeof value === "number") {
				return new Date(value);
			}
			throw new Error("DateTime must be a string or number");
		},
		serialize: (value: unknown) => {
			if (value instanceof Date) {
				return value.toISOString();
			}
			if (typeof value === "string") {
				return new Date(value).toISOString();
			}
			throw new Error("DateTime must be a Date instance");
		},
		parseLiteral: (ast) => {
			if (ast.kind === Kind.STRING) {
				return new Date(ast.value);
			}
			return null;
		},
	}),
};
