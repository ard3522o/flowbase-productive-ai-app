import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ASSEMBLYAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      "https://streaming.assemblyai.com/v3/token?" +
        new URLSearchParams({ expires_in_seconds: "600" }),
      { headers: { Authorization: apiKey } }
    );
    const data = await res.json();
    return NextResponse.json({ token: data.token });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
