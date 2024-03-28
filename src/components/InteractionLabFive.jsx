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
    sound: "D4"
  },
  {
    prompt: "A dog's bowl",
    name: "bowl_image",
    url: "https://www.svgrepo.com/show/113124/dog-dish.svg",
    descriptions: "",
    coordinate: { x: 140, y: 180 }, // Matching with tile 6
    canvas: { x: 140, y: 200 },
    sizeParts: { width: 40, height: 40 },
    sound: "C4"
  },
  {
    prompt: "The sun shining bright",
    name: "sun_image",
    url: "https://www.svgrepo.com/show/523849/sun-2.svg",
    descriptions: "",
    coordinate: { x: 220, y: 140 }, // Matching with tile 3
    canvas: { x:300, y: 50 },
    sizeParts: { width: 60, height: 60 },
    sound: "E4"
  }
];

export const InteractionLabFive = () => {

  const [canvasSize, setCanvasSize] = useState({width: '400px', height: '400px'});
  const tileSize = parseInt(canvasSize['width']) / 10; 
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [savedImages, setSavedImages] = useState(imageObjects);
  const playerRef = useRef(null);
  const [radarActive, setRadarActive] = useState(false); 
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

    const player = new Tone.Player().toDestination();
    player.load(url).then(() => {
        playerRef.current = player;
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

  const speakImageName = (text, callback) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = function(event) {
        console.log('Speech synthesis finished speaking');
        callback();
    };
    window.speechSynthesis.speak(utterance);
}

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
  synth.triggerAttackRelease(note, '2');
  
 }



  const radarScan = (gridIndex) => {

    const tileX = tiles[gridIndex].x;
    const tileY= tiles[gridIndex].y
    const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)

    console.log('Image',savedImages[imageIndex]);

    const centerX = savedImages[imageIndex].coordinate.x;
    const centerY = savedImages[imageIndex].coordinate.y;

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex]);

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
    <h1>Radar Scan</h1>
    <p>
    Press Shift +R to activate Radar Scan 
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

      </div>
    
    </div>
  );
};
