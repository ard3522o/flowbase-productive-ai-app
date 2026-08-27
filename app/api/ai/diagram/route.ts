import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const systemPrompt = `You are an expert diagram generator. Given a user's description, generate an array of Excalidraw elements as JSON.

RULES:
- Return ONLY a valid JSON array, no markdown, no code fences, no explanation.
- Each element must have valid Excalidraw properties.
- Use these element types: "rectangle", "ellipse", "diamond", "text", "arrow", "line".
- For rectangles: { type: "rectangle", id: string, x: number, y: number, width: number, height: number, strokeColor: string, backgroundColor: string, fillStyle: "solid", strokeWidth: 2, roughness: 1, opacity: 100, angle: 0, groupIds: [], frameId: null, roundness: { type: 3 }, seed: number, version: 1, versionNonce: number, isDeleted: false, boundElements: [{ id: string, type: "text" }] | null, updated: 0, link: null, locked: false }
- For ellipses: same as rectangle but type "ellipse", roundness: { type: 2 }
- For diamonds: same as rectangle but type "diamond", roundness: { type: 2 }
- For text: { type: "text", id: string, x: number, y: number, width: number, height: number, text: string, fontSize: 16, fontFamily: 1, textAlign: "center", verticalAlign: "middle", strokeColor: "#1e1e1e", backgroundColor: "transparent", fillStyle: "solid", strokeWidth: 1, roughness: 1, opacity: 100, angle: 0, groupIds: [], frameId: null, roundness: null, seed: number, version: 1, versionNonce: number, isDeleted: false, boundElements: null, updated: 0, link: null, locked: false, containerId: string | null, originalText: string, lineHeight: 1.25 }
- For arrows: { type: "arrow", id: string, x: number, y: number, width: number, height: number, points: [[0,0],[dx,dy]], strokeColor: "#1e1e1e", backgroundColor: "transparent", fillStyle: "solid", strokeWidth: 2, roughness: 1, opacity: 100, angle: 0, groupIds: [], frameId: null, roundness: { type: 2 }, seed: number, version: 1, versionNonce: number, isDeleted: false, boundElements: null, updated: 0, link: null, locked: false, lastCommittedPoint: null, startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: "arrow" }

DESIGN GUIDELINES:
- Use a clean vertical or horizontal layout depending on the diagram type.
- Start positions at x: 100, y: 100.
- Space elements 120-150px apart vertically or 250px horizontally.
- Use colors: boxes use pastel backgrounds like "#d8f5a2", "#a5d8ff", "#ffc9c9", "#fff3bf", "#e5dbff".
- Text inside rectangles should be bound: set containerId on text to the rectangle's id.
- Text width should be ~80% of container width, height ~25.
- Arrows connect shapes: points define the path from start to end.
- Include 4-10 shapes for a good diagram.
- IDs must be unique strings like "node_1", "node_2", "arrow_1", etc.
- seed and versionNonce can be any random integer.

Return ONLY the JSON array.`;

    const result = await model.generateContent([
      systemPrompt,
      `Generate an Excalidraw diagram for: "${prompt}"`,
    ]);

    const text = result.response.text();
    
    // Extract JSON array from response - try to find it even if wrapped in markdown
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const elements = JSON.parse(jsonStr);
    
    if (!Array.isArray(elements)) {
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
    }

    return NextResponse.json({ elements });
  } catch (error: any) {
    console.error("AI diagram error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate diagram" },
      { status: 500 }
    );
  }
}
