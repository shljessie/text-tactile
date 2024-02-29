import * as Tone from 'tone';

import React, { useEffect, useState } from 'react';

const ClickableNounsCaption = ({ caption, taggedSentence ,imageURL }) => {
  const [clickedNoun, setClickedNoun] = useState(null);
  const [specificCaption, setspecificCaption] = useState(""); 

  const [data, setData] = useState({
    prompt: "",
  });
  const { prompt } = data;
  
  const imageURLtwo= imageURL;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  const handleNounClick = (word) => {
    console.log(`Noun clicked: ${word}`);
    setClickedNoun(word);
  };

  const startListening = () => {
    const speakButton = document.getElementById('speakButton'); // Ensure your button has this ID
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();
  
      // Add the visual effect when speech recognition starts
      speakButton.classList.add('speaking');
  
      recognition.onresult = (event) => {
        const voiceText = event.results[0][0].transcript;
        setData({ ...data, prompt: voiceText });
  
        // Remove the visual effect when speech recognition ends
        speakButton.classList.remove('speaking');
      };
  
      recognition.onerror = (event) => {
        // Remove the visual effect if there's an error
        speakButton.classList.remove('speaking');
        console.error('Speech recognition error', event.error);
      };
  
      recognition.onend = () => {
        // Remove the visual effect when speech recognition ends
        speakButton.classList.remove('speaking');
      };
    } else {
      alert('Speech recognition not available. Please use a supported browser or enter the prompt manually.');
    }
  };
  

  


  const speakDescription = (text, callback) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      console.log('Speech synthesis finished.');
      if (typeof callback === 'function') {
        callback(); // Call the callback function once speech is done
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (specificCaption) {
      speakDescription(specificCaption, () => analyzeAndPlaySpatialSound(specificCaption));
    }
  }, [specificCaption]);

  const analyzeAndPlaySpatialSound = async (caption) => {
    await Tone.start(); // Ensure Tone.js is started
  
    const synth = new Tone.Synth().toDestination();
    const panner = new Tone.Panner3D().toDestination();
    const volume = new Tone.Volume().toDestination();
    synth.connect(panner).connect(volume);
  
    // Analyze caption for direction
    if (caption.includes('right')) panner.positionX.value = 1;
    else if (caption.includes('left')) panner.positionX.value = -1;
    else if (caption.includes('top')) panner.positionY.value = 1;
    else if (caption.includes('bottom')) panner.positionY.value = -1;
    else if (caption.includes('center')) {
      panner.positionX.value = 0;
      panner.positionY.value = 0;
    }
  
    // Adjust sound based on size description
    if (caption.includes('big')) {
      volume.volume.value = 6; // Louder for "big"
      synth.oscillator.type = 'sawtooth'; // A fuller sound for "big" objects
    } else if (caption.includes('medium')) {
      volume.volume.value = 0; // Neutral volume for "medium"
      synth.oscillator.type = 'triangle'; // A balanced sound for "medium" objects
    } else if (caption.includes('small')) {
      volume.volume.value = -12; // Quieter for "small"
      synth.oscillator.type = 'sine'; // A thinner sound for "small" objects
    }
  
    // Play a note for demonstration
    synth.triggerAttackRelease("C4", "1s");
  };
  


  const genDescSpecific = async (desc,clickednoun) => {
    const  apiKey =  process.env.REACT_APP_API_KEY
    
    const customPrompt = `
    You are describing an image to a Visually Impaired Person. 
    Generate the given image description of the ${desc} of the ${clickednoun} in two sentences.
    if  ${desc} is location, only use words : right left top bottom center 
    if  ${desc} is size, only use words : big medium or small
  }
  `;
  console.log(imageURLtwo);

    const payload = {
      "model": "gpt-4-vision-preview",
      "messages": [
          {
              "role": "user",
              "content": [
                  {"type": "text", "text": customPrompt},
                  {"type": "image_url", "image_url": {"url":imageURLtwo }}
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

    const data = await response.json();
    console.log('Response Caption', data)

    if (data.choices && data.choices.length > 0) {
      const response = data.choices[0].message.content;
      console.log('Decsription', response)
      setspecificCaption(response);
      speakDescription(response);
    } else {
      console.error('Failed to generate description:', data);
    }

    return (
      <div id='specific_description'>
        {specificCaption}
      </div>
    );

  }

  // Function to render buttons when a noun is clicked
  const renderButtons = () => {
    if (!clickedNoun) return null; // Don't render buttons if no noun is clicked

    return (
      <div>
        <button onClick={() => genDescSpecific('location',clickedNoun)}>Location of {clickedNoun}</button>
        <button onClick={() => genDescSpecific('size',clickedNoun) }>Size of {clickedNoun}</button>
        <button onClick={() => genDescSpecific('appearance',clickedNoun, )}>Appearance of {clickedNoun}</button>
      </div>
    );
  };

  // Function to process the caption and return an array of React elements
  const processCaption = () => {
    const words = caption.split(/\s+/);
    const nounsSet = new Set(taggedSentence.filter(item => ['NN', 'NNS', 'NNP', 'NNPS'].includes(item.pos)).map(item => item.value.toLowerCase()));
    
    return words.map((word, index) => {
      const key = `${word}-${index}`; // Unique key for each element
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); // Strip punctuation for comparison
      if (nounsSet.has(cleanWord.toLowerCase())) {
        return (
          <span key={key}>
            <a href="#!" className="noun-word" onClick={() => handleNounClick(cleanWord)}>
              {word}
            </a>{" "}
          </span>
        );
      } else {
        return <span key={key}>{word} </span>;
      }
    });
  };

  return (
    <div>
      {processCaption()}
      {renderButtons()}
      <div id='specific_description'>
        {specificCaption}
      </div>
      <form id='controllers'>
      <div className='input-row' style={{display: 'flex', alignItems: 'center', gap: '2px', width:'100%'}}>
        <input 
          type="text" 
          name='prompt'
          placeholder='Ask more questions about the image'
          value={prompt}
          style={{display: 'flex', alignItems: 'center', gap: '2px', width:'100%'}}
          required
        />
        <button type='button' id='speakButton' onClick={startListening}>Record</button>
        <button type='submit'>Ask</button>
      </div>
    </form>
    </div>
  );
};

export default ClickableNounsCaption;
