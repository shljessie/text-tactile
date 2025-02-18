import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const RenderCanvas = () => {
  const location = useLocation();
  const { savedImages, canvasSize } = location.state || { savedImages: [], canvasSize: {} };
  const canvasRef = useRef(null);
  
  const handlePrint = () => {
    window.print();
  };
  
  const printStyles = `
  @media print {
    body * {
      visibility: hidden; /* Hide everything in the body by default */
    }
    #printablearea, #printablearea * {
      visibility: visible; /* Only printableArea and its children will be visible */
    }
    #printablearea {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
  }
`;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', marginTop:'none' }}>
    <style>{printStyles}</style>
      <div>
        <button style={{ marginBottom: '10px', padding: '0.5rem', fontWeight: '200' }} onClick={handlePrint}>Print Final Image</button>
      </div>
        <div id="canvas" ref={canvasRef} style={{ position: 'relative', ...canvasSize, border: 'none', boxShadow: 'none' }} tabIndex={0}>
        <div id="printablearea">
          {savedImages.map((image, index) => (
            <div key={index} style={{ position: 'absolute', left: `${image.canvas.x}px`, top: `${image.canvas.y}px` }} tabIndex={0}>
              <img
                src={image.image_nbg}
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
  );
  
}
