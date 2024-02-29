import React, { useEffect, useState } from 'react';

const Asset = ({ imageUrl, prompt }) => {
  const [description, setDescription] = useState('');
  const [sizeDescription, setSizeDescription] = useState('');
  const [positionDescription, setPositionDescription] = useState('');
  const [descriptionLoading, setDescriptionLoading] = useState(true);

  const fetchDescription = async (imageURL, descriptionType) => {
    const apiKey = process.env.REACT_APP_API_KEY;
    let customPrompt;
    
    if (descriptionType === 'general') {
      customPrompt = `
        You are describing an image to a Visually Impaired Person.
        Generate the given image description according to the following criteria:
        Briefly describe the primary subject or focus of the image in one sentence.
      `;
    } else if (descriptionType === 'size') {
      customPrompt = `
        Describe the size of the primary subject in the image using only the words small, medium, or large.
        Only use one word. Choose from [small, medium, large]
      `;
    } else if (descriptionType === 'position') {
      customPrompt = `
        Describe the position of the primary subject in the image using only the words [bottom, top, center, left, right].
        Only use one word. Choose from [bottom, top, center, left, right]
      `;
    }

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

    try {
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
        // const sentence = tagger.tagSentence(caption);
        if (descriptionType === 'general') {
          setDescription(caption);
        } else if (descriptionType === 'size') {
          setSizeDescription(caption);
        } else if (descriptionType === 'position') {
          setPositionDescription(caption);
        }
      } else {
        console.error('Failed to generate description:', data);
      }
    } catch (error) {
      console.error('Error generating description:', error);
    }
  };

  useEffect(() => {
    if (imageUrl) {
      fetchDescription(imageUrl, 'general');
      fetchDescription(imageUrl, 'size');
      fetchDescription(imageUrl, 'position');
    }
  }, [imageUrl]);

  useEffect(() => {
    if (!descriptionLoading || sizeDescription || positionDescription) {
      setDescriptionLoading(false);
    }
  }, [description, sizeDescription, positionDescription]);

  return (
    <div style={{ margin: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Prompt: {prompt}</h3>
      <img src={imageUrl} alt="Generated" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
      {descriptionLoading ? <p>Loading description...</p> : (
        <div>
          <p>Description: {description}</p>
          <p>Size: {sizeDescription}</p>
          <p>Position: {positionDescription}</p>
        </div>
      )}
    </div>
  );
};

export default Asset;
