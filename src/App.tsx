//import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentView, setCurrentView] = useState<string>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [navigationData, setNavigationData] = useState<any>(null);
  const [companySetupComplete, setCompanySetupComplete] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    // If admin, skip Supabase Auth and stop loading
    if (localStorage.getItem('isAdmin') === 'true') {
      setLoading(false);
      setSession(null);
      return;
    }
    // Otherwise, check Supabase Auth for normal users
    const fetchSessionAndCompany = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setSession(user ? { user } : null);

      if (user && user.email) {
        // Fetch company info for normal users
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setCompany(companyData);
        setCompanySetupComplete(!!companyData);
      } else {
        setCompany(null);
        setCompanySetupComplete(false);
      }
      setLoading(false);
    };
    fetchSessionAndCompany();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data: adminData } = await supabase
          .from('admin')
          .select('*')
          .ilike('email', user.email.trim())
          .single();
        setShowAdminPanel(!!adminData);
      } else {
        setShowAdminPanel(false);
      }
    };
    checkAdmin();
  }, []);

  const handleCompanySetupComplete = () => {
    setCompanySetupComplete(true);
    setCurrentPage('dashboard');
    // Refetch user and company info after setup
    if (session && session.user) {
      supabase
        .from('users')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
        .then(async ({ data: userData }) => {
          if (userData?.company_id) {
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('id', userData.company_id)
              .single();
            setCompany(companyData);
          }
        });
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setCurrentView('list');
    setSelectedItem(null);
    setNavigationData(null);
  };

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page);
    setNavigationData(data);
    
    if (data?.action === 'create') {
      setCurrentView('form');
      setSelectedItem(null);
    } else if (data?.action === 'edit' || data?.action === 'view') {
      setCurrentView(data.action === 'edit' ? 'form' : 'view');
      setSelectedItem(data.customer || data.product || data.invoice);
   
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

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setShowAdminPanel(false);
    setSession(null);
    setCompany(null);
    setCompanySetupComplete(false);
    window.location.href = '/';
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      
      case 'customers':
        if (currentView === 'form') {
          return (
            <CustomerForm
              customer={selectedItem}
              onSave={handleSave}
              onCancel={handleBack}
            />
          );
        }
        return (
          <CustomerList
            onEdit={(customer: Customer) => {
              setSelectedItem(customer);
              setCurrentView('form');
            }}
            onCreate={() => {
              setSelectedItem(null);
              setCurrentView('form');
            }}
          />
        );
      
      case 'products':
        if (currentView === 'form') {
          return (
            <ProductForm
              product={selectedItem}
              onSave={handleSave}
              onCancel={handleBack}
            />
          );
        }
        return (
          <ProductList
            onEdit={(product: Product) => {
              setSelectedItem(product);
              setCurrentView('form');
            }}
            onCreate={() => {
              setSelectedItem(null);
              setCurrentView('form');
            }}
          />
        );
      
      case 'invoices':
        if (currentView === 'form') {
          return (
            <InvoiceForm
              invoice={selectedItem}
              onSave={handleSave}
              onCancel={handleBack}
            />
          );
        } else if (currentView === 'view') {
          return (
            <InvoiceView
              invoice={selectedItem}
              onEdit={() => setCurrentView('form')}
              onBack={handleBack}
            />
          );
        }
        return (
          <InvoiceList
            onView={(invoice: Invoice) => {
              setSelectedItem(invoice);
              setCurrentView('view');
            }}
            onEdit={(invoice: Invoice) => {
              setSelectedItem(invoice);
              setCurrentView('form');
            }}
            onCreate={() => {
              setSelectedItem(null);
              setCurrentView('form');
            }}
            initialAction={navigationData}
          />
        );
      
      case 'settings':
        return (
          <div className="max-w-2xl mx-auto">
            <CompanySetup onComplete={() => setCurrentPage('dashboard')} />
          </div>
        );
      
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Header
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLogout={handleLogout}
        />
        <main>
          <Routes>
            <Route path="/admin" element={showAdminPanel ? <AdminPanel /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={<Dashboard onNavigate={handleNavigate} />} />
            <Route path="/" element={
              loading ? (
                <LoadingSpinner />
              ) : showAdminPanel ? (
                <Navigate to="/admin" />
              ) : !session ? (
                <AuthPage onAuthSuccess={() => window.location.reload()} setShowAdminPanel={setShowAdminPanel} />
              ) : !companySetupComplete ? (
                <CompanySetup onComplete={handleCompanySetupComplete} />
              ) : (
                renderContent()
              )
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
