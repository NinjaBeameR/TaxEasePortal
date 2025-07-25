//import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import CompanySetup from './components/Company/CompanySetup';
import CustomerList from './components/Customers/CustomerList';
import CustomerForm from './components/Customers/CustomerForm';
import ProductList from './components/Products/ProductList';
import ProductForm from './components/Products/ProductForm';
import InvoiceList from './components/Invoices/InvoiceList';
import InvoiceForm from './components/Invoices/InvoiceForm';
import InvoiceView from './components/Invoices/InvoiceView';
import AuthPage from './components/Auth/AuthPage';
import AdminPanel from './components/Admin/AdminPanel';
import { Customer, Product, Invoice } from './types';
import LoadingSpinner from './components/UI/LoadingSpinner';
import './print.css';


function App() {
  // State for navigation and data
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'view'>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [navigationData, setNavigationData] = useState<any>(null);
  const [companySetupComplete, setCompanySetupComplete] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(localStorage.getItem('isAdmin') === 'true');

  // On mount, check if admin or user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      if (localStorage.getItem('isAdmin') === 'true') {
        setShowAdminPanel(true);
        setSession(null);
        setLoading(false);
        return;
      }
      // Check Supabase Auth for user
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setSession({ user });
        // Fetch company info
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setCompany(companyData);
        setCompanySetupComplete(!!companyData);
      } else {
        setSession(null);
        setCompany(null);
        setCompanySetupComplete(false);
      }
      setShowAdminPanel(false);
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Logout handler: clears all state and reloads
  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setShowAdminPanel(false);
    setSession(null);
    setCompany(null);
    setCompanySetupComplete(false);
    setCurrentPage('dashboard');
    setCurrentView('list');
    setSelectedItem(null);
    setNavigationData(null);
    window.history.replaceState({}, '', '/');
    setTimeout(() => {
      window.location.reload();
    }, 0);
  };

  // Navigation helpers
  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page);
    setNavigationData(data);
    if (data?.action === 'create') {
      setCurrentView('form');
      setSelectedItem(null);
    } else if (data?.action === 'edit' || data?.action === 'view') {
      setCurrentView(data.action === 'edit' ? 'form' : 'view');
      setSelectedItem(data.customer || data.product || data.invoice);
    } else {
      setCurrentView('list');
      setSelectedItem(null);
    }
  };
  const handleBack = () => {
    setCurrentView('list');
    setSelectedItem(null);
    setNavigationData(null);
  };
  const handleSave = () => {
    setCurrentView('list');
    setSelectedItem(null);
    setNavigationData(null);
  };

  // Company setup completion
  const handleCompanySetupComplete = () => {
    setCompanySetupComplete(true);
    setCurrentPage('dashboard');
    // Optionally refetch company info
    if (session && session.user) {
      supabase
        .from('companies')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data: companyData }) => {
          setCompany(companyData);
        });
    }
  };

  // Main content rendering
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'customers':
        if (currentView === 'form') {
          return <CustomerForm customer={selectedItem} onSave={handleSave} onCancel={handleBack} />;
        }
        return <CustomerList onEdit={(customer: Customer) => { setSelectedItem(customer); setCurrentView('form'); }} onCreate={() => { setSelectedItem(null); setCurrentView('form'); }} />;
      case 'products':
        if (currentView === 'form') {
          return <ProductForm product={selectedItem} onSave={handleSave} onCancel={handleBack} />;
        }
        return <ProductList onEdit={(product: Product) => { setSelectedItem(product); setCurrentView('form'); }} onCreate={() => { setSelectedItem(null); setCurrentView('form'); }} />;
      case 'invoices':
        if (currentView === 'form') {
          return <InvoiceForm invoice={selectedItem} onSave={handleSave} onCancel={handleBack} />;
        } else if (currentView === 'view') {
          return <InvoiceView invoice={selectedItem} onEdit={() => setCurrentView('form')} onBack={handleBack} />;
        }
        return <InvoiceList onView={(invoice: Invoice) => { setSelectedItem(invoice); setCurrentView('view'); }} onEdit={(invoice: Invoice) => { setSelectedItem(invoice); setCurrentView('form'); }} onCreate={() => { setSelectedItem(null); setCurrentView('form'); }} initialAction={navigationData} />;
      case 'settings':
        return <div className="max-w-2xl mx-auto"><CompanySetup onComplete={handleCompanySetupComplete} /></div>;
      default:
        return null;
    }
  };

  // Routing and UI
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route
            path="/admin"
            element={
              showAdminPanel ? (
                <>
                  <Header currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
                  <AdminPanel />
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              session ? (
                <>
                  <Header currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
                  <Dashboard onNavigate={handleNavigate} />
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/"
            element={
              loading ? (
                <LoadingSpinner />
              ) : showAdminPanel ? (
                <Navigate to="/admin" />
              ) : !session ? (
                <AuthPage onAuthSuccess={() => window.location.reload()} setShowAdminPanel={setShowAdminPanel} />
              ) : !companySetupComplete ? (
                <>
                  <Header currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
                  <CompanySetup onComplete={handleCompanySetupComplete} />
                </>
              ) : (
                <>
                  <Header currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} />
                  {renderContent()}
                </>
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
