// api/chat.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const MODEL = process.env.MODEL || "llama-3.1-70b-versatile";

  if (!GROQ_KEY) {
    return res.status(500).json({ error: "Missing GROQ_API_KEY on server." });
  }

  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });

    // Build messages array for Groq-compatible chat
    // history is expected as array [{ role: "user"|"assistant", text: "..." }, ...]
    const groqMessages = [
      { role: "system", content: "You are URA, a friendly, helpful assistant. Always call yourself URA." },
    ];

    if (Array.isArray(history)) {
      for (const h of history) {
        groqMessages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: h.text,
        });
      }
    }

    groqMessages.push({ role: "user", content: message });

    const apiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: groqMessages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    const text = await apiRes.text();
    // If not ok, forward body (likely JSON or text)
    if (!apiRes.ok) {
      // try parse JSON for clarity
      let errBody = text;
      try { errBody = JSON.parse(text); } catch (e) {}
      return res.status(500).json({ error: "Model API error", details: errBody });
    }

    const data = JSON.parse(text);
    const reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "No reply from model.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Server error in /api/chat:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message || err });
  }
}
