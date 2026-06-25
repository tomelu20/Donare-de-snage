import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // poate fi 'login' sau 'register'

  return (
    <div>
      {currentScreen === 'login' ? (
        <Login onSwitch={() => setCurrentScreen('register')} />
      ) : (
        <Register onSwitch={() => setCurrentScreen('login')} />
      )}
    </div>
  );
}

export default App;