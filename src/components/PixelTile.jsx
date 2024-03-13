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
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
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

  const [radarActive, setRadarActive] = useState(false); 
  const [locationEditActive, setlocationEditActive] = useState(false);
  const [sizeEditActive, setsizeEditActive] = useState(false);
  const [chatActive, setchatActive] = useState(false);
  const [infoActive, setinfoActive] = useState(false); 
  const apiKey = process.env.REACT_APP_API_KEY;

  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const toggleShortcuts = () => setShowShortcuts(!showShortcuts);

  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  useEffect(() => {
    // This assumes your grid items are set and thus, the refs should be attached.
    if (tileRefs.current[0]) {
      tileRefs.current[0].current?.focus();
    }
  }, [gridItems]); // Depend on gridItems to ensure refs are assigned
  
  
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
      console.log('canvas Focused for location edit')
      
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
  }, [isEditingLocation]);

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

  const enterLocationEditMode = (gridIndex) => {

    console.log('enter Locaiton Edit MODEEE')
  
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

  const enterSizeEditMode = (gridIndex) => {

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

const speakNoTileFocusedMessage = () => {
  const message = "No tile is focused.";

  // Check if the browser supports speech synthesis
  if ('speechSynthesis' in window) {
    // Create a new instance of SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(message);

    // Optional: Configure the utterance properties
    utterance.lang = 'en-US'; // Set the language
    utterance.rate = 1; // Set the speed, can be from 0.1 to 10
    utterance.pitch = 1; // Set the pitch, can be from 0 to 2

    // Speak the utterance
    window.speechSynthesis.speak(utterance);
  } else {
    console.log("Speech synthesis not supported in this browser.");
  }
};


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && e.key === 'R') {
        if (focusedIndex !== null) {
          console.log('Radar Scan Activated');
          console.log('Focused Index', focusedIndex);
          setRadarActive(true); // Step 2: Activate radar
          
          radarScan(focusedIndex);

          setTimeout(() => {
            setRadarActive(false);
        }, 3000); 
        } else {
          speakNoTileFocusedMessage();
          console.log("No tile is focused.");
        }
      } else if (e.shiftKey && e.key === 'L') {
          if (focusedIndex !== null) {
            console.log('Location Edit Activated');
            console.log('Focused Index', focusedIndex);
            setlocationEditActive(true); 

            console.log('enter Locaiton Edit MODEEE    -1')
            enterLocationEditMode(focusedIndex);

            setTimeout(() => {
              setlocationEditActive(false);
            }, 3000); 
          } else {
            speakNoTileFocusedMessage();
            console.log("No tile is focused.");
          }
      } else if (e.shiftKey && e.key === 'S') {
        if (focusedIndex !== null) {
          console.log('Size Edit Activated');
          console.log('Focused Index', focusedIndex);
          setsizeEditActive(true); 

          enterSizeEditMode(focusedIndex);

          setTimeout(() => {
            setsizeEditActive(false);
          }, 3000); 
        } else {
          speakNoTileFocusedMessage();
          console.log("No tile is focused.");
        }
      } else if (e.shiftKey && e.key === 'I') {
        if (focusedIndex !== null) {
          console.log('Info Activated');
          console.log('Focused Index', focusedIndex);
          setinfoActive(true); 

          readInfo(focusedIndex);

          setTimeout(() => {
            setinfoActive(false);
          }, 3000); 
        } else {
          speakNoTileFocusedMessage();
          console.log("No tile is focused.");
        }
      }  else if (e.shiftKey && e.key === 'C') {
        if (focusedIndex !== null) {
          console.log('Chat Activated');
          console.log('Focused Index', focusedIndex);
          setchatActive(true); 

          imageChat(focusedIndex);

          setTimeout(() => {
            setchatActive(false);
          }, 3000); 
        } else {
          speakNoTileFocusedMessage();
          console.log("No tile is focused.");
        }
      } 
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex]); // Include radarActive if you use it in radarScan or elsewhere


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

  const readInfo = (gridIndex) => {
    const col = gridIndex % columns;
    const row = Math.floor(gridIndex / columns);
    const expectedCenterX = (col + 0.5) * 100;
    const expectedCenterY = (row + 0.5) * 100;


    const imageObjectIndex = savedImages.findIndex(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
             Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });

    const image = savedImages[imageObjectIndex];

    console.log("Reading ...",image)

    const script = `
      The image is called ${image.name}
      The image is a ${image.descriptions}
      It is located ${image.coordinate.x} and ${image.coordinate.y} 
      The size of the image is ${image.sizeParts.width}
    `
    speakDescription(script);

  };

  const speakDescription = (description) => {
    // Create a new instance of SpeechSynthesisUtterance
    var speech = new SpeechSynthesisUtterance(description);
  
    // Optionally, set some parameters
    speech.rate = 1; // Speed of speech
    speech.pitch = 1; // Pitch of speech
    speech.volume = 1; // Volume
  
    // Use the speech synthesis interface to speak the description
    window.speechSynthesis.speak(speech);
  };


  
  const imageChat = async (gridIndex) => {
    
    const col = gridIndex % columns;
    const row = Math.floor(gridIndex / columns);
    const expectedCenterX = (col + 0.5) * 100;
    const expectedCenterY = (row + 0.5) * 100;

    const imageObjectIndex = savedImages.findIndex(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
             Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });

    console.log('check of chat image matches',savedImages[imageObjectIndex] )

    const imageURL = savedImages[imageObjectIndex].url;

    console.log('imageURL',imageURL)

    const voiceText = await startListening();
    setPromptText(voiceText);
    console.log('voceText:' , voiceText)

    let customPrompt = `
    You are describing an image to a Visually Impaired Person.
    Generate the given image description according to the following criteria:
    Briefly describe the primary subject or focus of the image in one sentence. ${voiceText}
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
    console.log('fetched',data);

    if (data.choices && data.choices.length > 0) {
      console.log(data.choices[0].message.content );
      const description = data.choices[0].message.content;
      speakDescription(description);
      return data.choices[0].message.content;
    } else {
      return 'No description available';
    }
  } catch (error) {
    console.error('Error fetching image description:', error);
    return 'Error fetching description';
  }


  }


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

  const removeImageAtIndex = (gridIndex) => {

    const col = gridIndex % columns;
    const row = Math.floor(gridIndex / columns);
    const expectedCenterX = (col + 0.5) * 100;
    const expectedCenterY = (row + 0.5) * 100;

    const imageObjectIndex = savedImages.findIndex(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
             Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });

    console.log('imageObjectIndex', imageObjectIndex);
    // Assuming savedImages is stored in your component's state
    let updatedSavedImages = [...savedImages];
    
    // Remove the image at the specified index
    updatedSavedImages.splice(imageObjectIndex, 1);
    
    // Update the state with the new array of images
    setSavedImages(updatedSavedImages);
  };

  const updateImageAtIndex = (gridIndex, newImageObject) => {
    const col = gridIndex % columns;
    const row = Math.floor(gridIndex / columns);
    const expectedCenterX = (col + 0.5) * 100;
    const expectedCenterY = (row + 0.5) * 100;

    const imageObjectIndex = savedImages.findIndex(img => {
      return Math.abs(img.coordinate.x - expectedCenterX) <= 50 &&
             Math.abs(img.coordinate.y - expectedCenterY) <= 50;
    });

    // Create a copy of the current savedImages array to avoid direct state mutation
    let updatedSavedImages = [...savedImages];
    
    // Replace the image at the specified index with the new image object
    updatedSavedImages[imageObjectIndex] = newImageObject;
    
    // Update the state with the modified array
    setSavedImages(updatedSavedImages);
  };
  
  const generateImage = async (index, isRegeneration = false) => {
    setLoading(true);
    setActiveIndex(index);

    if (isRegeneration) {
      // Assuming there's a method to remove the old image by index
      removeImageAtIndex(index);
      // Assuming there's a mechanism to regenerate the image
      console.log('Regenerating image at index:', index);
    }
  
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
  
        if (isRegeneration) {
          // Update the specific image instead of appending a new one
          updateImageAtIndex(index, imageObjects[0]);
        } else {
          // Append new images as before
          const updatedSavedImages = [...savedImages, ...imageObjects];
          setSavedImages(updatedSavedImages);
        }
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

        <div className="keyboard-shortcuts" style={{marginBottom: '2%'}}>
        <h2>Keyboard Shortcuts</h2>
        <ul>
          <li>
            <kbd>Shift</kbd> + <kbd>R</kbd>: Activate Radar Scan - Scans the currently focused tile for additional information.
          </li>
          <li>
            <kbd>Shift</kbd> + <kbd>L</kbd>: Location Edit Mode - Allows you to edit the location of the currently selected item.
          </li>
          <li>
            <kbd>Shift</kbd> + <kbd>S</kbd>: Size Edit Mode - Adjust the size of the currently selected item.
          </li>
          <li>
            <kbd>Shift</kbd> + <kbd>I</kbd>: Info - Displays detailed information about the currently selected item.
          </li>
          <li>
            <kbd>Shift</kbd> + <kbd>C</kbd>: Chat - Opens a chat window related to the currently selected item.
          </li>
        </ul>
        <p>Note: These shortcuts require a tile to be focused. If no tile is focused, a voice prompt will indicate that no tile is selected.</p>
      </div>
      
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
                document.querySelector('[aria-live="polite"]').textContent = `Pixel ${index + 1} focused.`;
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

                  {radarActive && isFocused && (
                    <div>
                      <RadarIcon  
                      style ={{
                        width: '50%', // Adjust the size as needed
                        height: '50%',            
                        position: 'absolute',
                        top: '25%',
                        left: '25%',
                        color:'royalblue'}}
                        /> 
                    </div>
                  )}

                  {chatActive && isFocused && (
                    <div>
                      <QuestionAnswerIcon  
                      style ={{
                        width: '50%', // Adjust the size as needed
                        height: '50%',            
                        position: 'absolute',
                        top: '25%',
                        left: '25%',
                        color:'royalblue'}}
                        /> 
                    </div>
                  )}

                  {locationEditActive && isFocused && (
                    <div>
                      <ZoomOutMapIcon  
                      style ={{
                        width: '50%', // Adjust the size as needed
                        height: '50%',            
                        position: 'absolute',
                        top: '25%',
                        left: '25%',
                        color:'royalblue'}}
                        /> 
                    </div>
                  )}

                  {sizeEditActive && isFocused && (
                    <div>
                      <PhotoSizeSelectLargeIcon  
                      style ={{
                        width: '50%', // Adjust the size as needed
                        height: '50%',            
                        position: 'absolute',
                        top: '25%',
                        left: '25%',
                        color:'royalblue'}}
                        /> 
                    </div>
                  )}

                  {infoActive && isFocused && (
                    <div>
                      <InfoIcon  
                      style ={{
                      width: '50%', // Adjust the size as needed
                      height: '50%',            
                      position: 'absolute',
                      top: '25%',
                      left: '25%',
                      color:'royalblue'}}
                      /> 
                    </div>
                  )}
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

        <div>
          <button 
            className="floating-button"
            onClick={toggleShortcuts}>
            Keyboard Shortcuts
          </button>

          {showShortcuts && (
            <div className="shortcuts-list">
              {/* Your shortcuts list here, as previously described */}
              <h2>Keyboard Shortcuts</h2>
              <ul>
                <li>
                  <kbd>Shift</kbd> + <kbd>R</kbd>: Activate Radar Scan to learn about the position of the other elements around the image.
                </li>
                <li>
                  <kbd>Shift</kbd> + <kbd>L</kbd>: Location Edit Mode - Allows you to edit the location of the currently selected item.
                </li>
                <li>
                  <kbd>Shift</kbd> + <kbd>S</kbd>: Size Edit Mode - Adjust the size of the currently selected item.
                </li>
                <li>
                  <kbd>Shift</kbd> + <kbd>I</kbd>: Info - Hear detailed information about the currently selected item.
                </li>
                <li>
                  <kbd>Shift</kbd> + <kbd>C</kbd>: Chat and ask questions about the current image in the tab
                </li>
              </ul>
              <p>Note: These shortcuts require a tile to be focused. If no tile is focused, a voice prompt will indicate that no tile is selected.</p>
            </div>
          
          )}
        </div>


        
      </div>    

    </div>
  );
};
