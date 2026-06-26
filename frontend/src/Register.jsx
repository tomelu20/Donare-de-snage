import React, { useState } from 'react';
import axios from 'axios';

function Register({ onSwitch, onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // 1. Trimitem datele către backend și reținem răspunsul (care conține id, name, role etc.)
      const response = await axios.post('http://127.0.0.1:8000/auth/register', {
        name: name,
        surname: surname,
        phone: phone,
        email: email,
        password: password
      });
      
      // 2. Salvăm direct datele utilizatorului în sesiune (exact ca la Login)
      sessionStorage.setItem('user_session', JSON.stringify(response.data));
      
      setSuccess('Contul a fost creat cu succes! Te redirecționăm direct în aplicație...');
      
      // 3. Golești câmpurile din formular
      setName('');
      setSurname('');
      setPhone('');
      setEmail('');
      setPassword('');

      // 4. Redirecționare automată după 1.5 secunde pentru ca userul să poată citi mesajul de succes
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.detail || 'A apărut o eroare la înregistrare.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#e63946' }}>Înregistrare Cont Nou</h2>
      
      {error && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px' }}>{error}</p>}
      {success && <p style={{ color: 'green', backgroundColor: '#e3ffe3', padding: '10px', borderRadius: '4px' }}>{success}</p>}

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nume:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Prenume:</label>
          <input 
            type="text" 
            value={surname} 
            onChange={(e) => setSurname(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Telefon:</label>
          <input 
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        
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
        
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          Creează cont
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
        Ai deja un cont?{' '}
        <button type="button" onClick={onSwitch} style={{ background: 'none', border: 'none', color: '#e63946', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
          Conectează-te aici
        </button>
      </p>
    </div>
  );
}

export default Register;