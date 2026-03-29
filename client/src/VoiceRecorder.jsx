import { useState } from 'react';

export default function VoiceRecorder({ onResult }) {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Use Chrome or Edge — Safari does not support Speech Recognition');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      console.log('Got transcript:', transcript);
      onResult(transcript);
    };

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      setListening(false);
      if (e.error === 'not-allowed') alert('Microphone permission denied');
      if (e.error === 'no-speech') alert('No speech detected — try speaking louder');
    };

    recognition.onend = () => setListening(false);

    recognition.start();
  };

  return (
    <button onClick={startListening} disabled={listening}>
      {listening ? '🔴 Listening...' : '🎤 Speak your symptom'}
    </button>
  );
}