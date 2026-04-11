import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, description, existingProblems } = await req.json();
    
    // Check if API key exists. If not, fallback to simple title matching.
    if (!process.env.GEMINI_API_KEY) {
      console.log("No GEMINI_API_KEY found, using local fallback deduplicator");
      const normalizedTitle = title.toLowerCase().trim();
      
      const exactMatch = existingProblems.find((p: any) => 
        p.title.toLowerCase().trim() === normalizedTitle
      );
      
      if (exactMatch) {
         return NextResponse.json({ duplicateId: exactMatch.id });
      }
      return NextResponse.json({ duplicateId: "NO_MATCH" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an AI deduplication assistant for a college issue tracker.
A user is posting a new problem:
Title: "${title}"
Description: "${description}"

Here is a JSON list of existing problems:
${JSON.stringify(existingProblems)}

Does the user's new problem semantically mean exactly the same thing as any of the existing problems? (e.g. "Cabs are expensive" vs "High transport costs" or "Wifi is down" vs "No internet connection").
If yes, return ONLY the ID of the matching problem. 
If no, return EXACTLY the string "NO_MATCH".
Do not output any markdown formatting, do not explain your reasoning. Just the raw ID or NO_MATCH.
Result:`;

    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text().trim();
    
    // Strip markdown formatting if AI accidentally added it
    if (aiResponse.startsWith("\`\`\`")) {
      aiResponse = aiResponse.replace(/\`\`\`/g, "").trim();
    }
    
    // Strict Validation: Ensure AI doesn't hallucinate a fake ID
    if (aiResponse !== "NO_MATCH") {
      const matchExists = existingProblems.find((p: any) => p.id === aiResponse);
      if (matchExists) {
        return NextResponse.json({ duplicateId: aiResponse });
      }
    }
    
    return NextResponse.json({ duplicateId: "NO_MATCH" });
  } catch (error) {
    console.error("AI Deduplication Error:", error);
    return NextResponse.json({ duplicateId: "NO_MATCH" }, { status: 500 });
  }
}
