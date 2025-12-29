import { useState, useEffect, useCallback } from 'react';
import './VoiceInput.css';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    __currentAudio?: HTMLAudioElement | null;
    __isAudioPlaying?: boolean;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

export function VoiceInput({ onTranscript, isListening, onListeningChange }: VoiceInputProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        const transcriptParts: string[] = [];
        
        for (let i = 0; i < results.length; i++) {
          transcriptParts.push(results[i][0].transcript);
        }
        
        const transcript = transcriptParts.join('');
        onTranscript(transcript);

        // If final result, stop listening
        if (results[results.length - 1].isFinal) {
          onListeningChange(false);
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        onListeningChange(false);
      };

      recognitionInstance.onend = () => {
        onListeningChange(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onTranscript, onListeningChange]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      onListeningChange(false);
    } else {
      recognition.start();
      onListeningChange(true);
    }
  }, [recognition, isListening, onListeningChange]);

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <button
      className={`voice-button ${isListening ? 'listening' : ''}`}
      onClick={toggleListening}
      title={isListening ? 'Stop listening' : 'Start voice input'}
    >
      {isListening ? '🎤' : '🎙️'}
    </button>
  );
}

// Track which messages have been spoken to prevent duplicates
const spokenMessages = new Set<string>();
let isCurrentlySpeaking = false;
let currentSpeakingText = '';

// Text-to-Speech function using ElevenLabs API
export async function speakText(text: string): Promise<void> {
  // Create a hash of the text to track if we've already spoken it
  const textHash = text.substring(0, 100); // Use first 100 chars as identifier
  
  // AGGRESSIVE duplicate prevention
  if (spokenMessages.has(textHash)) {
    console.log('[TTS] Already spoken this message, skipping');
    return;
  }
  
  // Prevent concurrent calls with the same text
  if (isCurrentlySpeaking && currentSpeakingText === textHash) {
    console.log('[TTS] Already speaking this exact message, skipping');
    return;
  }
  
  // Stop any ongoing speech before starting new one
  stopSpeaking();
  
  isCurrentlySpeaking = true;
  currentSpeakingText = textHash;
  spokenMessages.add(textHash);
  
  // Clean up old entries to prevent memory leak (keep last 10)
  if (spokenMessages.size > 10) {
    const firstKey = spokenMessages.values().next().value;
    if (firstKey) {
      spokenMessages.delete(firstKey);
    }
  }
  
  try {
    console.log('[TTS] Starting ElevenLabs TTS for text:', text.substring(0, 50) + '...');
    
    // Cancel any ongoing speech
    stopSpeaking();

    // Strip markdown formatting before speaking
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold **
      .replace(/\*/g, '') // Remove italic *
      .replace(/^[•-]\s+/gm, '') // Remove bullets and list markers
      .replace(/^#+\s+/gm, '') // Remove headings #
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
      .replace(/`/g, '') // Remove code backticks
      .replace(/🎯|✅|📊|💡|🔗|📋|💾|💭|➕|👍|👎|🍅/g, '') // Remove emojis
      .trim();

    console.log('[TTS] Cleaned text:', cleanText.substring(0, 50) + '...');
    
    // Call ElevenLabs TTS API via our backend
    console.log('[TTS] Calling ElevenLabs API...');
    const response = await fetch('https://morgus-orchestrator.morgan-426.workers.dev/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: cleanText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] API error:', response.status, response.statusText, errorText);
      console.error('[TTS] API URL:', response.url);
      // Don't fallback - just log the error
      console.log('[TTS] Skipping TTS due to API error (no fallback)');
      return;
    }
    
    console.log('[TTS] API response OK, creating audio...');

    const audioBlob = await response.blob();
    console.log('[TTS] Audio blob size:', audioBlob.size, 'bytes');
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Store current audio for stopping
    window.__currentAudio = audio;
    window.__isAudioPlaying = true;
    
    console.log('[TTS] Playing audio...');
    await audio.play();
    console.log('[TTS] Audio playing successfully!');
    
    // Clean up blob URL after playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      window.__currentAudio = null;
      window.__isAudioPlaying = false;
      isCurrentlySpeaking = false;
      currentSpeakingText = '';
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      window.__currentAudio = null;
      window.__isAudioPlaying = false;
      isCurrentlySpeaking = false;
      currentSpeakingText = '';
    };
  } catch {
    console.error('[TTS] ElevenLabs TTS failed:', error);
    // Don't fallback to browser TTS - just log the error
    console.log('[TTS] Skipping TTS due to error (no fallback to browser TTS)');
    isCurrentlySpeaking = false;
    currentSpeakingText = '';
  }
}

// Get available voices (kept for compatibility, but not used)
export function getVoices(): SpeechSynthesisVoice[] {
  return [];
}

export function stopSpeaking(): void {
  // Clear spoken messages when manually stopping
  spokenMessages.clear();
  
  // Reset speaking flags
  isCurrentlySpeaking = false;
  currentSpeakingText = '';
  window.__isAudioPlaying = false;
  
  // Stop ElevenLabs audio if playing
  const currentAudio = window.__currentAudio;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    window.__currentAudio = null;
  }
  
  // Also stop browser TTS just in case
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
