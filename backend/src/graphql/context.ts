import type { PrismaClient, User } from "@prisma/client";
import type Ably from "ably";
import type { Request, Response } from "express";

export interface GQLContext {
	prisma: PrismaClient;
	ably?: Ably.Rest;
	user: User | null;
	req: Request;
	res: Response;
}

export function requireAuth(ctx: GQLContext): User {
	if (!ctx.user) {
		throw new GraphQLAuthError("You must be logged in to perform this action");
	}
	return ctx.user;
}

export function requireAdmin(ctx: GQLContext): User {
	const user = requireAuth(ctx);
	if (user.role !== "ADMIN") {
		throw new GraphQLForbiddenError("Admin access required");
	}
	return user;
}

// ─── Custom GraphQL Errors ─────────────────────────────────────────────────

import { GraphQLError } from "graphql";

export class GraphQLAuthError extends GraphQLError {
	constructor(message: string = "Authentication required") {
		super(message, {
			extensions: { code: "UNAUTHENTICATED" },
		});
	}
}

export class GraphQLForbiddenError extends GraphQLError {
	constructor(message: string = "Forbidden") {
		super(message, {
			extensions: { code: "FORBIDDEN" },
		});
	}
}

export class GraphQLNotFoundError extends GraphQLError {
	constructor(message: string = "Resource not found") {
		super(message, {
			extensions: { code: "NOT_FOUND" },
		});
	}
}

export class GraphQLValidationError extends GraphQLError {
	constructor(message: string, field?: string) {
		super(message, {
			extensions: { code: "BAD_USER_INPUT", field },
		});
	}
}
