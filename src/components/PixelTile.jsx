import * as Tone from 'tone';

import { Configuration, OpenAIApi } from 'openai';
import React, { useEffect, useRef, useState } from 'react';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Button from '@mui/material/Button';
import ClearIcon from '@mui/icons-material/Clear';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import InfoIcon from '@mui/icons-material/Info';
import { MoonLoader } from 'react-spinners';
import PhotoSizeSelectLargeIcon from '@mui/icons-material/PhotoSizeSelectLarge';
import RadarIcon from '@mui/icons-material/Radar';
import TextField from '@mui/material/TextField';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';

export const PixelTile = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(!sessionStorage.getItem('apiKey'));

  const [showInstructions, setShowInstructions] = useState(true);

  const [isListening, setIsListening] = useState(false);

  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(5);
  const [gridItems, setGridItems] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(null);

  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  const [openai, setOpenai] = useState();
  const [savedImages, setSavedImages] = useState([]);
  const [promptText, setPromptText] = useState('');

  const [verticalBarX, setVerticalBarX] = useState(0); 
  const [verticalBarY, setVerticalBarY] = useState(0); 
  const [horizontalBarX, setHorizontalBarX] = useState(0);
  const [horizontalBarY, setHorizontalBarY] = useState(0);

  const tileRefs = useRef([]);
  const playerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const canvasRef = useRef(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const [editingImageIndexKeyboard, setEditingImageIndexKeyboard] = useState(null);

  const [isEditingSize, setIsEditingSize] = useState(false);
  const [editingSizeImageIndex, setEditingSizeImageIndex] = useState(null);


  const [isChangeMode, setIsChangeMode] = useState(false);
  const [changeIndex, setChangeIndex] = useState(null);
  const [changePrompt, setChangePrompt] = useState('');


  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  useEffect(() => {
    if (apiKey) {
      const configuration = new Configuration({
        apiKey: apiKey,
      });
      setOpenai(new OpenAIApi(configuration));
    }
  }, []);

  useEffect(() => {
    const storedApiKey = sessionStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      initializeOpenAI(storedApiKey); 
      setApiKeyLoaded(true);
    } else {
      setApiKeyLoaded(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem('apiKey', apiKey);
      initializeOpenAI(apiKey);
      setApiKeyLoaded(true);
    } else {
      setApiKeyLoaded(false);
    }
  }, [apiKey]);
  
  const initializeOpenAI = (key) => {
    const configuration = new Configuration({
      apiKey: key,
    });
    setOpenai(new OpenAIApi(configuration));
  };

  



  useEffect(() => {
      console.log('Saved Images Updated', savedImages);
      localStorage.setItem('images', JSON.stringify(savedImages));
    }, [savedImages]);

  useEffect(() => {
    const items = [];
    for (let i = 0; i < rows * columns; i++) {
      items.push(`Item ${i + 1}`);
    }
    setGridItems(items);

    tileRefs.current = items.map((_, i) => tileRefs.current[i] || React.createRef());

    const url = "assets/sounds/bloop.mp3";

    const player = new Tone.Player().toDestination();
    player.load(url).then(() => {
        playerRef.current = player;
    });

    document.documentElement.addEventListener('mousedown', () => {
      if (Tone.context.state !== 'running') Tone.context.resume();
    });
    
  }, [rows, columns]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('mousemove', handleMouseMoveOnCanvas);
      canvasElement.addEventListener('mouseup', handleMouseUpOnCanvas);
    }

    return () => {
      if (canvasElement) {
        canvasElement.removeEventListener('mousemove', handleMouseMoveOnCanvas);
        canvasElement.removeEventListener('mouseup', handleMouseUpOnCanvas);
      }
    };
  }, [isDragging, draggedImageIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      
      if (isEditingLocation && editingImageIndex !== null) {
        console.log('editing Imag Index', editingImageIndex)
        console.log('Keyboard Editing here')
        console.log(`Key pressed: ${e.key}`);
        let dx = 0, dy = 0;
        switch(e.key) {
          case 'ArrowLeft': dx = -10; break;
          case 'ArrowRight': dx = 10; break;
          case 'ArrowUp': dy = -10; break;
          case 'ArrowDown': dy = 10; break;
          case 'Escape': // Exit editing mode
            setIsEditingLocation(false);
            setEditingImageIndex(null);
            return;
          default: return; // Ignore other keys
        }
        // Update location of the current editing image
        setSavedImages((prevImages) => prevImages.map((img, index) => {
          if (index === editingImageIndex) {
            return { ...img, coordinate: { x: img.coordinate.x + dx, y: img.coordinate.y + dy } };
          }
          return img;
        }));
      }
    };

    if (isEditingLocation) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditingLocation, editingImageIndex, savedImages]);

  useEffect(() => {
    const attachSizeEditKeyListener = () => {
      document.addEventListener('keydown', handleKeyDownForSizeEdit);
    };
  
    const detachSizeEditKeyListener = () => {
      document.removeEventListener('keydown', handleKeyDownForSizeEdit);
    };
  
    if (isEditingSize) {
      attachSizeEditKeyListener();
    }
  
    // Cleanup function to ensure the listener is removed when the component unmounts or the state changes
    return () => {
      detachSizeEditKeyListener();
    };
  }, [isEditingSize, editingSizeImageIndex]); // Make sure to include all dependencies used in handleKeyDownForSizeEdit
  
  
  const handleKeyDownForSizeEdit = (e) => {
    if (!isEditingSize || editingSizeImageIndex === null) {
      // If not in size editing mode, don't process the key events here.
      return;
    }
  
    // Prevent the default action (e.g., scrolling) and stop the event from propagating.
    e.preventDefault();
    e.stopPropagation();
  
    let scaleFactor = 1;
    switch (e.key) {
      case 'ArrowUp':
        scaleFactor = 1.1; // Slightly increase size
        break;
      case 'ArrowDown':
        scaleFactor = 0.9; // Slightly decrease size
        break;
      case 'Escape':
        // Exit size editing mode
        setIsEditingSize(false);
        setEditingSizeImageIndex(null);
        return;
      default:
        // If another key is pressed, return early without processing.
        return;
    }
  
    // Adjust size with aspect ratio maintenance
    setSavedImages((prevImages) => prevImages.map((img, index) => {
      if (index === editingSizeImageIndex) {
        const originalWidth = img.sizeParts.width;
        const originalHeight = img.sizeParts.height;
        const newWidth = originalWidth * scaleFactor;
        const newHeight = originalHeight * scaleFactor;
  
        // Update the image object with the new size
        return {
          ...img,
          sizeParts: {
            width: newWidth,
            height: newHeight,
          },
        };
      }
      return img;
    }));
  };
  


  const handleMouseDownOnImage = (index) => (e) => {

    console.log('isEditing',isEditingLocation )

    if (isEditingLocation) {
      e.preventDefault(); 
      setIsDragging(true);
      setDraggedImageIndex(index);
    } else {
      // If in editing location mode, ignore
    }
  };

  const enterLocationEditMode = (gridIndex) => (e) => {
    e.stopPropagation(); // Prevent other click events
  
    // Calculate the expected center coordinates for the grid item
    const col = gridIndex % columns;
    const row = Math.floor(gridIndex / columns);
    const expectedCenterX = (col + 0.5) * 100; // Adjust these based on your grid setup
    const expectedCenterY = (row + 0.5) * 100;
  
    // Find the image object that matches these coordinates (or close enough)
    const imageObjectIndex = savedImages.findIndex(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 && // Adjust tolerance as needed
             Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });
  
    if(imageObjectIndex !== -1) { // Make sure an image was found
      setIsEditingLocation(true);
      setEditingImageIndex(imageObjectIndex);
      canvasRef.current.focus(); // Ensure the canvas or relevant container can receive keyboard events
    }
  };

  const enterSizeEditMode = (gridIndex) => (e) => {
    // Prevents the default action of the event and stops it from bubbling up the event chain
    e.stopPropagation();

    console.log('Size Edit grid index', gridIndex);

    const col = gridIndex % columns;
    const row = Math.floor(gridIndex / columns);
    const expectedCenterX = (col + 0.5) * 100;
    const expectedCenterY = (row + 0.5) * 100;

    const imageObjectIndex = savedImages.findIndex(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
             Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });

    console.log('Size Edit Index', imageObjectIndex);

    if(imageObjectIndex !== -1) {
      setIsEditingSize(true);
      setEditingSizeImageIndex(imageObjectIndex);
      canvasRef.current.focus(); // This line ensures the canvas gets focus for key events
    }
};

  const playDescription = (index) => {

    const col = index % columns;
    const row = Math.floor(index / columns);
    const expectedCenterX = (col + 0.5) * 100;
    const expectedCenterY = (row + 0.5) * 100;

    const imageObjectIndex = savedImages.findIndex(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
             Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });
    console.log('Image',savedImages[imageObjectIndex])
    const utterance = new SpeechSynthesisUtterance(savedImages[imageObjectIndex].descriptions);

    console.log('Description grid index', utterance);
    speechSynthesis.speak(utterance);
  };

  
  

  // const enterLocationEditMode = (index) => (e) => {
  //   e.stopPropagation(); // Prevent triggering other click events
  //   setIsEditingLocation(true);
  //   setEditingImageIndex(index);
    
  //   // Focus on the canvas to listen for keyboard events
  //   canvasRef.current.focus();
  // };

  const handleMouseMoveOnCanvas = (e) => {
    if (!isDragging || draggedImageIndex === null) return;

    // Calculate new coordinates based on the mouse position relative to the canvas
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - 75; // 75 to center cursor to the image's center
    const y = e.clientY - rect.top - 75; // Adjust based on your needs or image size

    // Update the position of the dragged image in the savedImages array
    setSavedImages((prevImages) => prevImages.map((img, index) => {
      if (index === draggedImageIndex) {
        return { ...img, coordinate: { x, y } };
      }
      return img;
    }));
  };

  const handleMouseUpOnCanvas = (e) => {

    if (!isDragging || draggedImageIndex === null) return;
    setIsDragging(false);
    setDraggedImageIndex(null);
  };
  

  const playSpatialSound = (direction) => {
    if (!playerRef.current) return;
    
    const panner = new Tone.Panner3D({
      positionX: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
      positionY: direction === 'up' ? 10 : direction === 'down' ? -30 : 0,
      positionZ: -1,
    }).toDestination();

    playerRef.current.disconnect();
    playerRef.current.chain(panner, Tone.Destination);

    playerRef.current.start();
  };

  const tileNavigation = (event, index) => {

    let newIndex, direction;
    
    switch (event.key) {
      case 'ArrowUp':
        newIndex = index - columns < 0 ? index : index - columns;
        direction = 'up';
        break;
      case 'ArrowDown':
        newIndex = index + columns >= rows * columns ? index : index + columns;
        direction = 'down';
        break;
      case 'ArrowLeft':
        newIndex = index % columns === 0 ? index : index - 1;
        direction = 'left';
        break;
      case 'ArrowRight':
        newIndex = (index + 1) % columns === 0 ? index : index + 1;
        direction = 'right';
        break;
      case 'Enter': 
        generateImage(index);
      default:
        return;
    }
    
    setFocusedIndex(newIndex);
    setHoveredIndex(newIndex);
    tileRefs.current[newIndex].current.focus();

    console.log('newIndex', newIndex)

    console.log('focused',tileRefs.current[newIndex])

    const col = newIndex % columns;
    const row = Math.floor(newIndex / columns) ;
    const expectedCenterX = (col + 0.5) * 100;
    const expectedCenterY = (row + 0.5) * 100;
  
    const imageObject = savedImages.find(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
              Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });
          

    if (imageObject) {
      const sound = imageObject.sound;
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease(sound, '8n');
    }else{
      playSpatialSound(direction);
    }

  };

  const handleApiKeySubmit = () => {
    sessionStorage.setItem('apiKey', apiKey);
    setApiKey(apiKey);
    setOpenApiKeyDialog(false);
  };

  const startListening = () => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported');
        reject('Speech recognition not supported');
        return;
      }
  
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();
  
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };
  
      recognition.onresult = (event) => {
        const voiceText = event.results[0][0].transcript;
        setPromptText(voiceText); // This will still update the state asynchronously
        console.log('Detected speech:', voiceText);
        resolve(voiceText); // Resolve the promise with the voiceText
      };
  
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        reject(event.error);
      };
  
      recognition.onend = () => {
        setIsListening(false);
      };
    });
  };
  


  const fetchImageDescription = async (imageURL) => {

    let customPrompt = `
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
                  {"type": "text", "text": customPrompt},
                  {"type": "image_url", "image_url": imageURL}
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
        return data.choices[0].message.content;
      } else {
        return 'No description available';
      }
    } catch (error) {
      console.error('Error fetching image description:', error);
      return 'Error fetching description';
    }
  };

  const generateImage = async (index) => {
    setLoading(true);
    setActiveIndex(index);
  
    const notes = [
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
      'C#4', 'D#4', 'F#4', 'G#4', 'A#4',
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
      'C#5', 'D#5', 'F#5', 'G#5', 'A#5',
      'C6'
    ];
  
    const row = Math.floor(index / columns);
    const col = index % columns;
  
    const centerX = (col + 0.5) * 100;
    const centerY = (row + 0.5) * 100;
  
    console.log('Generating image...');
  
    try {
      // Assuming startListening is an async function, await its result.
      const voiceText = await startListening();
      setPromptText(voiceText);
      console.log('voceText:' , voiceText)
      console.log('Prompt Text:', promptText);
  
      if (voiceText) {
        console.log('OpenAI', openai);
        const response = await openai.createImage({
          prompt: `${voiceText} The background should be white. Only draw outlines. No color`,
          n: 1,
        });
  
        console.log('Response', response);
  
        const lengthImages = savedImages.length;
        const noteIndex = lengthImages % notes.length;
        const note = notes[noteIndex];
  
        const imageObjects = response.data.data.map(img => ({
          prompt: voiceText,
          name: `Image_${lengthImages}`,
          url: img.url,
          descriptions: '',
          coordinate: { x: centerX, y: centerY },
          sizeParts: { width: 150, height: 150 },
          sound: note
        }));
  
        for (let imageObject of imageObjects) {
          const imageURL = imageObject.url;
          const description = await fetchImageDescription(imageURL);
          imageObject.descriptions = description;
        }
  
        console.log('Image Objects', imageObjects);
  
        const updatedSavedImages = [...savedImages, ...imageObjects];
        setSavedImages(updatedSavedImages);
      } else {
        console.log("Voice text is empty.");
      }
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setLoading(false);
    }
  };


   const radarScan = (gridIndex) => {

    console.log('Size Edit grid index', gridIndex);

    const col = gridIndex % columns;
    const row = Math.floor(gridIndex / columns);
    const expectedCenterX = (col + 0.5) * 100;
    const expectedCenterY = (row + 0.5) * 100;

    const imageObjectIndex = savedImages.findIndex(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
             Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });

    console.log('Image',savedImages[imageObjectIndex]);

    const centerX = savedImages[imageObjectIndex].coordinate.x;
    const centerY = savedImages[imageObjectIndex].coordinate.y;

    const otherImages = savedImages.filter((_, index) => index !== imageObjectIndex);

    // Calculate distances from the radar center for each image
    const distances = otherImages.map((image, index) => {
    const distance = Math.sqrt(Math.pow(image.coordinate.x - expectedCenterX, 2) + Math.pow(image.coordinate.y - expectedCenterY, 2));
        return {index, distance};
    });

    distances.sort((a, b) => a.distance - b.distance);

    const playSoundAfterSpeech = (image, index) => {
      speakImageName(image.name, () => {
          console.log('Playing', image.name);
          playRadarSound(image.sound, image.coordinate.x, image.coordinate.y);
      });
    };

    distances.forEach((item, index) => {
      // Introduce delay to ensure sequential playback
      setTimeout(() => {
          const image = otherImages[item.index];
          playSoundAfterSpeech(image, index);
      }, index * 2000); // Adjust delay to account for speech duration
    });
    
   }

   const speakImageName = (text, callback) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = function(event) {
        console.log('Speech synthesis finished speaking');
        callback();
    };
    window.speechSynthesis.speak(utterance);
}

   const playRadarSound = (note, x ,y ) =>{

    const mappedX = (x - 400) / 400; // Maps 0-800 to -1 to 1
    const mappedY = (y - 400) / 400; // Maps 0-800 to -1 to 1
    const z = 0; // Fixed z-coordinate, assuming a 2D plane for simplicity

    console.log('mapped X', mappedX);
    console.log('mapped Y', mappedY);
  
    // Create a synthesizer and connect it to a Panner3D
    const synth = new Tone.Synth().toDestination();
    const panner = new Tone.Panner3D(mappedX, mappedY, z).connect(Tone.Master);
  
    // Connect the synth to the panner
    synth.connect(panner);
  
    // Play a note
    synth.triggerAttackRelease(note, '8n');
    
   }

// For the Radar Sound
// const radarScan = (index) => {
  
//   const panner3D = new Tone.Panner3D({
//     positionX: 0,
//     positionY: 0,
//     positionZ: -1
//   }).toDestination();
  
//   playerRef.current.disconnect();
//   playerRef.current.chain(panner3D, Tone.Destination);

//   let angleDegrees = 95;

//   const updateScan = () => {
//     // Convert angle from degrees to radians
//     const angleRadians = angleDegrees * (Math.PI / 180);

//     const xRadius = 30;
//     const yRadius = 30;

//     const x = xRadius * Math.cos(angleRadians);
//     const y = yRadius * Math.sin(angleRadians);
//     // const z = zRadius * Math.sin(angleRadians);

//     console.log('x',x)
//     console.log('y',y)

//     // Update the panner's position to simulate the circular motion
//     panner3D.positionX.value = x;
//     panner3D.positionY.value = y;
//     // panner3D.positionZ.value = z;

//     // Increment the angle for continuous movement
//     angleDegrees = (angleDegrees - 1 + 360) % 360;
//     playerRef.current.start();
//   };
  
//   const intervalId = setInterval(updateScan, 50); 


//   setTimeout(() => {
//     clearInterval(intervalId); 
//     playerRef.current.stop();
//   }, (360* 50)+ 500);
// };


 
  return (
    <div id='imageGeneration'>
        <div className='pageheader'>

         {/* API Key Status Indicator */}
        <div style={{ margin: '10px 10px' }}>
        <span>API Key Status:</span>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            marginLeft: '5px',
            backgroundColor: apiKeyLoaded ? 'green' : 'red',
            color: apiKeyLoaded ? 'green' : 'red',
          }}
        />
        {apiKeyLoaded ? ' Loaded' : ' Not Loaded'}
      </div>
        
        {isListening && (
          <div>
          <div style={{ color: 'green', fontWeight: 'bold' }}>Record the Prompt to Create the Image..</div>
          <div style={{ color: 'green', fontWeight: 'bold' }}>Listening...</div>
          </div>
        )}
        {promptText && (
          <div style={{ marginTop: '10px' }}>
            <strong>Recent Pixel Prompt:</strong> {promptText}
          </div>
        )} 
   
        <button onClick={toggleInstructions} style={{ marginBottom: '10px', padding :'0.5rem', fontWeight:'200' }}>
          {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
        </button>
        {showInstructions && (
        <div className="instructions" style={{fontSize: '0.8rem'}}>
        <h3>Instructions</h3>
            <h4><strong>Creating and Editing Images:</strong></h4>
            <br/>
            <ol>
                <li><strong>Selecting a Tile:</strong>
                    <ul>
                        <li>Browse through the Pixel Tiles on the screen.</li>
                        <li>Choose a tile where you wish to create your image.</li>
                        <li>Press the <strong>Enter</strong> key to initiate the image creation process by recording a prompt.</li>
                        <li>On tiles with an image, you can hear the unique sound associated with it as you navigate.</li>
                        <li>Use the <strong>arrow keys</strong> to navigate through the image.</li>
                    </ul>
                </li>
                <br/>
                <li><strong>Listening to Image Sounds:</strong>
                    <ul>
                        <li>Once an image is created in a tile, you can hear a unique sound associated with that image as you navigate through the tiles</li>
                    </ul>
                </li>
                <br/>
                <li><strong>Editing Image Location:</strong>
                    <ul>
                        <li>To adjust an image's position on the canvas, click the <strong>Edit Location</strong> button.</li>
                        <li>Use the <strong>arrow keys</strong> to move the object to a new location.</li>
                        <li>The object's new position will be updated on the grid.</li>
                        <li>To exit location editing mode, press the <strong>Escape</strong> key.</li>
                    </ul>
                </li>
                <br/>
                <li><strong>Editing Image Size:</strong>
                    <ul>
                        <li>To change the size of an image on the canvas, click the <strong>Edit Size</strong> button.</li>
                        <li>Use the <strong>up and down arrow keys</strong> to adjust the image's size.</li>
                        <li>Press the <strong>Escape</strong> key to exit size editing mode.</li>
                    </ul>
                </li>
            </ol>
            <br/>
            <h4><strong>Additional Features:</strong></h4>
            <br/>
            <ul>
                <li><strong>Hearing Image Descriptions:</strong> Press the <strong>Image Description</strong> button to hear a spoken description of the image.</li>
                <li><strong>Changing the Image:</strong> To replace the image on a selected tile, press the <strong>Enter</strong> key again.</li>
            </ul>
            <p>Remember to exit editing modes (location or size) by pressing the <strong>Escape</strong> key when you're done with adjustments.</p>
        </div>
        )}
    </div>

      <Dialog open={openApiKeyDialog} onClose={() => {}} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Enter API Key</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter your API key to proceed.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="apiKey"
            label="API Key"
            type="text"
            fullWidth
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApiKeySubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      <div className='mainContainer'>
        <div className="leftContainer" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(30px, 8vw))`,
          gridTemplateRows: `repeat(${rows}, minmax(30px, 8vw))`, 
          gap: '7px', 
        }}>
        {gridItems.map((item, index) => {
          const isFocused = focusedIndex === index;

          const col = index % columns;
          const row = Math.floor(index / columns);
          const expectedCenterX = (col + 0.5) * 100;
          const expectedCenterY = (row + 0.5) * 100;
        
          const imageObject = savedImages.find(img => {
            return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
                   Math.abs(img.coordinate.y - expectedCenterY) <= 50;
          });
          
          const hasImage = Boolean(imageObject);
        
          
          return (
            <div 
              className="pixel" 
              tabIndex="0"
              key={index}
              ref={tileRefs.current[index]}
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                position: 'relative',
              }} 
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => {
                setFocusedIndex(index);
                if (hasImage && playerRef.current) {
                  playerRef.current.start();  
                }
              }}
              onBlur={() => setFocusedIndex(null)}
              onKeyDown={(event) => tileNavigation(event, index)}
            >
              {hasImage && (
                <img src={imageObject.url} alt="Generated" style={{ 
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }} />
              )}
              
              {hasImage && (
                <div>
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    display: 'grid',
                    backgroundColor: 'rgba(30, 144, 255, 0.3)',
                    gridTemplateColumns: '50% 50%',
                    gridTemplateRows: '50% 50%',
                    placeItems: 'center',
                    pointerEvents: 'none',
                  }}>
                    <button 
                      tabIndex= "0"
                      aria-label="Edit Location" 
                      style={{pointerEvents: 'auto' , zIndex:'100', gridArea: '1 / 1 / 2 / 2' }} 
                      onClick={enterLocationEditMode(index)} >
                      <ZoomOutMapIcon />
                    </button>

                    <button 
                      tabIndex= "0" 
                      aria-label="Edit Size"
                      style={{ pointerEvents: 'auto' , zIndex:'100', gridArea: '1 / 2 / 2 / 3' }} 
                      onClick={enterSizeEditMode(index)}>
                      <PhotoSizeSelectLargeIcon />
                    </button>

                    <button 
                      tabIndex= "0" 
                      aria-label="Image Description" 
                      style={{pointerEvents: 'auto' , zIndex:'100', gridArea: '2 / 1 / 3 / 2' }} 
                      onClick={() => playDescription(index)}> 
                      <InfoIcon />
                    </button>

                    <button 
                      tabIndex= "0" 
                      aria-label="Radar Scan" 
                      style={{pointerEvents: 'auto' , zIndex:'100', gridArea: '2 / 2 / 3 / 3' }}
                      onClick={() => radarScan(index)} ><RadarIcon />
                    </button>
                    
                  </div>
                  
                </div>
              )}

              {hoveredIndex === index && !imageObject && (!loading || activeIndex !== index) && (
                <AddCircleIcon style={{ color: '#1E90FF', fontSize: '3vw' }} />
              )}
              {loading && activeIndex === index && <MoonLoader />}
            </div>
          );
        })}
        
        </div>
      
        <div className="rightContainer">
            <div id="canvas" ref={canvasRef} style={{ position: 'relative', width: '88%', height: '88%', border: '1px solid black' }} tabIndex={0}>

                <div id="verticalBar" style={{ position: 'absolute', left: `${verticalBarX}px`, top: `${verticalBarY}px`, width: '10px', height: '100%', backgroundColor: 'red' }}></div>

                <div id="horizontalBar" style={{ position: 'absolute', left: `${horizontalBarX}px`, top: `${horizontalBarY}px`,   width: '100%', height: '10px', backgroundColor: 'blue' }}></div>


                {savedImages.map((image, index) => (
                  <div key={index} style={{ position: 'absolute', left: `${image.coordinate.x}px`, top: `${image.coordinate.y}px` }}
                  tabIndex={0} onMouseDown={handleMouseDownOnImage(index)}  >
                    <img
                      src={image.url}
                      alt={`Generated Content ${index}`}
                      style={{
                        width: image.sizeParts.width + 'px',
                        height: image.sizeParts.height + 'px',
                        cursor: 'move', 
                      }}
                    />
                  </div>
                ))}
            
            </div>
        </div>


        
      </div>    

    </div>
  );
};