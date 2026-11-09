/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { Toast } from './components/Toast';

import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CustomCakePage } from './pages/CustomCakePage';
import { CustomerPortal } from './pages/CustomerPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { PosPage } from './pages/PosPage';
import { BakerProductionPage } from './pages/BakerProductionPage';
import { InventoryManagerPage } from './pages/InventoryManagerPage';
import { DeliveryManagementPage } from './pages/DeliveryManagementPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const MainContent: React.FC = () => {
  const { currentView, setCurrentView, currentUser } = useApp();

  // Scroll to top instantly whenever the active page view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView]);

  // Strict Role-Based Access Control (RBAC) Guard for Employee Portals
  useEffect(() => {
    const role = currentUser?.role || 'guest';
    const roleViewMap: Record<string, string[]> = {
      admin: ['admin-dashboard', 'pos', 'baker', 'inventory-portal', 'delivery', 'home', 'products', 'product-detail', 'custom-cake', 'customer-portal', 'about', 'contact', 'login', 'register'],
      cashier: ['pos', 'home', 'products', 'product-detail', 'about', 'contact', 'login', 'register'],
      baker: ['baker', 'home', 'products', 'product-detail', 'about', 'contact', 'login', 'register'],
      inventory_manager: ['inventory-portal', 'home', 'products', 'product-detail', 'about', 'contact', 'login', 'register'],
      delivery: ['delivery', 'home', 'products', 'product-detail', 'about', 'contact', 'login', 'register'],
      customer: ['customer-portal', 'home', 'products', 'product-detail', 'custom-cake', 'about', 'contact', 'login', 'register'],
      guest: ['home', 'products', 'product-detail', 'custom-cake', 'about', 'contact', 'login', 'register']
    };

    const allowed = roleViewMap[role] || roleViewMap.guest;
    if (!allowed.includes(currentView)) {
      if (role === 'admin') setCurrentView('admin-dashboard');
      else if (role === 'cashier') setCurrentView('pos');
      else if (role === 'baker') setCurrentView('baker');
      else if (role === 'inventory_manager') setCurrentView('inventory-portal');
      else if (role === 'delivery') setCurrentView('delivery');
      else if (role === 'customer') setCurrentView('customer-portal');
      else setCurrentView('home');
    }
  }, [currentView, currentUser?.role]);

  const isEmployeePortal = [
    'delivery',
    'pos',
    'baker',
    'inventory-portal'
  ].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#302725] font-sans">
      {!isEmployeePortal && <Navbar />}
      <main className="flex-1 w-full min-w-0">
        {currentView === 'home' && <HomePage />}
        {currentView === 'products' && <ProductsPage />}
        {currentView === 'product-detail' && <ProductDetailPage />}
        {currentView === 'custom-cake' && <CustomCakePage />}
        {currentView === 'customer-portal' && <CustomerPortal />}
        {currentView === 'admin-dashboard' && <AdminDashboard />}
        {currentView === 'pos' && <PosPage />}
        {currentView === 'baker' && <BakerProductionPage />}
        {currentView === 'inventory-portal' && <InventoryManagerPage />}
        {currentView === 'delivery' && <DeliveryManagementPage />}
        {currentView === 'about' && <AboutPage />}
        {currentView === 'contact' && <ContactPage />}
        {currentView === 'login' && <LoginPage />}
        {currentView === 'register' && <RegisterPage />}
      </main>
      {!isEmployeePortal && <Footer />}
      {!isEmployeePortal && <CartDrawer />}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
