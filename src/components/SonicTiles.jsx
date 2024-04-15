import * as Tone from 'tone';

import { Configuration, OpenAIApi } from 'openai';
import React, { useEffect, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import ClearIcon from '@mui/icons-material/Clear';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { MoonLoader } from 'react-spinners';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export const SonicTiles = () => {
  const apiKey = process.env.REACT_APP_API_KEY;

  // Generate UUID only on initial mount
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
      const response = await axios.post('https://art.alt-canvas.com/sonic', {
        uuid: uuid, // Use the persistent UUID from localStorage
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
    width:  roundToNearest100(window.innerWidth * 0.35),
    height: roundToNearest100(window.innerWidth * 0.35),
  });
  
  const tileSize = Math.round(canvasSize['width'] / 10);

  useEffect(() => {

    sendUuidToServer();
    const uuid=  localStorage.getItem('uuid');

    console.log(
      `
      Loading Check
      API_KEY_LOADED: ${!!apiKey}
      Canvas Size: ${canvasSize.width}, ${canvasSize.height}
      UUID: ${uuid}
      `
    )

    tileRefs.current[0].focus()

    // Add event listener for beforeunload when the component mounts
    window.addEventListener('beforeunload', performRefreshAction);
    window.addEventListener('keydown', defaultKeyOptions);

    // Remove event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', performRefreshAction);
      window.removeEventListener('keydown', defaultKeyOptions);
    };

  }, []);

  const handleKeyInstructionPress = (event) => {
    console.log('ENTERED MODE')
    switch (event.key) {
      case 'Enter':
        console.log('ASK QUESTION')
        speakMessage('Ask a question');
        break;
      case 'R':
        speakMessage('Reading Instructions');
        console.log('Read instructions');
        break;
      case 'Escape':
        setShowInstructions(!showInstructions);
        console.log('Exit instructions');
        break;
      default:
        // Handle other keys or do nothing
        break;
      }
  };

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

  const [keyOptions, setkeyOptions] = useState(false);

  
  function defaultKeyOptions(event) {

    if (event.shiftKey && event.key === 'K') {
      console.log('Shift+K pressed');
      toggleInstructions();
      setkeyOptions(true)
      speakMessage('Keyboard Instructions.');
      speakMessage('To Navigate through the Options use Up and Down arrow keys. There are a total of 10 commands. Press the escape key Twice to exit the mode.');
      displayCurrentCommand();
    } else if (event.shiftKey && event.key === 'D') {
      console.log('Shift+S pressed');
      renderCanvas();
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
        setkeyOptions(false)
      } 

    }
    
      
  }

  function performRefreshAction(event) {
    // Prevent the default dialog to show up if not necessary
    console.log('PAGE REFRESH')
    event.preventDefault();
    event.returnValue = ''; // Needed for some browsers
    logEvent({'event': 'PAGE_REFRESH'});  // Call your logEvent function
  }



  const removeBackground = (imageURL, imageObject) => {
    console.log('making call');
    const formData = new FormData();
    formData.append('image_url', imageURL); // Add the image URL to the form data

    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    fetch('https://art.alt-canvas.com/remove-background', {
        method: 'POST',
        body: formData 
    })
    .then(response => response.json())
    .then(data => {
        console.log('DaTA', data)
        console.log('Image URL:', data.imageUrl);
        imageObject.image_nbg = data.imageUrl;
        // const imageElement = document.createElement('img');
        // imageElement.src = data.imageUrl;
        // document.body.appendChild(imageElement);
        // return data.imageUrl;
    })
    .catch(error => {
        console.error('Error:', error);
    });
};


  
  const [savedImages, setSavedImages] = useState([]);
  const canvasRef = useRef(null);

  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const renderCanvas = () => {
    console.log('SavedImages',savedImages)
    speakMessage('Going to Render Canvas')
    navigate('/render', { state: { savedImages, canvasSize } });
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCloseInstructions = () => {
    setOpen(false);
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
  const [isPushing, setisPushing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
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
  if (tileRefs.current.length !== tiles.length) {
    // Initialize or update the refs array to match the tiles array length
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
  
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        window.speechSynthesis.cancel();
        document.removeEventListener("keydown", handleEscape);
        
      }
    };
  
    document.addEventListener("keydown", handleEscape);
  };

  useEffect(() => {
        if (savedImages.length > 0) {
          const latestImage = savedImages[savedImages.length - 1];
          setFocusedIndex(savedImages.length - 1);
    
          const existingTileIndex = focusedIndex;

          console.log('existingTileInex', existingTileIndex)
          if (existingTileIndex == -1) {
            return
          } else if (isEditingLocation) {

          } else if (isEditingSize) {

          }else {
            const centralTile = tiles[focusedIndex];
            console.log('centralTile', centralTile);
            addSurroundingTiles(centralTile);
          }
        }
  }, [savedImages]);
  
  
  useEffect(() => {
    if (apiKey) {
      const configuration = new Configuration({
        "model": "dall-e-3",
        apiKey: apiKey,
        "style": 'natural',
        "size": "1024x1024"
      });
      setOpenai(new OpenAIApi(configuration));
    }

    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    
  }, []);

  const thumpRef = useRef(null);
  const urlTwo = "https://texttactile.s3.amazonaws.com/bump.mp3";

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
  };

  

  useEffect(() => {
    const items = [];
    for (let i = 0; i < rows * columns; i++) {
      items.push(`Item ${i + 1}`);
    }
    setGridItems(items);

    tileRefs.current = items.map((_, i) => tileRefs.current[i] || React.createRef());

    const leftrighturl = "https://texttactile.s3.amazonaws.com/leftright.mp3";
    const downurl ="https://texttactile.s3.amazonaws.com/down.mp3";
    const upurl="https://texttactile.s3.amazonaws.com/up.mp3";

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
    const image = savedImages.find(image => image.coordinate.x == tiles[focusedIndex].x && image.coordinate.y == tiles[focusedIndex].y)
    console.log('EDIT IMAGE', image)
    const script = `The image is now located in ${Math.round(image.canvas.x)} and ${Math.round(image.canvas.y)}`

    speakMessage(script)

  }

  let outside = false;

  const isOverlapping = (editingImage, editingImageIndex) => {
    // Destructure the position and size of the currently editing image
    const { x: currX, y: currY } = editingImage.canvas;
    const { width: currWidth, height: currHeight } = editingImage.sizeParts

    // Calculate edges for the current editing image
    const currLeft = currX - currWidth / 2;
    const currRight = currX + currWidth / 2;
    const currTop = currY - currHeight / 2;
    const currBottom = currY + currHeight / 2;


    const otherImages = savedImages.filter((_, index) => index !== editingImageIndex);
    for (let otherImage of otherImages) {
        const { x: otherX, y: otherY } = otherImage.canvas;
        const { width: otherWidth, height: otherHeight } = otherImage.sizeParts;

        const otherLeft = otherX- otherWidth / 2;
        const otherRight = otherX + otherWidth / 2 ;
        const otherTop = otherY- otherHeight / 2;
        const otherBottom = otherY + otherHeight / 2;

        const isleftRange = (otherLeft<currRight) && (otherLeft >currLeft)
        const isrightRange = (otherRight<currRight) && (otherRight >currLeft)
        const istopRange = (otherTop<currBottom) && (otherTop >currTop)
        const isbottomRange = (otherBottom<currBottom) && (otherBottom >currTop)

   
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
        let moveDistance = 50;
        const currentTime = getFormattedTimestamp()
        
        switch(e.key) {
          case 'ArrowLeft': 
            dx = - moveDistance;
            isOverlapping(savedImages[editingImageIndex],editingImageIndex);

            if (savedImages[editingImageIndex].canvas.x <= moveDistance) {
              thumpRef.current.start();
              outside = true;
              
            }else{
              playSpatialSound('left'); 
              speakMessage(`left ${-dx}`);
              updateImagePosition(editingImageIndex, dx, dy);
              outside = false;
            }
            break;
            
          case 'ArrowRight':
            dx = moveDistance;
            isOverlapping(savedImages[editingImageIndex], editingImageIndex);
            if (savedImages[editingImageIndex].canvas.x >= canvasSize.width - (moveDistance)) {
              thumpRef.current.start();
              outside = true;
            }else{
              playSpatialSound('right');
              speakMessage(`right ${dx}`);
              updateImagePosition(editingImageIndex, dx, dy);
              outside = false;
            }
            break;

          case 'ArrowUp': 
            dy = -moveDistance; 
            isOverlapping(savedImages[editingImageIndex], editingImageIndex);
            if (savedImages[editingImageIndex].canvas.y <= moveDistance ) {
              thumpRef.current.start();
              outside = true;
            }else{
              playSpatialSound('up'); 
              speakMessage(`up ${-dy}`);
              updateImagePosition(editingImageIndex, dx, dy);
              outside = false;
            }
            break;
            
          case 'ArrowDown': 
            dy = moveDistance;
            isOverlapping(savedImages[editingImageIndex], editingImageIndex);
            if (savedImages[editingImageIndex].canvas.y >= canvasSize.height - moveDistance) {
              thumpRef.current.start();
              outside = true;
            }else{
              playSpatialSound('down');
              speakMessage(`down ${dy}`); 
              updateImagePosition(editingImageIndex, dx, dy);
              outside = false;
            }
            break;

          case 'Shift': 
              console.log('currentX',(savedImages[editingImageIndex].canvas.x / canvasSize.width)*100 )
              console.log('currentY',(savedImages[editingImageIndex].canvas.y / canvasSize.width)*100 )
              speakMessage(
                `The current image position is 
                ${savedImages[editingImageIndex].canvas.x} 
                and ${savedImages[editingImageIndex].canvas.y}
                
                `);

                console.log(`${currentTime}: Checking Location Coordinate- ${focusedIndex}`);
          
                logEvent({
                  time: currentTime,
                  action: 'location_edit_info',
                  focusedIndex: focusedIndex,
                });
                
              break;
              
          case 'Escape':
            setIsEditingLocation(false);
            setEditingImageIndex(null);
            setFocusedIndex(focusedIndex);
            if (tileRefs.current[focusedIndex]) {
              tileRefs.current[focusedIndex].focus();
            }
            speakMessage("Location mode exited");
            readLocationEdit(focusedIndex)
            
            console.log(`${currentTime}: Exit Location Edit- ${focusedIndex}`);
          
            logEvent({
              time: currentTime,
              action: 'location_edit_exit',
              focusedIndex: focusedIndex,
            });
            
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
      console.log('==================================================');
      console.log('Location Edit Image has been successfully updated.');
      console.log('Saved Images', savedImages);
  
      const editedImage = savedImages[editingImageIndex];
      const editedX = editedImage.canvas.x;
      const editedY = editedImage.canvas.y;
      const originalPosition = originalPositionsRef.current[editingImageIndex];
  
      savedImages.forEach((otherImage, index) => {
        if (index !== editingImageIndex) { // Skip the edited image itself
          const otherX = otherImage.canvas.x;
          const otherY = otherImage.canvas.y;
  
          // Detect movement direction relative to each other image
          if (originalPosition) {
            // Movement to the left of an image
            if (editedX < otherX && originalPosition.x >= otherX) {
              console.log(`Image ${editingImageIndex} moved to the left of image ${index}.`);
              console.log('savedImages before grid edit', savedImages[editingImageIndex].coordinate.x);
              savedImages[editingImageIndex].coordinate.x = savedImages[index].coordinate.x - tileSize;
              console.log('savedImages after grid edit', savedImages[editingImageIndex].coordinate.x);
              console.log('savedImages Data', savedImages);

              originalPositionsRef.current[editingImageIndex] = {
                x: savedImages[editingImageIndex].canvas.x, // Assuming canvas.x is already updated to the new position
                y: savedImages[editingImageIndex].canvas.y, // y stays the same in this case
              };
              
              console.log('updated originalPositionsRef for', editingImageIndex, originalPositionsRef.current[editingImageIndex]);
            }
            // Movement to the right of an image
            if (editedX > otherX && originalPosition.x <= otherX) {
              console.log(`Image ${editingImageIndex} moved to the right of image ${index}.`);
              console.log('savedImages before grid edit', savedImages[editingImageIndex].coordinate.x);
              savedImages[editingImageIndex].coordinate.x = savedImages[index].coordinate.x + tileSize;
              console.log('savedImages after grid edit', savedImages[editingImageIndex].coordinate.x);
              console.log('savedImages Data', savedImages);
              // Now update originalPositionsRef to reflect this new position
              originalPositionsRef.current[editingImageIndex] = {
                x: savedImages[editingImageIndex].canvas.x, // Assuming canvas.x is already updated to the new position
                y: savedImages[editingImageIndex].canvas.y, // y stays the same in this case
              };
              
              console.log('updated originalPositionsRef for', editingImageIndex, originalPositionsRef.current[editingImageIndex]);
            }
            // Movement above an image
            if (editedY < otherY && originalPosition.y >= otherY) {
              console.log(`----------------------------------`);
              console.log(`Image ${editingImageIndex} moved above image ${index}.`);
              console.log('savedImages before grid edit',savedImages[editingImageIndex].coordinate.y);
              savedImages[editingImageIndex].coordinate.y = savedImages[index].coordinate.y - tileSize;
              console.log('savedImages after grid edit', savedImages[editingImageIndex].coordinate.y);
              console.log('savedImages Data', savedImages);

              originalPositionsRef.current[editingImageIndex] = {
                x: savedImages[editingImageIndex].canvas.x, // Assuming canvas.x is already updated to the new position
                y: savedImages[editingImageIndex].canvas.y, // y stays the same in this case
              };
              
              console.log('updated originalPositionsRef for', editingImageIndex, originalPositionsRef.current[editingImageIndex]);
            }
            // Movement below an image
            if (editedY > otherY && originalPosition.y <= otherY) {
              console.log(`----------------------------------`);
              console.log(`Image ${editingImageIndex} moved below image ${index}.`);
              console.log('savedImages before grid edit',savedImages[editingImageIndex].coordinate.y);
              savedImages[editingImageIndex].coordinate.y = savedImages[index].coordinate.y + tileSize
              console.log('savedImages after grid edit', savedImages[editingImageIndex].coordinate.y);
              console.log('savedImages Data', savedImages);

              originalPositionsRef.current[editingImageIndex] = {
                x: savedImages[editingImageIndex].canvas.x, // Assuming canvas.x is already updated to the new position
                y: savedImages[editingImageIndex].canvas.y, // y stays the same in this case
              };
              
              console.log('updated originalPositionsRef for', editingImageIndex, originalPositionsRef.current[editingImageIndex]);
            }
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

  //  ==============================

  // For Loading and Image Gneration feedback
  let isGeneratingImage = false; 

  let isPlayingSound = false;
  const synth = new Tone.Synth().toDestination();
  const notes = ['C4', 'D4', 'E4']; // Do, Re, Mi notes
  let currentNote = 0;

  const playNotes = () => {
    if (!isGeneratingImage) return;

    if(isGeneratingImage){
      // Play the current note and schedule the next note
      synth.triggerAttackRelease(notes[currentNote], '8n');
      currentNote = (currentNote + 1) % notes.length; // Cycle through the notes

      // Call playNotes again after a short delay
      setTimeout(playNotes, 1000); 
    }
  };
  
  const startLoadingSound = async (voiceText) => {
    try {
      await Tone.start();
      console.log('Tone started');
      isGeneratingImage = true;
  
      try {
        const utterance = new SpeechSynthesisUtterance(`Please wait a moment. Generating image based on prompt: ${voiceText}. I will read the description of the image once it is created.`);
        console.log('Tone utterance', utterance);
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;
  
        utterance.onend = () => {
          // if(isGeneratingImage){
          //   playNotes();
          // }
        };

        window.speechSynthesis.speak(utterance);
      } catch (innerError) {
        console.error('Error speaking the utterance:', innerError);
      }
    } catch (error) {
      console.error('Error starting Tone.js:', error);
    }
  };
  
 
  


  function stopLoadingSound() {
      if (loadingSoundSource) {
          loadingSoundSource.stop();
          loadingSoundSource = null;
      }
  }

  //  ==============================


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
          changedFrequency = changedFrequency - 30
          speakMessage('increase 10');
        }
        break;
      case 'ArrowDown':
        if (originalWidth <= 50){
          speakMessage('Min Size Reached')
        } else{
          scaleFactor = 0.9;
          changedFrequency = changedFrequency + 30
          speakMessage('decrease 10');
        }
        break;
      case 'Shift':
        speakMessage(`The current size is ${savedImages[editingSizeImageIndex].sizeParts.width} by ${savedImages[editingSizeImageIndex].sizeParts.height}`);

        console.log(`${currentTime}: Size - Edit Info Focused Index: ${focusedIndex}`);
          
        logEvent({
          time: currentTime,
          action: 'size_edit_info',
          focusedIndex: focusedIndex,
        });
        
        break;
      case 'Escape':
        setIsEditingSize(false);
        setEditingSizeImageIndex(null);
        setFocusedIndex(focusedIndex);
        
        speakMessage("Size Edit mode exited");
        console.log(`${currentTime}: Size - Edit Exit Focused Index: ${focusedIndex}`);
          
        logEvent({
          time: currentTime,
          action: 'size_edit_exit',
          focusedIndex: focusedIndex,
        });
        
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
    savedImages[editingSizeImageIndex].sizeParts.width = Math.round(originalWidth * scaleFactor);
    savedImages[editingSizeImageIndex].sizeParts.height = Math.round(originalHeight * scaleFactor);
  
  
    // Adjust size with aspect ratio maintenance
    setSavedImages((prevImages) => prevImages.map((img, index) => {
      
      if (index === editingSizeImageIndex) {
        const originalWidth = img.sizeParts.width;
        const originalHeight = img.sizeParts.height;

        const newWidth = Math.round(originalWidth * scaleFactor);
        const newHeight = Math.round(originalHeight * scaleFactor);
  
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
    console.log('movingTile', movingTile)
    console.log('movingTileX', movingTile.x)

    console.log('pushImage is calling add syrroudning')
    addSurroundingTiles(movingTile);
    const findImageIndex = savedImages.findIndex(image => image.coordinate.x == movingTile.x && image.coordinate.y == movingTile.y);
    const pushImage = savedImages[findImageIndex];

    pushImage.coordinate.x = newX;
    pushImage.coordinate.y = newY;

    console.log('pushImage', pushImage);
  }

  let oldImage;

  const tileNavigation = (event, index, isRegeneration=false) => {

    const hasImage = savedImages.find(image => image.coordinate.x == tiles[index].x & image.coordinate.y == tiles[index].y)
    if (hasImage) {
      oldImage = hasImage;
    }

    let newIndex, direction,imageMatch, distance;
    let newX = tiles[index].x;
    let newY = tiles[index].y;
    let movingIndex;

    let x1,x2,y1,y2;
    const currentTime = getFormattedTimestamp();

    if (event.shiftKey) {
      switch (event.key) {
        case 'ArrowUp':
          movingIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
          newY =  tiles[index].y - tileSize;
          console.log(`${currentTime}: Pushing Up - Moving Index:${index} To Index: ${movingIndex}`);
          
          logEvent({
            time: currentTime,
            action: 'pushup',
            focusedIndex: movingIndex,
          });
          
          console.log('movingIndex Up',movingIndex)
          pushImage(tiles[movingIndex], newX, newY);
          break;

        case 'ArrowDown':

          movingIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
          newY =  tiles[index].y + tileSize;
          console.log('movingIndex Down',movingIndex)
          pushImage(tiles[movingIndex], newX, newY);
          console.log(`${currentTime}: Pushing Down - Moving Index:${index} To Index: ${movingIndex}`);
          
          logEvent({
            time: currentTime,
            action: 'pushdown',
            focusedIndex: movingIndex,
          });

          break;
        case 'ArrowLeft':

      
          movingIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
          newX =  tiles[index].x - tileSize;
          console.log('movingIndex Left',movingIndex)
          pushImage(tiles[movingIndex], newX, newY);
          // Implement the desired Shift+ArrowLeft behavior
          console.log(`${currentTime}: Pushing Left - Moving Index:${index} To Index: ${movingIndex}`);
          
          logEvent({
            time: currentTime,
            action: 'pushleft',
            focusedIndex: movingIndex,
          });
          break;
        case 'ArrowRight':

      
          movingIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
          newX = tiles[index].x + tileSize;
          console.log('movingIndex Right',movingIndex)
          pushImage(tiles[movingIndex], newX, newY);
          console.log(`${currentTime}: Pushing Right - Moving Index:${index} To Index: ${movingIndex}`);
          
          logEvent({
            time: currentTime,
            action: 'pushright',
            focusedIndex: movingIndex,
          });
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
        newIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
        setFocusedIndex(newIndex);
        if(isRegeneration){
          console.log(`${currentTime}: Image Regeneration - ${newIndex}`);
          
          logEvent({
            time: currentTime,
            action: 'image_REgeneration',
            focusedIndex: newIndex,
          });
        }else{
          console.log(`${currentTime}: Image Generation - ${newIndex}`);
          
          logEvent({
            time: currentTime,
            action: 'image_generation',
            focusedIndex: newIndex,
          });

        }

        generateImage(newIndex, isRegeneration);
      default:
        return;
    }

    newIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
    console.log('newTile', newIndex);


    if (newIndex !== -1 && tileRefs.current[newIndex]) {
      tileRefs.current[newIndex].focus();
    }
    
    setFocusedIndex(newIndex);
    setHoveredIndex(newIndex);

    console.log('newIndex', newIndex)

    const imageObject = savedImages.findIndex(image => image.coordinate.x == newX && image.coordinate.y == newY);
          

    if (imageObject !== -1 || tiles.length == 1) {
      console.log('Only One tile')
      speakMessage(`${savedImages[imageObject].name}`)
    }else{
      if( newIndex == -1) {
        console.log('playing Spatial Thump', direction);
        playSpatialThump(direction);
      }
      else{
          console.log('playing Spatial sound', direction);
          playSpatialSound(direction);
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
      const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)
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
      const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)
      setEditingSizeImageIndex(imageIndex);
      canvasRef.current.focus();
    }
};

  const logEvent = (data) => {
    console.log('Logging event:', data);
    localStorage.setItem('lastKeyEvent', JSON.stringify(data)); // Store locally

    fetch('https://art.alt-canvas.com/log-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => console.log('Server response:', data))
    .catch(error => console.error('Error sending data to server:', error));
  }

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
          
          logEvent({
            time: currentTime,
            action: 'radar_scan_start',
            focusedIndex: focusedIndex,
          });

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

            logEvent({
              time: currentTime,
              action: 'location_edit_start',
              focusedIndex: focusedIndex,
            });

            setlocationEditActive(true); 
            const imageIndex = savedImages.findIndex(image => image.coordinate.x == tiles[focusedIndex].x && image.coordinate.y == tiles[focusedIndex].y)
            playModeNotification(`Location Edit.  Use arrow keys to edit the location. Press Shift to hear the coordinates. The image is located in ${savedImages[imageIndex].canvas.x} and ${savedImages[imageIndex].canvas.y} on the  ${canvasSize.width} by  ${canvasSize.height} canvas`);

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

          logEvent({
            time: currentTime,
            action: 'size_edit_start',
            focusedIndex: focusedIndex,
          });
          
          setsizeEditActive(true); 
          playModeNotification("Size Edit. Use up down arrow keys to edit the size. Press Shift to hear size Info.");

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

          logEvent({
            time: currentTime,
            action: 'localInfo_start',
            focusedIndex: focusedIndex,
          });

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


          logEvent({
            time: currentTime,
            action: 'chat_start',
            focusedIndex: focusedIndex,
          });

          playModeNotification("Ask a question about the image on this tile and I will answer", () => {
            setFocusedIndex(focusedIndex);
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

        logEvent({
          time: currentTime,
          action: 'globalInfo_start',
          focusedIndex: focusedIndex,
        });
        console.log(`${currentTime}: Global Information - Focused Index: ${focusedIndex}`);
      }
      else if (e.shiftKey && e.key === 'X') {
        speakMessage('Deleted Image on Tile.')
        deleteImage(focusedIndex)

        logEvent({
          time: currentTime,
          action: 'delete_image',
          focusedIndex: focusedIndex,
        });
        
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
    const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)
    
    const image = savedImages[imageIndex];

    console.log('image.coordinate.x / canvasSize.width', image.coordinate.x / canvasSize.width)

    const script = `
      The image is called ${image.name}.
      ${image.descriptions}
      It is located ${Math.round((image.coordinate.x / canvasSize.width)* 100) } and ${Math.round((image.coordinate.y / canvasSize.width)* 100 )} 
      The size of the image is ${ Math.round((image.sizeParts.width/ canvasSize.width)* 100) }
    `

    console.log('Read Info Script:', script)
    speakMessage(script);

  };

  const isImageOnTile = (tileX, tileY) => {
    return savedImages.some(image => image.coordinate.x === tileX && image.coordinate.y === tileY);
  };
  

  const generateDescriptionPrompt = (savedImages) => {
    let descriptions = savedImages.map((img, index) => {
      return `Image ${index + 1} named "${img.name}" with prompt "${img.prompt}" is positioned at coordinates (${img.canvas.x}, ${img.canvas.y}) on the canvas, measuring ${img.sizeParts.width} pixels wide by ${img.sizeParts.height} pixels high.`;
    }).join(" ");

    globalDescriptionPrompt =  `Describe the layout of the following images on a canvas based on their coordinates and sizes in a verbal way with out using exact numbers descriptions: ${descriptions}.`;
  };


  const fetchGlobalDescription = async () => {

    generateDescriptionPrompt(savedImages)
    const controller = new AbortController();
    const { signal } = controller;

    const stopOperations = () => {
      controller.abort();
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        method: 'POST',
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: globalDescriptionPrompt,
            },
          ],
        }),
        signal, 
      });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const globalDescription =data.choices[0].message.content; 
    
    console.log('Global Description', globalDescription);
    speakMessage(globalDescription);

  };


  
  const imageChat = async (gridIndex) => {

    const tileX = tiles[gridIndex].x;
    const tileY= tiles[gridIndex].y
    const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)
  
    console.log('check of chat image matches',savedImages[imageIndex] )

    const imageURL = savedImages[imageIndex].url;

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
          speakMessage(description);
          setFocusedIndex(gridIndex);
          if (tileRefs.current[focusedIndex]) {
            tileRefs.current[focusedIndex].focus();
          }
          return data.choices[0].message.content;
        } else {
          return 'No description available';
        }
      } catch (error) {
        speakMessage('Sorry could you ask the question again?')
        return 'Error fetching description';
      }


  }

  const fetchImageName = async (imageURL) => {

    let customPrompt = `
        Generate the title of this image. Use minimal words.

        Example Response : dog
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


  const updateImageAtIndex = (gridIndex, newImageObject) => {

    let updatedSavedImages = [...savedImages];

    const tileX = tiles[gridIndex].x;
    const tileY= tiles[gridIndex].y
    const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)
    
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
    setLoading(true);
    setActiveIndex(index);

    let centerX, centerY;
    centerX = tiles[index].x;
    centerY = tiles[index].y;
  
    console.log('Generating image...');
  
    try {

      playNotificationSound();

      const voiceText = await startListening();
      setPromptText(voiceText);
      console.log('voiceText:' , voiceText)
  
      if (voiceText) {
        console.log('OpenAI', openai);

        startLoadingSound(voiceText);
        
        
        // You are a children's cartoon graphic designer. Only create one of ${voiceText} The background should be white. Only draw thick outlines without color. It should be in a simple minimalistic graphic design.
        const response = await openai.createImage({
          prompt: `Create ONLY ONE of a VERY SIMPLE ${voiceText} graphic that would go in a CHILDREN'S COLORING BOOK. Only draw the OUTER SHAPE with NO details
          This type of drawing is often used in COLORING BOOK or instructional material. There should be NO DETAILS or SHADING in the drawing.
          use VERY THICK OUTLINES and REMOVE DETAILS. Create ONLY ONE of ${voiceText}
          `,
          n: 1,
        });
  
        console.log('OpenAI Image Response', response);


  
        const lengthImages = savedImages.length;
        const imageSize = 100;

        console.log('image size', imageSize)
  
        const imageObjects = response.data.data.map(img => ({
          prompt: voiceText,
          name: '',
          url: img.url,
          image_nbg: '',
          descriptions: '',
          coordinate: { x: centerX, y: centerY },
          canvas: {x: centerX, y: centerY},
          sizeParts: { width: imageSize  , height: imageSize},
        }));


        for (let imageObject of imageObjects) {
          const imageURL = imageObject.url;
          const nbg = await removeBackground(imageURL, imageObject);
          const name = await fetchImageName(imageURL);
          const description = await fetchImageDescription(imageURL);
          imageObject.descriptions = description;
          imageObject.name = name;
        }
  
        stopLoadingSound();

        let imageDescription = `${imageObjects[0].name} has been created. ${imageObjects[0].descriptions}.`;
        
        let utterance = new SpeechSynthesisUtterance(imageDescription);
        utterance.rate = 1;
        utterance.pitch = 1; 
        utterance.volume = 1; 

  
        if (isRegeneration) {
          updateImageAtIndex(index, imageObjects[0]);
          
          speechSynthesis.speak(utterance);

          utterance.onend = function(event) {
            console.log('Speech synthesis finished.');
          };

          setFocusedIndex(index);

        } else {
          const updatedSavedImages = [...savedImages, ...imageObjects];
          setSavedImages(updatedSavedImages);
          speechSynthesis.speak(utterance);
          isGeneratingImage = false;

          utterance.onend = function(event) {
            console.log('Speech synthesis finished.');
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

    const tileX = tiles[gridIndex].x;
    const tileY= tiles[gridIndex].y
    const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)

    console.log('Image',savedImages[imageIndex]);

    const centerX = savedImages[gridIndex].coordinate.x;
    const centerY = savedImages[gridIndex].coordinate.y;

    const otherImages = savedImages.filter((_, index) => index !== gridIndex);

    const distances = otherImages.map((image, index) => {
    const distance = Math.sqrt(Math.pow(image.canvas.x - centerX, 2) + Math.pow(image.canvas.y - centerY, 2));
        return {index, distance};
    });

    distances.sort((a, b) => a.distance - b.distance);

    const playSoundAfterSpeech = (image, index) => {
      speakImageName(image.name, () => {
          console.log('Playing', image.name);
          playRadarSound(image.sound, image.canvas.x, image.canvas.y);
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

    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
      <div style={{ flexGrow: 1, marginLeft: '2%' }}>
        <h1 id="mainHeader" style={{ fontSize: '1.4rem', marginTop: '0', color: '#1E90FF' }}>ALT-CANVAS</h1>
      </div>
      <div aria-live="polite" style={{ flexGrow: 3, backgroundColor: 'aliceblue', padding: '1rem', margin: '0 1rem', fontSize: '0.9rem' }}>
        <p>
          Welcome to AltCanvas! In AltCanvas, you create images one by one using tiles.
          Relative locations of images on the tiles reflect the relative locations of the canvas.
          The size of the canvas is {canvasSize.width} width and {canvasSize.height} height. You are currently focused on the 1st tile. Press Enter to Create the 1st Image and tell the system what you want to make after the beep.
          After that, navigate to other tile locations and create images there.
          For more commands, press Shift+K to learn about the keyboard options and press Shift+S to go to the Render Canvas.
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
            aria-label="Tiles Container"
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
                key={tile.id}
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
              <div id="canvas"  aria-label="Canvas"  ref={canvasRef} style={{ position: 'relative', ...canvasSize, border: '4px solid gray', boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' }} tabIndex={0}>
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
      <DialogTitle id="form-dialog-title">Keyboard Shortcuts</DialogTitle>
      <DialogContent style={{width: '100%'}} aria-live="polite">
        <div
          className="keyboard-shortcuts"
          style={{marginBottom: '2%'}}
          id="keyboard-shortcuts-description"
        >
          <ul style={{marginTop: '0.5rem', width: '100%'}} role="list">
            <li style={{marginBottom: '2%'}} role="listitem">
              <kbd>Enter</kbd> : To generate or regenerate an image on a tile.
            </li>
            <li style={{marginBottom: '2%'}} role="listitem">
              <kbd>Shift</kbd> + <kbd>G</kbd>: Global - Descriptions about what the canvas currently looks like.
            </li>
            <li style={{marginBottom: '2%'}} role="listitem">
              <kbd>Shift</kbd> + <kbd>I</kbd>: Info - Descriptions about the currently selected item on the tile.
            </li>
            <li style={{marginBottom: '2%'}} role="listitem">
              <kbd>Shift</kbd> + <kbd>C</kbd>: Chat - Opens a chat window related to the currently selected item.
            </li>
            <li style={{marginBottom: '2%'}} role="listitem">
              <kbd>Shift</kbd> + <kbd>L</kbd>: Location Edit Mode - Allows you to edit the location of the currently selected item.
            </li>
            <li style={{marginBottom: '2%'}} role="listitem">
              <kbd>Shift</kbd> + <kbd>S</kbd>: Size Edit Mode - Adjust the size of the currently selected item.
            </li>
            <li style={{marginBottom: '2%'}} role="listitem">
              <kbd>Shift</kbd> + <kbd>R</kbd>: Radar Scan - Gives a Description about the nearby objects.
            </li>
            <li style={{marginBottom: '2%'}} role="listitem">
              <kbd>Shift</kbd> + <kbd>X</kbd>: Delete Image - Press Shift+X to delete an Image
            </li>
            <li style={{marginBottom: '2%'}} role="listitem">
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