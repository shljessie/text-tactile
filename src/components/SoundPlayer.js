import * as Tone from 'tone';

import React, { useState } from 'react';

const SoundPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const playSound = async () => {
    // Ensure audio context is resumed (necessary for browsers that
    // require user interaction before playing sound)
    await Tone.start();
    console.log('Audio context is ready');

    // Create an oscillator and connect it to the main output
    const oscillator = new Tone.Oscillator({
      type: 'sine', // 'sine', 'square', 'triangle', or 'sawtooth'
      frequency: 440, // Frequency in Hz
    }).toDestination();

    if (!isPlaying) {
      oscillator.start();
      setIsPlaying(true);

      // Stop the oscillator after 2 seconds
      setTimeout(() => {
        oscillator.stop();
        setIsPlaying(false);
      }, 2000);
    }
  };

  return (
    <div>
      <button onClick={playSound}>
        {isPlaying ? 'Playing...' : 'Play Tone'}
      </button>
    </div>
  );
};

export default SoundPlayer;
