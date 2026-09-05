import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { parse as csvParse } from 'csv-parse/sync';

// ---------- Helper: Extract text from various file types ----------
async function extractTextFromFile(dataBase64, mimeType, fileName) {
  // dataBase64 is a full data URL: "data:image/png;base64,xxxx"
  const base64Content = dataBase64.split(',')[1];
  const buffer = Buffer.from(base64Content, 'base64');

  // Text files
  if (mimeType?.startsWith('text/') || fileName?.endsWith('.txt') || fileName?.endsWith('.md')) {
    return buffer.toString('utf-8');
  }

  // PDF
  if (mimeType === 'application/pdf' || fileName?.endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (_) {
      return '[PDF could not be parsed]';
    }
  }

  // DOCX
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName?.endsWith('.docx')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (_) {
      return '[DOCX could not be parsed]';
    }
  }

  // CSV
  if (mimeType === 'text/csv' || fileName?.endsWith('.csv')) {
    try {
      const text = buffer.toString('utf-8');
      const records = csvParse(text, { columns: true, skip_empty_lines: true });
      const rows = records.slice(0, 100);
      const headers = Object.keys(rows[0] || {});
      let out = `CSV with ${records.length} rows. Columns: ${headers.join(', ')}\n\n`;
      out += rows.map(r => JSON.stringify(r)).join('\n');
      if (records.length > 100) out += `\n... and ${records.length - 100} more rows.`;
      return out;
    } catch (_) {
      return '[CSV could not be parsed]';
    }
  }

  // JSON
  if (mimeType === 'application/json' || fileName?.endsWith('.json')) {
    try {
      const text = buffer.toString('utf-8');
      const obj = JSON.parse(text);
      return JSON.stringify(obj, null, 2).slice(0, 5000); // truncate
    } catch (_) {
      return '[JSON could not be parsed]';
    }
  }

  // Fallback – just tell the AI the file name and type
  return `[Attached file: ${fileName || 'file'} (${mimeType || 'unknown type'})]`;
}

// ---------- Main API handler ----------
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  try {
    const { message, file } = req.body;
    let userContent = message?.trim() || '';

    // Variables for image attachment
    let imageData = null;
    let imageType = null;

    // ---------- Process file (if any) ----------
    if (file && file.data) {
      const { name, type, data } = file;

      if (type?.startsWith('image/')) {
        // Store for later multi-modal message
        imageData = data;
        imageType = type;
        // Keep the userContent as is, but we'll add a note if needed
      } else {
        // Non‑image: extract text and append to user content
        const extracted = await extractTextFromFile(data, type, name);
        if (extracted && !extracted.startsWith('[Attached file')) {
          userContent += `\n\n--- Content of attached file (${name}) ---\n${extracted.slice(0, 8000)}\n--- End of file ---`;
        } else {
          userContent += `\n\n${extracted}`;
        }
      }
    }

    // ---------- Build the messages array ----------
    const messages = [];
    messages.push({
      role: 'system',
      content: 'You are a helpful AI assistant. Answer concisely and accurately.'
    });

    // User message (might be multi‑modal if image)
    let userMessageContent = userContent || 'Hello!';

    if (imageData) {
      // Multi‑modal: text + image
      userMessageContent = [
        { type: 'text', text: userContent || 'What do you see in this image?' },
        { type: 'image_url', image_url: { url: imageData } } // imageData is a data URL
      ];
    }

    messages.push({
      role: 'user',
      content: userMessageContent
    });

    // ---------- Prepare the request to OpenAI ----------
    // Use gpt-4o-mini (fast, vision‑capable)
    const model = 'gpt-4o-mini';

    const requestBody = {
      model: model,
      messages: messages,
      stream: true,               // enable streaming
      max_tokens: 1000,
      temperature: 0.7,
    };

    // ---------- Send request and stream back ----------
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('OpenAI error:', errData);
      res.write(`data: ${JSON.stringify({ error: errData?.error?.message || 'AI request failed' })}\n\n`);
      res.end();
      return;
    }

    // Pipe the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            return;
          }
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          } catch (_) {
            // ignore parse errors
          }
        }
      }
    }

    // Final flush
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Server error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Something went wrong' })}\n\n`);
    res.end();
  }
    }
