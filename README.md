# AltCanvas

AltCanvas is a tile-based image editor designed for blind and visually impaired users. It allows users to generate, manipulate, and interact with images using voice commands and keyboard shortcuts.

![AltCanvas](AltCanvas.png)

You can read the paper for this code here `https://arxiv.org/abs/2408.10240` (ASSETS 2024)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Chrome or Edge browser (for speech recognition support)
- Microphone access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/textTactile.git
cd textTactile
```

2. Install dependencies for both frontend and server:
```bash
# Install frontend dependencies
npm install
cd server && npm install
```

### Running the Application

1. Start the server:
```bash
cd server && npm start
```
The server will run on http://localhost:3001

2. Start the frontend development server (in another terminal):
```bash
npm run frontend
```
The frontend will run on http://localhost:3000

### Production Mode

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Testing Speech Recognition

1. Make sure you're using Chrome or Edge browser
2. Allow microphone access when prompted
3. If you get a "not-allowed" error:
   - Click the lock icon in the address bar
   - Go to Site Settings
   - Find "Microphone" and set it to "Allow"
   - Refresh the page

## Debugging

### Server Issues
- Check if the server is running on port 3001
- Look for error messages in the server terminal
- Ensure all environment variables are set correctly

### Frontend Issues
- Check the browser console for errors
- Verify that the frontend is running on port 3000
- Make sure the proxy setting in package.json points to the correct server URL

### Speech Recognition Issues
1. Check browser compatibility:
   - Use Chrome or Edge
   - Make sure you're on the latest version
2. Check microphone permissions:
   - Click the lock icon in the address bar
   - Verify microphone access is allowed
3. Check microphone hardware:
   - Ensure your microphone is properly connected
   - Test it in another application
4. If using localhost:
   - Make sure you're using http://localhost:3000
   - The speech recognition should work without HTTPS on localhost

## API Keys

Set these in your `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

## Contact

For direct access to the project, please contact:
- Seonghee Lee (seonghee.lee@colorado.edu)



