import * as Tone from 'tone';

import React from 'react';

const TestSoundButtons = () => {
  const playSound = async (direction, size) => {
    await Tone.start(); // Ensure Tone.js is started

    const synth = new Tone.Synth().toDestination();
    const panner = new Tone.Panner3D().toDestination();
    const volume = new Tone.Volume().toDestination();
    synth.chain(panner, volume, Tone.Destination);

    // Set panner position based on direction
    switch (direction) {
      case 'right':
        panner.positionX.value = 1;
        break;
      case 'left':
        panner.positionX.value = -1;
        break;
      case 'top':
        panner.positionY.value = 1;
        break;
      case 'bottom':
        panner.positionY.value = -1;
        break;
      case 'center':
        panner.positionX.value = 0;
        panner.positionY.value = 0;
        break;
      default:
        // No spatial effect
    }

    // Adjust sound based on size
    switch (size) {
      case 'big':
        volume.volume.value = 6;
        synth.oscillator.type = 'sawtooth';
        break;
      case 'medium':
        volume.volume.value = 0;
        synth.oscillator.type = 'triangle';
        break;
      case 'small':
        volume.volume.value = -12;
        synth.oscillator.type = 'sine';
        break;
      default:
        // Default sound settings
    }

    synth.triggerAttackRelease("C4", "1s");
  };

  return (
    <div>
      <h2 class="header">Test Sound Buttons</h2>
      {/* Direction Buttons */}
      <button style={{ padding :'0.5rem', fontWeight:'800' }} onClick={() => playSound('left', '')}>Play Left Sound</button>
      <button style={{ padding :'0.5rem', fontWeight:'800' }} onClick={() => playSound('right', '')}>Play Right Sound</button>
      <button style={{ padding :'0.5rem', fontWeight:'800' }} onClick={() => playSound('top', '')}>Play Top Sound</button>
      <button style={{ padding :'0.5rem', fontWeight:'800' }} onClick={() => playSound('bottom', '')}>Play Bottom Sound</button>
      {/* Size Buttons */}
      <button style={{ padding :'0.5rem', fontWeight:'800' }} onClick={() => playSound('', 'big')}>Play Big Sound</button>
      <button onClick={() => playSound('', 'medium')}>Play Medium Sound</button>
      <button onClick={() => playSound('', 'small')}>Play Small Sound</button>
    </div>
  );
};

export default TestSoundButtons;
