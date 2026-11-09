import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Search, User as UserIcon, Bell, Menu, X, Shield, ChevronDown, LogOut, Check } from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { currentUser, token, logout, switchRole, currentView, setCurrentView, cart, setIsCartOpen, notifications, markNotificationRead, settings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRoleDropdownOpen(false);
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const [demoAccounts, setDemoAccounts] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    label: string;
    badge: string;
  }>>([
    { id: 'u-1', name: 'Admin User', email: 'admin@thecakehouse.pk', phone: '+92 300 1234567', role: 'admin', label: 'Admin (Business Operations)', badge: 'ADMIN' },
    { id: 'u-3', name: 'Ahmed Raza', email: 'cashier@thecakehouse.pk', phone: '+92 300 3344556', role: 'cashier', label: 'Cashier (Ahmed Raza)', badge: 'CASHIER' },
    { id: 'u-4', name: 'Chef Tariq', email: 'baker@thecakehouse.pk', phone: '+92 300 4455667', role: 'baker', label: 'Baker 1 (Chef Tariq)', badge: 'BAKER 1' },
    { id: 'u-1793516046112', name: 'Hammad', email: 'backer3@thecakehouse.pk', phone: '+92 300 8899001', role: 'baker', label: 'Baker 2 (Hammad)', badge: 'BAKER 2' },
    { id: 'u-5', name: 'Salman Ali', email: 'inventory@thecakehouse.pk', phone: '+92 300 5566778', role: 'inventory_manager', label: 'Inventory Manager (Salman Ali)', badge: 'INVENTORY' },
    { id: 'u-6', name: 'Bilal Raza', email: 'delivery@thecakehouse.pk', phone: '+92 300 6677889', role: 'delivery', label: 'Delivery Staff 1 (Bilal Raza)', badge: 'DELIVERY 1' },
    { id: 'u-1794061022419', name: 'umer hasan', email: 'delivery123@gmail.com', phone: '+92 344 0114925', role: 'delivery', label: 'Delivery Staff 2 (umer hasan)', badge: 'DELIVERY 2' },
    { id: 'u-2', name: 'Ayesha Khan', email: 'ayesha@gmail.com', phone: '+92 300 2233445', role: 'customer', label: 'Customer (Ayesha Khan)', badge: 'CUSTOMER' },
    { id: 'u-guest', name: 'Guest Visitor', email: 'guest@thecakehouse.pk', phone: '', role: 'guest', label: 'Guest Visitor (Browse Only)', badge: 'GUEST' }
  ]);

  useEffect(() => {
    fetch('/api/v1/auth/demo-accounts')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setDemoAccounts(data);
        }
      })
      .catch(() => {});
  }, []);

  const getAccountIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return '👑';
      case 'cashier': return '💳';
      case 'baker': return '👨‍🍳';
      case 'inventory_manager': return '📦';
      case 'delivery': return '🛵';
      case 'customer': return '🍰';
      default: return '👤';
    }
  };

  const getAccountView = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'admin-dashboard';
      case 'cashier': return 'pos';
      case 'baker': return 'baker';
      case 'inventory_manager': return 'inventory-portal';
      case 'delivery': return 'delivery';
      case 'customer': return 'customer-portal';
      default: return 'home';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F2] border-b border-[#E8E0D9] shadow-xs">
        {/* Role Switcher & Announcement Bar */}
        <div className="bg-[#762F3D] text-white px-3 sm:px-4 py-1.5 text-xs font-medium flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <span className="bg-[#C5A46D] text-[#302725] px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shrink-0">Pakistan</span>
            <span className="truncate max-w-[200px] sm:max-w-none">Free delivery in Lahore on orders above Rs. {(settings.freeDeliveryThreshold ?? 3500).toLocaleString()}! 🎂</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 relative">
            <div className="hidden sm:flex items-center gap-1.5 text-[#F3E6DF]">
              <Shield className="w-3.5 h-3.5 text-[#C5A46D]" />
              <span>Active Role:</span>
            </div>
            <div ref={roleDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="bg-[#5F2030] hover:bg-[#4A1723] text-white px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 border border-[#C5A46D]/40 transition shadow-2xs cursor-pointer select-none"
              >
                <span>{getAccountIcon(currentUser.role)}</span>
                <span className="capitalize text-[11px] sm:text-xs max-w-[120px] truncate">{currentUser.name || currentUser.role.replace('_', ' ')}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#C5A46D] transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              
              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-[calc(100vw-2rem)] sm:w-64 max-w-xs bg-white text-[#302725] rounded-2xl shadow-2xl border border-[#E8E0D9] py-1.5 z-50 dropdown-animate-down overflow-hidden"
                  style={{ transformOrigin: 'top right' }}
                >
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#80736F] border-b border-[#E8E0D9]/80 bg-[#FAF7F2] flex justify-between items-center">
                    <span>Switch Testing Identity</span>
                    <span className="text-[9px] bg-[#762F3D]/10 text-[#762F3D] px-1.5 py-0.5 rounded font-mono">DEV MODE</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E8E0D9]/40">
                    {demoAccounts.map(acc => {
                      const isActive = currentUser.id === acc.id || currentUser.email === acc.email;
                      return (
                        <button
                          key={`${acc.id}-${acc.email}`}
                          type="button"
                          onClick={() => {
                            switchRole(acc.role, { userId: acc.id, email: acc.email, name: acc.name });
                            setRoleDropdownOpen(false);
                            setCurrentView(getAccountView(acc.role));
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-[#FAF7F2] transition cursor-pointer ${
                            isActive ? 'bg-[#762F3D]/10 font-bold text-[#762F3D]' : 'text-[#302725]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm">{getAccountIcon(acc.role)}</span>
                            <div className="truncate">
                              <p className="truncate font-medium">{acc.label}</p>
                              <p className="text-[10px] text-[#80736F] truncate">{acc.email}</p>
                            </div>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#762F3D] stroke-[2.5] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {currentUser.role !== 'admin' && (
                    <div className="p-2 border-t border-[#E8E0D9] bg-[#FAF7F2]">
                      <button
                        type="button"
                        onClick={() => {
                          const adminAcc = demoAccounts.find(a => a.role === 'admin');
                          switchRole('admin', adminAcc ? { userId: adminAcc.id, email: adminAcc.email, name: adminAcc.name } : undefined);
                          setRoleDropdownOpen(false);
                          setCurrentView('admin-dashboard');
                        }}
                        className="w-full bg-[#762F3D] hover:bg-[#5F2030] text-white py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                      >
                        <Shield className="w-3 h-3 text-[#C5A46D]" />
                        <span>Return to Admin Account</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#762F3D] flex items-center justify-center text-[#C5A46D] font-serif font-bold text-xl sm:text-2xl shadow-md border-2 border-[#C5A46D] shrink-0">
              {settings.bakeryName ? settings.bakeryName.trim().charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#302725] leading-tight">
                {settings.bakeryName || 'The Cake House'}
              </h1>
              <p className="text-[9px] sm:text-xs tracking-widest uppercase text-[#80736F]">
                {settings.tagline || 'Artisan Bakery • Pakistan'}
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-[#302725]">
            <button
              onClick={() => setCurrentView('home')}
              className={`transition hover:text-[#762F3D] ${currentView === 'home' ? 'text-[#762F3D] font-bold border-b-2 border-[#762F3D] pb-1' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('products')}
              className={`transition hover:text-[#762F3D] ${currentView === 'products' || currentView === 'product-detail' ? 'text-[#762F3D] font-bold border-b-2 border-[#762F3D] pb-1' : ''}`}
            >
              Products
            </button>
            <button
              onClick={() => setCurrentView('custom-cake')}
              className={`transition hover:text-[#762F3D] ${currentView === 'custom-cake' ? 'text-[#762F3D] font-bold border-b-2 border-[#762F3D] pb-1' : ''}`}
            >
              Custom Cakes
            </button>
            <button
              onClick={() => setCurrentView('about')}
              className={`transition hover:text-[#762F3D] ${currentView === 'about' ? 'text-[#762F3D] font-bold border-b-2 border-[#762F3D] pb-1' : ''}`}
            >
              About Us
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className={`transition hover:text-[#762F3D] ${currentView === 'contact' ? 'text-[#762F3D] font-bold border-b-2 border-[#762F3D] pb-1' : ''}`}
            >
              Contact
            </button>

            {/* Role Based Navigation Quick Links */}
            {currentUser.role === 'admin' ? (
              <button
                onClick={() => setCurrentView('admin-dashboard')}
                className={`transition text-[#762F3D] font-semibold flex items-center gap-1 ${currentView === 'admin-dashboard' ? 'underline' : ''}`}
              >
                Admin
              </button>
            ) : null}
            {currentUser.role === 'cashier' ? (
              <button
                onClick={() => setCurrentView('pos')}
                className={`transition text-[#762F3D] font-semibold ${currentView === 'pos' ? 'underline' : ''}`}
              >
                POS
              </button>
            ) : null}
            {currentUser.role === 'baker' ? (
              <button
                onClick={() => setCurrentView('baker')}
                className={`transition text-[#762F3D] font-semibold ${currentView === 'baker' ? 'underline' : ''}`}
              >
                Production
              </button>
            ) : null}
            {currentUser.role === 'inventory_manager' ? (
              <button
                onClick={() => setCurrentView('inventory-portal')}
                className={`transition text-[#762F3D] font-semibold ${currentView === 'inventory-portal' ? 'underline' : ''}`}
              >
                Inventory
              </button>
            ) : null}
            {currentUser.role === 'delivery' ? (
              <button
                onClick={() => setCurrentView('delivery')}
                className={`transition text-[#762F3D] font-semibold ${currentView === 'delivery' ? 'underline' : ''}`}
              >
                Deliveries
              </button>
            ) : null}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('products')}
              className="p-2 text-[#302725] hover:text-[#762F3D] transition hidden sm:block"
              title="Search Products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 text-[#302725] hover:text-[#762F3D] transition relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#762F3D] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-[#E8E0D9] py-3 z-50">
                  <div className="px-4 pb-2 border-b border-[#E8E0D9] flex justify-between items-center">
                    <h4 className="font-serif font-bold text-sm text-[#302725]">Notifications</h4>
                    <span className="text-xs text-[#762F3D] font-medium">{unreadCount} new</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E8E0D9]">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 text-xs hover:bg-[#FAF7F2] transition cursor-pointer ${!n.read ? 'bg-[#F3E6DF]/30' : ''}`}
                      >
                        <div className="font-semibold text-[#302725] flex justify-between">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-[#80736F]">{n.createdAt}</span>
                        </div>
                        <p className="text-[#80736F] mt-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-[#762F3D] text-white p-2.5 rounded-full hover:bg-[#5F2030] transition shadow-md flex items-center justify-center"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#C5A46D]" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C5A46D] text-[#302725] text-xs font-bold rounded-full flex items-center justify-center shadow">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* User Account / Auth */}
            {token ? (
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-[#E8E0D9]">
                <button
                  onClick={() => {
                    if (currentUser.role === 'customer') setCurrentView('customer-portal');
                    else if (currentUser.role === 'admin') setCurrentView('admin-dashboard');
                    else setCurrentView('customer-portal');
                  }}
                  className="flex items-center gap-2 text-[#302725] hover:text-[#762F3D] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#F3E6DF] flex items-center justify-center text-[#762F3D] font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-[#80736F] capitalize">{currentUser.role}</div>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-red-600 hover:text-red-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#E8E0D9]">
                <button
                  onClick={() => setCurrentView('login')}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${
                    currentView === 'login'
                      ? 'text-[#762F3D] bg-[#FAF7F2]'
                      : 'text-[#302725] hover:text-[#762F3D]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#302725] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu (Full Responsive Drawer/Dropdown) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E8E0D9] px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Authenticated User Header on Mobile */}
            {token && currentUser && (
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#762F3D] text-[#C5A46D] font-bold text-sm flex items-center justify-center font-serif shadow-xs shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-[#302725] leading-snug truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-[#80736F] capitalize truncate">{currentUser.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#762F3D]/10 text-[#762F3D] uppercase shrink-0">
                  {currentUser.role}
                </span>
              </div>
            )}

            {/* Public Navigation Links */}
            <div className="space-y-1">
              <button
                onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-between ${
                  currentView === 'home' ? 'bg-[#762F3D] text-white' : 'text-[#302725] hover:bg-[#FAF7F2]'
                }`}
              >
                <span>Home</span>
              </button>

              <button
                onClick={() => { setCurrentView('products'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-between ${
                  currentView === 'products' || currentView === 'product-detail' ? 'bg-[#762F3D] text-white' : 'text-[#302725] hover:bg-[#FAF7F2]'
                }`}
              >
                <span>Products Catalog</span>
              </button>

              <button
                onClick={() => { setCurrentView('custom-cake'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-between ${
                  currentView === 'custom-cake' ? 'bg-[#762F3D] text-white' : 'text-[#302725] hover:bg-[#FAF7F2]'
                }`}
              >
                <span>Custom Cakes</span>
              </button>

              <button
                onClick={() => { setCurrentView('about'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-between ${
                  currentView === 'about' ? 'bg-[#762F3D] text-white' : 'text-[#302725] hover:bg-[#FAF7F2]'
                }`}
              >
                <span>About Us</span>
              </button>

              <button
                onClick={() => { setCurrentView('contact'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-between ${
                  currentView === 'contact' ? 'bg-[#762F3D] text-white' : 'text-[#302725] hover:bg-[#FAF7F2]'
                }`}
              >
                <span>Contact & Locations</span>
              </button>
            </div>

            {/* Portal Jump Links for Staff & Admin */}
            {token && (
              <div className="pt-2 border-t border-[#E8E0D9] space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#80736F]">
                  Your Dedicated Workspace
                </div>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => { setCurrentView('admin-dashboard'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#762F3D] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                  >
                    <span>👑 Admin Operations Panel</span>
                  </button>
                )}
                {currentUser.role === 'baker' && (
                  <button
                    onClick={() => { setCurrentView('baker'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#762F3D] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                  >
                    <span>👨‍🍳 Baker Kitchen Portal</span>
                  </button>
                )}
                {currentUser.role === 'cashier' && (
                  <button
                    onClick={() => { setCurrentView('pos'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#762F3D] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                  >
                    <span>💳 POS Cashier Register</span>
                  </button>
                )}
                {currentUser.role === 'inventory_manager' && (
                  <button
                    onClick={() => { setCurrentView('inventory-portal'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#762F3D] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                  >
                    <span>📦 Inventory Management</span>
                  </button>
                )}
                {currentUser.role === 'delivery' && (
                  <button
                    onClick={() => { setCurrentView('delivery'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#762F3D] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                  >
                    <span>🛵 Delivery Courier Portal</span>
                  </button>
                )}
                <button
                  onClick={() => { setCurrentView('customer-portal'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#302725] hover:bg-[#FAF7F2] flex items-center gap-2 cursor-pointer"
                >
                  <span>🍰 Customer Portal</span>
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {!token && (
              <div className="pt-2 border-t border-[#E8E0D9] flex gap-2">
                <button
                  onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-xl text-xs font-bold text-[#302725] transition cursor-pointer text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setCurrentView('register'); setMobileMenuOpen(false); }}
                  className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-2.5 rounded-xl text-xs font-bold transition shadow cursor-pointer text-center"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};
