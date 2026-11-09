import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Check,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Shield
} from 'lucide-react';
import { UserRole } from '../types';

export interface PortalSidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeColor?: string;
  onClick?: () => void;
  danger?: boolean;
}

export interface PortalSidebarSection {
  title?: string;
  items: PortalSidebarItem[];
}

interface PortalLayoutProps {
  portalName: string;
  portalSubtitle?: string;
  portalBadge?: string;
  sidebarSections: PortalSidebarSection[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  headerActions?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  portalName,
  portalSubtitle,
  portalBadge = 'Active Session',
  sidebarSections,
  activeTab,
  onTabChange,
  headerActions,
  compact,
  children
}) => {
  const { currentUser, logout, notifications, markNotificationRead, settings, setCurrentView, switchRole } = useApp();

  const isCompact = compact || portalName === 'Delivery Portal';

  // Desktop sidebar collapse state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('th_portal_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile sidebar drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);

  // Profile dropdown menu state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Notifications popover state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Role Switcher dropdown state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Profile Modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Save collapsed state
  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('th_portal_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setNotifOpen(false);
        setRoleDropdownOpen(false);
        setMobileOpen(false);
        setProfileModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read);

  // Helper for human-readable role display
  const roleDisplay = currentUser.role
    ? currentUser.role.replace(/_/g, ' ')
    : 'Staff Member';

  // Helper for initials
  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map(p => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'TH';

  // Logout action handler
  const handleLogout = () => {
    logout();
    setCurrentView('home');
  };

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
    { id: 'u-2', name: 'Ayesha Khan', email: 'ayesha@gmail.com', phone: '+92 300 2233445', role: 'customer', label: 'Customer (Ayesha Khan)', badge: 'CUSTOMER' }
  ]);

  useEffect(() => {
    fetch('/api/v1/auth/demo-accounts')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setDemoAccounts(data.filter((a: any) => a.role !== 'guest'));
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

  // Find active label & section
  let activeItemLabel = '';
  let activeSectionTitle = '';
  for (const sec of sidebarSections) {
    const found = sec.items.find(i => i.id === activeTab);
    if (found) {
      activeItemLabel = found.label;
      activeSectionTitle = sec.title || '';
      break;
    }
  }

  // Render sidebar item button
  const renderSidebarItem = (item: PortalSidebarItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isLogout = item.danger || item.id === 'logout';

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          if (item.id === 'account_profile') {
            setProfileModalOpen(true);
          } else if (item.id === 'account_notifications') {
            setNotifOpen(prev => !prev);
          } else if (item.onClick) {
            item.onClick();
          } else if (isLogout) {
            handleLogout();
          } else {
            onTabChange(item.id);
          }
          setMobileOpen(false);
        }}
        className={`w-full text-left text-xs transition-all duration-150 cursor-pointer select-none group relative ${
          isCompact
            ? isCollapsed
              ? 'justify-center p-2 rounded-xl'
              : 'justify-between px-2.5 py-1.5 rounded-xl font-medium'
            : isCollapsed
            ? 'justify-center p-3 rounded-2xl'
            : 'justify-between px-3.5 py-2.5 rounded-2xl font-semibold'
        } ${
          isActive
            ? 'bg-[#762F3D] text-white shadow-2xs font-semibold'
            : isLogout
            ? 'text-red-700 hover:bg-red-50 hover:text-red-800'
            : 'text-[#302725] hover:bg-[#FAF7F2] hover:text-[#762F3D]'
        }`}
      >
        <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive
                ? 'text-white'
                : isLogout
                ? 'text-red-600 group-hover:text-red-700'
                : 'text-[#762F3D]'
            }`}
          />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsed && item.badge !== undefined && item.badge !== null && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-2 shrink-0 ${
              isActive
                ? 'bg-white/20 text-white'
                : item.badgeColor || 'bg-[#FAF7F2] text-[#80736F]'
            }`}
          >
            {item.badge}
          </span>
        )}

        {/* Collapsed icon mode tooltip */}
        {isCollapsed && (
          <div className="hidden group-hover:flex absolute left-full ml-2 px-2.5 py-1.5 bg-[#302725] text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none items-center gap-2">
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== null && (
              <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded-full font-bold">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </button>
    );
  };

  // Sidebar contents markup (used in both desktop sticky & mobile drawer)
  const sidebarContent = (
    <div className="flex flex-col h-full w-full">
      {/* Brand & Portal Header */}
      <div className={`border-b border-[#E8E0D9] flex items-center justify-between ${
        isCompact ? 'p-3' : 'p-4'
      } ${isCollapsed ? 'justify-center' : ''}`}>
        <div className={`flex items-center min-w-0 ${
          isCompact ? 'gap-2.5' : 'gap-3'
        } ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`bg-[#762F3D] text-[#C5A46D] flex items-center justify-center font-serif font-black shadow-xs shrink-0 border border-[#C5A46D]/30 ${
            isCompact ? 'w-8 h-8 rounded-xl text-sm' : 'w-9 h-9 rounded-2xl text-base'
          }`}>
            CH
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className={`font-serif font-black tracking-wide text-[#302725] block truncate ${
                isCompact ? 'text-xs' : 'text-sm'
              }`}>
                {settings.bakeryName || 'The Cake House'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#762F3D] block truncate">
                {portalName}
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-xl text-[#80736F] hover:bg-[#FAF7F2] hover:text-[#302725] shrink-0"
          title="Close Navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${
        isCompact ? 'p-2.5 space-y-3' : 'p-3 space-y-4'
      }`}>
        {sidebarSections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {section.title && !isCollapsed && (
              <div className={`text-[9px] font-bold uppercase tracking-wider text-[#80736F] ${
                isCompact ? 'px-2.5 pt-1.5 pb-1' : 'px-3 pt-2 pb-1'
              }`}>
                {section.title}
              </div>
            )}
            {section.title && isCollapsed && (
              <div className="my-1.5 border-t border-[#E8E0D9]/70" />
            )}
            <div className="space-y-0.5">
              {section.items.map(item => renderSidebarItem(item))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer with Collapse Toggle on Desktop */}
      <div className={`border-t border-[#E8E0D9] bg-[#FAF7F2]/60 ${
        isCompact ? 'p-2.5 rounded-b-2xl' : 'p-3 rounded-b-3xl'
      }`}>
        <button
          type="button"
          onClick={toggleCollapse}
          className={`hidden lg:flex items-center rounded-lg text-xs font-semibold text-[#80736F] hover:text-[#302725] hover:bg-white p-2 transition w-full ${
            isCollapsed ? 'justify-center' : 'gap-2 px-2.5'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4 text-[#762F3D]" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 text-[#762F3D]" />
              <span className="text-xs">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#302725] flex flex-col w-full overflow-x-hidden">

      {/* ============================================================== */}
      {/* 1. DEDICATED EMPLOYEE DASHBOARD STICKY HEADER                   */}
      {/* Contains Logo, Portal Title, Notifications, Profile, Logout     */}
      {/* NO public links (Home, Products, Custom Cakes, About, Contact)  */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8E0D9] shadow-2xs w-full">
        <div className={`w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 ${
          isCompact ? 'h-14 sm:h-15' : 'h-16 sm:h-20'
        }`}>
          
          {/* Left: Mobile Toggle + Logo + Portal Title + Status Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Mobile Drawer Trigger (lg:hidden) */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#E8E0D9] text-[#302725] hover:bg-[#FAF7F2] transition shrink-0 cursor-pointer"
              aria-label="Open portal navigation menu"
            >
              <Menu className="w-5 h-5 text-[#762F3D]" />
            </button>

            {/* Cake House Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className={`rounded-xl bg-[#762F3D] text-[#C5A46D] flex items-center justify-center font-serif font-black shadow-2xs border border-[#C5A46D]/30 shrink-0 ${
                isCompact ? 'w-8 h-8 text-base' : 'w-9 h-9 sm:w-10 sm:h-10 text-lg sm:text-xl rounded-2xl'
              }`}>
                CH
              </div>
              <div className="hidden sm:block">
                <span className={`font-serif font-black tracking-wide text-[#302725] block leading-tight ${
                  isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                }`}>
                  {settings.bakeryName || 'The Cake House'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#762F3D] block">
                  Employee Portal
                </span>
              </div>
            </div>

            <div className="hidden md:block h-5 w-px bg-[#E8E0D9] mx-1 shrink-0" />

            {/* Portal Title & Live Badge */}
            <div className="min-w-0 flex items-center gap-2">
              <h1 className={`font-serif font-bold text-[#302725] truncate ${
                isCompact ? 'text-sm sm:text-base' : 'text-base sm:text-xl'
              }`}>
                {portalName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 bg-[#762F3D]/10 text-[#762F3D] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {portalBadge}
              </span>
            </div>
          </div>

          {/* Right: Actions, Role Switcher, Notifications, Employee Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {headerActions}

            {/* Demo Role Switcher Dropdown */}
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E0D9] bg-[#FAF7F2] text-[#302725] hover:bg-[#EFEAE3] text-xs font-semibold transition cursor-pointer select-none"
                title="Switch employee account for testing"
              >
                <Shield className="w-3.5 h-3.5 text-[#C5A46D]" />
                <span className="capitalize">{currentUser.name || currentUser.role.replace('_', ' ')}</span>
                <ChevronDown className={`w-3 h-3 text-[#80736F] transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-[#302725] rounded-2xl shadow-2xl border border-[#E8E0D9] py-1.5 z-50 animate-fadeIn">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#80736F] border-b border-[#E8E0D9] bg-[#FAF7F2] flex justify-between items-center">
                    <span>Switch Testing Identity</span>
                    <span className="text-[9px] bg-[#762F3D]/10 text-[#762F3D] px-1.5 py-0.5 rounded font-mono">DEV MODE</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E8E0D9]/40">
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
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition hover:bg-[#FAF7F2] ${
                            isActive ? 'bg-[#762F3D]/10 text-[#762F3D] font-bold' : 'text-[#302725]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm">{getAccountIcon(acc.role)}</span>
                            <div className="truncate">
                              <p className="truncate font-medium">{acc.label}</p>
                              <p className="text-[10px] text-[#80736F] truncate">{acc.email}</p>
                            </div>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#762F3D] shrink-0" />}
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

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 sm:p-2.5 rounded-xl border border-[#E8E0D9] bg-[#FAF7F2] text-[#302725] hover:bg-[#EFEAE3] transition cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 text-[#762F3D]" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#762F3D] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white text-[#302725] rounded-3xl shadow-2xl border border-[#E8E0D9] p-4 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D9]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#762F3D]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#302725]">
                        Staff Notifications
                      </span>
                    </div>
                    <span className="text-[11px] text-[#80736F]">
                      {unreadNotifs.length} Unread
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E8E0D9]/50 my-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#80736F]">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 rounded-2xl transition cursor-pointer my-1 ${
                            !n.read ? 'bg-[#FAF7F2] font-semibold' : 'hover:bg-gray-50 text-[#80736F]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {n.title && <p className="text-[11px] font-bold text-[#302725]">{n.title}</p>}
                              <p className="text-xs text-[#80736F]">{n.message}</p>
                            </div>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-[#762F3D] shrink-0 mt-1" />
                            )}
                          </div>
                          <span className="text-[10px] text-[#80736F] mt-1 block">
                            {n.createdAt || 'Just now'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E8E0D9] text-center">
                    <button
                      type="button"
                      onClick={() => {
                        notifications.forEach(n => markNotificationRead(n.id));
                        setNotifOpen(false);
                      }}
                      className="text-xs font-bold text-[#762F3D] hover:underline cursor-pointer"
                    >
                      Mark All as Read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Employee Profile Pill & Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E8E0D9] hover:border-[#C5A46D] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl shadow-2xs transition cursor-pointer select-none"
              >
                <div className="w-7 h-7 rounded-full bg-[#762F3D] text-[#C5A46D] flex items-center justify-center text-xs font-bold shrink-0 font-serif border border-[#C5A46D]/30">
                  {initials}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <p className="font-bold text-[#302725] truncate max-w-[120px]">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] font-semibold text-[#80736F] capitalize">
                    {roleDisplay}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#80736F] transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-[#302725] rounded-3xl shadow-2xl border border-[#E8E0D9] py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 border-b border-[#E8E0D9]/80 bg-[#FAF7F2]/50">
                    <p className="text-xs font-bold text-[#302725] truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-[#80736F] truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#762F3D]/10 text-[#762F3D] text-[9px] font-bold uppercase tracking-wider">
                      {roleDisplay}
                    </span>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-[#302725] hover:bg-[#FAF7F2] hover:text-[#762F3D] flex items-center gap-2 transition cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#762F3D]" />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setNotifOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-[#302725] hover:bg-[#FAF7F2] hover:text-[#762F3D] flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#762F3D]" />
                        <span>Notifications</span>
                      </div>
                      {unreadNotifs.length > 0 && (
                        <span className="text-[10px] bg-[#762F3D] text-white px-2 py-0.5 rounded-full font-bold">
                          {unreadNotifs.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="p-1 pt-1 border-t border-[#E8E0D9]/80">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MAIN LAYOUT: SIDEBAR + CONTENT (FLEXBOX, NO HORIZONTAL SCROLL)*/}
      {/* ============================================================== */}
      <div className={`w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col min-w-0 ${
        isCompact ? 'py-3.5 sm:py-4' : 'py-6'
      }`}>
        
        {/* Breadcrumb row & Quick Info Bar */}
        <div className={`hidden sm:flex items-center justify-between border-b border-[#E8E0D9]/70 text-xs text-[#80736F] min-w-0 ${
          isCompact ? 'pb-2.5 mb-2.5' : 'pb-4 mb-2'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-[#302725]">{portalName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#C5A46D] shrink-0" />
            {activeSectionTitle && (
              <>
                <span className="truncate">{activeSectionTitle}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C5A46D] shrink-0" />
              </>
            )}
            <span className="font-bold text-[#762F3D] truncate">{activeItemLabel || 'Workspace'}</span>
          </div>

          <div className="text-[11px] text-[#80736F] shrink-0 flex items-center gap-2">
            <span>Branch: MM Alam Road, Lahore</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Shift Active
            </span>
          </div>
        </div>

        <div className={`flex items-start w-full min-w-0 flex-1 ${
          isCompact ? 'gap-4 sm:gap-5' : 'gap-6'
        }`}>
          
          {/* Desktop Left Sidebar (Fixed width, collapsible) */}
          <aside
            className={`hidden lg:flex flex-col bg-white border border-[#E8E0D9] shadow-2xs transition-all duration-200 shrink-0 ${
              isCompact
                ? `rounded-2xl sticky top-18 max-h-[calc(100vh-5.5rem)] ${isCollapsed ? 'w-16' : 'w-60'}`
                : `rounded-3xl sticky top-24 max-h-[calc(100vh-7rem)] ${isCollapsed ? 'w-20' : 'w-64'}`
            }`}
          >
            {sidebarContent}
          </aside>

          {/* Mobile/Tablet Sidebar Off-Canvas Drawer (lg:hidden) */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col animate-slideIn">
                {sidebarContent}
              </div>
            </div>
          )}

          {/* Main Content Workspace - Takes ALL remaining available space */}
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. CENTERED "MY PROFILE" MODAL                                 */}
      {/* ============================================================== */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8E0D9] shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#80736F] hover:bg-[#FAF7F2] hover:text-[#302725] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Avatar & Header */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-[#E8E0D9]">
              <div className="w-20 h-20 rounded-full bg-[#762F3D] text-[#C5A46D] flex items-center justify-center font-serif text-2xl font-bold shadow-md mb-3 border-2 border-[#C5A46D]/30">
                {initials}
              </div>
              <h2 className="font-serif text-xl font-bold text-[#302725]">
                {currentUser.name}
              </h2>
              <span className="mt-1 px-3 py-0.5 rounded-full bg-[#762F3D]/10 text-[#762F3D] text-xs font-bold uppercase tracking-wider">
                {roleDisplay}
              </span>
              <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Staff Member
              </p>
            </div>

            {/* Details List */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2]">
                <div className="flex items-center gap-2 text-[#80736F]">
                  <Mail className="w-4 h-4 text-[#762F3D]" />
                  <span>Email Address</span>
                </div>
                <span className="font-semibold text-[#302725] truncate max-w-[200px]">{currentUser.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2]">
                <div className="flex items-center gap-2 text-[#80736F]">
                  <Phone className="w-4 h-4 text-[#762F3D]" />
                  <span>Contact Phone</span>
                </div>
                <span className="font-semibold text-[#302725]">{currentUser.phone || '+92 300 0000000'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2]">
                <div className="flex items-center gap-2 text-[#80736F]">
                  <MapPin className="w-4 h-4 text-[#762F3D]" />
                  <span>Assigned Branch</span>
                </div>
                <span className="font-semibold text-[#302725]">MM Alam Road, Lahore</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2]">
                <div className="flex items-center gap-2 text-[#80736F]">
                  <Clock className="w-4 h-4 text-[#762F3D]" />
                  <span>Operational Shift</span>
                </div>
                <span className="font-semibold text-[#762F3D]">Day Shift (09:00 - 18:00)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2]">
                <div className="flex items-center gap-2 text-[#80736F]">
                  <Calendar className="w-4 h-4 text-[#762F3D]" />
                  <span>Member Since</span>
                </div>
                <span className="font-semibold text-[#302725]">{currentUser.createdAt ? currentUser.createdAt.substring(0, 10) : '2026-01-01'}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E0D9] text-xs font-bold text-[#302725] hover:bg-[#FAF7F2] transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(false);
                  handleLogout();
                }}
                className="py-2.5 px-4 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
