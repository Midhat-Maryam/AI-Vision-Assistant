import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `You are an accessibility assistant describing a scene for a blind or low-vision user through voice.

Speak naturally, as if you're a sighted friend briefly describing what's in front of them — no field labels, no lists, just plain flowing spoken language.

Rules:
1. If there's a hazard (stairs, obstacles, vehicles, uneven ground, sharp or hot objects, open doors, low-hanging objects), mention it FIRST, clearly and briefly.
2. Keep the whole response to 1-2 short sentences maximum — the user needs quick, scannable information, not a detailed essay.
3. Mention direction (left, right, ahead) or rough distance only when it adds real value (e.g. for hazards or objects the user might reach for).
4. If there is readable text or a sign, read it naturally as part of the sentence, don't just say "there is text."
5. If the user asked a specific question, answer ONLY that question directly and briefly — skip the general scene description entirely.
6. Do not describe irrelevant background details (wall color, lighting, minor décor) unless nothing else is present in the frame.
7. Do not invent details you cannot clearly see.

Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{"description": "string", "hasHazard": boolean, "isUrgent": boolean}`;

const CURRENCY_INSTRUCTION = `You are identifying a Pakistani currency note for a blind user.
Follow these steps internally before answering:
1. First, identify the exact large printed numeral visible in the corner(s) of the note (must be one of: 10, 20, 50, 100, 500, 1000, 5000).
2. Then check if the dominant note color matches that numeral: Rs 10 = green/brown, Rs 20 = orange/brown, Rs 50 = green, Rs 100 = red-orange, Rs 500 = teal/blue-green, Rs 1000 = purple/violet, Rs 5000 = light blue/grey.
3. Only state the denomination if the numeral is clearly visible and legible. If the numeral is blurry, cropped, upside down, or not visible, respond honestly: "The note's value is not clearly visible. Please hold it straight and closer to the camera."
Never guess based on color alone. Never invent a numeral you cannot actually see.
Do NOT output your reasoning steps — only the final answer.
Keep the response short and confident only when certain, e.g. "This is a 500 rupee note."
Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{"description": "string", "hasHazard": false, "isUrgent": false}`;

const PRODUCT_INSTRUCTION = `You are reading a product label or package for a blind user.
Speak the information as a natural, flowing sentence — do NOT use field labels like "Product:", "Expiry date:", "Dosage:", or "Warning:". Just say the information directly in plain spoken language.

Cover these points in this priority order, but only mention what is actually clearly visible (skip silently anything not visible — do not say "not visible" or "not available"):
1. What the product is
2. The expiry or best-before date, if visible
3. Dosage instructions, if it's a medicine
4. Any important text warning (not regulatory icons like CE, RoHS, WEEE — ignore those)

Example of the tone wanted: "This is a Panadol strip. It expires in May 2027. Take one tablet every six hours."

Do NOT invent any text, numbers, or dates you cannot actually read clearly.
If almost nothing is legible, respond with: "The text is too small or unclear to read. Try holding it closer or in better light."
Keep the response under 3 short sentences.
Always set hasHazard to false for this mode.
Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{"description": "string", "hasHazard": false, "isUrgent": false}`;

const HAZARD_SCAN_INSTRUCTION = `You are scanning a live camera feed for immediate physical hazards for a blind user walking or moving.
ONLY report a hazard if there is a clear, immediate physical danger in the frame: stairs, steps, a curb, an obstacle directly ahead, a vehicle, an open hole, or something at head height.
If there is no clear immediate hazard, respond with hasHazard: false and an empty description.
If there IS a hazard, describe it in under 8 words, e.g. "Stairs going down, right ahead" or "Car approaching from the left."
Do not describe anything else — no general scene description, no colors, no background details.
Respond ONLY with valid JSON: {"description": "string", "hasHazard": boolean, "isUrgent": boolean}`;

export async function POST(req: NextRequest) {
  try {
    const { image, query, mode } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const systemPrompt =
      mode === "currency" ? CURRENCY_INSTRUCTION :
      mode === "product" ? PRODUCT_INSTRUCTION :
      mode === "hazard" ? HAZARD_SCAN_INSTRUCTION :
      SYSTEM_INSTRUCTION;

    const userPrompt =
      mode === "currency"
        ? "What is the denomination of this currency note?"
        : mode === "product"
        ? "Read this product label — focus on expiry date, dosage, and key warnings first."
        : mode === "hazard"
        ? "Is there an immediate physical hazard in this frame?"
        : query && query.trim().length > 0
        ? `Answer this specific question about the image: ${query}`
        : "Describe what is in front of the user.";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-27b",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
            ],
          },
        ],
        temperature: mode === "currency" || mode === "product" || mode === "hazard" ? 0 : 0.4,
        max_tokens: mode === "hazard" ? 60 : 300,
        reasoning_effort: "none",
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Groq error:", data.error);
      return NextResponse.json({ error: data.error.message || "Groq API error" }, { status: 500 });
    }

    const raw = data.choices?.[0]?.message?.content || "";
    const cleaned = raw
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/```json|```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { description: cleaned, hasHazard: false, isUrgent: false };
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Analyze API error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}