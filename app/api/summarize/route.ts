import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(req: Request) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "GROQ_API_KEY is not configured in environment variables." },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { messages, title } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "No messages provided for summarization." },
                { status: 400 }
            );
        }

        const formattedChat = messages
            .map((msg: any) => `${msg.senderName}: ${msg.text}`)
            .join("\n");

        const prompt = `
You are an AI assistant helping college students quickly understand the context of a problem-solving group chat. 
The group chat is about a problem titled: "${title || "General Discussion"}".

Here is the chat transcript:
---
${formattedChat}
---

Please provide a concise summary of this conversation with the following format:
1. Core Issue: (1 sentence describing the main problem)
2. Current Status: (1 sentence describing what has been figured out so far)
3. Action Items / Next Steps: (A short bulleted list of 1-3 things the group is planning to do next, or needs help with. Keep them very brief.)

Do not include any pleasantries or external text. Stick exactly to this format.
    `;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 512,
        });

        const summaryText = completion.choices[0].message.content || "";

        return NextResponse.json({ summary: summaryText });
    } catch (error: any) {
        console.error("Error in Groq summarize API:", error);
        return NextResponse.json(
            { error: "Failed to generate summary: " + error.message },
            { status: 500 }
        );
    }
}