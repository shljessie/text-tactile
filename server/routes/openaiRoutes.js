const express = require("express");
const OpenAI = require("openai");
const router = express.Router();
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_API_KEY, 
});

// 🎨 **1. Generate Image (DALL-E)**
router.post("/generate-image", async (req, res) => {
    console.log("=== Image Generation Request Started ===");
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    
    try {
        const { prompt, model, size, quality, background, n } = req.body;

        if (!prompt) {
            console.error("No prompt provided in request");
            return res.status(400).json({ error: "Prompt is required" });
        }

        const requestParams = {
            model: model || "gpt-image-1",
            prompt,
            size: size || "1024x1024",
            quality: quality || "medium",
            background: background || "transparent",
            n: n || 1
        };
        
        console.log("Sending request to OpenAI with parameters:", requestParams);

        const response = await openai.images.generate(requestParams);
        
        console.log("OpenAI response received:", {
            status: response.status,
            data: response.data
        });

        if (!response.data || !response.data[0]) {
            console.error("Invalid response from OpenAI:", response);
            return res.status(500).json({ error: "Invalid response from OpenAI" });
        }

        console.log("=== Image Generation Request Completed Successfully ===");
        res.json({ data: response.data });
    } catch (error) {
        console.error("=== Image Generation Request Failed ===");
        console.error("Error details:", {
            message: error.message,
            status: error.status,
            response: error.response?.data,
            stack: error.stack
        });
        
        res.status(500).json({ 
            error: "Image generation failed",
            details: error.message,
            response: error.response?.data
        });
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

// Add a new endpoint to generate the image title
router.post("/generate-image-name", async (req, res) => {
    try {
        const { imageURL } = req.body;
        const customPrompt = `
          Generate a title for this image in minimal words.
          Example: dog
        `;
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: customPrompt },
                        { type: "image_url", image_url: { url: imageURL } }
                    ]
                }
            ],
            max_tokens: 50
        });
        res.json({ title: response.choices[0].message.content });
    } catch (error) {
        console.error("[API] Error generating image title:", error);
        res.status(500).json({ error: "Failed to generate image title" });
    }
});


module.exports = router;
