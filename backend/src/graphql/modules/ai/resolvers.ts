import crypto from "node:crypto";
import type { ChatSession } from "@google/generative-ai";
import { publishToChannel } from "../../../lib/ably.js";
import { geminiModel, geminiModelStream } from "../../../lib/gemini.js";
import type { GQLContext } from "../../context.js";
import { GraphQLNotFoundError, requireAdmin } from "../../context.js";

// Simple in-memory session store for chat history (in production, use Redis or DB)
const chatSessions = new Map<string, ChatSession>();

export const aiResolvers = {
	Query: {
		aiRecommendations: async (
			_: unknown,
			{ productId }: { productId?: string },
			ctx: GQLContext,
		) => {
			// In a real app, you'd fetch user history here
			const products = await ctx.prisma.product.findMany({
				where: { isDeleted: false },
				take: 50, // Get a sample
				select: { id: true, name: true, category: true, description: true },
			});

			let contextStr = "Available catalog:\n";
			products.forEach((p) => {
				contextStr += `- ID: ${p.id}, Name: ${p.name}, Category: ${p.category}\n`;
			});

			const prompt = `
        You are an AI fashion assistant for Rey's Vogue. 
        Based on the following catalog, recommend 4 products that would go well together or are trending.
        If a specific productId is provided (${productId || "None"}), make sure recommendations complement it.
        
        Return ONLY valid JSON in this exact format:
        [
          { "productId": "ID_HERE", "reason": "Short reason why" }
        ]
        
        ${contextStr}
      `;

			try {
				const result = await geminiModel.generateContent(prompt);
				const text = result.response.text();
				const jsonStr = text
					.replace(/```json/g, "")
					.replace(/```/g, "")
					.trim();
				const recs = JSON.parse(jsonStr) as Array<{
					productId: string;
					reason: string;
				}>;

				const fullProducts = await ctx.prisma.product.findMany({
					where: { id: { in: recs.map((r) => r.productId) } },
					include: { images: true, variants: true },
				});

				return recs
					.map((r) => {
						const product = fullProducts.find((p) => p.id === r.productId);
						if (!product) return null;
						return { product, reason: r.reason };
					})
					.filter(Boolean);
			} catch (err) {
				console.error("AI Recommendation error:", err);
				return [];
			}
		},
	},

	Mutation: {
		generateProductDescription: async (
			_: unknown,
			{
				name,
				category,
				colors,
				sizes,
			}: {
				name: string;
				category: string;
				colors?: string[];
				sizes?: string[];
			},
			ctx: GQLContext,
		) => {
			requireAdmin(ctx);

			const prompt = `
        Write a premium, compelling product description for an e-commerce fashion store called Rey's Vogue.
        Product Name: ${name}
        Category: ${category}
        ${colors?.length ? `Available Colors: ${colors.join(", ")}` : ""}
        ${sizes?.length ? `Available Sizes: ${sizes.join(", ")}` : ""}
        
        Keep it to 2-3 short paragraphs. Tone should be sophisticated, modern, and confident. 
        Focus on style, versatility, and quality. Do not include price.
      `;

			const result = await geminiModel.generateContent(prompt);
			return result.response.text();
		},

		startStyleChat: async (
			_: unknown,
			{ message }: { message: string },
			ctx: GQLContext,
		) => {
			const sessionId = crypto.randomUUID();

			const products = await ctx.prisma.product.findMany({
				where: { isDeleted: false },
				select: { id: true, name: true, category: true, basePrice: true },
			});

			const systemInstruction = `
        You are Rey's Vogue Style Assistant. You help customers find outfits.
        You have access to this catalog: 
        ${JSON.stringify(products)}
        
        When recommending products, you MUST link to them using markdown format: [Product Name](/product/<id>).
        For example: [Premium Linen Suit](/product/12345).
        Do NOT just bold the product name. Always use the markdown link so users can click it.
        Be concise, stylish, and helpful.
      `;

			const chat = geminiModelStream.startChat({
				systemInstruction: {
					role: "system",
					parts: [{ text: systemInstruction }],
				},
				history: [],
			});

			chatSessions.set(sessionId, chat);

			// We return the sessionId immediately, and handle streaming in the background
			processChatStream(sessionId, chat, message);

			return sessionId;
		},

		continueStyleChat: async (
			_: unknown,
			{ sessionId, message }: { sessionId: string; message: string },
			_ctx: GQLContext,
		) => {
			const chat = chatSessions.get(sessionId);
			if (!chat) {
				throw new GraphQLNotFoundError("Chat session expired or not found");
			}

			processChatStream(sessionId, chat, message);
			return sessionId;
		},
	},
};

// Helper to process stream and push to Ably
async function processChatStream(
	sessionId: string,
	chat: ChatSession,
	message: string,
) {
	try {
		const result = await chat.sendMessageStream(message);

		for await (const chunk of result.stream) {
			const text = chunk.text();
			await publishToChannel(`chat-${sessionId}`, "token", { text });
		}

		await publishToChannel(`chat-${sessionId}`, "done", { status: "complete" });
	} catch (err: any) {
		console.error("Chat stream error:", err);
		
		let errorMessage = "Sorry, I encountered an error. Please try again.";
		
		if (err?.status === 429) {
			errorMessage = "I'm currently receiving too many requests right now. Please wait about 30 seconds and try again!";
		}

		await publishToChannel(`chat-${sessionId}`, "error", {
			message: errorMessage,
		});
	}
}
