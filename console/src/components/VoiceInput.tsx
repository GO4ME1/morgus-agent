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
export function speakText(text: string) {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
