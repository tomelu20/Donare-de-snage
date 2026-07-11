import React, { useState } from 'react';
import axios from 'axios';

function Register({ onSwitch, onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bloodGroup, setBloodGroup] = useState(''); // Rămâne gol inițial pentru a afișa placeholder-ul
  const [smsCode, setSmsCode] = useState(''); // <-- Adăugat pentru codul SMS
  const [isCodeSent, setIsCodeSent] = useState(false); // <-- Adăugat pentru a ști dacă s-a trimis codul
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Funcție adăugată pentru a cere trimiterea codului prin SMS
  const handleSendSMS = async () => {
    setError('');
    setSuccess('');
    if (!phone) {
      setError('Te rog introdu numărul de telefon mai întâi.');
      return;
    }

    try {
      await axios.post(`http://127.0.0.1:8000/auth/send-sms-code?phone=${encodeURIComponent(phone)}`);
      setIsCodeSent(true);
      setSuccess('Codul de verificare a fost trimis! Verifică telefonul sau terminalul backend.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Eroare la trimiterea SMS-ului.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validare: Ne asigurăm că utilizatorul chiar a selectat o opțiune din listă
    if (!bloodGroup) {
      setError('Vă rugăm să selectați o opțiune pentru grupa sanguină.');
      return;
    }

    // Validare: Ne asigurăm că a cerut codul SMS înainte de înregistrare
    if (!isCodeSent) {
      setError('Trebuie să ceri un cod SMS și să îl introduci înainte de înregistrare.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/auth/register', {
        name: name,
        surname: surname,
        phone: phone,
        email: email,
        password: password,
        blood_group: bloodGroup,
        sms_code: smsCode // <-- Trimitem și codul SMS către backend
      });
      
      sessionStorage.setItem('user_session', JSON.stringify(response.data));
      setSuccess('Contul a fost creat cu succes! Te redirecționăm direct în aplicație...');
      
      setName('');
      setSurname('');
      setPhone('');
      setEmail('');
      setPassword('');
      setBloodGroup('');
      setSmsCode('');
      setIsCodeSent(false);

      if (onRegisterSuccess) {
        onRegisterSuccess();
      }

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

        {/* Modificat pentru a include butonul de "Trimite Cod" lângă input-ul de telefon */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Telefon:</label>
          <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
            <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
                placeholder="+407xxxxxxxx"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'table-cell', width: '100px', paddingLeft: '10px', verticalAlign: 'middle' }}>
              <button 
                type="button" 
                onClick={handleSendSMS} 
                style={{ width: '100%', padding: '8px 0', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                {isCodeSent ? 'Retrimite' : 'Trimite'}
              </button>
            </div>
          </div>
        </div>

        {/* Câmp adăugat: devine vizibil doar după ce s-a dat click pe "Trimite" */}
        {isCodeSent && (
          <div style={{ marginBottom: '15px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px', border: '1px dashed #e63946' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e63946' }}>Cod Verificare SMS:</label>
            <input 
              type="text" 
              value={smsCode} 
              onChange={(e) => setSmsCode(e.target.value)} 
              required 
              placeholder="Introduceți codul primit"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>
        )}
        
        {/* Dropdown-ul actualizat conform cerințelor tale vizuale */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grupa sanguină / RH:</label>
          <select 
            value={bloodGroup} 
            onChange={(e) => setBloodGroup(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', boxSizing: 'border-box', cursor: 'pointer' }}
          >
            {/* Această opțiune este afișată implicit la vedere și devine ascunsă/inutilizabilă după ce dai click */}
            <option value="" disabled hidden>Alege grupa sanguină</option>
            
            {/* Opțiunile vizibile la click pe listă */}
            <option value="Nu știu">Nu știu grupa mea sanguină</option>
            <option value="0I+">0I (Pozitiv)</option>
            <option value="0I-">0I (Negativ)</option>
            <option value="AII+">AII (Pozitiv)</option>
            <option value="AII-">AII (Negativ)</option>
            <option value="BIII+">BIII (Pozitiv)</option>
            <option value="BIII-">BIII (Negativ)</option>
            <option value="ABIV+">ABIV (Pozitiv)</option>
            <option value="ABIV-">ABIV (Negativ)</option>
          </select>
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