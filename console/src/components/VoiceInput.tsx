import { useState, useEffect } from 'react';
import './VoiceInput.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

export function VoiceInput({ onTranscript, isListening, onListeningChange }: VoiceInputProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        onTranscript(transcript);

        // If final result, stop listening
        if (event.results[event.results.length - 1].isFinal) {
          onListeningChange(false);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        onListeningChange(false);
      };

      recognitionInstance.onend = () => {
        onListeningChange(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      onListeningChange(false);
    } else {
      recognition.start();
      onListeningChange(true);
    }
  };

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

// Text-to-Speech function (can be called from anywhere)
export function speakText(text: string, voiceName?: string) {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.75; // Much slower, more deliberate speech
    utterance.pitch = 0.5; // Very low pitch for deep Morgan Freeman voice
    utterance.volume = 1.0;
    
    // Try to find a deep male voice
    const voices = window.speechSynthesis.getVoices();
    if (voiceName) {
      const selectedVoice = voices.find(v => v.name === voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Auto-select best deep voice
      const deepVoice = voices.find(v => 
        v.name.toLowerCase().includes('deep') ||
        v.name.toLowerCase().includes('bass') ||
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('daniel') || // macOS deep voice
        v.name.toLowerCase().includes('fred') // Windows deep voice
      );
      if (deepVoice) {
        utterance.voice = deepVoice;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  }
}

// Get available voices
export function getVoices(): SpeechSynthesisVoice[] {
  if ('speechSynthesis' in window) {
    return window.speechSynthesis.getVoices();
  }
  return [];
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
