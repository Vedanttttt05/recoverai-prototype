import { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';

export default function App() {
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
  name: '',
  surgery: '',
  day: '',
  meds: []         // now an array, not a string
  });
const [medInput, setMedInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');

  const addMed = () => {
  if (!medInput.trim()) return;
  setForm(f => ({ ...f, meds: [...f.meds, medInput.trim()] }));
  setMedInput('');
};

const removeMed = (index) => {
  setForm(f => ({ ...f, meds: f.meds.filter((_, i) => i !== index) }));
};
  const handleStart = (e) => {
    e.preventDefault();
    if (!form.name || !form.surgery || !form.day) return;
    setPatient(form);
  };

  const handleInput = async (transcript) => {
    if (!transcript.trim()) return;

    setMessages(m => [...m, { role: 'user', text: transcript }]);
    setLoading(true);
    setTextInput('');

    try {
      const res = await fetch('https://recoverai-prototype.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, history, patient })
      });

      const { reply, isAlert } = await res.json();

      setHistory(h => [
        ...h,
        { role: 'user', parts: [{ text: transcript }] },
        { role: 'model', parts: [{ text: reply }] }
      ]);

      setMessages(m => [...m, { role: 'ai', text: reply, isAlert }]);

      const utterance = new SpeechSynthesisUtterance(reply);
      window.speechSynthesis.speak(utterance);

    } catch (err) {
      console.error('Server error:', err);
      setMessages(m => [...m, { role: 'ai', text: 'Could not reach server.', isAlert: false }]);
    } finally {
      setLoading(false);
    }
  };

  // --- Onboarding screen ---
  if (!patient) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
        <h1>RecoverAI 🩺</h1>
        <p style={{ color: '#666' }}>Tell us about yourself so we can personalize your recovery support.</p>

        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label>Your name</label><br />
            <input
              type="text"
              placeholder="e.g. Vedant"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label>Type of surgery</label><br />
            <input
              type="text"
              placeholder="e.g. knee replacement, appendectomy"
              value={form.surgery}
              onChange={e => setForm({ ...form, surgery: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label>Day of recovery (how many days since surgery?)</label><br />
            <input
              type="number"
              placeholder="e.g. 3"
              value={form.day}
              onChange={e => setForm({ ...form, day: e.target.value })}
              style={inputStyle}
              required
              min={1}
            />
          </div>

<div>
  <label>Current medications <span style={{ color: '#999' }}>(optional)</span></label><br />
  
  {/* Add med input */}
  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
    <input
      type="text"
      placeholder="e.g. Ibuprofen"
      value={medInput}
      onChange={e => setMedInput(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMed())}
      style={{ ...inputStyle, marginTop: 0, flex: 1 }}
    />
    <button type="button" onClick={addMed} style={{ ...btnStyle, padding: '8px 16px' }}>
      + Add
    </button>
  </div>

  {/* Med tags */}
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
    {form.meds.map((med, i) => (
      <span key={i} style={{
        background: '#e8f5e9',
        border: '1px solid #a5d6a7',
        borderRadius: 20,
        padding: '4px 12px',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        {med}
        <span
          onClick={() => removeMed(i)}
          style={{ cursor: 'pointer', color: '#888', fontWeight: 'bold' }}
        >
          ×
        </span>
      </span>
    ))}
  </div>
</div>

          <button type="submit" style={btnStyle}>
            Start Recovery Chat →
          </button>
        </form>
      </div>
    );
  }

  // --- Chat screen ---
  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>RecoverAI 🩺</h1>
        <span style={{ fontSize: 13, color: '#666' }}>
          {patient.name} · Day {patient.day} · {patient.surgery}
        </span>
      </div>

      <VoiceRecorder onResult={handleInput} />

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInput(textInput)}
          placeholder="Or type your symptom here..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button onClick={() => handleInput(textInput)} style={btnStyle}>Send</button>
      </div>

      {loading && <p style={{ color: 'gray' }}>Thinking...</p>}

      <div style={{ marginTop: 20 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            margin: '10px 0',
            padding: '10px 14px',
            borderRadius: 8,
            background: m.role === 'user' ? '#f0f0f0' : m.isAlert ? '#ffe5e5' : '#e8f5e9',
            color: m.isAlert ? 'red' : 'inherit'
          }}>
            <strong>{m.role === 'user' ? patient.name : 'AI'}:</strong> {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #ccc',
  marginTop: 4,
  boxSizing: 'border-box'
};

const btnStyle = {
  padding: '10px 20px',
  borderRadius: 8,
  background: '#2e7d32',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold'
};