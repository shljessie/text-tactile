const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const formidable = require('formidable');
const cors = require('cors');
const Replicate = require('replicate');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const app = express();
const PORT = process.env.PORT || 3001;

// Enable JSON Parsing for API Requests
app.use(express.json());

const openAIRoutes = require("./routes/openaiRoutes");

// CORS Settings (Allow Frontend Requests)
const corsOptions = {
    origin: ['http://altcanvas.art', 'https://altcanvas.art', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// API Routes
app.get('/api/', (req, res) => {
    res.json({ status: 'success', message: 'API is working!' });
});

app.post('/api/sonic', (req, res) => {
    const uuid = req.body.uuid;
    console.log('📩 Received UUID:', uuid);
    res.status(200).json({ status: 'success', message: 'UUID received successfully', receivedUuid: uuid });
});

// Mount OpenAI routes BEFORE the static file serving
app.use("/api/openai", openAIRoutes);

// Use a writable directory on Heroku
const imagesDir = path.join('/tmp', 'images');
app.use('/images', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}, express.static(imagesDir));

// Add an image proxy endpoint to fix CORS issues with external images
app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  
  if (!imageUrl) {
    return res.status(400).json({ error: 'No image URL provided' });
  }
  
  console.log(`Proxying image from: ${imageUrl}`);
  
  try {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds timeout
    });
    
    const contentType = response.headers['content-type'];
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.header('Content-Type', contentType);
    
    res.send(response.data);
  } catch (error) {
    console.error(`Error proxying image from ${imageUrl}:`, error.message);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// Updated remove-background endpoint using Replicate's rembg model
app.post('/remove-background', async (req, res) => {
    console.log("Received /remove-background request");
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form data:", err);
        return res.status(500).json({ error: 'Error parsing form data' });
      }
  
      console.log("Parsed fields:", fields);
      let image_url = fields.image_url;
      if (Array.isArray(image_url)) {
        console.log("image_url is an array, using the first element");
        image_url = image_url[0];
      }
      console.log("Image URL received:", image_url);
  
      try {
        console.log("Sending request to replicate rembg...");
        const output = await replicate.run(
          "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
          {
            input: { image: image_url }
          }
        );
        console.log("Replicate output:", output);
  
        // Fetch the processed image data from the output URL
        const imageResponse = await axios.get(output, { responseType: 'arraybuffer' });
        console.log("Image response status:", imageResponse.status);
  
        const imageName = `processed-${Date.now()}.png`;
        const imagesDir = path.join('/tmp', 'images');
        const imagePath = path.join(imagesDir, imageName);
        console.log("Image will be saved at:", imagePath);
  
        if (!fs.existsSync(imagesDir)) {
          console.log("Images directory not found. Creating:", imagesDir);
          fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        fs.writeFileSync(imagePath, imageResponse.data);
        console.log("Image saved successfully");
  
        const imageUrl = `${req.protocol}://${req.get('host')}/images/${imageName}`;
        console.log("Returning image URL:", imageUrl);
        res.json({ imageUrl });
      } catch (error) {
        console.error("Error processing image with replicate:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error processing image' });
      }
    });
});

// Serve static files from the build directory
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

// Handle API routes first, then fall back to serving the React app
app.get('*', (req, res, next) => {
    // If the request is for an API route, let it pass through
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // Otherwise, serve the React app
    res.sendFile(path.join(buildPath, 'index.html'));
});

// Start the Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express API is running on http://0.0.0.0:${PORT}`);
});
