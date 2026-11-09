import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Dropdown } from '../components/Dropdown';
import { Order, Product } from '../types';
import { PortalLayout, PortalSidebarSection } from '../components/PortalLayout';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  Building2,
  Truck,
  X,
  FileText,
  RefreshCw,
  Eye,
  TrendingUp,
  Receipt,
  RotateCcw,
  ShoppingBag,
  Store,
  Check,
  User as UserIcon,
  Bell,
  LogOut,
  ChevronRight,
  AlertCircle,
  Filter,
  DollarSign,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface CashierStats {
  todaySales: number;
  totalTransactions: number;
  completedOrders: number;
  pendingPayments: number;
  cancelledOrders: number;
  paymentBreakdown: {
    cash: { count: number; amount: number };
    card: { count: number; amount: number };
    bank: { count: number; amount: number };
    cod: { count: number; amount: number };
  };
  dailySummary?: { date: string; sales: number; count: number }[];
  recentTransactions?: Order[];
}

interface PosCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
  maxStock: number;
}

interface RegisteredCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export type CashierTabType = 'dashboard' | 'pos' | 'history' | 'transactions' | 'payments' | 'orders' | 'orderDetails';

export const PosPage: React.FC = () => {
  const {
    currentUser,
    token,
    products,
    categories,
    orders,
    createOrder,
    updateOrderStatus,
    refetchOrders,
    refetchProducts,
    settings,
    showToast,
    notifications
  } = useApp();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<CashierTabType>('dashboard');

  // --- Dynamic Cashier Stats ---
  const [cashierStats, setCashierStats] = useState<CashierStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // --- Registered Customers from MongoDB ---
  const [registeredCustomers, setRegisteredCustomers] = useState<RegisteredCustomer[]>([]);

  // --- POS Register State ---
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posCart, setPosCart] = useState<PosCartItem[]>([]);
  
  // Customer Attribution
  const [customerType, setCustomerType] = useState<'walk-in' | 'registered'>('walk-in');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState('+92 300 0000000');

  // Discount & Tax
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(false);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Payment Processing
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'COD'>('Cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals & Inspection
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // --- Order Management Tab Filters ---
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // --- Sales History Tab Filters ---
  const [historyDateFilter, setHistoryDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState('all');

  // --- Dedicated Transactions Tab Filters ---
  const [txSearch, setTxSearch] = useState('');
  const [txMethodFilter, setTxMethodFilter] = useState('all');
  const [txStatusFilter, setTxStatusFilter] = useState('all');

  // --- Dedicated Payment Records Tab State ---
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'Paid' | 'Pending' | 'Refunded'>('all');
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [recordPaymentMethod, setRecordPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer'>('Cash');
  const [recordPaymentTendered, setRecordPaymentTendered] = useState<string>('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Load Cashier Stats from Backend
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/cashier/stats', { headers });
      if (res.ok) {
        const data = await res.json();
        setCashierStats(data);
      }
    } catch (e) {
      console.warn('Failed to load cashier stats:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load Registered Customers
  const fetchCustomers = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/users?type=customers', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRegisteredCustomers(data);
        }
      }
    } catch (e) {
      console.warn('Failed to load customers:', e);
    }
  };

  // Automatic Data Synchronization on Mount
  useEffect(() => {
    fetchStats();
    fetchCustomers();
    refetchOrders();
    refetchProducts();
  }, [token]);

  // Seamlessly synchronize when cashier returns to an inactive browser tab or window
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
        fetchCustomers();
        refetchOrders();
        refetchProducts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [token]);

  // Catalog filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory || (p as any).categorySlug === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [posCart]);

  const taxAmount = useMemo(() => {
    if (!applyTax) return 0;
    const rate = Number(settings.taxRate) || 0;
    return Math.round((subtotal - discountAmount) * (rate / 100));
  }, [applyTax, settings.taxRate, subtotal, discountAmount]);

  const total = useMemo(() => {
    const discounted = Math.max(0, subtotal - discountAmount);
    return discounted + taxAmount;
  }, [subtotal, discountAmount, taxAmount]);

  // Cash change due calculation
  const numericCashReceived = Number(cashReceived) || 0;
  const changeDue = Math.max(0, numericCashReceived - total);

  // Cart Operations
  const addToPosCart = (product: Product) => {
    const currentStock = typeof product.stockQty === 'number' ? product.stockQty : 10;
    if (currentStock <= 0) {
      showToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }

    setPosCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= currentStock) {
          showToast(`Cannot add more. Only ${currentStock} in stock.`, 'info');
          return prev;
        }
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          variant: product.variants?.[0]?.size,
          image: product.images?.[0],
          maxStock: currentStock
        }
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setPosCart(prev =>
      prev
        .map(item => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            if (newQty > item.maxStock) {
              showToast(`Stock limit reached for ${item.name} (${item.maxStock} available)`, 'info');
              return item;
            }
            return { ...item, quantity: Math.max(1, newQty) };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setPosCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearPosCart = () => {
    setPosCart([]);
    setDiscountAmount(0);
    setCashReceived('');
    setOrderNotes('');
  };

  // Complete POS Sale
  const handleProcessSale = async () => {
    if (posCart.length === 0) {
      showToast('Please add items to cart before processing sale.', 'error');
      return;
    }

    if (paymentMethod === 'Cash' && numericCashReceived > 0 && numericCashReceived < total) {
      showToast(`Tendered cash (Rs. ${numericCashReceived}) is less than total amount (Rs. ${total})`, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalCustomerId = 'pos-walk-in';
      let finalCustomerName = walkInName.trim() || 'Walk-in Customer';
      let finalCustomerPhone = walkInPhone.trim() || '+92 300 0000000';
      let finalCustomerEmail = '';

      if (customerType === 'registered' && selectedCustomerId) {
        const found = registeredCustomers.find(c => c.id === selectedCustomerId);
        if (found) {
          finalCustomerId = found.id;
          finalCustomerName = found.name;
          finalCustomerPhone = found.phone || '';
          finalCustomerEmail = found.email || '';
        }
      }

      const tendered = paymentMethod === 'Cash' ? (numericCashReceived > 0 ? numericCashReceived : total) : total;
      const returnedChange = paymentMethod === 'Cash' ? Math.max(0, tendered - total) : 0;

      const order = await createOrder({
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        customerEmail: finalCustomerEmail,
        items: posCart.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          variant: i.variant,
          image: i.image
        })),
        subtotal,
        discount: discountAmount,
        deliveryFee: 0,
        tax: taxAmount,
        total,
        amountPaid: total,
        amountReceived: tendered,
        changeDue: returnedChange,
        paymentMethod,
        paymentStatus: 'Paid',
        fulfillmentMethod: 'Pickup',
        status: 'Completed',
        cashierId: currentUser.id,
        cashierName: currentUser.name || 'Ahmed Cashier',
        notes: orderNotes.trim() || undefined
      });

      // Clear register and show receipt
      clearPosCart();
      setActiveReceiptOrder(order);
      await fetchStats();
      await refetchProducts();
      await refetchOrders();
      showToast(`Sale completed successfully! Transaction ${order.orderNumber}`);
    } catch (err: any) {
      console.error('POS Checkout error:', err);
      showToast(err.message || 'Failed to process sale. Please check stock.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Cash Tender Helper
  const setExactCash = () => setCashReceived(String(total));
  const addCashAmount = (extra: number) => {
    const cur = Number(cashReceived) || 0;
    setCashReceived(String(cur + extra));
  };

  // Status Update Actions in Order Management
  const handleQuickStatusUpdate = async (orderId: string, newStatus: Order['status'], newPaymentStatus?: Order['paymentStatus']) => {
    try {
      await updateOrderStatus(orderId, newStatus, newPaymentStatus);
      await fetchStats();
      await refetchOrders();
      showToast(`Order status updated to ${newStatus}`);
      if (selectedOrderDetail && selectedOrderDetail.id === orderId) {
        setSelectedOrderDetail(prev => prev ? { ...prev, status: newStatus, paymentStatus: newPaymentStatus || prev.paymentStatus } : null);
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  // Filtered Orders for Order Management Tab
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.customerPhone.includes(orderSearchQuery);

      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      const matchesPayment = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, orderSearchQuery, orderStatusFilter, paymentStatusFilter]);

  // Filtered Sales for Sales History Tab
  const salesHistoryOrders = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().substring(0, 10);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return orders.filter(order => {
      if (order.status === 'Cancelled') return false;

      if (historyDateFilter === 'today') {
        if (!order.createdAt.startsWith(todayStr)) return false;
      } else if (historyDateFilter === 'yesterday') {
        if (!order.createdAt.startsWith(yesterdayStr)) return false;
      } else if (historyDateFilter === 'week') {
        const orderDate = new Date(order.createdAt.replace(' ', 'T'));
        if (orderDate < sevenDaysAgo) return false;
      }

      if (historyPaymentFilter !== 'all') {
        if (order.paymentMethod !== historyPaymentFilter) return false;
      }

      return true;
    });
  }, [orders, historyDateFilter, historyPaymentFilter]);

  const salesHistoryMetrics = useMemo(() => {
    const totalRev = salesHistoryOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const count = salesHistoryOrders.length;
    const aov = count > 0 ? Math.round(totalRev / count) : 0;
    return { totalRev, count, aov };
  }, [salesHistoryOrders]);

  // --- Dedicated Transactions Filtered Data ---
  const filteredTransactions = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(txSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(txSearch.toLowerCase()) ||
        (o.customerPhone && o.customerPhone.includes(txSearch));
      const matchesMethod = txMethodFilter === 'all' || o.paymentMethod === txMethodFilter;
      const matchesStatus = txStatusFilter === 'all' || o.paymentStatus === txStatusFilter;
      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [orders, txSearch, txMethodFilter, txStatusFilter]);

  // --- Dedicated Payment Records Filtered Data & Metrics ---
  const paymentMetrics = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let cashInDrawer = 0;
    let digitalVolume = 0;
    let paidCount = 0;
    let pendingCount = 0;

    orders.forEach(o => {
      if (o.paymentStatus === 'Paid') {
        const amt = Number(o.amountPaid || o.total || 0);
        totalPaid += amt;
        paidCount++;
        if (o.paymentMethod === 'Cash') cashInDrawer += amt;
        else if (o.paymentMethod === 'Card' || o.paymentMethod === 'Bank Transfer') digitalVolume += amt;
      } else if (o.paymentStatus === 'Pending') {
        totalPending += Number(o.total || 0);
        pendingCount++;
      }
    });

    return { totalPaid, totalPending, cashInDrawer, digitalVolume, paidCount, pendingCount };
  }, [orders]);

  const filteredPaymentRecords = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(paymentSearch.toLowerCase()) ||
        (o.customerPhone && o.customerPhone.includes(paymentSearch));
      const matchesStatus = paymentFilter === 'all' || o.paymentStatus === paymentFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, paymentSearch, paymentFilter]);

  // Safely record a pending payment with duplicate guard
  const handleConfirmPaymentRecord = async () => {
    if (!paymentModalOrder) return;
    if (paymentModalOrder.paymentStatus === 'Paid') {
      showToast('This payment is already settled.', 'info');
      setPaymentModalOrder(null);
      return;
    }

    setIsRecordingPayment(true);
    try {
      await updateOrderStatus(paymentModalOrder.id, paymentModalOrder.status, 'Paid');
      await fetchStats();
      await refetchOrders();
      showToast(`Payment of Rs. ${paymentModalOrder.total.toLocaleString()} recorded successfully for ${paymentModalOrder.orderNumber}`);
      setPaymentModalOrder(null);
      setRecordPaymentTendered('');
    } catch (err: any) {
      showToast('Failed to record payment: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Cashier Sidebar Configuration
  const sidebarSections: PortalSidebarSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
      ]
    },
    {
      title: 'Sales Management',
      items: [
        { id: 'pos', label: 'New Sale / POS', icon: ShoppingBag, badge: posCart.length > 0 ? `${posCart.length}` : null, badgeColor: 'bg-[#762F3D] text-white' },
        { id: 'history', label: 'Sales History', icon: RotateCcw, badge: salesHistoryOrders.length },
        { id: 'transactions', label: 'Transactions', icon: Receipt, badge: orders.length },
        { id: 'payments', label: 'Payment Records', icon: CreditCard, badge: paymentMetrics.pendingCount > 0 ? `${paymentMetrics.pendingCount} pending` : null, badgeColor: 'bg-amber-100 text-amber-800' },
      ]
    },
    {
      title: 'Order Management',
      items: [
        { id: 'orders', label: 'Orders', icon: FileText, badge: orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length || null, badgeColor: 'bg-blue-100 text-blue-800' },
        { id: 'orderDetails', label: 'Order Details', icon: Eye },
      ]
    },
    {
      title: 'Account',
      items: [
        { id: 'profile', label: 'My Profile', icon: UserIcon },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: (notifications?.filter(n => !n.read).length || null) },
        { id: 'logout', label: 'Logout', icon: LogOut, danger: true },
      ]
    }
  ];

  return (
    <PortalLayout
      portalName="Cashier Station"
      portalBadge="Live Register"
      portalSubtitle={`Cashier Operations & Point of Sale Console • ${currentUser.name || 'Ahmed Cashier'} • MM Alam Road, Lahore`}
      sidebarSections={sidebarSections}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as CashierTabType)}
      headerActions={
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className="bg-[#762F3D] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Sale (POS)</span>
        </button>
      }
    >
      <div className="space-y-6">

        {/* ============================================================== */}
        {/* TAB 1: CASHIER DASHBOARD                                       */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Key Metric KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              
              <div
                onClick={() => setActiveTab('history')}
                className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs cursor-pointer hover:border-[#762F3D] transition group"
              >
                <div className="flex justify-between items-center text-[#80736F] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-[#762F3D]">Today's Sales</span>
                  <Banknote className="w-5 h-5 text-[#762F3D]" />
                </div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-[#762F3D]">
                  Rs. {(cashierStats?.todaySales || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-[#80736F] mt-1">Paid / Completed orders today →</p>
              </div>

              <div
                onClick={() => setActiveTab('transactions')}
                className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs cursor-pointer hover:border-[#762F3D] transition group"
              >
                <div className="flex justify-between items-center text-[#80736F] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-blue-600">Transactions</span>
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-[#302725]">
                  {cashierStats?.totalTransactions || 0}
                </div>
                <p className="text-[11px] text-[#80736F] mt-1">Total orders processed today →</p>
              </div>

              <div
                onClick={() => {
                  setOrderStatusFilter('Completed');
                  setActiveTab('orders');
                }}
                className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs cursor-pointer hover:border-emerald-500 transition group"
              >
                <div className="flex justify-between items-center text-[#80736F] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-700">Completed</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-700">
                  {cashierStats?.completedOrders || 0}
                </div>
                <p className="text-[11px] text-[#80736F] mt-1">Fulfilled successfully →</p>
              </div>

              <div
                onClick={() => {
                  setPaymentFilter('Pending');
                  setActiveTab('payments');
                }}
                className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs cursor-pointer hover:border-amber-500 transition group"
              >
                <div className="flex justify-between items-center text-[#80736F] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-amber-700">Pending Pay</span>
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-amber-700">
                  {cashierStats?.pendingPayments || 0}
                </div>
                <p className="text-[11px] text-[#80736F] mt-1">Awaiting settlement →</p>
              </div>

              <div
                onClick={() => {
                  setOrderStatusFilter('Cancelled');
                  setActiveTab('orders');
                }}
                className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs col-span-2 md:col-span-1 cursor-pointer hover:border-red-400 transition group"
              >
                <div className="flex justify-between items-center text-[#80736F] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-red-600">Cancelled</span>
                  <RotateCcw className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-red-600">
                  {cashierStats?.cancelledOrders || 0}
                </div>
                <p className="text-[11px] text-[#80736F] mt-1">Voided transactions →</p>
              </div>

            </div>

            {/* Quick Action: New Sale Banner */}
            <div className="bg-gradient-to-r from-[#762F3D] to-[#5F2030] text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A46D] bg-[#302725]/40 px-2.5 py-0.5 rounded-full inline-block">
                  Cashier Quick Action
                </span>
                <h3 className="font-serif text-xl font-bold">Start a New Point of Sale Transaction</h3>
                <p className="text-xs text-[#FAF7F2]/80 max-w-xl">
                  Quickly search products, select variants, scan or tender cash, apply promotional discounts, and issue tax receipts instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className="bg-[#C5A46D] hover:bg-[#B3935D] text-[#302725] px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Open POS Register</span>
              </button>
            </div>

            {/* Payment Method Breakdown & 7-Day Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Payment Method Breakdown */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E0D9] shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
                  <h3 className="font-serif font-bold text-lg text-[#302725]">Payment Methods (Today)</h3>
                  <span className="text-xs text-[#80736F]">Live Breakdown</span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      name: 'Cash',
                      icon: Banknote,
                      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                      amount: cashierStats?.paymentBreakdown?.cash?.amount || 0,
                      count: cashierStats?.paymentBreakdown?.cash?.count || 0
                    },
                    {
                      name: 'Debit / Credit Card',
                      icon: CreditCard,
                      color: 'text-blue-700 bg-blue-50 border-blue-200',
                      amount: cashierStats?.paymentBreakdown?.card?.amount || 0,
                      count: cashierStats?.paymentBreakdown?.card?.count || 0
                    },
                    {
                      name: 'Bank Transfer',
                      icon: Building2,
                      color: 'text-purple-700 bg-purple-50 border-purple-200',
                      amount: cashierStats?.paymentBreakdown?.bank?.amount || 0,
                      count: cashierStats?.paymentBreakdown?.bank?.count || 0
                    },
                    {
                      name: 'Cash on Delivery (COD)',
                      icon: Truck,
                      color: 'text-amber-700 bg-amber-50 border-amber-200',
                      amount: cashierStats?.paymentBreakdown?.cod?.amount || 0,
                      count: cashierStats?.paymentBreakdown?.cod?.count || 0
                    }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.name} className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9]">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${item.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-[#302725]">{item.name}</div>
                            <div className="text-[11px] text-[#80736F]">{item.count} transaction{item.count !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-[#762F3D]">Rs. {item.amount.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('payments')}
                  className="w-full mt-2 bg-[#FAF7F2] hover:bg-[#EFEAE3] text-[#302725] border border-[#E8E0D9] py-2.5 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-[#762F3D]" />
                  <span>View All Payment Records →</span>
                </button>
              </div>

              {/* Daily Sales Summary (Last 7 Days) */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8E0D9] shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Daily Sales Summary</h3>
                    <p className="text-xs text-[#80736F]">Real-time revenue metrics from MongoDB records</p>
                  </div>
                  <span className="bg-[#FAF7F2] border border-[#E8E0D9] px-3 py-1 rounded-full text-xs font-semibold text-[#80736F]">
                    Past 7 Days
                  </span>
                </div>

                <div className="space-y-3">
                  {cashierStats?.dailySummary && cashierStats.dailySummary.length > 0 ? (
                    cashierStats.dailySummary.map(day => {
                      const maxSale = Math.max(...cashierStats.dailySummary!.map(d => d.sales), 10000);
                      const percent = Math.min(100, Math.round((day.sales / maxSale) * 100));
                      return (
                        <div key={day.date} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-[#302725]">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[#80736F]">
                              <strong>Rs. {day.sales.toLocaleString()}</strong> ({day.count} orders)
                            </span>
                          </div>
                          <div className="w-full bg-[#FAF7F2] h-2.5 rounded-full overflow-hidden border border-[#E8E0D9]">
                            <div
                              className="bg-[#762F3D] h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-xs text-[#80736F]">Loading daily summary...</div>
                  )}
                </div>
              </div>

            </div>

            {/* Recent Cashier Transactions & Orders Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Transactions (2 Cols) */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8E0D9] shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Recent Cashier Transactions</h3>
                    <p className="text-xs text-[#80736F]">Latest orders settled through POS and online checkout</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('transactions')}
                    className="text-xs font-bold text-[#762F3D] hover:underline cursor-pointer"
                  >
                    View All Transactions →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Order #</th>
                        <th className="py-3 px-3">Date / Time</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Payment</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Total</th>
                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D9]">
                      {(cashierStats?.recentTransactions || orders.slice(0, 6)).map(tx => (
                        <tr key={tx.id} className="hover:bg-[#FAF7F2] transition">
                          <td className="py-3 px-3 font-bold text-[#762F3D]">{tx.orderNumber}</td>
                          <td className="py-3 px-3 text-[#80736F]">{tx.createdAt}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#302725]">{tx.customerName}</div>
                            <div className="text-[10px] text-[#80736F]">{tx.customerPhone}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-[#302725]">{tx.paymentMethod}</span>
                            <div className={`text-[10px] font-bold ${tx.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {tx.paymentStatus}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tx.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-[#302725]">
                            Rs. {(tx.total || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setActiveReceiptOrder(tx)}
                                title="Print Receipt"
                                className="p-1.5 rounded-lg border border-[#E8E0D9] text-[#762F3D] hover:bg-[#762F3D] hover:text-white transition cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderDetail(tx);
                                  setActiveTab('orderDetails');
                                }}
                                title="Inspect Details"
                                className="p-1.5 rounded-lg border border-[#E8E0D9] text-[#302725] hover:bg-[#FAF7F2] transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Orders Overview (1 Col) */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8E0D9] shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Recent Orders</h3>
                    <p className="text-xs text-[#80736F]">Latest kitchen orders</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#762F3D] hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {orders.slice(0, 5).map(ord => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setSelectedOrderDetail(ord);
                        setActiveTab('orderDetails');
                      }}
                      className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] hover:border-[#762F3D] transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#762F3D]">{ord.orderNumber}</span>
                          <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                            ord.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#302725] mt-0.5">{ord.customerName}</div>
                        <div className="text-[10px] text-[#80736F]">{ord.items?.length || 1} item(s) • {ord.paymentMethod}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xs text-[#302725]">Rs. {ord.total.toLocaleString()}</div>
                        <ChevronRight className="w-4 h-4 text-[#80736F] ml-auto mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 4. TAB 2: POINT OF SALE (POS REGISTER)                         */}
      {/* ============================================================== */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Catalog & Search (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Search & Category Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search products by name, flavor, or ingredients..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              {/* Dynamic Category Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === 'all'
                      ? 'bg-[#762F3D] text-white shadow-sm'
                      : 'bg-[#FAF7F2] text-[#302725] border border-[#E8E0D9] hover:bg-[#E8E0D9]/50'
                  }`}
                >
                  All Products ({products.length})
                </button>
                {categories.map(cat => {
                  const isSelected = selectedCategory === cat.slug || selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug || cat.name)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        isSelected
                          ? 'bg-[#762F3D] text-white shadow-sm'
                          : 'bg-[#FAF7F2] text-[#302725] border border-[#E8E0D9] hover:bg-[#E8E0D9]/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const stock = typeof product.stockQty === 'number' ? product.stockQty : 10;
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= 5;
                const inCartItem = posCart.find(i => i.productId === product.id);
                const inCartQty = inCartItem?.quantity || 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (!isOutOfStock) addToPosCart(product);
                    }}
                    className={`bg-white p-4 rounded-3xl border border-[#E8E0D9] shadow-xs flex flex-col justify-between space-y-3 transition group relative ${
                      isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-[#762F3D]'
                    }`}
                  >
                    {/* In-Cart Badge */}
                    {inCartQty > 0 && (
                      <span className="absolute top-2 right-2 z-10 bg-[#762F3D] text-white w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shadow-md">
                        {inCartQty}
                      </span>
                    )}

                    <div className="relative overflow-hidden rounded-2xl">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-2xl group-hover:scale-105 transition duration-300"
                      />
                      {/* Stock Indicator Badge */}
                      <div className="absolute bottom-2 left-2">
                        {isOutOfStock ? (
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            Low Stock ({stock})
                          </span>
                        ) : (
                          <span className="bg-emerald-600/90 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            In Stock ({stock})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#302725] line-clamp-1 group-hover:text-[#762F3D] transition">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-[#80736F] line-clamp-1 mt-0.5">
                        {product.category}
                      </p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E8E0D9]">
                        <span className="font-bold text-xs text-[#762F3D]">
                          Rs. {product.price.toLocaleString()}
                        </span>
                        <button
                          disabled={isOutOfStock}
                          className="p-1 rounded-lg bg-[#FAF7F2] group-hover:bg-[#762F3D] text-[#302725] group-hover:text-white transition disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Register Order Cart & Payment (Cols 8-12) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E8E0D9] shadow-sm space-y-6 sticky top-8">
            
            {/* Header & Cart Count */}
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Active Register Order</h3>
                <p className="text-[11px] text-[#80736F]">MM Alam Road Counter</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FAF7F2] border border-[#E8E0D9] px-2.5 py-1 rounded-xl text-xs font-bold text-[#762F3D]">
                  {posCart.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                </span>
                {posCart.length > 0 && (
                  <button
                    onClick={clearPosCart}
                    title="Clear Cart"
                    className="p-1 rounded-lg text-[#80736F] hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Customer Selector */}
            <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E0D9]">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-[#302725] uppercase tracking-wider">
                  Customer Information
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCustomerType('walk-in')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      customerType === 'walk-in'
                        ? 'bg-[#762F3D] text-white'
                        : 'bg-white text-[#80736F] border border-[#E8E0D9]'
                    }`}
                  >
                    Walk-in
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType('registered')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      customerType === 'registered'
                        ? 'bg-[#762F3D] text-white'
                        : 'bg-white text-[#80736F] border border-[#E8E0D9]'
                    }`}
                  >
                    Registered Account
                  </button>
                </div>
              </div>

              {customerType === 'walk-in' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-[#80736F] mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={walkInName}
                      onChange={e => setWalkInName(e.target.value)}
                      placeholder="Walk-in Customer"
                      className="w-full bg-white border border-[#E8E0D9] rounded-xl px-3 py-1.5 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#80736F] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={walkInPhone}
                      onChange={e => setWalkInPhone(e.target.value)}
                      placeholder="+92 300 0000000"
                      className="w-full bg-white border border-[#E8E0D9] rounded-xl px-3 py-1.5 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  <label className="block text-[10px] text-[#80736F]">Select Registered Customer (MongoDB)</label>
                  <Dropdown
                    value={selectedCustomerId}
                    onChange={setSelectedCustomerId}
                    placeholder="Search registered customer..."
                    options={[
                      { value: '', label: 'Select registered customer...' },
                      ...registeredCustomers.map(c => ({
                        value: c.id,
                        label: `${c.name} (${c.email}${c.phone ? ' • ' + c.phone : ''})`
                      }))
                    ]}
                    size="md"
                    className="w-full"
                    buttonClassName="bg-white font-medium text-xs"
                  />
                  {selectedCustomerId && (
                    <div className="text-[10px] text-emerald-700 font-semibold pt-1">
                      ✓ Order will automatically reflect in customer's portal
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-[#E8E0D9] space-y-2 pr-1">
              {posCart.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#80736F]">
                  <ShoppingBag className="w-8 h-8 mx-auto text-[#80736F]/40 mb-2" />
                  <span>Cart is empty. Click any product to add to order.</span>
                </div>
              ) : (
                posCart.map(item => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex justify-between items-center text-xs">
                    <div className="flex-1 pr-3">
                      <div className="font-semibold text-[#302725] line-clamp-1">{item.name}</div>
                      <div className="text-[10px] text-[#80736F]">
                        Rs. {item.price.toLocaleString()} each • Stock: {item.maxStock}
                      </div>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#E8E0D9] rounded-xl overflow-hidden bg-[#FAF7F2]">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 text-[#80736F] hover:bg-[#E8E0D9] transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#302725]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 text-[#80736F] hover:bg-[#E8E0D9] transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-[#762F3D] w-16 text-right">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 pt-3 border-t border-[#E8E0D9] text-xs">
              <div className="flex justify-between text-[#80736F]">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>

              {/* Discount Input */}
              <div className="flex justify-between items-center text-[#80736F]">
                <span>Discount (PKR)</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-24 text-right bg-[#FAF7F2] border border-[#E8E0D9] rounded-lg px-2 py-1 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              {/* Tax Toggle */}
              <div className="flex justify-between items-center text-[#80736F]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={e => setApplyTax(e.target.checked)}
                    className="rounded text-[#762F3D] focus:ring-[#762F3D]"
                  />
                  <span>Apply Sales Tax ({settings.taxRate || 5}%)</span>
                </label>
                <span>Rs. {taxAmount.toLocaleString()}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-sm font-bold text-[#302725] pt-2 border-t border-[#E8E0D9]">
                <span>Net Total Payable</span>
                <span className="text-lg text-[#762F3D]">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold text-[#302725] uppercase tracking-wider">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Cash', 'Card', 'Bank Transfer', 'COD'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-semibold text-center transition ${
                      paymentMethod === m
                        ? 'bg-[#762F3D] text-white border-[#762F3D] shadow-sm'
                        : 'bg-[#FAF7F2] text-[#302725] border-[#E8E0D9] hover:bg-white'
                    }`}
                  >
                    {m === 'Bank Transfer' ? 'Bank' : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendered & Change Due Calculator */}
            {paymentMethod === 'Cash' && (
              <div className="space-y-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-900">Cash Received (Tendered)</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={setExactCash}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                    >
                      Exact (Rs. {total})
                    </button>
                    <button
                      type="button"
                      onClick={() => addCashAmount(500)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                    >
                      +500
                    </button>
                    <button
                      type="button"
                      onClick={() => addCashAmount(1000)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                    >
                      +1000
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder={`e.g. ${total}`}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold text-[#302725] focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-emerald-200/80">
                  <span className="font-semibold text-emerald-900">Change Due to Customer:</span>
                  <span className={`text-base font-bold ${changeDue >= 0 ? 'text-emerald-800' : 'text-red-600'}`}>
                    Rs. {changeDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Special Instructions / Notes */}
            <div>
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Order notes / greeting instructions (optional)..."
                className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
              />
            </div>

            {/* Process Sale Button */}
            <button
              onClick={handleProcessSale}
              disabled={isSubmitting || posCart.length === 0}
              className="w-full bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Recording Transaction in MongoDB...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Process Sale & Print Receipt (Rs. {total.toLocaleString()})</span>
                </>
              )}
            </button>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      

        {/* 5. TAB 3: ORDER MANAGEMENT                                     */}
      {/* ============================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Search & Filter Header */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E0D9] shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Live Order Management</h3>
                <p className="text-xs text-[#80736F]">Real-time orders retrieved directly from MongoDB Atlas</p>
              </div>
              <div className="text-xs text-[#80736F]">
                Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#E8E0D9]">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by Order #, Customer, or Phone..."
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              {/* Status Filter */}
              <div>
                <Dropdown
                  value={orderStatusFilter}
                  onChange={setOrderStatusFilter}
                  options={[
                    { value: 'all', label: 'All Order Statuses' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Confirmed', label: 'Confirmed' },
                    { value: 'Preparing', label: 'Preparing' },
                    { value: 'Ready', label: 'Ready for Pickup / Dispatch' },
                    { value: 'Out for Delivery', label: 'Out for Delivery' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Cancelled', label: 'Cancelled' },
                  ]}
                  size="md"
                  className="w-full"
                  buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                />
              </div>

              {/* Payment Status Filter */}
              <div>
                <Dropdown
                  value={paymentStatusFilter}
                  onChange={setPaymentStatusFilter}
                  options={[
                    { value: 'all', label: 'All Payment Statuses' },
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Pending', label: 'Pending Payment' },
                    { value: 'Partial', label: 'Partial Advance' },
                    { value: 'Refunded', label: 'Refunded' },
                  ]}
                  size="md"
                  className="w-full"
                  buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer Details</th>
                    <th className="py-3.5 px-4">Fulfillment</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-center">Cashier Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#80736F] text-xs">
                        No orders matching the specified filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-[#FAF7F2]/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#762F3D]">{order.orderNumber}</div>
                          <div className="text-[10px] text-[#80736F]">{order.createdAt}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#302725]">{order.customerName}</div>
                          <div className="text-[10px] text-[#80736F]">{order.customerPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#302725]">{order.fulfillmentMethod}</span>
                          {order.deliveryAddress && (
                            <div className="text-[10px] text-[#80736F] line-clamp-1 max-w-xs">{order.deliveryAddress}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#302725]">{order.paymentMethod}</div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800'
                              : order.status === 'Ready'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#302725]">
                          Rs. {order.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Details */}
                            <button
                              onClick={() => { setSelectedOrderDetail(order); setActiveTab('orderDetails'); }}
                              title="View Order Details"
                              className="p-1.5 rounded-lg border border-[#E8E0D9] text-[#80736F] hover:text-[#762F3D] hover:bg-white transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Print Receipt */}
                            <button
                              onClick={() => setActiveReceiptOrder(order)}
                              title="Print Receipt"
                              className="p-1.5 rounded-lg border border-[#E8E0D9] text-[#762F3D] hover:bg-[#762F3D] hover:text-white transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Mark Paid Shortcut if pending */}
                            {order.paymentStatus !== 'Paid' && order.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleQuickStatusUpdate(order.id, order.status, 'Paid')}
                                title="Mark Payment as Paid"
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition"
                              >
                                Mark Paid
                              </button>
                            )}

                            {/* Mark Completed Shortcut */}
                            {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleQuickStatusUpdate(order.id, 'Completed', order.paymentStatus === 'Pending' ? 'Paid' : order.paymentStatus)}
                                title="Complete Order"
                                className="px-2 py-1 rounded-lg bg-[#762F3D] hover:bg-[#5F2030] text-white text-[10px] font-bold transition"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      

        {/* 6. TAB 4: SALES HISTORY                                        */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {/* History Aggregates Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs">
              <span className="text-xs font-semibold text-[#80736F] uppercase tracking-wider">Filtered Revenue</span>
              <div className="text-2xl font-serif font-bold text-[#762F3D] mt-1">
                Rs. {salesHistoryMetrics.totalRev.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#80736F] mt-0.5">Sum of all filtered fulfilled sales</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs">
              <span className="text-xs font-semibold text-[#80736F] uppercase tracking-wider">Filtered Transactions</span>
              <div className="text-2xl font-serif font-bold text-[#302725] mt-1">
                {salesHistoryMetrics.count}
              </div>
              <p className="text-[11px] text-[#80736F] mt-0.5">Valid sales transactions count</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs">
              <span className="text-xs font-semibold text-[#80736F] uppercase tracking-wider">Average Order Value (AOV)</span>
              <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
                Rs. {salesHistoryMetrics.aov.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#80736F] mt-0.5">Average ticket size per customer</p>
            </div>
          </div>

          {/* History Filters */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              {[
                { key: 'today', label: "Today's Sales" },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'week', label: 'Past 7 Days' },
                { key: 'all', label: 'All Recorded Sales' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setHistoryDateFilter(f.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    historyDateFilter === f.key
                      ? 'bg-[#762F3D] text-white shadow-sm'
                      : 'bg-[#FAF7F2] text-[#302725] border border-[#E8E0D9] hover:bg-[#E8E0D9]/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="w-full md:w-64">
              <Dropdown
                value={historyPaymentFilter}
                onChange={setHistoryPaymentFilter}
                options={[
                  { value: 'all', label: 'All Payment Methods' },
                  { value: 'Cash', label: 'Cash Only' },
                  { value: 'Card', label: 'Card Only' },
                  { value: 'Bank Transfer', label: 'Bank Transfer Only' },
                  { value: 'COD', label: 'Cash on Delivery (COD)' },
                ]}
                size="md"
                className="w-full"
                buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
              />
            </div>
          </div>

          {/* Sales History Log Table */}
          <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Transaction / Order #</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Cashier</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Reprint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {salesHistoryOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#80736F] text-xs">
                        No sales found for the selected time range.
                      </td>
                    </tr>
                  ) : (
                    salesHistoryOrders.map(sale => (
                      <tr key={sale.id} className="hover:bg-[#FAF7F2]/60 transition">
                        <td className="py-3.5 px-4 font-bold text-[#762F3D]">{sale.orderNumber}</td>
                        <td className="py-3.5 px-4 text-[#80736F]">{sale.createdAt}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#302725]">{sale.customerName}</td>
                        <td className="py-3.5 px-4 text-[#80736F]">{sale.cashierName || 'Ahmed Cashier'}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#302725]">{sale.paymentMethod}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#762F3D]">
                          Rs. {sale.total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setActiveReceiptOrder(sale)}
                            className="px-3 py-1.5 rounded-xl border border-[#E8E0D9] hover:bg-[#762F3D] hover:text-white text-[#762F3D] font-bold text-[11px] transition inline-flex items-center gap-1.5"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Reprint Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      

        {/* ============================================================== */}
        {/* NEW TAB: TRANSACTIONS MANAGEMENT                              */}
        {/* ============================================================== */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Transactions Header & Filters */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E0D9] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#302725]">Cashier Transactions Log</h2>
                  <p className="text-xs text-[#80736F]">Full ledger of completed, pending, and refunded sales transactions</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#FAF7F2] border border-[#E8E0D9] px-3 py-1.5 rounded-xl text-xs font-bold text-[#762F3D]">
                    {filteredTransactions.length} Record{filteredTransactions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by order #, customer, phone..."
                    value={txSearch}
                    onChange={e => setTxSearch(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                {/* Method Filter */}
                <div>
                  <select
                    value={txMethodFilter}
                    onChange={e => setTxMethodFilter(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl px-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  >
                    <option value="all">All Payment Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={txStatusFilter}
                    onChange={e => setTxStatusFilter(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl px-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="Paid">Paid (Settled)</option>
                    <option value="Pending">Pending Collection</option>
                    <option value="Refunded">Refunded / Failed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#80736F] uppercase text-[10px] tracking-wider border-b border-[#E8E0D9]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Transaction / Order #</th>
                      <th className="py-3.5 px-4 font-bold">Date & Time</th>
                      <th className="py-3.5 px-4 font-bold">Customer</th>
                      <th className="py-3.5 px-4 font-bold">Method</th>
                      <th className="py-3.5 px-4 font-bold">Cashier / Channel</th>
                      <th className="py-3.5 px-4 font-bold text-right">Amount</th>
                      <th className="py-3.5 px-4 font-bold text-center">Payment Status</th>
                      <th className="py-3.5 px-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D9]">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#80736F] text-xs">
                          No transactions matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-[#FAF7F2]/60 transition">
                          <td className="py-3.5 px-4 font-bold text-[#762F3D]">{tx.orderNumber}</td>
                          <td className="py-3.5 px-4 text-[#80736F]">{tx.createdAt}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#302725]">{tx.customerName}</div>
                            <div className="text-[10px] text-[#80736F]">{tx.customerPhone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#302725]">{tx.paymentMethod}</span>
                          </td>
                          <td className="py-3.5 px-4 text-[#80736F]">
                            {tx.cashierName || 'Online Checkout'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#762F3D]">
                            Rs. {(tx.total || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tx.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.paymentStatus === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActiveReceiptOrder(tx)}
                                title="Print Receipt"
                                className="px-2.5 py-1.5 rounded-xl border border-[#E8E0D9] text-[#762F3D] hover:bg-[#762F3D] hover:text-white transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Receipt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderDetail(tx);
                                  setActiveTab('orderDetails');
                                }}
                                title="Order Details"
                                className="px-2.5 py-1.5 rounded-xl border border-[#E8E0D9] text-[#302725] hover:bg-[#FAF7F2] transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* NEW TAB: PAYMENT RECORDS & LEDGER                              */}
        {/* ============================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Payment Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#80736F]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Paid Collections</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-serif text-2xl font-bold text-emerald-700">
                  Rs. {paymentMetrics.totalPaid.toLocaleString()}
                </div>
                <p className="text-[11px] text-[#80736F]">{paymentMetrics.paidCount} settled transactions</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#80736F]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Pending Collections</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="font-serif text-2xl font-bold text-amber-700">
                  Rs. {paymentMetrics.totalPending.toLocaleString()}
                </div>
                <p className="text-[11px] text-[#80736F]">{paymentMetrics.pendingCount} orders pending payment</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#80736F]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Cash in Drawer</span>
                  <Banknote className="w-4 h-4 text-[#762F3D]" />
                </div>
                <div className="font-serif text-2xl font-bold text-[#762F3D]">
                  Rs. {paymentMetrics.cashInDrawer.toLocaleString()}
                </div>
                <p className="text-[11px] text-[#80736F]">Physical cash receipts</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-1">
                <div className="flex items-center justify-between text-[#80736F]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Digital / Card Volume</span>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div className="font-serif text-2xl font-bold text-blue-700">
                  Rs. {paymentMetrics.digitalVolume.toLocaleString()}
                </div>
                <p className="text-[11px] text-[#80736F]">Cards & bank transfers</p>
              </div>
            </div>

            {/* Payment Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-[#E8E0D9] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#302725]">Payment Records & Settlement</h3>
                  <p className="text-xs text-[#80736F]">Accurate payment audit ledger preventing duplicate payment recordings</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'Paid', 'Pending'] as const).map(flt => (
                    <button
                      key={flt}
                      type="button"
                      onClick={() => setPaymentFilter(flt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        paymentFilter === flt
                          ? 'bg-[#762F3D] text-white'
                          : 'bg-[#FAF7F2] text-[#302725] hover:bg-[#E8E0D9]'
                      }`}
                    >
                      {flt === 'all' ? 'All Payments' : flt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter payment ledger by order number, customer name, or phone..."
                  value={paymentSearch}
                  onChange={e => setPaymentSearch(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>
            </div>

            {/* Payment Ledger Table */}
            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#80736F] uppercase text-[10px] tracking-wider border-b border-[#E8E0D9]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Order #</th>
                      <th className="py-3.5 px-4 font-bold">Date</th>
                      <th className="py-3.5 px-4 font-bold">Customer</th>
                      <th className="py-3.5 px-4 font-bold">Method</th>
                      <th className="py-3.5 px-4 font-bold text-right">Bill Total</th>
                      <th className="py-3.5 px-4 font-bold text-right">Tendered / Paid</th>
                      <th className="py-3.5 px-4 font-bold text-center">Status</th>
                      <th className="py-3.5 px-4 font-bold text-center">Payment Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D9]">
                    {filteredPaymentRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#80736F] text-xs">
                          No payment records found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPaymentRecords.map(record => {
                        const isPaid = record.paymentStatus === 'Paid';
                        return (
                          <tr key={record.id} className="hover:bg-[#FAF7F2]/60 transition">
                            <td className="py-3.5 px-4 font-bold text-[#762F3D]">{record.orderNumber}</td>
                            <td className="py-3.5 px-4 text-[#80736F]">{record.createdAt}</td>
                            <td className="py-3.5 px-4 font-semibold text-[#302725]">{record.customerName}</td>
                            <td className="py-3.5 px-4">{record.paymentMethod}</td>
                            <td className="py-3.5 px-4 text-right font-semibold text-[#302725]">
                              Rs. {(record.total || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#762F3D]">
                              Rs. {(record.amountReceived || record.amountPaid || (isPaid ? record.total : 0)).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {record.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                                  <Check className="w-3.5 h-3.5" />
                                  Settled
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentModalOrder(record);
                                    setRecordPaymentTendered(String(record.total));
                                  }}
                                  className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>Record Payment</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* NEW TAB: DEDICATED ORDER DETAILS VIEW                          */}
        {/* ============================================================== */}
        {activeTab === 'orderDetails' && (
          <div className="space-y-6 animate-fadeIn">
            {selectedOrderDetail ? (
              <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-sm p-6 sm:p-8 space-y-6">
                
                {/* Header with Back button & Order identifier */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[#E8E0D9] gap-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#762F3D] hover:underline flex items-center gap-1 mb-2 cursor-pointer"
                    >
                      ← Back to Orders List
                    </button>
                    <div className="flex items-center gap-3">
                      <h2 className="font-serif text-2xl font-bold text-[#302725]">
                        Order #{selectedOrderDetail.orderNumber}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedOrderDetail.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedOrderDetail.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedOrderDetail.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#80736F] mt-1">
                      Created on {selectedOrderDetail.createdAt} • Cashier: {selectedOrderDetail.cashierName || 'Ahmed Cashier'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveReceiptOrder(selectedOrderDetail)}
                      className="bg-[#762F3D] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>

                {/* Customer & Fulfillment Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF7F2] p-5 rounded-3xl border border-[#E8E0D9]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Customer Information</span>
                    <p className="font-bold text-sm text-[#302725]">{selectedOrderDetail.customerName}</p>
                    <p className="text-xs text-[#80736F]">Phone: {selectedOrderDetail.customerPhone || 'N/A'}</p>
                    {selectedOrderDetail.customerEmail && <p className="text-xs text-[#80736F]">Email: {selectedOrderDetail.customerEmail}</p>}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Fulfillment Details</span>
                    <p className="font-bold text-sm text-[#302725]">{selectedOrderDetail.fulfillmentMethod}</p>
                    {selectedOrderDetail.deliveryAddress && (
                      <p className="text-xs text-[#80736F]">Address: {selectedOrderDetail.deliveryAddress}</p>
                    )}
                    {selectedOrderDetail.notes && (
                      <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1">
                        <strong>Notes:</strong> {selectedOrderDetail.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Purchased Items Table */}
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-[#302725]">Purchased Items</h3>
                  <div className="border border-[#E8E0D9] rounded-2xl overflow-hidden divide-y divide-[#E8E0D9]">
                    {selectedOrderDetail.items?.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-[#FAF7F2] transition">
                        <div>
                          <p className="font-bold text-sm text-[#302725]">{item.name}</p>
                          {item.variant && <p className="text-[11px] text-[#80736F]">Size/Variant: {item.variant}</p>}
                          <p className="text-[11px] text-[#80736F]">Rs. {item.price.toLocaleString()} × {item.quantity}</p>
                        </div>
                        <div className="font-serif font-bold text-base text-[#762F3D]">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-2 text-xs">
                    <div className="flex justify-between text-[#80736F]">
                      <span>Payment Method:</span>
                      <span className="font-bold text-[#302725]">{selectedOrderDetail.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-[#80736F]">
                      <span>Payment Status:</span>
                      <span className={`font-bold ${selectedOrderDetail.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {selectedOrderDetail.paymentStatus}
                      </span>
                    </div>
                    {selectedOrderDetail.amountReceived !== undefined && (
                      <div className="flex justify-between text-[#80736F]">
                        <span>Tendered Amount:</span>
                        <span>Rs. {selectedOrderDetail.amountReceived.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedOrderDetail.changeDue !== undefined && selectedOrderDetail.changeDue > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Change Returned:</span>
                        <span>Rs. {selectedOrderDetail.changeDue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-2 text-xs">
                    <div className="flex justify-between text-[#80736F]">
                      <span>Subtotal:</span>
                      <span>Rs. {(selectedOrderDetail.subtotal || selectedOrderDetail.total).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#80736F]">
                      <span>Discount:</span>
                      <span>- Rs. {(selectedOrderDetail.discount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#80736F]">
                      <span>Delivery Fee:</span>
                      <span>Rs. {(selectedOrderDetail.deliveryFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-[#302725] pt-2 border-t border-[#E8E0D9]">
                      <span>Grand Total:</span>
                      <span className="text-[#762F3D]">Rs. {selectedOrderDetail.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Cashier Status Management Buttons */}
                <div className="pt-4 border-t border-[#E8E0D9] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {selectedOrderDetail.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate(selectedOrderDetail.id, 'Completed')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {selectedOrderDetail.status !== 'Cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusUpdate(selectedOrderDetail.id, 'Cancelled')}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="px-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-white text-[#302725] font-semibold text-xs hover:bg-[#FAF7F2] cursor-pointer"
                  >
                    Close Inspection
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-sm p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#FAF7F2] border border-[#E8E0D9] text-[#762F3D] flex items-center justify-center mx-auto">
                  <Eye className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-bold text-[#302725]">No Order Selected for Inspection</h3>
                  <p className="text-xs text-[#80736F] max-w-md mx-auto">
                    Select an order from the Orders list, Sales History, or Recent Transactions to view full line-item details, print receipts, and manage fulfillment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="bg-[#762F3D] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Browse Orders</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 7. MODAL: PRINTABLE RECEIPT (PROFESSIONAL BAKERY TICKET)      */}
      {/* ============================================================== */}
      {activeReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E8E0D9] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Controls Header (Not in print) */}
            <div className="p-4 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center print:hidden">
              <span className="font-bold text-xs uppercase tracking-wider text-[#762F3D]">
                Sales Receipt Preview
              </span>
              <button
                onClick={() => setActiveReceiptOrder(null)}
                className="p-1 rounded-full hover:bg-gray-200 text-[#80736F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div id="printable-receipt" className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-[#302725]">
              
              {/* Bakery Branding Header */}
              <div className="text-center space-y-1 border-b border-dashed border-[#80736F]/40 pb-4">
                <h2 className="font-serif font-bold text-xl text-[#302725]">
                  {settings.bakeryName || 'The Cake House'}
                </h2>
                <p className="text-[11px] text-[#80736F]">
                  {settings.tagline || 'Artisanal Bakery & Luxury Cakes'}
                </p>
                <p className="text-[10px] text-[#80736F]">
                  {settings.address || 'Gulberg III, MM Alam Road'}, {settings.city || 'Lahore, Pakistan'}
                </p>
                <p className="text-[10px] text-[#80736F]">
                  Tel: {settings.phone || '+92 300 1234567'} | Email: {settings.email || 'info@thecakehouse.pk'}
                </p>
              </div>

              {/* Transaction Metadata */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-[#80736F]/40 pb-3">
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Receipt / Order #:</span>
                  <span className="font-bold text-[#302725]">{activeReceiptOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Date & Time:</span>
                  <span>{activeReceiptOrder.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Cashier:</span>
                  <span>{activeReceiptOrder.cashierName || currentUser.name || 'Ahmed Cashier'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Customer:</span>
                  <span>{activeReceiptOrder.customerName}</span>
                </div>
                {activeReceiptOrder.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-[#80736F]">Phone:</span>
                    <span>{activeReceiptOrder.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Fulfillment:</span>
                  <span>{activeReceiptOrder.fulfillmentMethod}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2 border-b border-dashed border-[#80736F]/40 pb-3">
                <div className="grid grid-cols-12 font-bold text-[10px] uppercase text-[#80736F] border-b border-[#E8E0D9] pb-1">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-4 text-right">Total</div>
                </div>

                {activeReceiptOrder.items?.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[11px] py-0.5">
                    <div className="col-span-6 font-medium">
                      {item.name}
                      {item.variant && <span className="block text-[9px] text-[#80736F]">({item.variant})</span>}
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-4 text-right font-bold">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1.5 text-[11px] border-b border-dashed border-[#80736F]/40 pb-3">
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Subtotal:</span>
                  <span>Rs. {(activeReceiptOrder.subtotal || activeReceiptOrder.total).toLocaleString()}</span>
                </div>
                {activeReceiptOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>- Rs. {activeReceiptOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                {activeReceiptOrder.tax && activeReceiptOrder.tax > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-[#80736F]">Tax:</span>
                    <span>Rs. {activeReceiptOrder.tax.toLocaleString()}</span>
                  </div>
                ) : null}
                {activeReceiptOrder.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#80736F]">Delivery Fee:</span>
                    <span>Rs. {activeReceiptOrder.deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#762F3D] pt-1 border-t border-[#E8E0D9]">
                  <span>Total Amount Paid:</span>
                  <span>Rs. {activeReceiptOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Tendered & Change */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-[#80736F]/40 pb-3">
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Payment Method:</span>
                  <span className="font-bold">{activeReceiptOrder.paymentMethod}</span>
                </div>
                {activeReceiptOrder.amountReceived !== undefined && activeReceiptOrder.amountReceived > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#80736F]">Amount Tendered:</span>
                    <span>Rs. {activeReceiptOrder.amountReceived.toLocaleString()}</span>
                  </div>
                )}
                {activeReceiptOrder.changeDue !== undefined && activeReceiptOrder.changeDue > 0 && (
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Change Returned:</span>
                    <span>Rs. {activeReceiptOrder.changeDue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Receipt Footer Message */}
              <div className="text-center pt-2 space-y-1">
                <p className="font-serif font-bold text-xs text-[#762F3D]">Thank you for visiting The Cake House!</p>
                <p className="text-[10px] text-[#80736F]">Please retain this receipt for warranty and cake care assistance.</p>
                <p className="text-[9px] text-[#80736F]/60 pt-2 tracking-widest">*** OFFICIAL CASHIER RECEIPT ***</p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E0D9] flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setActiveReceiptOrder(null)}
                className="px-5 py-3 rounded-2xl border border-[#E8E0D9] bg-white font-bold text-xs text-[#302725] hover:bg-[#FAF7F2] transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      

      {/* ============================================================== */}
      {/* MODAL: RECORD PAYMENT CONFIRMATION                            */}
      {/* ============================================================== */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E8E0D9] p-5 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8E0D9]">
              <div>
                <span className="text-[10px] font-bold text-[#762F3D] uppercase tracking-wider">Payment Collection</span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">
                  Record Payment for #{paymentModalOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                className="p-1 rounded-full hover:bg-[#FAF7F2] text-[#80736F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-1 text-xs">
              <div className="flex justify-between text-[#80736F]">
                <span>Customer:</span>
                <span className="font-bold text-[#302725]">{paymentModalOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-[#80736F]">
                <span>Outstanding Balance:</span>
                <span className="font-serif font-bold text-base text-[#762F3D]">
                  Rs. {paymentModalOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#302725]">
                Tender Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Cash', 'Card', 'Bank Transfer'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRecordPaymentMethod(m)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      recordPaymentMethod === m
                        ? 'border-[#762F3D] bg-[#762F3D] text-white'
                        : 'border-[#E8E0D9] bg-white text-[#302725] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#302725]">
                Amount Received (Rs.)
              </label>
              <input
                type="number"
                value={recordPaymentTendered}
                onChange={e => setRecordPaymentTendered(e.target.value)}
                placeholder={String(paymentModalOrder.total)}
                className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-4 py-2.5 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E0D9] text-xs font-bold text-[#302725] hover:bg-[#FAF7F2] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRecordingPayment}
                onClick={handleConfirmPaymentRecord}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isRecordingPayment ? 'Recording...' : 'Confirm Paid'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </PortalLayout>
  );
};
