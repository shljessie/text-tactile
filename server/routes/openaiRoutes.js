const express = require("express");
const OpenAI = require("openai");
const router = express.Router();
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_API_KEY, 
});

// 🎨 **1. Generate Image (DALL-E)**
router.post("/generate-image", async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        res.json({ url: response.data[0]?.url });
    } catch (error) {
        console.error("[API] Error generating image:", error);
        res.status(500).json({ error: "Image generation failed" });
    }
});

// 📝 **2. Describe Image**
router.post("/describe-image", async (req, res) => {
    try {
        const { imageURL, question } = req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: question },
                        { type: "image_url", image_url: { url: imageURL } }
                    ]
                }
            ],
            max_tokens: 300
        });

        res.json({ description: response.choices[0].message.content });
    } catch (error) {
        console.error("[API] Error describing image:", error);
        res.status(500).json({ error: "Failed to describe image" });
    }
});

// 🌍 **3. Global Canvas Description**
router.post("/global-description", async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
        });

        res.json({ description: response.choices[0].message.content });
    } catch (error) {
        console.error("[API] Error generating global description:", error);
        res.status(500).json({ error: "Failed to generate description" });
    }
});

module.exports = router;
