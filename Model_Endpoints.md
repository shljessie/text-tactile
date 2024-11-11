# Model Endpoint and AI Models

## Overview
AltCanvas uses a variety of AI models hosted on OpenAI’s API to generate image content based on user descriptions. The code includes a customizable setup to allow for different models, enabling experimentation and fine-tuning based on user needs or desired outputs.

## Model Endpoint
The main endpoint currently in use is OpenAI’s `gpt-4-vision-preview` model, which supports both image generation and description tasks.

### Endpoint Setup
In the code, the endpoint is configured within the `generateImage` and other related functions. To change or experiment with different models, locate the `createImage` and `createChatCompletion` calls within these functions. Here’s an example of the endpoint call setup:

```javascript
const response = await openai.createImage({
  prompt: `You are a children's COLORING BOOK GRAPHIC DESIGNER...`,
  n: 1,
});
