import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
	model: "gemini-2.5-flash",
});

export const geminiModelStream = genAI.getGenerativeModel({
	model: "gemini-2.5-flash",
	generationConfig: {
		maxOutputTokens: 2048,
		temperature: 0.7,
	},
});
