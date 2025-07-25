//import React from 'react';


import { useState } from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import AuthPage from './components/Auth/AuthPage';
import './print.css';



function App() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true');

  const handleAuthSuccess = () => {
    setLoggedIn(true);
    localStorage.setItem('loggedIn', 'true');
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem('loggedIn');
  };

  if (!loggedIn) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Show dashboard if logged in
  return (
    <div>
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-gray-200 px-4 py-2 rounded"
      >
        Logout
      </button>
      <Dashboard onNavigate={() => {}} />
    </div>
  );
}

export default App;
