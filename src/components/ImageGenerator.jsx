import { Configuration, OpenAIApi } from 'openai';
import React, { useState } from 'react';

import { MoonLoader } from 'react-spinners';

export const ImageGenerator = () => {
  const configuration = new Configuration({
    apiKey: process.env.REACT_APP_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const [data, setData] = useState({
    prompt: "",
  });
  const { prompt } = data;

  const [imageURL, setImageURL] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const generateImage = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await openai.createImage({
        prompt: prompt,
        n: 1,
      });
      setImageURL(response.data.data[0].url);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const genDesc = async (imageURL) => {
    console.log("dd",imageURL)
    const  apiKey =  process.env.REACT_APP_API_KEY
    setDescriptionLoading(true);
    const customPrompt = `
    You are describing an image to a Visually Impaired Person. 
    Generate the given image description according to the following criteria: 

    Original Description: Briefly describe the primary subject or focus of the image.

    Composition of Items in the Image: Describe the location of the main items in the image only use words center, top left, right side.

    ex) 
    It is am image of a dog. The dog is in the top right.
  `;


    const payload = {
        "model": "gpt-4-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": customPrompt},
                    {"type": "image_url", "image_url": {"url":imageURL }}
                ]
            }
        ],
        "max_tokens": 300
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify(payload)
          });
    console.log('Response Caption', response)
    
    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      const caption = data.choices[0].message.content;
      console.log('Image Caption:', caption);
      setDescriptionLoading(false);
      setImageDescription(caption); 
    } else {
      setDescriptionLoading(false);
      console.error('Failed to generate description:', data);
      setImageDescription("Could not generate description."); 
    }

    return (
        <div id='imageGeneration'>
          {/* Your form and image display code */}
          <p>{imageDescription}</p> {/* This should update when imageDescription state changes */}
        </div>
      );
  }

  return (
    <div id='imageGeneration'>
      <form id='controllers' onSubmit={generateImage}>
        <div className='header'>
          <h3>Image Generator</h3>
        </div>
        <input 
          type="text" 
          name='prompt'
          placeholder='e.g: a cat holding a mic and singing'
          value={prompt}
          onChange={handleChange}
          required
        />
        <button type='submit'>Generate Image</button>
      </form>
      <div className='image--container'>
        {loading ? <MoonLoader /> 
        : 
        <div>
          <img src={imageURL} alt="Generated Content" width="300" height="300" />
          <button type='button' value={imageURL} onClick={() => genDesc(imageURL)}>Generate Description</button>
        </div>
        }
      </div>
      <p style={{ textAlign: 'center', width: "40vw" }}>
        {descriptionLoading ? <MoonLoader size={30} /> : imageDescription}
      </p>
    </div>
  );
};
