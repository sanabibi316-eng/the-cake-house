import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Dropdown } from '../components/Dropdown';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Order, CustomCakeRequest } from '../types';
import {
  ShoppingBag,
  Sparkles,
  User as UserIcon,
  MapPin,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  PackageCheck,
  Truck,
  ChefHat,
  Search,
  Filter,
  X,
  Printer,
  Eye,
  Trash2,
  Plus,
  Lock,
  KeyRound,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Phone,
  Mail,
  Home,
  Check,
  Info
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const {
    currentUser,
    token,
    orders,
    customCakes,
    respondToQuotation,
    switchRole,
    setCurrentView,
    settings,
    updateProfile,
    changePassword,
    cancelCustomCake,
    refetchOrders,
    refetchCustomCakes,
    showToast
  } = useApp();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'custom' | 'profile' | 'addresses'>('dashboard');

  // Orders Filtering
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Custom Cakes Filtering
  const [cakeSearchQuery, setCakeSearchQuery] = useState('');
  const [cakeStatusFilter, setCakeStatusFilter] = useState('ALL');
  const [selectedCakeForModal, setSelectedCakeForModal] = useState<CustomCakeRequest | null>(null);
  const [isCancellingCakeId, setIsCancellingCakeId] = useState<string | null>(null);
  const [showCakeCancelModal, setShowCakeCancelModal] = useState(false);
  const [cakeToCancelId, setCakeToCancelId] = useState<string | null>(null);
  const [respondingCakeId, setRespondingCakeId] = useState<string | null>(null);

  const handleQuotationResponse = async (cakeId: string, action: 'approve' | 'reject') => {
    setRespondingCakeId(cakeId);
    try {
      const ok = await respondToQuotation(cakeId, action);
      if (ok && selectedCakeForModal && selectedCakeForModal.id === cakeId) {
        setSelectedCakeForModal(prev => prev ? { ...prev, status: action === 'approve' ? 'Approved' : 'Rejected' } : null);
      }
    } finally {
      setRespondingCakeId(null);
    }
  };

  // Profile Form State
  const [profileName, setProfileName] = useState(currentUser.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Address Management State
  const [newAddressInput, setNewAddressInput] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isUpdatingAddresses, setIsUpdatingAddresses] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDeleteIndex, setAddressToDeleteIndex] = useState<number | null>(null);

  // Synchronize profile state if currentUser changes
  React.useEffect(() => {
    setProfileName(currentUser.name || '');
    setProfileEmail(currentUser.email || '');
    setProfilePhone(currentUser.phone || '');
  }, [currentUser]);

  // Guard: If guest or unauthenticated, prompt and prevent dashboard view
  if (!token || currentUser.role === 'guest') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-[#F3E6DF] text-[#762F3D] rounded-full flex items-center justify-center mx-auto text-3xl font-serif">
          🍰
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#302725]">Customer Portal</h2>
        <p className="text-sm text-[#80736F] max-w-md mx-auto leading-relaxed">
          Create an account or sign in to view your orders, custom cake status, and account settings with {settings.bakeryName || 'The Cake House'}.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentView('login')}
            className="w-full sm:w-auto bg-[#762F3D] hover:bg-[#5F2030] text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => setCurrentView('register')}
            className="w-full sm:w-auto bg-white hover:bg-[#FAF7F2] text-[#762F3D] border border-[#762F3D]/30 px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-2xs cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // Filter orders belonging to this customer
  const myOrders = useMemo(() => {
    return orders.filter(o => 
      o.customerId === currentUser.id ||
      (currentUser.phone && o.customerPhone === currentUser.phone) ||
      (currentUser.email && o.customerEmail === currentUser.email)
    );
  }, [orders, currentUser]);

  // Filter custom cakes belonging to this customer
  const myCustomCakes = useMemo(() => {
    return customCakes.filter(c => 
      c.customerId === currentUser.id ||
      (currentUser.phone && c.customerPhone === currentUser.phone) ||
      (currentUser.email && c.customerEmail === currentUser.email)
    );
  }, [customCakes, currentUser]);

  // Dynamic statistics
  const pendingOrdersCount = myOrders.filter(o => ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.status)).length;
  const completedOrdersCount = myOrders.filter(o => o.status === 'Completed').length;
  const totalSpentAmount = myOrders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Filtered orders list based on search and status
  const filteredOrders = useMemo(() => {
    return myOrders.filter(order => {
      const matchesStatus = orderStatusFilter === 'ALL' || order.status.toLowerCase() === orderStatusFilter.toLowerCase();
      const query = orderSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some(i => i.name.toLowerCase().includes(query)) ||
        (order.fulfillmentMethod && order.fulfillmentMethod.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [myOrders, orderStatusFilter, orderSearchQuery]);

  // Filtered custom cakes list based on search and status
  const filteredCustomCakes = useMemo(() => {
    return myCustomCakes.filter(cake => {
      const matchesStatus = cakeStatusFilter === 'ALL' || cake.status.toLowerCase() === cakeStatusFilter.toLowerCase();
      const query = cakeSearchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        cake.requestNumber.toLowerCase().includes(query) ||
        cake.occasion.toLowerCase().includes(query) ||
        cake.flavor.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [myCustomCakes, cakeStatusFilter, cakeSearchQuery]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateProfile({
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim()
      });
      if (res.success) {
        showToast('Profile information updated successfully!');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword({
        currentPassword,
        newPassword
      });
      if (res.success) {
        setPasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || 'Failed to update password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressInput.trim()) return;

    setIsUpdatingAddresses(true);
    try {
      const updatedAddresses = [...currentUser.addresses, newAddressInput.trim()];
      const res = await updateProfile({ addresses: updatedAddresses });
      if (res.success) {
        setNewAddressInput('');
        setIsAddingAddress(false);
        showToast('Address added successfully!');
      }
    } finally {
      setIsUpdatingAddresses(false);
    }
  };

  // Handle Set Default Address (moves address to index 0)
  const handleSetDefaultAddress = async (index: number) => {
    if (index === 0) return;
    setIsUpdatingAddresses(true);
    try {
      const list = [...currentUser.addresses];
      const [chosen] = list.splice(index, 1);
      list.unshift(chosen);
      await updateProfile({ addresses: list });
      showToast('Default address updated!');
    } finally {
      setIsUpdatingAddresses(false);
    }
  };

  // Handle Delete Address confirmation modal workflows
  const handleDeleteClick = (index: number) => {
    if (currentUser.addresses.length <= 1) {
      showToast('You must maintain at least one delivery address.', 'error');
      return;
    }
    setAddressToDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setAddressToDeleteIndex(null);
  };

  const handleConfirmDelete = async () => {
    if (addressToDeleteIndex === null) return;
    if (currentUser.addresses.length <= 1) {
      showToast('You must maintain at least one delivery address.', 'error');
      setShowDeleteModal(false);
      setAddressToDeleteIndex(null);
      return;
    }

    setIsUpdatingAddresses(true);
    try {
      const list = currentUser.addresses.filter((_, idx) => idx !== addressToDeleteIndex);
      const res = await updateProfile({ addresses: list });
      if (res.success) {
        showToast('Address removed successfully');
        setShowDeleteModal(false);
        setAddressToDeleteIndex(null);
      } else {
        showToast(res.error || 'Failed to remove address', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error removing address', 'error');
    } finally {
      setIsUpdatingAddresses(false);
    }
  };

  // Handle Cancel Custom Cake modal workflows
  const handleCancelCustomCakeClick = (cakeId: string) => {
    setCakeToCancelId(cakeId);
    setShowCakeCancelModal(true);
  };

  const handleCancelCustomCakeConfirm = async () => {
    if (!cakeToCancelId) return;
    setIsCancellingCakeId(cakeToCancelId);
    try {
      const ok = await cancelCustomCake(cakeToCancelId);
      if (ok) {
        if (selectedCakeForModal && selectedCakeForModal.id === cakeToCancelId) {
          setSelectedCakeForModal(null);
        }
        setShowCakeCancelModal(false);
        setCakeToCancelId(null);
      }
    } finally {
      setIsCancellingCakeId(null);
    }
  };

  // Status Badge Colors Helper
  const getOrderStatusBadge = (status: Order['status']) => {
    switch (status as string) {
      case 'Completed':
      case 'Delivered':
      case 'Picked Up':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Ready':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Preparing':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCakeStatusBadge = (status: CustomCakeRequest['status']) => {
    switch (status) {
      case 'Pending':
      case 'Pending Review':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Under Review':
      case 'Reviewing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Quotation Sent':
      case 'Quoted':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Approved':
      case 'Quotation Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected':
      case 'Quotation Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Converted to Order':
      case 'Confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'In Kitchen':
      case 'In Production':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ready':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Visual tracking step definition
  const getOrderTrackingSteps = (order: Order) => {
    const isCancelled = order.status === 'Cancelled';
    const isPickup = order.fulfillmentMethod === 'Pickup';
    const rawStatus = (order.status || '').trim().toLowerCase();
    const isDelivered = rawStatus === 'completed' || rawStatus === 'delivered' || rawStatus === 'picked up';

    const steps = [
      { id: 'placed', label: 'Order Placed', desc: 'Received by system', icon: Clock },
      { id: 'confirmed', label: 'Confirmed', desc: 'Approved by bakery', icon: CheckCircle2 },
      { id: 'preparing', label: 'Preparing', desc: 'Baking & styling', icon: ChefHat },
      { id: 'out', label: isPickup ? 'Ready for Pickup' : 'Out for Delivery', desc: isPickup ? 'Counter ready' : 'With delivery partner', icon: isPickup ? PackageCheck : Truck },
      { id: 'completed', label: isPickup ? 'Picked Up' : 'Delivered', desc: 'Order fulfilled', icon: ShieldCheck }
    ];

    let currentStepIndex = 0;
    if (isDelivered) {
      currentStepIndex = 4;
    } else if (rawStatus === 'out for delivery') {
      currentStepIndex = 3;
    } else if (rawStatus === 'ready') {
      currentStepIndex = isPickup ? 3 : 2;
    } else if (rawStatus === 'preparing') {
      currentStepIndex = 2;
    } else if (rawStatus === 'confirmed') {
      currentStepIndex = 1;
    } else {
      currentStepIndex = 0;
    }

    return { steps, currentStepIndex, isCancelled, isDelivered };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E0D9] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#762F3D] flex items-center justify-center font-bold text-2xl font-serif border-2 border-[#C5A46D] shadow-inner">
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#302725]">Welcome, {currentUser.name}!</h1>
              <span className="bg-[#FAF7F2] text-[#762F3D] border border-[#762F3D]/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Customer
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#80736F] mt-1">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-[#C5A46D]" /> {currentUser.email}</span>
              {currentUser.phone && (
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[#C5A46D]" /> {currentUser.phone}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setCurrentView('custom-cake')}
            className="flex-1 sm:flex-none bg-[#FAF7F2] hover:bg-[#F3E6DF] text-[#762F3D] border border-[#762F3D]/20 px-5 py-2.5 rounded-xl font-semibold text-xs transition shadow-2xs cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#C5A46D]" />
            <span>Custom Cake</span>
          </button>
          <button
            onClick={() => setCurrentView('products')}
            className="flex-1 sm:flex-none bg-[#762F3D] hover:bg-[#5F2030] text-white px-6 py-2.5 rounded-xl font-semibold text-xs transition shadow cursor-pointer flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Online</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation (Horizontal scroll on mobile/tablet, vertical on desktop) */}
        <div className="bg-white p-2 sm:p-4 rounded-2xl border border-[#E8E0D9] shadow-xs flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 lg:space-y-1 h-fit scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: ShoppingBag, badge: myOrders.length },
            { id: 'orders', label: 'My Orders', icon: Clock, badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} Active` : undefined },
            { id: 'custom', label: 'Custom Cakes', icon: Sparkles, badge: myCustomCakes.length > 0 ? myCustomCakes.length : undefined },
            { id: 'profile', label: 'My Profile', icon: UserIcon },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin, badge: currentUser.addresses?.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 sm:gap-3 transition cursor-pointer whitespace-nowrap shrink-0 lg:shrink lg:w-full ${
                  isActive 
                    ? 'bg-[#762F3D] text-white shadow-sm' 
                    : 'hover:bg-[#FAF7F2] text-[#302725] bg-[#FAF7F2]/60 lg:bg-transparent'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FAF7F2]' : 'text-[#80736F]'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-[#FAF7F2] text-[#762F3D] border border-[#E8E0D9]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
          
          <hr className="hidden lg:block my-2 border-[#E8E0D9]" />

          <button
            onClick={() => switchRole('guest')}
            className="hidden lg:flex w-full text-left px-4 py-3 rounded-xl text-xs font-semibold items-center gap-3 text-red-600 hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* ========================================================== */}
          {/* TAB 1: DASHBOARD OVERVIEW                                  */}
          {/* ========================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* Dynamic KPI Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div 
                  onClick={() => setActiveTab('orders')} 
                  className="bg-white p-5 rounded-2xl border border-[#E8E0D9] shadow-xs space-y-1 hover:border-[#762F3D] transition cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-[#80736F]">
                    <span className="text-xs font-medium">Total Orders</span>
                    <Clock className="w-4 h-4 text-[#762F3D] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-[#302725]">{myOrders.length}</div>
                  <span className="text-[10px] text-[#762F3D] font-semibold flex items-center gap-0.5">
                    View History <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div 
                  onClick={() => {
                    setOrderStatusFilter('Pending');
                    setActiveTab('orders');
                  }} 
                  className="bg-white p-5 rounded-2xl border border-[#E8E0D9] shadow-xs space-y-1 hover:border-[#762F3D] transition cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-[#80736F]">
                    <span className="text-xs font-medium">Active Orders</span>
                    <Truck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-[#762F3D]">{pendingOrdersCount}</div>
                  <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5">
                    Live Tracking <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('custom')} 
                  className="bg-white p-5 rounded-2xl border border-[#E8E0D9] shadow-xs space-y-1 hover:border-[#762F3D] transition cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-[#80736F]">
                    <span className="text-xs font-medium">Custom Cakes</span>
                    <Sparkles className="w-4 h-4 text-[#C5A46D] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-[#302725]">{myCustomCakes.length}</div>
                  <span className="text-[10px] text-[#C5A46D] font-semibold flex items-center gap-0.5">
                    View Requests <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8E0D9] shadow-xs space-y-1">
                  <div className="flex justify-between items-center text-[#80736F]">
                    <span className="text-xs font-medium">Total Spent</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700">
                    Rs. {totalSpentAmount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {completedOrdersCount} fulfilled orders
                  </span>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-xs overflow-hidden">
                <div className="p-6 border-b border-[#E8E0D9] flex justify-between items-center">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#302725]">Recent Orders</h3>
                    <p className="text-xs text-[#80736F]">Track and view your latest bakery orders</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('orders')} 
                    className="text-xs font-bold text-[#762F3D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View All ({myOrders.length}) →
                  </button>
                </div>

                {myOrders.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <ShoppingBag className="w-10 h-10 text-[#C5A46D] mx-auto opacity-60" />
                    <p className="text-sm font-semibold text-[#302725]">No orders placed yet</p>
                    <p className="text-xs text-[#80736F] max-w-sm mx-auto">
                      Explore our handcrafted artisanal cakes, brownies, and pastries and place your first order.
                    </p>
                    <button
                      onClick={() => setCurrentView('products')}
                      className="mt-2 bg-[#762F3D] text-white px-6 py-2 rounded-xl text-xs font-semibold hover:bg-[#5F2030] transition shadow cursor-pointer"
                    >
                      Browse Bakery Products
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E8E0D9]">
                    {myOrders.slice(0, 3).map(order => (
                      <div key={order.id} className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#FAF7F2]/50 transition">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E8E0D9] flex flex-col items-center justify-center font-bold text-xs text-[#762F3D] shrink-0">
                            <span className="text-[10px] text-[#80736F]">ORD</span>
                            <span className="font-mono text-[11px]">{order.orderNumber.replace('#TH-', '')}</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#302725] line-clamp-1">
                              {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>
                            <div className="text-[11px] text-[#80736F] mt-0.5 flex items-center gap-2">
                              <span>{order.createdAt}</span>
                              <span>•</span>
                              <span className="font-semibold text-[#302725]">Rs. {order.total.toLocaleString()}</span>
                              <span>•</span>
                              <span>{order.fulfillmentMethod || 'Delivery'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getOrderStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                          <button
                            onClick={() => setSelectedOrderForModal(order)}
                            className="bg-white hover:bg-[#FAF7F2] text-[#762F3D] border border-[#762F3D]/20 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Track & Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Custom Cake Requests Section */}
              {myCustomCakes.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-xs overflow-hidden">
                  <div className="p-6 border-b border-[#E8E0D9] flex justify-between items-center">
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#302725]">Custom Cake Requests</h3>
                      <p className="text-xs text-[#80736F]">Your bespoke celebration cake orders</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('custom')} 
                      className="text-xs font-bold text-[#762F3D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View All ({myCustomCakes.length}) →
                    </button>
                  </div>
                  <div className="divide-y divide-[#E8E0D9]">
                    {myCustomCakes.slice(0, 2).map(cake => (
                      <div key={cake.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          {cake.referenceImage ? (
                            <img 
                              src={cake.referenceImage} 
                              alt={cake.occasion} 
                              className="w-12 h-12 rounded-xl object-cover border border-[#E8E0D9] shrink-0" 
                              onError={e => {
                                (e.target as HTMLImageElement).src = '/assets/custom_wedding_cake.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E8E0D9] flex items-center justify-center text-[#762F3D] shrink-0">
                              <Sparkles className="w-5 h-5 text-[#C5A46D]" />
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-[#302725]">{cake.requestNumber} — {cake.occasion}</div>
                            <div className="text-[11px] text-[#80736F] mt-0.5">
                              {cake.flavor} • {cake.sizeWeight} • Needed for: {cake.requiredDate}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getCakeStatusBadge(cake.status)}`}>
                            {cake.status}
                          </span>
                          <button
                            onClick={() => setSelectedCakeForModal(cake)}
                            className="bg-white hover:bg-[#FAF7F2] text-[#762F3D] border border-[#762F3D]/20 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: MY ORDERS LIST & DETAILS                            */}
          {/* ========================================================== */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E0D9] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#302725]">My Order History</h3>
                  <p className="text-xs text-[#80736F]">Track orders, view receipts, and monitor delivery progress</p>
                </div>
                <button
                  onClick={() => setCurrentView('products')}
                  className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Place New Order</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-[#80736F] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by order number or item name..."
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-9 pr-4 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                  {orderSearchQuery && (
                    <button 
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-3 top-2.5 text-[#80736F] hover:text-[#302725]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <Dropdown
                    value={orderStatusFilter}
                    onChange={setOrderStatusFilter}
                    size="sm"
                    options={[
                      { value: 'ALL', label: 'All Statuses' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Confirmed', label: 'Confirmed' },
                      { value: 'Preparing', label: 'Preparing' },
                      { value: 'Out for Delivery', label: 'Out for Delivery' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Cancelled', label: 'Cancelled' }
                    ]}
                  />
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9]">
                  <ShoppingBag className="w-10 h-10 text-[#C5A46D] mx-auto opacity-50" />
                  <p className="text-sm font-semibold text-[#302725]">No matching orders found</p>
                  <p className="text-xs text-[#80736F]">
                    {orderSearchQuery || orderStatusFilter !== 'ALL'
                      ? 'Try clearing your search query or status filter.'
                      : 'You haven’t placed any orders yet.'}
                  </p>
                  {(orderSearchQuery || orderStatusFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setOrderSearchQuery('');
                        setOrderStatusFilter('ALL');
                      }}
                      className="text-xs font-bold text-[#762F3D] hover:underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="p-5 rounded-2xl border border-[#E8E0D9] bg-[#FAF7F2] hover:bg-white hover:shadow-sm transition space-y-4"
                    >
                      {/* Order Card Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E8E0D9] pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-[#762F3D] font-mono">{order.orderNumber}</span>
                          <span className="text-[11px] text-[#80736F]">{order.createdAt}</span>
                          <span className="text-[11px] font-semibold text-[#80736F] bg-white px-2 py-0.5 rounded-md border border-[#E8E0D9]">
                            {order.fulfillmentMethod || 'Delivery'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getOrderStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="divide-y divide-[#E8E0D9]/60">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between text-xs text-[#302725]">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-10 h-10 object-cover rounded-lg border border-[#E8E0D9]" 
                                  onError={e => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80';
                                  }}
                                />
                              )}
                              <div>
                                <span className="font-semibold">{item.name}</span>
                                {item.variant && <span className="text-[#80736F] ml-1.5 text-[11px]">({item.variant})</span>}
                                <div className="text-[11px] text-[#80736F]">Qty: {item.quantity} × Rs. {item.price.toLocaleString()}</div>
                              </div>
                            </div>
                            <span className="font-bold text-[#302725]">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-[#E8E0D9] text-xs">
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#80736F]">
                          <span>Payment: <strong className="text-[#302725]">{order.paymentMethod}</strong> ({order.paymentStatus || 'Pending'})</span>
                          {order.deliveryAddress && (
                            <span>• Address: <span className="text-[#302725]">{order.deliveryAddress}</span></span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-[#80736F] block">Total Amount</span>
                            <span className="font-serif font-bold text-base text-[#762F3D]">
                              Rs. {order.total.toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedOrderForModal(order)}
                            className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details & Track</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: CUSTOM CAKE REQUESTS                                */}
          {/* ========================================================== */}
          {activeTab === 'custom' && (
            <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E0D9] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#302725]">My Custom Cake Requests</h3>
                  <p className="text-xs text-[#80736F]">Track quotes, design reviews, and status of bespoke celebration cakes</p>
                </div>
                <button
                  onClick={() => setCurrentView('custom-cake')}
                  className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A46D]" />
                  <span>Request New Custom Cake</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-[#80736F] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={cakeSearchQuery}
                    onChange={e => setCakeSearchQuery(e.target.value)}
                    placeholder="Search by request number, occasion, or flavor..."
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-9 pr-4 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                  {cakeSearchQuery && (
                    <button 
                      onClick={() => setCakeSearchQuery('')}
                      className="absolute right-3 top-2.5 text-[#80736F] hover:text-[#302725]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <Dropdown
                    value={cakeStatusFilter}
                    onChange={setCakeStatusFilter}
                    size="sm"
                    options={[
                      { value: 'ALL', label: 'All Cake Statuses' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Under Review', label: 'Under Review' },
                      { value: 'Quotation Sent', label: 'Quotation Sent' },
                      { value: 'Approved', label: 'Approved' },
                      { value: 'Rejected', label: 'Rejected' },
                      { value: 'Converted to Order', label: 'Converted to Order' }
                    ]}
                  />
                </div>
              </div>

              {/* Custom Cakes List */}
              {filteredCustomCakes.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9]">
                  <Sparkles className="w-10 h-10 text-[#C5A46D] mx-auto opacity-50" />
                  <p className="text-sm font-semibold text-[#302725]">No custom cake requests found</p>
                  <p className="text-xs text-[#80736F]">
                    {cakeSearchQuery || cakeStatusFilter !== 'ALL'
                      ? 'Try clearing your search query or status filter.'
                      : 'Design your dream multi-tiered celebration or birthday cake today!'}
                  </p>
                  <button
                    onClick={() => setCurrentView('custom-cake')}
                    className="mt-2 bg-[#762F3D] text-white px-6 py-2 rounded-xl text-xs font-semibold hover:bg-[#5F2030] transition shadow cursor-pointer"
                  >
                    Start Custom Cake Request
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCustomCakes.map(cake => (
                    <div 
                      key={cake.id} 
                      className="p-5 rounded-2xl border border-[#E8E0D9] bg-[#FAF7F2] hover:bg-white hover:shadow-sm transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E8E0D9] pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-[#762F3D] font-mono">{cake.requestNumber}</span>
                          <span className="text-xs font-semibold text-[#302725]">{cake.occasion}</span>
                          <span className="text-[11px] text-[#80736F]">Required: <strong>{cake.requiredDate}</strong></span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getCakeStatusBadge(cake.status)}`}>
                          {cake.status}
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
                        <div className="space-y-2 text-xs text-[#80736F] flex-1">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div><strong>Flavor:</strong> <span className="text-[#302725]">{cake.flavor}</span></div>
                            <div><strong>Size / Weight:</strong> <span className="text-[#302725]">{cake.sizeWeight}</span></div>
                            <div><strong>Tiers:</strong> <span className="text-[#302725]">{cake.tiers || '1 Tier'}</span></div>
                            {cake.filling && <div><strong>Filling:</strong> <span className="text-[#302725]">{cake.filling}</span></div>}
                            {cake.froasting && <div><strong>Frosting:</strong> <span className="text-[#302725]">{cake.froasting}</span></div>}
                            {cake.pickupOrDelivery && <div><strong>Fulfillment:</strong> <span className="text-[#302725]">{cake.pickupOrDelivery}</span></div>}
                          </div>
                          {cake.personalMessage && (
                            <div className="bg-white p-2.5 rounded-lg border border-[#E8E0D9] text-[#302725] italic text-[11px]">
                              "{cake.personalMessage}"
                            </div>
                          )}
                        </div>

                        {cake.referenceImage && (
                          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-[#E8E0D9] shadow-xs shrink-0">
                            <img 
                              src={cake.referenceImage} 
                              alt="Cake Reference" 
                              className="w-16 h-16 object-cover rounded-lg border border-[#E8E0D9]" 
                              onError={e => {
                                (e.target as HTMLImageElement).src = '/assets/custom_wedding_cake.jpg';
                              }}
                            />
                            <div className="text-[11px] pr-2">
                              <span className="font-semibold text-[#302725] block">Reference Image</span>
                              <a 
                                href={cake.referenceImage} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[#762F3D] font-bold hover:underline"
                              >
                                View Full Image →
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-[#E8E0D9] text-xs">
                        <div className="text-[11px] text-[#80736F]">
                          {cake.quotedPrice ? (
                            <span>Quoted Price: <strong className="text-[#762F3D] text-xs">Rs. {cake.quotedPrice.toLocaleString()}</strong></span>
                          ) : (
                            <span>Estimated: <strong className="text-[#302725]">Rs. {(cake.estimatedPrice || 6500).toLocaleString()}</strong> (Pending official quote)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                          {cake.status === 'Converted to Order' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              Official Order: {cake.convertedOrderNumber || 'Generated'}
                            </span>
                          )}
                          {(cake.status === 'Quotation Sent' || cake.status === 'Quoted') && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuotationResponse(cake.id, 'approve')}
                                disabled={respondingCakeId === cake.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                              >
                                {respondingCakeId === cake.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                                <span>Approve Quote</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuotationResponse(cake.id, 'reject')}
                                disabled={respondingCakeId === cake.id}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </div>
                          )}
                          {['Pending', 'Pending Review', 'Under Review'].includes(cake.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancelCustomCakeClick(cake.id)}
                              disabled={isCancellingCakeId === cake.id}
                              className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isCancellingCakeId === cake.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Cancel Request</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedCakeForModal(cake)}
                            className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Details</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: MY PROFILE & PASSWORD                               */}
          {/* ========================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              
              {/* Profile Details Form */}
              <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-xs p-6 space-y-6">
                <div className="border-b border-[#E8E0D9] pb-4">
                  <h3 className="font-serif font-bold text-xl text-[#302725]">Customer Profile</h3>
                  <p className="text-xs text-[#80736F]">Update your personal information and contact details</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">Full Name *</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-[#80736F] absolute left-3 top-3" />
                        <input
                          type="text"
                          value={profileName}
                          onChange={e => setProfileName(e.target.value)}
                          className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-9 pr-3 py-2.5 font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">Email Address *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#80736F] absolute left-3 top-3" />
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={e => setProfileEmail(e.target.value)}
                          className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-9 pr-3 py-2.5 font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#302725] mb-1.5">Phone Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#80736F] absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={e => setProfilePhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-9 pr-3 py-2.5 font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-6 py-2.5 rounded-xl font-semibold text-xs transition shadow cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Profile Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-xs p-6 space-y-6">
                <div className="border-b border-[#E8E0D9] pb-4">
                  <h3 className="font-serif font-bold text-xl text-[#302725]">Change Password</h3>
                  <p className="text-xs text-[#80736F]">Ensure your customer account is using a secure password</p>
                </div>

                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#302725] mb-1.5">Current Password</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#80736F] absolute left-3 top-3" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-9 pr-3 py-2.5 font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">New Password (min 6 characters)</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#80736F] absolute left-3 top-3" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-9 pr-3 py-2.5 font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#302725] mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#80736F] absolute left-3 top-3" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-9 pr-3 py-2.5 font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-6 py-2.5 rounded-xl font-semibold text-xs transition shadow cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 5: SAVED ADDRESSES                                     */}
          {/* ========================================================== */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E0D9] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#302725]">Saved Delivery Addresses</h3>
                  <p className="text-xs text-[#80736F]">Manage your delivery addresses for seamless checkout in Lahore</p>
                </div>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* Add Address Form */}
              {isAddingAddress && (
                <form onSubmit={handleAddAddress} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-3">
                  <h4 className="font-semibold text-xs text-[#302725]">Add Delivery Address</h4>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#80736F] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={newAddressInput}
                      onChange={e => setNewAddressInput(e.target.value)}
                      placeholder="e.g. House #14, Street 2, Phase 5, DHA, Lahore"
                      className="w-full bg-white border border-[#E8E0D9] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setNewAddressInput('');
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#302725] rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingAddresses}
                      className="px-5 py-2 bg-[#762F3D] hover:bg-[#5F2030] text-white rounded-xl text-xs font-semibold transition shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isUpdatingAddresses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Address</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Addresses List */}
              <div className="space-y-3">
                {currentUser.addresses.map((addr, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl border border-[#E8E0D9] bg-[#FAF7F2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E0D9] flex items-center justify-center text-[#762F3D] shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[#302725]">{addr}</div>
                        {idx === 0 ? (
                          <span className="text-[10px] font-bold text-[#762F3D] bg-[#F3E6DF] px-2 py-0.5 rounded-full inline-block mt-1">
                            Default Address
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#80736F] inline-block mt-1">Additional delivery location</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {idx !== 0 && (
                        <button
                          onClick={() => handleSetDefaultAddress(idx)}
                          disabled={isUpdatingAddresses}
                          className="px-3 py-1 bg-white hover:bg-gray-50 border border-[#E8E0D9] text-[#302725] rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(idx)}
                        disabled={isUpdatingAddresses || currentUser.addresses.length <= 1}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-40"
                        title={currentUser.addresses.length <= 1 ? 'Must keep at least 1 address' : 'Remove address'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================== */}
      {/* MODAL: ORDER DETAILS & LIVE VISUAL TRACKER                 */}
      {/* ========================================================== */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-[#E8E0D9] animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E8E0D9] flex justify-between items-center bg-[#FAF7F2]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-serif font-bold text-xl text-[#302725]">Order Details</h3>
                  <span className="font-mono text-xs font-bold text-[#762F3D] bg-white px-2.5 py-0.5 rounded-md border border-[#E8E0D9]">
                    {selectedOrderForModal.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-[#80736F] mt-0.5">Placed on {selectedOrderForModal.createdAt}</p>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1.5 text-[#80736F] hover:text-[#302725] rounded-full hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Visual Step-by-Step Order Tracker */}
              <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8E0D9] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#762F3D]">Live Order Status</span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getOrderStatusBadge(selectedOrderForModal.status)}`}>
                    {selectedOrderForModal.status}
                  </span>
                </div>

                {(() => {
                  const { steps, currentStepIndex, isCancelled, isDelivered } = getOrderTrackingSteps(selectedOrderForModal);
                  if (isCancelled) {
                    return (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>This order was cancelled. Please contact bakery support if you have any questions.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="pt-2">
                      <div className="grid grid-cols-5 gap-1 relative">
                        {/* Connecting background progress line */}
                        <div className="absolute top-4.5 left-[10%] right-[10%] h-0.5 bg-[#E8E0D9] z-0">
                          <div
                            className="h-full bg-[#C5A46D] transition-all duration-500"
                            style={{
                              width: isDelivered ? '100%' : `${(Math.max(0, currentStepIndex) / 4) * 100}%`
                            }}
                          />
                        </div>

                        {steps.map((st, idx) => {
                          const StepIcon = st.icon;
                          const isDone = isDelivered || idx <= currentStepIndex;
                          // Pulsing ONLY shows on the step that is currently in-progress, NOT on the final Delivered step.
                          // If order is Delivered / Completed, stop all animations.
                          const isCurrent = !isDelivered && idx === currentStepIndex;
                          return (
                            <div key={st.id} className="flex flex-col items-center text-center space-y-1.5 relative z-10">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-xs ${
                                isCurrent
                                  ? 'bg-[#762F3D] text-white ring-4 ring-[#762F3D]/20 animate-pulse'
                                  : isDone
                                  ? 'bg-[#C5A46D] text-white'
                                  : 'bg-white text-[#80736F] border border-[#E8E0D9]'
                              }`}>
                                <StepIcon className="w-4 h-4" />
                              </div>
                              <span className={`text-[10px] font-bold leading-tight ${isDone ? 'text-[#302725]' : 'text-[#80736F]'}`}>
                                {st.label}
                              </span>
                              <span className="text-[9px] text-[#80736F] hidden sm:block leading-tight">
                                {st.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-[#302725] uppercase tracking-wider">Ordered Items</h4>
                <div className="divide-y divide-[#E8E0D9] border border-[#E8E0D9] rounded-2xl overflow-hidden bg-white">
                  {selectedOrderForModal.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-[#E8E0D9]" 
                            onError={e => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                        )}
                        <div>
                          <div className="font-semibold text-[#302725] text-xs">{item.name}</div>
                          {item.variant && <div className="text-[11px] text-[#80736F]">Size/Variant: {item.variant}</div>}
                          <div className="text-[11px] text-[#80736F]">Unit Price: Rs. {item.price.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-[#80736F]">Qty: {item.quantity}</div>
                        <div className="font-bold text-[#302725] text-xs">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery and Payment Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D9] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#80736F] uppercase tracking-wider block">Fulfillment Details</span>
                  <div className="font-semibold text-[#302725]">Method: {selectedOrderForModal.fulfillmentMethod || 'Delivery'}</div>
                  <div className="text-[#80736F]">Recipient: {selectedOrderForModal.customerName}</div>
                  <div className="text-[#80736F]">Phone: {selectedOrderForModal.customerPhone}</div>
                  {selectedOrderForModal.deliveryAddress && (
                    <div className="text-[#302725] font-medium pt-1">
                      Address: {selectedOrderForModal.deliveryAddress}
                    </div>
                  )}
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D9] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#80736F] uppercase tracking-wider block">Payment Breakdown</span>
                  <div className="flex justify-between"><span className="text-[#80736F]">Subtotal:</span><span>Rs. {selectedOrderForModal.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[#80736F]">Delivery Fee:</span><span>{selectedOrderForModal.deliveryFee === 0 ? 'FREE' : `Rs. ${selectedOrderForModal.deliveryFee}`}</span></div>
                  <div className="flex justify-between font-bold text-sm text-[#762F3D] pt-1.5 border-t border-[#E8E0D9]">
                    <span>Total Amount:</span>
                    <span>Rs. {selectedOrderForModal.total.toLocaleString()}</span>
                  </div>
                  <div className="pt-1 flex justify-between text-[11px]">
                    <span className="text-[#80736F]">Payment Method:</span>
                    <span className="font-semibold">{selectedOrderForModal.paymentMethod} ({selectedOrderForModal.paymentStatus || 'Pending'})</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E0D9] flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-white hover:bg-gray-50 border border-[#E8E0D9] text-[#302725] px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-6 py-2 rounded-xl text-xs font-semibold transition shadow cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: CUSTOM CAKE REQUEST DETAILS                         */}
      {/* ========================================================== */}
      {selectedCakeForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-[#E8E0D9] animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-[#E8E0D9] flex justify-between items-center bg-[#FAF7F2]">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-serif font-bold text-xl text-[#302725]">Custom Cake Request</h3>
                  <span className="font-mono text-xs font-bold text-[#762F3D] bg-white px-2.5 py-0.5 rounded-md border border-[#E8E0D9]">
                    {selectedCakeForModal.requestNumber}
                  </span>
                </div>
                <p className="text-xs text-[#80736F] mt-0.5">Occasion: {selectedCakeForModal.occasion}</p>
              </div>
              <button
                onClick={() => setSelectedCakeForModal(null)}
                className="p-1.5 text-[#80736F] hover:text-[#302725] rounded-full hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              <div className="flex justify-between items-center bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D9]">
                <div>
                  <span className="text-[10px] font-bold text-[#80736F] uppercase tracking-wider block">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block mt-1 ${getCakeStatusBadge(selectedCakeForModal.status)}`}>
                    {selectedCakeForModal.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#80736F] uppercase tracking-wider block">Required Delivery Date</span>
                  <span className="font-bold text-xs text-[#302725] block mt-1">{selectedCakeForModal.requiredDate}</span>
                </div>
              </div>

              {/* Cake Specifications */}
              <div className="bg-white border border-[#E8E0D9] rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#762F3D]">Cake Specifications</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl">
                    <span className="text-[10px] text-[#80736F] block">Flavor</span>
                    <strong className="text-xs text-[#302725]">{selectedCakeForModal.flavor}</strong>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl">
                    <span className="text-[10px] text-[#80736F] block">Size & Weight</span>
                    <strong className="text-xs text-[#302725]">{selectedCakeForModal.sizeWeight}</strong>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-xl">
                    <span className="text-[10px] text-[#80736F] block">Tiers</span>
                    <strong className="text-xs text-[#302725]">{selectedCakeForModal.tiers || '1 Tier'}</strong>
                  </div>
                  {selectedCakeForModal.filling && (
                    <div className="bg-[#FAF7F2] p-2.5 rounded-xl">
                      <span className="text-[10px] text-[#80736F] block">Filling</span>
                      <strong className="text-xs text-[#302725]">{selectedCakeForModal.filling}</strong>
                    </div>
                  )}
                  {selectedCakeForModal.froasting && (
                    <div className="bg-[#FAF7F2] p-2.5 rounded-xl">
                      <span className="text-[10px] text-[#80736F] block">Frosting</span>
                      <strong className="text-xs text-[#302725]">{selectedCakeForModal.froasting}</strong>
                    </div>
                  )}
                  {selectedCakeForModal.cakeType && (
                    <div className="bg-[#FAF7F2] p-2.5 rounded-xl">
                      <span className="text-[10px] text-[#80736F] block">Cake Type</span>
                      <strong className="text-xs text-[#302725]">{selectedCakeForModal.cakeType}</strong>
                    </div>
                  )}
                </div>

                {selectedCakeForModal.personalMessage && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-[#80736F] block uppercase tracking-wider mb-1">Inscription / Message on Cake</span>
                    <div className="p-3 bg-[#FAF7F2] rounded-xl text-[#302725] italic border border-[#E8E0D9]">
                      "{selectedCakeForModal.personalMessage}"
                    </div>
                  </div>
                )}

                {selectedCakeForModal.designDescription && (
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-[#80736F] block uppercase tracking-wider mb-1">Design Notes</span>
                    <div className="p-3 bg-[#FAF7F2] rounded-xl text-[#302725] border border-[#E8E0D9]">
                      {selectedCakeForModal.designDescription}
                    </div>
                  </div>
                )}
              </div>

              {/* Reference Image */}
              {selectedCakeForModal.referenceImage && (
                <div className="bg-white border border-[#E8E0D9] rounded-2xl p-4 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#762F3D]">Reference Image</h4>
                  <div className="rounded-xl overflow-hidden border border-[#E8E0D9] bg-[#FAF7F2] max-h-64 flex items-center justify-center">
                    <img 
                      src={selectedCakeForModal.referenceImage} 
                      alt="Reference" 
                      className="max-h-64 w-auto object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/assets/custom_wedding_cake.jpg';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Pricing & Fulfillment */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D9] flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#80736F] block uppercase tracking-wider">Fulfillment Method</span>
                  <span className="font-semibold text-xs text-[#302725]">{selectedCakeForModal.pickupOrDelivery || 'Store Pickup'}</span>
                  {selectedCakeForModal.deliveryAddress && (
                    <span className="text-[11px] text-[#80736F] block mt-0.5">{selectedCakeForModal.deliveryAddress}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#80736F] block uppercase tracking-wider">
                    {selectedCakeForModal.quotedPrice ? 'Official Bakery Quote' : 'Estimated Price'}
                  </span>
                  <span className="font-serif font-bold text-base text-[#762F3D]">
                    Rs. {(selectedCakeForModal.quotedPrice || selectedCakeForModal.estimatedPrice || 6500).toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E0D9] flex flex-wrap justify-between items-center gap-3">
              {(selectedCakeForModal.status === 'Quotation Sent' || selectedCakeForModal.status === 'Quoted') ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuotationResponse(selectedCakeForModal.id, 'approve')}
                    disabled={respondingCakeId === selectedCakeForModal.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {respondingCakeId === selectedCakeForModal.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>Approve Official Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuotationResponse(selectedCakeForModal.id, 'reject')}
                    disabled={respondingCakeId === selectedCakeForModal.id}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline Quote</span>
                  </button>
                </div>
              ) : ['Pending', 'Pending Review', 'Under Review'].includes(selectedCakeForModal.status) ? (
                <button
                  type="button"
                  onClick={() => handleCancelCustomCakeClick(selectedCakeForModal.id)}
                  disabled={isCancellingCakeId === selectedCakeForModal.id}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCancellingCakeId === selectedCakeForModal.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Cancel Request</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedCakeForModal(null)}
                className="bg-[#762F3D] hover:bg-[#5F2030] text-white px-6 py-2 rounded-xl text-xs font-semibold transition shadow cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: DELETE ADDRESS CONFIRMATION MODAL                   */}
      {/* ========================================================== */}
      <DeleteConfirmModal
        open={showDeleteModal}
        isOpen={showDeleteModal}
        title="Delete Address"
        message="Are you sure you want to remove this delivery address?"
        confirmText="Confirm Delete"
        cancelText="Cancel"
        isLoading={isUpdatingAddresses}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* ========================================================== */}
      {/* MODAL: CANCEL CUSTOM CAKE CONFIRMATION MODAL               */}
      {/* ========================================================== */}
      <DeleteConfirmModal
        open={showCakeCancelModal}
        isOpen={showCakeCancelModal}
        title="Cancel Cake Request"
        message="Are you sure you want to cancel this custom cake request? This action cannot be undone."
        confirmText="Confirm Cancellation"
        cancelText="Keep Request"
        isLoading={isCancellingCakeId !== null}
        onClose={() => {
          setShowCakeCancelModal(false);
          setCakeToCancelId(null);
        }}
        onConfirm={handleCancelCustomCakeConfirm}
      />

    </div>
  );
};
