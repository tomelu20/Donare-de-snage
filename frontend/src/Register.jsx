import React, { useState } from 'react';
import axios from 'axios';

function Register({ onSwitch, onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emailCode, setEmailCode] = useState(''); 
  
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Solicită trimiterea codului prin Email
  const handleSendEmailCode = async () => {
    setError('');
    setSuccess('');
    if (!email) {
      setError('Te rog introdu adresa de email mai întâi.');
      return;
    }

    try {
      await axios.post(`http://127.0.0.1:8000/auth/send-email-code?email=${encodeURIComponent(email)}`);
      setIsCodeSent(true);
      setSuccess('Codul de verificare a fost trimis pe email!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Eroare la trimiterea email-ului.');
    }
  };

  // 2. Verifică codul de email pe loc
  const handleVerifyCode = async () => {
    setError('');
    setSuccess('');
    if (!emailCode) {
      setError('Te rog introdu codul primit pe email.');
      return;
    }

    try {
      await axios.post(`http://127.0.0.1:8000/auth/verify-email-code?email=${encodeURIComponent(email)}&email_code=${encodeURIComponent(emailCode)}`);
      setIsVerified(true);
      setSuccess('Email verificat cu succes! Puteți continua completarea formularului.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Codul introdus este incorect sau a expirat.');
    }
  };

  // 3. Înregistrarea finală a contului
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!bloodGroup) {
      setError('Vă rugăm să selectați o opțiune pentru grupa sanguină.');
      return;
    }

    if (!isVerified) {
      setError('Trebuie să vă verificați adresa de email înainte de a crea contul.');
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
        email_code: emailCode 
      });
      
      sessionStorage.setItem('user_session', JSON.stringify(response.data));
      setSuccess('Contul a fost creat cu succes! Te redirecționăm direct în aplicație...');
      
      setName('');
      setSurname('');
      setPhone('');
      setEmail('');
      setPassword('');
      setBloodGroup('');
      setEmailCode('');
      setIsCodeSent(false);
      setIsVerified(false);

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
        
        {/* 1. NUME */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' , fontWeight: 'bold'}}>Nume:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* 2. PRENUME */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' , fontWeight: 'bold'}}>Prenume:</label>
          <input 
            type="text" 
            value={surname} 
            onChange={(e) => setSurname(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* 3. TELEFON */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Telefon:</label>
          <input 
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            required 
            placeholder="+407xxxxxxxx"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* 4. EMAIL + BUTON TRIMITE COD */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email: (Adresa de email trebuie verificată)</label>
          <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
            <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={isVerified} 
                placeholder="nume@gmail.com"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: isVerified ? '2px solid green' : '1px solid #ccc', boxSizing: 'border-box', backgroundColor: isVerified ? '#f0fff0' : 'white' }}
              />
            </div>
            <div style={{ display: 'table-cell', width: '100px', paddingLeft: '10px', verticalAlign: 'middle' }}>
              <button 
                type="button" 
                onClick={handleSendEmailCode} 
                disabled={isVerified}
                style={{ width: '100%', padding: '8px 0', backgroundColor: isVerified ? '#999' : '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: isVerified ? 'default' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                {isCodeSent ? 'Retrimite' : 'Trimite cod'}
              </button>
            </div>
          </div>
        </div>

        {/* BLOC VERIFICARE COD EMAIL (Apare sub Email doar după ce s-a dat click pe trimitere) */}
        {isCodeSent && (
          <div style={{ marginBottom: '15px', backgroundColor: isVerified ? '#f0fff0' : '#f9f9f9', padding: '10px', borderRadius: '4px', border: isVerified ? '1px solid green' : '1px dashed #e63946' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: isVerified ? 'green' : '#e63946' }}>
              {isVerified ? '✓ Email Verificat' : 'Cod Verificare Email:'}
            </label>
            <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
                <input 
                  type="text" 
                  value={emailCode} 
                  onChange={(e) => setEmailCode(e.target.value)} 
                  required 
                  disabled={isVerified}
                  placeholder="Cod din 6 cifre"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'table-cell', width: '100px', paddingLeft: '10px', verticalAlign: 'middle' }}>
                <button 
                  type="button" 
                  onClick={handleVerifyCode} 
                  disabled={isVerified}
                  style={{ width: '100%', padding: '8px 0', backgroundColor: isVerified ? '#999' : '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: isVerified ? 'default' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  Verifică
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 5. GRUPA SANGUINĂ */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grupa sanguină / RH:</label>
          <select 
            value={bloodGroup} 
            onChange={(e) => setBloodGroup(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white', boxSizing: 'border-box', cursor: 'pointer' }}
          >
            <option value="" disabled hidden>Alege grupa sanguină</option>
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
        
        {/* 6. PAROLĂ */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' , fontWeight: 'bold'}}>Parolă:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={!isVerified} 
          style={{ width: '100%', padding: '10px', backgroundColor: !isVerified ? '#ccc' : '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: !isVerified ? 'default' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        >
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