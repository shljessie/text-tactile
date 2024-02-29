import React, { useEffect, useState } from 'react';

import cat1 from '../assets/cat.png';
import cat2 from '../assets/cat2.png';
import catsound from '../assets/sounds/cat.wav';
import dog1 from '../assets/dog1.png';
import dog2 from '../assets/dog2.png';
import dog2sound from '../assets/sounds/dog2.mp3';
import grass from '../assets/grass.png';
import leaves from '../assets/leaves.png';
import pillow from '../assets/pillow.png';
import rain_window from '../assets/rain_window.png';
import splashsound from '../assets/sounds/splash.mp3';
import tree from '../assets/tree.png';
import water from '../assets/water.png';
import watersound from '../assets/sounds/water.mp3';

const PreloadedCanvas = () => {
  const [canvasItems, setCanvasItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (id, event) => {
    const item = canvasItems.find(item => item.id === id);
    if (item) {
      const offsetX = event.clientX - item.position.x;
      const offsetY = event.clientY - item.position.y;
      setOffset({ x: offsetX, y: offsetY });
      setSelectedItem(id);
      setDragging(true);
    }
  };

  const handleMouseMove = (event) => {
    if (dragging && selectedItem) {
      const x = event.clientX - offset.x;
      const y = event.clientY - offset.y;
      // Ensure this calls the correct function to update the item's position
      updateCanvasItemPosition(selectedItem, x - canvasItems.find(item => item.id === selectedItem).position.x, y - canvasItems.find(item => item.id === selectedItem).position.y);
    }
  };
  
  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
    }
  };

  

  useEffect(() => {
    // Preload some images into the canvas
    setCanvasItems([
      { id: 'cat1', url: cat1, position: { x: 10, y: 10 }, size: { width: 100, height: 100 } },
      // { id: 'cat2', url: cat2, position: { x: 120, y: 10 }, size: { width: 100, height: 100 } },
      // { id: 'dog1', url: dog1, position: { x: 230, y: 10 }, size: { width: 100, height: 100 } },
      { id: 'dog2', url: dog2, position: { x: 340, y: 10 }, size: { width: 100, height: 100 } },
      // { id: 'grass', url: grass, position: { x: 10, y: 120 }, size: { width: 100, height: 100 } },
      // { id: 'leaves', url: leaves, position: { x: 120, y: 120 }, size: { width: 100, height: 100 } },
      // { id: 'pillow', url: pillow, position: { x: 230, y: 120 }, size: { width: 100, height: 100 } },
      // { id: 'rain_window', url: rain_window, position: { x: 340, y: 120 }, size: { width: 100, height: 100 } },
      // { id: 'tree', url: tree, position: { x: 10, y: 230 }, size: { width: 100, height: 100 } },
      { id: 'water', url: water, position: { x: 120, y: 230 }, size: { width: 100, height: 100 } },
    ]);
  }, []);

  const updateCanvasItemPosition = (id, xChange = 0, yChange = 0) => {
    setCanvasItems(items =>
      items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            position: {
              x: item.position.x + xChange,
              y: item.position.y + yChange,
            },
          };
        }
        return item;
      }),
    );
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (selectedItem === null) return;

      switch (e.key) {
        case 'ArrowUp':
          updateCanvasItemPosition(selectedItem, 0, -10);
          break;
        case 'ArrowDown':
          updateCanvasItemPosition(selectedItem, 0, 10);
          break;
        case 'ArrowLeft':
          updateCanvasItemPosition(selectedItem, -10, 0);
          break;
        case 'ArrowRight':
          updateCanvasItemPosition(selectedItem, 10, 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedItem]);

  const selectItem = (id) => {
    setSelectedItem(id);
    // Here you can implement the logic to select an item for movement or resizing
  };

  const updateCanvasItem = (id, { x, y }) => {
    const updatedItems = canvasItems.map(item => {
      if (item.id === id) {
        return { ...item, position: { x, y } };
      }
      return item;
    });
    setCanvasItems(updatedItems);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, selectedItem, offset]);

  // Add more functions as needed for interaction

  return (
    <div>
      <h2>Preloaded Canvas</h2>
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
  );
};

export default PreloadedCanvas;
