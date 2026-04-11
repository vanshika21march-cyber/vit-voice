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
You are an AI assistant helping a college student quickly catch up on multiple problem-solving group chats.

Here are the transcripts:
---
${formattedChats}
---

For each group chat, write exactly one short paragraph:
1. What the core issue is.
2. Current status or progress.
3. What they plan to do next.

Format:
### [Group Title]
[2-3 sentences]

No filler text. Be concise and professional.
        `;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
        });

        const summaryText = completion.choices[0].message.content || "";
        return NextResponse.json({ summary: summaryText });

    } catch (error: any) {
        console.error("Error in Groq dashboard summarize API:", error);
        return NextResponse.json(
            { error: "Failed to generate summary: " + error.message },
            { status: 500 }
        );
    }
}

