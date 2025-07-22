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
import { Customer, Product, Invoice } from './types';
import LoadingSpinner from './components/UI/LoadingSpinner';
import { Session } from '@supabase/supabase-js'; // Add this import
import './print.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentView, setCurrentView] = useState<string>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [navigationData, setNavigationData] = useState<any>(null);
  const [companySetupComplete, setCompanySetupComplete] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null); // Fix type here

  // Fetch session and company info
  useEffect(() => {
    const fetchSessionAndCompany = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session && session.user) {
        // Fetch company for this user
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', session.user.id)
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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setSession(session);
        // Refetch company on auth change
        if (session && session.user) {
          supabase
            .from('companies')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data: companyData }) => {
              setCompany(companyData);
              setCompanySetupComplete(!!companyData);
            });
        } else {
          setCompany(null);
          setCompanySetupComplete(false);
        }
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleCompanySetupComplete = () => {
    setCompanySetupComplete(true);
    setCurrentPage('dashboard');
    // Refetch company info after setup
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

  // 1. Show loading spinner if loading
  if (loading) {
    return <LoadingSpinner />;
  }

  // 2. Show login/register if not authenticated
  if (!session) {
    return <AuthPage onAuthSuccess={() => window.location.reload()} />;
  }

  // Only show company setup if company is NOT set up
  if (!companySetupComplete) {
    return <CompanySetup onComplete={handleCompanySetupComplete} />;
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
    <div className="min-h-screen bg-gray-100">
      <Header currentPage={currentPage} onPageChange={handlePageChange} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
