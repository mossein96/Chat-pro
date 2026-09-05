export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured"
    });
  }

  try {
    const message = req.body?.message || "";

    const file = req.body?.file || null;

    if (!message.trim() && !file) {
      return res.status(400).json({
        error: "Please enter a message or attach a file"
      });
    }

    const content = [];

    if (message.trim()) {
      content.push({
        type: "input_text",
        text: message.trim()
      });
    }

    if (file) {
      if (!file.data || !file.name) {
        return res.status(400).json({
          error: "Invalid file"
        });
      }

      content.push({
        type: "input_file",
        filename: file.name,
        file_data: file.data
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5",
          input: [
            {
              role: "user",
              content: content
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res
        .status(response.status)
        .json({
          error:
            data?.error?.message ||
            "OpenAI API request failed"
        });
    }

    let reply = data.output_text;

    if (!reply) {
      reply =
        data.output
          ?.flatMap(
            item => item.content || []
          )
          ?.filter(
            item =>
              item.type === "output_text"
          )
          ?.map(
            item => item.text || ""
          )
          ?.join("")
          ?.trim();
    }

    if (!reply) {
      reply =
        "Sorry, I could not generate a reply.";
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error:
        error.message ||
        "Something went wrong"
    });
  }
}
