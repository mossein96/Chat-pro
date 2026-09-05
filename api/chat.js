export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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

    const {
      message,
      fileData,
      fileType,
      fileName
    } = req.body;

    const content = [];

    // Add text message
    if (message && message.trim()) {

      content.push({
        type: "input_text",
        text: message.trim()
      });

    }

    // Add image correctly
    if (
      fileData &&
      fileType &&
      fileType.startsWith("image/")
    ) {

      content.push({
        type: "input_image",
        image_url: fileData
      });

    }

    if (content.length === 0) {

      return res.status(400).json({
        error: "Please enter a message or attach an image"
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

          model: "gpt-5.6-luna",

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

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "AI request failed"
      });

    }

    let reply = data.output_text;

    if (!reply) {

      reply =
        data.output
          ?.flatMap(item =>
            item.content || []
          )
          ?.filter(item =>
            item.type === "output_text"
          )
          ?.map(item =>
            item.text || ""
          )
          ?.join("")
          ?.trim();

    }

    return res.status(200).json({
      reply:
        reply ||
        "Sorry, I could not generate a reply."
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
