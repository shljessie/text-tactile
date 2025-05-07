# AltCanvas

AltCanvas : Speech2AI based Image Editor
Our system, AltCanvas, features a tile-based interface enabling users to construct visual scenes incrementally, with each tile representing an object within the scene. Users can add, edit, move, and arrange objects while receiving speech and audio feedback. Once completed, the scene can be rendered as a color illustration or as a vector for tactile graphic generation.
You can read the paper for this code here `https://arxiv.org/abs/2408.10240` (ASSETS 2024)

![AltCanvas](AltCanvas.png)

### API Keys 
A total of two API keys are required to run this.
The OpenAI API key and the Background Removal API key. 
If we are directly working with you on a project and you would like access please contact `shlee@cs.stanford.edu`.

Otherwise, you will have to provide the API keys on your own through 
OpenAI: https://platform.openai.com/docs/overview 
Background Removal: https://www.remove.bg/api 

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/shljessie/text-tactile.git
cd textTactile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Localhost Testing 

```
npm run build 
serve -s build
```

Recommened test through `http://localhost:3000`
CORS policies allowed for localhost testing is added in cors.json 


```
//cors.json 
[
  {
    "origin": ["http://localhost:3000", "http://0.0.0.0:3001"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

To configure them into Google Cloud Storage
```
gsutil cors set cors.json gs://altcanvas-storage
```

### Heroku Deployment (For those who want to host a separate website of AltCanvas

To deploy changes to Heroku:

1. Make sure your changes are committed to git:
```bash
git status
git add .
git commit -m "your commit message"
```

2. Push to Heroku:
```bash
git push heroku main
```

3. Verify the deployment:
```bash
# View real-time logs
heroku logs --tail

# Open Heroku dashboard
heroku open
```

4. If you need to set up Heroku remote:
```bash
heroku git:remote -a your-app-name
```

To check if your changes are deployed:
- Monitor the Heroku logs for deployment messages
- Check the Heroku dashboard for deployment status
- Verify the changes are live on your Heroku app URL

Remember that Heroku will automatically rebuild your application when you push changes to it. You can monitor the build process in the logs to ensure everything is working correctly.
