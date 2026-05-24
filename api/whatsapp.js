import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // POST handles incoming webhooks from Twilio/WhatsApp
  if (req.method === 'POST') {
    let body = '';
    let from = '';

    // Twilio sends data as application/x-www-form-urlencoded
    if (req.body && req.body.Body) {
      body = req.body.Body.trim();
      from = req.body.From.trim(); // e.g. "whatsapp:+919876543210" or "whatsapp:+14155238886"
    } else {
      // Standard JSON fallback
      body = (req.body.body || req.body.Body || '').trim();
      from = (req.body.from || req.body.From || '').trim();
    }

    if (!body || !from) {
      return res.status(400).send('Error: Missing message body or sender (From).');
    }

    // Parse natural language: pain score (first digit 0-10)
    const numMatch = body.match(/\b([0-9]|10)\b/);
    const painLevel = numMatch ? parseInt(numMatch[1], 10) : 5;

    // Clean notes (remove pain digit)
    let notes = body.replace(/\b([0-9]|10)\b/, '').trim();
    notes = notes.replace(/^[\s,]+/, '').replace(/[\s,]+$/, '') || "Logged ambiently via WhatsApp Bot.";

    // Parse tags matching custom tags (simulate matching)
    // Twilio Webhooks won't have direct access to localStorage. 
    // We tag it as a WhatsApp log, and the client-side PWA will map any custom tags on sync!
    const logEntry = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString().slice(0, 10),
      painLevel,
      fatigueLevel: Math.min(10, Math.max(0, painLevel + (Math.random() > 0.5 ? 1 : -1))),
      mood: painLevel >= 7 ? "Anxious" : (painLevel <= 3 ? "Joyful" : "Neutral"),
      painLocations: [],
      tags: ["WhatsApp Log"],
      notes: notes,
      rawText: body // Pass original text so PWA can match custom tags on client side
    };

    let dbStatusNote = "";
    // Save to Vercel KV database under the sender's phone key
    try {
      const key = `hithaflow_wa_logs:${from}`;
      let logs = await kv.get(key);
      if (!Array.isArray(logs)) logs = [];
      logs.push(logEntry);
      await kv.set(key, logs);
    } catch (e) {
      console.warn("KV storage is not yet connected/configured on Vercel. Log saved to function console.", logEntry);
      dbStatusNote = "\n\n⚠️ *Warning*: Vercel KV database is not linked. This log could not be saved to your dashboard.";
    }

    // Respond with a structured TwiML XML reply for Twilio WhatsApp
    res.setHeader('Content-Type', 'text/xml');
    const xmlResponse = `
      <Response>
        <Message>🌟 *HithaFlow Logged!* \nPain Level: ${painLevel}/10 \nNotes: "${notes}"${dbStatusNote}\n\nNext time you open HithaFlow, this will automatically merge into your timeline!</Message>
      </Response>
    `;
    return res.status(200).send(xmlResponse.trim());
  }

  // GET retrieves pending logs for the client-side app
  if (req.method === 'GET') {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Missing phone query parameter.' });
    }

    // Clean phone key (ensure it starts with whatsapp: if needed)
    let phoneKey = phone.trim();
    if (!phoneKey.startsWith('whatsapp:')) {
      // Allow clean numeric numbers or format them
      if (!phoneKey.startsWith('+')) {
        phoneKey = '+' + phoneKey;
      }
      phoneKey = 'whatsapp:' + phoneKey;
    }

    try {
      const key = `hithaflow_wa_logs:${phoneKey}`;
      const logs = await kv.get(key);
      if (Array.isArray(logs) && logs.length > 0) {
        // Clear retrieved logs to avoid double logging
        await kv.del(key);
        return res.status(200).json({ logs });
      }
    } catch (e) {
      console.error("KV read error (Make sure Vercel KV integration is linked):", e);
    }

    return res.status(200).json({ logs: [] });
  }

  return res.status(405).send('Method Not Allowed');
}
