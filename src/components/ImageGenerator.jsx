import { Configuration, OpenAIApi } from 'openai';
import React, { useEffect, useState } from 'react';

import ClickableNounsCaption from './ClickableNouns';
import { MoonLoader } from 'react-spinners';
import Nav from './Nav';
import TestSoundButtons from './TestSoundButtons';
import { useNavigate } from 'react-router-dom';

export const ImageGenerator = () => {
  var ner = require( 'wink-ner' );
  var myNER = ner();
  var winkTokenizer = require( 'wink-tokenizer' );
  var tokenize = winkTokenizer().tokenize;
  var posTagger = require( 'wink-pos-tagger' );
  var tagger = posTagger();
  let navigate = useNavigate();

  const navigateToNextPage = () => {
    if (selectedIndex === null) {
      alert("Please select an image first.");
      return;
    }
    const selectedImageURL = images[selectedIndex];
    
    console.log('sending',selectedImageURL )
    navigate('/assets', { state: { imageURL: selectedImageURL } });
  };

  const imageGridStyle = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    alignItems: 'center',
    overflowX: 'auto',
    padding: '10px'
  };

  const loaderContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '30vh', 
  };
  
  
  
  const configuration = new Configuration({
    apiKey: process.env.REACT_APP_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const [data, setData] = useState({
    prompt: "",
    n: 1, 
  });
  const { prompt } = data;

  const [images, setImages] = useState(JSON.parse(sessionStorage.getItem('images')) || []);
  const [imageURL, setImageURL] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [caption, setCaption] = useState(""); // Store the plain text description
  const [taggedDescription, setTaggedDescription] = useState([]); 
  const [selectedImageURL, setSelectedImageURL] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [promptText, setPromptText] = useState(() => sessionStorage.getItem('prompt') || '');


  console.log('Navigating Back', images, promptText);


  const updateImages = (newImages) => {
    setImages(newImages);
    sessionStorage.setItem('images', JSON.stringify(newImages));
  };
  
  const updatePrompt = (newPrompt) => {
    setPromptText(newPrompt);
    sessionStorage.setItem('prompt', newPrompt);
  };
  

  useEffect(() => {
    sessionStorage.setItem('images', JSON.stringify(images));
  }, [images]);

  useEffect(() => {
    sessionStorage.setItem('prompt', promptText);
  }, [promptText]);
  

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case "ArrowRight":
          setSelectedIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
          break;
        case "ArrowLeft":
          setSelectedIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
          break;
        case "Enter":
          if (selectedIndex !== null) genDesc(images[selectedIndex]);
          break;
        default:
          break;
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [images.length, selectedIndex]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'prompt') {
      setPromptText(value); 
      sessionStorage.setItem('prompt', value); 
    } else {
      setData(prevData => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const generateImage = async (e) => {

    e.preventDefault();
    setLoading(true);
    try {
      
      const defaultPrompt = `
      Create a : \n`

      console.log('PRompts : ', defaultPrompt + promptText)
      console.log('Number:', data.n)
      const response = await openai.createImage({
        prompt: defaultPrompt + promptText,
        n: 1,
      });
      
      setImages(response.data.data.map(img => img.url));
      setPromptText(promptText)
      setImages(response.data.data.map(img => img.url));
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

   const speakDescription = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  
  const startListening = () => {
    const speakButton = document.getElementById('speakButton');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();

      speakButton.classList.add('speaking');
  
      recognition.onresult = (event) => {
        const voiceText = event.results[0][0].transcript;
        setData({ ...data, prompt: voiceText });
  
        speakButton.classList.remove('speaking');
      };
  
      recognition.onerror = (event) => {
        speakButton.classList.remove('speaking');
        console.error('Speech recognition error', event.error);
      };
  
      recognition.onend = () => {
        speakButton.classList.remove('speaking');
      };
    } else {
      alert('Speech recognition not available. Please use a supported browser or enter the prompt manually.');
    }
  };
  
  const genDesc = async (imageURL) => {
    if (selectedIndex === null) {
        alert("Please select an image first.");
        return;
    }
    const selectedImageURL = images[selectedIndex];
    setDescriptionLoading(true);
    const apiKey = process.env.REACT_APP_API_KEY;
    const customPrompt = `
        You are describing an image to a Visually Impaired Person.
        Generate the given image description according to the following criteria:
        Briefly describe the primary subject or focus of the image in one sentence.
    `;

    const payload = {
        "model": "gpt-4-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    { "type": "text", "text": customPrompt },
                    { "type": "image_url", "image_url": { "url": imageURL } }
                ]
            }
        ],
        "max_tokens": 300
    };

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            const caption = data.choices[0].message.content;
            const tokens = tokenize(caption);
            const taggedTokens = tagger.tag(tokens);
            const highlightedCaption = taggedTokens.map(token => {
                if (token.pos === 'noun') {
                    return <span style={{ backgroundColor: 'yellow' }}>{token.value}</span>;
                }
                return token.value;
            });

            setCaption(caption);
            setTaggedDescription(highlightedCaption);
            setDescriptionLoading(false);
            speakDescription(caption);
        } else {
            setDescriptionLoading(false);
            console.error('Failed to generate description:', data);
        }
    } catch (error) {
        console.error('Error generating description:', error);
        setDescriptionLoading(false);
    }
};



  
  

  return (
    <div id='imageGeneration'>
    
    <div className='pageheader'>
          <h3>Step1 |  Generate an Image with Text</h3>
          <br/>
          <p>
          Give a Text or Speech Description of the Image you want to generate and press the Generate Image Button to Generate the Image. <br/>
          Click on the "Create Asset from Image" button to extract assets from the image. <br/>
          Click on the "Generate Description" button to generate a description of the selected image.
          </p>
    </div>

    <div className='mainContainer'>

      <h2> Image Generator </h2>
    
      <form id='controllers' onSubmit={generateImage}>

        <div className='input-row' style={{display: 'flex', alignItems: 'center', gap: '10px', width:'90%',marginLeft:'32%'}}>
        <div style={{ marginBottom: '20px', width: '40%' }}>
          <label htmlFor="imageDescription" style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '1rem', color:'#1E90FF' }}>
            Prompt:
          </label>
          <input
            type="text"
            name="prompt"
            placeholder="e.g: a cat holding a mic and singing"
            value={promptText} // Assuming promptText is your state variable
            onChange={handleChange} // Assuming handleChange is your event handler
            required
            style={{ width: '100%' }}
          />
        </div>
          <button type='button' id='speakButton' onClick={startListening}>Record</button>
          <button type='submit'>Generate Image</button>
        </div>
      </form>
      <div>
        {loading ? (
          <div style={loaderContainerStyle}>
            <MoonLoader />
          </div>
        ) : images ? (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width:'100%'}}>
            <div style={imageGridStyle}>
              {images.map((imageURL, index) => (
                <img
                  className='genImages'
                  key={index}
                  src={imageURL}
                  alt={`Generated Content ${index + 1}`}
                  width="250"
                  height="250"
                  tabIndex="0"
                  style={{ 
                    cursor: 'pointer', 
                  border: selectedIndex === index ? '15px solid royalblue' : 'none',
                  }}
                  onClick={() => {setSelectedIndex(index); setImageURL(imageURL); }}
                  onFocus={() => {setSelectedIndex(index); setImageURL(imageURL); }}
                />
              ))}
            </div>

            <button type='button' onClick={() => genDesc(imageURL)}>Generate Description</button>
            <p style={{ textAlign: 'center', width: "40vw" }}>
            <div className='description--container'>
            {descriptionLoading ?  <div style={loaderContainerStyle}>  <MoonLoader /> </div>
              : (caption && taggedDescription.length > 0) && 
                <ClickableNounsCaption caption={caption} taggedSentence={taggedDescription} imageURL={imageURL} />}
            </div>
            
            <button type='button' onClick={navigateToNextPage}>Create Asset from Image</button>
        </p>
          </div>
        ) : null}
      </div>

    </div>
    </div>
  );
};
