import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateOrder from './pages/CreateOrder';
import Quotes from './pages/Quotes';
import Customers from './pages/Customers';
import ProductCatalog from './pages/ProductCatalog';
import Templates from './pages/Templates';
import Users from './pages/Users';
import Teams from './pages/Teams';
import DocumentsDeal from './pages/DocumentsDeal';
import Margin from './pages/Margin';
import LeadsPipeline from './pages/crm/LeadsPipeline';
import DealDetail from './pages/crm/DealDetail';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Workspace Layout */}
              <Route path="/" element={<Layout />}>
                {/* Default dashboard redirect */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="create-order" element={<CreateOrder />} />
                <Route path="quotes/:quoteId/edit" element={<CreateOrder />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="crm" element={<LeadsPipeline />} />
                <Route path="crm/deals/:id" element={<DealDetail />} />
                <Route path="customers" element={<Customers />} />
                <Route path="products" element={<ProductCatalog />} />
                <Route path="templates" element={<Templates />} />
                <Route path="users" element={<Users />} />
                
                {/* New Admin Routes */}
                <Route path="margin" element={<Margin />} />
                <Route path="documents-deal" element={<DocumentsDeal />} />
                <Route path="teams" element={<Teams />} />
                <Route path="agents" element={<Users />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}
