import * as Tone from 'tone';

// Canvas.js
import React, { useEffect, useState } from 'react';

import html2canvas from 'html2canvas';
import { useSelectedAssets } from './SelectedAssetContext';

const Canvas = () => {
  const { selectedAssets } = useSelectedAssets();
  const [canvasItems, setCanvasItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [action, setAction] = useState('');
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [showUI, setShowUI] = useState(true);


  const canvasWidth = 600; // Width of the canvas
  const canvasHeight = 400; // Height of the canvas


  // Key for localStorage
  const storageKey = 'canvasState';

  useEffect(() => {
    // Load canvas state from localStorage
    const savedCanvasItems = JSON.parse(localStorage.getItem(storageKey));
    if (savedCanvasItems) {
      setCanvasItems(savedCanvasItems);
    }
  }, []);

  useEffect(() => {
    // Save canvas state to localStorage on change
    localStorage.setItem(storageKey, JSON.stringify(canvasItems));
  }, [canvasItems]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (selectedItem === null || action === '') return;
      
      const newPosition = { ...canvasItems[selectedItem].position };
      const newSize = { ...canvasItems[selectedItem].size };
    
      let handled = false;
      let direction = '';
    
      if (action === 'move') {
        switch (e.key) {
          case 'ArrowUp': newPosition.y -= 10; handled = true; direction = 'top'; break;
          case 'ArrowDown': newPosition.y += 10; handled = true; direction = 'bottom'; break;
          case 'ArrowLeft': newPosition.x -= 10; handled = true; direction = 'left'; break;
          case 'ArrowRight': newPosition.x += 10; handled = true; direction = 'right'; break;
        }
      } else if (action === 'resize') {
        switch (e.key) {
          case 'ArrowUp': newSize.height += 10; handled = true; direction = 'top'; break;
          case 'ArrowDown': newSize.height -= 10; handled = true; direction = 'bottom'; break;
          case 'ArrowRight': newSize.width += 10; handled = true; direction = 'right'; break;
          case 'ArrowLeft': newSize.width -= 10; handled = true; direction = 'left'; break;
        }
      }
    
      if (handled) {
        e.preventDefault();
        updateCanvasItem(selectedItem, { position: newPosition, size: newSize });
      
        const sizeCategory = getSizeCategory(newSize); // Determine the size category based on the new size
        playSound(direction, sizeCategory); // Pass the size category to playSound
      }
      
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedItem, canvasItems, action]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.className === "canvas-container") {
        console.log('clicked')
        setSelectedItem(null); 
      }
    };

    // Add event listener to canvas container
    const canvasContainer = document.getElementById('canvas-container');
    console.log('Detected Canvas', canvasContainer)
    canvasContainer.addEventListener('click', handleClickOutside);

    return () => {
      // Clean up event listener on component unmount
      canvasContainer.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const images = document.querySelectorAll('#canvas-container img');
    const totalImages = images.length;
    let loadedImages = 0;
  
    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        loadedImages++;
      } else {
        img.onload = () => {
          loadedImages++;
          if (loadedImages === totalImages) {
            setAllImagesLoaded(true);
          }
        };
      }
    });
  
    if (loadedImages === totalImages) {
      setAllImagesLoaded(true);
    }
  }, [canvasItems]); 

  const getSizeCategory = (size) => {
    const area = size.width * size.height;
    if (area < 10000) return 'small'; // Adjust thresholds as needed
    else if (area >= 10000 && area < 50000) return 'medium';
    else return 'large';
  };
  
  const addToCanvas = (assetUrl) => {

    const uniqueUrl = `${assetUrl}?not-from-cache-please=${new Date().getTime()}`;
    
    const newCanvasItem = {
      url: uniqueUrl,
      position: { x: 50, y: 50 },
      size: { width: 100, height: 100 },
    };
    setCanvasItems([...canvasItems, newCanvasItem]);
  };

  const updateCanvasItem = (index, updates) => {
    const newCanvasItems = [...canvasItems];
    const itemToUpdate = newCanvasItems[index];
  
    // Calculate new position or size
    let newPosition = updates.position ? { ...itemToUpdate.position, ...updates.position } : itemToUpdate.position;
    let newSize = updates.size ? { ...itemToUpdate.size, ...updates.size } : itemToUpdate.size;
  
    // Ensure the item stays within the canvas boundaries
    newPosition.x = Math.max(0, Math.min(newPosition.x, canvasWidth - newSize.width));
    newPosition.y = Math.max(0, Math.min(newPosition.y, canvasHeight - newSize.height));
  
    newSize.width = Math.min(newSize.width, canvasWidth - newPosition.x);
    newSize.height = Math.min(newSize.height, canvasHeight - newPosition.y);

    // Edge touch detection
    if(newPosition.x === 0 || newPosition.y === 0 || newPosition.x === (canvasWidth - newSize.width) || newPosition.y === (canvasHeight - newSize.height)) {
      playEdgeTouchSound(); // Play sound when touching the edges
    }

  
    // Update the item
    itemToUpdate.position = newPosition;
    itemToUpdate.size = newSize;
  
    // Set the updated canvas items
    setCanvasItems(newCanvasItems);
  };

  const playSound = async (direction, sizeCategory) => {
    await Tone.start(); // Ensure Tone.js is started
  
    const synth = new Tone.Synth().toDestination();
    const panner = new Tone.Panner3D().toDestination();
    const volume = new Tone.Volume().toDestination();
    synth.chain(panner, volume, Tone.Destination);
  
    // Set panner position based on direction
    switch (direction) {
      case 'right':
        panner.positionX.value = 1;
        break;
      case 'left':
        panner.positionX.value = -1;
        break;
      case 'top':
        panner.positionY.value = 1;
        break;
      case 'bottom':
        panner.positionY.value = -1;
        break;
      default:
        panner.positionX.value = 0;
        panner.positionY.value = 0;
    }
  
    // Adjust sound based on size category
    switch (sizeCategory) {
      case 'large':
        volume.volume.value = 6;
        synth.oscillator.type = 'sawtooth';
        break;
      case 'medium':
        volume.volume.value = 0;
        synth.oscillator.type = 'triangle';
        break;
      case 'small':
        volume.volume.value = -12;
        synth.oscillator.type = 'sine';
        break;
      default:
        volume.volume.value = -6; // Default or unknown size
        synth.oscillator.type = 'square';
    }
  
    synth.triggerAttackRelease("C4", "1s");
  };



  const playEdgeTouchSound = async (direction) => {
    await Tone.start(); // Ensure Tone.js is started
  
    const volume = new Tone.Volume(6).toDestination(); // Increased volume
    const panner = new Tone.Panner(0).connect(volume); // Default pan position is center
  
    // Adjust pan based on direction
    switch (direction) {
      case 'top':
        panner.pan.value = 0; // Center for top and bottom, could adjust if desired
        break;
      case 'bottom':
        panner.pan.value = 0; // Center for bottom
        break;
      case 'left':
        panner.pan.value = -1; // Pan fully left
        break;
      case 'right':
        panner.pan.value = 1; // Pan fully right
        break;
      default:
        // Keep sound centered if direction is unknown
        panner.pan.value = 0;
    }
  
    const synth = new Tone.MembraneSynth({
      envelope: {
        sustain: 0.3, // Longer sustain
        attack: 0.05, // Slightly longer attack for a more gradual onset
        decay: 0.4, // Longer decay
        release: 1, // Extended release for a lingering sound
      }
    }).connect(panner); // Connect the synth to the panner
  
    synth.triggerAttackRelease("C2", "1n"); // "1n" is a whole note for longer duration
  };
  
  

  const deleteItem = (index) => {
    const newCanvasItems = canvasItems.filter((_, i) => i !== index);
    setCanvasItems(newCanvasItems);
    setSelectedItem(null); // Deselect item
  };

  const deselectItem = () => {
    setSelectedItem(null);
    setAction('');
  };
  
  const clearCanvas = () => {
    setCanvasItems([]);
    localStorage.removeItem(storageKey); // Clear the saved state
  };

  const selectItem = (index) => {
    setSelectedItem(index);
  };

  const saveCanvasAsImage = () => {
    setShowUI(false);
  
    setTimeout(() => {
      // Add an options object with allowTaint set to true
      html2canvas(document.getElementById('canvas-container'), { allowTaint: true }).then((canvas) => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'canvas-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowUI(true);
      });
    }, 100);
  };
  

  return (
    <div>

      <div className="canvasContainer" style={{display:'flex', flexDirection:'row',paddingLeft: '2rem'}}>

      <div style={{ backgroundColor: 'alicblue',  display: 'flex', flexDirection: 'column', overflowX: 'scroll', paddingBottom: '10px', marginBottom: '20px' }}>
        <h4 style={{color: '1E90FF'}}>Asset Library </h4>
          <div style={{backgroundColor: '#B9D9EB', display:'flex', flexDirection: 'column', width:'150px'}}>
            {selectedAssets.map((assetUrl, index) => (
              <img
                key={index}
                src={`http://127.0.0.1:5000${assetUrl}`}
                alt={`Asset ${index}`}
                style={{ width: '100px', height: '100px', margin: 'auto', marginBottom:'10px', marginTop:'10px', cursor: 'pointer' }}
                onClick={() => addToCanvas(assetUrl)}
                title="Click to add to canvas"
              />
            ))}
          </div>
      </div>

      <div className="canvas-container" id="canvas-container" style={{ position: 'relative', margin: 'auto', width: '60vw', height: '60vh', border: '3px solid black', borderRadius:'2rem',boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px'  }}>
        {canvasItems.map((item, index) => (
          <div key={index} style={{ position: 'absolute', left: `${item.position.x}px`, top: `${item.position.y}px`, cursor: 'pointer' }} onClick={() => selectItem(index)}>
            <img
              crossOrigin="anonymous"
              tabIndex="0"
              src={`http://127.0.0.1:5000${item.url}?not-from-cache-please=${new Date().getTime()}`}
              alt={`Asset ${index}`}
              style={{ width: `${item.size.width}px`, height: `${item.size.height}px` }}
            />
        
            {selectedItem === index && (
              <div>
                <button onClick={() => setAction('move')}>Location</button>
                <button onClick={() => setAction('resize')}>Size</button>
                <button onClick={() => deleteItem(selectedItem)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', marginBottom: '20px' }}>
        <button onClick={saveCanvasAsImage} style={{ marginRight: '20px' }}>Save Canvas as Image</button>
        <button onClick={clearCanvas}>Clear Canvas</button>
      </div>
    
      </div>
    </div>
  );
};

export default Canvas;
