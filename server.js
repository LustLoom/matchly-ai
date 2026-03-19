import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialization
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves your index.html automatically

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// API Endpoint
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: "Search query is required." });
        }

        const systemPrompt = `
            You are a YouTube Influencer Discovery Specialist. 
            The user wants to find creators for this campaign/niche: "${query}".
            
            Identify 5 real or highly relevant YouTube creators. 
            Provide your response as a RAW JSON array of objects only. 
            Do not include Markdown formatting, code blocks, or any introductory text.
            
            Each object must contain:
            1. "name": The channel name.
            2. "handle": The @handle of the creator.
            3. "niche": The specific content category.
            4. "subscribers": Estimated reach (e.g., "500K+").
            5. "matchScore": A number between 85 and 99 representing brand alignment.
            6. "reason": A 1-sentence semantic explanation of why they fit the query.
            7. "strengths": An array of 3 short professional tags (e.g., ["High ROI", "Tech Savvy"]).
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        let text = response.text();

        // Clean AI response in case it includes markdown wrappers
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        const creators = JSON.parse(cleanedJson);

        res.json({ creators });
        
    } catch (error) {
        console.error("Discovery Error:", error);
        res.status(500).json({ 
            error: "The discovery engine encountered a semantic processing error. Please try again." 
        });
    }
});

// Handle SPA routing (redirects all non-API requests to index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Matchly Engine Active: http://localhost:${PORT}`);
});