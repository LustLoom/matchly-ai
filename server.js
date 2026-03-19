import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        const systemPrompt = `
            Identify 5 real YouTube creators for: "${query}".
            Return RAW JSON: {"creators": [{"name": "Name", "handle": "@handle", "niche": "Category", "subscribers": "1M+", "matchScore": 95, "reason": "Why", "strengths": ["Tag1", "Tag2", "Tag3"]}]}
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, "").trim();
        res.json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ error: "Discovery engine capacity reached." });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
