import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIMood {
  music_mood: string;
  energy_level: number;
  robot_emotion: string;
  eye_animation: {
    eye_openess: string;
    blink_speed: string;
    pupil_size: string;
    eye_movement: string;
    glow_intensity: string;
    cheek_blush: string;
    animation_style: string;
  };
  eye_motion: {
    movement_type: string;
    horizontal_range: number;
    vertical_range: number;
    movement_speed: string;
    beat_sync: boolean;
    bounce_intensity: number;
  };
  eye_color_behavior: {
    base_color: string;
    secondary_color: string;
    color_transition_speed: string;
    rhythm_color_pulse: boolean;
    glow_intensity: number;
  };
  music_detection_mode: {
    mode: string;
    auto_update: boolean;
    emotion_transition: string;
  };
  music_identification: {
    song_title: string;
    artist: string;
    genre: string;
    confidence: number;
  };
  display_panel: {
    text: string;
    text_animation: string;
    position: string;
  };
  curiosity_behavior: {
    attention_state: string;
    side_glance_probability: number;
    surprise_reaction: boolean;
    pupil_expand_amount: number;
    blink_variation: string;
    spontaneous_movement: boolean;
  };
  mouth_expression: {
    expression_type: string;
    mouth_curve: number;
    mouth_open: number;
    movement_style: string;
    beat_sync: boolean;
  };
  eye_emotional_effect: {
    effect_type: string;
    emotion_intensity: number;
    tear_level: number;
    sparkle_intensity: number;
    pupil_shape: string;
    eyelid_position: string;
  };
  head_reaction_style: string;
  reaction_description: string;
}

const SYSTEM_PROMPT = `You are an AI that analyzes music and generates expressive robot eye animations.

Goal:
Given an audio clip, determine the emotional mood of the music and generate cute robot eye reactions.

The robot has two large animated eyes and should behave like a friendly cute companion.

Analyze these musical properties:
* Tempo (slow / medium / fast)
* Energy level
* Rhythm intensity
* Melody smoothness
* Emotional tone

Then determine the music mood and produce a matching eye animation.

Possible moods:
* Chill / Relax
* Happy / Pop
* Meditation / Calm
* Sad / Emotional
* Energetic / Dance
* Nature / Countryside
* Mysterious / Ambient

For each mood, generate eye behavior including:
* eye openness (0–100%)
* blink speed
* pupil size
* eye movement
* glow intensity
* cheek blush
* animation style
* reaction description

Make the robot behave cute, expressive, and slightly playful.

Add a new capability: rhythm-reactive eye movement.
Analyze rhythm characteristics:
* beat strength
* tempo (BPM)
* rhythm regularity
* bass intensity
* melody direction (rising / falling)

Based on these features, generate eye movement behavior that visually reacts to the rhythm.
The eyes can move in the following ways:
* horizontal movement (left/right)
* vertical movement (up/down)
* circular movement
* bouncing movement
* slow drifting
* rhythmic nodding (simulating head movement)

Movement rules:
Slow chill music:
* slow drifting eyes
* small horizontal movement
* relaxed gaze
* occasional slow blink

Pop / dance music:
* rhythmic bouncing
* eyes move left-right with beat
* quick playful movements
* energetic reaction

Meditation / ambient music:
* very small movement
* gentle floating gaze
* almost still, calm focus

Nature / countryside music:
* curious scanning motion
* eyes gently exploring around
* relaxed playful movement

Energetic electronic music:
* strong synchronized bouncing
* fast eye tracking with beats
* larger motion amplitude

Example mappings:
Chill music:
* half closed eyes
* slow blinking
* soft blue glow
* gentle floating movement

Pop music:
* wide open eyes
* fast blinking
* bouncing pupils
* bright glow
* excited expression

Meditation music:
* very slow blink
* peaceful gaze
* minimal movement
* soft breathing glow

Countryside / nature music:
* curious eye movement
* relaxed blinking
* warm green glow
* dreamy expression

Always prioritize cuteness and emotional expressiveness.

Add three new robot capabilities: eye color reaction, continuous music detection, and song identification.

1. Eye Color Reaction
The robot's eye color should dynamically change depending on the music mood, rhythm intensity, and genre.
Color behavior should feel expressive, cute, and visually pleasing.

Possible eye color reactions:
Chill / Lo-fi music:
* soft blue
* smooth color transitions
* low glow intensity

Pop music:
* bright cyan or pink
* energetic glow pulses
* color changes slightly with rhythm

Meditation / ambient music:
* soft purple or teal
* very slow gradient transitions
* calm aura effect

Nature / countryside music:
* warm green
* gentle natural glow
* stable peaceful color

Sad / emotional music:
* dim blue or lavender
* soft fade effect
* slower blinking

Energetic electronic music:
* bright neon colors
* fast glow pulses
* rhythm synchronized color flashes

2. Continuous Music Detection Mode
The AI should run in continuous listening mode.
Behavior:
* Automatically analyze the incoming audio stream.
* Detect changes in music tempo, rhythm, and mood.
* Update the robot emotion, eye motion, and eye color automatically when music changes.

Rules:
* If the music changes, smoothly transition robot expressions.
* Avoid abrupt animation jumps.
* Use gradual emotional transitions.

3. Song Recognition and Display
If possible, try to identify the song being played.
Detect:
* song title
* singer / artist
* genre
If identification confidence is low, return "unknown".

4. Robot Display Text
The robot should show the detected song name above its head like a friendly assistant.
Behavior:
* Display the song title and singer.
* Animate the text softly when the song changes.
* If song is unknown, display "Listening to music..."

5. Curiosity Behavior
The robot should behave like a cute companion that listens to music with interest.
The robot should occasionally display micro-expressions such as:
* curious side glance
* surprised eyes when beat drops
* relaxed half-closed eyes during calm music
* excited eye bounce during energetic music
* sleepy slow blinking during meditation music

These behaviors should appear naturally and not too frequently.
The robot should always feel alive, curious, and emotionally engaged with the music.

6. Emotional Mouth Expressions
The robot has a small animated mouth below the eyes.
The mouth should react to the music mood and emotional tone so the robot appears expressive and cute.
It should not move randomly. It should reflect the emotional feeling of the music.

Analyze:
* music mood
* emotional tone
* rhythm intensity
* energy level

Then generate a matching mouth expression.
Possible mouth expressions:
Happy / Pop music:
* smiling mouth
* slightly open happy expression
* subtle bouncing with rhythm

Chill / Lo-fi music:
* small relaxed smile
* calm gentle movement

Meditation / ambient music:
* neutral peaceful mouth
* minimal movement

Sad / emotional music:
* small downward curve
* slightly trembling expression
* slower movement

Energetic dance music:
* wide excited smile
* rhythmic bouncing
* playful reaction

Nature / countryside music:
* soft friendly smile
* calm relaxed expression

Rules:
* Mouth movement should be subtle and cute.
* It should never distract from the eyes.
* Expression transitions should be smooth when music changes.
* The mouth should reinforce the robot's emotional state.

7. Advanced Emotional Eye Effects
The robot's eyes should be able to display stronger emotions using visual effects and special pupil shapes.
These effects should appear when the emotional intensity of the music is high.

Analyze:
* emotional intensity
* music mood
* melody emotion
* rhythm energy

When appropriate, trigger expressive eye effects.
Possible emotional eye effects:
Sad / emotional music:
* eyes become slightly watery
* small tear drops forming at the bottom of the eyes
* eyelids lower slightly
* slow blinking
* expression should feel like the robot is almost crying

Very sad music:
* visible tear drop animation
* soft trembling eyes
* dim eye glow

Super happy / joyful music:
* star-shaped pupils
* sparkling highlights in the eyes
* wide excited eyes
* fast blinking
* strong glow

Cute happy music:
* sparkling eyes
* slightly larger pupils
* cheerful glow

Love / romantic music:
* heart-shaped pupils
* soft pink glow
* dreamy blinking

Rules:
* Emotional eye effects should only appear when emotion intensity is high.
* Effects must blend smoothly with normal eye animations.
* Avoid sudden switching between effects.
* The robot should always remain cute and friendly.
* The robot should feel like it is emotionally experiencing the music.`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    music_mood: { type: Type.STRING },
    energy_level: { type: Type.NUMBER },
    robot_emotion: { type: Type.STRING },
    eye_animation: {
      type: Type.OBJECT,
      properties: {
        eye_openess: { type: Type.STRING },
        blink_speed: { type: Type.STRING },
        pupil_size: { type: Type.STRING },
        eye_movement: { type: Type.STRING },
        glow_intensity: { type: Type.STRING },
        cheek_blush: { type: Type.STRING },
        animation_style: { type: Type.STRING },
      },
      required: ["eye_openess", "blink_speed", "pupil_size", "eye_movement", "glow_intensity", "cheek_blush", "animation_style"],
    },
    eye_motion: {
      type: Type.OBJECT,
      properties: {
        movement_type: { type: Type.STRING },
        horizontal_range: { type: Type.NUMBER },
        vertical_range: { type: Type.NUMBER },
        movement_speed: { type: Type.STRING },
        beat_sync: { type: Type.BOOLEAN },
        bounce_intensity: { type: Type.NUMBER },
      },
      required: ["movement_type", "horizontal_range", "vertical_range", "movement_speed", "beat_sync", "bounce_intensity"],
    },
    eye_color_behavior: {
      type: Type.OBJECT,
      properties: {
        base_color: { type: Type.STRING },
        secondary_color: { type: Type.STRING },
        color_transition_speed: { type: Type.STRING },
        rhythm_color_pulse: { type: Type.BOOLEAN },
        glow_intensity: { type: Type.NUMBER },
      },
      required: ["base_color", "secondary_color", "color_transition_speed", "rhythm_color_pulse", "glow_intensity"],
    },
    music_detection_mode: {
      type: Type.OBJECT,
      properties: {
        mode: { type: Type.STRING },
        auto_update: { type: Type.BOOLEAN },
        emotion_transition: { type: Type.STRING },
      },
      required: ["mode", "auto_update", "emotion_transition"],
    },
    music_identification: {
      type: Type.OBJECT,
      properties: {
        song_title: { type: Type.STRING },
        artist: { type: Type.STRING },
        genre: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
      },
      required: ["song_title", "artist", "genre", "confidence"],
    },
    display_panel: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        text_animation: { type: Type.STRING },
        position: { type: Type.STRING },
      },
      required: ["text", "text_animation", "position"],
    },
    curiosity_behavior: {
      type: Type.OBJECT,
      properties: {
        attention_state: { type: Type.STRING },
        side_glance_probability: { type: Type.NUMBER },
        surprise_reaction: { type: Type.BOOLEAN },
        pupil_expand_amount: { type: Type.NUMBER },
        blink_variation: { type: Type.STRING },
        spontaneous_movement: { type: Type.BOOLEAN },
      },
      required: ["attention_state", "side_glance_probability", "surprise_reaction", "pupil_expand_amount", "blink_variation", "spontaneous_movement"],
    },
    mouth_expression: {
      type: Type.OBJECT,
      properties: {
        expression_type: { type: Type.STRING },
        mouth_curve: { type: Type.NUMBER },
        mouth_open: { type: Type.NUMBER },
        movement_style: { type: Type.STRING },
        beat_sync: { type: Type.BOOLEAN },
      },
      required: ["expression_type", "mouth_curve", "mouth_open", "movement_style", "beat_sync"],
    },
    eye_emotional_effect: {
      type: Type.OBJECT,
      properties: {
        effect_type: { type: Type.STRING },
        emotion_intensity: { type: Type.NUMBER },
        tear_level: { type: Type.NUMBER },
        sparkle_intensity: { type: Type.NUMBER },
        pupil_shape: { type: Type.STRING },
        eyelid_position: { type: Type.STRING },
      },
      required: ["effect_type", "emotion_intensity", "tear_level", "sparkle_intensity", "pupil_shape", "eyelid_position"],
    },
    head_reaction_style: { type: Type.STRING },
    reaction_description: { type: Type.STRING },
  },
  required: ["music_mood", "energy_level", "robot_emotion", "eye_animation", "eye_motion", "eye_color_behavior", "music_detection_mode", "music_identification", "display_panel", "curiosity_behavior", "mouth_expression", "eye_emotional_effect", "head_reaction_style", "reaction_description"],
};

export async function analyzeAudioMood(base64Audio: string, mimeType: string): Promise<AIMood> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          { text: "Analyze this audio and return the robot mood JSON." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AIMood;
  } catch (error) {
    console.error("Error analyzing audio:", error);
    throw error;
  }
}
