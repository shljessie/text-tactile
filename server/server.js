const express = require('express');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const formidable = require('formidable');
const cors = require('cors');
const app = express();
const os = require('os');

const PORT = process.env.PORT || 3001;

let logFile = path.join(__dirname, 'public', 'logs', 'default-log.json');

const apipath = require('path');
require('dotenv').config({ path: apipath.join(__dirname, '../.env') });


app.use(express.json());

const corsOptions = {
  origin: ['https://main.d3onukrw5z0iwo.amplifyapp.com', 'http://main.d3onukrw5z0iwo.amplifyapp.com', 'http://localhost:3000', 'https://localhost:3000'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable CORS for all resources

// ✅ Serve React frontend from the build folder
app.use(express.static(path.join(__dirname, '../build')));

app.post('/sonic', (req, res) => {
  const uuid = req.body.uuid;
  console.log('Received UUID:', uuid);

  // Respond back to the client
  res.status(200).json({ status: 'success', message: 'UUID received successfully', receivedUuid: uuid });

  // Log the UUID to a file with a timestamp
  const timestamp = getFormattedTimestamp();
  const logDir = path.join(__dirname, 'public', 'logs');
  fs.mkdirSync(logDir, { recursive: true }); // Ensure the log directory exists

  // Create a file name based on UUID only (not timestamp, to avoid duplication)
  logFile = path.join(logDir, `UUID_${uuid}.json`);

  // Check if the log file already exists
  if (!fs.existsSync(logFile)) {
    console.log('Log file created:', logFile);
  } else {
    console.log('Log file already exists for UUID:', uuid);
  }
});

// Function to log data to a file asynchronously
function logData(message) {
  const time = getFormattedTimestamp(); // Use the formatted timestamp
  const logEntry = { message };
  fs.appendFile(logFile, JSON.stringify(logEntry) + ',\n', 'utf8', (err) => {
    if (err) console.error('Error appending to log file:', err);
  });
}


function getFormattedTimestamp() {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${month}.${day}_${hours}:${minutes}:${seconds}`;
}

// // Set up the log directory and file
// const logDir = path.join(__dirname, 'public', 'logs');
// fs.mkdirSync(logDir, { recursive: true }); 
// const timestamp = getFormattedTimestamp();
// const logFile = path.join(logDir, `UUID:${uuid}_Time:${timestamp}.json`);

// API to receive log data
app.post('/log-data', (req, res) => {
  logData(req.body);
  res.status(200).json({ status: 'success', message: 'Data logged successfully' });
});

const imagesDir = path.join(__dirname, 'public', 'images');
app.use(cors({
  origin: ['http://localhost:3000','https://altcanvas.art']
}));

app.use('/images', express.static(imagesDir));

app.post('/remove-background', async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error parsing form data');
        }

        // console.log('Fields:', fields); // Check what's inside fields
        const image_url = fields.image_url;
    
        const formData = new FormData();
        // console.log('Appending image_url:', image_url[0]); // Verify the type and value
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

            // Generate a unique file name
            const imageName = `processed-${Date.now()}.png`;
            const imagePath = path.join(imagesDir, imageName);

            // Save the image data to a file
            fs.writeFileSync(imagePath, response.data);

            // Generate URL to access the image
            const imageUrl = `${req.protocol}://${req.get('host')}/images/${imageName}`;
            res.json({ imageUrl });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error processing image');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});