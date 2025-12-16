const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Keys (environment variables'dan)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Available models
const FREE_MODELS = [
    'openai/gpt-4.1-mini',
    'google/gemma-3-1b-it:free',
    'google/gemma-3-4b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'mistralai/mistral-7b-instruct:free'
];

let currentModelIndex = 0;

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'AI Film Öneri Backend is running!' });
});

// AI Recommendation endpoint
app.post('/api/recommend', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt gerekli' });
        }

        if (!OPENROUTER_API_KEY) {
            return res.status(500).json({ error: 'API key yapılandırılmamış' });
        }

        let response = null;
        let lastError = null;

        // Try different models
        for (let i = 0; i < FREE_MODELS.length; i++) {
            const modelIndex = (currentModelIndex + i) % FREE_MODELS.length;
            const model = FREE_MODELS[modelIndex];

            try {
                response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'https://ai-film-oneri.onrender.com',
                        'X-Title': 'AI Film Öneri'
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 4096,
                        temperature: 0.7
                    })
                });

                if (response.ok) {
                    currentModelIndex = modelIndex;
                    const data = await response.json();
                    return res.json(data);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    lastError = errorData.error?.message || `API Hatası: ${response.status}`;
                    console.log(`Model ${model} failed:`, lastError);
                }
            } catch (e) {
                lastError = e.message;
                console.log(`Model ${model} error:`, e.message);
            }
        }

        res.status(500).json({ error: lastError || 'Tüm modeller başarısız oldu' });

    } catch (error) {
        console.error('Recommend error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Translation endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLang = 'tr', type = 'general' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Çevrilecek metin gerekli' });
        }

        if (!OPENROUTER_API_KEY) {
            return res.status(500).json({ error: 'API key yapılandırılmamış' });
        }

        let translatePrompt;
        if (type === 'overview') {
            translatePrompt = `Translate the following movie/TV show description to Turkish. Keep it natural and fluent. Only return the translation, nothing else.

Description:
${text}`;
        } else {
            translatePrompt = `Translate the following text to Turkish. Only return the translation, nothing else. Do not add any explanations or notes.

Text to translate:
${text}`;
        }

        let response = null;
        let lastError = null;

        for (let i = 0; i < FREE_MODELS.length; i++) {
            const modelIndex = (currentModelIndex + i) % FREE_MODELS.length;
            const model = FREE_MODELS[modelIndex];

            try {
                response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'https://ai-film-oneri.onrender.com',
                        'X-Title': 'AI Film Öneri'
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: 'user', content: translatePrompt }],
                        max_tokens: 2048,
                        temperature: 0.3
                    })
                });

                if (response.ok) {
                    currentModelIndex = modelIndex;
                    const data = await response.json();
                    const translatedText = data.choices?.[0]?.message?.content || '';
                    return res.json({ translation: translatedText.trim() });
                }
            } catch (e) {
                lastError = e.message;
            }
        }

        res.status(500).json({ error: lastError || 'Çeviri başarısız oldu' });

    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// TMDB Proxy endpoint
app.get('/api/tmdb/*', async (req, res) => {
    try {
        if (!TMDB_API_KEY) {
            return res.status(500).json({ error: 'TMDB API key yapılandırılmamış' });
        }

        // Get the path after /api/tmdb/
        const tmdbPath = req.params[0];
        const queryString = new URLSearchParams(req.query).toString();
        
        const tmdbUrl = `https://api.themoviedb.org/3/${tmdbPath}?api_key=${TMDB_API_KEY}&${queryString}`;

        const response = await fetch(tmdbUrl);
        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error('TMDB error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🎬 Server running on port ${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   POST /api/recommend - AI önerileri`);
    console.log(`   GET  /api/tmdb/*    - TMDB proxy`);
});
