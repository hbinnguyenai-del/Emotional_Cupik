/**
 * Deterministic Music-to-Emotion Engine
 * No external API calls. Real-time performance.
 */

export interface AudioFeatures {
  bpm: number;
  energy: number;
  brightness: number;
  beat_detected: boolean;
  beat_strength: number;
  spectral_flux: number;
}

export interface RobotState {
  mood: string;
  emotion_intensity: number;
  eye: {
    open: number;
    blink_speed: number;
    pupil_size: number;
    offset_x: number;
    offset_y: number;
    color: string;
    effect: string;
    tear_level: number;
  };
  mouth: {
    curve: number;
    open: number;
  };
}

export class DeterministicEngine {
  private state: RobotState;
  private lastCuriosityTime: number = 0;
  private curiosityOffsets = { x: 0, y: 0, pupil: 0 };

  constructor() {
    this.state = {
      mood: 'neutral',
      emotion_intensity: 0,
      eye: {
        open: 1,
        blink_speed: 4000,
        pupil_size: 0.5,
        offset_x: 0,
        offset_y: 0,
        color: '#ffffff',
        effect: 'none',
        tear_level: 0,
      },
      mouth: {
        curve: 0,
        open: 0,
      },
    };
  }

  public update(features: AudioFeatures): RobotState {
    // STEP 1 — Detect Music Mood
    let targetMood = 'neutral';
    if (features.energy < 0.3 && features.bpm < 80) {
      targetMood = 'chill';
    } else if (features.energy > 0.7 && features.bpm > 110) {
      targetMood = 'happy';
    } else if (features.bpm < 60) {
      targetMood = 'meditation';
    } else if (features.energy < 0.4) {
      targetMood = 'sad';
    }

    // STEP 2 — Emotion Intensity
    const targetIntensity = Math.min(100, Math.max(0, (features.energy * 0.6 + features.beat_strength * 0.4) * 100));

    // STEP 3 — Eye Animation
    let targetEyeOpen = 1;
    let targetBlinkSpeed = 4000;
    let targetPupilSize = 0.5;

    switch (targetMood) {
      case 'chill':
        targetEyeOpen = 0.5;
        targetBlinkSpeed = 2000;
        targetPupilSize = 0.45;
        break;
      case 'happy':
        targetEyeOpen = 0.9;
        targetBlinkSpeed = 600;
        targetPupilSize = 0.6;
        break;
      case 'sad':
        targetEyeOpen = 0.4;
        targetBlinkSpeed = 2500;
        targetPupilSize = 0.4;
        break;
      case 'meditation':
        targetEyeOpen = 0.3;
        targetBlinkSpeed = 3000;
        targetPupilSize = 0.35;
        break;
      default:
        targetEyeOpen = 0.8;
        targetBlinkSpeed = 4000;
        targetPupilSize = 0.5;
    }

    // STEP 4 — Eye Motion (Rhythm)
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    if (features.beat_detected) {
      targetOffsetX = (Math.random() * 2 - 1) * features.beat_strength;
      targetOffsetY = (Math.random() - 0.5) * features.beat_strength;
    }

    // STEP 5 — Eye Color
    let targetColor = '#ffffff';
    switch (targetMood) {
      case 'chill': targetColor = '#3b82f6'; break; // blue
      case 'happy': targetColor = '#22d3ee'; break; // cyan
      case 'sad': targetColor = '#6366f1'; break; // dim blue/purple
      case 'meditation': targetColor = '#a855f7'; break; // soft purple
      case 'neutral': targetColor = '#ffffff'; break;
    }
    if (features.energy > 0.8) targetColor = '#10b981'; // energetic neon emerald

    // STEP 6 — Emotional Eye Effects
    let targetEffect = 'none';
    let targetTearLevel = 0;
    if (targetMood === 'sad' && targetIntensity > 60) {
      targetEffect = 'watery';
      targetTearLevel = targetIntensity * 0.5;
    } else if (targetMood === 'happy' && targetIntensity > 80) {
      targetEffect = 'star_pupils';
    }

    // STEP 7 — Mouth Expression
    let targetMouthCurve = 0;
    let targetMouthOpen = 0.1;
    switch (targetMood) {
      case 'happy':
        targetMouthCurve = 0.8;
        targetMouthOpen = 0.4;
        break;
      case 'sad':
        targetMouthCurve = -0.5;
        targetMouthOpen = 0.1;
        break;
      case 'chill':
        targetMouthCurve = 0.3;
        targetMouthOpen = 0.15;
        break;
      case 'meditation':
        targetMouthCurve = 0;
        targetMouthOpen = 0.05;
        break;
    }
    if (features.beat_detected) {
      targetMouthOpen += features.beat_strength * 0.2;
    }

    // STEP 8 — Curiosity Behavior
    const now = Date.now();
    if (now - this.lastCuriosityTime > 5000 + Math.random() * 5000) {
      this.curiosityOffsets = {
        x: (Math.random() * 2 - 1) * 0.2,
        y: (Math.random() * 2 - 1) * 0.1,
        pupil: (Math.random() - 0.5) * 0.1
      };
      this.lastCuriosityTime = now;
    }

    // STEP 9 — Smooth Transitions (Interpolation)
    const lerp = (current: number, target: number, factor: number = 0.2) => {
      return current * (1 - factor) + target * factor;
    };

    this.state = {
      mood: targetMood,
      emotion_intensity: lerp(this.state.emotion_intensity, targetIntensity),
      eye: {
        open: lerp(this.state.eye.open, targetEyeOpen),
        blink_speed: lerp(this.state.eye.blink_speed, targetBlinkSpeed),
        pupil_size: lerp(this.state.eye.pupil_size, targetPupilSize + this.curiosityOffsets.pupil),
        offset_x: lerp(this.state.eye.offset_x, targetOffsetX + this.curiosityOffsets.x),
        offset_y: lerp(this.state.eye.offset_y, targetOffsetY + this.curiosityOffsets.y),
        color: targetColor, // Colors don't lerp easily here, but we could
        effect: targetEffect,
        tear_level: lerp(this.state.eye.tear_level, targetTearLevel),
      },
      mouth: {
        curve: lerp(this.state.mouth.curve, targetMouthCurve),
        open: lerp(this.state.mouth.open, targetMouthOpen),
      },
    };

    return this.state;
  }
}
