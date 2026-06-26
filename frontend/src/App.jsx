import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

function App() {
  // Schimbat din localStorage în sessionStorage pentru ștergerea sesiunii la închiderea tab-ului
  const hasSession = sessionStorage.getItem('user_session') !== null;
  const [currentScreen, setCurrentScreen] = useState(hasSession ? 'dashboard' : 'login');

  return (
    <div>
      {currentScreen === 'login' && (
        <Login 
          onSwitch={() => setCurrentScreen('register')} 
          onLoginSuccess={() => setCurrentScreen('dashboard')} 
        />
      )}
      
      {currentScreen === 'register' && (
        <Register 
          onSwitch={() => setCurrentScreen('login')} 
          onRegisterSuccess={() => setCurrentScreen('dashboard')}
        />
      )}
      
      {currentScreen === 'dashboard' && (
        <Dashboard 
          onLogout={() => setCurrentScreen('login')} 
        />
      )}
    </div>
  );
}

export default App;