import * as Tone from 'tone';

import { Configuration, OpenAIApi } from 'openai';
import React, { useEffect, useRef, useState } from 'react';

import { MoonLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';
import { useSelectedAssets } from './SelectedAssetContext';

const gridCenter = { x: 1, y: 1 };
const imageSize = 50; 
const imageObjects = [
  {
    prompt: "A cute dog",
    name: "dog_image",
    url: "https://www.svgrepo.com/show/426701/dog.svg",
    descriptions: "An Image of a dog sitting down and facing the left. The viewer can see the side view of the dog sitting down. The image has no color and only black outlines",
    coordinate: { x: 180, y: 180 }, // Matching with tile 7
    canvas: { x: 180, y: 180 },
    sizeParts: { width: imageSize, height: imageSize },
    sound: "bark"
  },
  {
    prompt: "A dog's bowl",
    name: "bowl_image",
    url: "https://www.svgrepo.com/show/113124/dog-dish.svg",
    descriptions: "An empty dog bowl. The bowl is black and has a picture of a dog bone drawn on it.",
    coordinate: { x: 140, y: 180 }, // Matching with tile 6
    canvas: { x: 100, y: 200 },
    sizeParts: { width: 100, height: 100 },
    sound: "clink"
  },
  {
    prompt: "The sun shining bright",
    name: "sun_image",
    url: "https://www.svgrepo.com/show/523849/sun-2.svg",
    descriptions: "The sun is a circle and has black lines surrounding the circle. that represent the rays of sunlight. The sun is drawn with only outlines.",
    coordinate: { x: 220, y: 140 }, // Matching with tile 3
    canvas: { x:250, y: 50 },
    sizeParts: { width: 150, height: 150 },
    sound: "none"
  }
];

export const InteractionLabTwo = () => {

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
  const [infoActive, setinfoActive] = useState(false); 
  let [customPrompt, setcustomPrompt ] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const playerRef = useRef(null);
  const thumpRef = useRef(null);

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
  


  const navigate = useNavigate();
  const goToLab1 = () => navigate('/lab');
  const goToLab2 = () => navigate('/lab2');
  const goToLab3 = () => navigate('/lab3');
  const goToLab4 = () => navigate('/lab4');
  const goToLab5 = () => navigate('/lab5');

  const tileRefs = useRef([]);

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

  const generateImage = async (prompt) => {
    console.log("OPENAI", openai)
    const response = await openai.createImage({
      prompt: `You are a children's cartoon graphic designer. Only create one of ${prompt} The background should be white. Only draw thick outlines without color. It should be in a simple minimalistic graphic design. `,
      n: 1,
    });
    
    const url = response.data.data.map(img => ({
      url: img.url
    }));

    console.log('uRL', url)
    
    return url;
  }

  // const [imageUrls, setImageUrls] = useState([]);
  // const timesRef = useRef(0);

  // useEffect(() => {

  //   // This function will now update the savedImages state with new URLs
  //   const updateImageUrls = async () => {
  //     if (openai && timesRef.current === 0) {
  //       console.log('GENERATING NEW IMAGE')
  //       const updatedSavedImages = await Promise.all(savedImages.map(async (image, index) => {
  //         const promptResponse = await generateImage(image.prompt);
  //         const newUrl = promptResponse[0].url; // Assuming generateImage returns an array with a single object that contains the URL
  //         return { ...image, url: newUrl }; // Return a new object with the updated URL
  //       }));
  
  //       setSavedImages(updatedSavedImages); // Update the state with the new image objects
  //       timesRef.current = 1;
  //     }
  //   };
  
  //   if (savedImages.length > 0) {
  //     updateImageUrls();
  //   }
  // }, [savedImages, openai]);
  
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

  const [keysPressed, setKeysPressed] = useState({
    spacebar: false,
    rightArrow: false,
  });

  useEffect(() => {

    const handleKeyDown = (e) => {

      if (e.code === 'Space') {
        setKeysPressed((prev) => ({ ...prev, spacebar: true }));
      }
      if (e.code === 'ArrowRight') {
        setKeysPressed((prev) => ({ ...prev, rightArrow: true }));
      }
    
      if (keysPressed.spacebar && keysPressed.rightArrow) {
        goToLab3();
      }

      if (e.shiftKey && e.key === 'I') {
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

  let oldImage;

  const generateDescriptionPrompt = (savedImages) => {
    let descriptions = savedImages.map((img, index) => {
      return `Image ${img.name}" with prompt "${img.prompt}" is positioned at coordinates (${img.canvas.x}, ${img.canvas.y}) on the canvas, measuring ${img.sizeParts.width} pixels wide by ${img.sizeParts.height} pixels high.`;
    }).join(" ");

    customPrompt =  `The canvas is 300 x 300 pixels. Describe the layout of the following images on a canvas based on their coordinates and sizes in a verbal way with out using exact numbers descriptions: ${descriptions}. The canvas is 300 x 300 pixels`;

    console.log(" GIRL PROMPT: ", customPrompt)
  };

  const speakDescription = (description) => {
    console.log('speaking')
    var speech = new SpeechSynthesisUtterance(description);
  
    speech.rate = 1; // Speed of speech
    speech.pitch = 1; // Pitch of speech
    speech.volume = 1; // Volume
  
    window.speechSynthesis.speak(speech);
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

  async function convertImageToBase64(imageURL) {
    try {
      // Fetch the image
      const response = await fetch(imageURL);
      // Convert the response to a blob
      const blob = await response.blob();
      // Use FileReader to convert the blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to Base64:", error);
      return null;
    }
  }

  const imageChat = async (gridIndex) => {

    const tileX = tiles[gridIndex].x;
    const tileY= tiles[gridIndex].y
    const imageIndex = savedImages.findIndex(image => image.coordinate.x == tileX && image.coordinate.y == tileY)
  
    console.log('check of chat image matches',savedImages[imageIndex] )

    const imageURL = savedImages[imageIndex].url;

    // let base64String;
    // try {
    //   base64String = await convertImageToBase64(imageURL);
    //   console.log('Base64 string:', base64String);
    // } catch (error) {
    //   console.error('Error converting image to Base64:', error);
    // }
    
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
    <h1 style={{marginTop:'3rem'}}>Global Info, Local Info </h1>
    <p>
    Navigate to each of the tilese and press. Shift + I to hear the info of each of the tiles.
    Press Shift+G to hear the global description of the image.
    <br/>
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
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', margin:'3rem'
           }}>

            
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
              <div id="canvas" ref={canvasRef} style={{ position: 'relative', ...canvasSize, border: '1px solid black', border: '2px solid gray',
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


        <button style={{padding: '1rem'}} aria-label="Go to Location Edit" onClick={goToLab3}> Location Edit</button>
      </div>
    </div>
  );
};
