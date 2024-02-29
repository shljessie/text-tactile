import React, { useEffect, useState } from 'react';

import TestSoundButtons from './TestSoundButtons'
// Import image and sound assets
import cat1 from '../assets/cat.png';
import catsound from '../assets/sounds/cat.mp3';
import dog2 from '../assets/dog2.png';
import dog2sound from '../assets/sounds/dog2.mp3';
import splashsound from '../assets/sounds/splash.mp3';
import water from '../assets/water.png';
import watersound from '../assets/sounds/water.mp3';

const PreloadedCanvas = () => {

  const [canvasItems, setCanvasItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [audioPlayers, setAudioPlayers] = useState({});

  useEffect(() => {
    setCanvasItems([
      { id: 'cat1', url: cat1, position: { x: 10, y: 10 }, size: { width: 150, height: 100 }, sound: catsound },
      { id: 'dog2', url: dog2, position: { x: 340, y: 10 }, size: { width: 150, height: 150 }, sound: dog2sound },
      { id: 'water', url: water, position: { x: 0, y: 230 }, size: { width: 600, height: 200 }, sound: watersound },
    ]);

    // Initialize audio players for continuous play
    setAudioPlayers({
      cat1: new Audio(catsound),
      dog2: new Audio(dog2sound),
      water: new Audio(watersound),
      splash: new Audio(splashsound),
    });
  }, []);

  const playSound = (itemId) => {
    const player = audioPlayers[itemId];
    if (player && player.paused) {
      player.play();
    }
  };

  const stopSound = (itemId) => {
    const player = audioPlayers[itemId];
    if (player && !player.paused) {
      player.pause();
      player.currentTime = 0;
    }
  };

  const checkForCollision = (item1, item2) => {
    return item1.position.x < item2.position.x + item2.size.width &&
           item1.position.x + item1.size.width > item2.position.x &&
           item1.position.y < item2.position.y + item2.size.height &&
           item1.position.y + item1.size.height > item2.position.y;
  };

  const updateCanvasItemPosition = (id, xChange = 0, yChange = 0) => {
    let splashPlayed = false;
    let collisionOccurred = false; // Track if a collision occurs

    setCanvasItems(items => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                const newPosition = { x: item.position.x + xChange, y: item.position.y + yChange };

                items.forEach(otherItem => {
                    if (otherItem.id !== id && checkForCollision({ ...item, position: newPosition }, otherItem)) {
                        if (otherItem.id === 'water') {
                            if (!splashPlayed) {
                                playSound('splash');
                                splashPlayed = true;
                            }
                        }

                        if ((item.id === 'cat1' && otherItem.id === 'dog2')) {
                            playSound('dog2');
                            collisionOccurred = true;
                        }
                        if ( (item.id === 'dog2' && otherItem.id === 'cat1')){
                          playSound('cat1');
                            collisionOccurred = true;
                        }
                    }
                });

                return { ...item, position: newPosition };
            }
            return item;
        });

        if (!collisionOccurred && (xChange !== 0 || yChange !== 0)) {
            playSound(id); 
        }

        return updatedItems;
    });
};


  useEffect(() => {
    const handleKeyPress = (e) => {
      if (selectedItem === null) return;

      let xChange = 0, yChange = 0;
      switch (e.key) {
        case 'ArrowUp': yChange = -10; break;
        case 'ArrowDown': yChange = 10; break;
        case 'ArrowLeft': xChange = -10; break;
        case 'ArrowRight': xChange = 10; break;
        default: return;
      }
      updateCanvasItemPosition(selectedItem, xChange, yChange);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedItem, canvasItems, audioPlayers]);

  const speakWithSpatialAudio = (text, x, y, z) => {
    if (!window.speechSynthesis) {
      console.error("Speech Synthesis API is not supported in this browser.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.voice = window.speechSynthesis.getVoices()[1];

    window.speechSynthesis.speak(utterance);
  };

  const handleReadTextClick = () => {
    speakWithSpatialAudio("The dog is in the top right corner of the canvas.", 1, 0, 0); // Right
    speakWithSpatialAudio("The cat is on the left of the canvas.", -1, 0, 0); // Left
    speakWithSpatialAudio("The water is at the bottom of the canvas.", 0, -1, 0); // Bottom
  };
  

  return (
    <div>
    <div style={{ display: 'flex'}}>
      <div style={{margin: '40px'}}>
        <h2>Sound Bump</h2>
          <div id="canvas-container" style={{ position: 'relative', width: '600px', height: '400px', border: '1px solid #ccc' }}>
            {canvasItems.map((item) => (
              <img
                key={item.id}
                src={item.url}
                alt=""
                style={{ position: 'absolute', left: `${item.position.x}px`, top: `${item.position.y}px`, width: `${item.size.width}px`, height: `${item.size.height}px` }}
                onClick={() => setSelectedItem(item.id)}
              />
            ))}
          </div>
      </div>
      <div style={{margin: '40px'}}>
          <h2>Sound Bump</h2>
          {/* Canvas and TestSoundButtons components */}

          <h2>Sound Walk</h2>
          <div>
            <p>The dog is in the top right corner of the canvas.</p>
            <p>The cat is in the left of the canvas.</p>
            <p>The water is in the bottom of the canvas</p>
          </div>

          <button onClick={handleReadTextClick}>Read Text With Spatial Audio</button>

          {/* Rest of the component */}
      </div>
    </div>
    <TestSoundButtons />
    </div>
  );
};

export default PreloadedCanvas;
