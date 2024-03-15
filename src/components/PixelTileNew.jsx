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
import SoundPlayer from '../components/SoundPlayer';
import TextField from '@mui/material/TextField';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import html2canvas from 'html2canvas';

export const PixelTileNew = () => {
  const apiKey = process.env.REACT_APP_API_KEY;

  // window.speechSynthesis.cancel();

  // Canvas Width & Height Setting
  const [canvasSize, setCanvasSize] = useState({ width: '0%', height: '0%' }); 
  const [openDialog, setOpenDialog] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const canvasRef = useRef(null);

  // Generating first image on tile
  const [tiles, setTiles] = useState([
    { 
      id: 0, 
      image: {}, 
      x: 0,
      y: 0
    }
  ]);

  var element = document.getElementById("canvas");
  
  const myfunc= () =>{
    console.log('good luck girlie')
    var element = document.getElementById("canvas");
    console.log(element);
    html2canvas(element, {
            letterRendering: 1,
            allowTaint: true,
            useCORS: true,
            proxy: "http://localhost:3000/tilesnew",
        }).then(function(canvas) {
        canvas.toBlob(function(blob) {
            console.log('image girlie', blob)
            var url = URL.createObjectURL(blob);
            console.log('url',url)
            var img = document.createElement('img');
            img.src = url;

            // Append the img element to the document to display the image
            document.body.appendChild(img);
            window.saveAs(blob, "Heres the Girl.png");
        });
    });
  }
  
  useEffect(() => {
    const centerX = (parseInt(canvasSize['width']) / 2) - ((parseInt(canvasSize['width']) / 10) / 2);
    const centerY = (parseInt(canvasSize['height']) / 2) - ((parseInt(canvasSize['height']) / 10) / 2);

    setTiles([
      { id: 0, image: {}, x: centerX, y: centerY }
    ]);
  }, [canvasSize]); 

  console.log('TILES', tiles)
  let loadingSoundSource = null;
  const [loading, setLoading] = useState(false);

  const testWebAudioAPI = () => {
    speakDescription('hi')
  };

  useEffect(() => {
    const serializedTiles = JSON.stringify(tiles);
    sessionStorage.setItem('tiles', serializedTiles);
  }, [tiles]);

  useEffect(() => {
    const serializedImages = JSON.stringify(savedImages);
    sessionStorage.setItem('savedImages', serializedImages);
  }, [savedImages]);




  // for adding images
  
  
  // for pushing
  const [isPushing, setisPushing] = useState(false);

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
  if (tileRefs.current.length !== tiles.length) {
    // Initialize or update the refs array to match the tiles array length
    tileRefs.current = Array(tiles.length).fill().map((_, i) => tileRefs.current[i] || React.createRef());
  }
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

  const tileSize = parseInt(canvasSize['width']) / 10; 

  useEffect(() => {
        console.log('useEffect is calling add surrounding tiles')
        if (savedImages.length > 0) {
          const latestImage = savedImages[savedImages.length - 1];
          setFocusedIndex(savedImages.length - 1);
      
          // Find if there's an existing tile for this image
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
  }, [savedImages]); // Depend on savedImages to trigger this effect
  
  
  useEffect(() => {
    if (apiKey) {
      const configuration = new Configuration({
        apiKey: apiKey,
      });
      setOpenai(new OpenAIApi(configuration));
    }

    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    
  }, []);

  useEffect(() => {
    const savedCanvasSize = JSON.parse(localStorage.getItem('canvasSize'));
    tileRefs.current[0].focus();

    if (savedCanvasSize) {
      setCanvasSize(savedCanvasSize);
    } else {
      setOpenDialog(true);
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

  const [saveCompleted, setSaveCompleted] = useState(false);
  const originalPositionsRef = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log('canvas Focused for location edit')
      
      if (isEditingLocation && editingImageIndex !== null) {
        console.log('editing Lcoation Index', editingImageIndex)
        console.log('Keyboard Editing here')
        console.log(`Key pressed: ${e.key}`);
        let dx = 0, dy = 0;
        switch(e.key) {
          case 'ArrowLeft': dx = -10; playSpatialSound('left'); break;
          case 'ArrowRight': dx = 10; playSpatialSound('right'); break;
          case 'ArrowUp': dy = -10; playSpatialSound('up'); break;
          case 'ArrowDown': dy = 10;playSpatialSound('down'); break;
          case 'Escape':
            setIsEditingLocation(false);
            setEditingImageIndex(null);
            setFocusedIndex(focusedIndex)
            if (tileRefs.current[focusedIndex]) {
              tileRefs.current[focusedIndex].focus();
            }
            speakMessage("Location mode exited");
            return;
          default: 
            speakMessage("You are still on Location Edit mode. Press ESC to exit the Location Edit mode first.");
            return;
        }

        if (!originalPositionsRef.current[editingImageIndex]) {
          originalPositionsRef.current[editingImageIndex] = {
            x: savedImages[editingImageIndex].canvas.x,
            y: savedImages[editingImageIndex].canvas.y,
          };
          console.log('original positions ref', originalPositionsRef)
        }

        setSavedImages((prevImages) => prevImages.map((img, index) => {
          if (index === editingImageIndex) {
            return { ...img, canvas: { x: img.canvas.x + dx, y: img.canvas.y + dy } };
          }
          return img;
        }));

        setSaveCompleted(true);
      }
    };

    if (isEditingLocation) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
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
  
    // Cleanup function to ensure the listener is removed when the component unmounts or the state changes
    return () => {
      detachSizeEditKeyListener();
    };
  }, [isEditingSize, editingSizeImageIndex]); // Make sure to include all dependencies used in handleKeyDownForSizeEdit

  //  ==============================

  // For Loading and Image Gneration feedback
  let isGeneratingImage = false; 

  let isPlayingSound = false;
  const synth = new Tone.Synth().toDestination();
  const notes = ['C4', 'D4', 'E4']; // Do, Re, Mi notes
  let currentNote = 0;

  const playNotes = () => {
    if (!isGeneratingImage) return;

    // Play the current note and schedule the next note
    synth.triggerAttackRelease(notes[currentNote], '8n');
    currentNote = (currentNote + 1) % notes.length; // Cycle through the notes

    // Call playNotes again after a short delay
    setTimeout(playNotes, 1000); 
  };
  
  const startLoadingSound = async (voiceText) => {
    try {
      await Tone.start();
      console.log('Tone started');
      isGeneratingImage = true;
  
      try {
        const utterance = new SpeechSynthesisUtterance(`Please wait a moment. Generating image based on prompt: ${voiceText}.`);
        console.log('Tone utterance', utterance);
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;
  
        utterance.onend = () => {
          playNotes();
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

    let scaleFactor = 1;

    switch (e.key) {
      case 'ArrowUp':
        scaleFactor = 1.1;
        changedFrequency = changedFrequency - 30
        break;
      case 'ArrowDown':
        scaleFactor = 0.9;
        changedFrequency = changedFrequency + 30
        break;
      case 'Escape':
        setIsEditingSize(false);
        setEditingSizeImageIndex(null);
        setFocusedIndex(focusedIndex)
        speakMessage("Size Edit mode exited");
        if (tileRefs.current[focusedIndex]) {
          tileRefs.current[focusedIndex].focus();
        }
        changedFrequency = 340
        return;
      default:
        speakMessage("You are still on Size Edit mode. Press ESC to exit the size edit mode first.");
        return;
    }

    console.log(changedFrequency);
    playTone(changedFrequency);
  
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
      id: tiles.length + index, // This might need adjustment if you're filtering out tiles
      image: {},
      x: centralTile.x + pos.dx,
      y: centralTile.y + pos.dy,
    })).filter(newTile => 
      // Check if a tile with the same x and y already exists
      !tiles.some(tile => tile.x === newTile.x && tile.y === newTile.y)
    );
  
    // Update state with new tiles, if any
    setTiles(tiles => [...tiles, ...newTiles]);
  }
  
  


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
  

  const getSurroundingPositions = (index) => {
    console.log('tiles', tiles[index])
  }

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

  const playSpatialSoundwithDistance = (direction, distance) => {

    console.log("YEAYAYAYYA")
    if (!playerRef.current) return;
    
    // Normalize or scale the distance value to your application's needs
    // This example assumes distance is a number where larger values mean further away
    // You might need to adjust these calculations based on your actual distance scale
    const volumeAdjustment = -Math.min(Math.log1p(distance), 10); // Example scaling, using log to dampen the effect
    const positionScaleFactor = 1; // Adjust based on your spatial scaling needs
    
    // Calculate position adjustments based on direction and scaled by distance
    const positionX = direction === 'left' ? -10 : direction === 'right' ? 10 : 0;
    const positionY = direction === 'up' ? 10 : direction === 'down' ? -30 : 0;
    // Adjust position by distance (you might want to fine-tune this scaling)
    const adjustedPositionX = positionX * positionScaleFactor * Math.sqrt(distance);
    const adjustedPositionY = positionY * positionScaleFactor * Math.sqrt(distance);
    // Keep Z position static or adjust as needed
    const positionZ = -1;

    const panner = new Tone.Panner3D({
      positionX: adjustedPositionX,
      positionY: adjustedPositionY,
      positionZ: positionZ,
    }).toDestination();
    
    playerRef.current.disconnect();
    playerRef.current.chain(panner, Tone.Destination);
    
    // Adjust volume based on distance, might need to map this more carefully
    playerRef.current.volume.value = volumeAdjustment;
    
    playerRef.current.start();
};


  const tileNavigation = (event, index, isRegeneration=false) => {

    console.log('isRegeneration' , isRegeneration);
    console.log('index', index);
    console.log('tiles', tiles[index]);
    console.log('tile X', tiles[index].x);
    console.log('tile Y', tiles[index].y);

    const hasImage = savedImages.find(image => image.coordinate.x == tiles[index].x & image.coordinate.y == tiles[index].y)
    if (hasImage) {
      oldImage = hasImage;
      console.log("OLD INDEX", oldImage)
    }

    // oldImage = index; 

    let newIndex, direction,imageMatch;
    let newX = tiles[index].x;
    let newY = tiles[index].y;
    let movingIndex;

    if (event.shiftKey) {
      switch (event.key) {
        case 'ArrowUp':
          movingIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
          newY =  tiles[index].y - tileSize;
          
          console.log('movingIndex Up',movingIndex)
          pushImage(tiles[movingIndex], newX, newY);
          break;
        case 'ArrowDown':

          movingIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
          newY =  tiles[index].y + tileSize;
          console.log('movingIndex Down',movingIndex)
          pushImage(tiles[movingIndex], newX, newY);
          // Implement the desired Shift+ArrowDown behavior
          break;
        case 'ArrowLeft':

      
          movingIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
          newX =  tiles[index].x - tileSize;
          console.log('movingIndex Left',movingIndex)
          pushImage(tiles[movingIndex], newX, newY);
          // Implement the desired Shift+ArrowLeft behavior
          break;
        case 'ArrowRight':

      
          movingIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
          newX = tiles[index].x + tileSize;
          console.log('movingIndex Right',movingIndex)
          pushImage(tiles[movingIndex], newX, newY);
          // Implement the desired Shift+ArrowRight behavior
          break;
        // Add cases for other keys if needed
      }
    }
    
    switch (event.key) {
      case 'ArrowUp':
        newY =  tiles[index].y - tileSize;
        imageMatch = savedImages.find(image => image.coordinate.x == newX && image.coordinate.y == newY);
        if (imageMatch) {
          speakMessage(imageMatch.name);
        }
        console.log('newY', newY)
        direction = 'up';
        break;
      case 'ArrowDown':
        newY =  tiles[index].y + tileSize;
        imageMatch = savedImages.find(image => image.coordinate.x == newX && image.coordinate.y == newY);
        if (imageMatch) {
          speakMessage(imageMatch.name);
        }
        console.log('newY', newY)
        direction = 'down';
        break;
      case 'ArrowLeft':
        newX =  tiles[index].x - tileSize;
        imageMatch = savedImages.find(image => image.coordinate.x == newX && image.coordinate.y == newY);
        if (imageMatch) {
          speakMessage(imageMatch.name);
        }
        console.log('newX', newX)
        direction = 'left';
        break;
      case 'ArrowRight':
        newX =  tiles[index].x + tileSize;
        imageMatch = savedImages.find(image => image.coordinate.x == newX && image.coordinate.y == newY);
        if (imageMatch) {
          speakMessage(imageMatch.name);
        }
        console.log('newX', newX)
        direction = 'right';
        break;
      case 'Enter': 
        newIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
        setFocusedIndex(newIndex);
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
          

    if (imageObject !== -1) {
      
    }else{
      console.log('playing Spatial sound', direction);

      playSpatialSound(direction);
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
          if (tileRefs.current[focusedIndex]) {
            tileRefs.current[focusedIndex].focus();
          }

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
          speakNoTileFocusedMessage();
          console.log("No tile is focused.");
        }
      }  else if (e.shiftKey && e.key === 'C') {
        if (focusedIndex !== null) {
          console.log('Chat Activated');
          console.log('Focused Index', focusedIndex);
          setchatActive(true); 

          playModeNotification("Chat Activated. Ask a question about the image", () => {
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
          speakNoTileFocusedMessage();
          console.log("No tile is focused.");
        }
      } else if (e.shiftKey && e.key === 'G') {
        console.log('Fetching GPT Description');
        fetchGPTDescription();
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
    console.log('speaking')
    var speech = new SpeechSynthesisUtterance(description);
  
    speech.rate = 1; // Speed of speech
    speech.pitch = 1; // Pitch of speech
    speech.volume = 1; // Volume
  
    window.speechSynthesis.speak(speech);
  };

  // const customPrompt = generateDescriptionPrompt(savedImages);

  let [customPrompt, setcustomPrompt ] = useState('')

  const generateDescriptionPrompt = (savedImages) => {
    let descriptions = savedImages.map((img, index) => {
      return `Image ${index + 1} named "${img.name}" with prompt "${img.prompt}" is positioned at coordinates (${img.canvas.x}, ${img.canvas.y}) on the canvas, measuring ${img.sizeParts.width} pixels wide by ${img.sizeParts.height} pixels high.`;
    }).join(" ");

    customPrompt =  `Describe the layout of the following images on a canvas based on their coordinates and sizes in a verbal way with out using exact numbers descriptions: ${descriptions}`;

    console.log(" GIRL PROMPT: ", customPrompt)
  };


  const fetchGPTDescription = async () => {

    generateDescriptionPrompt(savedImages)

    console.log('getching descriptions with', customPrompt)
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey, // Added a space after 'Bearer'
        },
        method: 'POST',
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: customPrompt,
            },
          ],
        }),
      });


    console.log('Description Response',response)
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
    console.log('data',data)
    console.log('gpt description globa',data.choices[0].message.content);
    const GPTDescription =data.choices[0].message.content; 
    const utterance = new SpeechSynthesisUtterance( GPTDescription);
    window.speechSynthesis.speak(utterance);
    // return data.choices[0].message.content;
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
          speakDescription(description);
          setFocusedIndex(gridIndex);
          if (tileRefs.current[focusedIndex]) {
            tileRefs.current[focusedIndex].focus();
          }
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

    const notes = [
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
      'C#4', 'D#4', 'F#4', 'G#4', 'A#4',
      'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
      'C#5', 'D#5', 'F#5', 'G#5', 'A#5',
      'C6'
    ];

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
        
        const response = await openai.createImage({
          prompt: `You are a children's cartoon graphic designer. Only create one of ${voiceText} The background should be white. Only draw thick outlines without color. It should be in a simple minimalistic graphic design. `,
          n: 1,
        });
  
        console.log('OpenAI Image Response', response);
  
        const lengthImages = savedImages.length;
        const noteIndex = lengthImages % notes.length;
        const note = notes[noteIndex];
        const imageSize = tileSize * 2;

        console.log('image size', imageSize)
  
        const imageObjects = response.data.data.map(img => ({
          prompt: voiceText,
          name: `Image_${lengthImages}`,
          url: img.url,
          descriptions: '',
          coordinate: { x: centerX, y: centerY },   //for matching with grid
          canvas: {x: centerX, y: centerY},  //for matching 
          sizeParts: { width: imageSize  , height: imageSize},
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
        utterance.rate = 1; // Speed of speech
        utterance.pitch = 1; // Pitch of speech
        utterance.volume = 1; // Volume
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
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative', 
            ...canvasSize, 
            border: '1px solid black' }} tabIndex={0}>

            
            {tiles.map((tile, index) => (
              <div
                autoFocus
                ref={(el) => tileRefs.current[index] = el}
                key={tile.id}
                onKeyDown={(event) => {
                  setFocusedIndex(index);
                  tileNavigation(event, index, savedImages.some(image => image.coordinate.x === tile.x && image.coordinate.y === tile.y));
                }}
                tabIndex={0}
                style={{
                  border: '1px solid black', 
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
                  <MoonLoader size={20}/>
                ) : (
                  savedImages.filter(savedImage => 
                    savedImage.coordinate.x == tile.x && savedImage.coordinate.y == tile.y
                  ).map((image, imageIndex) => (
                    <img key={imageIndex} src={image.url} alt="" style={{ width: '100%', height: '100%', position: 'absolute' }} />
                  ))
                )}
              </div>
            ))}
            
            
              
          </div>

        
        </div>
      
        <div className="rightContainer">
              <div id="canvas" ref={canvasRef} style={{ position: 'relative', ...canvasSize, border: '1px solid black' }} tabIndex={0}>
                  {savedImages.map((image, index) => (
                    <div key={index} style={{ position: 'absolute', left: `${image.canvas.x}px`, top: `${image.canvas.y}px` }}
                    tabIndex={0}>
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
