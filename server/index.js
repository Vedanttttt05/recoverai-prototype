const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

const symptomLog = [];

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'RecoverAI API',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});
app.post('/analyze', async (req, res) => {
  const { transcript, history, patient } = req.body;  // patient comes from frontend now

  symptomLog.push({ patient: patient.name, text: transcript, time: new Date() });

const systemPrompt = `You are RecoverAI, an intelligent post-discharge care companion for ${patient.name}.

PATIENT PROFILE:
- Name: ${patient.name}
- Surgery: ${patient.surgery}
- Recovery day: ${patient.day}
- Current medications: ${patient.meds.length > 0 ? patient.meds.join(', ') : 'none provided'}

YOUR ROLE:
- Monitor symptoms and provide guidance based on the patient's specific surgery and recovery stage
- Give advice appropriate for day ${patient.day} of recovery — expectations differ on day 1 vs day 10
- Reference the patient's medications when relevant (e.g. if they report pain, remind them of their prescribed painkiller)
- Always address the patient by name (${patient.name}) to keep it personal

RESPONSE RULES:
- Keep responses to 2-3 sentences max — patient may be tired or in discomfort
- Never diagnose — guide and reassure instead
- If the patient mentions a symptom, always ask one follow-up question to understand severity
- If the conversation has context from earlier, reference it naturally ("Earlier you mentioned dizziness...")

ALERT PROTOCOL:
If the patient reports ANY of these, start your reply with ALERT: and urge them to contact their doctor or go to emergency immediately:
- Chest pain or difficulty breathing
- Fever above 38.5°C / 101.3°F
- Heavy or uncontrolled bleeding
- Sudden severe swelling
- Signs of infection (pus, extreme redness, foul smell from wound)
- Inability to keep fluids down for more than 6 hours
- Sudden vision changes or severe headache

TONE:
- Warm, calm, and reassuring — like a knowledgeable friend, not a robot
- Never dismissive — every concern is valid
- Avoid medical jargon unless necessary`;

  try {
    const cleanHistory = (history || []).filter(
      entry => entry.role && entry.parts && entry.parts[0]?.text?.trim()
    );

    const chat = model.startChat({
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      history: cleanHistory
    });

    const result = await chat.sendMessage(transcript);
    const reply = result.response.text();

    symptomLog[symptomLog.length - 1].aiReply = reply;

    res.json({
      reply,
      isAlert: reply.startsWith('ALERT:'),
    });

  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: 'Gemini API failed' });
  }
});

app.listen(3001, () => console.log('Server running on :3001'));