import React from 'react';

const Instructions = () => {

  return (
    <div className='assetGeneration'>
      <h2 class="header" style={{paddingTop: '2rem'}}>Instructions</h2>
      <div className='pageheader'>
            <h3>Step1 |  Generate an Image with Text</h3>
            <br/>
            <p>
            Give a Text or Speech Description of the Image you want to generate and press the Generate Image Button to Generate the Image. <br/>
            Click on the "Create Asset from Image" button to extract assets from the image. <br/>
            Click on the "Generate Description" button to generate a description of the selected image.
            </p>
      </div>

      <div className='pageheader'>
            <h3>Step2 |  Generate Assets from Image</h3>
            <br/>
            <p>
            Press the Detect Image button to extract the assets from the image <br/>
            Select the assets you want to save. <br/>
            Click on the "Go to Canvas" button to start editing your image with the assets.
            </p>
      </div>

    <div className='pageheader'>
      <h3>Step3 |  Create the Final Image with Assets </h3>
      <br/>
      <p>
      Click on the asset you would like to use from the asset library. <br/>
      Move the asset around the canvas. <br/>
      Press save canvas to get the final image
      </p>
    </div>
    </div>
  );
};

export default Instructions;
