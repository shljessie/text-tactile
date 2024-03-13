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

export const PixelTileNew = () => {
  const apiKey = process.env.REACT_APP_API_KEY;

  // Canvas Width & Height Setting
  const [canvasSize, setCanvasSize] = useState({ width: '0%', height: '0%' }); 
  const [openDialog, setOpenDialog] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const canvasRef = useRef(null);

  // Generating first image on tile
  const firstTileRef = useRef(null);
  const [tiles, setTiles] = useState([{ id: 0, image: {} }]);

  // loading and generation feedback 
  // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let loadingSoundSource = null;
  const [loading, setLoading] = useState(false);

//  ==========================

  const [showInstructions, setShowInstructions] = useState(true);

  const [isListening, setIsListening] = useState(false);

  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(5);
  const [gridItems, setGridItems] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(null);

  const [activeIndex, setActiveIndex] = useState(null);

  const [openai, setOpenai] = useState();
  const [promptText, setPromptText] = useState('');

  const tileRefs = useRef([]);
  const playerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
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


  const speakMessage = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
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
    const savedCanvasSize = JSON.parse(localStorage.getItem('canvasSize'));
    if (savedCanvasSize) {
      setCanvasSize(savedCanvasSize);
    } else {
      setOpenDialog(true);
    }
  }, []);

  useEffect(() => {
    if (firstTileRef.current) {
      firstTileRef.current.focus();
    }
  }, []);

  const handleClose = () => {
    setOpenDialog(false);
  };

  const handleSave = (width, height) => {
    setCanvasSize({ width: `${width}px`, height: `${height}px` });
    localStorage.setItem('canvasSize', JSON.stringify({ width: `${width}px`, height: `${height}px` }));
    setOpenDialog(false);
  };

  useEffect(() => {
    if (savedImages.length === 1) {
      const updatedTiles = tiles.map((tile, index) => ({
        ...tile,
        image: savedImages[0],
      }));
      setTiles(updatedTiles);
    } else if (savedImages.length > 1) {
      const additionalImages = savedImages.slice(tiles.length);
      const newTiles = additionalImages.map((img, index) => ({
        id: tiles.length + index,
        image: img,
      }));
      setTiles(tiles => [...tiles, ...newTiles]);
    }
  }, [savedImages]);

  // ====================================



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
          case 'Escape':
            setIsEditingLocation(false);
            setEditingImageIndex(null);
            speakMessage("Location mode exited");
            return;
          default: 
            speakMessage("You are still on Location Edit mode. Press ESC to exit the Location Edit mode first.");
            return; // Ignore other keys
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

  //  ==============================

  // For Loading and Image Gneration feedback
  let isGeneratingImage = false; 
  
  const startLoadingSound = async(voiceText) => {
    await Tone.start();
    isGeneratingImage = true;

    const speak = () => {
        if (!isGeneratingImage) return;

        const utterance = new SpeechSynthesisUtterance(` Please wait a moment. Generating image based on prompt : ${voiceText}.`);
        utterance.pitch = 1;
        utterance.rate = 0.8;
        utterance.volume = 0.5; 

        utterance.onend = () => {
            setTimeout(() => {
                speak();
            }, 2000);
        };

        window.speechSynthesis.speak(utterance);
    };

    speak();
  };


  function stopLoadingSound() {
      if (loadingSoundSource) {
          loadingSoundSource.stop();
          loadingSoundSource = null;
      }
  }

  //  ==============================
  
  
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
        speakMessage("Size Edit mode exited");
        return;
      default:
        speakMessage("You are still on Size Edit mode. Press ESC to exit the size edit mode first.");
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

  const tileNavigation = (event, index, isRegeneration=false) => {

    console.log('isRegeneration' , isRegeneration)

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
        generateImage(index, isRegeneration);
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
  
    if(gridIndex !== -1) {
      setIsEditingLocation(true);
      setEditingImageIndex(gridIndex);
      canvasRef.current.focus();
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

  const playModeNotification = (message, callback) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.onend = function(event) {
      if (callback) {
        callback(); // Execute the callback function after the message is spoken
      }
    };
    window.speechSynthesis.speak(utterance);
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log('focused Index', focusedIndex)
      if (e.shiftKey && e.key === 'R') {
        if (focusedIndex !== null) {
          console.log('Radar Scan Activated');
          console.log('Focused Index', focusedIndex);
          setRadarActive(true);
          
          playModeNotification("Radar Scan Activated. You will hear relative location of other objects on the canvas.", () => {
            radarScan(focusedIndex); 
          });

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
            playModeNotification("Location Edit Activated. Press the arrow keys to edit the location of the object.");

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
          playModeNotification("Size Edit Activated. Press the up down arrow keys to edit the size of the object.");

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

          playModeNotification("Read Info Mode Activated.", () => {
            readInfo(focusedIndex);
          });

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

          playModeNotification("Chat Activated. Ask a question about the image", () => {
            imageChat(focusedIndex);
          });

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
  }, [focusedIndex]);

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
    
    const image = savedImages[gridIndex];

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
  
    console.log('check of chat image matches',savedImages[gridIndex] )

    const imageURL = savedImages[gridIndex].url;

    console.log('imageURL',imageURL)

    const voiceText = await startListening();
    setPromptText(voiceText);
    console.log('voceText:' , voiceText)

    speakMessage(`You have asked: ${voiceText}.`)

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

  async function playImageSound(note) {
    await Tone.start();
    const synth = new Tone.Synth().toDestination();

    synth.triggerAttackRelease(note, "8n");
}
  
  const generateImage = async (index, isRegeneration = false) => {
    setLoading(true);
    setActiveIndex(index);

    if (isRegeneration) {
      removeImageAtIndex(index);
      console.log('Regenerating image at index:', index);
    }
  
    const notes = [
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
      'C#4', 'D#4', 'F#4', 'G#4', 'A#4',
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
      'C#5', 'D#5', 'F#5', 'G#5', 'A#5',
      'C6'
    ];

    // TOODO
  
    const row = Math.floor(index / columns);
    const col = index % columns;
  
    const centerX = (col + 0.5) * 100;
    const centerY = (row + 0.5) * 100;
  
    console.log('Generating image...');
  
    try {

      const voiceText = await startListening();
      setPromptText(voiceText);
      console.log('voceText:' , voiceText)
      console.log('Prompt Text:', promptText);
  
      if (voiceText) {
        console.log('OpenAI', openai);
        
        startLoadingSound(voiceText);
        
        const response = await openai.createImage({
          prompt: `${voiceText} The background should be white. Only draw thick outlines. No color`,
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
  
        isGeneratingImage = false;
        stopLoadingSound();

        let imageDescription = `${imageObjects[0].name} has been created. ${imageObjects[0].descriptions}. The sound of ${imageObjects[0].name} is `;
        let utterance = new SpeechSynthesisUtterance(imageDescription);
        const imageNote = imageObjects[0].sound;

  
        if (isRegeneration) {
          updateImageAtIndex(index, imageObjects[0]);
          speechSynthesis.speak(utterance);

          utterance.onend = function(event) {
            console.log('Speech synthesis finished.');
            playImageSound(imageNote);
          };

          setFocusedIndex(index);

        } else {
          const updatedSavedImages = [...savedImages, ...imageObjects];
          setSavedImages(updatedSavedImages);
          speechSynthesis.speak(utterance);

          utterance.onend = function(event) {
            console.log('Speech synthesis finished.');
            playImageSound(imageNote); 
          };
          setFocusedIndex(index);
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

 
  return (
    <div id='imageGeneration'>

      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>Set Canvas Size</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the width and height for the canvas.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="width"
            label="Canvas Width (px)"
            type="number"
            fullWidth
            variant="standard"
          />
          <TextField
            margin="dense"
            id="height"
            label="Canvas Height (px)"
            type="number"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            const width = document.getElementById('width').value;
            const height = document.getElementById('height').value;
            handleSave(width, height);
          }}>Save</Button>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <div className='mainContainer'>
        <div 
          className="leftContainer">

          <div id="tileContainer" ref={canvasRef} style={{ 
            display: 'flex', // Use Flexbox
            justifyContent: 'center', // Center horizontally
            alignItems: 'center', // Center vertically
            position: 'relative', 
            ...canvasSize, 
            border: '1px solid black' }} tabIndex={0}>

            

              {tiles.map((tile, index) => (
                <div
                  key={tile.id}
                  onKeyDown={(event) => {
                    setFocusedIndex(index)
                    if (savedImages[index]) {
                      tileNavigation(event, index, true);
                    }else{
                      tileNavigation(event, index, false);
                    }
                  }}
                  tabIndex={0}
                  style={{
                    border: '1px solid black', 
                    width: '10%', 
                    height: "10%",
                    margin: '5px',
                    display: 'flex', // Use Flexbox
                    justifyContent: 'center', // Center horizontally
                    alignItems: 'center', // Center vertically 
                    
                  }}
                  ref={index === 0 ? firstTileRef : null} 
                >
                  {loading && activeIndex === index ? (
                    <MoonLoader size={50}/>
                  ) : (
                    <img src={savedImages[index]?.url} alt="" style={{ width: '100%', height: '100%', border:'0px' }} />
                  )}
                </div>
              ))}
              
          </div>

        
        </div>
      
        <div className="rightContainer">
              <div id="canvas" ref={canvasRef} style={{ position: 'relative', ...canvasSize, border: '1px solid black' }} tabIndex={0}>
                  {savedImages.map((image, index) => (
                    <div key={index} style={{ position: 'absolute', left: `${image.coordinate.x}px`, top: `${image.coordinate.y}px` }}
                    tabIndex={0} onMouseDown={handleMouseDownOnImage(index)}>
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