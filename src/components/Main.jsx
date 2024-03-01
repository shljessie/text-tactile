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
  console.log(openai)

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

  // Clear images
  useEffect(() => {
    setSavedImages([]);
    localStorage.removeItem('images');
  }, []); 

  // Vertical Horizontal Bar Changes
  useEffect(() => {
    
    const handleKeyDown = (e) => {
      if (e.shiftKey) {
        switch (e.key) {
          case 'V':
            document.getElementById('verticalBar').focus();
            startCollisionCheckLoop();
            break;
          case 'H':
            document.getElementById('horizontalBar').focus();
            startCollisionCheckLoop();
            break;
          default:
            break;
        }
      }
    };

    const handleKeyUp = (e) => {
      stopCollisionCheckLoop();
    };
    window.addEventListener('keydown', handleKeyDown);
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Position Edits
  useEffect(() => {
    const handleKeyDown = (e) => {
      let shiftBPressed = false; 
      const step = 10; 
      
      switch (e.key) {
        case 'ArrowUp':
          if (e.shiftKey) {
            setHorizontalBarY((prevY) => Math.max(prevY - step, 0));
          }
          break;
        case 'ArrowDown':
          if (e.shiftKey) {
            setHorizontalBarY((prevY) => Math.min(prevY + step, canvasHeight - barWidth));
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) { 
            setVerticalBarX((prevX) => Math.max(prevX - step, 0));
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            setVerticalBarX((prevX) => Math.min(prevX + step, canvasWidth - barWidth));
          }
          break;
      }

    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasWidth, canvasHeight, barWidth, barHeight]);

  
  // Function to generate a unique sound for each image
  useEffect(() => {
    const generateSound = async (imageUrl) => {
      const synth = new Tone.Synth().toDestination();
      const note = generateRandomNote();
      const duration = '8n';

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
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']; 
      const randomIndex = Math.floor(Math.random() * notes.length);

      return notes[randomIndex]; 
    };

     // Check if sound for this image has already been generated
    images.forEach(image => {
      if (!sounds[image.url]) {
        generateSound(image.url); 
      }
    });
  }, [images, sounds]);

  //  When Table Interaction: Function to play the sound associated with an image
  const playSoundForImage = (imageUrl) => {
    const note = sounds[imageUrl];
    if (note) {
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease(note, '8n');
    }
  };
  
  // Bar Collision [TODO] Function to play the sound associated with an image
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

  // Bar Collision [TOOD]
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
  // Bar Collision [TOOD]
  const stopCollisionCheckLoop = () => {
    isCheckingCollisions = false;
  };

  // Map Position to Coordinate
  const mapPositionToCoordinates = (positionDescription, imageWidth, imageHeight) => {
    const canvasWidth = 500; 
    const canvasHeight = 500;
    let x, y;

    console.log('positionDescription',positionDescription)
    console.log(' image widht for position calculation', imageWidth)
    const position = positionDescription.toLowerCase();
  
    switch (position) {
      case 'bottom':
        x = (canvasWidth - imageWidth) / 2;
        y = canvasHeight - imageHeight;
        break;
      case 'top':
        x = (canvasWidth - imageWidth) / 2;
        y = 0;
        break;
      case 'center':
        console.log('CENTER POSITION')
        x = (canvasWidth - imageWidth) / 2;
        y = (canvasHeight - imageHeight) / 2;
        break;
      case 'left':
        x = 0;
        y = (canvasHeight - imageHeight) / 2;
        break;
      case 'right':
        x = canvasWidth - imageWidth;
        y = (canvasHeight - imageHeight) / 2;
        break;
      default:
        console.log('DEFAULT POSITION')
        x = (canvasWidth - imageWidth) / 2;
        y = (canvasHeight - imageHeight) / 2;
        break;
    }
  
    return { x, y };
  };

  // For Prompt Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'prompt') {
      setPromptText(value);
      sessionStorage.setItem('prompt', value);
    }
  };

  // For Recording Prompt
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

  // [TODO] : updating coordinates
  const updateImageDetails = (index, updatedDetails) => {
    setImages(currentImages => {
        const updatedImages = currentImages.map((img, idx) => idx === index ? { ...img, ...updatedDetails } : img);
        return updatedImages;
    });
  };

  // Generating Images from Prompt
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
  
      const updatedImages = [...images, ...imageObjects];
      const updatedSavedImages = [...savedImages, ...imageObjects];
      localStorage.setItem('images', JSON.stringify(updatedSavedImages));
      setImages(updatedImages);
      setSavedImages(updatedSavedImages);

      imageObjects.forEach((image, index) => {
        fetchDescription(image.url, 'general', index);
        fetchDescription(image.url, 'size', index);
        fetchDescription(image.url, 'position', index);
      });

      setAllPrompts(prevPrompts => [...prevPrompts, promptText]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial Size Mapping
  const mapSizeToParts = (sizeDescription) => {
    let width, height;
  
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
  

  // Selecting Table Column for Editing
  const handleKeyDown = (e, index, editOperation) => {
    console.log('Selected image index:', index);
    console.log('Selected Edit :',editOperation);
    if (selectedImageIndex === null) return; 

    const { keyCode } = e;
    let dx = 0, dy = 0;
    let dw = 0, dh = 0; 
    const moveStep = 10; 
    const resizeStep = 10;

    if (editOperation==' position') {
      console.log('POSITION EDITING')
      switch (keyCode) {
        case 37: dx = -moveStep; break; 
        case 38: dy = -moveStep; break;
        case 39: dx = moveStep;  break;
        case 40: dy = moveStep;  break;
      }
    } else if(editOperation==' size') {
      console.log('SIZE EDITING')
      switch (keyCode) {
        case 187: dw = resizeStep; dh = resizeStep; break; 
        case 189: dw = -resizeStep; dh = -resizeStep; break; 
      }
    }

    updateImagePosition(index, dx, dy);
    
    setSavedImages((prevImages) => {
      const newImages = [...prevImages];
      const imageToEdit = newImages[index];
      if (editOperation=='position') {
        imageToEdit.coordinate.x += dx;
        imageToEdit.coordinate.y += dy;
      }else if(editOperation=='size')  {
        imageToEdit.sizeParts.width = Math.max(10, imageToEdit.sizeParts.width + dw);
        imageToEdit.sizeParts.height = Math.max(10, imageToEdit.sizeParts.height + dh);
      }
      return newImages;
    });

    if (keyCode === 27) { 
      setSelectedImageIndex(null);
    }
  };

  // Function to set the selected image index
  const selectImageForEditing = (index, editOperation) => {
    console.log('Selected Edit', index)
    setSelectedImageIndex(index);
    setEditOperation(editOperation);
    console.log('SET EDIT OPERATION:',editOperation)
    document.getElementById("canvas").focus();
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

        setImages(currentImages => {
          const newImages = [...currentImages];
          const updatedImage = { ...newImages[index] };
          if (descriptionType === 'position') {
            updatedImage.coordinate = mapPositionToCoordinates(caption, updatedImage.sizeParts.width, updatedImage.sizeParts.height);
            updateImageDetails(index, { coordinate: updatedImage.coordinate });
          } else if (descriptionType === 'size') {
            updatedImage.sizeParts = mapSizeToParts(caption.toLowerCase());
            updateImageDetails(index, { sizeParts: updatedImage.sizeParts });
          }
          updatedImage.descriptions[descriptionType] = caption;
          
          newImages[index] = updatedImage;
          
          return newImages; 
        });


        setImageURL(imageURL);

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
      default: return; 
    }
    updateImagePosition(index, dx, dy);
    e.preventDefault();
  };

  const handleSizeEditKeyDown = (e, index) => {
    let dw = 0, dh = 0;
    const resizeStep = 10;

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
        return;
    }

    updateImageSize(index, dw, dh);
    e.preventDefault();
  };

  // Updating Coordinates
  const updateImagePosition = (index, dx, dy) => {
    setSavedImages((prevImages) => {
      const newImages = [...prevImages];
      const imageToUpdate = newImages[index];

      const updatedCoordinates = {
        x: imageToUpdate.coordinate.x + dx,
        y: imageToUpdate.coordinate.y + dy,
      };

      newImages[index] = { ...imageToUpdate, coordinate: updatedCoordinates };
      localStorage.setItem('images', JSON.stringify(newImages));

      return newImages;
    });
  };

  // Updating Image Size
  const updateImageSize = (index, dw, dh) => {
    setSavedImages((prevImages) => {
      const newImages = [...prevImages];
      const imageToUpdate = newImages[index];

      const newWidth = Math.max(10, imageToUpdate.sizeParts.width + dw);
      const newHeight = Math.max(10, imageToUpdate.sizeParts.height + dh);

      newImages[index] = {
        ...imageToUpdate,
        sizeParts: { width: newWidth, height: newHeight }
      };

      localStorage.setItem('images', JSON.stringify(newImages));

      return newImages;
    });
  };



  


  return (
    <div id='imageGeneration'>
      <div className='mainContainer'>

      <div className="leftContainer">
        <div className='inputContainer'>
          <form id='controllers' onSubmit={generateImage}>
            <div className='input-row' style={{display: 'flex', alignItems: 'center', gap: '10px',justifyContent: 'space-between'}}>
              <div style={{ marginBottom: '20px', width: '40%' }}>
                <label htmlFor="imageDescription" style={{ display: 'block', marginBottom: '5px', color:'#1E90FF', fontSize: '0.8rem' }}>
                  Prompt:
                </label>
                <input
                  type="text"
                  name="prompt"
                  placeholder="e.g: a cat holding a mic and singing"
                  value={promptText} 
                  onChange={handleChange}
                  required
                  style={{ width: '300px', alignItems:'start' }}
                />
              </div>
              <div>
                <button type='button' id='speakButton' onClick={startListening}>Record</button>
                <button type='submit'>Generate</button>
              </div>
            </div>
          </form>
        </div>


        <div className='pixeltableContainer'>
        <h4>Pixel Table</h4>
        {savedImages.length > 0 ? (
          <table style={{ width: "98%", borderCollapse: "collapse", fontSize:'0.8rem',paddingBottom:'1rem' }}>
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
                    <img src={image.url} alt={`Saved Image ${index}`} width="50" height="50" />
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }} tabIndex="0">{image.prompt}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", maxWidth:"14px" }} tabIndex="0">
                    {image.descriptions.general.split(" ").slice(0, 10).join(" ")}
                  </td>
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
          <p></p>
        )}
      </div>


      </div>

      <div className='rightContainer'>

      <div id="canvas" style={{ position: 'relative', width: '500px', height: '500px', border: '1px solid black' }} tabIndex={0}>
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

      </div>


      </div>

      <div>
          <h3>Assets Raw Data (DEBUGGING)</h3>
          {savedImages.length > 0 ? (
            savedImages.map((image, index) => (
              <div key={index}>
                <img src={image.url} alt={`Saved Image ${index}`} width="100" height="100" />
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

      
    </div>
  );
};
