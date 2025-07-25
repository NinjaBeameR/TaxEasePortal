//import React from 'react';


import { useState } from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import AuthPage from './components/Auth/AuthPage';
import Header from './components/Layout/Header';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './print.css';
import CustomerList from './components/Customers/CustomerList';
import ProductList from './components/Products/ProductList';
import CompanySetup from './components/Company/CompanySetup';



function App() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true');
  const [currentPage, setCurrentPage] = useState('dashboard');

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

  return (
    <BrowserRouter>
      <Header currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
      <Routes>
        <Route path="/dashboard" element={<Dashboard onNavigate={setCurrentPage} />} />
        <Route
          path="/customers"
          element={
            <CustomerList
              onEdit={() => {}}
              onCreate={() => {}}
            />
          }
        />
        <Route
          path="/products"
          element={
            <ProductList
              onEdit={() => {}}
              onCreate={() => {}}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <CompanySetup
              onComplete={() => setCurrentPage('dashboard')}
            />
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
