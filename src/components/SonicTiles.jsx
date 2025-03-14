/* eslint-disable no-unused-vars */
import * as Tone from 'tone';

import React, { useEffect, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { MoonLoader } from 'react-spinners';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export const SonicTiles = () => {
  
  const [settingsOpen, setOpenSettings] = useState(false);

  useEffect(() => {
    setOpenSettings(true);
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

  useEffect(() => {

    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }

    sendUuidToServer();
    const uuid=  localStorage.getItem('uuid');

    tileRefs.current[0].focus()
    if(!messagePlayed){
      speakMessage('You are currently focused on the first tile. Press Enter to Generate the first Image')
      messagePlayed = true;
    }
    // speakMessage('You are currently focused on the first tile. Press Enter to Generate the first Image')
   

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
    "Command Two, Shift + G as in Global: Hear the global description of the canvas with all the images on it",
    "Command Three, Shift + I as in Information: Hear the local information about selected item on the tile",
    "Command Four, Shift + C as in Chat: Ask a question about the iamge on the tile",
    "Command Five, Shift + L as in Location: Enter Location Edit Mode",
    "Command Six, Shift + S as in Size: Enter Size Edit Mode",
    "Command Seven,  Shift + R as in Radar: Radar scan for nearby objects",
    "Command Eight, Shift + D as in Dog: Render Final Canvas",
    "Command Nine, Shift + K as in Keyboard: Hear Keyboard Instructions",  
    "Command Ten, Shift + X as Xylophone: Delete Image",  
    "Command Eleven, Escape: Exit any mode"
  ];

  let currentCommandIndex = 0;

  function displayCurrentCommand() {
    console.log(`Current Command: ${commands[currentCommandIndex]}`);
  }

 let keyOptions;

  
  function defaultKeyOptions(event) {

    if (event.shiftKey && event.key === 'K') {
      console.log('Shift+K pressed');
      toggleInstructions();
      keyOptions = true;
      console.log('keyOptions',keyOptions);
      speakMessage('Keyboard Instructions.');
      speakMessage('To Navigate through the Options use Up and Down arrow keys. There are a total of 10 commands. Press the escape key Twice to exit the mode.');
      displayCurrentCommand();
    } else if (event.shiftKey && event.key === 'D') {
      console.log('Shift+S pressed');
      renderCanvas(savedImages);
    } 
    
    if(keyOptions){
       if (event.keyCode === 38) { // Up arrow key
        console.log('Up pressed');
        currentCommandIndex = (currentCommandIndex - 1 + commands.length) % commands.length;
        speakMessage(commands[currentCommandIndex]);
        displayCurrentCommand();
      } else if (event.keyCode === 40) { // Down arrow key
        console.log('Down pressed');
        currentCommandIndex = (currentCommandIndex + 1) % commands.length;
        speakMessage(commands[currentCommandIndex]);
        displayCurrentCommand();
      } else if (event.keyCode === 27) { // ESC key
        console.log('ESC pressed');
        keyOptions = false
        console.log('keyOptions', keyOptions);
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

  const renderCanvas = () => {
    console.log('SavedImages',savedImages)
    saveToSessionStorage();
    speakMessage('Going to Render Canvas')
    navigate('/render', { state: { savedImages, canvasSize } });
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

  let [globalDescriptionPrompt, setglobalDescriptionPrompt ] = useState('')
  const [showInstructions, setShowInstructions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(5);
  const [gridItems, setGridItems] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [promptText, setPromptText] = useState('');

  const tileRefs = useRef([]);
  if (tileRefs.current.length !== tiles.length) {
    // Initialize or update the refs array to match the tiles array length
    tileRefs.current = Array(tiles.length).fill().map((_, i) => tileRefs.current[i] || React.createRef());
  }
  const playerLRRef = useRef(null);
  const playerURef = useRef(null);
  const playerDRef = useRef(null);
  const loadingPlayerRef = useRef(null);

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
    const currentTime = getFormattedTimestamp();
    window.speechSynthesis.speak(utterance);
    utterance.rate = 0.9; 
  
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
          setFocusedIndex(savedImages.length - 1);
    
          const existingTileIndex = focusedIndex;

          console.log('existingTileInex', existingTileIndex)
          if (existingTileIndex === -1) {
            return
          } else if (isEditingLocation) {
            console.log('Editing Image', savedImages[editingImageIndex])
            const newTile = tiles.findIndex(tile => tile.x === savedImages[editingImageIndex].coordinate.x && tile.y === savedImages[editingImageIndex].coordinate.y);
            console.log('New tile the iamge has moved to ', newTile)
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

  const toggleInstructions = (event) => {
    setShowInstructions(prevState => !prevState);
    setShowInstructions(!showInstructions);
    keyOptions = !keyOptions
    console.log('Toggle keyOptions', !keyOptions)
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
            speakMessage(`Overlapping with ${otherImage.name}`);
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

  const note_url = "https://storage.googleapis.com/altcanvas-storage/generating.mp3";

  const loadingPlayer = new Tone.Player().toDestination();
  loadingPlayer.load(note_url).then(() => {
    loadingPlayerRef.current = loadingPlayer;
  });


  const playNotes = () => {
    if (!isGeneratingImage) {
      console.log('Not playing because isGeneratingImage is false');
      return;
    }
  
    console.log('In play');
    const panner = new Tone.Panner3D({
      positionX: 0,
      positionY: 0,
      positionZ: 0,
    }).toDestination();
  
    const playSound = () => {
      if (isGeneratingImage) {
        console.log('Playing Notes');
        if (loadingPlayerRef.current.state !== "started") {
          loadingPlayerRef.current.disconnect();
          loadingPlayerRef.current.chain(panner, Tone.Destination);
          loadingPlayerRef.current.start();
        }
      } else {
        console.log('Stopping Notes');
        loadingPlayerRef.current.stop();
      }
    };
  
    // Start playing sound and set an interval to check if isGeneratingImage changes
    playSound();
    const checkInterval = setInterval(() => {
      playSound(); // Ensure continuous check and action based on isGeneratingImage
      if (!isGeneratingImage) {
        loadingPlayerRef.current.stop();
        clearInterval(checkInterval);
        console.log('Stopping Notes due to isGeneratingImage becoming false');
      }
    }, 5000); // Check every second
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
      utterance.rate = 1;
      utterance.volume = 1;
  
      window.speechSynthesis.speak(utterance);
  
      // Wait for the key press event to complete
      const isConfirmed = await new Promise((resolve) => {
        // Set up the key press event listener inside the Promise
        function keyPressHandler(event) {
          document.removeEventListener('keydown', keyPressHandler);
          if (event.key === "Enter") {
            speakMessage('Enter pressed, image generation starting.');
            isGeneratingImage = true;
            playNotes();
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
  try {
      if (loadingSound) {
          loadingSound.pause(); // Pause the sound
          loadingSound.currentTime = 0; // Reset the playback position to the start
          console.log('Loading sound has been stopped and reset.');
      }
  } catch (error) {
      console.error('Error stopping the audio:', error);
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
          speakMessage('Max Size Reached')
        }else{
          scaleFactor = 1.1;
          changedFrequency = changedFrequency + 30
         
        }
        break;
      case 'ArrowDown':
        if (originalWidth <= 50){
          speakMessage('Min Size Reached')
        } else{
          scaleFactor = 0.9;
          changedFrequency = changedFrequency - 30
        }
        break;
      case 'Shift':
        speakMessage(`The current size is ${savedImages[editingSizeImageIndex].sizeParts.width} by ${savedImages[editingSizeImageIndex].sizeParts.height}`);

        console.log(`${currentTime}: Size - Edit Info Focused Index: ${focusedIndex}`);
          
        // logEvent({
        //   time: currentTime,
        //   action: 'size_edit_info',
        //   focusedIndex: focusedIndex,
        // });
        
        break;
      case 'Escape':
        setIsEditingSize(false);
        setEditingSizeImageIndex(null);
        setFocusedIndex(focusedIndex);
        
        speakMessage("Size Edit mode exited");
        console.log(`${currentTime}: Size - Edit Exit Focused Index: ${focusedIndex}`);
          
        // logEvent({
        //   time: currentTime,
        //   action: 'size_edit_exit',
        //   focusedIndex: focusedIndex,
        // });
        
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

  const getSurroundingPositions = (index) => {
    console.log('tiles', tiles[index])
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

  // const logEvent = (data) => {
  //   console.log('Logging event:', data);
  //   localStorage.setItem('lastKeyEvent', JSON.stringify(data)); // Store locally

  //   fetch('https://art.alt-canvas.com/log-data', {
  //       method: 'POST',
  //       headers: {
  //           'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(data)
  //   })
  //   .then(response => response.json())
  //   .then(data => console.log('Server response:', data))
  //   .catch(error => console.error('Error sending data to server:', error));
  // }

  const playModeNotification = (message, callback) => {
    const utterance = new SpeechSynthesisUtterance(message);
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
      
      if (e.shiftKey && e.key === 'R') {
        if (focusedIndex !== null) {
          console.log('Radar Scan Activated');
          console.log('Focused Index', focusedIndex);
          setRadarActive(true);
          console.log(`${currentTime}: Radar Scan - Focused Index: ${focusedIndex}`);
          
          // logEvent({
          //   time: currentTime,
          //   action: 'radar_scan_start',
          //   focusedIndex: focusedIndex,
          // });

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

            // logEvent({
            //   time: currentTime,
            //   action: 'location_edit_start',
            //   focusedIndex: focusedIndex,
            // });

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

          // logEvent({
          //   time: currentTime,
          //   action: 'size_edit_start',
          //   focusedIndex: focusedIndex,
          // });
          
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
      } else if (e.shiftKey && e.key === 'I') {
        if (focusedIndex !== null && isImageOnTile(tiles[focusedIndex].x, tiles[focusedIndex].y)) {
          setinfoActive(true); 
          console.log(`${currentTime}: Local Information - Focused Index: ${focusedIndex}`);

          // logEvent({
          //   time: currentTime,
          //   action: 'localInfo_start',
          //   focusedIndex: focusedIndex,
          // });

          playModeNotification("Describing Image on Tile. Press the Escape Key to stop me.", () => {
            setFocusedIndex(focusedIndex)
            readInfo(focusedIndex);
            setFocusedIndex(focusedIndex)
          });
          setFocusedIndex(focusedIndex)
          if (tileRefs.current[focusedIndex]) {
            tileRefs.current[focusedIndex].focus();
          }

          setTimeout(() => {
            setinfoActive(false);
          }, 3000); 
        } else {
          speakMessage('There is no image on this tile.');
          console.log("There is no image on this tile.");
        }
      }  else if (e.shiftKey && e.key === 'C') {
        if (focusedIndex !== null && isImageOnTile(tiles[focusedIndex].x, tiles[focusedIndex].y) ) {
          console.log('Focused Index', focusedIndex);
          setchatActive(true); 
          console.log(`${currentTime}: Chat - Focused Index: ${focusedIndex}`);

          // logEvent({
          //   time: currentTime,
          //   action: 'chat_start',
          //   focusedIndex: focusedIndex,
          // });

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
      } else if (e.shiftKey && e.key === 'G') {
        speakMessage('Describing Canvas. Press the Escape Key to stop me.')
        fetchGlobalDescription();

        // logEvent({
        //   time: currentTime,
        //   action: 'globalInfo_start',
        //   focusedIndex: focusedIndex,
        // });
        console.log(`${currentTime}: Global Information - Focused Index: ${focusedIndex}`);
      }
      else if (e.shiftKey && e.key === 'X') {
        speakMessage('Deleted Image on Tile.')
        deleteImage(focusedIndex)

        // logEvent({
        //   time: currentTime,
        //   action: 'delete_image',
        //   focusedIndex: focusedIndex,
        // });
        
        console.log(`${currentTime}: Deleted Image- Focused Index: ${focusedIndex}`);
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

  const readInfo = (gridIndex) => {
    const tileX = tiles[gridIndex].x;
    const tileY= tiles[gridIndex].y
    const imageIndex = savedImages.findIndex(image => image.coordinate.x === tileX && image.coordinate.y === tileY)
    
    const image = savedImages[imageIndex];

    console.log('image.coordinate.x / canvasSize.width', image.coordinate.x / canvasSize.width)

    const script = `
      The image is called ${image.name}.
      It is located x coordinate ${image.coordinate.x} and y coordinate ${image.coordinate.y} 
      The size of the image is ${image.sizeParts.width} in width and  ${image.sizeParts.height} in height
      ${image.descriptions}
    `

    console.log('Read Info Script:', script)
    speakMessage(script);

  };

  const isImageOnTile = (tileX, tileY) => {
    return savedImages.some(image => image.coordinate.x === tileX && image.coordinate.y === tileY);
  };

  const generateDescriptionPrompt = (savedImages) => {
    if (!savedImages || savedImages.length === 0) {
      return "There are no images on the canvas.";
    }
  
    let descriptions = savedImages.map((img, index) => {
      return `Image ${index + 1} named "${img.name}" with prompt "${img.prompt}" is positioned at coordinates (${img.canvas.x}, ${img.canvas.y}) on the canvas, measuring ${img.sizeParts.width} pixels wide by ${img.sizeParts.height} pixels high.`;
    }).join(" ");
  
    return `
      You are describing an image to a Visually Impaired User.
      Give a one-line brief description of what the image looks like.
      Describe the layout of the following images on a canvas based on their coordinates and sizes in a verbal way without 
      using exact numbers: ${descriptions}.
      DO NOT say that it is a square shape. Keep the description short within a paragraph.
      Describe the relative locations of the images and their sizes.
      Considering that there are spaces above and below the image, describe whether or not one image looks like it is placed on top of the other.
    `;
  };
  
  const fetchGlobalDescription = async () => {
    try {
      console.log("Fetching global description...");
  
      const globalDescriptionPrompt = generateDescriptionPrompt(savedImages);
      console.log("Generated Prompt:", globalDescriptionPrompt);
  
      const response = await axios.post("/api/openai/global-description", { prompt: globalDescriptionPrompt });
  
      console.log("Global description response received:", response);
  
      if (response.choices && response.choices.length > 0) {
        const globalDescription = response.data.description;
        console.log("Global Description:", globalDescription);
        speakMessage(globalDescription);
        return globalDescription;
      } else {
        console.warn("No valid global description received.");
        return "No global description available.";
      }
    } catch (error) {
      console.error("Error fetching global description:", error);
      return "Error fetching global description.";
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
        Generate the given image description according to the following criteria:
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
  
        return description;
      } else {
        return 'No description available';
      }
    } catch (error) {
      console.error('Error fetching image description:', error);
      speakMessage('Sorry, could you ask the question again?');
      return 'Error fetching description';
    }
  };

  // Updated fetchImageName function to use the new API endpoint
  const fetchImageName = async (imageURL) => {
    try {
      const response = await axios.post("/api/openai/generate-image-name", { imageURL });
      return response.data.title || 'No title available';
    } catch (error) {
      console.error('Error fetching image name:', error);
      return 'Error fetching name';
    }
  };

  const fetchImageDescription = async (imageURL) => {

    try{
      console.log('fetching image description for', imageURL);

      let customPrompt = `
          You are describing an image to a Blind or Visually Impaired Person.
          Generate the given image description according to the following criteria:
          Briefly describe the primary subject or focus of the image in one sentence.
        `;
  
        const descriptionResponse = await axios.post("/api/openai/describe-image", { imageURL, question: customPrompt });

        console.log("Image description response received:", descriptionResponse);

        if (descriptionResponse.data && descriptionResponse.data.description) {
          console.log("Generated image description:", descriptionResponse.data.description);
          return descriptionResponse.data.description;
        } else {
          console.warn("No valid description received.");
          return "No description available.";
        }
  
    }
    catch (error) { 
      console.error('Error fetching image description:', error);
      return 'Error fetching description';
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

  const generateImage = async (index, isRegeneration = false) => {
    if (isGeneratingImage) return; // Prevent duplicate triggers
    setIsGeneratingImage(true); // Lock Enter key from triggering movement
  
    setLoading(true);
    setActiveIndex(index);
  
    let shouldCancel = false;
    let isConfirmed = false;
    let isWaitingForConfirmation = false; // Prevent duplicate Enter triggers
  
    // Keydown listener for Enter (confirm) and Escape (cancel)
    const keydownListener = (event) => {
      if (event.key === "Escape") {
        shouldCancel = true;
        console.log("Generation cancellation requested.");
        speakMessage("Image generation cancelled.");
        setLoading(false);
        setIsGeneratingImage(false); // Unlock movement
        document.removeEventListener("keydown", keydownListener);
        return;
      }
      if (event.key === "Enter" && isWaitingForConfirmation) {
        isConfirmed = true;
        console.log("Generation confirmed.");
      }
    };
  
    document.addEventListener("keydown", keydownListener);
  
    let voiceInput;

    let centerX, centerY;
    centerX = tiles[index].x;
    centerY = tiles[index].y;

    try {
      voiceInput = await startListening();
      setPromptText(voiceInput);
      console.log("Voice Input:", voiceInput);
    } catch (error) {
      console.error("Error during voice input:", error);
      setLoading(false);
      setIsGeneratingImage(false); // Unlock movement
      document.removeEventListener("keydown", keydownListener);
      return;
    }
  
    if (!voiceInput) {
      speakMessage("No voice input detected.");
      setLoading(false);
      setIsGeneratingImage(false); // Unlock movement
      document.removeEventListener("keydown", keydownListener);
      return;
    }
  
    // Now we start waiting for confirmation
    isWaitingForConfirmation = true;
    speakMessage(`You have asked to: ${voiceInput}. Press Enter to confirm or Esc to cancel.`);
  
    // Wait for Enter key confirmation
    while (!isConfirmed) {
      if (shouldCancel) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  
    isWaitingForConfirmation = false;
  
    let imageResponse;
    try {
      console.log("Sending image generation request to DALL‑E‑3...", voiceInput);
      const response = await axios.post("/api/openai/generate-image", { prompt: voiceInput+ 'Focus on creating only the single object the user describes. Keep the background white ' });
      console.log("Image generation response received:", response);
      const imageURL = response.data.url;
      const imageSize = 100;

      if (!imageURL) {
        console.error("No valid image URL received.");
        setLoading(false);
        setIsGeneratingImage(false); // Unlock movement
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
        canvas: {x: centerX, y: centerY},
        sizeParts: { width: imageSize  , height: imageSize},
      };
      imageObject.image_nbg = await removeBackground(imageURL, imageObject);
      imageObject.descriptions = await fetchImageDescription(imageURL);
      speakMessage(imageObject.descriptions);
      // Update the image name using the new API endpoint
      imageObject.name = await fetchImageName(imageURL);

      console.log("Final Image Object:", imageObject);

      try {
        if (isRegeneration) {
          updateImageAtIndex(index, imageObject);
        } else {
          setSavedImages((prevImages) => [...prevImages, imageObject]);
        }
        
        // Ensure `setFocusedIndex` is called properly
        setFocusedIndex(index);
        
        // Ensure `focus()` is only called if the reference exists
        if (tileRefs.current[index]) {
          tileRefs.current[index].focus();
        }
      } catch (error) {
        console.error("Error updating saved images:", error);
      }      
      
    } catch (error) {
      console.error("Error generating image from OpenAI:", error);
      setLoading(false);
      setIsGeneratingImage(false); // Unlock movement
      document.removeEventListener("keydown", keydownListener);
      return;
    }

  
    document.removeEventListener("keydown", keydownListener);
    setLoading(false);
    setIsGeneratingImage(false); // Unlock movement
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

 
  return (
    <div id='imageGeneration'>


    <Dialog open={settingsOpen} onClose={handleSettingsClose} aria-labelledby="welcome-dialog-title">
    <div style={{ flexGrow: 1, margin: '6%' }}>
      <h1 id="mainHeader"  aria-label="Alt-Canvas, the image editor for blind users" style={{ fontSize: '1.4rem', marginTop: '0', color: '#1E90FF' }}>System Settings</h1>
    </div>
        <p id="welcome-dialog-title" style={{padding: '1rem'}}>
          Welcome to AltCanvas. Select the system settings on Image Style and Speech Speech below.
          Press the Speech Speed Buttons up and down to hear the sample speed
        </p>
        <DialogContent>
            <div>
              <h3>Canvas Size</h3>
              <br/>
              <label htmlFor="width">Width:</label>
              <input
                type="number"
                id="width"
                style={{ margin: '0 10px', border:'2px solid royalblue' }}
              />
              <label htmlFor="height">Height:</label>
              <input
                type="number"
                id="height"
                style={{ margin: '0 10px', border:'2px solid royalblue' }}
              />
            </div>
            <br/>
            <br/>
            <div>
                <h3>Image Style:</h3>
                <button  style={{marginLeft:"20%"}} onClick={() => console.log('Tactile Graphic selected')}>Tactile Graphic</button>
                <button onClick={() => console.log('Color Graphic selected')}>Color Graphic</button>
            </div>
            <br/>
            <br/>
            <div>
                <h3>Speech Speed:  </h3>   
                <h1 style={{marginLeft:"50%"}}>1</h1>
                <br/>
                  <button style={{marginLeft:"20%"}}  onClick={() => console.log('Fast Speed selected')}> + Increase Speed</button>
                  <button onClick={() => console.log('Medium Speed selected')}> - Descrease Speed </button>
            </div>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleSettingsClose} color="primary">Close</Button>
        </DialogActions>
    </Dialog>

    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
      <div style={{ flexGrow: 1, marginLeft: '2%' }}>
        <h1 id="mainHeader"  aria-label="Alt-Canvas, the image editor for blind users" style={{ fontSize: '1.4rem', marginTop: '0', color: '#1E90FF' }}>ALT-CANVAS</h1>
      </div>
      <div role="banner" aria-labelledby="mainHeader" aria-label="Welcome to AltCanvas an Image Editor for blind users!" style={{ flexGrow: 3, backgroundColor: 'aliceblue', padding: '1rem', margin: '0 1rem', fontSize: '0.9rem' }}>
        <p>
          Welcome to AltCanvas an Image Editor for blind users! In AltCanvas, you create images one by one using tiles.
          Relative locations of images on the tiles reflect the relative locations of the canvas.
          The size of the canvas is {canvasSize.width} width and {canvasSize.height} height. You are currently focused on the 1st tile. Press Enter to Create the 1st Image and tell the system what you want to make after the beep.
          After that, navigate to other tile locations and create images there.
          For more commands, press Shift+K to learn about the keyboard options and press Shift+D to go to the Render Canvas.
          <br/>
          <p style={{fontSize:'0.7rem', textAlign:'right'}}> UUID: {getUuid()}</p>
        </p>
      </div>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center',  marginLeft: '1rem', marginRight: '1rem' }}>
        <button aria-label="Review keyboard shortcuts" aria-expanded="false" onClick={toggleInstructions}>
          Keyboard Shortcuts
        </button>
        <button aria-label="Render canvas after you have made the image" className='renderButton' onClick={renderCanvas}>
          Render Canvas
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
                    // const currImage = savedImages.find(image => image.coordinate.x === tile.x && image.coordinate.y === tile.y)
                    console.log('image on TILE', currImage)
                    speakMessage(`${currImage.name}`);
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
                  savedImages.filter(savedImage => 
                    savedImage.coordinate.x === tile.x && savedImage.coordinate.y === tile.y
                  ).map((image, imageIndex) => (
                    <img key={imageIndex} src={image.url} alt="" style={{ width: '100%', height: '100%', position: 'absolute' }} />
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
          <h4>Canvas {canvasSize.width} x {canvasSize.height}</h4>
              <div id="canvas"  aria-label="Canvas"  ref={canvasRef} style={{ position: 'relative', ...canvasSize, boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' }} tabIndex={0}>
              {savedImages.map((image, index) => {
                if (image.image_nbg !== '') { // Only render and log if image_nbg is not an empty string
                    // Log the image URL here, before returning the JSX
                    // console.log(`Image for index ${index}:`, image);
                    // console.log(`Image for index ${index}:`, image.image_nbg);
                    // console.log(`Image URL for index ${index}:`, image['image_nbg']);
            
                    // Now return your JSX
                    return (
                        <div key={index} 
                             style={{ position: 'absolute', left: `${image.canvas.x - ( image.sizeParts.width / 2 ) }px`, top: `${image.canvas.y  - ( image.sizeParts.width / 2 )}px` }} 
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
                return null; // Return null if image_nbg is empty
            })}
            
              </div>

        </div>


      
      {showInstructions && (
      <div className="instructions" style={{fontSize: '0.8rem'}}>

      <Dialog
      open={showInstructions}
      onClose={toggleInstructions}
      aria-labelledby="form-dialog-title"
      aria-describedby="keyboard-shortcuts-description"
    >
      <DialogTitle id="form-dialog-title">
      <h1 id="mainHeader"  aria-label="Alt-Canvas, the image editor for blind users" style={{ fontSize: '1.4rem', marginTop: '0', color: '#1E90FF' }}>Keyboard Shortcuts</h1>
      </DialogTitle>


      <DialogContent style={{width: '100%'}} aria-live="polite">
        <div
          className="keyboard-shortcuts"
          style={{marginBottom: '2%'}}
          id="keyboard-shortcuts-description"
        >
        <p>
        Press the up down arrowkeys to navigate through the keyboard shortcuts
        </p>
        <br/>
          <ul style={{marginTop: '0.5rem', width: '100%'}}>
            <li style={{marginBottom: '2%'}}>
              <kbd>Enter</kbd> : To generate or regenerate an image on a tile.
            </li>
            <li style={{marginBottom: '2%'}}>
              <kbd>Shift</kbd> + <kbd>G</kbd>: Global - Descriptions about what the canvas currently looks like.
            </li>
            <li style={{marginBottom: '2%'}}>
              <kbd>Shift</kbd> + <kbd>I</kbd>: Info - Descriptions about the currently selected item on the tile.
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
              <kbd>Shift</kbd> + <kbd>X</kbd>: Delete Image - Press Shift+X to delete an Image
            </li>
            <li style={{marginBottom: '2%'}}>
              <kbd>ESC</kbd>: Exit Mode - Exit any of the modes at a given point.
            </li>
          </ul>
          <p>Note: These shortcuts require a tile to be focused. If no tile is focused, a voice prompt will indicate that no tile is selected.</p>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={toggleInstructions}
          color="primary"
          aria-label="Close keyboard shortcuts dialog"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
    
    
      </div>
      )}
  </div>
      </div>    
  );
};