import * as Tone from 'tone';

import React, { useEffect, useRef, useState } from 'react';

import { MoonLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';

const gridCenter = { x: 1, y: 1 };
const imageSize = 50; 

const imageObjects = [
  {
    prompt: "A cute dog",
    name: "dog_image",
    url: "https://www.svgrepo.com/show/426701/dog.svg",
    descriptions: "An Image of a dog ",
    coordinate: { x: 180, y: 180 }, // Matching with tile 7
    canvas: { x: 180, y: 180 },
    sizeParts: { width: imageSize, height: imageSize },
    sound: "bark"
  },
  {
    prompt: "A dog's bowl",
    name: "bowl_image",
    url: "https://www.svgrepo.com/show/113124/dog-dish.svg",
    descriptions: "",
    coordinate: { x: 140, y: 180 }, // Matching with tile 6
    canvas: { x: 100, y: 200 },
    sizeParts: { width: 100, height: 100 },
    sound: "clink"
  },
  {
    prompt: "The sun shining bright",
    name: "sun_image",
    url: "https://www.svgrepo.com/show/523849/sun-2.svg",
    descriptions: "",
    coordinate: { x: 220, y: 140 }, // Matching with tile 3
    canvas: { x:250, y: 50 },
    sizeParts: { width: 150, height: 150 },
    sound: "none"
  }
];

export const InteractionLabFour = () => {
  
  const apiKey = process.env.REACT_APP_API_KEY;
  const [openai, setOpenai] = useState();
  const [canvasSize, setCanvasSize] = useState({width: '400px', height: '400px'});
  const tileSize = parseInt(canvasSize['width']) / 10; 
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [savedImages, setSavedImages] = useState(imageObjects);
  const [chatActive, setchatActive] = useState(false);
  let [customPrompt, setcustomPrompt ] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [locationEditActive, setlocationEditActive] = useState(false);
  const playerRef = useRef(null);
  const [isEditingSize, setIsEditingSize] = useState(false);
  const [editingSizeImageIndex, setEditingSizeImageIndex] = useState(null);
  const [sizeEditActive, setsizeEditActive] = useState(false);
  const thumpRef = useRef(null);

  const navigate = useNavigate(); // Initialize useNavigate

  // Define a function to navigate to /lab2
  const goToLab1 = () => navigate('/lab');
  const goToLab2 = () => navigate('/lab2');
  const goToLab3 = () => navigate('/lab3');
  const goToLab4 = () => navigate('/lab4');
  const goToLab5 = () => navigate('/lab5');

  const tileRefs = useRef([]);

  // if (tileRefs.current.length !== tiles.length) {
  //   tileRefs.current = Array(tiles.length).fill().map((_, i) => tileRefs.current[i] || React.createRef());
  // }

  useEffect(() => {
    const centerX = (parseInt(canvasSize['width']) / 2) - ((parseInt(canvasSize['width']) / 10) / 2);
    const centerY = (parseInt(canvasSize['height']) / 2) - ((parseInt(canvasSize['height']) / 10) / 2);

    setTiles([
      { id: 0, image: {}, x: centerX, y: centerY }
    ]);

    addSurroundingTiles(tiles[0])

    const url = "https://texttactile.s3.amazonaws.com/bloop.mp3";
    const urlTwo = "https://texttactile.s3.amazonaws.com/bump.mp3";

    const player = new Tone.Player().toDestination();
    player.load(url).then(() => {
        playerRef.current = player;
    });

    const playerTwo = new Tone.Player().toDestination();
    playerTwo.load(urlTwo).then(() => {
        thumpRef.current = playerTwo;
    });
    
    
    
  }, []); 

  useEffect(() => {
    if (tiles.length > 0 && tiles.length < 9) {
      addSurroundingTiles(tiles[tiles.length - 1]);
    }
    
  }, [tiles]);

  useEffect(() => {
    if (tiles.length > 1 && tileRefs['current'][1]) {
      tileRefs['current'][1].focus();
    }
  }, [tiles]); 

  const speakMessage = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {

    const handleKeyDown = (e) => {

      if (e.shiftKey && e.key === 'S') {
        if (focusedIndex !== null) {
          console.log('Size Edit Activated');
          // const 
          // speakMessage(`The size of the image is ${savedImages[editingSizeImageIndex]}`)
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex]);


  let oldImage;

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

    console.log('playing')
  };

  const playSpatialThump = (direction) => {
    if (!thumpRef.current) return;
    
    const panner = new Tone.Panner3D({
      positionX: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
      positionY: direction === 'up' ? 10 : direction === 'down' ? -30 : 0,
      positionZ: -1,
    }).toDestination();

    thumpRef.current.disconnect();
    thumpRef.current.chain(panner, Tone.Destination);

    thumpRef.current.start();
  };

  const [saveCompleted, setSaveCompleted] = useState(false);
  const originalPositionsRef = useRef({});
  let changedFrequency = 340;


  const playTone = (frequency) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Use a sine wave
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Frequency in Hz
  
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1); // Play the tone for 0.1 seconds
  };

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
  }, [isEditingSize, editingSizeImageIndex]);

  // if (!isEditingSize){
  //   speakMessage(`The size of the image is now ${savedImages[editingSizeImageIndex].sizeParts.width}`)
  // }

  const updateSize = (editingSizeImageIndex, scaleFactor) =>{
    console.log('update size index', editingSizeImageIndex)
    const img = savedImages[editingSizeImageIndex];
    const originalWidth = img.sizeParts.width;
    const originalHeight = img.sizeParts.height;

    const newWidth = Math.round(originalWidth * scaleFactor);
    const newHeight = Math.round(originalHeight * scaleFactor);
    img.sizeParts.width = newWidth;
    img.sizeParts.height = newHeight;

  }
  

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
        updateSize(editingSizeImageIndex, scaleFactor)
        break;
      case 'ArrowDown':
        scaleFactor = 0.9;
        changedFrequency = changedFrequency + 30
        updateSize(editingSizeImageIndex, scaleFactor)
        break;
      case 'Escape':
        setIsEditingSize(false);
        setEditingSizeImageIndex(null);
        setFocusedIndex(focusedIndex)
        speakMessage("Size Edit mode exited");
        speakMessage(`The size of the image is now ${savedImages[editingSizeImageIndex].sizeParts.width}`);
        
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


  const enterSizeEditMode = (gridIndex) => {

    console.log('Size Edit grid index', gridIndex);
    const tileX = tiles[gridIndex].x;
    const tileY= tiles[gridIndex].y

    if(gridIndex !== -1) {
      setIsEditingSize(true);
      const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)
      speakMessage(`The Size of the Image is ${savedImages[imageIndex].sizeParts.width}`)
      setEditingSizeImageIndex(imageIndex);
      canvasRef.current.focus();
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

    switch (event.key) {
      case 'ArrowUp':
        x1 =  tiles[index].x;
        y1 =  tiles[index].y;
        console.log('x1',x1)
        console.log('y1',y1)
        newY =  tiles[index].y - tileSize;
        imageMatch = savedImages.find(image => image.coordinate.x == newX && image.coordinate.y == newY);
        if (imageMatch) {
          x2 = imageMatch.canvas.x;
          y2 = imageMatch.canvas.y;
          console.log('x2',x2)
          console.log('y2',y2)
          distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          console.log('distance btw two images', distance)
          speakMessage(imageMatch.name);
        }
        console.log('newY', newY)
        direction = 'up';
        break;
      case 'ArrowDown':
        x1 =  tiles[index].x;
        y1 =  tiles[index].y;
        console.log('x1',x1)
        console.log('y1',y1)
        newY =  tiles[index].y + tileSize;
        imageMatch = savedImages.find(image => image.coordinate.x == newX && image.coordinate.y == newY);
        if (imageMatch) {
          x2 = imageMatch.canvas.x;
          y2 = imageMatch.canvas.y;
          console.log('x2',x2)
          console.log('y2',y2)
          distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          console.log('distance btw two images', distance)
          speakMessage(imageMatch.name);
        }
        console.log('newY', newY)
        direction = 'down';
        break;
      case 'ArrowLeft':
        x1 =  tiles[index].x;
        y1 =  tiles[index].y;
        console.log('x1',x1)
        console.log('y1',y1)
        newX =  tiles[index].x - tileSize;
        imageMatch = savedImages.find(image => image.coordinate.x == newX && image.coordinate.y == newY);
        if (imageMatch) {
          x2 = imageMatch.canvas.x;
          y2 = imageMatch.canvas.y;
          console.log('x2',x2)
          console.log('y2',y2)
          distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          console.log('distance btw two images', distance)
          speakMessage(imageMatch.name);
        }
        console.log('newX', newX)
        direction = 'left';
        break;
      case 'ArrowRight':
        x1 =  tiles[index].x;
        y1 =  tiles[index].y;
        console.log('x1',x1)
        console.log('y1',y1)
        newX =  tiles[index].x + tileSize;
        imageMatch = savedImages.find(image => image.coordinate.x == newX && image.coordinate.y == newY);
        if (imageMatch) {
          x2 = imageMatch.canvas.x;
          y2 = imageMatch.canvas.y;
          console.log('x2',x2)
          console.log('y2',y2)
          distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          console.log('distance btw two images', distance)
          speakMessage(imageMatch.name);
        }
        console.log('newX', newX)
        direction = 'right';
        break;
      default:
        return;
    }

    newIndex = tiles.findIndex(tile => tile.x == newX && tile.y == newY);
    console.log('newTile', newIndex);


    if (newIndex !== -1 && tileRefs.current[newIndex]) {
      tileRefs.current[newIndex].focus();
    }
    
    setFocusedIndex(newIndex);

    console.log('newIndex', newIndex)

    const imageObject = savedImages.findIndex(image => image.coordinate.x == newX && image.coordinate.y == newY);
          

    if (imageObject !== -1) {
      
    }else{
      // playSpatialSound(direction);
      if( newIndex == -1) {
        console.log('playing Spatial Thump', direction);
        playSpatialThump(direction);
      }else{
        console.log('playing Spatial sound', direction);
        playSpatialSound(direction);
      }
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


  return (
    <div id="imageGeneration">
    <h1>Size Edit</h1>
      <p>Navigate to a tile and press Shift+S to edit the size of an image. 
      <br/>
      Use the arrow keys to change the size of an image.
      The width and height of the image are the same.
      </p>
      <div className="mainContainer" style={{display:'flex', flexDirection: 'row', width:'70%'}}>

        <div className="leftContainer">
          <div id="tileContainer" ref={canvasRef} style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative', 
            ...canvasSize, 
            border: '1px solid black' }}>

            
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

              
        <div className="rightContainer" >
              <div id="canvas" ref={canvasRef} style={{ position: 'relative', ...canvasSize, border: '1px solid black' }} tabIndex={0}>
                  {savedImages.map((image, index) => (
                    <div key={index} style={{ position: 'absolute', left: `${image.canvas.x}px`, top: `${image.canvas.y}px` }}>
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
      <div style={{display:'flex', flexDirection:'row'}}>
        <button style={{padding: '1rem'}} aria-label="Go to Radar Scan" onClick={goToLab5}> Radar Scan</button>
      </div>
    </div>
  );
};
