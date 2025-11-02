import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { message, userId = "fehman" } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  // Load last memory
  const history = (await kv.get(userId)) || [];

  // Add user message
  history.push({ role: "user", content: message });

  // System prompt with memory
  const fullPrompt = [
    { role: "system", content: "You are URA, a friendly helpful AI assistant created by Fehman Mohammed. Always introduce yourself as URA in your first message. Remember small details from today’s chat." },
    ...history
  ];

  // Call Groq API (or OpenAI if you prefer)
  const apiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: fullPrompt,
      max_tokens: 512
    })
  });

  const data = await apiRes.json();
  const reply = data?.choices?.[0]?.message?.content?.trim() || "No response";

  // Save reply + limit to last 20 messages
  history.push({ role: "assistant", content: reply });
  await kv.set(userId, history.slice(-20), { ex: 86400 }); // expire after 1 day

  res.status(200).json({ reply });
}
