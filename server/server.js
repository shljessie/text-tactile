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

// ✅ Resolve and log the absolute path of the build directory
const buildPath = path.resolve(__dirname, '../build');
const indexPath = path.join(buildPath, 'index.html');

console.log("🚀 Serving static files from:", buildPath);
console.log("📄 Checking for index.html:", indexPath);

// ✅ Check if build/index.html exists when starting the server
if (!fs.existsSync(buildPath)) {
    console.error("❌ ERROR: Build directory does not exist:", buildPath);
} else if (!fs.existsSync(indexPath)) {
    console.error("❌ ERROR: index.html NOT FOUND in build directory!");
} else {
    console.log("✅ index.html FOUND at", indexPath);
}

// ✅ Serve static files from build directory
app.use(express.static(buildPath));

// ✅ Handle all unknown routes by serving index.html (if it exists)
app.get('*', (req, res) => {
    if (!fs.existsSync(indexPath)) {
        console.error("❌ ERROR: index.html is missing when serving a request.");
        return res.status(500).send("❌ ERROR: index.html not found on the server");
    }
    res.sendFile(indexPath);
});

app.use(express.json());

const corsOptions = {
    origin: ['http://localhost:3000', 'https://altcanvas.art', 'http://localhost:3001'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ Debug log to confirm server is running
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});

// ✅ Additional API Routes
app.post('/sonic', (req, res) => {
    const uuid = req.body.uuid;
    console.log('Received UUID:', uuid);
    res.status(200).json({ status: 'success', message: 'UUID received successfully', receivedUuid: uuid });
});

const imagesDir = path.join(__dirname, 'public', 'images');
app.use('/images', express.static(imagesDir));

app.post('/remove-background', async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error parsing form data');
        }

        const image_url = fields.image_url;
        const formData = new FormData();
        formData.append("image_url", image_url[0]);
        formData.append("get_file", "1");

        try {
            const response = await axios.post('https://api.removal.ai/3.0/remove', formData, {
                headers: {
                    ...formData.getHeaders(),
                    "Rm-Token": process.env.REMOVAL_AI_API_KEY
                },
                responseType: 'arraybuffer'
            });

            const imageName = `processed-${Date.now()}.png`;
            const imagePath = path.join(imagesDir, imageName);
            fs.writeFileSync(imagePath, response.data);

            const imageUrl = `${req.protocol}://${req.get('host')}/images/${imageName}`;
            res.json({ imageUrl });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error processing image');
        }
    });
});
