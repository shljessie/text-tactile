import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import html2canvas from 'html2canvas';

export const RenderCanvas = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { savedImages, canvasSize } = location.state || { savedImages: [], canvasSize: {} };
  const canvasRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderedImage, setRenderedImage] = useState(null);
  const [savedRenders, setSavedRenders] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  
  // Add debug logs
  console.log('RenderCanvas mounted with:', {
    savedImages,
    canvasSize,
    isRendering,
    renderedImage,
    savedRenders,
    showGallery
  });
  
  // Speech synthesis function for accessibility
  const speakMessage = (message) => {
    const utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
  };

  // Load saved renders from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedRenders');
    console.log('Loading saved renders from localStorage:', saved);
    if (saved) {
      setSavedRenders(JSON.parse(saved));
    }
  }, []);

  // Save rendered image to localStorage
  const saveRenderedImage = () => {
    console.log('Attempting to save rendered image:', renderedImage);
    if (!renderedImage) {
      console.log('No rendered image to save');
      return;
    }
    
    const newRender = {
      id: Date.now(),
      imageUrl: renderedImage,
      timestamp: new Date().toISOString(),
      name: `Canvas Render ${new Date().toLocaleDateString()}`
    };
    
    console.log('Saving new render:', newRender);
    const updatedRenders = [newRender, ...savedRenders];
    setSavedRenders(updatedRenders);
    localStorage.setItem('savedRenders', JSON.stringify(updatedRenders));
    speakMessage("Canvas render saved to library");
  };

  // Delete a saved render
  const deleteSavedRender = (id) => {
    const updatedRenders = savedRenders.filter(render => render.id !== id);
    setSavedRenders(updatedRenders);
    localStorage.setItem('savedRenders', JSON.stringify(updatedRenders));
    speakMessage("Render deleted from library");
  };

  // Download a specific saved render
  const downloadSavedRender = (imageUrl, name) => {
    const link = document.createElement('a');
    link.download = `${name || 'canvas-render'}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = imageUrl;
    link.click();
  };
  
  // Handle direct printing through browser
  const handlePrint = () => {
    window.print();
  };
  
  // Handle downloading the canvas as an image
  const handleDownload = () => {
    if (renderedImage) {
      const link = document.createElement('a');
      link.download = `canvas-render-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = renderedImage;
      link.click();
    } else {
      captureCanvas(true);
    }
  };
  
  // Function to navigate back to editor
  const handleBack = () => {
    navigate('/sonic');
  };
  
  // Function to capture the canvas as an image
  const captureCanvas = (download = false) => {
    // Don't use html2canvas at all, directly draw to canvas
    try {
      // Create a canvas element
      const manualCanvas = document.createElement('canvas');
      manualCanvas.width = canvasSize.width;
      manualCanvas.height = canvasSize.height;
      const ctx = manualCanvas.getContext('2d');
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, manualCanvas.width, manualCanvas.height);
      
      // Create a counter to track loaded images
      let totalImages = savedImages.length;
      let loadedImages = 0;
      
      // No images to render
      if (totalImages === 0) {
        setRenderedImage(manualCanvas.toDataURL('image/png', 1.0));
        setIsRendering(false);
        return;
      }
      
      setIsRendering(true);
      
      // Load all images and draw them on the canvas
      savedImages.forEach((image) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const x = image.canvas.x - (image.sizeParts.width / 2);
          const y = image.canvas.y - (image.sizeParts.height / 2);
          ctx.drawImage(img, x, y, image.sizeParts.width, image.sizeParts.height);
          
          loadedImages++;
          if (loadedImages >= totalImages) {
            const dataUrl = manualCanvas.toDataURL('image/png', 1.0);
            setRenderedImage(dataUrl);
            setIsRendering(false);
            
            if (download) {
              const link = document.createElement('a');
              link.download = `canvas-render-${new Date().toISOString().slice(0, 10)}.png`;
              link.href = dataUrl;
              link.click();
            }
          }
        };
        
        img.onerror = () => {
          console.warn(`Failed to load image for ${image.name}`);
          
          // Draw a placeholder rectangle for failed images
          const x = image.canvas.x - (image.sizeParts.width / 2);
          const y = image.canvas.y - (image.sizeParts.height / 2);
          
          // Draw placeholder
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(x, y, image.sizeParts.width, image.sizeParts.height);
          ctx.strokeStyle = '#999';
          ctx.strokeRect(x, y, image.sizeParts.width, image.sizeParts.height);
          
          // Add text
          ctx.fillStyle = '#999';
          ctx.font = '14px Arial';
          const textWidth = ctx.measureText(image.name || 'Image').width;
          const textX = x + (image.sizeParts.width - textWidth) / 2;
          ctx.fillText(image.name || 'Image', textX, y + image.sizeParts.height / 2);
          
          loadedImages++;
          if (loadedImages >= totalImages) {
            const dataUrl = manualCanvas.toDataURL('image/png', 1.0);
            setRenderedImage(dataUrl);
            setIsRendering(false);
            
            if (download) {
              const link = document.createElement('a');
              link.download = `canvas-render-${new Date().toISOString().slice(0, 10)}.png`;
              link.href = dataUrl;
              link.click();
            }
          }
        };
        
        // Get the appropriate image source
        let imgSrc = image.image_nbg || image.url;
        
        // Use our proxy for any external images to avoid CORS issues
        if (imgSrc.includes('oaidalleapiprodscus.blob.core.windows.net') || 
            imgSrc.includes('localhost:3001/images/') ||
            imgSrc.startsWith('https://')) {
          // Proxy the image through our server
          const encodedUrl = encodeURIComponent(imgSrc);
          img.src = `/proxy-image?url=${encodedUrl}`;
          console.log('Proxying image:', imgSrc);
        } else {
          // For data URLs or relative paths, use directly
          img.src = imgSrc;
        }
      });
    } catch (error) {
      console.error('Error in manual canvas rendering:', error);
      setIsRendering(false);
    }
  };
  
  // Render the canvas automatically when component mounts
  useEffect(() => {
    // Short delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      captureCanvas();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run on mount
  
  // Function to get a proxied image URL
  const getProxiedImageUrl = (url) => {
    if (!url) return '';
    
    if (url.includes('oaidalleapiprodscus.blob.core.windows.net') || 
        url.includes('localhost:3001/images/') ||
        url.startsWith('https://')) {
      return `/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };
  
  // CSS for print handling
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #printArea, #printArea * {
        visibility: visible;
      }
      #printArea {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: auto;
      }
      .controls, button, .button-container {
        display: none !important;
      }
    }
    
    @page {
      size: auto;
      margin: 0.5cm;
    }
  `;

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      gap: '20px'
    }}>
      <style>{printStyles}</style>
      
      {/* Main content area */}
      <div style={{
        flex: '1',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '30px',
        maxWidth: '70%'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginTop: 0, 
          color: '#1E90FF',
          marginBottom: '20px'
        }}>
          Canvas Render
        </h2>
        
        {/* Control buttons */}
        <div className="button-container" style={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button 
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#1E90FF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              minWidth: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }} 
            onClick={handlePrint}
            disabled={isRendering}
          >
            <PrintIcon style={{ fontSize: '20px' }} />
            Print Canvas
          </button>
          
          <button 
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              minWidth: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }} 
            onClick={handleDownload}
            disabled={isRendering}
          >
            <DownloadIcon style={{ fontSize: '20px' }} />
            Download as Image
          </button>

          <button 
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              minWidth: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }} 
            onClick={saveRenderedImage}
            disabled={isRendering || !renderedImage}
          >
            <SaveIcon style={{ fontSize: '20px' }} />
            Save to Library
          </button>
          
          <button 
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              minWidth: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }} 
            onClick={handleBack}
          >
            <ArrowBackIcon style={{ fontSize: '20px' }} />
            Return to Editor
          </button>
        </div>

        {/* Loading indicator */}
        {isRendering && (
          <div style={{ 
            textAlign: 'center', 
            margin: '20px 0', 
            color: '#666' 
          }}>
            Processing canvas... This may take a moment
          </div>
        )}
        
        {/* Rendered image preview */}
        {renderedImage ? (
          <div id="printArea" style={{ 
            textAlign: 'center',
            marginBottom: '20px',
            border: '1px solid #ddd',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px'
          }}>
            <img 
              src={renderedImage} 
              alt="Canvas Preview" 
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
              }} 
            />
          </div>
        ) : (
          <div>
            {isRendering ? (
              <div style={{
                height: '200px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px dashed #ccc',
                borderRadius: '4px',
                color: '#999'
              }}>
                Rendering canvas...
              </div>
            ) : (
              // Fallback direct display of images if canvas rendering fails
              <div id="fallbackPrintArea" style={{
                position: 'relative',
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                margin: '0 auto',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                {savedImages.map((image, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      position: 'absolute', 
                      left: `${image.canvas.x - (image.sizeParts.width / 2)}px`, 
                      top: `${image.canvas.y - (image.sizeParts.height / 2)}px` 
                    }}
                  >
                    <img
                      src={getProxiedImageUrl(image.image_nbg || image.url)}
                      alt={`Generated Content ${index}`}
                      style={{
                        width: `${image.sizeParts.width}px`,
                        height: `${image.sizeParts.height}px`,
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Library Side Panel */}
      <div style={{
        width: '30%',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '15px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}>
        <h3 style={{ 
          marginTop: 0, 
          color: '#1E90FF',
          textAlign: 'center',
          marginBottom: '15px',
          fontSize: '1.2em'
        }}>Saved Renders Library</h3>
        
        {savedRenders.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No saved renders yet. Save your current render to add it to the library.</p>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {savedRenders.map(render => (
              <div key={render.id} style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <img 
                    src={render.imageUrl} 
                    alt={render.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      border: '1px solid #eee'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      margin: '0 0 4px 0',
                      fontWeight: 'bold',
                      fontSize: '0.9em'
                    }}>{render.name}</p>
                    <p style={{ 
                      margin: '0',
                      fontSize: '0.75em',
                      color: '#666'
                    }}>
                      {new Date(render.timestamp).toLocaleString()}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      marginTop: '6px'
                    }}>
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.8em'
                        }}
                        onClick={() => downloadSavedRender(render.imageUrl, render.name)}
                      >
                        Download
                      </button>
                      <button
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '0.8em'
                        }}
                        onClick={() => deleteSavedRender(render.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Original printable area (hidden, only for reference) */}
      <div 
        id="printablearea" 
        ref={canvasRef} 
        style={{ display: 'none' }}
      >
        {savedImages.map((image, index) => (
          <div 
            key={index} 
            style={{ 
              position: 'absolute', 
              left: `${image.canvas.x - (image.sizeParts.width / 2)}px`, 
              top: `${image.canvas.y - (image.sizeParts.height / 2)}px` 
            }}
          >
            <img
              src={image.image_nbg || image.url}
              alt={`Generated Content ${index}`}
              style={{
                width: `${image.sizeParts.width}px`,
                height: `${image.sizeParts.height}px`,
              }}
              crossOrigin="anonymous"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
