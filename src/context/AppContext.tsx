import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, UserRole, Product, CartItem, Order, CustomCakeRequest, 
  InventoryItem, ProductionTask, ProductionKanbanStatus, ProductionActivity, DeliveryTask, DeliveryStatus, DeliveryDashboardStats, Expense, NotificationItem,
  Category, BakerySettings, DashboardStats, Supplier, PurchaseOrder, StockMovement, RestockRequest
} from '../types';
import { 
  INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CUSTOM_CAKES, 
  INITIAL_INVENTORY, INITIAL_PRODUCTION_TASKS, INITIAL_DELIVERIES, INITIAL_EXPENSES, INITIAL_NOTIFICATIONS,
  INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS, INITIAL_STOCK_MOVEMENTS, INITIAL_RESTOCK_REQUESTS
} from '../data/mockData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: User;
  token: string | null;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole, targetUser?: { userId?: string; email?: string; name?: string }) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string; address: string }) => Promise<void>;
  logout: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  authModalMessage: string | null;
  setAuthModalMessage: (msg: string | null) => void;
  checkoutModalOpen: boolean;
  setCheckoutModalOpen: (open: boolean) => void;
  requireAuth: (actionDescription?: string, onSuccessRedirectToCheckout?: boolean, preferredTab?: 'login' | 'register') => boolean;

  currentView: string;
  setCurrentView: (view: string) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, variant?: string, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  
  // Data
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refetchProducts: () => Promise<void>;
  
  categories: Category[];
  addCategory: (cat: Partial<Category>) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  orders: Order[];
  createOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status'], paymentStatus?: Order['paymentStatus']) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  refetchOrders: () => Promise<void>;
  
  customCakes: CustomCakeRequest[];
  createCustomCake: (req: Omit<CustomCakeRequest, 'id' | 'requestNumber' | 'createdAt' | 'status'>) => void;
  updateCustomCakeStatus: (id: string, status: CustomCakeRequest['status'], quotedPrice?: number) => void;
  reviewCustomCake: (id: string) => Promise<void>;
  sendCustomCakeQuote: (id: string, quotedPrice: number, quotationNotes?: string) => Promise<void>;
  respondToQuotation: (id: string, action: 'approve' | 'reject', notes?: string) => Promise<boolean>;
  convertCustomCakeToOrder: (id: string, quotedPrice?: number, advancePaid?: number, paymentMethod?: string) => Promise<void>;
  deleteCustomCake: (id: string) => Promise<void>;
  cancelCustomCake: (id: string) => Promise<boolean>;
  refetchCustomCakes: () => Promise<void>;
  
  updateProfile: (data: { name?: string; phone?: string; email?: string; addresses?: string[]; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
  
  inventory: InventoryItem[];
  refetchInventory: () => Promise<void>;
  updateInventoryStock: (id: string, newStock: number) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  recordStockAdjustment: (data: { ingredientId: string; type: 'Received' | 'Used' | 'Wasted' | 'Adjustment'; quantity: number; reason: string; referenceNumber?: string; isAbsolute?: boolean }) => Promise<any>;
  
  suppliers: Supplier[];
  fetchSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  purchaseOrders: PurchaseOrder[];
  fetchPurchaseOrders: () => Promise<void>;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => Promise<void>;
  receivePurchaseOrderStock: (poId: string, receivedItems: Array<{ ingredientId: string; quantityReceived: number }>) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  
  stockMovements: StockMovement[];
  fetchStockMovements: () => Promise<void>;
  
  restockRequests: RestockRequest[];
  fetchRestockRequests: () => Promise<void>;
  updateRestockRequestStatus: (id: string, status: RestockRequest['status']) => Promise<void>;
  
  users: User[];
  fetchUsers: () => Promise<void>;
  addStaffUser: (user: { name: string; email: string; phone: string; role: string; password: string; status?: string }) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  settings: BakerySettings;
  updateSettings: (newSettings: Partial<BakerySettings>) => Promise<boolean>;

  dashboardStats: DashboardStats | null;
  fetchDashboardStats: () => Promise<void>;

  productionTasks: ProductionTask[];
  updateProductionStage: (id: string, stage: ProductionTask['stage'], notes?: string) => Promise<void>;
  updateProductionKanban: (id: string, updates: { kanbanStatus?: ProductionKanbanStatus; currentActivity?: ProductionActivity; stage?: ProductionTask['stage']; notes?: string }) => Promise<boolean>;
  reassignProductionTask: (id: string, bakerId: string, bakerName: string, deadline?: string, notes?: string) => Promise<boolean>;
  addProductionTask: (task: Omit<ProductionTask, 'id'>) => Promise<void>;
  refetchProductionTasks: () => Promise<void>;
  
  deliveries: DeliveryTask[];
  deliveryStats: DeliveryDashboardStats | null;
  fetchDeliveries: (query?: { status?: string; range?: string; search?: string }) => Promise<void>;
  fetchDeliveryStats: () => Promise<void>;
  createDeliveryTask: (task: Partial<DeliveryTask>) => Promise<DeliveryTask | null>;
  updateDeliveryStatus: (id: string, status: DeliveryStatus, notes?: string) => Promise<boolean>;
  confirmDelivery: (id: string, confirmation: { recipientName: string; deliveryNotes?: string; proofOfDelivery?: string; collectCod?: boolean }) => Promise<boolean>;
  failDelivery: (id: string, reason: string, notes?: string) => Promise<boolean>;
  collectCodPayment: (id: string, amount: number) => Promise<boolean>;
  
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
  
  toast: Toast | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedToken = localStorage.getItem('th_token');
    if (!savedToken) {
      // Default to guest role when no authenticated session exists
      return INITIAL_USERS.find(u => u.role === 'guest') || {
        id: 'u-guest',
        name: 'Guest Visitor',
        email: 'guest@thecakehouse.pk',
        phone: '',
        role: 'guest',
        status: 'active',
        addresses: [],
        createdAt: '2026-02-15'
      };
    }
    return INITIAL_USERS[0];
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('th_token'));
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [authModalMessage, setAuthModalMessage] = useState<string | null>(null);
  const [pendingPostAuthAction, setPendingPostAuthAction] = useState<'checkout' | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const [currentView, setCurrentView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['admin', 'reports', 'inventory', 'orders', 'products', 'settings', 'customers'].includes(hash)) {
      return 'admin';
    }
    return localStorage.getItem('th_view') || 'home';
  });

  useEffect(() => {
    try {
      localStorage.setItem('th_view', currentView);
    } catch (e) {}
  }, [currentView]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>('prod-1');
  
  // Persistent Cart via localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('th_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'c-1', productId: 'prod-1', name: 'Chocolate Fudge Cake (8 inch)', price: 4500, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', variant: '8 inch', quantity: 1 }
    ];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('th_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [customCakes, setCustomCakes] = useState<CustomCakeRequest[]>(INITIAL_CUSTOM_CAKES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'cat-1', name: 'Cakes', slug: 'cakes', description: 'Freshly baked celebration, layer, and cream cakes', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', itemCount: 6 },
    { id: 'cat-2', name: 'Cupcakes', slug: 'cupcakes', description: 'Gourmet frosted mini cupcakes and boxes', image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80', itemCount: 4 },
    { id: 'cat-3', name: 'Pastries & Desserts', slug: 'pastries', description: 'French eclairs, tarts, and luxury dessert cups', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', itemCount: 5 },
    { id: 'cat-4', name: 'Custom Celebration Cakes', slug: 'custom-cakes', description: 'Multi-tiered bespoke wedding and birthday cakes', image: '/assets/custom_wedding_cake.jpg', itemCount: 3 },
    { id: 'cat-5', name: 'Savory & Breads', slug: 'savory-breads', description: 'Artisan sourdough loaves, patties, and brioche', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', itemCount: 2 },
  ]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [settings, setSettings] = useState<BakerySettings>(() => {
    try {
      const cached = localStorage.getItem('th_settings');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      bakeryName: 'The Cake House',
      tagline: 'Artisanal Bakery & Luxury Cakes',
      email: 'info@thecakehouse.pk',
      phone: '+92 300 1234567',
      address: 'Gulberg III, MM Alam Road',
      city: 'Lahore, Pakistan',
      currency: 'PKR',
      deliveryFee: 250,
      freeDeliveryThreshold: 3500,
      taxRate: 5,
      businessHours: 'Mon–Sun, 10:00 AM–10:00 PM',
      instagram: '@thecakehouse.pk',
      facebook: 'thecakehousepakistan',
      whatsapp: '+92 300 1234567'
    };
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [productionTasks, setProductionTasks] = useState<ProductionTask[]>(INITIAL_PRODUCTION_TASKS);
  const [deliveries, setDeliveries] = useState<DeliveryTask[]>(INITIAL_DELIVERIES);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryDashboardStats | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toast, setToast] = useState<Toast | null>(null);

  // Inventory Management State
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>(INITIAL_RESTOCK_REQUESTS);

  // Fetch initial data
  const fetchData = async (authToken?: string | null) => {
    const effectiveToken = authToken !== undefined ? authToken : token;
    const authHeaders: HeadersInit = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

    try {
      const [prods, ords, cakes, inv, exps, cats, setts, tasks, sups, pos, movs, reqs, dels, notifs] = await Promise.all([
        fetch('/api/v1/products').then(r => r.json()).catch(() => null),
        fetch('/api/v1/orders', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/custom-cakes', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/inventory', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/expenses', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/categories').then(r => r.json()).catch(() => null),
        fetch('/api/v1/settings').then(r => r.json()).catch(() => null),
        fetch('/api/v1/production-tasks', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/suppliers', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/purchase-orders', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/inventory/movements', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/inventory/restock-requests', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/deliveries', { headers: authHeaders }).then(r => r.json()).catch(() => null),
        fetch('/api/v1/notifications', { headers: authHeaders }).then(r => r.json()).catch(() => null),
      ]);

      if (prods && Array.isArray(prods) && prods.length > 0) setProducts(prods);
      if (ords && Array.isArray(ords) && ords.length > 0) setOrders(ords);
      if (cakes && Array.isArray(cakes) && cakes.length > 0) setCustomCakes(cakes);
      if (inv && Array.isArray(inv) && inv.length > 0) setInventory(inv);
      if (exps && Array.isArray(exps) && exps.length > 0) setExpenses(exps);
      if (cats && Array.isArray(cats) && cats.length > 0) setCategories(cats);
      if (tasks && Array.isArray(tasks) && tasks.length > 0) setProductionTasks(tasks);
      if (sups && Array.isArray(sups) && sups.length > 0) setSuppliers(sups);
      if (pos && Array.isArray(pos) && pos.length > 0) setPurchaseOrders(pos);
      if (movs && Array.isArray(movs) && movs.length > 0) setStockMovements(movs);
      if (reqs && Array.isArray(reqs) && reqs.length > 0) setRestockRequests(reqs);
      if (dels && Array.isArray(dels) && dels.length > 0) setDeliveries(dels);
      if (notifs && Array.isArray(notifs)) setNotifications(notifs);
      if (setts && setts.bakeryName) {
        setSettings(setts);
        try {
          localStorage.setItem('th_settings', JSON.stringify(setts));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/v1/users', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
      }
    } catch (e) {
      console.warn('Failed to fetch users:', e);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/v1/analytics/dashboard', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (e) {
      console.warn('Failed to fetch dashboard stats:', e);
    }
  };

  // Check persisted token on mount & fetch user
  useEffect(() => {
    if (token) {
      fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setCurrentUser(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('th_token');
          setToken(null);
        });
    }

    fetchData(token);
    fetchDashboardStats();
    fetchUsers();
    fetchDeliveryStats();
  }, [token]);

  // Synchronize browser document title with dynamic store branding
  useEffect(() => {
    if (settings.bakeryName) {
      document.title = `${settings.bakeryName} - ${settings.tagline || 'Artisan Bakery & Luxury Cakes'}`;
    }
  }, [settings.bakeryName, settings.tagline]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => prev?.id === id ? null : prev);
    }, 3500);
  };

  const requireAuth = (
    message = 'Please sign in or create an account to proceed.',
    onSuccessRedirectToCheckout = true,
    preferredTab: 'login' | 'register' = 'login'
  ): boolean => {
    // If user has a valid authenticated session (token exists and not guest)
    if (token && currentUser.role !== 'guest') {
      return true;
    }

    setAuthModalMessage(message);
    setAuthModalTab(preferredTab);
    if (onSuccessRedirectToCheckout) {
      setPendingPostAuthAction('checkout');
    }
    // Navigate directly to the dedicated authentication page
    setCurrentView(preferredTab === 'register' ? 'register' : 'login');
    return false;
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setToken(data.token);
    localStorage.setItem('th_token', data.token);
    setCurrentUser(data.user);
    showToast(`Welcome back, ${data.user.name}!`);
    fetchData(data.token);

    // If there was a pending checkout action, restore and trigger checkout modal
    if (pendingPostAuthAction === 'checkout') {
      setPendingPostAuthAction(null);
      setCheckoutModalOpen(true);
      return;
    }

    // Role-based redirect
    if (data.user.role === 'admin') setCurrentView('admin-dashboard');
    else if (data.user.role === 'cashier') setCurrentView('pos');
    else if (data.user.role === 'baker') setCurrentView('baker');
    else if (data.user.role === 'inventory_manager') setCurrentView('inventory-portal');
    else if (data.user.role === 'delivery') setCurrentView('delivery');
    else setCurrentView('customer-portal');
  };

  const register = async (userData: { name: string; email: string; phone: string; password: string; address: string }) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    setToken(data.token);
    localStorage.setItem('th_token', data.token);
    setCurrentUser(data.user);
    showToast('Customer account registered successfully!');
    fetchData(data.token);

    // If there was a pending checkout action, restore and trigger checkout modal
    if (pendingPostAuthAction === 'checkout') {
      setPendingPostAuthAction(null);
      setCheckoutModalOpen(true);
      return;
    }

    setCurrentView('customer-portal');
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('th_token');
    const guestUser = INITIAL_USERS.find(u => u.role === 'guest') || {
      id: 'u-guest',
      name: 'Guest Visitor',
      email: 'guest@thecakehouse.pk',
      phone: '',
      role: 'guest',
      status: 'active',
      addresses: [],
      createdAt: '2026-02-15'
    };
    setCurrentUser(guestUser);
    setOrders([]);
    setCustomCakes([]);
    setCurrentView('home');
    showToast('Signed out successfully', 'info');
  };

  const switchRole = async (role: UserRole, targetUser?: { userId?: string; email?: string; name?: string }) => {
    try {
      const res = await fetch('/api/v1/auth/switch-demo-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, userId: targetUser?.userId, email: targetUser?.email })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('th_token', data.token);
        } else {
          setToken(null);
          localStorage.removeItem('th_token');
        }
        setCurrentUser(data.user);
        const displayName = targetUser?.name || data.user.name || role.replace('_', ' ').toUpperCase();
        showToast(`Switched account to ${displayName}`, 'info');
        
        fetchData(data.token);
        // Refresh admin data if switched to admin
        if (role === 'admin') {
          fetchDashboardStats();
          fetchUsers();
        }
        return;
      }
    } catch (e) {
      console.warn('Switch demo role backend sync error:', e);
    }

    // Fallback local switch
    const found = INITIAL_USERS.find(u => u.role === role) || {
      ...INITIAL_USERS[0],
      role,
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`
    };
    setCurrentUser(found);
    showToast(`Switched view to ${role.replace('_', ' ').toUpperCase()}`, 'info');
  };

  const addToCart = (product: Product, variant?: string, quantity = 1) => {
    const variantObj = product.variants?.find(v => v.size === variant);
    const price = variantObj ? variantObj.price : product.price;
    const variantName = variant ? `${product.name} (${variant})` : product.name;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.variant === variant);
      if (existing) {
        return prev.map(item => item.id === existing.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        productId: product.id,
        name: variantName,
        price,
        image: product.images[0],
        variant,
        quantity
      }];
    });
    showToast(`Added ${product.name} to cart!`);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity: qty } : item));
  };

  const clearCart = () => setCart([]);

  // --- PRODUCTS CRUD ---
  const addProduct = async (product: Product) => {
    setProducts(prev => [product, ...prev]);
    showToast('Product added successfully!');

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/products', {
        method: 'POST',
        headers,
        body: JSON.stringify(product)
      });
      if (res.ok) {
        const saved = await res.json();
        setProducts(prev => prev.map(p => p.id === product.id ? saved : p));
        fetchDashboardStats();
      }
    } catch (err) {
      console.warn('Backend product add sync error:', err);
    }
  };

  const updateProduct = async (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    showToast('Product updated successfully!');

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/products/${updated.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Backend product update sync error:', err);
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product deleted from catalog', 'info');

    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/products/${id}`, {
        method: 'DELETE',
        headers
      });
      fetchDashboardStats();
    } catch (err) {
      console.warn('Backend product delete sync error:', err);
    }
  };

  const refetchProducts = async () => {
    try {
      const res = await fetch('/api/v1/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      }
    } catch (e) {
      console.warn('Refetch products error:', e);
    }
  };

  // --- CATEGORIES CRUD ---
  const addCategory = async (catData: Partial<Category>) => {
    const newCat: Category = {
      id: catData.id || `cat-${Date.now()}`,
      name: catData.name || 'New Category',
      slug: catData.slug || (catData.name ? catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'category'),
      description: catData.description || '',
      image: catData.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      itemCount: 0
    };
    setCategories(prev => [...prev, newCat]);
    showToast('Category created successfully!');

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        const saved = await res.json();
        setCategories(prev => prev.map(c => c.id === newCat.id ? saved : c));
      }
    } catch (err) {
      console.warn('Backend category add sync error:', err);
    }
  };

  const updateCategory = async (id: string, catData: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...catData } : c));
    showToast('Category updated successfully!');

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/categories/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(catData)
      });
    } catch (err) {
      console.warn('Backend category update sync error:', err);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Category deleted', 'info');

    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers
      });
    } catch (err) {
      console.warn('Backend category delete sync error:', err);
    }
  };

  // --- ORDERS CRUD ---
  const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Promise<Order> => {
    const tempNumber = `#TH-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempId = `ord-${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: tempId,
      orderNumber: tempNumber,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(newOrder)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errorMsg = errJson.error || 'Failed to place order';
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      let savedOrder = newOrder;
      const data = await res.json();
      if (data && data.id) {
        savedOrder = data;
      }

      setOrders(prev => [savedOrder, ...prev.filter(o => o.id !== savedOrder.id)]);
      clearCart();
      showToast(`Order ${savedOrder.orderNumber} placed successfully!`);

      setNotifications(prev => [{
        id: `notif-${Date.now()}`,
        title: 'New Order Placed',
        message: `Order ${savedOrder.orderNumber} placed by ${savedOrder.customerName} (Rs. ${savedOrder.total.toLocaleString()})`,
        type: 'order',
        read: false,
        createdAt: 'Just now'
      }, ...prev]);

      fetchDashboardStats();
      refetchProducts();
      return savedOrder;
    } catch (err: any) {
      if (err.message && (err.message.includes('Insufficient stock') || err.message.includes('stock'))) {
        throw err;
      }
      console.warn('Backend order placement error, fallback to local:', err);
      setOrders(prev => [newOrder, ...prev]);
      clearCart();
      showToast(`Order ${newOrder.orderNumber} placed!`);
      return newOrder;
    }
  };

  const refetchOrders = async () => {
    try {
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/v1/orders', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (e) {
      console.warn('Refetch orders warning:', e);
    }
  };

  const refetchCustomCakes = async () => {
    try {
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/v1/custom-cakes', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCustomCakes(data);
      }
    } catch (e) {
      console.warn('Refetch custom cakes warning:', e);
    }
  };

  const updateProfile = async (data: { name?: string; phone?: string; email?: string; addresses?: string[]; avatar?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Failed to update profile', 'error');
        return { success: false, error: result.error };
      }

      if (result.user) {
        setCurrentUser(result.user);
        showToast('Profile updated successfully!');
      }
      return { success: true };
    } catch (err: any) {
      showToast(err.message || 'Error updating profile', 'error');
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/v1/auth/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Failed to change password', 'error');
        return { success: false, error: result.error };
      }
      showToast('Password changed successfully!');
      return { success: true };
    } catch (err: any) {
      showToast(err.message || 'Error changing password', 'error');
      return { success: false, error: err.message };
    }
  };

  const cancelCustomCake = async (id: string): Promise<boolean> => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/custom-cakes/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setCustomCakes(prev => prev.filter(c => c.id !== id));
        showToast('Custom cake request cancelled successfully');
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to cancel request', 'error');
        return false;
      }
    } catch (e: any) {
      showToast(e.message || 'Error cancelling request', 'error');
      return false;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status'], paymentStatus?: Order['paymentStatus']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o));
    showToast(`Order status updated to ${status}`);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, ...(paymentStatus ? { paymentStatus } : {}) })
      });
      fetchDashboardStats();
    } catch (err) {
      console.warn('Backend order status sync error:', err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    showToast('Order removed from records', 'info');

    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/orders/${orderId}`, {
        method: 'DELETE',
        headers
      });
      fetchDashboardStats();
    } catch (err) {
      console.warn('Backend order delete error:', err);
    }
  };

  // --- CUSTOM CAKES ---
  const createCustomCake = async (reqData: Omit<CustomCakeRequest, 'id' | 'requestNumber' | 'createdAt' | 'status'>) => {
    const reqNumber = `#CC-${Math.floor(500 + Math.random() * 500)}`;
    const newReq: CustomCakeRequest = {
      ...reqData,
      id: `cc-${Date.now()}`,
      requestNumber: reqNumber,
      status: 'Pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setCustomCakes(prev => [newReq, ...prev]);
    showToast(`Custom cake request ${reqNumber} submitted!`);
    
    setNotifications(prev => [{
      id: `notif-${Date.now()}`,
      title: 'New Custom Cake Request',
      message: `Request ${reqNumber} received for ${newReq.occasion}`,
      type: 'cake',
      read: false,
      createdAt: 'Just now'
    }, ...prev]);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/v1/custom-cakes', {
        method: 'POST',
        headers,
        body: JSON.stringify(newReq)
      });
    } catch (err) {
      console.warn('Backend custom cake sync:', err);
    }
  };

  const updateCustomCakeStatus = async (id: string, status: CustomCakeRequest['status'], quotedPrice?: number) => {
    setCustomCakes(prev => prev.map(c => c.id === id ? { ...c, status, ...(quotedPrice !== undefined ? { quotedPrice } : {}) } : c));
    showToast(`Custom cake request updated to ${status}`);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/custom-cakes/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, quotedPrice })
      });
    } catch (err) {
      console.warn('Backend custom cake status sync:', err);
    }
  };

  const reviewCustomCake = async (id: string) => {
    setCustomCakes(prev => prev.map(c => c.id === id ? { ...c, status: 'Under Review' } : c));
    showToast('Custom cake request marked Under Review', 'info');
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/custom-cakes/${id}/review`, { method: 'PATCH', headers });
    } catch (e) {
      console.warn('Review custom cake error:', e);
    }
  };

  const sendCustomCakeQuote = async (id: string, quotedPrice: number, quotationNotes?: string) => {
    setCustomCakes(prev => prev.map(c => c.id === id ? { ...c, status: 'Quotation Sent', quotedPrice, quotationNotes } : c));
    showToast(`Quotation of PKR ${quotedPrice.toLocaleString()} sent!`);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/custom-cakes/${id}/quote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ quotedPrice, quotationNotes })
      });
    } catch (e) {
      console.warn('Send quotation error:', e);
    }
  };

  const respondToQuotation = async (id: string, action: 'approve' | 'reject', notes?: string): Promise<boolean> => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/custom-cakes/${id}/quotation-response`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action, notes })
      });
      if (res.ok) {
        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
        setCustomCakes(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any, rejectionReason: notes } : c));
        showToast(action === 'approve' ? 'Quotation approved! Awaiting official order conversion.' : 'Quotation declined.', action === 'approve' ? 'success' : 'info');
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to submit quotation response', 'error');
        return false;
      }
    } catch (err) {
      console.warn('Respond to quotation error:', err);
      showToast('Error communicating quotation response to server', 'error');
      return false;
    }
  };

  const convertCustomCakeToOrder = async (id: string, quotedPrice?: number, advancePaid?: number, paymentMethod = 'Bank Transfer') => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/custom-cakes/${id}/convert-to-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ quotedPrice, advancePaid, paymentMethod })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alreadyConverted) {
          showToast(`Custom cake has already been converted to Order ${data.order?.orderNumber || ''}!`, 'info');
        } else {
          setOrders(prev => [data.order, ...prev.filter(o => o.id !== data.order.id)]);
          showToast(`Custom cake converted to Order ${data.order.orderNumber}!`);
        }
        setCustomCakes(prev => prev.map(c => c.id === id ? {
          ...c,
          status: 'Converted to Order',
          quotedPrice: quotedPrice || c.quotedPrice,
          convertedOrderId: data.order?.id,
          convertedOrderNumber: data.order?.orderNumber
        } : c));
        fetchDashboardStats();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to convert custom cake to order', 'error');
      }
    } catch (err) {
      console.warn('Convert custom cake error:', err);
      showToast('Error converting custom cake to order', 'error');
    }
  };

  const deleteCustomCake = async (id: string) => {
    setCustomCakes(prev => prev.filter(c => c.id !== id));
    showToast('Custom cake request deleted', 'info');

    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/custom-cakes/${id}`, {
        method: 'DELETE',
        headers
      });
    } catch (err) {
      console.warn('Backend delete custom cake error:', err);
    }
  };

  // --- INVENTORY CRUD ---
  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const cur = updates.currentStock !== undefined ? Number(updates.currentStock) : item.currentStock;
        const min = updates.minStock !== undefined ? Number(updates.minStock) : item.minStock;
        let status = item.status;
        if (cur <= 0) {
          status = 'Out of Stock';
        } else if (cur <= min * 0.3 || cur <= 2) {
          status = 'Critical';
        } else if (cur <= min) {
          status = 'Low Stock';
        } else {
          status = 'In Stock';
        }

        return { 
          ...item, 
          ...updates, 
          currentStock: cur,
          minStock: min,
          status: updates.status || status, 
          lastUpdated: new Date().toISOString().split('T')[0] 
        };
      }
      return item;
    }));

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/inventory/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setInventory(prev => prev.map(i => i.id === id ? updated : i));
        showToast('Inventory updated in database!');
      } else {
        showToast('Failed to update inventory in database', 'error');
      }
      fetchDashboardStats();
    } catch (err) {
      console.warn('Backend inventory stock sync error:', err);
      showToast('Error syncing inventory update to database', 'error');
    }
  };

  const updateInventoryStock = async (id: string, newStock: number) => {
    await updateInventoryItem(id, { currentStock: newStock });
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`
    };
    setInventory(prev => [newItem, ...prev]);
    showToast('New ingredient added to inventory');

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/inventory', {
        method: 'POST',
        headers,
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        const saved = await res.json();
        setInventory(prev => prev.map(i => i.id === newItem.id ? saved : i));
        fetchDashboardStats();
      }
    } catch (err) {
      console.warn('Backend inventory add sync error:', err);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    showToast('Inventory item deleted', 'info');

    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/inventory/${id}`, {
        method: 'DELETE',
        headers
      });
      fetchDashboardStats();
    } catch (err) {
      console.warn('Backend inventory delete sync error:', err);
    }
  };

  const refetchInventory = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/inventory', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setInventory(data);
      }
    } catch (e) {
      console.warn('Failed to refetch inventory:', e);
    }
  };

  const recordStockAdjustment = async (data: {
    ingredientId: string;
    type: 'Received' | 'Used' | 'Wasted' | 'Adjustment';
    quantity: number;
    reason: string;
    referenceNumber?: string;
    isAbsolute?: boolean;
  }) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/inventory/adjust', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        setInventory(prev => prev.map(i => i.id === data.ingredientId ? result.item : i));
        setStockMovements(prev => [result.movement, ...prev]);
        showToast(result.message || 'Stock updated successfully');
        fetchDashboardStats();
        return result;
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to record stock movement', 'error');
        throw new Error(err.error || 'Failed to record stock movement');
      }
    } catch (e: any) {
      showToast(e.message || 'Stock adjustment error', 'error');
      throw e;
    }
  };

  const fetchSuppliers = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/suppliers', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setSuppliers(data);
      }
    } catch (e) {
      console.warn('Failed to fetch suppliers:', e);
    }
  };

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/suppliers', {
        method: 'POST',
        headers,
        body: JSON.stringify(supplierData)
      });
      if (res.ok) {
        const saved = await res.json();
        setSuppliers(prev => [saved, ...prev]);
        showToast(`Supplier ${saved.name} added successfully!`);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add supplier', 'error');
        throw new Error(err.error || 'Failed to add supplier');
      }
    } catch (e: any) {
      showToast(e.message || 'Error adding supplier', 'error');
      throw e;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/suppliers/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
        showToast('Supplier details updated!');
      }
    } catch (e) {
      console.warn('Supplier update sync error:', e);
    }
  };

  const deleteSupplier = async (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    showToast('Supplier removed from directory', 'info');
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/suppliers/${id}`, { method: 'DELETE', headers });
    } catch (e) {
      console.warn('Supplier delete sync error:', e);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/purchase-orders', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPurchaseOrders(data);
      }
    } catch (e) {
      console.warn('Failed to fetch purchase orders:', e);
    }
  };

  const createPurchaseOrder = async (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/purchase-orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(poData)
      });
      if (res.ok) {
        const saved = await res.json();
        setPurchaseOrders(prev => [saved, ...prev]);
        showToast(`Purchase order ${saved.poNumber} created successfully!`);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create purchase order', 'error');
        throw new Error(err.error || 'Failed to create purchase order');
      }
    } catch (e: any) {
      showToast(e.message || 'Error creating purchase order', 'error');
      throw e;
    }
  };

  const receivePurchaseOrderStock = async (poId: string, receivedItems: Array<{ ingredientId: string; quantityReceived: number }>) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/purchase-orders/${poId}/receive`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ receivedItems })
      });
      if (res.ok) {
        const result = await res.json();
        setPurchaseOrders(prev => prev.map(po => po.id === poId ? result.purchaseOrder : po));
        if (result.movements && Array.isArray(result.movements)) {
          setStockMovements(prev => [...result.movements, ...prev]);
        }
        await refetchInventory();
        await fetchRestockRequests();
        fetchDashboardStats();
        showToast(result.message || 'Stock successfully received and added to inventory!');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to receive purchase order stock', 'error');
        throw new Error(err.error || 'Failed to receive stock');
      }
    } catch (e: any) {
      showToast(e.message || 'Error receiving stock', 'error');
      throw e;
    }
  };

  const deletePurchaseOrder = async (id: string) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    showToast('Purchase order deleted', 'info');
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/purchase-orders/${id}`, { method: 'DELETE', headers });
    } catch (e) {
      console.warn('PO delete sync error:', e);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/inventory/movements', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStockMovements(data);
      }
    } catch (e) {
      console.warn('Failed to fetch stock movements:', e);
    }
  };

  const fetchRestockRequests = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/inventory/restock-requests', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRestockRequests(data);
      }
    } catch (e) {
      console.warn('Failed to fetch restock requests:', e);
    }
  };

  const updateRestockRequestStatus = async (id: string, status: RestockRequest['status']) => {
    setRestockRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/inventory/restock-requests/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Restock request marked as ${status}`);
      }
    } catch (e) {
      console.warn('Restock request status sync error:', e);
    }
  };

  // --- USERS & STAFF MANAGEMENT ---
  const addStaffUser = async (userData: { name: string; email: string; phone: string; role: string; password: string; status?: string }) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff account');
      setUsers(prev => [data, ...prev]);
      showToast(`Staff member ${data.name} added successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Error creating staff user', 'error');
      throw err;
    }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    showToast('User updated successfully');

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/v1/users/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.warn('Backend user update sync error:', err);
    }
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('User account deleted', 'info');

    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to delete user', 'error');
        fetchUsers();
      }
    } catch (err) {
      console.warn('Backend user delete sync error:', err);
    }
  };

  // --- SETTINGS ---
  const updateSettings = async (newSettings: Partial<BakerySettings>): Promise<boolean> => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
        try {
          localStorage.setItem('th_settings', JSON.stringify(saved));
        } catch (e) {}
        showToast('Settings saved successfully!');
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save settings to database', 'error');
        return false;
      }
    } catch (err) {
      console.warn('Backend settings update sync error:', err);
      showToast('Network error saving settings', 'error');
      return false;
    }
  };

  const refetchProductionTasks = async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/production-tasks', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProductionTasks(data);
      }
    } catch (e) {
      console.warn('Refetch production tasks warning:', e);
    }
  };

  const updateProductionKanban = async (
    id: string,
    updates: { kanbanStatus?: ProductionKanbanStatus; currentActivity?: ProductionActivity; stage?: ProductionTask['stage']; notes?: string }
  ): Promise<boolean> => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/production-tasks/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update production status', 'error');
        await refetchProductionTasks();
        return false;
      }
      setProductionTasks(prev => prev.map(pt => pt.id === id ? data : pt));
      await refetchOrders();
      await refetchCustomCakes();
      await refetchInventory();
      await fetchStockMovements();
      showToast(`Production updated: ${data.kanbanStatus || data.stage} (${data.currentActivity || 'Activity updated'})`, 'success');
      return true;
    } catch (e: any) {
      showToast(e.message || 'Error updating production', 'error');
      await refetchProductionTasks();
      return false;
    }
  };

  const reassignProductionTask = async (
    id: string,
    bakerId: string,
    bakerName: string,
    deadline?: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/production-tasks/${id}/reassign`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ assignedBakerId: bakerId, assignedBaker: bakerName, deadline, notes })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to reassign baker', 'error');
        return false;
      }
      setProductionTasks(prev => prev.map(pt => pt.id === id ? data : pt));
      await refetchOrders();
      showToast(`Order reassigned to ${bakerName}`, 'success');
      return true;
    } catch (e: any) {
      showToast(e.message || 'Error reassigning baker', 'error');
      return false;
    }
  };

  const updateProductionStage = async (id: string, stage: ProductionTask['stage'], notes?: string) => {
    let kanbanStatus: ProductionKanbanStatus = 'In Progress';
    let currentActivity: ProductionActivity = 'Preparing';
    if (stage === 'Queued') {
      kanbanStatus = 'Assigned';
      currentActivity = 'None';
    } else if (stage === 'Completed' || stage === 'Quality Check') {
      kanbanStatus = 'Ready';
      currentActivity = 'Ready';
    } else if (stage === 'Baking') {
      currentActivity = 'Baking';
    } else if (stage === 'Decorating') {
      currentActivity = 'Decorating';
    }

    await updateProductionKanban(id, { kanbanStatus, currentActivity, stage, notes });
  };

  const addProductionTask = async (taskData: Omit<ProductionTask, 'id'>) => {
    const newTask: ProductionTask = {
      ...taskData,
      id: `pt-${Date.now()}`
    };
    setProductionTasks(prev => [newTask, ...prev]);
    showToast('Production task assigned');

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/production-tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        const saved = await res.json();
        setProductionTasks(prev => prev.map(pt => pt.id === newTask.id ? saved : pt));
      }
    } catch (e) {
      console.warn('Sync production task add warning:', e);
    }
  };

  const fetchDeliveries = async (query?: { status?: string; range?: string; search?: string }) => {
    try {
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams();
      if (query?.status) params.append('status', query.status);
      if (query?.range) params.append('range', query.range);
      if (query?.search) params.append('search', query.search);
      const res = await fetch(`/api/v1/deliveries?${params.toString()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDeliveries(data);
      }
    } catch (e) {
      console.warn('Failed to fetch deliveries:', e);
    }
  };

  const fetchDeliveryStats = async () => {
    try {
      const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/v1/deliveries/stats', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDeliveryStats(data);
      }
    } catch (e) {
      console.warn('Failed to fetch delivery stats:', e);
    }
  };

  const updateDeliveryStatus = async (id: string, status: DeliveryStatus, notes?: string): Promise<boolean> => {
    try {
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/v1/deliveries/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update delivery status');
      
      setDeliveries(prev => prev.map(d => d.id === id ? data.delivery : d));
      showToast(data.message || `Delivery status updated to ${status}`);
      fetchDeliveryStats();
      fetchData(token);
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error updating delivery status', 'error');
      return false;
    }
  };

  const confirmDelivery = async (id: string, confirmation: { recipientName: string; deliveryNotes?: string; proofOfDelivery?: string; collectCod?: boolean }): Promise<boolean> => {
    try {
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/v1/deliveries/${id}/confirm`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(confirmation)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm delivery');
      
      setDeliveries(prev => prev.map(d => d.id === id ? data.delivery : d));
      showToast(data.message || 'Delivery successfully confirmed and completed!');
      fetchDeliveryStats();
      fetchData(token);
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error confirming delivery', 'error');
      return false;
    }
  };

  const failDelivery = async (id: string, reason: string, notes?: string): Promise<boolean> => {
    try {
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/v1/deliveries/${id}/fail`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ failedReason: reason, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record failed delivery');
      
      setDeliveries(prev => prev.map(d => d.id === id ? data.delivery : d));
      showToast(data.message || 'Delivery marked as failed', 'error');
      fetchDeliveryStats();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error recording failed delivery', 'error');
      return false;
    }
  };

  const collectCodPayment = async (id: string, amount: number): Promise<boolean> => {
    try {
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(`/api/v1/deliveries/${id}/cod-collect`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ amountCollected: amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record COD payment');
      
      setDeliveries(prev => prev.map(d => d.id === id ? data.delivery : d));
      showToast(data.message || 'COD payment recorded successfully!');
      fetchDeliveryStats();
      fetchData(token);
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error recording COD payment', 'error');
      return false;
    }
  };

  const createDeliveryTask = async (deliveryData: Partial<DeliveryTask>): Promise<DeliveryTask | null> => {
    try {
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch('/api/v1/deliveries', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(deliveryData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to dispatch delivery task');
      }
      const data = await res.json();
      setDeliveries(prev => [data, ...prev]);
      showToast(`Dispatched delivery #${data.orderNumber} to ${data.assignedStaff || 'courier'}`);
      fetchDeliveries();
      fetchDeliveryStats();
      return data;
    } catch (err: any) {
      showToast(err.message || 'Error creating delivery task', 'error');
      return null;
    }
  };

  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => [newExp, ...prev]);
    showToast('Expense recorded successfully');
  };

  const refetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (e) {}
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (token) {
      try {
        await fetch(`/api/v1/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {}
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (token) {
      try {
        await fetch('/api/v1/notifications/read-all', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {}
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, token, setCurrentUser, switchRole,
      login, register, logout,
      authModalOpen, setAuthModalOpen, authModalTab, setAuthModalTab,
      authModalMessage, setAuthModalMessage,
      checkoutModalOpen, setCheckoutModalOpen,
      requireAuth,
      currentView, setCurrentView,
      selectedProductId, setSelectedProductId,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
      isCartOpen, setIsCartOpen,
      products, addProduct, updateProduct, deleteProduct, refetchProducts,
      categories, addCategory, updateCategory, deleteCategory,
      orders, createOrder, updateOrderStatus, deleteOrder, refetchOrders,
      customCakes, createCustomCake, updateCustomCakeStatus, reviewCustomCake, sendCustomCakeQuote, respondToQuotation, convertCustomCakeToOrder, deleteCustomCake, cancelCustomCake, refetchCustomCakes,
      updateProfile, changePassword,
      inventory, refetchInventory, updateInventoryStock, updateInventoryItem, addInventoryItem, deleteInventoryItem, recordStockAdjustment,
      suppliers, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier,
      purchaseOrders, fetchPurchaseOrders, createPurchaseOrder, receivePurchaseOrderStock, deletePurchaseOrder,
      stockMovements, fetchStockMovements,
      restockRequests, fetchRestockRequests, updateRestockRequestStatus,
      users, fetchUsers, addStaffUser, updateUser, deleteUser,
      settings, updateSettings,
      dashboardStats, fetchDashboardStats,
      productionTasks, updateProductionStage, updateProductionKanban, reassignProductionTask, addProductionTask, refetchProductionTasks,
      deliveries, deliveryStats, fetchDeliveries, fetchDeliveryStats, createDeliveryTask, updateDeliveryStatus, confirmDelivery, failDelivery, collectCodPayment,
      expenses, addExpense,
      notifications, markNotificationRead, markAllNotificationsRead, refetchNotifications,
      toast, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
