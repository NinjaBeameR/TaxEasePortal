//import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
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
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentView, setCurrentView] = useState<string>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [navigationData, setNavigationData] = useState<any>(null);
  const [companySetupComplete, setCompanySetupComplete] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Fetch session, company info, and user role
  useEffect(() => {
    const fetchSessionAndCompany = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session && session.user) {
        // Check for admin in the admin table
        const { data: adminData } = await supabase
          .from('admin')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (adminData) {
          setShowAdminPanel(true);
          setLoading(false);
          return;
        }

        // Fetch company info using user_id for normal users
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setCompany(companyData);
        setCompanySetupComplete(!!companyData);
        setShowAdminPanel(false);
      } else {
        setCompany(null);
        setCompanySetupComplete(false);
        setShowAdminPanel(false);
      }
      setLoading(false);
    };

    fetchSessionAndCompany();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setSession(session);
        // Check for admin in the admin table
        if (session && session.user) {
          supabase
            .from('admin')
            .select('*')
            .eq('email', session.user.email)
            .single()
            .then(({ data: adminData }) => {
              if (adminData) {
                setShowAdminPanel(true);
                return;
              }
              // Fetch company info for normal users
              supabase
                .from('companies')
                .select('*')
                .eq('user_id', session.user.id)
                .single()
                .then(({ data: companyData }) => {
                  setCompany(companyData);
                  setCompanySetupComplete(!!companyData);
                  setShowAdminPanel(false);
                });
            });
        } else {
          setCompany(null);
          setCompanySetupComplete(false);
          setShowAdminPanel(false);
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const { data: adminData } = await supabase
          .from('admin')
          .select('*')
          .eq('email', session.user.email)
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
    // Add your logout logic here (e.g., clear tokens, redirect, etc.)
    alert('Logged out!');
  }

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
        {/* Only show header if logged in */}
        {session && (
          <Header
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onLogout={handleLogout}
          />
        )}
        <main>
          <Routes>
            <Route path="/dashboard" element={renderContent()} />
            <Route path="/admin" element={showAdminPanel ? <AdminPanel /> : <div className="text-center text-red-600 font-bold">Access Denied: You are not an admin.</div>} />
            {/* Add other routes as needed */}
            <Route path="/" element={
              loading ? (
                <LoadingSpinner />
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
