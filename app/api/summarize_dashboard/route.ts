import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured in environment variables." },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { groups } = body;

        if (!groups || !Array.isArray(groups) || groups.length === 0) {
            return NextResponse.json(
                { error: "No group data provided for summarization." },
                { status: 400 }
            );
        }

        const formattedChats = groups
            .map((g: any) => {
                const msgs = g.messages.map((m: any) => `${m.senderName}: ${m.text}`).join("\n");
                return `## Group Chat: ${g.title}\n${msgs}\n`;
            })
            .join("\n---\n");

        const prompt = `
You are an AI assistant helping a college student quickly catch up on multiple problem-solving group chats they are participating in.

Here are the transcripts from their active group chats:
---
${formattedChats}
---

Please provide a highly readable "Daily Catch-up" summary combining all the chats.
For each group chat, output exactly one short paragraph highlighting:
1. What the core issue is.
2. The current status or progress.
3. What they are planning to do next.

Format your response exactly like this for each group:
### [Group Title]
[2-3 sentences summarizing the core issue, current status, and next steps].

Do not use conversational filler (like "Here is your summary"). Just get straight to the summaries. Keep it professional, concise, and easy to skim.
    `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summaryText = response.text();

        return NextResponse.json({ summary: summaryText });
    } catch (error: any) {
        console.error("Error in Gemini dashboard summarize API:", error);
        return NextResponse.json(
            { error: "Failed to generate summary: " + error.message },
            { status: 500 }
        );
    }
}
