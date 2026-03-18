import { useEffect, useRef, useState } from 'react';

export interface AudioFeatures {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  bpm: number;
  energy: number;
  brightness: number;
  beat_detected: boolean;
  beat_strength: number;
  spectral_flux: number;
}

export function useAudioAnalyzer() {
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<AudioFeatures>({ 
    volume: 0, bass: 0, mid: 0, treble: 0,
    bpm: 120, energy: 0, brightness: 0,
    beat_detected: false, beat_strength: 0, spectral_flux: 0
  });
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const prevDataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);

  // Beat detection state
  const lastBeatTimeRef = useRef<number>(0);
  const beatThresholdRef = useRef<number>(150);
  const bpmRef = useRef<number>(120);
  const beatHistoryRef = useRef<number[]>([]);

  const startListening = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 512;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyzerRef.current);
      
      const bufferLength = analyzerRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      prevDataArrayRef.current = new Uint8Array(bufferLength);
      
      setIsListening(true);
      
      const update = () => {
        if (analyzerRef.current && dataArrayRef.current && prevDataArrayRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
          
          let sum = 0;
          let bassSum = 0;
          let midSum = 0;
          let trebleSum = 0;
          let flux = 0;

          const bassEnd = Math.floor(bufferLength * 0.1);
          const midEnd = Math.floor(bufferLength * 0.5);

          for (let i = 0; i < bufferLength; i++) {
            const val = dataArrayRef.current[i];
            const prevVal = prevDataArrayRef.current[i];
            
            sum += val;
            if (i < bassEnd) bassSum += val;
            else if (i < midEnd) midSum += val;
            else trebleSum += val;

            flux += Math.max(0, val - prevVal);
          }

          const volume = sum / bufferLength;
          const bass = bassSum / bassEnd;
          const energy = volume / 255;
          const brightness = trebleSum / (bufferLength - midEnd) / 255;

          // Simple Beat Detection
          const now = Date.now();
          let beatDetected = false;
          let beatStrength = 0;

          if (bass > beatThresholdRef.current && now - lastBeatTimeRef.current > 300) {
            beatDetected = true;
            beatStrength = (bass - beatThresholdRef.current) / (255 - beatThresholdRef.current);
            
            // BPM Estimation
            const interval = now - lastBeatTimeRef.current;
            if (interval > 300 && interval < 2000) {
              beatHistoryRef.current.push(60000 / interval);
              if (beatHistoryRef.current.length > 10) beatHistoryRef.current.shift();
              bpmRef.current = beatHistoryRef.current.reduce((a, b) => a + b, 0) / beatHistoryRef.current.length;
            }
            
            lastBeatTimeRef.current = now;
            // Adaptive threshold
            beatThresholdRef.current = bass * 0.9;
          } else {
            // Threshold decay
            beatThresholdRef.current = Math.max(100, beatThresholdRef.current * 0.995);
          }
          
          setAudioData({
            volume,
            bass,
            mid: midSum / (midEnd - bassEnd),
            treble: trebleSum / (bufferLength - midEnd),
            bpm: bpmRef.current,
            energy,
            brightness,
            beat_detected: beatDetected,
            beat_strength: beatStrength,
            spectral_flux: flux / bufferLength / 255
          });

          prevDataArrayRef.current.set(dataArrayRef.current);
        }
        requestRef.current = requestAnimationFrame(update);
      };
      
      update();
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setError('Microphone permission denied. Please allow microphone access.');
      } else {
        setError('Error accessing microphone: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const stopListening = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setAudioData({ volume: 0, bass: 0, mid: 0, treble: 0 });
    setError(null);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return { isListening, audioData, startListening, stopListening, error };
}
