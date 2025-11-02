import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { message } = await req.json();

    // Replace with your Groq API call or dummy response
    const reply = `URA: You said "${message}"`;

    return res.status(200).json({ response: reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
