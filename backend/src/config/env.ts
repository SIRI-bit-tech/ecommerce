import "dotenv/config";

function required(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

function optional(key: string, fallback: string): string {
	return process.env[key] ?? fallback;
}

export const env = {
	// Database
	DATABASE_URL: required("DATABASE_URL"),

	// Better Auth
	BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
	BETTER_AUTH_URL: optional("BETTER_AUTH_URL", "http://localhost:4000"),

	// Flutterwave
	FLUTTERWAVE_SECRET_KEY: required("FLUTTERWAVE_SECRET_KEY"),
	FLUTTERWAVE_SECRET_HASH: optional("FLUTTERWAVE_SECRET_HASH", ""),

	// Resend
	RESEND_API_KEY: required("RESEND_API_KEY"),

	// Gemini
	GEMINI_API_KEY: required("GEMINI_API_KEY"),

	// Ably
	ABLY_API_KEY: required("ABLY_API_KEY"),

	// UploadThing
	UPLOADTHING_TOKEN: optional("UPLOADTHING_TOKEN", ""),

	// App
	PORT: parseInt(optional("PORT", "4000"), 10),
	FRONTEND_URL: optional("FRONTEND_URL", "http://localhost:3000"),
	NODE_ENV: optional("NODE_ENV", "development"),

	get isDev() {
		return this.NODE_ENV === "development";
	},
	get isProd() {
		return this.NODE_ENV === "production";
	},
} as const;
