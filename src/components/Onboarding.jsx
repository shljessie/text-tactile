import './Onboarding.css';

import * as Tone from 'tone';

import React, { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [recognition, setRecognition] = useState(null);

  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/sonic');
  };

  const leftrighturl = "https://texttactile.s3.amazonaws.com/leftright.mp3";
  const downurl ="https://texttactile.s3.amazonaws.com/down.mp3";
  const upurl="https://texttactile.s3.amazonaws.com/up.mp3";

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
    <div className="onboarding-container" style={{ paddingTop: '2rem', textAlign: 'start' }}>
    <div className='header'>
        <h3 id="mainHeader"  aria-label="SonicTiles Study Onboarding"  style={{fontSize: '1.5rem',  margin: '2rem',   marginLeft: '1rem'}}> <b> </b> ALT CANVAS </h3>
    </div>


      <div>
        <h2>Onboarding System Check</h2>
        <p>Go through the sections below to make sure the system audio and recording work.</p>
      </div>
      <div className="spatial-sound-test">
        <h3>Test Spatial Sound</h3>
        <p>Press the buttons below to test spatial sounds.</p>
        <button aria-label="Test sound from the left" onClick={() => playSpatialSound('left')}>Left</button>
        <button aria-label="Test sound from the right" onClick={() => playSpatialSound('right')}>Right</button>
        <button aria-label="Test sound from the top" onClick={() => playSpatialSound('up')}>Top</button>
        <button aria-label="Test sound from the bottom" onClick={() => playSpatialSound('down')}>Bottom</button>
      </div>

      <div className="audio-recording-test">
        <h3>Test Audio Recording and System Speech</h3>
        <p>Click the button below to start or stop audio recording.</p>
        {isRecording ? (
          <button aria-label="Stop recording" onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button aria-label="Start recording" onClick={startRecording}>Start Recording</button>
        )}
        <p>Recorded Message as Text: {transcript}</p>
      </div>

      <div className="screen-reader-check">
        <h3>Screen Reader Check</h3>
        <p>After pressing the start study button, please turn off your screen reader.</p>
      </div>

      <button id="startStudyButton" aria-label="Start the study and proceed to the main page" onClick={handleButtonClick}>Start Study</button>
    </div>
  );
};

export default Onboarding;
