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

app.use(express.json());
// Allow requests from your Amplify frontend
app.use(cors({
  origin: ['https://main.d3onukrw5z0iwo.amplifyapp.com','http://main.d3onukrw5z0iwo.amplifyapp.com', 'http://localhost:3000']
}));


function getServerIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
      for (const alias of iface) {
          if (alias.family === 'IPv4' && !alias.internal) {
              return alias.address.replace(/\./g, '-');
          }
      }
  }
  return 'localhost';
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

// Set up the log directory and file
const logDir = path.join(__dirname, 'public', 'logs');
fs.mkdirSync(logDir, { recursive: true }); // Ensure the directory exists
const serverIP = getServerIP(); // Ensure you have a function to retrieve the server IP
const timestamp = getFormattedTimestamp();
const logFile = path.join(logDir, `IP:${serverIP}_Time:${timestamp}.json`);


// Function to log data to a file asynchronously
function logData(message) {
  const time = getFormattedTimestamp(); // Use the formatted timestamp
  const logEntry = { message };
  fs.appendFile(logFile, JSON.stringify(logEntry) + ',\n', 'utf8', (err) => {
    if (err) console.error('Error appending to log file:', err);
  });
}

app.post('/log-data', (req, res) => {
  const data = req.body;
  logData(data);
  res.status(200).json({ status: 'success', message: 'Data logged successfully' });
});

// Directory to save and serve images
const imagesDir = path.join(__dirname, 'public', 'images');
fs.mkdirSync(imagesDir, { recursive: true });


app.use(cors({
  origin: ['https://main.d3onukrw5z0iwo.amplifyapp.com','http://main.d3onukrw5z0iwo.amplifyapp.com', 'http://localhost:3000']
}));
app.use(express.static(path.join(__dirname, '../build')));
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
                    "Rm-Token": "4875dcc6-f255-4528-a564-3fa810c4c045"
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

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
