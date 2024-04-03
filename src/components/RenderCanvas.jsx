import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';

export const RenderCanvas = () => {
  const location = useLocation();
  const { savedImages, canvasSize } = location.state || { savedImages: [], canvasSize: {} };
  const canvasRef = useRef(null);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', marginTop:'none' }}>
    <h2>Generate Tactile Graphic</h2>
      <p style={{marginBottom: '2rem'}}>Create a screenshot of the image and save to your desktop. Then Click on the image below.</p>
      <div>
        <button style={{ marginBottom: '10px', padding :'0.5rem', fontWeight:'200' }}>Download Canvas as Image</button>
        <a href="https://huggingface.co/spaces/shljessie/TactileGraphics" className="button">
        <button style={{ marginBottom: '10px', padding :'0.5rem', fontWeight:'200' }}>Generate Tactile Graphic</button></a>
      </div>
        <div id="canvas" ref={canvasRef} style={{ position: 'relative', ...canvasSize, border: '4px solid gray', boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' }} tabIndex={0}>
          {savedImages.map((image, index) => (
            <div key={index} style={{ position: 'absolute', left: `${image.canvas.x}px`, top: `${image.canvas.y}px` }} tabIndex={0}>
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
  );
  
}
