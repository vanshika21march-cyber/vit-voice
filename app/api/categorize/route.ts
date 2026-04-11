import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, description, type } = await req.json();
    
    const campusCategories = ["Hostel", "Food", "Transport", "Mental Health", "Academics", "Sports", "Tech Issues", "Events"];
    const growthCategories = ["Internships", "Exams", "Skills", "Career", "Mental Health", "Other"];
    
    const categories = type === "campus" ? campusCategories : growthCategories;
    
    // Check if API key exists. If not, use our fast local fallback keyword logic!
    if (!process.env.GEMINI_API_KEY) {
      console.log("No GEMINI_API_KEY found, using local fallback categorizer");
      const text = (title + " " + description).toLowerCase();
      
      if (type === "campus") {
        if (text.includes("food") || text.includes("mess") || text.includes("eat")) return NextResponse.json({ category: "Food" });
        if (text.includes("hostel") || text.includes("room") || text.includes("block")) return NextResponse.json({ category: "Hostel" });
        if (text.includes("cab") || text.includes("bus") || text.includes("transport")) return NextResponse.json({ category: "Transport" });
        if (text.includes("health") || text.includes("sad") || text.includes("depressed")) return NextResponse.json({ category: "Mental Health" });
        if (text.includes("class") || text.includes("exam") || text.includes("teacher")) return NextResponse.json({ category: "Academics" });
        if (text.includes("cricket") || text.includes("football") || text.includes("sport") || text.includes("gym")) return NextResponse.json({ category: "Sports" });
        if (text.includes("wifi") || text.includes("internet") || text.includes("net") || text.includes("tech")) return NextResponse.json({ category: "Tech Issues" });
        if (text.includes("event") || text.includes("fest")) return NextResponse.json({ category: "Events" });
      } else {
        if (text.includes("internship") || text.includes("job") || text.includes("placement")) return NextResponse.json({ category: "Internships" });
        if (text.includes("exam") || text.includes("cat") || text.includes("fat")) return NextResponse.json({ category: "Exams" });
        if (text.includes("skill") || text.includes("learn") || text.includes("react") || text.includes("model")) return NextResponse.json({ category: "Skills" });
        if (text.includes("career") || text.includes("future") || text.includes("resume")) return NextResponse.json({ category: "Career" });
        if (text.includes("health") || text.includes("sad") || text.includes("burnout")) return NextResponse.json({ category: "Mental Health" });
      }
      
      return NextResponse.json({ category: "Other" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a smart AI categorizer for a college platform. 
    A student has posted a problem or project idea.
    
    Title: "${title}"
    Description: "${description}"
    
    Categorize this post into EXACTLY ONE of the following categories:
    [${categories.join(", ")}]
    
    Rules:
    1. Respond with ONLY the category name. Do not write any other words.
    2. Ensure the spelling exactly matches the options provided.
    
    Category:`;

    const result = await model.generateContent(prompt);
    const categoryResponse = result.response.text().trim();
    
    // Strict Validation: Ensure AI doesn't hallucinate a category
    const matchedCategory = categories.find(c => c.toLowerCase() === categoryResponse.toLowerCase());
    
    if (matchedCategory) {
      return NextResponse.json({ category: matchedCategory });
    }
    
    return NextResponse.json({ category: "Other" });
  } catch (error) {
    console.error("AI Categorization Error:", error);
    return NextResponse.json({ category: "Other" }, { status: 500 });
  }
}
