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

// ✅ Enable JSON Parsing for API Requests
app.use(express.json());

// ✅ CORS Settings (Allow Frontend Requests)
const corsOptions = {
    origin: ['http://localhost:3000', 'https://altcanvas.art', 'http://localhost:3001'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ✅ API Routes (Handled by Express)
app.post('/sonic', (req, res) => {
    const uuid = req.body.uuid;
    console.log('📩 Received UUID:', uuid);
    res.status(200).json({ status: 'success', message: 'UUID received successfully', receivedUuid: uuid });
});

// ✅ Serve Static Files for API Responses (But NOT React)
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

// ✅ START THE SERVER (Only API Routes, No Frontend Serving)
app.listen(PORT, () => {
    console.log(`✅ Express API is running on port ${PORT}`);
});
