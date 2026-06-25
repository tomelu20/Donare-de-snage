import React from 'react';

function Dashboard({ onLogout }) {
  // Preluăm datele salvate în browser și le transformăm înapoi în obiect React
  const savedUser = JSON.stringify(localStorage.getItem('user_session'));
  const user = savedUser ? JSON.parse(localStorage.getItem('user_session')) : null;

  const handleLogoutClick = () => {
    // Ștergem datele din browser la delogare
    localStorage.removeItem('user_session');
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e63946', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#e63946', margin: 0 }}>Panou de Control Donator</h2>
        <button 
          onClick={handleLogoutClick} 
          style={{ padding: '6px 12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Deconectare
        </button>
      </div>

      {user ? (
        <div>
          <h3>Bine ai venit, {user.name} {user.surname}!</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Telefon:</strong> {user.phone}</p>
          <p><strong>Tip Cont:</strong> <span style={{ textTransform: 'uppercase', color: '#e63946', fontWeight: 'bold' }}>{user.role}</span></p>
          
          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px', borderLeft: '4px solid #e63946' }}>
            <h4>Secțiuni disponibile în aplicație:</h4>
            <ul>
              <li>Vizualizare Campanii Active</li>
              <li>Istoric Programări Donare</li>
              <li>Chestionar de Eligibilitate</li>
            </ul>
          </div>
        </div>
      ) : (
        <p>Eroare: Sesiunea utilizatorului nu a fost găsită. Vă rugăm să vă reautentificați.</p>
      )}
    </div>
  );
}

export default Dashboard;