import { GoogleGenerativeAI } from "@google/generative-ai";

/// <reference types="vite/client" />
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Gemini API Key is missing. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const GeminiService = {
    async generateDailySpark(sign: string = "General"): Promise<string> {
        try {
            const prompt = `act as a mystical astrology expert. Give me a short, one-sentence "daily spark" or horoscope insight for today. make it sound profound but modern. Target audience: ${sign}. max 20 words.`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error generating daily spark:", error);
            return "The stars are silent today. Look within for your answer.";
        }
    },

    async generateTarotInterpretation(cardName: string, question: string): Promise<string> {
        try {
            const prompt = `You are an expert Tarot reader. The user asks: "${question}". The card drawn is "${cardName}". Provide a concise, 3-sentence interpretation. 1. The card's core meaning. 2. How it relates to the question. 3. A one-sentence actionable advice. Tone: Mystical, empowering, supportive.`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error generating tarot reading:", error);
            return "The cards are clouded. Meditate and try again later.";
        }
    },

    async generateBirthChartAnalysis(name: string, planets: any, elements: any): Promise<string> {
        try {
            // Simplified prompt for MVP
            const planetSummary = Object.entries(planets).map(([k, v]) => `${k} in ${v}`).join(', ');
            const elementSummary = Object.entries(elements).map(([k, v]) => `${k}: ${v}%`).join(', ');

            const prompt = `Act as a master astrologer. Analyze the birth chart for ${name}. 
            Planets: ${planetSummary}. 
            Five Elements: ${elementSummary}.
            
            Provide a 2-paragraph insight. 
            Paragraph 1: Core identity analysis based on Sun/Moon and dominant elements.
            Paragraph 2: Current life theme or advice.
            Tone: Profound, mystical, yet grounded and modern. Avoid generic horoscopes.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error generating report:", error);
            return "The stars are aligning... please try again later to reveal your full cosmic blueprint.";
        }
    }
};
