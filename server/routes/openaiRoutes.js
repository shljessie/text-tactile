const express = require("express");
const OpenAI = require("openai");
const router = express.Router();
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.REACT_APP_API_KEY, 
});

// 🎨 **1. Generate Image (GPT Image)**
router.post("/generate-image", async (req, res) => {
    console.log("=== Image Generation Request Started ===");
    console.log("Request body:", req.body);
    
    try {
        const { prompt } = req.body;

        if (!prompt) {
            console.error("No prompt provided in request");
            return res.status(400).json({ error: "Prompt is required" });
        }

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            // background: "transparent"
        });
        
        console.log("OpenAI response received:", {
            status: response.status,
            data: response.data
        });

        if (!response.data || !response.data[0]) {
            console.error("Invalid response from OpenAI:", response);
            return res.status(500).json({ error: "Invalid response from OpenAI" });
        }

        console.log("=== Image Generation Request Completed Successfully ===");
        res.json({ url: response.data[0].url });
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

// 📝 **2. Describe/AskQuestions Image or Canvas same endpoint**
router.post("/description", async (req, res) => {
    try {
        const { prompt, canvasImage } = req.body;
        
        console.log("=== Description Request Started ===");
        console.log("Request body:", { prompt, hasImage: !!canvasImage });
        
        // If we have a canvas image and prompt, use GPT-4 Vision
        if (canvasImage && prompt) {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: canvasImage } }
                        ]
                    }
                ],
                max_tokens: 500
            });

            console.log("=== Description Request Completed Successfully ===");
            res.json({ description: response.choices[0].message.content });
        } else {
            console.error("Missing required parameters");
            res.status(400).json({ error: "Both prompt and canvasImage are required" });
        }
    } catch (error) {
        console.error("=== Description Request Failed ===");
        console.error("Error details:", {
            message: error.message,
            status: error.status,
            response: error.response?.data,
            stack: error.stack
        });
        res.status(500).json({ 
            error: "Failed to generate description",
            details: error.message
        });
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