/* eslint-disable no-unused-vars */
import * as Tone from 'tone';

import React, { useEffect, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import HelpIcon from '@mui/icons-material/Help';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { MoonLoader } from 'react-spinners';
import PaletteIcon from '@mui/icons-material/Palette';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const initialGraphicsMode = localStorage.getItem("graphicsMode") || "color";
const initialSpeechSpeed = parseFloat(localStorage.getItem("speechSpeed")) || 0.9;

export const SonicTiles = () => {
  
  const [settingsOpen, setOpenSettings] = useState(false);
  const [graphicsMode, setGraphicsMode] = useState(initialGraphicsMode);
  const [speechSpeed, setSpeechSpeed] = useState(initialSpeechSpeed);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [copiedImage, setCopiedImage] = useState(null);
  const [canvasQuestionActive, setCanvasQuestionActive] = useState(false);
  const [canvasDescriptionActive, setCanvasDescriptionActive] = useState(false);


  // Update localStorage when settings change
  useEffect(() => {
    localStorage.setItem("graphicsMode", graphicsMode);
  }, [graphicsMode]);

  useEffect(() => {
    localStorage.setItem("speechSpeed", speechSpeed);
  }, [speechSpeed]);

  useEffect(() => {
    setOpenSettings(false);
  }, []);

  const handleSettingsClose = () => {
      setOpenSettings(false);
  };


  const getUuid = () => {
    let uuid = localStorage.getItem('uuid');
    if (!uuid) {
      uuid = uuidv4();
      localStorage.setItem('uuid', uuid);
    }
    return uuid;
  };
  
  const sendUuidToServer = async () => {
    const uuid = getUuid();

    try {
      const response = await axios.post('/api/sonic', {
        uuid: uuid,
      });
      console.log('Server response:', response.data);
    } catch (error) {
      console.error('Error sending UUID to the server:', error);
    }
  };

  function roundToNearest100(x) {
    return Math.round(x / 100) * 100;
  }

  const [canvasSize, setCanvasSize] = useState({
    width:  roundToNearest100(window.innerWidth * 0.35)+ 100,
    height: roundToNearest100(window.innerWidth * 0.35)+ 100,
  });
  
  const tileSize = Math.round(canvasSize['width'] / 10);
  let messagePlayed =false

  const printCanvas = () => {
    const canvasElement = document.getElementById('canvas');
    console.log('Canvas element:', canvasElement);
    if (!canvasElement) {
      console.error('No element with id "canvas" found.');
      return;
    }

    // Notify user that rendering is in progress
    speakMessage("Creating a printable version of your canvas");
    
    // Instead of using html2canvas directly, let's create our own canvas
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      const ctx = canvas.getContext('2d');
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create a counter to track loaded images
      let totalImages = savedImages.length;
      let loadedImages = 0;
      
      // If no images, just show an empty canvas
      if (totalImages === 0) {
        completePrintProcess(canvas);
        return;
      }
      
      // Load all images manually to avoid CORS issues
      savedImages.forEach(image => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // When image loads, draw it on canvas
        img.onload = () => {
          const x = image.canvas.x - (image.sizeParts.width / 2);
          const y = image.canvas.y - (image.sizeParts.height / 2);
          ctx.drawImage(img, x, y, image.sizeParts.width, image.sizeParts.height);
          
          loadedImages++;
          if (loadedImages === totalImages) {
            completePrintProcess(canvas);
          }
        };
        
        // If image fails to load, draw a placeholder
        img.onerror = () => {
          console.error('Failed to load image:', image.image_nbg || image.url);
          
          // Draw a placeholder rectangle
          const x = image.canvas.x - (image.sizeParts.width / 2);
          const y = image.canvas.y - (image.sizeParts.height / 2);
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(x, y, image.sizeParts.width, image.sizeParts.height);
          ctx.strokeStyle = '#999';
          ctx.strokeRect(x, y, image.sizeParts.width, image.sizeParts.height);
          ctx.fillStyle = '#999';
          ctx.font = '14px Arial';
          ctx.fillText(image.name || 'Image', x + 10, y + image.sizeParts.height / 2);
          
          loadedImages++;
          if (loadedImages === totalImages) {
            completePrintProcess(canvas);
          }
        };
        
        // Always use proxied images to avoid CORS issues
        let imgSrc = image.image_nbg || image.url;
        
        // Use our proxy for any external images to avoid CORS issues
        if (imgSrc.includes('oaidalleapiprodscus.blob.core.windows.net') || 
            imgSrc.includes('localhost:3001/images/') ||
            imgSrc.startsWith('https://')) {
          // Proxy the image through our server
          const encodedUrl = encodeURIComponent(imgSrc);
          img.src = `/proxy-image?url=${encodedUrl}`;
        } else {
          // For data URLs or relative paths, use directly
          img.src = imgSrc;
        }
      });
    } catch (error) {
      console.error('Error creating canvas:', error);
      speakMessage("There was an error creating the printable version. Trying alternative method.");
      // Fallback to the navigation method
      renderCanvas();
    }
    
    // Function to complete the print process with the canvas
    function completePrintProcess(canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        
        // Create a dedicated print window with better styling
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Please allow pop-ups to print the canvas');
          return;
        }
        
        printWindow.document.open();
        printWindow.document.write(`
          <html>
            <head>
              <title>Canvas Render</title>
              <style>
                @media print {
                  body { margin: 0; padding: 0; }
                  img { 
                    display: block;
                    max-width: 100%; 
                    page-break-inside: avoid;
                    margin: 0 auto;
                  }
                  .print-container {
                    text-align: center;
                    width: 100%;
                    height: 100%;
                  }
                  .controls { display: none; }
                }
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: Arial, sans-serif;
                  background-color: #f0f0f0;
                }
                .print-container {
                  background-color: white;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  padding: 20px;
                  margin: 0 auto;
                  max-width: ${canvasSize.width + 40}px;
                  border-radius: 5px;
                }
                img { 
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 0 auto;
                  border: 1px solid #eee;
                }
                .controls {
                  margin: 20px 0;
                  text-align: center;
                }
                button {
                  padding: 10px 20px;
                  background-color: #1E90FF;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 16px;
                  margin: 0 5px;
                }
                button:hover {
                  background-color: #0c7cd5;
                }
                h2 {
                  text-align: center;
                  color: #444;
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                <h2>Canvas Render</h2>
                <img id="render-image" src="${dataUrl}" alt="Canvas Render" />
                <div class="controls">
                  <button onclick="window.print();">Print</button>
                  <button onclick="window.close();">Close</button>
                  <button onclick="downloadImage();">Download as Image</button>
                </div>
              </div>
              <script>
                function downloadImage() {
                  const link = document.createElement('a');
                  link.download = 'canvas-render-${new Date().toISOString().slice(0, 10)}.png';
                  link.href = document.getElementById('render-image').src;
                  link.click();
                }
                
                // Auto-adjust image to window size
                window.onload = function() {
                  const img = document.getElementById('render-image');
                  if (img.naturalWidth > window.innerWidth * 0.8) {
                    img.style.width = '80%';
                  }
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        speakMessage("Canvas has been rendered. You can now print or download it.");
      } catch (error) {
        console.error('Error creating printable version:', error);
        speakMessage("There was an error creating the printable version. Trying alternative method.");
        // Fallback to the navigation method
        renderCanvas();
      }
    }
  };

  useEffect(() => {

    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }

    sendUuidToServer();
    const uuid=  localStorage.getItem('uuid');

    tileRefs.current[0].focus()
    if(!messagePlayed){
      speakMessage('You are currently focused on the first tile. Press Enter to Generate the first Image and then speak the image generation command after the beep.')
      messagePlayed = true;
    }

    // Add event listeners
    window.addEventListener('beforeunload', performRefreshAction);
    window.addEventListener('keydown', defaultKeyOptions);

    return () => {
      window.removeEventListener('beforeunload', performRefreshAction);
      window.removeEventListener('keydown', defaultKeyOptions);
    };

  }, []);

  const commands = [
    "Command One,  Enter: Generate/regenerate image on a tile",
    "Command Two, Shift + D as in Description: Hear the description of the entire canvas",
    "Command Three, D as in Description: Hear the image information about selected item on the tile",
    "Command Four, Q as in Question: Ask a question about the image on the tile",
    "Command Five, Shift + L as in Location: Enter Location Edit Mode",
    "Command Six, Shift + S as in Size: Enter Size Edit Mode",
    "Command Seven,  Shift + R as in Radar: Radar scan for nearby objects",
    "Command Eight, Shift + T as in Type: Render Final Canvas",
    "Command Nine, Shift + K as in Keyboard: Hear Keyboard Instructions",  
    "Command Ten, Shift + X as Xylophone: Delete Image",
    "Command Eleven, Shift + ? as Question: Ask a question about how to use AltCanvas",
    "Command Twelve, Shift + H as Instructions: Open Instructions",
    "Command Thirteen, Shift + P as Settings: Open Settings",
    "Command Fourteen, Shift + Z as in Zap: Clear the entire canvas",
    "Command Fifteen, Ctrl + C: Copy the selected image",
    "Command Sixteen, Ctrl + V: Paste the copied image",
    "Command Seventeen, Escape: Exit any mode"
  ];

  // Add action-oriented command descriptions
  const actionCommands = [
    "Generate Image: Press Enter on a tile to generate an image",
    "Exit Mode: Press Escape to exit any mode or to stop the AI from speaking",
    "Canvas Description: Press Shift+D to hear a description of the entire canvas",
    "Canvas Question: Press Shift+Q to ask questions about the entire canvas",
    "Image Description: Press D to hear details about the selected image",
    "Image Chat: Press Q to ask questions about the selected image",
    "Location Edit: Press Shift+L, then use arrow keys to move the image",
    "Size Edit: Press Shift+S, then use up/down arrow keys to change size",
    "Radar Scan: Press Shift+R to hear about nearby objects",
    "Render Canvas: Press Shift+T to render the final canvas",
    "Keyboard Commands: Press Shift+K to hear these instructions",
    "Delete Image: Press Shift+X to delete the selected image",
    "Clear Canvas: Press Shift+Z to clear the entire canvas",
    "Copy Image: Press Ctrl+C to copy the selected image",
    "Paste Image: Press Ctrl+V to paste the copied image",
  ];

  // Command titles for quick navigation
  const commandTitles = [
    "Generate Image",
    "Canvas Description",
    "Image Description",
    "Image Chat",
    "Location Edit",
    "Size Edit",
    "Radar Scan",
    "Render Canvas",
    "Keyboard Commands",
    "Delete Image",
    "Ask Questions about how to use AltCanvas",
    "Instructions",
    "Settings",
    "Clear Canvas",
    "Copy Image",
    "Paste Image",
    "Exit Mode"
  ];

  let currentCommandIndex = 0;
  let keyOptions;
  
  function defaultKeyOptions(event) {

    if (event.shiftKey && event.key === 'K') {
      console.log('Shift+K pressed');
      toggleKeyboardShortcuts();
      keyOptions = true;
      console.log('keyOptions',keyOptions);
      speakImmediate('Keyboard Commands Dialog Opened. Use Up and Down arrow keys to navigate through the commands. Press Enter to select a command. Press Escape to exit.', speechSpeed);
      // speakImmediate('You can also use number keys 1 through 12 to jump directly to a specific command.', speechSpeed);
      // Add a delay before reading the current command
      setTimeout(() => {
        speakImmediate('The current command is: ' + commandTitles[currentCommandIndex], speechSpeed);
      }, 3000); // 3 second delay to allow instructions to be read first
    } else if (event.shiftKey && event.key === 'T') {
      console.log('Shift+T pressed');
      renderCanvas(savedImages);
    } else if (event.shiftKey && event.key === 'H') {
      console.log('Shift+H pressed');
      toggleInstructions();
      speakImmediate('Instructions dialog opened.', speechSpeed);
    } else if (event.shiftKey && event.key === 'P') {
      console.log('Shift+P pressed');
      setOpenSettings(true);
      speakImmediate('Settings dialog opened.', speechSpeed);
    } 
    
    if(keyOptions){
      if (event.keyCode === 38) { // Up arrow key
        console.log('Up pressed');
        currentCommandIndex = (currentCommandIndex - 1 + actionCommands.length) % actionCommands.length;
        speakImmediate(commandTitles[currentCommandIndex], speechSpeed);
      } else if (event.keyCode === 40) { // Down arrow key
        console.log('Down pressed');
        currentCommandIndex = (currentCommandIndex + 1) % actionCommands.length;
        speakImmediate(commandTitles[currentCommandIndex], speechSpeed);
      } else if (event.keyCode === 13) { // Enter key
        console.log('Enter pressed');
        // Execute the selected command based on the current index
        switch(currentCommandIndex) {
          case 0: // Generate Image
            speakImmediate("Selected: Generate Image. Press Enter on a tile to generate an image.", speechSpeed);
            break;
          case 1: // Global Description
            speakImmediate("Selected: Canvas Description. Press Shift+D to hear a description of the entire canvas.", speechSpeed);
            break;
          case 2: // Image Information
            speakImmediate("Selected: Image Information. Press Shift+I to hear details about the selected image.", speechSpeed);
            break;
          case 3: // Image Chat
            speakImmediate("Selected: Image Chat. Press Shift+C to ask questions about the selected image.", speechSpeed);
            break;
          case 4: // Location Edit
            speakImmediate("Selected: Location Edit. Press Shift+L, then use arrow keys to move the image.", speechSpeed);
            break;
          case 5: // Size Edit
            speakImmediate("Selected: Size Edit. Press Shift+S, then use up/down arrow keys to change size.", speechSpeed);
            break;
          case 6: // Radar Scan
            speakImmediate("Selected: Radar Scan. Press Shift+R to hear about nearby objects.", speechSpeed);
            break;
          case 7: // Render Canvas
            speakImmediate("Selected: Render Canvas. Press Shift+D to render the final canvas.", speechSpeed);
            break;
          case 8: // Keyboard Commands
            speakImmediate("Selected: Keyboard Commands. Press Shift+K to hear these instructions.", speechSpeed);
            break;
          case 9: // Delete Image
            speakImmediate("Selected: Delete Image. Press Shift+X to delete the selected image.", speechSpeed);
            break;
          case 10: // Ask Questions
            speakImmediate("Selected: Ask Questions. Press Shift+? to ask questions about how to use AltCanvas.", speechSpeed);
            break;
          case 11: // Exit Mode
            speakImmediate("Selected: Exit Mode. Press Escape to exit any mode.", speechSpeed);
            break;
          default:
            speakImmediate("Command selected.", speechSpeed);
        }
      } else if (event.keyCode === 27) { // ESC key
        console.log('ESC pressed');
        keyOptions = false;
        console.log('keyOptions', keyOptions);
        speakImmediate('Exiting keyboard commands mode.', speechSpeed);
      } else if (event.keyCode >= 48 && event.keyCode <= 57) { // Number keys 0-9
        // Convert keyCode to actual number (0-9)
        const number = event.keyCode - 48;
        // Adjust for 1-based indexing (1 = first command, 2 = second command, etc.)
        const targetIndex = number - 1;
        
        // Check if the target index is valid for commands
        if (targetIndex >= 0 && targetIndex < actionCommands.length) {
          console.log(`Jumping to command ${number}`);
          currentCommandIndex = targetIndex;
          speakImmediate(commandTitles[currentCommandIndex], speechSpeed);
        } else {
          speakImmediate(`Command ${number} does not exist. There are ${actionCommands.length} commands available.`, speechSpeed);
        }
      }
    }
  }

  function performRefreshAction(event) {
    // Prevent the default dialog to show up if not necessary
    console.log('PAGE REFRESH')
    event.preventDefault();
    event.returnValue = ''; // Needed for some browsers
    // logEvent({'event': 'PAGE_REFRESH'});  // Call your logEvent function
  }


  const removeBackground = (imageURL, imageObject) => {
    console.log('making call');
    const formData = new FormData();
    formData.append('image_url', imageURL); // Add the image URL to the form data
  
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
  
    // Return the promise from fetch so that you can await it.
    return fetch('/remove-background', {
        method: 'POST',
        body: formData 
    })
    .then(response => response.json())
    .then(data => {
        console.log('DaTA', data);
        console.log('Image URL:', data.imageUrl);
        // Return the image URL so the caller can assign it.
        return data.imageUrl;
    })
    .catch(error => {
        console.error("Removal.ai error:", error.response ? error.response.data : error.message);
        console.error('Error:', error);
        // Return an empty string or throw error if needed
        return '';
    });
  };
  
  

  var posTagger = require( 'wink-pos-tagger' );
  var tagger = posTagger();
  const [savedImages, setSavedImages] = useState([]);
  const canvasRef = useRef(null);

  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const saveToSessionStorage = () => {
    if (savedImages.length > 0) {
      localStorage.setItem('savedImages', JSON.stringify(savedImages));
      console.log('Images saved to local storage', localStorage)
    }
  };

  const renderCanvas = async () => {
    if (isRendering) return;
    setIsRendering(true);
    speakMessage("Rendering canvas. Please wait.", speechSpeed);
    
    try {
      // Create a new canvas element
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      const ctx = canvas.getContext('2d');
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw all images
      for (const image of savedImages) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const x = image.canvas.x - (image.sizeParts.width / 2);
            const y = image.canvas.y - (image.sizeParts.height / 2);
            ctx.drawImage(img, x, y, image.sizeParts.width, image.sizeParts.height);
            resolve();
          };
          img.onerror = reject;
          img.src = image.image_nbg || image.url;
        });
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      const savedImagesArray = JSON.parse(localStorage.getItem('savedImages') || '[]');
      savedImagesArray.push(dataUrl);
      localStorage.setItem('savedImages', JSON.stringify(savedImagesArray));
      
      speakMessage("Canvas rendered successfully. You can view it in the gallery.", speechSpeed);
    } catch (error) {
      console.error("Error rendering canvas:", error);
      speakMessage("Error rendering canvas. Please try again.", speechSpeed);
    } finally {
      setIsRendering(false);
    }
  };

  const [tiles, setTiles] = useState([
    { 
      id: 0, 
      image: {}, 
      x: 0,
      y: 0
    }
  ]);

  var element = document.getElementById("canvas");
  
  useEffect(() => {
    const centerX = Math.round((canvasSize['width'] / 2));
    const centerY = Math.round((canvasSize['height'] / 2));

    setTiles([
      { id: 0, image: {}, x: centerX, y: centerY }
    ]);
  }, [canvasSize]); 

  let loadingSoundSource = null;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const serializedTiles = JSON.stringify(tiles);
    sessionStorage.setItem('tiles', serializedTiles);
  }, [tiles]);

  useEffect(() => {
    const serializedImages = JSON.stringify(savedImages);
    sessionStorage.setItem('savedImages', serializedImages);
    console.log('SAVED IMAGES', savedImages);
  }, [savedImages]);

  let [canvasDescriptionPrompt, setcanvasDescriptionPrompt ] = useState('')
  const [showInstructions, setShowInstructions] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(5);
  const [gridItems, setGridItems] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [promptText, setPromptText] = useState('');

  const tileRefs = useRef([]);
  if (tileRefs.current.length !== tiles.length) {
    tileRefs.current = Array(tiles.length).fill().map((_, i) => tileRefs.current[i] || React.createRef());
  }
  const playerLRRef = useRef(null);
  const playerURef = useRef(null);
  const playerDRef = useRef(null);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const [editingImageIndexKeyboard, setEditingImageIndexKeyboard] = useState(null);

  const [isEditingSize, setIsEditingSize] = useState(false);
  const [editingSizeImageIndex, setEditingSizeImageIndex] = useState(null);
  const [isOverlapMode, setIsOverlapMode] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // Add selected image tracking

  const [isChangeMode, setIsChangeMode] = useState(false);
  const [changeIndex, setChangeIndex] = useState(null);
  const [changePrompt, setChangePrompt] = useState('');

  const [radarActive, setRadarActive] = useState(false); 
  const [locationEditActive, setlocationEditActive] = useState(false);
  const [sizeEditActive, setsizeEditActive] = useState(false);
  const [chatActive, setchatActive] = useState(false);
  const [infoActive, setinfoActive] = useState(false); 

  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 800; // Frequency in Hz
      gainNode.gain.value = 0.1; // Volume level

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // Play for 0.2 seconds
    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  };

  const speakMessage = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = speechSpeed;
    window.speechSynthesis.speak(utterance);
  };

  // Settings functions
  const handleTactileMode = () => {
    setGraphicsMode("tactile");
    console.log("Tactile Graphics Mode selected");
    speakMessage("Tactile Graphics Mode selected");
  };

  const handleColorMode = () => {
    setGraphicsMode("color");
    console.log("Color Graphics Mode selected");
    speakMessage("Color Graphics Mode selected");
  };

  const speakImmediate = (message, rate = 1) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const handleIncreaseSpeechSpeed = () => {
    setSpeechSpeed((prevSpeed) => {
      const newSpeed = parseFloat((Math.min(prevSpeed + 0.2, 2.0)).toFixed(1));
      speakImmediate(`Speech speed increased to ${newSpeed}`, newSpeed);
      return newSpeed;
    });
  };

  const handleDecreaseSpeechSpeed = () => {
    setSpeechSpeed((prevSpeed) => {
      const newSpeed = parseFloat((Math.max(prevSpeed - 0.2, 0.5)).toFixed(1));
      speakImmediate(`Speech speed decreased to ${newSpeed}`, newSpeed);
      return newSpeed;
    });
  };

  useEffect(() => {
    const handleEscape = (event) => {
      // Check if the escape key is pressed and neither location nor size is being edited
      if (event.key === "Escape" && !isEditingLocation && !isEditingSize) {
        console.log("Handling escape: Cancelling operations and speech synthesis.");
        window.speechSynthesis.cancel();
      }
    };

    // Attach the keydown event listener
    document.addEventListener("keydown", handleEscape);
    return () => {
      // Remove the keydown event listener when the component unmounts
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isEditingLocation, isEditingSize]);  

  useEffect(() => {
        if (savedImages.length > 0) {
          const latestImage = savedImages[savedImages.length - 1];
          
          // Skip if the latest image is a background image
          if (latestImage.isBackground) {
            return;
          }
          
          setFocusedIndex(savedImages.length - 1);
          const existingTileIndex = focusedIndex;

          if (existingTileIndex === -1) {
            return;
          } else if (isEditingLocation) {
            console.log('Editing Image', savedImages[editingImageIndex])
            const newTile = tiles.findIndex(tile => tile.x === savedImages[editingImageIndex].coordinate.x && tile.y === savedImages[editingImageIndex].coordinate.y);
            console.log('New tile the image has moved to ', newTile)
            const centralTile = tiles[newTile];
            console.log('centralTile', centralTile);
            addSurroundingTiles(centralTile);

          } else if (isEditingSize) {

          }else {
            const centralTile = tiles[focusedIndex];
            console.log('centralTile', centralTile);
            addSurroundingTiles(centralTile);
          }
        }
  }, [savedImages]);


  const thumpRef = useRef(null);
  const urlTwo = "https://storage.googleapis.com/altcanvas-storage/bump.mp3";

  const playerTwo = new Tone.Player().toDestination();
  playerTwo.load(urlTwo).then(() => {
      thumpRef.current = playerTwo;
  });


  const playSpatialThump = (direction) => {
    if (!thumpRef.current) return;
    
    const panner = new Tone.Panner3D({
      positionX: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
      positionY: direction === 'up' ? 10 : direction === 'down' ? -10 : 0,
      positionZ: -1,
    }).toDestination();

    thumpRef.current.disconnect();
    thumpRef.current.chain(panner, Tone.Destination);

    thumpRef.current.start();
  };


  const updateImagePosition = (editingImageIndex, dx, dy) => {
    savedImages[editingImageIndex].canvas.x = savedImages[editingImageIndex].canvas.x + dx
    savedImages[editingImageIndex].canvas.y = savedImages[editingImageIndex].canvas.y + dy
  }

  const toggleInstructions = () => {
    setShowInstructions(prevState => !prevState);
  };

  const toggleKeyboardShortcuts = () => {
    setShowKeyboardShortcuts(prevState => !prevState);
  };

  useEffect(() => {
    const items = [];
    for (let i = 0; i < rows * columns; i++) {
      items.push(`Item ${i + 1}`);
    }
    setGridItems(items);

    tileRefs.current = items.map((_, i) => tileRefs.current[i] || React.createRef());

    const leftrighturl = "https://storage.googleapis.com/altcanvas-storage/leftright.mp3";
    const downurl ="https://storage.googleapis.com/altcanvas-storage/down.mp3";
    const upurl="https://storage.googleapis.com/altcanvas-storage/up.mp3";

    const playerLR = new Tone.Player().toDestination();
    playerLR.load(leftrighturl).then(() => {
        playerLRRef.current = playerLR;
    });

    const playerD = new Tone.Player().toDestination();
    playerD.load(downurl).then(() => {
        playerDRef.current = playerD;
    });

    const playerU = new Tone.Player().toDestination();
    playerU.load(upurl).then(() => {
        playerURef.current = playerU;
    });

    document.documentElement.addEventListener('mousedown', () => {
      if (Tone.context.state !== 'running') Tone.context.resume();
    });
    
  }, [rows, columns]);


  const [saveCompleted, setSaveCompleted] = useState(false);
  const originalPositionsRef = useRef({});

  const readLocationEdit = (focusedIndex) => {
    console.log('READ LOCATION EDIT',  tiles[focusedIndex].x)
    const image = savedImages.find(image => image.coordinate.x === tiles[focusedIndex].x && image.coordinate.y === tiles[focusedIndex].y)
    console.log('EDIT IMAGE', image)
    
    if (!image) {
      console.log('No image found at the specified coordinates');
      speakMessage("No image found at this location");
      return;
    }
    
    const script = `The image is now located in ${Math.round(image.canvas.x)} and ${Math.round(image.canvas.y)}`
    speakMessage(script)
  }

  let outside = false;
  
  const isOverlapping = (editingImage, editingImageIndex) => { 
    const { x: currX, y: currY } = editingImage.canvas;
    const { width: currWidth, height: currHeight } = editingImage.sizeParts;

    const tolerance =  - (currWidth/ 20);

    const currLeft = currX - currWidth / 2 - tolerance;
    const currRight = currX + currWidth / 2 + tolerance;
    const currTop = currY - currHeight / 2 - tolerance ;
    const currBottom = currY + currHeight / 2 + tolerance;

    const otherImages = savedImages.filter((_, index) => index !== editingImageIndex);
    for (let otherImage of otherImages) {
        const { x: otherX, y: otherY } = otherImage.canvas;
        const { width: otherWidth, height: otherHeight } = otherImage.sizeParts;

        const otherLeft = otherX - otherWidth / 2 - tolerance;
        const otherRight = otherX + otherWidth / 2 + tolerance;
        const otherTop = otherY - otherHeight / 2 - tolerance;
        const otherBottom = otherY + otherHeight / 2 + tolerance;

        if (!(otherRight < currLeft ||
              otherLeft > currRight ||
              otherBottom < currTop || 
              otherTop > currBottom)) {
            console.log('Overlap detected with image at index', savedImages.indexOf(otherImage));
            speakImmediate(`Overlapping with ${otherImage.name}`);
            thumpRef.current.start();
            return true; 
        }
    }
    return false;
};


const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const handleKeyDownLocationEdit = (e) => {
      
      if (isEditingLocation && editingImageIndex !== null) {
        const editingImage = savedImages[editingImageIndex];
        let dx = 0, dy = 0;
        let moveDistance = 20;
        const currentTime = getFormattedTimestamp()
        
        switch(e.key) {
          case 'ArrowLeft': 
            dx = - moveDistance;

            if (savedImages[editingImageIndex].canvas.x  - (savedImages[editingImageIndex].sizeParts.width / 2) <= moveDistance) {
              thumpRef.current.start();
              // eslint-disable-next-line react-hooks/exhaustive-deps
              outside = true;
              
            }else{
              playSpatialSound('left'); 
              // speakMessage(`left ${-dx}`);
              updateImagePosition(editingImageIndex, dx, dy);
              isOverlapping(savedImages[editingImageIndex],editingImageIndex);
              outside = false;
            }
            break;
            
          case 'ArrowRight':
            dx = moveDistance;
            if (savedImages[editingImageIndex].canvas.x + (savedImages[editingImageIndex].sizeParts.width / 2) >= canvasSize.width - (moveDistance)) {
              thumpRef.current.start();
              outside = true;
            }else{
              playSpatialSound('right');
              // speakMessage(`right ${dx}`);
              updateImagePosition(editingImageIndex, dx, dy);
              isOverlapping(savedImages[editingImageIndex], editingImageIndex);
              outside = false;
            }
            break;

          case 'ArrowUp': 
            dy = -moveDistance; 
            if (savedImages[editingImageIndex].canvas.y - (savedImages[editingImageIndex].sizeParts.height / 2)<= moveDistance ) {
              thumpRef.current.start();
              outside = true;
            }else{
              playSpatialSound('up'); 
              // speakMessage(`up ${-dy}`);
              updateImagePosition(editingImageIndex, dx, dy);
              isOverlapping(savedImages[editingImageIndex], editingImageIndex);
              outside = false;
            }
            break;
            
          case 'ArrowDown': 
            dy = moveDistance;
            if (savedImages[editingImageIndex].canvas.y + (savedImages[editingImageIndex].sizeParts.height / 2) >= canvasSize.height - moveDistance ) {
              thumpRef.current.start();
              outside = true;
            }else{
              playSpatialSound('down');
              // speakMessage(`down ${dy}`); 
              updateImagePosition(editingImageIndex, dx, dy);
              isOverlapping(savedImages[editingImageIndex], editingImageIndex);
              outside = false;
            }
            break;

          case 'Shift': 
              speakMessage(
                `The coordinates are
                ${savedImages[editingImageIndex].canvas.x} 
                by ${savedImages[editingImageIndex].canvas.y}
                
                `);

                console.log(`${currentTime}: Checking Location Coordinate- ${focusedIndex}`);
          
                // logEvent({
                //   time: currentTime,
                //   action: 'location_edit_info',
                //   focusedIndex: focusedIndex,
                // });
                
              break;
              
          case 'Escape':
            setIsEditingLocation(false);
            setEditingImageIndex(null);
            const newIndex = tiles.findIndex(tile => tile.x === savedImages[editingImageIndex].coordinate.x && tile.y === savedImages[editingImageIndex].coordinate.y )
            setFocusedIndex(newIndex);
            if (tileRefs.current[newIndex]) {
              tileRefs.current[newIndex].focus();
            }
            speakMessage("Location mode exited");
            readLocationEdit(focusedIndex)
            
            console.log(`${currentTime}: Exit Location Edit- ${focusedIndex}`);
          
            // logEvent({
            //   time: currentTime,
            //   action: 'location_edit_exit',
            //   focusedIndex: focusedIndex,
            // });
            
            return;
          default: 
            return;
        }

        if (!originalPositionsRef.current[editingImageIndex]) {
          originalPositionsRef.current[editingImageIndex] = {
            x: savedImages[editingImageIndex].canvas.x,
            y: savedImages[editingImageIndex].canvas.y,
          };
          console.log('original positions ref', originalPositionsRef)
        }

        if (!outside){

          setSavedImages((prevImages) => prevImages.map((img, index) => {
            console.log('saving images', savedImages)
            if (index === editingImageIndex) {
              return { ...img, canvas: { x: img.canvas.x + dx, y: img.canvas.y + dy } };
            }
            return img;
          }));
  
          setSaveCompleted(true);
          console.log('Saved Complemted', saveCompleted)
          if(saveCompleted ){
            readLocationEdit(focusedIndex)
          }

        } 

      } else {
      }
    };

    if (isEditingLocation) {
      document.addEventListener('keydown', handleKeyDownLocationEdit);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDownLocationEdit);
    };
  }, [isEditingLocation]);


  

  // Image location change is finished and image is updated
  useEffect(() => {
    if (saveCompleted) {
      console.log('=========================================================');
      console.log('Location Edit Image has been successfully updated.');
      console.log('Saved Images', savedImages);
  
      const editedImage = savedImages[editingImageIndex];
      const editedX = editedImage.canvas.x;
      const editedY = editedImage.canvas.y;
      const originalPosition = originalPositionsRef.current[editingImageIndex];
  
      savedImages.forEach((otherImage, index) => {
        if (index !== editingImageIndex) {
          const otherX = otherImage.canvas.x;
          const otherY = otherImage.canvas.y;
  
          if (originalPosition) {
            // Check for the x-axis
            if (editedX < otherX && originalPosition.x >= otherX) {
              const potentialNewX = savedImages[index].coordinate.x - tileSize;
              // Check if potential coordinate is already occupied
              if (!savedImages.some(img => img.coordinate.x === potentialNewX && img.coordinate.y === savedImages[editingImageIndex].coordinate.y)) {
                savedImages[editingImageIndex].coordinate.x = potentialNewX;
                console.log('updated coordinate.x to', potentialNewX);
              }
            }
            if (editedX > otherX && originalPosition.x <= otherX) {
              const potentialNewX = savedImages[index].coordinate.x + tileSize;
              // Check if potential coordinate is already occupied
              if (!savedImages.some(img => img.coordinate.x === potentialNewX && img.coordinate.y === savedImages[editingImageIndex].coordinate.y)) {
                savedImages[editingImageIndex].coordinate.x = potentialNewX;
                console.log('updated coordinate.x to', potentialNewX);
              }
            }
  
            // Check for the y-axis
            if (editedY < otherY && originalPosition.y >= otherY) {
              const potentialNewY = savedImages[index].coordinate.y - tileSize;
              // Check if potential coordinate is already occupied
              if (!savedImages.some(img => img.coordinate.y === potentialNewY && img.coordinate.x === savedImages[editingImageIndex].coordinate.x)) {
                savedImages[editingImageIndex].coordinate.y = potentialNewY;
                console.log('updated coordinate.y to', potentialNewY);
              }
            }
            if (editedY > otherY && originalPosition.y <= otherY) {
              const potentialNewY = savedImages[index].coordinate.y + tileSize;
              // Check if potential coordinate is already occupied
              if (!savedImages.some(img => img.coordinate.y === potentialNewY && img.coordinate.x === savedImages[editingImageIndex].coordinate.x)) {
                savedImages[editingImageIndex].coordinate.y = potentialNewY;
                console.log('updated coordinate.y to', potentialNewY);
              }
            }
  
            originalPositionsRef.current[editingImageIndex] = {
              x: savedImages[editingImageIndex].canvas.x, 
              y: savedImages[editingImageIndex].canvas.y,
            };
            console.log('updated originalPositionsRef for', editingImageIndex, originalPositionsRef.current[editingImageIndex]);
          }
        }
      });
  
      setSaveCompleted(false);
    }
  }, [saveCompleted, savedImages, editingImageIndex]);
  

  

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
  
    return () => {
      detachSizeEditKeyListener();
    };
  }, [isEditingSize, editingSizeImageIndex]);

  //  ==================================

  // For Loading and Image Gneration feedback

  let isPlayingSound = false;
  const synth = new Tone.Synth().toDestination();
  const notes = ['C4', 'D4', 'E4']; // Do, Re, Mi notes
  let currentNote = 0;
  const loadingPlayerRef = useRef(null);
  const note_url = "https://storage.googleapis.com/altcanvas-storage/generating.mp3";
  
  // Initialize the player safely once
  useEffect(() => {
    const initPlayer = async () => {
      await Tone.start(); // Ensures context is started
      console.log('Tone.js started');

      const player = new Tone.Player(note_url, () => {
        console.log('Audio loaded');
        loadingPlayerRef.current = player;
        loadingPlayerRef.current.toDestination(); // route directly to speakers
      }).toDestination();

      player.autostart = false;
      player.loop = true;
    };

    initPlayer();

    // Resume audio on user gesture
    document.documentElement.addEventListener("mousedown", () => {
      if (Tone.context.state !== "running") {
        Tone.context.resume().then(() => {
          console.log("Tone context resumed on user gesture");
        });
      }
    });
  }, []);

  const playNotes = () => {
    console.log('Playing Notes for Generating Image');
  
    if (!loadingPlayerRef.current) return;
  
    try {
      const player = loadingPlayerRef.current;
      if (player.state === "stopped") {
        console.log("Starting sound...");
        player.start();
      } else {
        console.log("Player already playing");
      }
    } catch (error) {
      console.error("Error playing notes:", error);
    }
  };
  
// Global variable to store the Audio object
let loadingSound;

const startLoadingSound = async (voiceText) => {
  try {
    await Tone.start();
    console.log('Tone started');

    const utterance = new SpeechSynthesisUtterance(`Detected: ${voiceText}. Press Enter to Confirm and the escape key to cancel`);
    console.log('Tone utterance', utterance);
      utterance.pitch = 1;
      utterance.rate = speechSpeed;
      utterance.volume = 1;
  
      window.speechSynthesis.speak(utterance);
  
      // Wait for the key press event to complete
      const isConfirmed = await new Promise((resolve) => {
        // Set up the key press event listener inside the Promise
        function keyPressHandler(event) {
          document.removeEventListener('keydown', keyPressHandler);
          if (event.key === "Enter") {
            speakMessage('Enter pressed, image generation starting.');
            setIsGeneratingImage(true);
            setTimeout(() => {
              playNotes();
            }, 500); // small delay to ensure state is updated
            resolve(true);
          } else if (event.key === "Escape") {
            resolve(false);
          }
        }
        document.addEventListener('keydown', keyPressHandler);
      });
  
      return isConfirmed;
    } catch (error) {
      console.error('Error starting Tone.js or speech synthesis:', error);
    }
  };

  const stopLoadingSound = () => {
    if (loadingPlayerRef.current) {
      try {
        loadingPlayerRef.current.stop();
        console.log("Stopped loading sound");
      } catch (err) {
        console.error("Failed to stop loading sound:", err);
      }
    }
  };


  const playTone = (frequency) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Use a sine wave
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequency in Hz
  
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1); // Play the tone for 0.1 seconds
  };
  

  let changedFrequency = 340
  
  const handleKeyDownForSizeEdit = (e) => {
    if (!isEditingSize || editingSizeImageIndex === null) {
      return;
    }
  
    e.preventDefault();
    e.stopPropagation();

    const currentTime = getFormattedTimestamp()

    let originalWidth = savedImages[editingSizeImageIndex].sizeParts.width;
    let originalHeight = savedImages[editingSizeImageIndex].sizeParts.height;
    let scaleUp = 0;
    let scaleDown = 0;

    let scaleFactor = 1;
    console.log('Size Editing Index',editingSizeImageIndex);

    // if original Width is not smaller than 50 and larger than canvasSize.width /2

    switch (e.key) {
      case 'ArrowUp':
        if(originalWidth >= canvasSize.width / 2){
          speakImmediate('Max Size Reached', speechSpeed);
        }else{
          scaleFactor = 1.1;
          changedFrequency = changedFrequency + 30
         
        }
        break;
      case 'ArrowDown':
        if (originalWidth <= 50){
          speakImmediate('Min Size Reached', speechSpeed);
        } else{
          scaleFactor = 0.9;
          changedFrequency = changedFrequency - 30
        }
        break;
      case 'Shift':
        speakMessage(`The current size is ${savedImages[editingSizeImageIndex].sizeParts.width} by ${savedImages[editingSizeImageIndex].sizeParts.height}`);
        console.log(`${currentTime}: Size - Edit Info Focused Index: ${focusedIndex}`);
          
        break;
      case 'Escape':
        setIsEditingSize(false);
        setEditingSizeImageIndex(null);
        setFocusedIndex(focusedIndex);
        
        speakMessage("Size Edit mode exited");
        console.log(`${currentTime}: Size - Edit Exit Focused Index: ${focusedIndex}`);
        
        if (tileRefs.current[focusedIndex]) {
          tileRefs.current[focusedIndex].focus();
        }
        changedFrequency = 340
        return;
      default:
        return;
    }

    console.log(changedFrequency);
    playTone(changedFrequency);
    savedImages[editingSizeImageIndex].sizeParts.width = Math.round(originalWidth + ((scaleFactor - 1.0)* 100));
    savedImages[editingSizeImageIndex].sizeParts.height = Math.round(originalHeight + ((scaleFactor - 1.0)* 100));
  
  
    // Adjust size with aspect ratio maintenance
    setSavedImages((prevImages) => prevImages.map((img, index) => {
      
      if (index === editingSizeImageIndex) {
        const originalWidth = img.sizeParts.width;
        const originalHeight = img.sizeParts.height;

        const newWidth = Math.round( originalWidth + ((scaleFactor - 1.0)* 100));
        const newHeight = Math.round(originalHeight + ((scaleFactor - 1.0)* 100));
  
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
  

  function addSurroundingTiles(centralTile) {
    
    if (!centralTile) return; 

    console.log('add Surrounding Tiles')
  
    const positions = [
      { dx: -tileSize, dy: -tileSize }, // Top-left
      { dx: 0, dy: -tileSize }, // Top
      { dx: tileSize, dy: -tileSize }, // Top-right
      { dx: -tileSize, dy: 0 }, // Left
      { dx: tileSize, dy: 0 }, // Right
      { dx: -tileSize, dy: tileSize }, // Bottom-left
      { dx: tileSize, dy: tileSize }, // Bottom-right
      { dx: 0, dy: tileSize}, // Bottom
    ];
  
    const newTiles = positions.map((pos, index) => ({
      id: tiles.length + index,
      image: {},
      x: centralTile.x + pos.dx,
      y: centralTile.y + pos.dy,
    })).filter(newTile => 

      !tiles.some(tile => tile.x === newTile.x && tile.y === newTile.y)
    );
  
    // Update state with new tiles, if any
    setTiles(tiles => [...tiles, ...newTiles]);
  }

  const playSpatialSound = (direction) => {
    if (!playerLRRef.current) return;
    
    const panner = new Tone.Panner3D({
      positionX: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
      positionY: direction === 'up' ? 10 : direction === 'down' ? -10 : 0,
      positionZ: -1,
    }).toDestination();

    if (direction === 'left' || direction === 'right') { 
      console.log('playing lr')
      playerLRRef.current.disconnect();
      playerLRRef.current.chain(panner, Tone.Destination);      
      playerLRRef.current.start();
      
    } else if (direction === 'up') {
      console.log('playing up')
      playerURef.current.disconnect();
      playerURef.current.chain(panner, Tone.Destination);
      playerURef.current.start();

    } else {
      console.log('playing down')
      playerDRef.current.disconnect();
      playerDRef.current.chain(panner, Tone.Destination);
      playerDRef.current.start();

    }
  };

  const pushImage = (movingTile, newX, newY) => {

    const findImageIndex = savedImages.findIndex(image => image.coordinate.x === movingTile.x && image.coordinate.y === movingTile.y);
    const pushImage = savedImages[findImageIndex];

    
    let direction;
    if (newX > movingTile.x) {
        direction = "right";
    } else if (newX < movingTile.x) {
        direction = "left";
    } else if (newY > movingTile.y) {
        direction = "down";
    } else if (newY < movingTile.y) {
        direction = "up";
    } else {
        direction = "the same place";  // In case there is no change in position
    }

    pushImage.coordinate.x = newX;
    pushImage.coordinate.y = newY;

    const centralTile = tiles.find(tile => tile.x === newX && tile.y === newY )

    addSurroundingTiles(centralTile)

    // Speak message with direction
    speakMessage(`Pushed Image ${savedImages[findImageIndex].name} ${direction}`);

    // Log the updated image details
    console.log('pushImage', pushImage);
  }

  let oldImage;

  const tileNavigation = (event, index, isRegeneration=false) => {

    if(!keyOptions){

    const hasImage = savedImages.find(image => image.coordinate.x === tiles[index].x & image.coordinate.y === tiles[index].y)
    if (hasImage) {
      oldImage = hasImage;
    }

    let newIndex, direction,imageMatch, distance;
    let newX = tiles[index].x;
    let newY = tiles[index].y;
    let movingIndex, targetTile,targetIndex;

    let x1,x2,y1,y2;
    const currentTime = getFormattedTimestamp();

    if (event.shiftKey) {
      // eslint-disable-next-line default-case
      switch (event.key) {
        case 'ArrowUp':

          movingIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
          newY =  tiles[index].y - tileSize;
          targetTile = savedImages.find(image => image.coordinate.x === newX && image.coordinate.y === newY);
          targetIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
          console.log('targetTile',targetTile);
          if(targetTile){
            speakMessage('There is an image in the tile above. Push the Image above first.')
          }else{
            console.log('movingIndex up',movingIndex)
            pushImage(tiles[movingIndex], newX, newY);
            console.log(`${currentTime}: Pushing UP - Moving Index: ${movingIndex}`);
            
            // logEvent({
            //   time: currentTime,
            //   action: 'pushup',
            //   focusedIndex: movingIndex,
            // });
          }

          break;
          

        case 'ArrowDown':


          movingIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
          newY =  tiles[index].y + tileSize;
          targetTile = savedImages.find(image => image.coordinate.x === newX && image.coordinate.y === newY);
          targetIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
          console.log('targetTile',targetTile);
          if(targetTile){
            speakMessage('There is an image in the tile below. Push the Image below first.')
          }else{
            pushImage(tiles[movingIndex], newX, newY);
            console.log(`${currentTime}: Pushing DOwn - Moving Index: ${movingIndex}`);
            
            // logEvent({
            //   time: currentTime,
            //   action: 'pushdown',
            //   focusedIndex: movingIndex,
            // });
          }

          break;


        case 'ArrowLeft':

          movingIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
          newX =  tiles[index].x - tileSize;
          targetTile = savedImages.find(image => image.coordinate.x === newX && image.coordinate.y === newY);
          targetIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
          if(targetTile){
            speakMessage('There is an image in the tile to the left. Push the Image left first.')
          }
          else{
            pushImage(tiles[movingIndex], newX, newY);
            console.log(`${currentTime}: Pushing left - Moving Index: ${movingIndex}`);
            // logEvent({
            //   time: currentTime,
            //   action: 'pushleft',
            //   focusedIndex: movingIndex,
            // });
          }
          break;


        case 'ArrowRight':

          movingIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
          newX =  tiles[index].x + tileSize;
          targetTile = savedImages.find(image => image.coordinate.x === newX && image.coordinate.y === newY);
          targetIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
          if(targetTile){
            speakMessage('There is an image in the tile to the right. Push the Image right first.')
          }
          else{
            pushImage(tiles[movingIndex], newX, newY);
            console.log(`${currentTime}: Pushing Right - Moving Index: ${movingIndex}`);
            // logEvent({
            //   time: currentTime,
            //   action: 'pushright',
            //   focusedIndex: movingIndex,
            // });
          }
          break;

      }
    }
    
    switch (event.key) {
      case 'ArrowUp':

        console.log('moving UP')
        console.log(' tiles[index]', tiles[index])
        x1 =  tiles[index].x;
        y1 =  tiles[index].y;
        console.log('up x1',x1)
        console.log('up y1',y1)
        console.log('tileSize',tileSize)
        newY =  tiles[index].y - tileSize;
        console.log('newX', newX)
        console.log('newY', newY)
        direction = 'up';
        break;
      case 'ArrowDown':
        x1 =  tiles[index].x;
        y1 =  tiles[index].y;
        console.log('x1',x1)
        console.log('y1',y1)
        console.log('tileSize',tileSize)
        newY =  tiles[index].y + tileSize;
        console.log('newX', newX)
        console.log('newY', newY)
        direction = 'down';
        break;
      case 'ArrowLeft':
        x1 =  tiles[index].x;
        y1 =  tiles[index].y;
        console.log('x1',x1)
        console.log('y1',y1)
        console.log('tileSize',tileSize)
        newX =  tiles[index].x - tileSize;
        console.log('newX', newX)
        console.log('newY', newY)
        direction = 'left';
        break;
      case 'ArrowRight':
        x1 =  tiles[index].x;
        y1 =  tiles[index].y;
        console.log('x1',x1)
        console.log('y1',y1)
        console.log('tileSize',tileSize)
        newX =  tiles[index].x + tileSize;
        console.log('newX', newX)
        console.log('newY', newY)
        direction = 'right';
        break;
      case 'Enter': 
        if (isGeneratingImage) return; 
        newIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
        setFocusedIndex(newIndex);
        if(isRegeneration){
          console.log(`${currentTime}: Image Regeneration - ${newIndex}`);
        }else{
          console.log(`${currentTime}: Image Generation - ${newIndex}`);
        }
        generateImage(newIndex, isRegeneration);
        return;
      default:
        return;
    }

    newIndex = tiles.findIndex(tile => tile.x === newX && tile.y === newY);
    console.log('newTile', newIndex);


    if (newIndex !== -1 && tileRefs.current[newIndex]) {
      tileRefs.current[newIndex].focus();
    }
    
    setFocusedIndex(newIndex);
    setHoveredIndex(newIndex);

    console.log('newIndex', newIndex)

    const imageObject = savedImages.findIndex(image => image.coordinate.x === newX && image.coordinate.y === newY);
          

    if (imageObject !== -1 || tiles.length === 1) {
      if(!savedImages[imageObject] && !keyOptions){
        tileRefs.current[focusedIndex].focus();
        // speakMessage('You are currently focused on the first tile. Press enter to generate the first image on the canvas')
      }else{
        speakMessage(`${savedImages[imageObject].name}`)
      }
    }else{
      if( newIndex === -1) {
        console.log('playing Spatial Thump', direction);
        playSpatialThump(direction);
      }
      else{
          console.log('playing Spatial sound', direction);
          playSpatialSound(direction);
      }
    }

  }

  };

  const enterLocationEditMode = (gridIndex) => {
  
    if(gridIndex !== -1) {
      setIsEditingLocation(true);
      console.log('gridIndex',gridIndex);
      console.log(' tiles[gridIndex].x',  tiles[gridIndex].x);
      const tileX = tiles[gridIndex].x;
      const tileY= tiles[gridIndex].y
      const imageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY)
      console.log('imageIndex', imageIndex);
      setEditingImageIndex(imageIndex);
      canvasRef.current.focus();
    }
  };

  const deleteImage = (gridIndex) => {
    if (gridIndex !== -1) {
      const tileX = tiles[gridIndex].x;
      const tileY = tiles[gridIndex].y;
  
      // Update tiles to remove the image reference
      setTiles((prevTiles) => {
        const newTiles = [...prevTiles];
        newTiles[gridIndex] = { ...newTiles[gridIndex], image: {} };
        return newTiles;
      });
  
      // Filter out the image from savedImages
      setSavedImages((prevImages) => {
        return prevImages.filter(image =>
          image.coordinate.x !== tileX || image.coordinate.y !== tileY
        );
      });
    }
  };
  

  const enterSizeEditMode = (gridIndex) => {

      console.log('Size Edit grid index', gridIndex);
      const tileX = tiles[gridIndex].x;
      const tileY= tiles[gridIndex].y

      if(gridIndex !== -1) {
        setIsEditingSize(true);
        const imageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY)
        setEditingSizeImageIndex(imageIndex);
        canvasRef.current.focus();
      }
  };

  const playModeNotification = (message, callback) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = speechSpeed;
    utterance.onend = function(event) {
      if (callback) {
        callback();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  function getFormattedTimestamp() {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${month}.${day}_${hours}:${minutes}:${seconds}`;
  }
  

  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentTime = getFormattedTimestamp();
      console.log('focused Index', focusedIndex)
      if (e.shiftKey && e.key === 'Q') {
        console.log('Canvas Question Mode Activated');
        console.log(`${currentTime}: Canvas Question - Focused Index: ${focusedIndex}`);
        handleCanvasQuestion();
      } else if (e.shiftKey && e.key === 'D') {
        console.log('Canvas Description Mode Activated');
        speakMessage('Describing Canvas. Press the Escape Key to stop me.')
        canvasDescription();
      } else if (e.shiftKey && e.key === 'O') {
        if (focusedIndex !== null) {
          const tileX = tiles[focusedIndex].x;
          const tileY = tiles[focusedIndex].y;
          const imageIndex = savedImages.findIndex(image => 
            image.coordinate.x === tileX && image.coordinate.y === tileY
          );

          if (imageIndex !== -1) {
            setIsOverlapMode(prevMode => {
              const newMode = !prevMode;
              if (newMode) {
                setSelectedImageIndex(imageIndex);
                console.log('Overlap Mode Enabled');
                console.log('Selected image:', savedImages[imageIndex].name);
                console.log('Current z-index:', savedImages[imageIndex].zIndex);
                speakMessage(`Overlap mode enabled for ${savedImages[imageIndex].name}. Use up and down arrows to change order.`);
                // Announce initial overlap order
                setTimeout(() => {
                  announceOverlapOrder(savedImages[imageIndex]);
                }, 1000);
              } else {
                setSelectedImageIndex(null);
                speakMessage("Overlap mode disabled.");
              }
              return newMode;
            });
          } else {
            speakMessage("No image selected for overlap mode.");
          }
        }
        return;
      }

      // Handle overlap mode arrow keys
      if (isOverlapMode) {
        handleOverlapModeKeyDown(e);
      }

      if (e.shiftKey && e.key === 'R') {
        if (focusedIndex !== null) {
          console.log('Radar Scan Activated');
          console.log('Focused Index', focusedIndex);
          setRadarActive(true);
          console.log(`${currentTime}: Radar Scan - Focused Index: ${focusedIndex}`);
          
          playModeNotification("Radar Scan Activated. You will hear relative location of other objects on the canvas.", () => {
            radarScan(focusedIndex); 
          });
          if (tileRefs.current[focusedIndex]) {
            tileRefs.current[focusedIndex].focus();
          }

          setTimeout(() => {
            setRadarActive(false);
        }, 3000); 
        } else {
          speakMessage('There is no image on this tile.');
          console.log("No tile is focused.");
        }
      } else if (e.shiftKey && e.key === 'L') {
          if (focusedIndex !== null  && isImageOnTile(tiles[focusedIndex].x, tiles[focusedIndex].y)) {
            console.log('Location Edit Activated');
            console.log('Focused Index', focusedIndex);
            console.log(`${currentTime}: Location Edit - Focused Index: ${focusedIndex}`);

            setlocationEditActive(true); 
            const imageIndex = savedImages.findIndex(image => image.coordinate.x === tiles[focusedIndex].x && image.coordinate.y === tiles[focusedIndex].y)
            playModeNotification(`Location Edit. Use the Arrow keys to edit the location by 20.  Press Shift to hear the coordinates.`);

            enterLocationEditMode(focusedIndex);

            setTimeout(() => {
              setlocationEditActive(false);
            }, 3000); 
          } else {
            speakMessage('There is no image on this tile.');
            console.log("No tile is focused.");
          }
      } else if (e.shiftKey && e.key === 'S') {
        if (focusedIndex !== null  && isImageOnTile(tiles[focusedIndex].x, tiles[focusedIndex].y)) {
          console.log('Size Edit Activated');
          console.log('Focused Index', focusedIndex);
          console.log(`${currentTime}: Size Edit - Focused Index: ${focusedIndex}`);
          
          setsizeEditActive(true); 
          playModeNotification("Size Edit. Use up down arrow keys to edit the size by 10 each. Press Shift to hear size Info.");

          enterSizeEditMode(focusedIndex);

          setTimeout(() => {
            setsizeEditActive(false);
          }, 3000); 
        } else {
          speakMessage('There is no image on this tile.');
          console.log("No tile is focused.");
        }
      } else if (e.key === 'D' && !e.shiftKey) {  // Added !e.shiftKey check
        if (focusedIndex !== null && isImageOnTile(tiles[focusedIndex].x, tiles[focusedIndex].y)) {
          setinfoActive(true); 
          console.log(`${currentTime}: Image Description - Focused Index: ${focusedIndex}`);

          playModeNotification("Describing Image on Tile.", () => {
            setFocusedIndex(focusedIndex);
            fetchImageDescription(focusedIndex);
          });
          
          if (tileRefs.current[focusedIndex]) {
            tileRefs.current[focusedIndex].focus();
          }
        } 
      }  else if (e.key === 'Q') {
        if (focusedIndex !== null && isImageOnTile(tiles[focusedIndex].x, tiles[focusedIndex].y) ) {
          console.log('Focused Index', focusedIndex);
          setchatActive(true); 
          console.log(`${currentTime}: Chat - Focused Index: ${focusedIndex}`);

          playModeNotification("Ask a question about the image on this tile and I will answer", () => {
            setFocusedIndex(focusedIndex);
            playNotificationSound();
            imageChat(focusedIndex);
          });
          if (tileRefs.current[focusedIndex]) {
            tileRefs.current[focusedIndex].focus();
          }

          setTimeout(() => {
            setchatActive(false);
          }, 3000); 
        } else {
          speakMessage('There is no image on this tile.');
          console.log("No tile is focused.");
        }
      } else if (e.shiftKey && e.key === 'X') {
        speakMessage('Deleted Image on Tile.')
        deleteImage(focusedIndex)
        
        console.log(`${currentTime}: Deleted Image- Focused Index: ${focusedIndex}`);
      }
      else if (e.shiftKey && e.key === 'Z') {
        speakMessage('Clearing the entire canvas.')
        clearCanvas();
        
        console.log(`${currentTime}: Cleared Canvas`);
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (focusedIndex !== null) {
          copyImage(focusedIndex);
          console.log(`${currentTime}: Copied Image - Focused Index: ${focusedIndex}`);
        } else {
          speakMessage('No tile is focused.');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (focusedIndex !== null) {
          pasteImage(focusedIndex);
          console.log(`${currentTime}: Pasted Image - Focused Index: ${focusedIndex}`);
        } else {
          speakMessage('No tile is focused.');
        }
      } else if (e.shiftKey && e.key === '?') {
        console.log('Ask Questions Activated');
        console.log(`${currentTime}: Ask Questions - Focused Index: ${focusedIndex}`);
        handleAskQuestions();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, copiedImage, isOverlapMode, selectedImageIndex, savedImages]);

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

        setTimeout(() => {
          recognition.stop(); 
        }, 7000);
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

  const isImageOnTile = (tileX, tileY) => {
    // First check if there's a background image
    const hasBackground = savedImages.some(image => image.isBackground);
    
    // Then check for regular images at the specific coordinates
    const hasRegularImage = savedImages.some(image => 
      !image.isBackground && 
      Math.abs(image.coordinate.x - tileX) < 1 && 
      Math.abs(image.coordinate.y - tileY) < 1
    );

    // Return true if there's either a background image or a regular image at the coordinates
    return hasBackground || hasRegularImage;
  };

  const generateDescriptionPrompt = (savedImages) => {
    if (!savedImages || savedImages.length === 0) {
      return "There are no images on the canvas.";
    }

    // Find background image if it exists
    const backgroundImage = savedImages.find(img => img.isBackground);
    
    // Create a detailed description of each image
    let imageDetails = savedImages.map((img, index) => {
      if (img.isBackground) {
        return `
          Background Image:
          - Size: ${img.sizeParts.width}px × ${img.sizeParts.height}px
        `;
      }
      return `
        Image ${index + 1}:
        - Name: "${img.name}"
        - Description: "${img.descriptions}"
        - Position: (${img.canvas.x}, ${img.canvas.y})
        - Size: ${img.sizeParts.width}px × ${img.sizeParts.height}px
        - Z-Index: ${img.zIndex} (higher numbers are on top)
      `;
    }).join("\n");

    // Calculate relative positions and overlaps
    let spatialRelations = [];
    for (let i = 0; i < savedImages.length; i++) {
      for (let j = i + 1; j < savedImages.length; j++) {
        const img1 = savedImages[i];
        const img2 = savedImages[j];
        
        // Calculate center points
        const center1 = { x: img1.canvas.x, y: img1.canvas.y };
        const center2 = { x: img2.canvas.x, y: img2.canvas.y };
        
        // Calculate distance between centers
        const distance = Math.sqrt(
          Math.pow(center2.x - center1.x, 2) + 
          Math.pow(center2.y - center1.y, 2)
        );
        
        // Determine relative position
        let position = "";
        if (Math.abs(center2.x - center1.x) > Math.abs(center2.y - center1.y)) {
          position = center2.x > center1.x ? "to the right of" : "to the left of";
        } else {
          position = center2.y > center1.y ? "below" : "above";
        }
        
        spatialRelations.push(
          `${img2.name} is ${position} ${img1.name} at a distance of ${Math.round(distance)} pixels`
        );
      }
    }

    return `
      You are describing an image to a Visually Impaired User.
      Give a clear, concise description of the canvas layout and the relationships between images.
      
      Here are the images on the canvas:
      ${imageDetails}
      
      Spatial relationships:
      ${spatialRelations.join("\n")}
      
      Please provide a natural, flowing description that:
      1. Describes the overall layout of the canvas
      2. Mentions the relative positions of images
      3. Notes any overlapping images and which is on top
      4. Keeps the description brief and easy to understand
      5. Avoids using exact pixel measurements
      6. Uses natural language to describe positions (e.g., "top left", "center", "bottom right")
      
      Start by describing the canvas as a whole from the background.
      Focus on creating a mental picture of how the images are arranged on the canvas.
    `;
  };
  
  const captureCanvasImage = async (savedImages, canvasSize) => {
    console.log('Starting canvas capture with', savedImages.length, 'images');
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    
    // Apply size reduction if there's a background image, regardless of other images
    const hasBackground = savedImages.some(img => img.isBackground);
    const scaleFactor = hasBackground ? 0.5 : 1;
    canvas.width = canvasSize.width * scaleFactor;
    canvas.height = canvasSize.height * scaleFactor;
    
    console.log('Canvas dimensions:', {
      width: canvas.width,
      height: canvas.height,
      scaleFactor,
      hasBackground
    });
    
    const ctx = canvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create a counter to track loaded images
    let totalImages = savedImages.length;
    let loadedImages = 0;
    
    // If no images, just return early
    if (savedImages.length === 0) {
      console.log('No images to capture');
      return null;
    }
    
    // Load all images manually to avoid CORS issues
    return new Promise((resolve, reject) => {
      savedImages.forEach((image, index) => {
        console.log(`Processing image ${index + 1}/${totalImages}:`, {
          name: image.name,
          url: image.image_nbg || image.url,
          position: image.canvas,
          size: image.sizeParts
        });
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // When image loads, draw it on canvas
        img.onload = () => {
          const x = (image.canvas.x - (image.sizeParts.width / 2)) * scaleFactor;
          const y = (image.canvas.y - (image.sizeParts.height / 2)) * scaleFactor;
          const width = image.sizeParts.width * scaleFactor;
          const height = image.sizeParts.height * scaleFactor;
          
          console.log(`Drawing image ${index + 1} at:`, {
            x, y, width, height
          });
          
          ctx.drawImage(img, x, y, width, height);
          
          loadedImages++;
          console.log(`Loaded ${loadedImages}/${totalImages} images`);
          
          if (loadedImages === totalImages) {
            // Use JPEG format with reduced quality when there's a background image
            const quality = hasBackground ? 0.5 : 1.0;
            console.log('Converting canvas to JPEG with quality:', quality);
            
            // Convert to base64 and ensure it's a valid URL
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            console.log('Data URL length:', dataUrl.length);
            
            // Create a blob from the data URL
            fetch(dataUrl)
              .then(res => res.blob())
              .then(blob => {
                console.log('Created blob:', {
                  size: blob.size,
                  type: blob.type
                });
                
                // Create a URL from the blob
                const imageUrl = URL.createObjectURL(blob);
                console.log('Created object URL:', imageUrl);
                resolve(imageUrl);
              })
              .catch(error => {
                console.error('Error creating image URL:', error);
                reject(error);
              });
          }
        };
        
        // If image fails to load, draw a placeholder
        img.onerror = (error) => {
          console.error(`Failed to load image ${index + 1}:`, {
            error,
            url: image.image_nbg || image.url
          });
          
          // Draw a placeholder rectangle
          const x = (image.canvas.x - (image.sizeParts.width / 2)) * scaleFactor;
          const y = (image.canvas.y - (image.sizeParts.height / 2)) * scaleFactor;
          const width = image.sizeParts.width * scaleFactor;
          const height = image.sizeParts.height * scaleFactor;
          
          console.log(`Drawing placeholder for image ${index + 1} at:`, {
            x, y, width, height
          });
          
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(x, y, width, height);
          ctx.strokeStyle = '#999';
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = '#999';
          ctx.font = '14px Arial';
          ctx.fillText(image.name || 'Image', x + 10, y + height / 2);
          
          loadedImages++;
          console.log(`Loaded ${loadedImages}/${totalImages} images (with placeholder)`);
          
          if (loadedImages === totalImages) {
            const quality = hasBackground ? 0.5 : 1.0;
            console.log('Converting canvas to JPEG with quality:', quality);
            
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            console.log('Data URL length:', dataUrl.length);
            
            fetch(dataUrl)
              .then(res => res.blob())
              .then(blob => {
                console.log('Created blob:', {
                  size: blob.size,
                  type: blob.type
                });
                
                const imageUrl = URL.createObjectURL(blob);
                console.log('Created object URL:', imageUrl);
                resolve(imageUrl);
              })
              .catch(error => {
                console.error('Error creating image URL:', error);
                reject(error);
              });
          }
        };
        
        // Always use proxied images to avoid CORS issues
        let imgSrc = image.image_nbg || image.url;
        console.log(`Loading image ${index + 1} from:`, imgSrc);
        
        // Use our proxy for any external images to avoid CORS issues
        if (imgSrc.includes('oaidalleapiprodscus.blob.core.windows.net') || 
            imgSrc.includes('localhost:3001/images/') ||
            imgSrc.startsWith('https://')) {
          // Proxy the image through our server
          const encodedUrl = encodeURIComponent(imgSrc);
          img.src = `/proxy-image?url=${encodedUrl}`;
          console.log(`Using proxied URL for image ${index + 1}:`, img.src);
        } else {
          // For data URLs or relative paths, use directly
          img.src = imgSrc;
          console.log(`Using direct URL for image ${index + 1}:`, img.src);
        }
      });
    });
  };


  // SHIFT + D - Entire Canvas Description
  const canvasDescription = async () => {
    if (canvasDescriptionActive) {
      console.log("Canvas description already in progress, skipping...");
      return;
    }
    
    setCanvasDescriptionActive(true);
    try {
      console.log("[SHIFT + D - Entire Canvas Description]");

      // If no images, just return early
      if (savedImages.length === 0) {
        speakMessage("There are no images on the canvas.");
        setCanvasDescriptionActive(false);
        return;
      }

      // Capture the canvas image
      const canvasImage = await captureCanvasImage(savedImages, canvasSize);
      if (!canvasImage) {
        speakMessage("Error capturing canvas image.");
        setCanvasDescriptionActive(false);
        return;
      }

      console.log("Canvas image captured, sending to OpenAI...");
      console.log("Image URL:", canvasImage);

      // Convert blob URL to base64
      const imageResponse = await fetch(canvasImage);
      const blob = await imageResponse.blob();
      const reader = new FileReader();
      
      const base64Image = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const customPrompt = `
        You are describing a canvas to a Visually Impaired User.
        Keep the description brief and straightforward.
        Focus on describing the overall layout and arrangement of images.
        Describe the spatial relationships between images.
        If there's a background image, describe it first.
      `;

      console.log("Sending request to OpenAI with prompt:", customPrompt);

      const response = await axios.post("/api/openai/description", { 
        prompt: customPrompt,
        canvasImage: base64Image
      });

      console.log("OpenAI response received:", response.data);

      if (response.data && response.data.description) {
        console.log("Speaking description:", response.data.description);
        speakMessage(response.data.description);
      } else {
        console.warn("No description in response:", response.data);
        speakMessage("Sorry, I couldn't generate a description for the canvas.");
      }
    } catch (error) {
      console.error("Error in canvas description:", error);
      console.error("Error details:", error.response ? error.response.data : error.message);
      speakMessage("Error generating canvas description. Please try again.");
    } finally {
      setCanvasDescriptionActive(false);
    }
  };
  
  const imageChat = async (gridIndex) => {
    try {
      const tileX = tiles[gridIndex].x;
      const tileY = tiles[gridIndex].y;
      const imageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY);
  
      console.log('Checking if chat image matches:', savedImages[imageIndex]);
  
      if (imageIndex === -1) {
        console.error('No image found at the specified coordinates.');
        speakMessage('Sorry, no image found.');
        setchatActive(false); // Exit chat mode if no image found
        return 'No image available';
      }
  
      const imageURL = savedImages[imageIndex].url;
      console.log('Image URL:', imageURL);
  
      const voiceInput = await startListening();
      setPromptText(voiceInput);
      console.log('Voice Input Question from User:', voiceInput);
  
      speakMessage(`You have asked: ${voiceInput}.`);
  
      let customPrompt = `
        You are describing an image to a Blind and Visually Impaired Person.
        Keep the description brief and straightforward.
        Answer the question the user is asking first
        Generate the given image description according to the user question:
        ${voiceInput}
      `;
  
      const response = await axios.post("/api/openai/describe-image", { imageURL, question: customPrompt});  
      console.log('Image Chat Response:', response);
  
      if (response) {
        const description = response.data.description;
        console.log('Generated Description:', description);
        speakMessage(description);
        setFocusedIndex(gridIndex);
        
        if (tileRefs.current[gridIndex]) {
          tileRefs.current[gridIndex].focus();
        }
  
        setchatActive(false); // Automatically exit chat mode after getting response
        return description;
      } else {
        setchatActive(false); // Exit chat mode if no response
        return 'No description available';
      }
    } catch (error) {
      console.error('Error fetching image description:', error);
      speakMessage('Sorry, could you ask the question again?');
      setchatActive(false); // Exit chat mode on error
      return 'Error fetching description';
    }
  };

  // Updated fetchImageName function to use the new API endpoint
  const fetchImageName = async (imageURL, userPrompt) => {
    try {
      const customPrompt = `Using the user's request: "${userPrompt}", and observing the image at ${imageURL}, generate a short, specific title that accurately captures the main subject of the image. Avoid generic names.`;
      const response = await axios.post("/api/openai/generate-image-name", { imageURL, prompt: customPrompt });
      return response.data.title || 'No title available';
    } catch (error) {
      console.error('Error fetching image name:', error);
      return 'Error fetching name';
    }
  };

  const updateImageAtIndex = (gridIndex, newImageObject) => {

    let updatedSavedImages = [...savedImages];

    const tileX = tiles[gridIndex].x;
    const tileY= tiles[gridIndex].y
    const imageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY)
    
    updatedSavedImages[imageIndex] = newImageObject;
    
    setSavedImages(updatedSavedImages);
  };

  async function playImageSound(note) {
    await Tone.start();
    const synth = new Tone.Synth().toDestination();

    synth.triggerAttackRelease(note, "8n");
}
  

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440; // Frequency in Hz (A4 note)
      gainNode.gain.value = 0.1; // Reduce the volume
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5); // Play for 0.1 seconds
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  const normalizeZIndices = (images) => {
    // Simply assign sequential indices (0, 1, 2, ...)
    return images.map((img, index) => ({
      ...img,
      zIndex: index
    }));
  };

  const generateImage = async (index, isRegeneration = false) => {
    console.log('Generating Image',isGeneratingImage);
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    setLoading(true);
    setActiveIndex(index);
  
    let shouldCancel = false;
    let isConfirmed = false;
    let isWaitingForConfirmation = false;
  
    // Keydown listener for Enter (confirm) and Escape (cancel)
    const keydownListener = (event) => {
      if (event.key === "Escape") {
        shouldCancel = true;
        console.log("Generation cancellation requested.");
        speakMessage("Image generation cancelled.");
        setLoading(false);
        setIsGeneratingImage(false);
        stopLoadingSound();
        document.removeEventListener("keydown", keydownListener);
        return;
      }
      if (event.key === "Enter") {
        isConfirmed = true;
        console.log("Generation confirmed.");
        playBeep(); // Play beep after Enter is pressed
      }
    };
  
    document.addEventListener("keydown", keydownListener);
  
    let voiceInput;
    let centerX = tiles[index].x;
    let centerY = tiles[index].y;
  
    try {
      voiceInput = await startListening();
      setPromptText(voiceInput);
      console.log("Voice Input:", voiceInput);
    } catch (error) {
      console.error("Error during voice input:", error);
      setLoading(false);
      setIsGeneratingImage(false);
      stopLoadingSound();
      document.removeEventListener("keydown", keydownListener);
      return;
    }
  
    if (!voiceInput) {
      speakMessage("No voice input detected.");
      setLoading(false);
      setIsGeneratingImage(false);
      stopLoadingSound();
      document.removeEventListener("keydown", keydownListener);
      return;
    }
  
    // Wait for confirmation
    isConfirmed = await startLoadingSound(voiceInput);
    if (!isConfirmed) {
      setLoading(false);
      setIsGeneratingImage(false);
      stopLoadingSound();
      return;
    }

    // Build the generation prompt based on graphicsMode
    let generationPrompt = "";
    if (graphicsMode === "color") {
      generationPrompt = `${voiceInput} Focus on creating only the single object the user describes. Make it in the style of a animation. Keep the background white.`;
    } else {
      generationPrompt = `
      ${voiceInput}. 
      I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:
      My prompt has full detail so no need to add more: 
      You are generating a simple black-and-white image for a toddler's coloring book. 
      Only use black. There should be no background.
      Make the drawing flat and 2D. 
      NO PATTERN. WHITE SPACE. EMPTY. SIMPLE. BLACK OUTLINE.
      NOUN PROJECT ICON STYLE. SIMPLE.
      SIMPLE MINIMALISTIC. ONLY OBJECT. NO BACKGROUND`;
    }
    
    try {
      console.log("Sending image generation request with prompt:", generationPrompt);
      const response = await axios.post("/api/openai/generate-image", { prompt: generationPrompt });
      console.log("Image generation response received:", response);
      const imageURL = response.data.url;
      const imageSize = 100;
  
      if (!imageURL) {
        console.error("No valid image URL received.");
        setLoading(false);
        setIsGeneratingImage(false);
        stopLoadingSound();
        document.removeEventListener("keydown", keydownListener);
        return;
      }
  
      let imageObject = {
        prompt: voiceInput,
        name: '',
        url: imageURL,
        image_nbg: '',
        descriptions: '',
        canvas_descriptions: '',
        coordinate: { x: centerX, y: centerY },
        canvas: { x: centerX, y: centerY },
        sizeParts: { width: imageSize, height: imageSize },
        zIndex: savedImages.length // Simple sequential index
      };
  
      imageObject.image_nbg = await removeBackground(imageURL, imageObject);
      imageObject.descriptions = await fetchImageDescription(imageURL);
      stopLoadingSound();

      // Debug log for z-index
      console.log('Current savedImages length:', savedImages.length);
      console.log('New image z-index:', imageObject.zIndex);
      console.log('All images z-indices:', savedImages.map(img => img.zIndex));
      console.log('Image order (from bottom to top):', 
        savedImages
          .concat(imageObject)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(img => `${img.name} (z-index: ${img.zIndex})`)
      );

      // Update the image name using the new API endpoint
      imageObject.name = await fetchImageName(imageURL, voiceInput);
  
      console.log("Final Image Object:", imageObject);
  
      try {
        if (isRegeneration) {
          updateImageAtIndex(index, imageObject);
        } else {
          // Normalize z-indices when adding new image
          const updatedImages = [...savedImages, imageObject];
          const normalizedImages = normalizeZIndices(updatedImages);
          setSavedImages(normalizedImages);
        }
        
        // Ensure the image coordinates match the tile coordinates exactly
        imageObject.coordinate.x = centerX;
        imageObject.coordinate.y = centerY;
        imageObject.canvas.x = centerX;
        imageObject.canvas.y = centerY;
        
        // Set focus to the tile where image was generated and update tile state
        setFocusedIndex(index);
        setTiles(prevTiles => {
          const newTiles = [...prevTiles];
          newTiles[index] = {
            ...newTiles[index],
            image: imageObject
          };
          return newTiles;
        });

        // Add surrounding tiles and ensure focus after a brief delay
        setTimeout(() => {
          const centralTile = tiles[index];
          addSurroundingTiles(centralTile);
          
          if (tileRefs.current[index]) {
            tileRefs.current[index].focus();
            speakMessage(`Image generated successfully. ${imageObject.descriptions}`);
          }
        }, 100);

      } catch (error) {
        console.error("Error updating saved images:", error);
      }
    } catch (error) {
      console.error("Error generating image from OpenAI:", error);
      setLoading(false);
      setIsGeneratingImage(false);
      stopLoadingSound();
      document.removeEventListener("keydown", keydownListener);
      return;
    }
  
    document.removeEventListener("keydown", keydownListener);
    setLoading(false);
    setIsGeneratingImage(false);
    stopLoadingSound();
  };
  
  const radarScan = (gridIndex) => {

    const tileX = tiles[gridIndex].x;
    const tileY = tiles[gridIndex].y;
    const imageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY);

    if (imageIndex === -1) {
        console.error('No image found at the specified grid index.');
        return;
    }

    const centerX = savedImages[imageIndex].coordinate.x;
    const centerY = savedImages[imageIndex].coordinate.y;

    const otherImages = savedImages.filter((_, index) => index !== imageIndex);

    const distances = otherImages.map(image => {
        const distance = Math.sqrt(Math.pow(image.coordinate.x - centerX, 2) + Math.pow(image.coordinate.y - centerY, 2));
        return { image, distance };
    });

    distances.sort((a, b) => a.distance - b.distance);

    distances.forEach((item, index) => {
        setTimeout(() => {
            speakMessage(`${item.image.name}, ${item.distance.toFixed(2)} pixels away`, () => {
                console.log( item.image.name, item.distance.toFixed(2), 'pixels away');
            });
        }, index * 2000);
    });
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

  const handleAskQuestions = async () => {
    if (isAskingQuestion) return;
    setIsAskingQuestion(true);
    
    try {
      speakImmediate("What would you like to know about AltCanvas? You can ask questions like 'How do I move an image?' or 'How do I change the size of an image?'", speechSpeed);
      const question = await startListening();
      
      if (question) {
        speakImmediate(`You asked: ${question}`);
        
        // Prepare the context for GPT
        const context = `
          AltCanvas is a tile-based image editor designed for blind and visually impaired users.
          Available commands:
          ${commands.join('\n')}
          
          User's question: ${question}
          
          Please provide a clear, concise answer focusing on how to use AltCanvas based on the user's question.
          If the question is about a specific feature, explain how to use that feature.
          If the question is general, provide a brief overview of the system's capabilities.
          Keep the response focused and practical, avoiding unnecessary details.
        `;

        try {
          const response = await axios.post("/api/openai/description", { 
            prompt: context
          });

          if (response.data && response.data.description) {
            speakImmediate(response.data.description);
          } else {
            speakImmediate("I apologize, but I couldn't generate a response. Please try asking your question again.");
          }
        } catch (error) {
          console.error("Error getting answer:", error);
          speakImmediate("I apologize, but I encountered an error while processing your question. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error in handleAskQuestions:", error);
      speakImmediate("I apologize, but I encountered an error. Please try again.");
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const clearCanvas = () => {
    setSavedImages([]);
    setTiles([{ 
      id: 0, 
      image: {}, 
      x: Math.round((canvasSize['width'] / 2)),
      y: Math.round((canvasSize['height'] / 2))
    }]);
    speakMessage("Canvas has been cleared");
  };

  const copyImage = (gridIndex) => {
    if (gridIndex !== -1) {
      const tileX = tiles[gridIndex].x;
      const tileY = tiles[gridIndex].y;
      const imageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY);
      
      if (imageIndex !== -1) {
        const imageToCopy = savedImages[imageIndex];
        setCopiedImage(imageToCopy);
        speakMessage(`Copied image: ${imageToCopy.name}`);
        console.log(`Copied image: ${imageToCopy.name}`);
      } else {
        speakMessage('There is no image on this tile to copy.');
      }
    }
  };

  const pasteImage = (gridIndex) => {
    if (gridIndex !== -1 && copiedImage) {
      const tileX = tiles[gridIndex].x;
      const tileY = tiles[gridIndex].y;
      
      // Check if there's already an image at this location
      const existingImageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY);
      
      if (existingImageIndex !== -1) {
        speakMessage('There is already an image on this tile. Please delete it first or choose another tile.');
        return;
      }
      
      // Create a new image object based on the copied one
      const newImage = {
        ...copiedImage,
        name: `${copiedImage.name} (copy)`,
        coordinate: { x: tileX, y: tileY },
        canvas: { x: tileX, y: tileY }
      };
      
      // Add the new image to savedImages
      setSavedImages(prevImages => [...prevImages, newImage]);
      
      speakMessage(`Pasted image: ${newImage.name}`);
      console.log(`Pasted image: ${newImage.name}`);
    } else if (!copiedImage) {
      speakMessage('No image has been copied yet.');
    }
  };

  const handleOverlapModeKeyDown = (e) => {
    if (!isOverlapMode || selectedImageIndex === null) return;

    const currentImage = savedImages[selectedImageIndex];
    const currentZIndex = currentImage.zIndex;
    const maxZIndex = savedImages.length - 1;

    // Handle ESC key to exit overlap mode
    if (e.key === 'Escape') {
      setIsOverlapMode(false);
      setSelectedImageIndex(null);
      speakMessage("Exiting overlap mode");
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        if (currentZIndex < maxZIndex) {
          // Move image up in stack
          const newImages = [...savedImages];
          const targetImage = newImages.find(img => img.zIndex === currentZIndex + 1);
          if (targetImage) {
            targetImage.zIndex = currentZIndex;
            currentImage.zIndex = currentZIndex + 1;
            setSavedImages(newImages);
            announceOverlapOrder(currentImage);
          }
        } else {
          speakMessage(`${currentImage.name} is already at the top`);
        }
        break;

      case 'ArrowDown':
        if (currentZIndex > 0) {
          // Move image down in stack
          const newImages = [...savedImages];
          const targetImage = newImages.find(img => img.zIndex === currentZIndex - 1);
          if (targetImage) {
            targetImage.zIndex = currentZIndex;
            currentImage.zIndex = currentZIndex - 1;
            setSavedImages(newImages);
            announceOverlapOrder(currentImage);
          }
        } else {
          speakMessage(`${currentImage.name} is already at the bottom`);
        }
        break;
    }
  };

  // Add function to check for overlapping images
  const getOverlappingImages = (image) => {
    const { x: currX, y: currY } = image.canvas;
    const { width: currWidth, height: currHeight } = image.sizeParts;
    const tolerance = -(currWidth / 20);

    const currLeft = currX - currWidth / 2 - tolerance;
    const currRight = currX + currWidth / 2 + tolerance;
    const currTop = currY - currHeight / 2 - tolerance;
    const currBottom = currY + currHeight / 2 + tolerance;

    return savedImages.filter(otherImage => {
      if (otherImage === image) return false;

      const { x: otherX, y: otherY } = otherImage.canvas;
      const { width: otherWidth, height: otherHeight } = otherImage.sizeParts;

      const otherLeft = otherX - otherWidth / 2 - tolerance;
      const otherRight = otherX + otherWidth / 2 + tolerance;
      const otherTop = otherY - otherHeight / 2 - tolerance;
      const otherBottom = otherY + otherHeight / 2 + tolerance;

      return !(otherRight < currLeft ||
        otherLeft > currRight ||
        otherBottom < currTop ||
        otherTop > currBottom);
    });
  };

  // Add function to announce overlap order
  const announceOverlapOrder = (currentImage) => {
    const overlappingImages = getOverlappingImages(currentImage);
    
    if (overlappingImages.length === 0) {
      speakImmediate(`${currentImage.name} is not overlapping with any other images`, 1);
      return;
    }

    // Sort overlapping images by z-index
    const sortedOverlaps = overlappingImages.sort((a, b) => a.zIndex - b.zIndex);
    
    // Create announcement message
    let message = `${currentImage.name} is overlapping with: `;
    sortedOverlaps.forEach((img, index) => {
      const position = img.zIndex < currentImage.zIndex ? 'below' : 'above';
      message += `${img.name} is ${position} the ${currentImage.name} `;
    });
    
    speakImmediate(message, 1);
  };

  const handleChat = async () => {
    if (focusedIndex === null) {
      speakMessage('Please select a tile first.');
      return;
    }

    const tile = tiles[focusedIndex];
    const image = savedImages.find(img => img.coordinate.x === tile.x && img.coordinate.y === tile.y);
    
    if (!image) {
      speakMessage('There is no image on this tile.');
      return;
    }

    speakImmediate("Selected: Image Chat. Press Q to ask questions about the selected image.", speechSpeed);
    imageChat(focusedIndex);
  };

  const handleCanvasQuestion = async () => {
    if (canvasQuestionActive) return;
    setCanvasQuestionActive(true);
    
    try {
      speakMessage("Ask a question about the entire canvas.");
      const voiceInput = await startListening();
      setPromptText(voiceInput);

      speakMessage(`You have asked: ${voiceInput}.`);

      // Capture the canvas image
      const canvasImage = await captureCanvasImage(savedImages, canvasSize);
      
      const customPrompt = `
        You are describing a canvas to a Blind and Visually Impaired Person.
        Keep the description brief and straightforward.
        Answer the question the user is asking first.
        Question: ${voiceInput}
        
        Here are the images on the canvas:
        ${savedImages.map((img, index) => `
          Image ${index + 1}:
          - Name: "${img.name}"
          - Description: "${img.descriptions}"
          - Position: (${img.canvas.x}, ${img.canvas.y})
          - Size: ${img.sizeParts.width}px × ${img.sizeParts.height}px
        `).join("\n")}
      `;

      const response = await axios.post("/api/openai/description", { 
        prompt: customPrompt,
        canvasImage: canvasImage
      });

      if (response.data && response.data.description) {
        speakMessage(response.data.description);
      } else {
        speakMessage("Sorry, I couldn't process your question. Please try again.");
      }
    } catch (error) {
      console.error("Error handling canvas question:", error);
      speakMessage("Sorry, there was an error processing your question. Please try again.");
    } finally {
      setCanvasQuestionActive(false); // Automatically exit canvas question mode
    }
  };

  const fetchImageDescription = async (gridIndex) => {
    try {
      const tileX = tiles[gridIndex].x;
      const tileY = tiles[gridIndex].y;
      const imageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY);
      
      if (imageIndex === -1) {
        speakMessage("No image found on this tile.");
        setinfoActive(false);
        return;
      }

      const image = savedImages[imageIndex];
      const imageURL = image.image_nbg || image.url;

      // Convert blob URL to base64 if it's a blob URL
      let base64Image;
      if (imageURL.startsWith('blob:')) {
        const response = await fetch(imageURL);
        const blob = await response.blob();
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        base64Image = imageURL;
      }

      const customPrompt = `
        You are describing an image to a Blind and Visually Impaired Person.
        Keep the description brief and straightforward.
        
        Here is the image information:
        - Name: "${image.name}"
        - Current Description: "${image.descriptions}"
        - Position: (${image.canvas.x}, ${image.canvas.y})
        - Size: ${image.sizeParts.width}px × ${image.sizeParts.height}px
        
        Please provide a natural, flowing description that:
        1. Describes the main subject of the image
        2. Mentions any notable details or features
        3. Keeps the description brief and easy to understand
        4. Uses natural language to describe the image
        
        Focus on creating a clear mental picture of the image.
      `;

      const response = await axios.post("/api/openai/description", { 
        prompt: customPrompt,
        canvasImage: base64Image
      });

      if (response.data && response.data.description) {
        speakMessage(response.data.description);
      } else {
        speakMessage("Sorry, I couldn't generate a description for this image.");
      }
    } catch (error) {
      console.error("Error fetching image description:", error);
      speakMessage("Sorry, there was an error generating the description. Please try again.");
    } finally {
      setinfoActive(false); // Always exit info mode after completion
    }
  };

  // Add function to handle background image upload
  const handleBackgroundUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target.result;
        setBackgroundImage(imageUrl);
        speakMessage("Background image uploaded successfully.");

        try {
          // Create background image object
          const backgroundImageObject = {
            name: 'Background Image',
            url: imageUrl,
            image_nbg: imageUrl,
            canvas_descriptions: '',
            coordinate: { x: Math.round(canvasSize.width / 2), y: Math.round(canvasSize.height / 2) },
            canvas: { x: Math.round(canvasSize.width / 2), y: Math.round(canvasSize.height / 2) },
            sizeParts: { width: canvasSize.width, height: canvasSize.height },
            zIndex: -1,
            isBackground: true
          };
          
          // Update savedImages with the new background image
          setSavedImages(prevImages => {
            // Remove any existing background image
            const filteredImages = prevImages.filter(img => !img.isBackground);
            // Add the new background image at the beginning
            return [backgroundImageObject, ...filteredImages];
          });

          console.log("Background image uploaded successfully. Getting description...");
          
          // Get description of the background image
          const customPrompt = `
            You are describing a background image to a Blind and Visually Impaired Person.
            Keep the description brief and straightforward.
            Focus on describing the overall scene, colors, and any notable elements.
            This is a background image that will be used as a canvas backdrop.
          `;

          const response = await axios.post("/api/openai/description", { 
            prompt: customPrompt,
            canvasImage: imageUrl
          });

          if (response.data && response.data.description) {
            speakMessage(response.data.description);
            // Update the background image object with the description
            backgroundImageObject.canvas_descriptions = response.data.description;
            setSavedImages(prevImages => {
              const filteredImages = prevImages.filter(img => !img.isBackground);
              return [backgroundImageObject, ...filteredImages];
            });
          } else {
            speakMessage("Background image uploaded, but couldn't get its description.");
          }
        } catch (error) {
          console.error('Error fetching background description:', error);
          speakMessage("Background image uploaded, but couldn't get its description.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add function to remove background
  const removeBackgroundImage = () => {
    setBackgroundImage(null);
    speakMessage("Background image removed");
    // Remove background image from savedImages array
    setSavedImages(prevImages => prevImages.filter(img => !img.isBackground));
  };

  return (
    <div id='imageGeneration'>
    <Dialog open={settingsOpen} onClose={handleSettingsClose} aria-labelledby="welcome-dialog-title">
    <div style={{ flexGrow: 1, margin: '6%' }}>
      <h1 id="mainHeader"  aria-label="Alt-Canvas, the image editor for blind users" style={{ fontSize: '1rem', marginTop: '0', color: '#1E90FF'}}>System Settings</h1>
    </div>
        <DialogContent>
            <div>
                <p>Current Image Style: {graphicsMode}</p>
                <h4>Image Style (color or tactile graphic):</h4>
                <button style={{ marginLeft: "20%" }} onClick={handleTactileMode} aria-label="Select Tactile Graphics Mode">
                Tactile
                </button>
                <button onClick={handleColorMode} aria-label="Select Color Graphics Mode">
                Color
                </button>
            </div>
            <br/>
            <div>
                <p>Current Speech Speed: {speechSpeed}</p>
                <h4>Speech Speed (Max 2, Min 0.5, 0.2 intervals):</h4>
                <button style={{ marginRight: '1rem' }} onClick={handleIncreaseSpeechSpeed} aria-label="Increase Speech Speed">
                  + Increase Speed
                </button>
                <button onClick={handleDecreaseSpeechSpeed} aria-label="Decrease Speech Speed">
                  - Decrease Speed
                </button>
              </div>
            <br/>
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Canvas Background:</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  style={{ display: 'none' }}
                  id="background-upload"
                />
                <label htmlFor="background-upload" style={{
                  padding: '10px 20px',
                  backgroundColor: '#1E90FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '1rem',
                  margin: 0
                }}>
                  Upload Background
                </label>
                {backgroundImage && (
                  <button
                    onClick={removeBackgroundImage}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '1rem',
                      margin: 0
                    }}
                  >
                    Remove Background
                  </button>
                )}
              </div>
            </div>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleSettingsClose} color="primary">Close</Button>
        </DialogActions>
    </Dialog>

    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
      <div style={{ flexGrow: 1, marginLeft: '2%' }}>
        <h1 id="mainHeader" aria-label="Alt-Canvas, the image editor for blind users" style={{ fontSize: '1.4rem', marginTop: '0', color: '#1E90FF' }}>ALT-CANVAS</h1>
      </div>
      <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '1rem',
        marginLeft: '1rem',
        marginRight: '1rem'
      }}
    >
      <button
        style={{ 
          width: '150px',
          padding: '10px 20px',
          backgroundColor: '#1E90FF',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        aria-label="Instructions"
        onClick={toggleInstructions}
      >
        <HelpIcon style={{ fontSize: '20px' }} />
        Instructions
      </button>
      
      <button
        style={{ 
          width: '150px',
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        aria-label="System Settings"
        onClick={() => setOpenSettings(true)}
      >
        <PaletteIcon style={{ fontSize: '20px' }} />
        Settings
      </button>
      <button
        style={{ 
          width: '150px',
          padding: '10px 20px',
          backgroundColor: '#ffc107',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        aria-label="Review keyboard shortcuts"
        onClick={toggleKeyboardShortcuts}
      >
        <KeyboardIcon style={{ fontSize: '20px' }} />
        Shortcuts
      </button>
      <button
      style={{ 
        width: '150px',
        padding: '10px 20px',
        backgroundColor: '#9c27b0',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
      aria-label="Ask Questions"
      onClick={handleAskQuestions}
    >
      <QuestionAnswerIcon style={{ fontSize: '20px' }} />
      Ask Questions
    </button>
      <button 
        style={{ 
          width: '150px',
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        aria-label="Render canvas after you have made the image" 
        className="renderButton" 
        onClick={() => {
          speakMessage("Navigating to render canvas view. You can print, download, or save your canvas here.");
          navigate('/render', { state: { savedImages, canvasSize } });
        }}
      >
        <ViewInArIcon style={{ fontSize: '20px' }} />
        Render
      </button>
      <button
        style={{ 
          width: '150px',
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        aria-label="Clear Canvas" 
        onClick={clearCanvas}
      >
        <DeleteIcon style={{ fontSize: '20px' }} />
        Clear Canvas
      </button>
    </div>
    
    </div>


      <div className='mainContainer'>
      
        <div 
          className="leftContainer"
          aria-label="Left Portion of the Screen"
          >
          <div 
            aria-label="Left Portion of Screen Tiles Container"
            id="tileContainer" 
            ref={canvasRef} 
            style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative', 
            ...canvasSize,  }} 
            tabIndex={0}>

            
            {tiles.map((tile, index) => (
              <div
                className='pixel'
                aria-label={`Tile ${index + 1}`} 
                aria-live="polite"
                autoFocus
                ref={(el) => tileRefs.current[index] = el}
                key={index}
                onKeyDown={(event) => {
                  setFocusedIndex(index);
                  if(tiles>1){
                    const currImage = isImageOnTile(tile.x, tile.y)
                    console.log('image on TILE', currImage)
                    if (currImage && !currImage.isBackground) {
                      speakMessage(`${currImage.name}`);
                    }
                  }
                  tileNavigation(event, index, savedImages.some(image => image.coordinate.x === tile.x && image.coordinate.y === tile.y));
                }}
                tabIndex={0}
                style={{
                  border: '3px solid gray', 
                  borderRadius: '13px',
                  boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
                  width: '10%', 
                  height: "10%",
                  margin: '5px',
                  position: 'absolute',
                  left: tile.x,
                  top: tile.y, 
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                
                {loading && activeIndex === index ? (
                  <MoonLoader size={30}/>
                ) : (
                  savedImages
                    .filter(savedImage => 
                      savedImage.coordinate.x === tile.x && 
                      savedImage.coordinate.y === tile.y &&
                      !savedImage.isBackground
                    ).map((image, imageIndex) => (
                      <img
                        key={imageIndex}
                        src={image.image_nbg || image.url}
                        alt=""
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                      />
                    ))
                )}
              </div>
            ))}
          </div>

        
        </div>
        <div 
          className="rightContainer"
          aria-label="Right Portion of the Screen"
          >
          <h4>Canvas</h4>
            <div id="canvas" aria-label="Canvas" ref={canvasRef} style={{ 
              position: 'relative', 
              ...canvasSize, 
              boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
            }} tabIndex={0}>
              {backgroundImage && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  zIndex: -1
                }} />
              )}
              {savedImages
                .filter(image => !image.isBackground)
                .sort((a, b) => a.zIndex - b.zIndex) // Sort images by zIndex
                .map((image, index) => {
                if (image.image_nbg !== '') { 
                    return (
                        <div key={index} 
                             style={{ 
                               position: 'absolute', 
                               left: `${image.canvas.x - ( image.sizeParts.width / 2 ) }px`, 
                               top: `${image.canvas.y  - ( image.sizeParts.width / 2 )}px`,
                               zIndex: image.zIndex // Apply zIndex to the div
                             }} 
                             tabIndex={0}>
                            <img
                                src={image.image_nbg}
                                alt={`Generated Content ${index}`}
                                style={{
                                    width: image.sizeParts.width + 'px',
                                    height: image.sizeParts.height + 'px',
                                    cursor: 'move', 
                                }}
                            />
                        </div>
                    );
                }
                return null;
            })}
            
              </div>

        </div>


      
      {showInstructions && (
        <Dialog
          open={showInstructions}
          onClose={toggleInstructions}
          aria-labelledby="instructions-dialog-title"
        >
          <DialogTitle id="instructions-dialog-title">
            <h1 style={{ fontSize: '1.4rem', marginTop: '0', color: '#1E90FF' }}>How to Use AltCanvas</h1>
          </DialogTitle>
          <DialogContent style={{width: '100%'}} aria-live="polite">
            <div style={{marginBottom: '1rem'}}>
              <p>AltCanvas is a tile-based image editor designed for blind and visually impaired users. Here's how to get started:</p>
              <ol style={{marginLeft: '1rem'}}>
                <li style={{marginBottom: '0.5rem'}}>Press <kbd>Enter</kbd> on the first tile to generate your first image using voice commands</li>
                <li style={{marginBottom: '0.5rem'}}>Use arrow keys to navigate between tiles (with directional sound feedback)</li>
                <li style={{marginBottom: '0.5rem'}}>Press <kbd>Shift + D</kbd> anytime to hear a description of your canvas</li>
                <li style={{marginBottom: '0.5rem'}}>Use <kbd>Shift + L</kbd> to move images and <kbd>Shift + S</kbd> to resize them</li>
              </ol>
              <p>For more detailed instructions, visit our <a href="https://arxiv.org/pdf/2408.10240" target="_blank" rel="noopener noreferrer">documentation</a> or watch our <a href="https://www.youtube.com/watch?v=tJUqjjwSxPs" target="_blank" rel="noopener noreferrer">video tutorial</a>.</p>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={toggleInstructions} color="primary">Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {showKeyboardShortcuts && (
        <Dialog
          open={showKeyboardShortcuts}
          onClose={toggleKeyboardShortcuts}
          aria-labelledby="shortcuts-dialog-title"
        >
          <DialogTitle id="shortcuts-dialog-title">
            <h1 style={{ fontSize: '1.4rem', marginTop: '0', color: '#1E90FF' }}>Keyboard Shortcuts</h1>
          </DialogTitle>
          <DialogContent style={{width: '100%'}} aria-live="polite">
            <div style={{marginBottom: '2%'}}>
              <p>Press the up down arrowkeys to navigate through the keyboard shortcuts</p>
              <br/>
              <ul style={{marginTop: '0.5rem', width: '100%'}}>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Enter</kbd> : To generate or regenerate an image on a tile.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>D</kbd>: Description - Descriptions about what the canvas currently looks like.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>D</kbd>: Info - Descriptions about the currently selected item on the tile.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>C</kbd>: Chat - Opens a chat window related to the currently selected item.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>L</kbd>: Location Edit Mode - Allows you to edit the location of the currently selected item.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>S</kbd>: Size Edit Mode - Adjust the size of the currently selected item.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>R</kbd>: Radar Scan - Gives a Description about the nearby objects.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>T</kbd>: Render Canvas - Render the final canvas.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>K</kbd>: Keyboard Commands - Hear these instructions.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>X</kbd>: Delete Image - Delete the selected image.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>?</kbd>: Ask Questions - Ask a question about how to use AltCanvas.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>H</kbd>: Help - Open the instructions dialog.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>P</kbd>: Settings - Open the settings dialog.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>ESC</kbd>: Exit Mode - Exit any of the modes at a given point.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>Z</kbd>: Clear Canvas - Clear the entire canvas.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>Y</kbd>: Copy Image - Copy the selected image.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>V</kbd>: Paste Image - Paste the copied image.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Ctrl</kbd> + <kbd>C</kbd>: Copy Image - Copy the selected image.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Ctrl</kbd> + <kbd>V</kbd>: Paste Image - Paste the copied image.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>Shift</kbd> + <kbd>O</kbd>: Overlap Mode - Toggle overlap mode for images.
                </li>
                <li style={{marginBottom: '2%'}}>
                  <kbd>ESC</kbd>: Exit Mode - Exit any of the modes at a given point.
                </li>
              </ul>
              <p>Note: These shortcuts require a tile to be focused. If no tile is focused, a voice prompt will indicate that no tile is selected.</p>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={toggleKeyboardShortcuts} color="primary">Close</Button>
          </DialogActions>
        </Dialog>
      )}
  </div>
      </div>    
  );
};