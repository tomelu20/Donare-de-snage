import React, { useState } from 'react';
import axios from 'axios';

function Login({ onSwitch, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Trimitem cererea către backend (corespunde schemei UserLogin)
      const response = await axios.post('http://127.0.0.1:8000/auth/login', {
        email: email,
        password: password
      });
      
      // 1. Prindem și salvăm datele utilizatorului (corespund schemei UserOut: id, name, email, role) în memoria browserului
      localStorage.setItem('user_session', JSON.stringify(response.data));
      
      // 2. Anunțăm componenta părinte că logarea a avut succes pentru a schimba ecranul către Dashboard
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'A apărut o eroare la logare.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#e63946' }}>Autentificare</h2>
      
      {error && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px' }}>{error}</p>}
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Parolă:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
          Intră în cont
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
        Nu ai cont? <button onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', fontWeight: 'bold', padding: 0, font: 'inherit' }}>Înregistrează-te</button>
      </p>
    </div>
  );
}

export default Login;