import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the Gemini client using the API key from environment variables
// Make sure to add GEMINI_API_KEY to your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        // 1. Ensure API key exists
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured in environment variables." },
                { status: 500 }
            );
        }

        // 2. Parse the request body
        const body = await req.json();
        const { messages, title } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "No messages provided for summarization." },
                { status: 400 }
            );
        }

        // 3. Format messages into a single readable text block
        const formattedChat = messages
            .map((msg: any) => `${msg.senderName}: ${msg.text}`)
            .join("\n");

        // 4. Construct the prompt for Gemini
        const prompt = `
You are an AI assistant helping college students quickly understand the context of a problem-solving group chat. 
The group chat is about a problem titled: "${title || "General Discussion"}".

Here is the chat transcript:
---
${formattedChat}
---

Please provide a concise summary of this conversation with the following format:
1. **Core Issue**: (1 sentence describing the main problem)
2. **Current Status**: (1 sentence describing what has been figured out so far)
3. **Action Items / Next Steps**: (A short bulleted list of 1-3 things the group is planning to do next, or needs help with. Keep them very brief.)

Do not include any pleasantries or external text. Stick exactly to this format. Use plain text formatting, no markdown asterisks for bolding if possible, just clear labels. 
    `;

        // 5. Initialize the model (using gemini-pro for global fallback compatibility)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 6. Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summaryText = response.text();

        return NextResponse.json({ summary: summaryText });
    } catch (error: any) {
        console.error("Error in Gemini summarize API:", error);
        return NextResponse.json(
            { error: "Failed to generate summary: " + error.message },
            { status: 500 }
        );
    }
}
