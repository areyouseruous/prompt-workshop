export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const { idea, fields } = req.body || {};
    if (!idea || typeof idea !== "string") {
      return res.status(400).json({ error: "Missing 'idea' (string)" });
    }

    // Build a short, strict instruction so the model returns one clean prompt line.
    const system = [
      "You expand short image ideas into a single, clean, ready-to-use image prompt.",
      "Include subject, action, environment, mood, style, lighting, composition, lens when relevant.",
      "Keep it concise, no bullet points, no quotes, no extra commentary.",
      "Avoid vague fluff; be specific but not long.",
      "No unsafe content, no watermarks, no copyrighted character names."
    ].join(" ");

    const user = JSON.stringify({ idea, fields });

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.7,
        max_tokens: 220
      })
    });

    if (!r.ok) {
      const e = await r.text();
      return res.status(500).json({ error: e || "OpenAI error" });
    }
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ prompt: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
