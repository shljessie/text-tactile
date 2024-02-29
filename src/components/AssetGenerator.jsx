import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useSelectedAssets } from './SelectedAssetContext';

const AssetGenerator = () => {
  const location = useLocation(); 
  const navigate = useNavigate();
  const [imageURL, setImageURL] = useState(location.state?.imageURL);
  const [outputImageURL, setOutputImageURL] = useState('');
  const [detectedClassNames, setdetectedClassNames] = useState([]);
  const [assets, setAssets] = useState([]);
  const { selectedAssets, setSelectedAssets } = useSelectedAssets();
  // Add a state for the header text
  const [headerText, setHeaderText] = useState('Asset Generator'); // Set your default header text here

  console.log(assets);
  console.log('Selected Asset', selectedAssets);

  const handleSelectAsset = (assetUrl) => {
    setSelectedAssets((prevSelectedAssets) =>
      prevSelectedAssets.includes(assetUrl)
        ? prevSelectedAssets.filter((asset) => asset !== assetUrl)
        : [...prevSelectedAssets, assetUrl]
    );
  };

  const removeAsset = (assetToRemove) => {
    setSelectedAssets(selectedAssets.filter(asset => asset !== assetToRemove));
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (!imageURL) {
    return <p>No image URL provided.</p>;
  }

  const goToCanvas = () => navigate('/canvas');

  const handleDetectImage = async () => {
    console.log(imageURL);
    try {
      const response = await fetch('http://127.0.0.1:5000/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: imageURL }),
      });
      const data = await response.json();
      console.log(data);
      if (data.outputFile) {
        setOutputImageURL(data.outputFile);
        setdetectedClassNames(data.detectedClassNames);
        setAssets(data.detectedAssets);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className='assetGeneration'>
    
      <div className='pageheader'>
            <h3>Step2 |  Generate Assets from Image</h3>
            <br/>
            <p>
            Press the Detect Image button to extract the assets from the image <br/>
            Select the assets you want to save. <br/>
            Click on the "Go to Canvas" button to start editing your image with the assets.
            </p>
      </div>


      <h2>{headerText}</h2>

      

      <div className='mainContainer' style={{ display: 'flex', flexDirection: 'row' }}>

        {/* Adjusted Asset Library to stick to the side */}
        <div className='assetLibrary' style={{ width: '20%', flexDirection: 'column', marginRight: '20px', backgroundColor:'aliceblue',padding:'2rem' }}>
        <h4>Asset Library</h4>
        <ul style={{listStyle: 'none', padding: 0 }}>
          {selectedAssets.map((assetUrl, index) => (
            <li key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '10px', marginBottom: '10px' }}>
              <img src={`http://127.0.0.1:5000${assetUrl}`} alt={`Selected Asset ${index}`} style={{ width: '100px' }} />
              <button onClick={() => removeAsset(assetUrl)}>Remove</button>
            </li>
          ))}
        </ul>
        <button onClick={() => setSelectedAssets([...selectedAssets])}>Save Asset Library</button>
      </div>

      <div className="assetFinder" style={{ width: '80%',}}>
          <div>
            <div style={{ display: 'flex',justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ marginRight: '5%'}}>
                <h4>Original Image</h4>
                <img src={imageURL} alt="Selected" style={{ width:'400px' , marginRight: '10%'}} />
              </div>

              {outputImageURL && (
                <div style={{}}>
                  <h4>Detected Image</h4>
                  <img src={`http://127.0.0.1:5000${outputImageURL}`} alt="Output" style={{width:'400px', marginRight: '10%'}} />
                </div>
              )}
            </div>
          </div>
      
          <div style={{ display: 'flex',justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={handleDetectImage}>Detect Assets</button>
          </div>
      

      

      <div className='detectedAssets' style={{ display:'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center' }}> 
        <div style={{ fontWeight: '600' }}>Detected Assets</div>
        <div style={{display: 'flex'}}>
          {assets.map((assetUrl, index) => {
            const fileName = assetUrl.split('/').pop();
            const isSelected = selectedAssets.includes(assetUrl);
            return (
              <div key={index} onClick={() => handleSelectAsset(assetUrl)} style={{ border: isSelected ? '2px solid blue' : 'none', cursor: 'pointer', marginBottom: '10px' , marginRight: '10px'}}>
                <img src={`http://127.0.0.1:5000${assetUrl}`} alt={fileName} style={{ width: '100px' }} />
                <p style={{fontSize: '0.3rem'}}>{fileName}</p>
              </div>
            );
          })}
          <div>
          </div>
        </div>
    </div>
      <div style={{alignItems: 'center', display:'flex', justifyContent: 'center', marginTop: '10%'}}>
        <button onClick={handleBackClick}>Go to Image Generator</button>
        <button onClick={goToCanvas}>Go to Canvas</button>
      </div>
          
    </div>
    


    </div>

    </div>
  );
};

export default AssetGenerator;
