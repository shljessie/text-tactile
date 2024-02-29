import * as Tone from 'tone';

import { Configuration, OpenAIApi } from 'openai';
import React, { useEffect, useState } from 'react';

import Asset from './Asset'
import Canvas from './CanvasEditor'
import ClickableNounsCaption from './ClickableNouns';
import ImageOptions from './ImageOptions';
import { MoonLoader } from 'react-spinners';
import Nav from './Nav';
import TestSoundButtons from './TestSoundButtons';
import nlp from 'compromise'
import { useNavigate } from 'react-router-dom';

export const Main = () => {
  const configuration = new Configuration({
    apiKey: process.env.REACT_APP_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  var ner = require( 'wink-ner' );
  var myNER = ner();
  var winkTokenizer = require( 'wink-tokenizer' );
  var tokenize = winkTokenizer().tokenize;
  var posTagger = require( 'wink-pos-tagger' );
  var tagger = posTagger();

  const [verticalBarX, setVerticalBarX] = useState(0); 
  const [verticalBarY, setVerticalBarY] = useState(0); 
  const [horizontalBarX, setHorizontalBarX] = useState(0);
  const [horizontalBarY, setHorizontalBarY] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(500);
  const [canvasHeight, setCanvasHeight] = useState(500);
  const barWidth = 100;
  const barHeight = 20;

  const [promptText, setPromptText] = useState(() => sessionStorage.getItem('prompt') || '');
  const [images, setImages] = useState(() => JSON.parse(localStorage.getItem('images')) || []);
  const [highlightedPrompt, setHighlightedPrompt] = useState('');
  const [allPrompts, setAllPrompts] = useState(() => []);
  const [savedImages, setSavedImages] = useState(() => {
    const storedImages = localStorage.getItem('images');
    return storedImages ? JSON.parse(storedImages) : [];
  });
  const [canvasImages, setCanvasImages] = useState([]);

  const [description, setDescription] = useState('');
  const [sizeDescription, setSizeDescription] = useState('');
  const [positionDescription, setPositionDescription] = useState('');
  const [taggedDescription, setTaggedDescription] = useState([]); 
  const [editOperation, setEditOperation] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    prompt: "",
    n: 1, 
  });
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const [imageURL, setImageURL] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(null);
  const [isAdjustingSize, setIsAdjustingSize] = useState(false);
  const [sounds, setSounds] = useState({}); // State t

  useEffect(() => {
    // Clear savedImages state
    setSavedImages([]);
  
    // Optionally, if you also want to clear saved images from localStorage
    localStorage.removeItem('images');
  }, []); // Empty dependency array means this runs once on component mount

  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if the Shift key is pressed
      if (e.shiftKey) {
        switch (e.key) {
          case 'V':
            document.getElementById('verticalBar').focus();
            startCollisionCheckLoop();
            break;
          case 'H':
            // Focus on horizontal bar
            document.getElementById('horizontalBar').focus();
            startCollisionCheckLoop();
            break;
          default:
            break;
        }
      }
    };

    const handleKeyUp = (e) => {
      // Stop the collision check loop when any key is released
      stopCollisionCheckLoop();
    };
    
    
  
    window.addEventListener('keydown', handleKeyDown);
  
    // Cleanup event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      let shiftBPressed = false; 
      const step = 10; // Step size for movement

      // Check if the pressed key is 'ArrowUp', 'ArrowDown', 'ArrowLeft', or 'ArrowRight'
      switch (e.key) {
        case 'ArrowUp':
          if (e.shiftKey) { // Shift key pressed
            setHorizontalBarY((prevY) => Math.max(prevY - step, 0));
          }
          break;
        case 'ArrowDown':
          if (e.shiftKey) { // Shift key pressed
            setHorizontalBarY((prevY) => Math.min(prevY + step, canvasHeight - barWidth));
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) { // Shift key pressed
            setVerticalBarX((prevX) => Math.max(prevX - step, 0));
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) { // Shift key pressed
            setVerticalBarX((prevX) => Math.min(prevX + step, canvasWidth - barWidth));
          }
          break;
      }

    
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasWidth, canvasHeight, barWidth, barHeight]);

  useEffect(() => {
    // Function to generate a unique sound for each image
    const generateSound = async (imageUrl) => {
      const synth = new Tone.Synth().toDestination(); // Create a simple synth
      const note = generateRandomNote(); // Generate a random note for the image
      const duration = '8n'; // Duration of the note

      // Trigger the note and store it in the sounds state
      synth.triggerAttackRelease(note, duration);

      const updatedImages = savedImages.map(image => {
        if (image.url === imageUrl) {
          return { ...image, sound: note };
        }
        return image;
      });

      setSavedImages(updatedImages);
      
      setSounds(prevSounds => ({ ...prevSounds, [imageUrl]: note }));
    };

    // Function to generate a random note
    const generateRandomNote = () => {
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']; // List of notes
      const randomIndex = Math.floor(Math.random() * notes.length); // Generate a random index

      return notes[randomIndex]; // Return the note at the random index
    };

    images.forEach(image => {
      if (!sounds[image.url]) { // Check if sound for this image has already been generated
        generateSound(image.url); // Generate sound for the image
      }
    });
  }, [images, sounds]);
  

    // Function to generate a new image
    const handleGenerateImage = async () => {
      const newImage = await generateImage(); // Generate a new image
      setImages(prevImages => [...prevImages, newImage]); // Add the new image to the images state
    };

      // Function to play the sound associated with an image
  const playSoundForImage = (imageUrl) => {
    const note = sounds[imageUrl]; // Get the note associated with the image URL
    if (note) {
      const synth = new Tone.Synth().toDestination(); // Create a synth
      synth.triggerAttackRelease(note, '8n'); // Trigger the note
    }
  };
  

  const checkCollisionAndPlaySound = () => {
    savedImages.forEach((image) => {
      console.log('verticalBarX',verticalBarX)
      console.log('verticalBarX',verticalBarX)

      const verticalBarCollision =
        verticalBarX < image.coordinate.x + image.sizeParts.width ||
        verticalBarX + 3 > image.coordinate.x ||
        verticalBarY < image.coordinate.y + image.sizeParts.height ||
        verticalBarY + 500 > image.coordinate.y; 
  
      // Similar calculation for horizontal bar...
      
      if (verticalBarCollision /* || horizontalBarCollision */) {
        console.log('FOUND VERTICAL COLLISION')
        playSoundForImage(image.url); // Play sound if collision is detected
      }
    });
  };

  let isCheckingCollisions = false;

  const startCollisionCheckLoop = () => {
    checkCollisionAndPlaySound();
    if (!isCheckingCollisions) {
      isCheckingCollisions = true;
      const loop = () => {
        if (!isCheckingCollisions) return;
        checkCollisionAndPlaySound();
        requestAnimationFrame(loop);
      };
      loop();
    }
  };

  const stopCollisionCheckLoop = () => {
    isCheckingCollisions = false;
  };

  

  const mapPositionToCoordinates = (positionDescription, imageWidth, imageHeight) => {
    const canvasWidth = 500; // Width of your canvas
    const canvasHeight = 500; // Height of your canvas
    let x, y;

    console.log('positionDescription',positionDescription)
    console.log(' image widht for position calculation', imageWidth)
    const position = positionDescription.toLowerCase();
  
    switch (position) {
      case 'bottom':
        x = (canvasWidth - imageWidth) / 2; // Center horizontally
        y = canvasHeight - imageHeight; // Align bottom edge
        break;
      case 'top':
        x = (canvasWidth - imageWidth) / 2; // Center horizontally
        y = 0; // Align top edge
        break;
      case 'center':
        console.log('CENTER POSITION')
        x = (canvasWidth - imageWidth) / 2; // Center horizontally
        y = (canvasHeight - imageHeight) / 2; // Center vertically
        break;
      case 'left':
        x = 0; // Align left edge
        y = (canvasHeight - imageHeight) / 2; // Center vertically
        break;
      case 'right':
        x = canvasWidth - imageWidth; // Align right edge
        y = (canvasHeight - imageHeight) / 2; // Center vertically
        break;
      default:
        console.log('DEFAULT POSITION')
        // Default to center if no valid position description is provided
        x = (canvasWidth - imageWidth) / 2; // Center horizontally
        y = (canvasHeight - imageHeight) / 2; // Center vertically
        break;
    }
  
    return { x, y };
  };
  



  const highlightDetectedNoun = (prompt, noun) => {
    if (!noun) return prompt; // If no noun detected, return original prompt
    // Use a regular expression to replace the detected noun with HTML span for highlighting
    const highlightedPrompt = prompt.replace(new RegExp(noun, 'gi'), `<span style="background-color: yellow">${noun}</span>`);
    return highlightedPrompt;
  };

  const handlePromptSelection = (index) => {
    console.log('Selected ', index)
    if (selectedPromptIndex === index) {
      setSelectedPromptIndex(null);
    } else {
      setSelectedPromptIndex(index);
    }
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'prompt') {
      setPromptText(value);
      sessionStorage.setItem('prompt', value);
    }
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

  const updateImageDetails = (index, updatedDetails) => {
    // Update the details for a specific image in both images and savedImages
    setImages(currentImages => {
        const updatedImages = currentImages.map((img, idx) => idx === index ? { ...img, ...updatedDetails } : img);
        return updatedImages;
    });

    setSavedImages(currentSavedImages => {
        const updatedSavedImages = currentSavedImages.map((img, idx) => idx === index ? { ...img, ...updatedDetails } : img);
        // Also update localStorage with the new savedImages data
        localStorage.setItem('images', JSON.stringify(updatedSavedImages));
        return updatedSavedImages;
    });
};


  const generateImage = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await openai.createImage({
        prompt: `Create a :\n${promptText}`,
        n: 1,
      });

      const lengthImages = savedImages.length

      const imageObjects = response.data.data.map( img => ({
        prompt: promptText, 
        name: `Image_${lengthImages}`,
        url: img.url,
        descriptions: {
          general: '',
          size: '',
          position: '',
        },
        coordinate:{ x: 0, y: 0 },
        sizeParts: {width:100, height:100},
        sound: ''
      }));
  
      // Save images to localStorage
      const updatedSavedImages = [...savedImages, ...imageObjects];
      const updatedImages = [...images, ...imageObjects];
      localStorage.setItem('images', JSON.stringify(updatedSavedImages));
  
      setImages(imageObjects);
      setSavedImages(updatedSavedImages); // Update savedImages state

      imageObjects.forEach((image, index) => {
        fetchDescription(image.url, 'general', index);
        fetchDescription(image.url, 'size', index);
        fetchDescription(image.url, 'position', index);
      });

      // Update allPrompts state to include the current prompt text
      setAllPrompts(prevPrompts => [...prevPrompts, promptText]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processPrompt = (promptText) => {
    const tokens = tokenize(promptText);
    const taggedTokens = tagger.tag(tokens);
    const processedSegments = [];
  
    taggedTokens.forEach(token => {
      if (token.pos === 'NN') {
        // If it's a noun, push it as an object with a flag indicating it's a noun
        processedSegments.push({ text: token.value, isNoun: true });
      } else {
        // If it's not a noun, push the text directly
        processedSegments.push({ text: token.value, isNoun: false });
      }
    });
  
    return processedSegments;
  };

  const onNounClick = (noun) => {
    console.log(`Noun clicked: ${noun}`);
    // Implement any logic you want to trigger on clicking a noun
  };

  const mapSizeToParts = (sizeDescription) => {
    let width, height;
  
    // Convert sizeDescription to lowercase to make the switch case-insensitive
    const size = sizeDescription.toLowerCase();
  
    switch (size) {
      case 'small':
        console.log('USING SMALL SIZE')
        width = 50;
        height = 50;
        break;
      case 'medium':
        console.log('USING MEDIUM SIZE')
        width = 100;
        height = 100;
        break;
      case 'large':
        console.log('USING LARGE SIZE')
        width = 150;
        height = 150;
        break;
      default:
        console.log('USING DEFAULT SIZE')
        width = 100;
        height = 100;
        break;
    }
  
    return { width, height };
  };
  

const handleKeyDown = (e, index, editOperation) => {
  console.log('Selected image index:', index);
  console.log('Selected Edit :',editOperation);
  if (selectedImageIndex === null) return; // Early return if no image is selected

  const { keyCode } = e;
  let dx = 0, dy = 0; // For position adjustments
  let dw = 0, dh = 0; // For size adjustments
  const moveStep = 10; // Step for moving the image
  const resizeStep = 10; // Step for resizing the image

  if (editOperation==' position') {
    console.log('POSITION EDITING')
    switch (keyCode) {
      case 37: dx = -moveStep; break; // Left arrow
      case 38: dy = -moveStep; break; // Up arrow
      case 39: dx = moveStep;  break; // Right arrow
      case 40: dy = moveStep;  break; // Down arrow
    }
  } else if(editOperation==' size') {
    console.log('SIZE EDITING')
    // Additional keys for size adjustment, e.g., + and - keys
    switch (keyCode) {
      case 187: dw = resizeStep; dh = resizeStep; break; // '+' key
      case 189: dw = -resizeStep; dh = -resizeStep; break; // '-' key
    }
  }

  updateImagePosition(index, dx, dy);
  
  // Apply position adjustment
  setSavedImages((prevImages) => {
    const newImages = [...prevImages];
    const imageToEdit = newImages[index];
    if (editOperation=='position') {
      imageToEdit.coordinate.x += dx;
      imageToEdit.coordinate.y += dy;
    }else if(editOperation=='size')  {
      // Apply size adjustment, ensuring the size does not become negative
      imageToEdit.sizeParts.width = Math.max(10, imageToEdit.sizeParts.width + dw);
      imageToEdit.sizeParts.height = Math.max(10, imageToEdit.sizeParts.height + dh);
    }
    return newImages;
  });

  if (keyCode === 27) { // Escape key to deselect image
    setSelectedImageIndex(null);
  }
};

// Function to set the selected image index
const selectImageForEditing = (index, editOperation) => {
  console.log('Selected Edit', index)
  setSelectedImageIndex(index);
  setEditOperation(editOperation);
  console.log('SET EDIT OPERATION:',editOperation)
  // Ensure the div container is focused to listen for key down events
  document.getElementById("canvas").focus();
};

const updateImagePosition = (index, dx, dy) => {
  setSavedImages((prevImages) => {
    const newImages = [...prevImages];
    const imageToUpdate = newImages[index];

    // Update coordinates based on dx and dy
    const updatedCoordinates = {
      x: imageToUpdate.coordinate.x + dx,
      y: imageToUpdate.coordinate.y + dy,
    };

    // Update the image with new coordinates
    newImages[index] = { ...imageToUpdate, coordinate: updatedCoordinates };

    // Persist changes to localStorage
    localStorage.setItem('images', JSON.stringify(newImages));

    return newImages;
  });
};


  
  


const fetchDescription = async (imageURL, descriptionType, index) => {
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

      // Inside fetchDescription, when setting state after fetching position or size description
      setImages(currentImages => {
        // Copy the current images to a new array to avoid mutating the state directly
        const newImages = [...currentImages];
        
        // Find and update only the specific image
        const updatedImage = { ...newImages[index] }; // Clone to avoid direct mutation
        if (descriptionType === 'position') {
          updatedImage.coordinate = mapPositionToCoordinates(caption, updatedImage.sizeParts.width, updatedImage.sizeParts.height);
          updateImageDetails(index, { coordinate: updatedImage.coordinate });
        } else if (descriptionType === 'size') {
          updatedImage.sizeParts = mapSizeToParts(caption.toLowerCase());
          updateImageDetails(index, { sizeParts: updatedImage.sizeParts });
        }
        // Update descriptions as needed
        updatedImage.descriptions[descriptionType] = caption;
        
        newImages[index] = updatedImage; // Update the array with the modified image
        
        return newImages; // Return the updated array to set the new state
      });


      setImageURL(imageURL);

      

      // Optionally update other state based on the description type
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

const handlePositionEditKeyDown = (e, index) => {
  let dx = 0, dy = 0;
  switch (e.key) {
    case 'ArrowUp': dy = -1; break;
    case 'ArrowDown': dy = 1; break;
    case 'ArrowLeft': dx = -1; break;
    case 'ArrowRight': dx = 1; break;
    default: return; // Ignore other keys
  }

  // Update the image position state with the new values
  updateImagePosition(index, dx, dy);

  // Prevent the default action to avoid scrolling the page
  e.preventDefault();
};

const handleSizeEditKeyDown = (e, index) => {
  let dw = 0, dh = 0; // delta width, delta height
  const resizeStep = 10; // Adjust this value as needed for the size step

  switch (e.key) {
    case 'ArrowUp':
      dw = resizeStep;
      dh = resizeStep;
      break;
    case 'ArrowDown':
      dw = -resizeStep;
      dh = -resizeStep;
      break;
    default:
      return; // Ignore other keys
  }

  // Update the image size state with the new values
  updateImageSize(index, dw, dh);

  // Prevent the default action to avoid scrolling the page
  e.preventDefault();
};

const updateImageSize = (index, dw, dh) => {
  setSavedImages((prevImages) => {
    const newImages = [...prevImages];
    const imageToUpdate = newImages[index];

    // Calculate new size, ensuring it doesn't go below a minimum value
    const newWidth = Math.max(10, imageToUpdate.sizeParts.width + dw);
    const newHeight = Math.max(10, imageToUpdate.sizeParts.height + dh);

    // Update the image with the new size
    newImages[index] = {
      ...imageToUpdate,
      sizeParts: { width: newWidth, height: newHeight }
    };

    // Persist the updated images array to localStorage
    localStorage.setItem('images', JSON.stringify(newImages));

    return newImages;
  });
};






  return (
    <div id='imageGeneration'>
      <div className='mainContainer'>
        <div>
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
                  value={promptText} 
                  onChange={handleChange}
                  required
                  style={{ width: '100%' }}
                />
              </div>
              <button type='button' id='speakButton' onClick={startListening}>Record</button>
              <button type='submit'>Generate Image</button>
            </div>
          </form>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          images.map((image, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <img src={image.url} alt={`Generated Content ${index}`} width="250" height="250" />
              <div>
                <p>Description: {image.descriptions.general}</p>
                <p>Size: {image.descriptions.size}</p>
                <p>Position: {image.descriptions.position}</p>
              </div>
            </div>
          ))
        )}

        <div>
          <h1>Assets Raw Data</h1>
          {savedImages.length > 0 ? (
            savedImages.map((image, index) => (
              <div key={index}>
                <img src={image.url} alt={`Saved Image ${index}`} width="250" height="250" />
                <p>Prompt: {image.prompt}</p>
                <p>Description: {image.descriptions.general}</p>
                <p>Size: {image.descriptions.size}</p>
                <p>Position: {image.descriptions.position}</p>
                <p>Coordinate:<div>
                X: {image.coordinate.x}, Y: {image.coordinate.y}
              </div>
               </p>
               <p>Size WH:<div>
                Width: {image.sizeParts.width}, Y: {image.sizeParts.height}
              </div>
               </p>
              </div>
            ))
          ) : (
            <p>No past saved images found.</p>
          )}
        </div>


        <div id="canvas" style={{ position: 'relative', width: '500px', height: '500px', border: '1px solid black' }} tabIndex={0}>
        <h2>Canvas</h2>
        {/* Render vertical bar */}
        <div id="verticalBar" style={{ position: 'absolute', left: `${verticalBarX}px`, top: `${verticalBarY}px`, width: '3px', height: '500px', backgroundColor: 'red' }}></div>

        {/* Render horizontal bar */}
        <div id="horizontalBar" style={{ position: 'absolute', left: `${horizontalBarX}px`, top: `${horizontalBarY}px`,   width: '500px', height: '3px', backgroundColor: 'blue' }}></div>


        {savedImages.map((image, index) => (
          <div key={index} style={{ position: 'absolute', left: `${image.coordinate.x}px`, top: `${image.coordinate.y}px` }} onKeyDown={(e) => handleKeyDown(e, index, editOperation)} 
          tabIndex={0}>
            <img
              src={image.url}
              alt={`Generated Content ${index}`}
              style={{
                width: image.sizeParts.width + 'px',
                height: image.sizeParts.height + 'px',
              }}
            />
            {selectedPromptIndex === index && (
              <ImageOptions
                text="Options"
                image={image}
                onEditPosition={() => selectImageForEditing(index, 'position')}
                onEditSize={() => selectImageForEditing(index, 'size')}
              />
            )}
          </div>
        ))}
        
        </div>

       {/* Displaying all past prompts */}
        <div>
        <h2>Prompts Logged</h2>
        {allPrompts.length > 0 ? (
          <ul>
            {savedImages.map((image, index) => (
              
              <li key={index} onClick={() => handlePromptSelection(index)} >
              <p>Seleted index: {index}</p>
                {processPrompt(image.prompt).map((segment, segmentIndex) =>
                  segment.isNoun ? (
                    <React.Fragment key={segmentIndex}>
                    <button
                      onClick={() => onNounClick(segment.text)}
                      
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'blue',
                        cursor: 'pointer',
                        display: 'inline',
                      }}
                    >
                    {segment.text}
                    </button>
                   
                  </React.Fragment>
                  ) : (
                    <span key={segmentIndex}>{segment.text}</span>
                  )
                ).reduce((prev, curr) => [prev, ' ', curr]) /* Add spaces between segments */}
              </li>
            ))}
          </ul>
        ) : (
          <p>No past prompts found.</p>
        )}
</div>

<h2>Pixel Table</h2>
{savedImages.length > 0 ? (
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Image</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Prompt</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Description</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Size</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Position</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Sound</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }} >Edit Position</th>
        <th style={{ border: "1px solid #ddd", padding: "8px" }}>Edit Size</th>
      </tr>
    </thead>
    <tbody>
      {savedImages.map((image, index) => (
        <tr key={index}>
        <td style={{ border: "1px solid #ddd", padding: "8px" }} tabIndex="0">{image.name}</td>
          <td style={{ border: "1px solid #ddd", padding: "8px" }}>
            <img src={image.url} alt={`Saved Image ${index}`} width="100" height="100" />
          </td>
          <td style={{ border: "1px solid #ddd", padding: "8px" }} tabIndex="0">{image.prompt}</td>
          <td style={{ border: "1px solid #ddd", padding: "8px" }} tabIndex="0">{image.descriptions.general}</td>
          <td style={{ border: "1px solid #ddd", padding: "8px" }} tabIndex="0">{image.descriptions.size}</td>
          <td style={{ border: "1px solid #ddd", padding: "8px" }} tabIndex="0">{image.descriptions.position}</td>
          <td
          style={{ border: "1px solid #ddd", padding: "8px" }}
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              playSoundForImage(image.url);
            }
          }}
        >
          {image.sound}
        </td>
        
          <td
            style={{ border: "1px solid #ddd", padding: "8px" }}
            tabIndex="0"
            onKeyDown={(e) => handlePositionEditKeyDown(e, index)}
            style={{ cursor: "pointer" }}
          >
            {image.coordinate.x},{image.coordinate.y}
          </td>
          <td
            style={{ border: "1px solid #ddd", padding: "8px" }}
            tabIndex="0"
            onKeyDown={(e) => handleSizeEditKeyDown(e, index)}
            style={{ cursor: "pointer" }}
          >
            {image.sizeParts.width} x {image.sizeParts.height}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <p>No past saved images found.</p>
)}


        
      </div>
    </div>
  );
};
