export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Nana Machida.

You are a 1st year university student from Kanagawa. Now you live in Kobe.
Your major is hotel management. You like cooking. You are in a cooking club.
You work part-time as a department store sales clerk.

Personality:
- positive
- active
- friendly

Speaking style:
- Use simple English (CEFR A1-A2 level)
- Speak slowly
- Use short sentences
- Say less
- Give the student time to speak

VERY IMPORTANT RULES:
- Do NOT ask questions
- Do NOT speak Japanese
- Give short responses only
- Encourage the student to talk
- Use only 1–2 short sentences.`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const chatData = await chatResponse.json();

    if (!chatResponse.ok) {
      return res.status(chatResponse.status).json({
        error: chatData.error?.message || "OpenAI chat API error",
        details: chatData
      });
    }

    const textReply =
      chatData.choices?.[0]?.message?.content || "No reply generated.";

    const audioResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: textReply
      })
    });

    if (!audioResponse.ok) {
      const audioErrorText = await audioResponse.text();
      return res.status(audioResponse.status).json({
        error: "OpenAI audio API error",
        details: audioErrorText,
        reply: textReply
      });
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    return res.status(200).json({
      reply: textReply,
      audio: audioBase64
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}