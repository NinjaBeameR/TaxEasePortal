//import React from 'react';


import { useState } from 'react';
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

function App() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true');
  const [customerToEdit, setCustomerToEdit] = useState<Customer | undefined>(undefined);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);

  // Invoice state
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);

  const handleAuthSuccess = () => {
    setLoggedIn(true);
    localStorage.setItem('loggedIn', 'true');
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.removeItem('loggedIn');
  };

  // Header that works with router
  const HeaderWithRouter = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPage = location.pathname.replace('/', '') || 'dashboard';
    return (
      <Header
        currentPage={currentPage}
        onPageChange={page => navigate('/' + page)}
        onLogout={handleLogout}
      />
    );
  };

  if (!loggedIn) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <BrowserRouter>
      <HeaderWithRouter />
      <Routes>
        <Route path="/dashboard" element={<Dashboard onNavigate={() => {}} />} />

        {/* Invoices List, Form, and View */}
        <Route
          path="/invoices"
          element={
            <InvoiceList
              onView={invoice => {
                setInvoiceToView(invoice);
                window.location.href = '/invoices/view';
              }}
              onEdit={invoice => {
                setInvoiceToEdit(invoice);
                window.location.href = '/invoices/edit';
              }}
              onCreate={() => {
                setInvoiceToEdit(null);
                window.location.href = '/invoices/new';
              }}
            />
          }
        />
        <Route
          path="/invoices/new"
          element={
            <InvoiceForm
              onSave={() => window.location.href = '/invoices'}
              onCancel={() => window.location.href = '/invoices'}
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
                window.location.href = '/invoices';
              }}
              onCancel={() => {
                setInvoiceToEdit(null);
                window.location.href = '/invoices';
              }}
            />
          }
        />
        <Route
          path="/invoices/view"
          element={
            invoiceToView ? (
              <InvoiceView
                invoice={invoiceToView}
                onEdit={() => {
                  setInvoiceToEdit(invoiceToView);
                  setInvoiceToView(null);
                  window.location.href = '/invoices/edit';
                }}
                onBack={() => {
                  setInvoiceToView(null);
                  window.location.href = '/invoices';
                }}
              />
            ) : (
              <Navigate to="/invoices" />
            )
          }
        />

        {/* Customers List and Form */}
        <Route
          path="/customers"
          element={
            <CustomerList
              onEdit={customer => {
                setCustomerToEdit(customer);
                window.location.href = '/customers/edit';
              }}
              onCreate={() => {
                setCustomerToEdit(undefined);
                window.location.href = '/customers/new';
              }}
            />
          }
        />
        <Route
          path="/customers/new"
          element={
            <CustomerForm
              customer={undefined}
              onSave={() => window.location.href = '/customers'}
              onCancel={() => window.location.href = '/customers'}
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
                window.location.href = '/customers';
              }}
              onCancel={() => {
                setCustomerToEdit(undefined);
                window.location.href = '/customers';
              }}
            />
          }
        />

        {/* Products List and Form */}
        <Route
          path="/products"
          element={
            <ProductList
              onEdit={product => {
                setProductToEdit(product);
                window.location.href = '/products/edit';
              }}
              onCreate={() => {
                setProductToEdit(undefined);
                window.location.href = '/products/new';
              }}
            />
          }
        />
        <Route
          path="/products/new"
          element={
            <ProductForm
              product={undefined}
              onSave={() => window.location.href = '/products'}
              onCancel={() => window.location.href = '/products'}
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
                window.location.href = '/products';
              }}
              onCancel={() => {
                setProductToEdit(undefined);
                window.location.href = '/products';
              }}
            />
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <CompanySetup
              onComplete={() => window.location.href = '/dashboard'}
            />
          }
        />

        {/* Default route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
