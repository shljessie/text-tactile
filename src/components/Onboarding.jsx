import './Onboarding.css';

import * as Tone from 'tone';

import React, { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [canvasSize, setCanvasSize] = useState({
    width:  roundToNearest100(window.innerWidth * 0.35)+ 100,
    height: roundToNearest100(window.innerWidth * 0.35)+ 100,
  });

  function roundToNearest100(x) {
    return Math.round(x / 100) * 100;
  }

  const navigate = useNavigate();

  const handleButtonClick = () => {
    // speakMessage(`Welcome to Alt Canvas, an image editor for BVI users! In AltCanvas, you create images one by one using tiles. Relative locations of images on the tiles reflect the relative locations of the canvas. The size of the canvas is ${canvasSize.width} width and ${canvasSize.height} height. You are currently focused on the 1st tile. Press Enter to Create the 1st Image and tell the system what you want to make after the beep.`)
    navigate('/sonic');
  };

  const leftrighturl = "https://storage.googleapis.com/altcanvas-storage/leftright.mp3";
  const downurl ="https://storage.googleapis.com/altcanvas-storage/down.mp3";
  const upurl="https://storage.googleapis.com/altcanvas-storage/up.mp3";

  const playerLRRef = useRef(null);
  const playerURef = useRef(null);
  const playerDRef = useRef(null);

  const playerLR = new Tone.Player().toDestination();
  playerLR.load(leftrighturl).then(() => {
      playerLRRef.current = playerLR;
  });

  const playerD = new Tone.Player().toDestination();
  playerD.load(downurl).then(() => {
      playerDRef.current = playerD;
  });

  const playerU = new Tone.Player().toDestination();
  playerU.load(upurl).then(() => {
      playerURef.current = playerU;
  });

  const playSpatialSound = (direction) => {
    if (!playerLRRef.current) return;

    
    
    const panner = new Tone.Panner3D({
      positionX: direction === 'left' ? -10 : direction === 'right' ? 10 : 0,
      positionY: direction === 'up' ? 10 : direction === 'down' ? -10 : 0,
      positionZ: -1,
    }).toDestination();

    if (direction === 'left' || direction === 'right') { 
      console.log('playing lr')
      playerLRRef.current.disconnect();
      playerLRRef.current.chain(panner, Tone.Destination);      
      playerLRRef.current.start();
      
    } else if (direction === 'up') {
      console.log('playing up')
      playerURef.current.disconnect();
      playerURef.current.chain(panner, Tone.Destination);
      playerURef.current.start();

    } else {
      console.log('playing down')
      playerDRef.current.disconnect();
      playerDRef.current.chain(panner, Tone.Destination);
      playerDRef.current.start();

    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript((prev) => prev + event.results[i][0].transcript);
          }
        }
      };
      setRecognition(recognitionInstance);
    } else {
      console.log("Speech Recognition not supported in this browser.");
    }
  }, []);

  const startRecording = () => {
    if (recognition) {
      recognition.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
      if (transcript !== '') {
        const utterance = new SpeechSynthesisUtterance(`Recorded message: ${transcript}`);
        window.speechSynthesis.speak(utterance);
      } else {
        const utterance = new SpeechSynthesisUtterance("No message was recorded.");
        window.speechSynthesis.speak(utterance);
      }
    }
  };
  
  return (
    <div className="onboarding-container"  aria-labelledby="mainHeader" style={{ padding: '2rem', margin:'auto', marginTop:'2rem', textAlign: 'start',  boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' }}>
  
    <header className='header'>
        <h3 id="mainHeader"  aria-label="AltCanvas Study Onboarding"  style={{fontSize: '1.5rem',  margin: '2rem',   marginLeft: '1rem'}}> <b> </b> ALT CANVAS </h3>
    </header>

    <main>

        <h2 aria-labelledby="Onboarding System Check">Onboarding System Check</h2>
        <p aria-labelledby="Go through the 2 sections below to make sure the system audio and recording work">Go through the 2 sections below to make sure the system audio and recording work.</p>
        
      <section className="spatial-sound-test" aria-labelledby="sound Test section">
        <h3 aria-labelledby="sound Test section">Section 1 : Test Spatial Sound</h3>
        <p>Press the buttons below to test spatial sounds.</p>
        <div aria-labelledby="soundTestButtons">
          <button aria-label="Left Sound" onClick={() => playSpatialSound('left')}>Left</button>
          <button aria-label="Right Sound" onClick={() => playSpatialSound('right')}>Right</button>
          <button aria-label="Top Sound" onClick={() => playSpatialSound('up')}>Top</button>
          <button aria-label="Bottom Sound" onClick={() => playSpatialSound('down')}>Bottom</button>
        </div>
      </section>

      <section className="audio-recording-test" aria-labelledby="speech Test section">
        <h3 aria-labelledby="speech Test section"> Section 2 : Test Audio Recording and System Speech</h3>
        <p>Click the button below to start audio recording. Speak any prompt then press the same button again to stop. You can read the text below to confirm that the system has understood you or hear the computer speaking.</p>
        {isRecording ? (
          <button aria-label="Stop recording" onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button aria-label="Start recording" onClick={startRecording}>Start Recording</button>
        )}
        <p aria-live="assertive">Recorded Message as Text: {transcript}</p>
      </section>

      <section className="screen-reader-check" aria-labelledby="screenReaderCheckHeader">
        <h3 id="screenReaderCheckHeader" aria-labelledby="screen reader section">Screen Reader Check</h3>
        <p>After pressing the start study button below, please turn off your screen reader.</p>
      </section>

      <button id="startStudyButton" aria-label="Click on this button to start the study and proceed to the main page" onClick={handleButtonClick}>Start Study</button>

      </main>
    </div>
  );
};

export default Onboarding;
