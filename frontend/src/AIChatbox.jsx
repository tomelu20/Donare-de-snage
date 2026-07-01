import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Salut! Sunt asistentul tău inteligent G4 AI. Cu ce te pot ajuta astăzi în legătură cu donarea de sânge?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll la ultimul mesaj primit sau trimis
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    // Adăugăm instant mesajul utilizatorului în listă
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInputValue('');
    setLoading(true);

    try {
      // Apel către ruta LLM proaspăt creată din FastAPI
      const response = await axios.post('http://127.0.0.1:8000/ai/chat', { message: userMessage });
      setMessages((prev) => [...prev, { sender: 'ai', text: response.data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Momentan am întâmpinat o problemă de conexiune. Te rog să revii în câteva clipe.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '30px', zIndex: 3000, fontFamily: 'sans-serif' }}>
      
      {/* 1. FEREASTRA PRINCIPALĂ DE CHAT (Se deschide deasupra pastilei) */}
      {isOpen && (
        <div style={{
          width: '360px', height: '450px', backgroundColor: 'white', borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
          marginBottom: '12px', border: '1px solid #e1e4e8', overflow: 'hidden'
        }}>
          {/* Header Fereastră */}
          <div style={{ backgroundColor: '#1d4ed8', color: 'white', padding: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span> 
              <span>Asistent Virtual G4 AI</span>
            </div>
            <span style={{ fontSize: '12px', backgroundColor: '#198754', padding: '2px 6px', borderRadius: '4px' }}>Online</span>
          </div>

          {/* Zona de Mesaje */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? '#e63946' : '#ffffff',
                color: msg.sender === 'user' ? 'white' : '#333333',
                padding: '10px 14px', borderRadius: '12px', maxWidth: '80%',
                fontSize: '14px', boxShadow: msg.sender === 'ai' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                border: msg.sender === 'ai' ? '1px solid #e2e8f0' : 'none',
                lineHeight: '1.45', whiteSpace: 'pre-line' // Păstrează așezarea în pagină trimisă de LLM
              }}>
                {msg.text}
              </div>
            ))}
            
            {/* Indicator de încărcare (Loading) */}
            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '12px', color: '#718096', fontSize: '13px', fontStyle: 'italic', border: '1px solid #e2e8f0' }}>
                🧠 G4 AI gândește răspunsul...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* 2. PASTILA FIXĂ DE CHAT (Bara orizontală din screenshot-ul tău) */}
      <div style={{
        display: 'flex', alignItems: 'center', backgroundColor: '#1d4ed8', 
        padding: '8px 14px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        width: '320px', gap: '10px', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Cercul G4 Avatar */}
        <div style={{
          backgroundColor: 'white', width: '32px', height: '32px', borderRadius: '50%',
          display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#1d4ed8'
        }}>
          G4
        </div>

        {/* Input Text încorporat direct în bară */}
        <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onClick={() => setIsOpen(true)} // Deschide automat fereastra la click pe input
            placeholder="Chat cu G4 AI"
            style={{
              width: '100%', background: 'none', border: 'none', color: 'white',
              outline: 'none', fontSize: '14px', padding: '2px 0'
            }}
          />
          <button type="submit" style={{ display: 'none' }}>Trimite</button>
        </form>

        {/* Săgeata pentru Toggle Sus/Jos */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none', border: 'none', color: 'white', cursor: 'pointer',
            fontSize: '12px', padding: '2px 4px', display: 'flex', alignItems: 'center'
          }}
        >
          {isOpen ? '▼' : '▲'}
        </button>

        {/* Butonul de închidere rapidă (X) */}
        <button 
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '16px', padding: '0 2px' }}
        >
          &times;
        </button>
      </div>

    </div>
  );
}

export default AIChatbox;