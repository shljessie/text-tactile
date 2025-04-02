import './Onboarding.css';

import * as Tone from 'tone';

import React, { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

function roundToNearest100(x) {
  return Math.round(x / 100) * 100;
}

const Onboarding = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [canvasSize, setCanvasSize] = useState({
    width: roundToNearest100(window.innerWidth * 0.35) + 100,
    height: roundToNearest100(window.innerWidth * 0.35) + 100,
  });

  // New settings states
  const [graphicsMode, setGraphicsMode] = useState("color");
  const [speechSpeed, setSpeechSpeed] = useState(0.9);

  const navigate = useNavigate();

  const handleStartStudy = () => {
    // Save the settings so that SonicTiles can later retrieve them
    localStorage.setItem("graphicsMode", graphicsMode);
    localStorage.setItem("speechSpeed", speechSpeed);
    navigate('/sonic');
  };

  const leftrighturl = "https://storage.googleapis.com/altcanvas-storage/leftright.mp3";
  const downurl = "https://storage.googleapis.com/altcanvas-storage/down.mp3";
  const upurl = "https://storage.googleapis.com/altcanvas-storage/up.mp3";

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
      playerLRRef.current.disconnect();
      playerLRRef.current.chain(panner, Tone.Destination);
      playerLRRef.current.start();
    } else if (direction === 'up') {
      playerURef.current.disconnect();
      playerURef.current.chain(panner, Tone.Destination);
      playerURef.current.start();
    } else {
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
      const utterance = new SpeechSynthesisUtterance(
        transcript !== ''
          ? `Recorded message: ${transcript}`
          : "No message was recorded."
      );
      window.speechSynthesis.speak(utterance);
    }
  };

  // New functions for settings
  const handleTactileMode = () => {
    setGraphicsMode("tactile");
    console.log("Tactile Graphics Mode selected");
  };

  const handleColorMode = () => {
    setGraphicsMode("color");
    console.log("Color Graphics Mode selected");
  };

  const speakImmediate = (message, rate = 1) => {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  const handleIncreaseSpeechSpeed = () => {
    setSpeechSpeed((prevSpeed) => {
      // Increase by 0.2 and round to one decimal
      const newSpeed = parseFloat((Math.min(prevSpeed + 0.2, 2.0)).toFixed(1));
      speakImmediate(`Speech speed increased to ${newSpeed}`, newSpeed);
      return newSpeed;
    });
  };
  
  const handleDecreaseSpeechSpeed = () => {
    setSpeechSpeed((prevSpeed) => {
      // Decrease by 0.2 and round to one decimal
      const newSpeed = parseFloat((Math.max(prevSpeed - 0.2, 0.5)).toFixed(1));
      speakImmediate(`Speech speed decreased to ${newSpeed}`, newSpeed);
      return newSpeed;
    });
  };

  // Add a useEffect to enable ESC to cancel any ongoing speech
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        window.speechSynthesis.cancel();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);
  
  return (
    <div
      className="onboarding-container"
      aria-labelledby="mainHeader"
      style={{
        padding: '2rem',
        margin: 'auto',
        marginTop: '2rem',
        textAlign: 'start',
        boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
      }}
    >
      <header className="header">
        <h3
          id="mainHeader"
          aria-label="AltCanvas Study Onboarding"
          style={{ fontSize: '1.5rem', margin: '2rem', marginLeft: '1rem' }}
        >
          <b>ALT CANVAS</b>
        </h3>
      </header>

      <main>
        <h2 aria-labelledby="Onboarding System Check">Onboarding System Check</h2>
        <p aria-labelledby="Go through the 2 sections below to make sure the system audio and recording work">
          Go through the 2 sections below to make sure the system audio and recording work.
        </p>

        <section className="spatial-sound-test" aria-labelledby="sound Test section">
          <h3 aria-labelledby="sound Test section">Section 1 : Test Spatial Sound</h3>
          <p>Press the buttons below to test spatial sounds.</p>
          <div aria-labelledby="soundTestButtons">
            <button aria-label="Left Sound" onClick={() => playSpatialSound('left')}>
              Left
            </button>
            <button aria-label="Right Sound" onClick={() => playSpatialSound('right')}>
              Right
            </button>
            <button aria-label="Top Sound" onClick={() => playSpatialSound('up')}>
              Top
            </button>
            <button aria-label="Bottom Sound" onClick={() => playSpatialSound('down')}>
              Bottom
            </button>
          </div>
        </section>

        <section className="audio-recording-test" aria-labelledby="speech Test section">
          <h3 aria-labelledby="speech Test section">
            Section 2 : Test Audio Recording and System Speech
          </h3>
          <p>
            Click the button below to start audio recording. Speak any prompt then press the same button again to stop. You can read the text below to confirm that the system has understood you or hear the computer speaking.
          </p>
          {isRecording ? (
            <button aria-label="Stop recording" onClick={stopRecording}>
              Stop Recording
            </button>
          ) : (
            <button aria-label="Start recording" onClick={startRecording}>
              Start Recording
            </button>
          )}
          <p aria-live="assertive">Recorded Message as Text: {transcript}</p>
        </section>

        {/* New System Settings Section */}
        <section className="system-settings" aria-labelledby="systemSettingsHeader">
          <h3 id="systemSettingsHeader">System Settings</h3>
          <div>
            <h4>Image Style:</h4>
            <button
              style={{ marginRight: '1rem' }}
              onClick={handleTactileMode}
              aria-label="Select Tactile Graphics Mode"
            >
              Tactile Graphic
            </button>
            <button onClick={handleColorMode} aria-label="Select Color Graphics Mode">
              Color Graphic
            </button>
            <p>Current Mode: {graphicsMode}</p>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <h4>Speech Speed (Max 2, Min 0.5, 0.2 intervals):</h4>
            <button
              style={{ marginRight: '1rem' }}
              onClick={handleIncreaseSpeechSpeed}
              aria-label="Increase Speech Speed"
            >
              + Increase Speed 0.2
            </button>
            <button onClick={handleDecreaseSpeechSpeed} aria-label="Decrease Speech Speed">
              - Decrease Speed 0.2
            </button>
            <p>Current Speed: {speechSpeed}</p>
          </div>
        </section>

        <section className="screen-reader-check" aria-labelledby="screenReaderCheckHeader">
          <h3 id="screenReaderCheckHeader" aria-labelledby="screen reader section">
            Screen Reader Check
          </h3>
          <p>After pressing the start study button below, please turn off your screen reader.</p>
        </section>

        <button
          id="startStudyButton"
          aria-label="Click on this button to start the study and proceed to the main page"
          onClick={handleStartStudy}
        >
          Start Study
        </button>
      </main>
    </div>
  );
};

export default Onboarding;
