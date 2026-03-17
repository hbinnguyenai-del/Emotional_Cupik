import { useEffect, useRef, useState } from 'react';

export function useAudioAnalyzer() {
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState({ volume: 0, bass: 0, mid: 0, treble: 0 });
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);

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
      
      setIsListening(true);
      
      const update = () => {
        if (analyzerRef.current && dataArrayRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
          
          let sum = 0;
          let bassSum = 0;
          let midSum = 0;
          let trebleSum = 0;

          const bassEnd = Math.floor(bufferLength * 0.1);
          const midEnd = Math.floor(bufferLength * 0.5);

          for (let i = 0; i < bufferLength; i++) {
            const val = dataArrayRef.current[i];
            sum += val;
            if (i < bassEnd) bassSum += val;
            else if (i < midEnd) midSum += val;
            else trebleSum += val;
          }
          
          setAudioData({
            volume: sum / bufferLength,
            bass: bassSum / bassEnd,
            mid: midSum / (midEnd - bassEnd),
            treble: trebleSum / (bufferLength - midEnd)
          });
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
