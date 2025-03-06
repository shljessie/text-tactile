const express = require('express');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const formidable = require('formidable');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Enable JSON Parsing for API Requests
app.use(express.json());

const openAIRoutes = require("./routes/openaiRoutes");

// CORS Settings (Allow Frontend Requests)
const corsOptions = {
    origin: ['http://altcanvas.art', 'https://altcanvas.art'],
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

app.use("/api/openai", openAIRoutes);

// Serve Static Files for API Responses (Images)
const imagesDir = path.join(__dirname, 'public', 'images');
app.use('/images', express.static(imagesDir));

// Remove Background API Route
app.post('/remove-background', async (req, res) => {
    console.log("Received /remove-background request");
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form data:", err);
        return res.status(500).json({ error: 'Error parsing form data' });
      }
  
      console.log("Parsed fields:", fields);
      const image_url = fields.image_url;
      console.log("Image URL received:", image_url);
  
      const formData = new FormData();
      formData.append("image_url", image_url);
      formData.append("get_file", "1");
      console.log("FormData prepared with image_url and get_file");
  
      try {
        console.log("Sending request to removal.ai...");
        const response = await axios.post('https://api.removal.ai/3.0/remove', formData, {
          headers: {
            ...formData.getHeaders(),
            "Rm-Token": process.env.REMOVAL_AI_API_KEY
          },
          responseType: 'arraybuffer'
        });
        console.log("Response received from removal.ai, status:", response.status);
  
        const imageName = `processed-${Date.now()}.png`;
        const imagePath = path.join(imagesDir, imageName);
        console.log("Image will be saved at:", imagePath);
  
        // Ensure the directory exists
        if (!fs.existsSync(imagesDir)) {
          console.log("Images directory not found. Creating:", imagesDir);
          fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        fs.writeFileSync(imagePath, response.data);
        console.log("Image saved successfully");
  
        const imageUrl = `${req.protocol}://${req.get('host')}/images/${imageName}`;
        console.log("Returning image URL:", imageUrl);
        res.json({ imageUrl });
      } catch (error) {
        console.error("Error processing image from removal.ai:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error processing image' });
      }
    });
  });
  
  

// Serve the Frontend (React)
// This assumes your React build output is in the ../build folder
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

// Fallback: send index.html for any other routes so React Router can handle them
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

// Start the Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express API is running on http://0.0.0.0:${PORT}`);
});
