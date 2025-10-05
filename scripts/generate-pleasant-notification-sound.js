/**
 * Generate a pleasant notification sound to replace the harsh beeps
 * This creates a much better sounding chime for the pizzalab notification system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a pleasant chime sound using Web Audio API concepts
function generatePleasantChime() {
  // Sample rate and duration
  const sampleRate = 44100;
  const duration = 2.0; // 2 seconds
  const numSamples = Math.floor(sampleRate * duration);
  
  // Create audio buffer
  const audioBuffer = new Float32Array(numSamples);
  
  // Pleasant chime frequencies (C major chord)
  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
  const volumes = [0.3, 0.2, 0.15]; // Decreasing volumes for harmonics
  
  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate;
    let sample = 0;
    
    // Generate each frequency component
    frequencies.forEach((freq, index) => {
      const volume = volumes[index];
      const envelope = Math.exp(-time * 2); // Exponential decay
      const wave = Math.sin(2 * Math.PI * freq * time);
      sample += volume * envelope * wave;
    });
    
    // Add subtle reverb effect
    if (i > 4410) { // 0.1 second delay
      sample += 0.1 * audioBuffer[i - 4410];
    }
    
    audioBuffer[i] = sample;
  }
  
  return audioBuffer;
}

// Convert Float32Array to WAV format
function createWAVFile(audioBuffer, sampleRate) {
  const length = audioBuffer.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioBuffer[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return Buffer.from(arrayBuffer);
}

// Generate the pleasant chime
console.log('🎵 Generating pleasant notification chime...');
const audioBuffer = generatePleasantChime();
const wavBuffer = createWAVFile(audioBuffer, 44100);

// Save to public directory
const outputPath = path.join(__dirname, '..', 'public', 'notification-sound.mp3');
const wavPath = path.join(__dirname, '..', 'public', 'notification-sound.wav');

// Save as WAV first
fs.writeFileSync(wavPath, wavBuffer);
console.log('✅ Pleasant notification sound saved as WAV:', wavPath);

// Note: For MP3 conversion, you would typically use ffmpeg or similar
// For now, we'll use the WAV file and update the code to reference it
console.log('🎵 Pleasant notification sound generated successfully!');
console.log('📝 The notification system will now use this pleasant chime instead of harsh beeps.');
