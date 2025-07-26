//import React from 'react';


import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import AuthPage from './components/Auth/AuthPage';
import Header from './components/Layout/Header';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './print.css';
import CustomerList from './components/Customers/CustomerList';
import CustomerForm from './components/Customers/CustomerForm';
import ProductList from './components/Products/ProductList';
import ProductForm from './components/Products/ProductForm';
import CompanySetup from './components/Company/CompanySetup';
import InvoiceList from './components/Invoices/InvoiceList';
import InvoiceForm from './components/Invoices/InvoiceForm';
import InvoiceView from './components/Invoices/InvoiceView';
import { Invoice, Customer, Product } from './types';
import AdminPanel from './components/Admin/AdminPanel';
import { supabase } from './services/supabase';

function App() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true');
  const [customerToEdit, setCustomerToEdit] = useState<Customer | undefined>(undefined);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  const handleAuthSuccess = () => {
    setLoggedIn(true);
    localStorage.setItem('loggedIn', 'true');
    if (localStorage.getItem('isAdmin') === 'true') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
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
      <AppWithRouter
        handleLogout={handleLogout}
        customerToEdit={customerToEdit}
        setCustomerToEdit={setCustomerToEdit}
        productToEdit={productToEdit}
        setProductToEdit={setProductToEdit}
        invoiceToEdit={invoiceToEdit}
        setInvoiceToEdit={setInvoiceToEdit}
      />
    </BrowserRouter>
  );
}

// This component is now inside <BrowserRouter> so hooks are safe!
function AppWithRouter({
  handleLogout,
  customerToEdit,
  setCustomerToEdit,
  productToEdit,
  setProductToEdit,
  invoiceToEdit,
  setInvoiceToEdit,
}: any) {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show Header if not on /admin
  const HeaderWithRouter = () => {
    const currentPage = location.pathname.replace('/', '') || 'dashboard';
    return (
      <Header
        currentPage={currentPage}
        onPageChange={page => navigate('/' + page)}
        onLogout={handleLogout}
      />
    );
  };

  const MainRoutes = () => (
    <Routes>
      <Route path="/dashboard" element={<Dashboard onNavigate={() => {}} />} />
      <Route
        path="/invoices"
        element={
          <InvoiceList
            onView={invoice => {
              setInvoiceToEdit(invoice);
              navigate('/invoices/view');
            }}
            onEdit={invoice => {
              setInvoiceToEdit(invoice);
              navigate('/invoices/edit');
            }}
            onCreate={() => {
              setInvoiceToEdit(null);
              navigate('/invoices/new');
            }}
          />
        }
      />
      <Route
        path="/invoices/new"
        element={
          <InvoiceForm
            onSave={() => navigate('/invoices')}
            onCancel={() => navigate('/invoices')}
          />
        }
      />
      <Route
        path="/invoices/edit"
        element={
          <InvoiceForm
            invoice={invoiceToEdit!}
            onSave={() => {
              setInvoiceToEdit(null);
              navigate('/invoices');
            }}
            onCancel={() => {
              setInvoiceToEdit(null);
              navigate('/invoices');
            }}
          />
        }
      />
      <Route
        path="/invoices/view"
        element={<InvoiceView setInvoiceToEdit={setInvoiceToEdit} />}
      />
      <Route
        path="/customers"
        element={
          <CustomerList
            onEdit={customer => {
              setCustomerToEdit(customer);
              navigate('/customers/edit');
            }}
            onCreate={() => {
              setCustomerToEdit(undefined);
              navigate('/customers/new');
            }}
          />
        }
      />
      <Route
        path="/customers/new"
        element={
          <CustomerForm
            customer={undefined}
            onSave={() => navigate('/customers')}
            onCancel={() => navigate('/customers')}
          />
        }
      />
      <Route
        path="/customers/edit"
        element={
          <CustomerForm
            customer={customerToEdit}
            onSave={() => {
              setCustomerToEdit(undefined);
              navigate('/customers');
            }}
            onCancel={() => {
              setCustomerToEdit(undefined);
              navigate('/customers');
            }}
          />
        }
      />
      <Route
        path="/products"
        element={
          <ProductList
            onEdit={product => {
              setProductToEdit(product);
              navigate('/products/edit');
            }}
            onCreate={() => {
              setProductToEdit(undefined);
              navigate('/products/new');
            }}
          />
        }
      />
      <Route
        path="/products/new"
        element={
          <ProductForm
            product={undefined}
            onSave={() => navigate('/products')}
            onCancel={() => navigate('/products')}
          />
        }
      />
      <Route
        path="/products/edit"
        element={
          <ProductForm
            product={productToEdit}
            onSave={() => {
              setProductToEdit(undefined);
              navigate('/products');
            }}
            onCancel={() => {
              setProductToEdit(undefined);
              navigate('/products');
            }}
          />
        }
      />
      <Route
        path="/settings"
        element={<CompanySetup onComplete={() => navigate('/dashboard')} />}
      />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );

  return (
    <>
      {location.pathname !== '/admin' && <HeaderWithRouter />}
      <MainRoutes />
    </>
  );
}

function useSupabaseUser() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return user;
}

export default App; //ignore this comment