/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Play, Pause, RotateCcw, Coffee, Brain, Timer, Smile, Zap, Moon, Frown, Flame, Music, Sparkles, Heart, Star, Droplet, Eye as EyeIcon, EyeOff as EyeOffIcon, Settings, X } from 'lucide-react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { analyzeAudioMood, AIMood } from './services/geminiService';

export default function App() {
  const { isListening, audioData, startListening, stopListening, error: micError } = useAudioAnalyzer();
  const [activeView, setActiveView] = useState<'face' | 'pomodoro'>('face');
  const [blink, setBlink] = useState(false);
  const [lookPos, setLookPos] = useState({ x: 0, y: 0 });
  const [personality, setPersonality] = useState<'auto' | 'happy' | 'sleepy' | 'angry' | 'sad' | 'ai'>('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiMood, setAiMood] = useState<AIMood | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const isAnalyzingRef = useRef(false);

  useEffect(() => {
    if (personality !== 'ai') {
      isAnalyzingRef.current = false;
      return;
    }

    isAnalyzingRef.current = true;
    let mediaRecorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;

    const runAnalysisLoop = async () => {
      while (isAnalyzingRef.current) {
        try {
          setIsAnalyzing(true);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          const audioChunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };

          const recordingPromise = new Promise<void>((resolve) => {
            if (!mediaRecorder) return resolve();
            mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                const base64data = (reader.result as string).split(',')[1];
                try {
                  const mood = await analyzeAudioMood(base64data, 'audio/webm');
                  if (isAnalyzingRef.current) {
                    setAiMood(mood);
                    setApiError(null);
                  }
                } catch (e: any) {
                  console.error('Error analyzing audio:', e);
                  const errStr = typeof e === 'string' ? e : JSON.stringify(e, Object.getOwnPropertyNames(e)) + (e.message || '');
                  if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
                    setApiError('Gemini API quota exceeded. AI analysis stopped.');
                    isAnalyzingRef.current = false;
                    setPersonality('auto');
                  } else {
                    setApiError('Error analyzing audio. Retrying...');
                  }
                } finally {
                  stream?.getTracks().forEach(track => track.stop());
                  resolve();
                }
              };
            };
          });

          mediaRecorder.start();
          await new Promise(r => setTimeout(r, 5000)); // Record 5 seconds
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
          await recordingPromise;
          
          // Wait a bit before next analysis
          await new Promise(r => setTimeout(r, 1000));
        } catch (error: any) {
          console.error('Error in continuous analysis:', error);
          const errStr = typeof error === 'string' ? error : JSON.stringify(error) + (error.message || '');
          if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
            setApiError('Microphone permission denied. AI analysis stopped.');
            isAnalyzingRef.current = false;
            setPersonality('auto');
            break;
          }
          await new Promise(r => setTimeout(r, 5000)); // Wait before retrying on error
        }
      }
      setIsAnalyzing(false);
    };

    runAnalysisLoop();

    return () => {
      isAnalyzingRef.current = false;
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsAnalyzing(false);
    };
  }, [personality]);

  // Blinking logic
  useEffect(() => {
    let blinkSpeed = 4000;
    if (personality === 'ai' && aiMood && aiMood.curiosity_behavior) {
      if (aiMood.curiosity_behavior.blink_variation === 'slow') blinkSpeed = 6000;
      else if (aiMood.curiosity_behavior.blink_variation === 'fast') blinkSpeed = 2000;
    }

    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        
        // Double blink
        if (Math.random() > 0.7) {
          setTimeout(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 150);
          }, 300);
        }
      }
    }, blinkSpeed);
    return () => clearInterval(blinkInterval);
  }, [personality, aiMood]);

  // Looking logic
  useEffect(() => {
    let speedMs = 2500;
    let hRange = 60;
    let vRange = 40;
    let sideGlanceProb = 0;
    let spontaneous = false;

    if (personality === 'ai' && aiMood) {
      if (aiMood.eye_motion) {
        if (aiMood.eye_motion.movement_speed === 'fast') speedMs = 800;
        else if (aiMood.eye_motion.movement_speed === 'slow') speedMs = 4000;
        else speedMs = 2000;

        hRange = (aiMood.eye_motion.horizontal_range / 100) * 120;
        vRange = (aiMood.eye_motion.vertical_range / 100) * 80;
      }
      if (aiMood.curiosity_behavior) {
        sideGlanceProb = aiMood.curiosity_behavior.side_glance_probability / 100;
        spontaneous = aiMood.curiosity_behavior.spontaneous_movement;
      }
    }

    const lookInterval = setInterval(() => {
      const rand = Math.random();
      if (rand < sideGlanceProb) {
        // Curious side glance
        setLookPos({
          x: Math.random() > 0.5 ? 100 : -100,
          y: (Math.random() - 0.5) * 20,
        });
      } else if (rand > 0.4 || spontaneous) {
        setLookPos({
          x: (Math.random() - 0.5) * hRange,
          y: (Math.random() - 0.5) * vRange,
        });
      } else {
        setLookPos({ x: 0, y: 0 });
      }
    }, speedMs);
    return () => clearInterval(lookInterval);
  }, [personality, aiMood]);

  // Emotion logic based on audio and personality
  let currentEmotion = 'neutral';
  if (personality === 'auto') {
    if (audioData.volume > 100) {
      currentEmotion = 'happy';
    } else if (audioData.volume > 0 && audioData.volume < 20) {
      currentEmotion = 'sleepy';
    } else {
      currentEmotion = 'neutral';
    }
  } else if (personality === 'ai' && aiMood) {
    // Map AI emotion to our base emotions or use a special ai mode
    currentEmotion = aiMood.robot_emotion.toLowerCase().includes('happy') || aiMood.robot_emotion.toLowerCase().includes('pop') ? 'happy' :
                     aiMood.robot_emotion.toLowerCase().includes('sad') ? 'sad' :
                     aiMood.robot_emotion.toLowerCase().includes('angry') ? 'angry' :
                     aiMood.robot_emotion.toLowerCase().includes('sleep') || aiMood.robot_emotion.toLowerCase().includes('chill') ? 'sleepy' : 'ai';
  } else {
    currentEmotion = personality;
  }

  // Calculate dynamic values based on audio
  let bassScale = 1 + (audioData.bass / 255) * 0.4;
  let jitterX = (audioData.treble > 150) ? (Math.random() - 0.5) * 10 : 0;
  let jitterY = (audioData.treble > 150) ? (Math.random() - 0.5) * 10 : 0;
  let isSurprised = false;

  if (personality === 'ai' && aiMood) {
    if (aiMood.eye_motion && aiMood.eye_motion.beat_sync && audioData.bass > 180) {
      const bounce = (aiMood.eye_motion.bounce_intensity / 100) * 40;
      jitterY += bounce;
      bassScale = 1 + (audioData.bass / 255) * 0.8;
    }
    if (aiMood.curiosity_behavior && aiMood.curiosity_behavior.surprise_reaction && audioData.bass > 220) {
      isSurprised = true;
    }
  }

  let eyeHeight = blink ? 0.05 : 1;
  
  if (personality === 'ai' && aiMood) {
    if (isSurprised) {
      eyeHeight = 1.3;
    } else {
      // Override with AI mood if available
      const opennessStr = aiMood.eye_animation.eye_openess;
      const opennessMatch = opennessStr.match(/(\d+)/);
      if (opennessMatch && !blink) {
        eyeHeight = parseInt(opennessMatch[1]) / 100;
      }
    }
  } else {
    if (currentEmotion === 'sleepy' && !blink) eyeHeight = 0.6;
    if (currentEmotion === 'happy' && !blink) eyeHeight = 1.1;
    if (currentEmotion === 'angry' && !blink) eyeHeight = 0.8;
    if (currentEmotion === 'sad' && !blink) eyeHeight = 0.9;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden selection:bg-transparent p-4">
      
      {/* Settings Toggle Button */}
      <button 
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-6 right-6 z-[100] p-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg"
        title="Settings"
      >
        {showSettings ? <X size={24} /> : <Settings size={24} />}
      </button>

      {/* Settings Menu Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-24 right-6 z-[90] w-72 bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col gap-6"
          >
            {/* View Toggle Section */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest px-2">View Mode</p>
              <button 
                onClick={() => setActiveView(v => v === 'face' ? 'pomodoro' : 'face')}
                className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5 group"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10">
                  {activeView === 'face' ? <Timer size={20} /> : <Smile size={20} />}
                </div>
                <span className="font-medium">{activeView === 'face' ? "Switch to Pomodoro" : "Switch to Face"}</span>
              </button>
            </div>

            {/* Mood Selector Section */}
            {activeView === 'face' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest px-2">Mood Personality</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['auto', 'happy', 'sleepy', 'angry', 'sad', 'ai'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPersonality(p)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border ${personality === p ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'}`}
                      title={p === 'ai' ? 'Analyze Music (AI)' : `Mood: ${p}`}
                    >
                      {p === 'auto' && <Zap size={20} />}
                      {p === 'happy' && <Smile size={20} />}
                      {p === 'sleepy' && <Moon size={20} />}
                      {p === 'angry' && <Flame size={20} />}
                      {p === 'sad' && <Frown size={20} />}
                      {p === 'ai' && <Music size={20} />}
                      <span className="text-[10px] mt-1 capitalize">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Visibility Section */}
            {activeView === 'face' && personality === 'ai' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest px-2">Display</p>
                <button 
                  onClick={() => setShowStatus(!showStatus)}
                  className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5 group"
                >
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10">
                    {showStatus ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                  </div>
                  <span className="font-medium">{showStatus ? "Hide Status Details" : "Show Status Details"}</span>
                </button>
              </div>
            )}

            {/* Audio Control Section */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest px-2">Audio Input</p>
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                  isListening 
                    ? 'bg-red-500/20 border-red-500/50 text-red-500' 
                    : 'bg-white/5 border-white/5 text-white hover:bg-white/10'
                }`}
              >
                <div className={`p-2 rounded-lg ${isListening ? 'bg-red-500/20' : 'bg-white/5'}`}>
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </div>
                <span className="font-medium">{isListening ? "Stop Listening" : "Start Listening"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      {(micError || apiError) && (
        <div className="absolute top-6 left-6 z-50 max-w-md bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-md shadow-lg flex flex-col gap-1">
          {micError && <p className="text-sm font-medium">{micError}</p>}
          {apiError && <p className="text-sm font-medium">{apiError}</p>}
        </div>
      )}

      {/* Pomodoro View */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center z-40 p-4"
        initial={false}
        animate={{ 
          opacity: activeView === 'pomodoro' ? 1 : 0,
          scale: activeView === 'pomodoro' ? 1 : 0.9,
          pointerEvents: activeView === 'pomodoro' ? 'auto' : 'none'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Pomodoro />
      </motion.div>

      {/* Face View */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center p-4 z-30"
        initial={false}
        animate={{ 
          opacity: activeView === 'face' ? 1 : 0,
          scale: activeView === 'face' ? 1 : 0.9,
          pointerEvents: activeView === 'face' ? 'auto' : 'none'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Display Panel (Above Head) */}
        <AnimatePresence>
          {personality === 'ai' && aiMood && aiMood.display_panel && showStatus && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              key={aiMood.display_panel.text}
              className="mb-8 bg-white/10 backdrop-blur-md border border-white/20 px-8 py-3 rounded-full text-center z-50 shadow-[0_0_30px_rgba(0,255,255,0.15)]"
            >
              <div className="flex items-center justify-center gap-2 text-white font-medium text-lg">
                <Music size={18} className="text-cyan-400" />
                {aiMood.display_panel.text}
              </div>
              {aiMood.music_identification?.song_title && aiMood.music_identification.song_title !== 'unknown' && (
                <div className="text-sm text-white/60 mt-1">
                  {aiMood.music_identification.artist} • {aiMood.music_identification.genre}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Robot Face Container */}
        <div className="relative w-full max-w-4xl aspect-[2.2/1] bg-[#111] rounded-[60px] md:rounded-[100px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center justify-center border-[8px] md:border-[16px] border-[#222] overflow-hidden">

          {/* Screen Glare/Reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-50" />

          {/* Blushes */}
          <Blush side="left" volume={audioData.volume} emotion={currentEmotion} />
          <Blush side="right" volume={audioData.volume} emotion={currentEmotion} />

          {/* Eyes */}
          <div className="flex items-center justify-center gap-16 md:gap-40 z-10 -translate-y-4 md:-translate-y-8">
            <Eye 
              side="left"
              scale={bassScale} 
              eyeHeight={eyeHeight} 
              lookPos={{ x: lookPos.x + jitterX, y: lookPos.y + jitterY }} 
              volume={audioData.volume}
              emotion={currentEmotion}
              aiMood={personality === 'ai' ? aiMood : null}
            />
            <Eye 
              side="right"
              scale={bassScale} 
              eyeHeight={eyeHeight} 
              lookPos={{ x: lookPos.x + jitterX, y: lookPos.y + jitterY }} 
              volume={audioData.volume}
              emotion={currentEmotion}
              aiMood={personality === 'ai' ? aiMood : null}
            />
          </div>

          {/* Mouth */}
          <Mouth volume={audioData.volume} emotion={currentEmotion} aiMood={personality === 'ai' ? aiMood : null} />
        </div>

        {/* AI Mood Description */}
        <AnimatePresence>
          {personality === 'ai' && aiMood && showStatus && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl text-center z-50 max-w-md"
            >
              <div className="flex items-center justify-center gap-2 text-cyan-300 font-semibold mb-1">
                <Sparkles size={16} />
                {aiMood.music_mood}
              </div>
              <p className="text-white/80 text-sm leading-tight mb-1">
                {aiMood.reaction_description}
              </p>
              {aiMood.head_reaction_style && (
                <p className="text-white/50 text-xs italic">
                  Style: {aiMood.head_reaction_style}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Eye({ scale, eyeHeight, lookPos, volume, emotion, side, aiMood }: { 
  scale: number, 
  eyeHeight: number, 
  lookPos: { x: number, y: number }, 
  volume: number,
  emotion: string,
  side: 'left' | 'right',
  aiMood: AIMood | null
}) {
  
  // Colors based on emotion
  let baseColor = '#0091ea';
  let lightColor = '#40c4ff';
  let rotate = 0;
  let glowIntensity = 20;
  let pupilScale = 1;
  let effectType = 'none';
  let pupilShape = 'round';
  let tearLevel = 0;
  let sparkleIntensity = 0;

  if (emotion === 'happy') {
    baseColor = '#00b8d4';
    lightColor = '#84ffff';
  } else if (emotion === 'sleepy') {
    baseColor = '#3949ab';
    lightColor = '#8c9eff';
  } else if (emotion === 'angry') {
    baseColor = '#d50000';
    lightColor = '#ff5252';
    rotate = side === 'left' ? 15 : -15;
  } else if (emotion === 'sad') {
    baseColor = '#1a237e';
    lightColor = '#5c6bc0';
    rotate = side === 'left' ? -15 : 15;
  } else if (emotion === 'ai' && aiMood) {
    if (aiMood.eye_color_behavior) {
      baseColor = aiMood.eye_color_behavior.base_color || '#00b8d4';
      lightColor = aiMood.eye_color_behavior.secondary_color || '#b2ebf2';
      glowIntensity = aiMood.eye_color_behavior.glow_intensity || 20;
      
      // Pulse glow with rhythm
      if (aiMood.eye_color_behavior.rhythm_color_pulse && volume > 150) {
        glowIntensity += (volume / 255) * 40;
      }
    }
    if (aiMood.curiosity_behavior) {
      pupilScale = 0.5 + (aiMood.curiosity_behavior.pupil_expand_amount / 100) * 1.5;
    }
    if (aiMood.eye_emotional_effect) {
      effectType = aiMood.eye_emotional_effect.effect_type;
      pupilShape = aiMood.eye_emotional_effect.pupil_shape;
      tearLevel = aiMood.eye_emotional_effect.tear_level;
      sparkleIntensity = aiMood.eye_emotional_effect.sparkle_intensity;
      
      if (aiMood.eye_emotional_effect.eyelid_position === 'half_closed') {
        eyeHeight = Math.min(eyeHeight, 0.6);
      } else if (aiMood.eye_emotional_effect.eyelid_position === 'relaxed') {
        eyeHeight = Math.min(eyeHeight, 0.85);
      }
    }
  }

  return (
    <motion.div 
      className="relative w-28 h-28 md:w-48 md:h-48 rounded-full overflow-hidden"
      animate={{
        scaleY: eyeHeight,
        scaleX: scale,
        x: lookPos.x,
        y: lookPos.y,
        rotate: rotate,
        boxShadow: `0 0 ${glowIntensity}px ${lightColor}40`
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Base dark blue (shadow) */}
      <motion.div 
        className="absolute inset-0 rounded-full"
        animate={{ backgroundColor: baseColor }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Light blue (main eye) */}
      <motion.div 
        className={`absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center ${pupilShape === 'round' ? 'rounded-full' : ''}`}
        animate={{
          backgroundColor: pupilShape === 'round' ? lightColor : 'transparent',
          x: -8 - (volume / 255) * 12,
          y: -8 - (volume / 255) * 12,
          scale: pupilScale
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          backgroundColor: { duration: 0.5 }
        }}
      >
        {pupilShape === 'heart' && (
          <Heart fill={lightColor} color={lightColor} className="w-[85%] h-[85%]" />
        )}
        {pupilShape === 'star' && (
          <Star fill={lightColor} color={lightColor} className="w-[85%] h-[85%]" />
        )}

        {/* Cute Anime Catchlights (Reflections) */}
        <motion.div 
          className="absolute top-[15%] right-[20%] w-[25%] h-[25%] bg-white rounded-full"
          animate={{ opacity: eyeHeight < 0.2 ? 0 : 0.9 }}
        />
        <motion.div 
          className="absolute top-[42%] right-[12%] w-[10%] h-[10%] bg-white rounded-full"
          animate={{ opacity: eyeHeight < 0.2 ? 0 : 0.7 }}
        />
        
        {/* Sparkles Effect */}
        {(effectType === 'sparkle' || sparkleIntensity > 0) && (
          <>
            <motion.div
              className="absolute top-[10%] left-[15%] text-white"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={16} />
            </motion.div>
            <motion.div
              className="absolute bottom-[20%] right-[25%] text-white"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <Sparkles size={12} />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Tears Effect */}
      {(effectType === 'watery' || effectType === 'tears' || tearLevel > 0) && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400/60 to-transparent"
          animate={{ 
            height: `${20 + (tearLevel / 100) * 30}%`,
            opacity: 0.5 + (tearLevel / 100) * 0.5
          }}
          transition={{ duration: 1 }}
        >
          {effectType === 'tears' && (
            <motion.div
              className="absolute bottom-2 right-4 text-blue-200"
              animate={{ y: [0, 10, 20], opacity: [1, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeIn" }}
            >
              <Droplet size={16} fill="currentColor" />
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function Mouth({ volume, emotion, aiMood }: { volume: number, emotion: string, aiMood: AIMood | null }) {
  const openAmount = Math.min(100, volume * 1.2);
  
  let width = 40;
  let height = 12;
  let borderRadius = "20px";
  let yOffset = 0;
  
  if (emotion === 'happy') {
    width = 60 + openAmount * 0.4;
    height = 30 + openAmount * 0.8;
    borderRadius = "10px 10px 60px 60px"; // Big happy smile
    yOffset = -5;
  } else if (emotion === 'sleepy') {
    width = 20 + openAmount * 0.2;
    height = 20 + openAmount * 0.2;
    borderRadius = "50%"; // Little sleepy 'o'
    yOffset = 5;
  } else if (emotion === 'angry') {
    width = 50 + openAmount * 0.3;
    height = 20 + openAmount * 0.5;
    borderRadius = "40px 40px 10px 10px"; // Frown
    yOffset = 10;
  } else if (emotion === 'sad') {
    width = 30 + openAmount * 0.2;
    height = 15 + openAmount * 0.4;
    borderRadius = "30px 30px 10px 10px"; // Small frown
    yOffset = 5;
  } else if (emotion === 'ai' && aiMood && aiMood.mouth_expression) {
    const expr = aiMood.mouth_expression;
    
    // Base width and height
    width = 40;
    height = 12;
    
    // Adjust based on expression type
    if (expr.expression_type === 'smile' || expr.expression_type === 'excited') {
      width = 50 + openAmount * 0.4;
      height = 20 + openAmount * 0.6;
    } else if (expr.expression_type === 'sad') {
      width = 30 + openAmount * 0.2;
      height = 15 + openAmount * 0.3;
    } else if (expr.expression_type === 'relaxed') {
      width = 35 + openAmount * 0.2;
      height = 15 + openAmount * 0.3;
    }
    
    // Adjust mouth open amount
    if (expr.mouth_open > 0) {
      height += (expr.mouth_open / 100) * 20;
    }
    
    // Adjust curve (-100 sad to 100 happy)
    if (expr.mouth_curve > 50) {
      borderRadius = "10px 10px 60px 60px"; // Big smile
      yOffset = -5;
    } else if (expr.mouth_curve > 10) {
      borderRadius = "20px 20px 40px 40px"; // Small smile
    } else if (expr.mouth_curve < -50) {
      borderRadius = "40px 40px 10px 10px"; // Big frown
      yOffset = 10;
    } else if (expr.mouth_curve < -10) {
      borderRadius = "30px 30px 10px 10px"; // Small frown
      yOffset = 5;
    } else {
      borderRadius = "20px"; // Neutral
    }
    
    // Beat sync bouncing
    if (expr.beat_sync && volume > 180) {
      yOffset += 10;
      width += 10;
      height += 10;
    }
    
    // Movement style
    if (expr.movement_style === 'gentle') {
      width += Math.sin(Date.now() / 1000) * 5;
    }
  } else if (emotion === 'ai') {
    width = 40 + openAmount * 0.4;
    height = 20 + openAmount * 0.6;
    borderRadius = "20px 20px 40px 40px";
  } else {
    width = 40 + openAmount * 0.3;
    height = 12 + openAmount * 0.6;
    borderRadius = height > 24 ? "15px 15px 40px 40px" : "20px";
  }

  return (
    <motion.div
      className="absolute bottom-[15%] md:bottom-[20%] left-1/2 -translate-x-1/2 bg-[#ff4757] z-20 overflow-hidden"
      animate={{
        width,
        height,
        borderRadius,
        y: yOffset
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Inner mouth dark spot for depth when open wide */}
      <motion.div 
        className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 bg-[#ff6b81] rounded-full"
        animate={{ 
          width: width * 0.6, 
          height: height * 0.5,
          opacity: height > 25 ? 1 : 0
        }}
      />
    </motion.div>
  );
}

function Blush({ volume, emotion, side }: { volume: number, emotion: string, side: 'left' | 'right' }) {
  if (emotion === 'angry' || emotion === 'sad') return null;

  const isHappy = emotion === 'happy';
  const baseOpacity = isHappy ? 0.5 : 0.15;
  const dynamicOpacity = baseOpacity + (volume / 255) * 0.3;
  
  const positionClass = side === 'left' 
    ? 'left-[18%] md:left-[25%]' 
    : 'right-[18%] md:right-[25%]';

  return (
    <motion.div
      className={`absolute top-[55%] md:top-[60%] ${positionClass} w-16 h-8 md:w-24 md:h-12 bg-[#ff4757] rounded-full blur-[12px] md:blur-xl z-0`}
      animate={{ 
        opacity: dynamicOpacity,
        scale: 1 + (volume / 255) * 0.4
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    />
  );
}

function Pomodoro() {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Auto-switch mode when done
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const changeMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#111]/80 backdrop-blur-xl rounded-[40px] p-10 border border-white/10 shadow-2xl flex flex-col items-center gap-8 w-full max-w-md">
      <div className="flex bg-black/50 rounded-full p-2 w-full relative">
        <motion.div 
          className="absolute top-2 bottom-2 w-[calc(50%-8px)] bg-[#333] rounded-full shadow-sm"
          animate={{ left: mode === 'work' ? '8px' : 'calc(50%)' }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        <button 
          onClick={() => changeMode('work')} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium z-10 transition-colors ${mode === 'work' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          <Brain size={18} /> Work
        </button>
        <button 
          onClick={() => changeMode('break')} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium z-10 transition-colors ${mode === 'break' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
        >
          <Coffee size={18} /> Break
        </button>
      </div>
      
      <div className="text-8xl font-mono font-bold text-white tracking-tight">
        {formatTime(timeLeft)}
      </div>
      
      <div className="flex gap-4 w-full">
        <button 
          onClick={toggleTimer} 
          className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl text-lg font-semibold transition-all ${
            isActive 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
              : 'bg-[#40c4ff]/20 text-[#40c4ff] hover:bg-[#40c4ff]/30'
          }`}
        >
          {isActive ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
        </button>
        <button 
          onClick={resetTimer} 
          className="w-20 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 rounded-2xl transition-colors"
          title="Reset Timer"
        >
          <RotateCcw size={24} />
        </button>
      </div>
    </div>
  );
}
