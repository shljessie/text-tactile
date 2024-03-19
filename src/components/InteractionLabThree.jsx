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

export const InteractionLabThree = () => {
  
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
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState(null);
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

    const url = "assets/sounds/bloop.mp3";
    const urltwo = "assets/sounds/bump.mp3";

    const player = new Tone.Player().toDestination();
    player.load(url).then(() => {
        playerRef.current = player;
    });

    const playerTwo = new Tone.Player().toDestination();
    playerTwo.load(urltwo).then(() => {
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

      if (e.shiftKey && e.key === 'L') {
        if (focusedIndex !== null) {
          console.log('Location Edit Activated');
          console.log('Focused Index', focusedIndex);
          setlocationEditActive(true); 
          playModeNotification("Location Edit Activated. Press the arrow keys to edit the location of the object.");
          // readLocationEdit(focusedIndex);
          enterLocationEditMode(focusedIndex);

          setTimeout(() => {
            setlocationEditActive(false);
          }, 3000); 
        } else {
          speakNoTileFocusedMessage();
          console.log("No tile is focused.");
        }
    }
    else if (e.shiftKey && e.key === 'G') {
      console.log('Fetching GPT Description');
      fetchGPTDescription();
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

  const readLocationEdit = (focusedIndex) => {
    console.log('READ LOCATION EDIT',  tiles[focusedIndex].x)
    const image = savedImages.find(image => image.coordinate.x == tiles[focusedIndex].x && image.coordinate.y == tiles[focusedIndex].y)
    console.log('EDIT IMAGE', image)
    const script = `The image is now located in ${image.canvas.x} and ${image.canvas.y}`

    speakMessage(script)

  }

  const updateImagePosition = (editingImageIndex, dx, dy) => {
      savedImages[editingImageIndex].canvas.x = savedImages[editingImageIndex].canvas.x + dx
      savedImages[editingImageIndex].canvas.y = savedImages[editingImageIndex].canvas.y + dy

    // console.log('original, ', savedImages[editingImageIndex].canvas.x)
    // console.log('updated saved images',savedImages)

  }


  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log('canvas Focused for location edit')
      
      if (isEditingLocation &&
          editingImageIndex !== null) {

        if (0 > savedImages[editingImageIndex].canvas.x  ||  
          savedImages[editingImageIndex].canvas.x > 300 || 
          0 > savedImages[editingImageIndex].canvas.y  || 
          savedImages[editingImageIndex].canvas.y > 300){
            speakMessage('Canvas Edge')
            playSpatialThump('top')
          }

        console.log('editing Lcoation Index', editingImageIndex)
        console.log('Keyboard Editing here')
        console.log(`Key pressed: ${e.key}`);
        let dx = 0, dy = 0;
        switch(e.key) {
          case 'ArrowLeft': 
            dx = -10; 
            playSpatialSound('left'); 
            updateImagePosition(editingImageIndex, dx, dy);
            
            break;
          case 'ArrowRight': dx = 10; playSpatialSound('right'); updateImagePosition(editingImageIndex, dx, dy); break;
          case 'ArrowUp': dy = -10; playSpatialSound('up');  updateImagePosition(editingImageIndex, dx, dy); break;
          case 'ArrowDown': dy = 10;playSpatialSound('down');   updateImagePosition(editingImageIndex, dx, dy);break;
          case 'Escape':
            setIsEditingLocation(false);
            setEditingImageIndex(null);
            setFocusedIndex(focusedIndex);
            if (tileRefs.current[focusedIndex]) {
              tileRefs.current[focusedIndex].focus();
            }
            speakMessage("Location mode exited");
            readLocationEdit(focusedIndex)
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

      } else {
      }
    };

    if (isEditingLocation) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditingLocation]);

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

  const generateDescriptionPrompt = (savedImages) => {
    let descriptions = savedImages.map((img, index) => {
      return `Imager "${img.name}" with prompt "${img.prompt}" is positioned at coordinates (${img.canvas.x}, ${img.canvas.y}) on the canvas, measuring ${img.sizeParts.width} pixels wide by ${img.sizeParts.height} pixels high.`;
    }).join(" ");

    customPrompt =  `Describe the layout of the following images on a canvas based on their coordinates and sizes in a verbal way with out using exact numbers descriptions: ${descriptions}. The canvas is 300 x 300 pixels`;

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


  return (
    <div id="imageGeneration">
    <h1>Location Edit</h1>
    <p>Navigate to a tile and press Shift+L to edit the location of an image. 
    <br/>
    Use the arrow keys to change the location of an image.
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
        <button style={{padding: '1rem'}} aria-label="Go to Tile Navigation" onClick={goToLab1}> Tile Navigation</button>
        <button style={{padding: '1rem'}} aria-label="Go to Global Information" onClick={goToLab2}> Global Information</button>
        <button style={{padding: '1rem'}} aria-label="Go to Location Edit" onClick={goToLab3}> Location Edit</button>
        <button style={{padding: '1rem'}} aria-label="Go to Size Edit" onClick={goToLab4}> Size Edit</button>
        <button style={{padding: '1rem'}} aria-label="Go to Radar Scan" onClick={goToLab5}> Radar Scan</button>
      </div>
    </div>
  );
};
