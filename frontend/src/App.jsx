import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

function App() {
  // Verificăm dacă există deja o sesiune în browser pentru a seta ecranul de pornire implicit
  const hasSession = localStorage.getItem('user_session') !== null;
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