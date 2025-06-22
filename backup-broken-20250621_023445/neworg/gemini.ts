
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

// This assumes process.env.API_KEY is set in the environment where this code runs.
// As per instructions, do not add UI or code to manage the API key.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (!API_KEY) {
    console.error("Gemini API key not found in process.env.API_KEY. Text summarization feature will be disabled.");
} else {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

const modelName = 'gemini-2.5-flash-preview-04-17';

export async function summarizeTextWithGemini(text: string): Promise<string> {
    if (!ai) {
        throw new Error("Gemini AI client is not initialized. API key might be missing.");
    }
    if (!text.trim()) {
        throw new Error("Cannot summarize empty text. Please enter some text.");
    }

    try {
        const prompt = `Please provide a concise summary of the following text:\n\n---\n${text}\n---\n\nSummary:`;
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            // Omitting thinkingConfig for higher quality summarization (default behavior)
        });

        const summary = response.text;
        if (summary === undefined || summary === null) { // Check if text property exists and is not null/undefined
            // This case should ideally not happen if the API call itself was successful
            // and the model is expected to return text.
            // Consider what response.text would be if the model truly generated nothing or if there was an issue.
            // Based on guidelines, response.text should be the direct way.
            console.warn("Gemini API returned a response, but the summary text is missing or undefined.", response);
            throw new Error("The model did not return a valid summary. The response might be empty or malformed.");
        }
        
        return summary.trim();

    } catch (error) {
        console.error("Error calling Gemini API for summarization:", error);
        if (error instanceof Error) {
            // Check for specific error messages that might indicate an API key issue, rate limit, etc.
            // For now, re-throw a generic message or the original one.
            throw new Error(`Failed to summarize: ${error.message}`);
        }
        throw new Error("An unknown error occurred during summarization.");
    }
}
