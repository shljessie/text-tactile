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

export const InteractionLab = () => {

  const [canvasSize, setCanvasSize] = useState({width: '400px', height: '400px'});
  const tileSize = parseInt(canvasSize['width']) / 10; 
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [savedImages, setSavedImages] = useState(imageObjects);
  const playerRef = useRef(null);
  const thumpRef = useRef(null);

  const [keysPressed, setKeysPressed] = useState({
    spacebar: false,
    rightArrow: false,
  });

  


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

// Define the URLs
const url = "https://texttactile.s3.amazonaws.com/bloop.mp3";
const urlTwo = "https://texttactile.s3.amazonaws.com/bump.mp3";

// Create the player for the first sound
const player = new Tone.Player().toDestination();

// Load the audio file and handle success and potential errors
player.load(url).then(() => {
    playerRef.current = player;
    console.log('Audio 1 loaded');
}).catch(error => {
    console.error('Error loading audio 1:', error);
});

// Create the player for the second sound
const playerTwo = new Tone.Player().toDestination();

// Load the audio file and handle success and potential errors
playerTwo.load(urlTwo).then(() => {
    thumpRef.current = playerTwo;
    console.log('Audio 2 loaded');
}).catch(error => {
    console.error('Error loading audio 2:', error);
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
    <h1 style={{marginTop: '3rem'}}>Tile Navigation</h1>

    <p> 
    Practice Navigating through the tiles using arrow keys 
    The size of the canvas is 300 x 300
    </p>
      <div className="mainContainer" style={{display:'flex', flexDirection: 'row', width:'70%'}}>

        <div className="leftContainer">
          <div id="tileContainer" ref={canvasRef} style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative', 
            ...canvasSize, 
            border: '2px solid gray',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', margin:'3rem'  }}>

            
            {tiles.map((tile, index) => (
              <div
                className='pixel'
                autoFocus
                ref={(el) => tileRefs.current[index] = el}
                key={tile.id}
                onKeyDown={(event) => {
                  setFocusedIndex(index);
                  tileNavigation(event, index, savedImages.some(image => image.coordinate.x === tile.x && image.coordinate.y === tile.y));
                }}
                tabIndex={0}
                style={{
                  border: '2px solid black',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
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
              <div id="canvas" ref={canvasRef} style={{ position: 'relative', ...canvasSize, border: '2px solid gray',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', margin:'3rem' }} tabIndex={0}>
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
      <button style={{padding: '1rem',  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'}} aria-label="Go to Global Information" onClick={goToLab2}> Global Information</button>
      </div>

    </div>
  );
};
