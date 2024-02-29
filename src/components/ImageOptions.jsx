import React, { useState } from 'react';

const ImageOptions = ({ text, image ,onEditPosition, onEditSize}) => {
  const [showOptions, setShowOptions] = useState(false);

  const toggleOptions = () => {
    setShowOptions(prevState => !prevState);
  };

  console.log('PASSED IMAGE', image)

    // Debugging: Log to ensure the function is received as a prop
    console.log('onEditPosition function:', onEditPosition);

    const handleEditPositionClick = () => {
      console.log('Edit Position button clicked');
      if (typeof onEditPosition === 'function') {
        onEditPosition();
      } else {
        console.error('onEditPosition is not a function. Please check the passed prop.');
      }
    };

    const handleEditSizeClick = () => {
      console.log('Edit Size button clicked');
      if (typeof onEditSize === 'function') {
        onEditSize();
      } else {
        console.error('onEditSize is not a function. Please check the passed prop.');
      }
    };

  return (
    <div style={{ display: 'inline-block' }}>

        <div>
        <button onClick={handleEditSizeClick}>Edit Size</button>
          <button onClick={handleEditPositionClick}>Edit Position</button>
          <button>Hear Size</button>
          <button>Hear Position</button>
          <button>Hear Description</button>
          <button>Bar Mode</button>
          <button>Nearby Objects</button>
          <button>Change Appearance</button>
        </div>
    </div>
  );
};

export default ImageOptions;
