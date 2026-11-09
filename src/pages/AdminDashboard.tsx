import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Dropdown } from '../components/Dropdown';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { CustomerContactModal } from '../components/CustomerContactModal';
import { Product, Order, CustomCakeRequest, InventoryItem, Category, User, BakerySettings, DeliveryTask, ProductionTask, isOrderRequiringPreparation, getProductionKanbanStatus, getProductionActivity, ProductionKanbanStatus, ProductionActivity } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, Sparkles, Package, Warehouse, Users, 
  DollarSign, Settings as SettingsIcon, Bell, CheckCircle2, AlertTriangle, 
  Plus, Edit, Trash2, Eye, Printer, Download, UploadCloud, X, Search, 
  Filter, Calendar, TrendingUp, Layers, FileText, ShieldCheck, Check,
  ArrowUpRight, Clock, MapPin, Phone, Mail, Award, AlertCircle, Save, Loader2,
  ChefHat, Truck, Bike, Navigation, ArrowRight, CheckSquare, RefreshCw,
  ChevronDown, ClipboardList, History, ArrowDownRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, orders, customCakes, inventory, products, categories, users, 
    settings, dashboardStats, expenses, updateOrderStatus, deleteOrder, 
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    updateCustomCakeStatus, reviewCustomCake, sendCustomCakeQuote, respondToQuotation, convertCustomCakeToOrder, deleteCustomCake,
    addInventoryItem, updateInventoryStock, updateInventoryItem, deleteInventoryItem,
    stockMovements, fetchStockMovements, purchaseOrders, fetchPurchaseOrders, restockRequests, fetchRestockRequests, recordStockAdjustment, updateRestockRequestStatus,
    addStaffUser, updateUser, deleteUser,
    updateSettings, fetchDashboardStats, fetchUsers, showToast,
    productionTasks, addProductionTask, updateProductionStage, reassignProductionTask, refetchProductionTasks, refetchOrders,
    deliveries, createDeliveryTask, updateDeliveryStatus
  } = useApp();

  type TabType = 'dashboard' | 'products' | 'categories' | 'orders' | 'kitchen' | 'dispatch' | 'customers' | 'custom' | 'inventory' | 'staff' | 'reports' | 'settings';
  
  // Hash & Storage-based active tab state with refresh persistence
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const validTabs: TabType[] = ['dashboard', 'products', 'categories', 'orders', 'kitchen', 'dispatch', 'customers', 'custom', 'inventory', 'staff', 'reports', 'settings'];
    const hash = window.location.hash.replace('#', '') as TabType;
    if (validTabs.includes(hash)) return hash;
    const saved = localStorage.getItem('th_admin_tab') as TabType;
    if (saved && validTabs.includes(saved)) return saved;
    return 'dashboard';
  });

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    window.location.hash = newTab;
    localStorage.setItem('th_admin_tab', newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync hash changes on browser popstate/hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const validTabs: TabType[] = ['dashboard', 'products', 'categories', 'orders', 'kitchen', 'dispatch', 'customers', 'custom', 'inventory', 'staff', 'reports', 'settings'];
      const hash = window.location.hash.replace('#', '') as TabType;
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Trigger initial fetch of dashboard stats & users
  useEffect(() => {
    fetchDashboardStats();
    fetchUsers();
  }, []);

  // --- OVERVIEW / DYNAMIC STATS ---
  const totalRev = dashboardStats?.totalRevenue ?? orders.filter(o => o.status === 'Completed' || o.status === 'Out for Delivery').reduce((sum, o) => sum + (o.total || 0), 0);
  const todayRev = dashboardStats?.todayRevenue ?? 0;
  const totalOrdersCount = dashboardStats?.totalOrders ?? orders.length;
  const pendingOrdersCount = dashboardStats?.pendingOrders ?? orders.filter(o => ['Pending', 'Confirmed', 'Preparing'].includes(o.status)).length;
  const completedOrdersCount = dashboardStats?.completedOrders ?? orders.filter(o => o.status === 'Completed').length;
  
  // Dynamic Low Stock Calculation directly from live inventory items
  const lowStockItems = inventory.filter(i => {
    const cur = Number(i.currentStock ?? 0);
    const min = Number(i.minStock ?? 10);
    return cur <= min || i.status === 'Low Stock' || i.status === 'Out of Stock' || i.status === 'Critical';
  });
  const lowStockCount = lowStockItems.length;
  const totalCustomersCount = dashboardStats?.totalCustomers ?? users.filter(u => u.role === 'customer').length;
  const totalProductsCount = dashboardStats?.totalProducts ?? products.length;

  const salesChartData = dashboardStats?.salesByDay && dashboardStats.salesByDay.length > 0 
    ? dashboardStats.salesByDay 
    : [
      { day: 'Mon', sales: 42000, orders: 12 },
      { day: 'Tue', sales: 38000, orders: 10 },
      { day: 'Wed', sales: 55000, orders: 16 },
      { day: 'Thu', sales: 48000, orders: 14 },
      { day: 'Fri', sales: 68000, orders: 20 },
      { day: 'Sat', sales: 92000, orders: 28 },
      { day: 'Sun', sales: 85000, orders: 24 }
    ];

  // --- FILTERS & SEARCH STATES ---
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');

  const [customerSearch, setCustomerSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [reportRange, setReportRange] = useState<'all' | 'today' | '7days' | '30days' | 'year'>('all');

  // --- MODAL STATES ---
  // Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<any>({
    name: '',
    category: 'Cakes',
    price: 3500,
    previousPrice: 0,
    description: '',
    images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'],
    inStock: true,
    stockQty: 25,
    featured: false,
    bestseller: false,
    ingredients: ['Flour', 'Butter', 'Cocoa', 'Sugar', 'Eggs'],
    allergens: ['Dairy', 'Eggs', 'Gluten']
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'
  });

  // Order Details & Invoice Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Custom Cake Quote & Conversion Modal
  const [selectedCustomCake, setSelectedCustomCake] = useState<CustomCakeRequest | null>(null);
  const [customCakeQuotePrice, setCustomCakeQuotePrice] = useState<number>(6500);
  const [customCakeAdvancePaid, setCustomCakeAdvancePaid] = useState<number>(2000);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [quoteModalCake, setQuoteModalCake] = useState<CustomCakeRequest | null>(null);
  const [quoteModalPrice, setQuoteModalPrice] = useState<number>(6500);
  const [quoteModalNotes, setQuoteModalNotes] = useState<string>('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [customCakeTabStatus, setCustomCakeTabStatus] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'catalog' | 'custom'>('all');

  // Customer Profile Modal
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  // Inventory Management State & Sub-tabs
  const [adminInventorySubTab, setAdminInventorySubTab] = useState<'levels' | 'movements' | 'orders' | 'requests'>('levels');
  const [adminMovementTypeFilter, setAdminMovementTypeFilter] = useState<string>('all');
  const [adminMovementSearch, setAdminMovementSearch] = useState('');
  const [adminPoFilter, setAdminPoFilter] = useState<string>('all');
  const [adminRestockFilter, setAdminRestockFilter] = useState<string>('all');

  // Stock Adjustment Modal
  const [adminAdjustModalOpen, setAdminAdjustModalOpen] = useState(false);
  const [adminAdjustIngredient, setAdminAdjustIngredient] = useState<InventoryItem | null>(null);
  const [adminAdjustType, setAdminAdjustType] = useState<'Received' | 'Used' | 'Wasted' | 'Adjustment'>('Adjustment');
  const [adminAdjustQty, setAdminAdjustQty] = useState('');
  const [adminAdjustReason, setAdminAdjustReason] = useState('');
  const [adminAdjustRef, setAdminAdjustRef] = useState('');
  const [isAdminAdjusting, setIsAdminAdjusting] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [inventoryFormData, setInventoryFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Baking Essentials',
    unit: 'kg',
    currentStock: 50,
    minStock: 15,
    purchaseCost: 850,
    supplier: 'Local Bakery Supplier',
    status: 'In Stock'
  });

  // Staff Modal & Filter State
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('all');
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    phone: '+92 300 0000000',
    role: 'baker',
    password: '',
    status: 'active'
  });

  // Baker Assignment Modal State
  const [assignBakerModalOrder, setAssignBakerModalOrder] = useState<Order | null>(null);
  const [selectedBakerId, setSelectedBakerId] = useState<string>('u-4');
  const [selectedBakerName, setSelectedBakerName] = useState<string>('Chef Tariq');
  const [bakerPriority, setBakerPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [bakerDeadline, setBakerDeadline] = useState<string>('');
  const [bakerNotes, setBakerNotes] = useState<string>('');
  const [isAssigningBaker, setIsAssigningBaker] = useState(false);

  // Baker Reassignment Modal State
  const [reassignModalTask, setReassignModalTask] = useState<ProductionTask | null>(null);
  const [reassignBakerId, setReassignBakerId] = useState<string>('u-4');
  const [reassignBakerName, setReassignBakerName] = useState<string>('Chef Tariq');
  const [reassignDeadline, setReassignDeadline] = useState<string>('');
  const [reassignNotes, setReassignNotes] = useState<string>('');
  const [isReassigningBaker, setIsReassigningBaker] = useState(false);

  // Baker Operations Filter & Dropdown State
  const [selectedBakerFilter, setSelectedBakerFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('th_admin_baker_filter') || 'all';
    } catch {
      return 'all';
    }
  });
  const [bakerDropdownOpen, setBakerDropdownOpen] = useState(false);
  const bakerDropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectBakerFilter = (bakerId: string) => {
    setSelectedBakerFilter(bakerId);
    try {
      localStorage.setItem('th_admin_baker_filter', bakerId);
    } catch {}
    setBakerDropdownOpen(false);
  };

  // Click outside listener for Baker Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bakerDropdownRef.current && !bakerDropdownRef.current.contains(event.target as Node)) {
        setBakerDropdownOpen(false);
      }
    };
    if (bakerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [bakerDropdownOpen]);

  // Automatic Data Synchronization for Inventory Tab
  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchStockMovements();
      fetchPurchaseOrders();
      fetchRestockRequests();
      const interval = setInterval(() => {
        fetchStockMovements();
        fetchPurchaseOrders();
        fetchRestockRequests();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Automatic Data Synchronization for Staff Tab
  useEffect(() => {
    if (activeTab === 'staff') {
      fetchUsers();
    }
  }, [activeTab]);

  // Automatic Data Synchronization for Baker Operations
  useEffect(() => {
    if (activeTab === 'kitchen') {
      fetchUsers();
      refetchProductionTasks();
      refetchOrders();
      const interval = setInterval(() => {
        fetchUsers();
        refetchProductionTasks();
        refetchOrders();
      }, 10000); // 10s lightweight polling

      const handleFocus = () => {
        fetchUsers();
        refetchProductionTasks();
        refetchOrders();
      };
      window.addEventListener('focus', handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [activeTab]);

  // Delivery Courier Assignment Modal State
  const [assignDeliveryModalOrder, setAssignDeliveryModalOrder] = useState<Order | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('u-6');
  const [selectedCourierName, setSelectedCourierName] = useState<string>('Bilal Raza');
  const [deliveryPriority, setDeliveryPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [deliveryScheduledAt, setDeliveryScheduledAt] = useState<string>('');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);

  // Customer Contact Confirmation Modal state (Centered Modal)
  const [contactModalData, setContactModalData] = useState<{
    isOpen: boolean;
    customerName: string;
    customerPhone: string;
  }>({
    isOpen: false,
    customerName: '',
    customerPhone: ''
  });

  const handleOpenCustomerContact = (order: Order, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Authoritatively resolve customer's phone number, never employee or delivery courier number
    let phone = order.customerPhone?.trim() || '';
    if (!phone || phone === '+92 300 0000000') {
      const customer = users.find(u => 
        (order.customerId && u.id === order.customerId) ||
        (order.customerEmail && u.email?.toLowerCase() === order.customerEmail.toLowerCase()) ||
        (order.customerName && u.name.toLowerCase() === order.customerName.toLowerCase())
      );
      if (customer && customer.role === 'customer' && customer.phone && customer.phone !== '+92 300 0000000') {
        phone = customer.phone.trim();
      }
    }

    setContactModalData({
      isOpen: true,
      customerName: order.customerName || 'Valued Customer',
      customerPhone: phone
    });
  };

  // Available Staff Lists
  const availableBakers = users.filter(u => u.role === 'baker' && u.status === 'active');
  const availableCouriers = users.filter(u => u.role === 'delivery' && u.status === 'active');

  const activeKitchenTasksCount = productionTasks.filter(t => t.stage !== 'Completed').length;
  const activeDeliveriesCount = deliveries.filter(d => ['Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(d.status)).length;
  const readyOrdersNeedingDelivery = orders.filter(o => {
    if (o.fulfillmentMethod !== 'Delivery') return false;
    const reqPrep = isOrderRequiringPreparation(o, products);
    const isReadyForDispatch = reqPrep 
      ? (o.status === 'Ready' || o.status === 'Completed')
      : (o.status === 'Confirmed' || o.status === 'Ready' || o.status === 'Completed');
    if (!isReadyForDispatch) return false;
    return !deliveries.some(d => (d.orderId === o.id || d.orderNumber === o.orderNumber) && (d.status as string) !== 'Cancelled' && d.status !== 'Returned');
  });

  const handleAssignBakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignBakerModalOrder) return;
    setIsAssigningBaker(true);
    try {
      const bakerUser = users.find(u => u.id === selectedBakerId || u.name === selectedBakerName);
      const bakerName = bakerUser ? bakerUser.name.trim() : (selectedBakerName || 'Chef Tariq');
      const bakerId = bakerUser ? bakerUser.id : (selectedBakerId || 'u-4');
      const deadline = bakerDeadline || new Date(Date.now() + 4 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 16);

      await addProductionTask({
        orderId: assignBakerModalOrder.id,
        orderNumber: assignBakerModalOrder.orderNumber,
        productName: assignBakerModalOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        quantity: assignBakerModalOrder.items.reduce((acc, i) => acc + i.quantity, 0),
        specifications: bakerNotes || `Customer: ${assignBakerModalOrder.customerName}`,
        assignedBaker: bakerName,
        assignedBakerId: bakerId,
        deadline,
        priority: bakerPriority,
        stage: 'Queued',
        notes: bakerNotes
      });

      await updateOrderStatus(assignBakerModalOrder.id, 'Preparing');
      showToast(`Assigned Order ${assignBakerModalOrder.orderNumber} to ${bakerName}`);
      setAssignBakerModalOrder(null);
      setBakerNotes('');
    } catch (err: any) {
      showToast(err.message || 'Failed to assign baker', 'error');
    } finally {
      setIsAssigningBaker(false);
    }
  };

  const handleReassignBakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalTask) return;
    setIsReassigningBaker(true);
    try {
      const bUser = users.find(u => u.id === reassignBakerId || u.name === reassignBakerName);
      const bName = bUser ? bUser.name.trim() : (reassignBakerName || 'Chef Tariq');
      const bId = bUser ? bUser.id : (reassignBakerId || 'u-4');

      await reassignProductionTask(
        reassignModalTask.id,
        bId,
        bName,
        reassignDeadline || reassignModalTask.deadline,
        reassignNotes || reassignModalTask.notes
      );
      setReassignModalTask(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to reassign baker', 'error');
    } finally {
      setIsReassigningBaker(false);
    }
  };

  const handleAssignDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDeliveryModalOrder) return;

    // Strict guard: verify readiness before assigning courier
    const reqPrep = isOrderRequiringPreparation(assignDeliveryModalOrder, products);
    if (reqPrep) {
      const isReady = assignDeliveryModalOrder.status === 'Ready' || assignDeliveryModalOrder.status === 'Completed';
      const bt = productionTasks.find(t => t.orderId === assignDeliveryModalOrder.id || t.orderNumber === assignDeliveryModalOrder.orderNumber);
      if (!isReady && bt?.stage !== 'Completed') {
        showToast(`Cannot assign courier to Order ${assignDeliveryModalOrder.orderNumber}. Order must be marked 'Ready' by kitchen first!`, 'error');
        return;
      }
    }

    setIsAssigningDelivery(true);
    try {
      const courierUser = users.find(u => u.id === selectedCourierId || u.name === selectedCourierName);
      const courierName = courierUser ? courierUser.name.trim() : (selectedCourierName || 'Bilal Raza');
      const courierId = courierUser ? courierUser.id : (selectedCourierId || 'u-6');
      const scheduledAt = deliveryScheduledAt || new Date(Date.now() + 2 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 16);

      const codAmount = assignDeliveryModalOrder.paymentStatus === 'Paid' 
        ? 0 
        : (assignDeliveryModalOrder.total - (assignDeliveryModalOrder.amountPaid || 0));

      const linkedCustomerUser = users.find(u => 
        (assignDeliveryModalOrder.customerId && u.id === assignDeliveryModalOrder.customerId) ||
        (assignDeliveryModalOrder.customerEmail && u.email?.toLowerCase() === assignDeliveryModalOrder.customerEmail.toLowerCase()) ||
        (assignDeliveryModalOrder.customerName && u.name.toLowerCase() === assignDeliveryModalOrder.customerName.toLowerCase())
      );
      const deliveryCustomerPhone = (assignDeliveryModalOrder.customerPhone && assignDeliveryModalOrder.customerPhone !== '+92 300 0000000')
        ? assignDeliveryModalOrder.customerPhone
        : (linkedCustomerUser?.phone || assignDeliveryModalOrder.customerPhone || '');

      await createDeliveryTask({
        orderId: assignDeliveryModalOrder.id,
        orderNumber: assignDeliveryModalOrder.orderNumber,
        customerName: assignDeliveryModalOrder.customerName,
        customerPhone: deliveryCustomerPhone,
        address: assignDeliveryModalOrder.deliveryAddress || 'Lahore, Pakistan',
        instructions: deliveryInstructions || `Fulfillment: Delivery`,
        items: assignDeliveryModalOrder.items.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          variant: i.variant,
          price: i.price
        })),
        totalAmount: assignDeliveryModalOrder.total,
        paymentMethod: assignDeliveryModalOrder.paymentMethod || 'Cash on Delivery',
        paymentStatus: assignDeliveryModalOrder.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
        codAmountDue: codAmount > 0 ? codAmount : 0,
        assignedStaff: courierName,
        assignedStaffId: courierId,
        scheduledAt,
        priority: deliveryPriority,
        status: 'Assigned'
      });

      if (assignDeliveryModalOrder.status !== 'Out for Delivery') {
        await updateOrderStatus(assignDeliveryModalOrder.id, 'Out for Delivery');
      }

      showToast(`Dispatched Order ${assignDeliveryModalOrder.orderNumber} to ${courierName}`);
      setAssignDeliveryModalOrder(null);
      setDeliveryInstructions('');
    } catch (err: any) {
      showToast(err.message || 'Failed to assign courier', 'error');
    } finally {
      setIsAssigningDelivery(false);
    }
  };

  // Generic Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Bakery Settings State
  const [settingsForm, setSettingsForm] = useState<BakerySettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);
  const [saveSettingsError, setSaveSettingsError] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // --- IMAGE UPLOAD HANDLER ---
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5 MB. Please select a smaller photo.', 'error');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setProductFormData((prev: any) => ({
          ...prev,
          images: [data.url, ...(prev.images || []).slice(1)]
        }));
        showToast('Image uploaded successfully!');
      } else {
        showToast(data.error || 'Failed to upload image', 'error');
      }
    } catch (err) {
      showToast('Error uploading image to server', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // --- SAVE PRODUCT HANDLER ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name || !productFormData.price) {
      showToast('Please provide a product name and price', 'error');
      return;
    }

    const slug = productFormData.slug || productFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const stockQty = Number(productFormData.stockQty || 0);

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: productFormData.name,
      slug,
      category: productFormData.category || 'Cakes',
      description: productFormData.description || '',
      price: Number(productFormData.price),
      previousPrice: productFormData.previousPrice ? Number(productFormData.previousPrice) : undefined,
      images: productFormData.images && productFormData.images.length > 0 
        ? productFormData.images 
        : ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'],
      inStock: stockQty > 0 ? (productFormData.inStock ?? true) : false,
      stockQty,
      featured: Boolean(productFormData.featured),
      bestseller: Boolean(productFormData.bestseller),
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 1,
      ingredients: typeof productFormData.ingredients === 'string' 
        ? (productFormData.ingredients as string).split(',').map((s: string) => s.trim())
        : (productFormData.ingredients || ['Flour', 'Butter', 'Sugar']),
      allergens: typeof productFormData.allergens === 'string'
        ? (productFormData.allergens as string).split(',').map((s: string) => s.trim())
        : (productFormData.allergens || ['Dairy', 'Gluten']),
      variants: productFormData.variants || [
        { size: 'Regular (2 Lbs)', weight: '2 Lbs', price: Number(productFormData.price) }
      ]
    };

    if (editingProduct) {
      await updateProduct(productPayload);
    } else {
      await addProduct(productPayload);
    }

    setProductModalOpen(false);
    setEditingProduct(null);
  };

  // --- SAVE CATEGORY HANDLER ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      showToast('Category name is required', 'error');
      return;
    }
    const slug = categoryFormData.slug || categoryFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: categoryFormData.name,
        slug,
        description: categoryFormData.description,
        image: categoryFormData.image
      });
    } else {
      await addCategory({
        name: categoryFormData.name,
        slug,
        description: categoryFormData.description,
        image: categoryFormData.image
      });
    }

    setCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // --- SAVE INVENTORY HANDLER ---
  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryFormData.name || inventoryFormData.currentStock === undefined) {
      showToast('Name and stock level are required', 'error');
      return;
    }

    const currentStock = Number(inventoryFormData.currentStock ?? 0);
    const minStock = Number(inventoryFormData.minStock ?? 10);
    let status: 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock' = 'In Stock';
    if (currentStock <= 0) {
      status = 'Out of Stock';
    } else if (currentStock <= minStock * 0.3 || currentStock <= 2) {
      status = 'Critical';
    } else if (currentStock <= minStock) {
      status = 'Low Stock';
    } else {
      status = 'In Stock';
    }

    if (editingInventory) {
      await updateInventoryItem(editingInventory.id, {
        name: inventoryFormData.name,
        category: inventoryFormData.category || 'Baking Essentials',
        unit: inventoryFormData.unit || 'kg',
        currentStock,
        minStock,
        purchaseCost: Number(inventoryFormData.purchaseCost || 0),
        supplier: inventoryFormData.supplier || 'Local Supplier',
        status,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    } else {
      await addInventoryItem({
        name: inventoryFormData.name,
        category: inventoryFormData.category || 'Baking Essentials',
        unit: inventoryFormData.unit || 'kg',
        currentStock,
        minStock,
        purchaseCost: Number(inventoryFormData.purchaseCost || 0),
        supplier: inventoryFormData.supplier || 'Local Supplier',
        status,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }

    setInventoryModalOpen(false);
    setEditingInventory(null);
  };

  // --- SAVE STOCK ADJUSTMENT HANDLER ---
  const handleAdminStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAdjustIngredient) return;
    const qty = Number(adminAdjustQty);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid positive quantity', 'error');
      return;
    }
    if ((adminAdjustType === 'Used' || adminAdjustType === 'Wasted') && qty > adminAdjustIngredient.currentStock) {
      showToast(`Cannot record ${qty} ${adminAdjustIngredient.unit}. Only ${adminAdjustIngredient.currentStock} ${adminAdjustIngredient.unit} available in stock.`, 'error');
      return;
    }
    if (!adminAdjustReason.trim()) {
      showToast('Please provide a specific reason for this stock adjustment', 'error');
      return;
    }

    try {
      setIsAdminAdjusting(true);
      await recordStockAdjustment({
        ingredientId: adminAdjustIngredient.id,
        type: adminAdjustType,
        quantity: qty,
        reason: adminAdjustReason.trim(),
        referenceNumber: adminAdjustRef.trim() || undefined
      });
      setAdminAdjustModalOpen(false);
      setAdminAdjustIngredient(null);
      setAdminAdjustQty('');
      setAdminAdjustReason('');
      setAdminAdjustRef('');
    } catch (err: any) {
      // handled
    } finally {
      setIsAdminAdjusting(false);
    }
  };

  // --- SAVE STAFF HANDLER ---
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormData.name || !staffFormData.email || !staffFormData.password) {
      showToast('Name, email, and temporary password are required', 'error');
      return;
    }

    try {
      await addStaffUser(staffFormData);
      setStaffModalOpen(false);
      setStaffFormData({
        name: '',
        email: '',
        phone: '+92 300 0000000',
        role: 'baker',
        password: '',
        status: 'active'
      });
    } catch (e) {}
  };

  // --- SAVE SETTINGS HANDLER ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSettingsError(null);
    setSaveSettingsSuccess(false);

    const isUnchanged = Object.keys(settingsForm).every(
      key => (settingsForm as any)[key] === (settings as any)[key]
    );
    if (isUnchanged) {
      showToast('No changes to save.', 'info');
      return;
    }

    setIsSavingSettings(true);
    try {
      const ok = await updateSettings(settingsForm);
      if (ok) {
        setSaveSettingsSuccess(true);
        setTimeout(() => setSaveSettingsSuccess(false), 3000);
      } else {
        setSaveSettingsError('Failed to save settings to server. Please try again.');
      }
    } catch (err: any) {
      setSaveSettingsError(err.message || 'Error saving settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --- CSV EXPORT HANDLER ---
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Items', 'Total (PKR)', 'Payment Method', 'Payment Status', 'Fulfillment', 'Status'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.createdAt,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.items.map(i => `${i.quantity}x ${i.name}`).join('; ')}"`,
      o.total,
      o.paymentMethod,
      o.paymentStatus,
      o.fulfillmentMethod,
      o.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `the_cake_house_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales report CSV downloaded successfully!');
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === 'all' || p.category.toLowerCase() === productCategoryFilter.toLowerCase();
    const matchesStock = productStockFilter === 'all' 
      ? true 
      : productStockFilter === 'in_stock' 
        ? p.inStock && p.stockQty > 0 
        : !p.inStock || p.stockQty <= 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Filtered orders with case-insensitive partial match on order number, customer name, email, phone, status, and items
  const filteredOrders = orders.filter(o => {
    const q = orderSearch.trim().toLowerCase();
    const cleanQ = q.replace(/^#/, '');
    const cleanOrderNum = o.orderNumber ? o.orderNumber.toLowerCase().replace(/^#/, '') : '';
    
    const matchesSearch = !q ||
      cleanOrderNum.includes(cleanQ) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
      ((o as any).customerEmail && (o as any).customerEmail.toLowerCase().includes(q)) ||
      (o.status && o.status.toLowerCase().includes(q)) ||
      (o.paymentMethod && o.paymentMethod.toLowerCase().includes(q)) ||
      (o.items && o.items.some(item => item.name.toLowerCase().includes(q)));
      
    const matchesStatus = orderStatusFilter === 'all' || o.status.toLowerCase() === orderStatusFilter.toLowerCase();
    const matchesPayment = orderPaymentFilter === 'all' || o.paymentStatus.toLowerCase() === orderPaymentFilter.toLowerCase();
    
    const isCustomCake = o.isCustomCake || o.id?.startsWith('ord-cc-') || Boolean(o.customCakeId) || (o.items && o.items.some(i => i.productId?.startsWith('cc-') || (i.name || '').toLowerCase().includes('custom')));
    const matchesType = orderTypeFilter === 'all' 
      ? true 
      : orderTypeFilter === 'custom' 
        ? isCustomCake 
        : !isCustomCake;

    return matchesSearch && matchesStatus && matchesPayment && matchesType;
  });

  // Filtered customers
  const customerList = users.filter(u => u.role === 'customer').filter(u => {
    return u.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
           u.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
           (u.phone && u.phone.includes(customerSearch));
  });

  // Staff members list
  const staffList = users.filter(u => u.role !== 'customer');

  // Filtered inventory
  const filteredInventory = inventory.filter(i => {
    return i.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
           i.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
           i.supplier.toLowerCase().includes(inventorySearch.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E0D9] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-[#762F3D]/10 text-[#762F3D] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Admin & Operations System
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#302725] mt-2">{settings.bakeryName || 'The Cake House'} Management Portal</h1>
          <p className="text-xs text-[#80736F] mt-1">
            Logged in as <strong className="text-[#762F3D]">{currentUser.name}</strong> ({currentUser.role.toUpperCase()}) • Lahore, Pakistan • Operations Dashboard
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingProduct(null);
              setProductFormData({
                name: '',
                category: categories[0]?.name || 'Cakes',
                price: 3500,
                previousPrice: 0,
                description: '',
                images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'],
                inStock: true,
                stockQty: 25,
                featured: false,
                bestseller: false,
                ingredients: ['Flour', 'Butter', 'Cocoa', 'Sugar', 'Eggs'],
                allergens: ['Dairy', 'Eggs', 'Gluten']
              });
              setProductModalOpen(true);
            }}
            className="bg-[#762F3D] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
          
          <button
            onClick={handleExportCSV}
            className="bg-[#FAF7F2] text-[#302725] border border-[#E8E0D9] px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#EFEAE3] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#762F3D]" />
            Export Sales CSV
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar & Dynamic View */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white p-3.5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-1 h-fit sticky top-24">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#80736F]">
            Navigation
          </div>

          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
            { id: 'products', label: 'Products', icon: Package, badge: products.length },
            { id: 'categories', label: 'Categories', icon: Layers, badge: categories.length },
            { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} new` : null, badgeColor: 'bg-amber-100 text-amber-800' },
            { id: 'kitchen', label: 'Baker Operations', icon: ChefHat, badge: activeKitchenTasksCount > 0 ? `${activeKitchenTasksCount} baking` : null, badgeColor: 'bg-amber-100 text-amber-800' },
            { id: 'dispatch', label: 'Dispatch & Delivery', icon: Truck, badge: (readyOrdersNeedingDelivery.length + activeDeliveriesCount) > 0 ? `${readyOrdersNeedingDelivery.length + activeDeliveriesCount} tasks` : null, badgeColor: 'bg-blue-100 text-blue-800' },
            { id: 'customers', label: 'Customers', icon: Users, badge: totalCustomersCount },
            { id: 'custom', label: 'Custom Cakes', icon: Sparkles, badge: customCakes.length },
            { id: 'inventory', label: 'Inventory', icon: Warehouse, badge: lowStockCount > 0 ? `${lowStockCount} low` : null, badgeColor: 'bg-red-100 text-red-700' },
            { id: 'staff', label: 'Staff & Roles', icon: ShieldCheck, badge: staffList.length },
            { id: 'reports', label: 'Reports', icon: TrendingUp, badge: null },
            { id: 'settings', label: 'Settings', icon: SettingsIcon, badge: null },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  isActive 
                    ? 'bg-[#762F3D] text-white shadow-sm' 
                    : 'text-[#302725] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#762F3D]'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : (tab.badgeColor || 'bg-[#FAF7F2] text-[#80736F]')
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Tabs Area */}
        <div className="lg:col-span-4 space-y-8 min-h-[650px]">
          
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW & REAL-TIME ANALYTICS */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Dynamic KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#80736F]">
                    <span>Total Sales Revenue</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">+18.5%</span>
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#762F3D]">
                    Rs. {totalRev.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#80736F] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#762F3D]" />
                    Today: <strong>Rs. {todayRev.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#80736F]">
                    <span>All Orders</span>
                    <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                      {pendingOrdersCount} In Progress
                    </span>
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#302725]">
                    {totalOrdersCount}
                  </div>
                  <div className="text-[11px] text-[#80736F]">
                    {completedOrdersCount} Delivered & Completed
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#80736F]">
                    <span>Registered Customers</span>
                    <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">Active</span>
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#302725]">
                    {totalCustomersCount}
                  </div>
                  <div className="text-[11px] text-[#80736F]">
                    Verified accounts in Lahore
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#80736F]">
                    <span>Low Stock Alert</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${lowStockCount > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {lowStockCount > 0 ? 'Action Needed' : 'Healthy'}
                    </span>
                  </div>
                  <div className={`font-serif text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-[#302725]'}`}>
                    {lowStockCount} Items
                  </div>
                  <div className="text-[11px] text-[#80736F]">
                    Across {inventory.length} total raw ingredients
                  </div>
                </div>
              </div>

              {/* Dynamic Revenue Trend Chart */}
              <div className="bg-white p-6 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Weekly Sales Performance (PKR)</h3>
                    <p className="text-xs text-[#80736F]">Calculated dynamically from placed customer orders</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#762F3D] bg-[#762F3D]/10 px-3 py-1 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Daily Aggregate
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE1" vertical={false} />
                      <XAxis dataKey="day" stroke="#80736F" fontSize={11} tickLine={false} />
                      <YAxis stroke="#80736F" fontSize={11} tickLine={false} tickFormatter={(v) => `Rs.${v/1000}k`} />
                      <Tooltip 
                        formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Daily Revenue']}
                        contentStyle={{ backgroundColor: '#FAF7F2', borderRadius: '16px', border: '1px solid #E8E0D9', fontSize: '12px' }}
                      />
                      <Bar dataKey="sales" fill="#762F3D" radius={[8, 8, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leaderboard & Recent Activity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Recent Orders */}
                <div className="bg-white rounded-3xl border border-[#E8E0D9] p-6 space-y-4 shadow-xs">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif font-bold text-base text-[#302725]">Recent Customer Orders</h3>
                    <button 
                      onClick={() => setActiveTab('orders')} 
                      className="text-xs text-[#762F3D] font-bold hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="divide-y divide-[#E8E0D9] text-xs">
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} className="py-3 flex justify-between items-center hover:bg-[#FAF7F2] px-2 rounded-xl transition">
                        <div>
                          <div className="font-bold text-[#762F3D]">{o.orderNumber} • {o.customerName}</div>
                          <div className="text-[11px] text-[#80736F] line-clamp-1">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
                          <div className="text-[10px] text-[#80736F]">{o.createdAt}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-bold text-[#302725]">Rs. {o.total.toLocaleString()}</div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Selling Products */}
                <div className="bg-white rounded-3xl border border-[#E8E0D9] p-6 space-y-4 shadow-xs">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif font-bold text-base text-[#302725]">Best-Selling Cakes & Treats</h3>
                    <button 
                      onClick={() => setActiveTab('products')} 
                      className="text-xs text-[#762F3D] font-bold hover:underline cursor-pointer"
                    >
                      Catalog
                    </button>
                  </div>

                  <div className="divide-y divide-[#E8E0D9] text-xs">
                    {(dashboardStats?.topSellingProducts || products.slice(0, 5)).map((item: any, idx: number) => (
                      <div key={idx} className="py-3 flex items-center justify-between hover:bg-[#FAF7F2] px-2 rounded-xl transition">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image || item.images?.[0]} 
                            alt={item.name} 
                            className="w-11 h-11 object-cover rounded-xl border border-[#E8E0D9]" 
                          />
                          <div>
                            <div className="font-bold text-[#302725]">{item.name}</div>
                            <div className="text-[11px] text-[#80736F]">
                              {item.quantity ? `${item.quantity} units sold` : `Rs. ${item.price?.toLocaleString()}`}
                            </div>
                          </div>
                        </div>
                        <div className="font-serif font-bold text-sm text-[#762F3D]">
                          #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRODUCT MANAGEMENT & CATALOG CRUD */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6 animate-fadeIn">
              
              {/* Product Header & Filters */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#302725]">Bakery Products Catalog</h2>
                  <p className="text-xs text-[#80736F]">Add, edit, manage stock, and customize luxury bakery items</p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductFormData({
                      name: '',
                      category: categories[0]?.name || 'Cakes',
                      price: 3500,
                      previousPrice: 0,
                      description: '',
                      images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'],
                      inStock: true,
                      stockQty: 25,
                      featured: false,
                      bestseller: false,
                      ingredients: ['Flour', 'Butter', 'Cocoa', 'Sugar', 'Eggs'],
                      allergens: ['Dairy', 'Eggs', 'Gluten']
                    });
                    setProductModalOpen(true);
                  }}
                  className="bg-[#762F3D] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Product
                </button>
              </div>

              {/* Search & Filtering Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#80736F]" />
                  <input
                    type="text"
                    placeholder="Search products by name or category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <Dropdown
                  value={productCategoryFilter}
                  onChange={(v) => setProductCategoryFilter(v)}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map(c => ({ value: c.name, label: c.name }))
                  ]}
                  size="md"
                  buttonClassName="bg-[#FAF7F2] border-[#E8E0D9] text-xs font-medium w-full"
                />

                <Dropdown
                  value={productStockFilter}
                  onChange={(v) => setProductStockFilter(v)}
                  options={[
                    { value: 'all', label: 'All Stock Statuses' },
                    { value: 'in_stock', label: 'In Stock' },
                    { value: 'out_of_stock', label: 'Out of Stock' }
                  ]}
                  size="md"
                  buttonClassName="bg-[#FAF7F2] border-[#E8E0D9] text-xs font-medium w-full"
                />
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#E8E0D9]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF7F2] text-[#80736F] font-semibold border-b border-[#E8E0D9]">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">Badges</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D9]">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-[#FAF7F2]/60 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img 
                              src={p.images[0]} 
                              alt={p.name} 
                              className="w-12 h-12 object-cover rounded-xl border border-[#E8E0D9] shrink-0" 
                            />
                            <div>
                              <div className="font-bold text-[#302725] text-sm">{p.name}</div>
                              <div className="text-[11px] text-[#80736F] line-clamp-1">{p.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium text-[#302725]">
                          <span className="bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E8E0D9]">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-[#762F3D] text-sm">Rs. {p.price.toLocaleString()}</div>
                          {p.previousPrice && (
                            <div className="text-[10px] text-[#80736F] line-through">Rs. {p.previousPrice.toLocaleString()}</div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              const newStock = !p.inStock;
                              updateProduct({ ...p, inStock: newStock, stockQty: newStock ? (p.stockQty > 0 ? p.stockQty : 15) : 0 });
                            }}
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] transition cursor-pointer ${
                              p.inStock && p.stockQty > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {p.inStock && p.stockQty > 0 ? `${p.stockQty} In Stock` : 'Out of Stock'}
                          </button>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {p.featured && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold">Featured</span>}
                            {p.bestseller && <span className="bg-[#762F3D]/10 text-[#762F3D] px-2 py-0.5 rounded text-[9px] font-bold">Bestseller</span>}
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductFormData({
                                  ...p,
                                  ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(', ') : p.ingredients,
                                  allergens: Array.isArray(p.allergens) ? p.allergens.join(', ') : (p.allergens || [])
                                });
                                setProductModalOpen(true);
                              }}
                              className="p-1.5 text-[#302725] hover:text-[#762F3D] hover:bg-white rounded-lg transition border border-transparent hover:border-[#E8E0D9] cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  open: true,
                                  title: 'Delete Product',
                                  message: `Are you sure you want to remove "${p.name}" from your catalog? This action will immediately update the live store.`,
                                  onConfirm: () => deleteProduct(p.id)
                                });
                              }}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CATEGORY MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#302725]">Category Management</h2>
                  <p className="text-xs text-[#80736F]">Organize product categories displayed across the website and catalog</p>
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryFormData({
                      name: '',
                      slug: '',
                      description: '',
                      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'
                    });
                    setCategoryModalOpen(true);
                  }}
                  className="bg-[#762F3D] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(c => {
                  const prodsInCat = products.filter(p => p.category.toLowerCase() === c.name.toLowerCase()).length;
                  return (
                    <div key={c.id} className="rounded-3xl border border-[#E8E0D9] overflow-hidden bg-[#FAF7F2] shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="h-32 w-full relative overflow-hidden bg-gray-100">
                          <img 
                            src={c.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'} 
                            alt={c.name} 
                            className="w-full h-full object-cover" 
                          />
                          <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {prodsInCat} products
                          </span>
                        </div>
                        <div className="p-4 space-y-1">
                          <div className="font-serif font-bold text-base text-[#302725]">{c.name}</div>
                          <div className="text-[11px] text-[#80736F] line-clamp-2">{c.description || 'Artisanal bakery collection.'}</div>
                          <div className="text-[10px] font-mono text-[#762F3D]">slug: /{c.slug}</div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 flex justify-end items-center gap-2 border-t border-[#E8E0D9] mt-3">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCategoryFormData(c);
                            setCategoryModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-white text-[#302725] border border-[#E8E0D9] rounded-xl text-xs font-semibold hover:border-[#762F3D] transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#762F3D]" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              open: true,
                              title: 'Delete Category',
                              message: `Delete category "${c.name}"? Products inside will remain but their category filter will change.`,
                              onConfirm: () => deleteCategory(c.id)
                            });
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: ORDER MANAGEMENT & INVOICING */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#302725]">Customer Orders</h2>
                  <p className="text-xs text-[#80736F]">Track progress, update fulfillment status, view receipts, and print invoices</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#762F3D] bg-[#762F3D]/10 px-3 py-1.5 rounded-xl">
                    {orders.length} Total Orders
                  </span>
                </div>
              </div>

              {/* Order Type Tabs: All, Catalog, Converted Custom Cakes */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E0D9] pb-3">
                <button
                  type="button"
                  onClick={() => setOrderTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    orderTypeFilter === 'all'
                      ? 'bg-[#762F3D] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#80736F] hover:text-[#302725] border border-[#E8E0D9]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Orders ({orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderTypeFilter('catalog')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    orderTypeFilter === 'catalog'
                      ? 'bg-[#762F3D] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#80736F] hover:text-[#302725] border border-[#E8E0D9]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Catalog Orders ({orders.filter(o => !o.isCustomCake && !o.id?.startsWith('ord-cc-') && !o.items?.some(i => i.productId?.startsWith('cc-') || (i.name || '').toLowerCase().includes('custom'))).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderTypeFilter('custom')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    orderTypeFilter === 'custom'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#80736F] hover:text-purple-800 border border-[#E8E0D9]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Converted Custom Cake Orders ({orders.filter(o => o.isCustomCake || o.id?.startsWith('ord-cc-') || o.items?.some(i => i.productId?.startsWith('cc-') || (i.name || '').toLowerCase().includes('custom'))).length})</span>
                </button>
              </div>

              {/* Order Search & Filtering */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#80736F]" />
                  <input
                    type="text"
                    placeholder="Search by Order # or Customer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <Dropdown
                  value={orderStatusFilter}
                  onChange={(v) => setOrderStatusFilter(v)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Confirmed', label: 'Confirmed' },
                    { value: 'Preparing', label: 'Preparing' },
                    { value: 'Ready', label: 'Ready' },
                    { value: 'Out for Delivery', label: 'Out for Delivery' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Cancelled', label: 'Cancelled' }
                  ]}
                  size="md"
                  buttonClassName="bg-[#FAF7F2] border-[#E8E0D9] text-xs font-medium w-full"
                />

                <Dropdown
                  value={orderPaymentFilter}
                  onChange={(v) => setOrderPaymentFilter(v)}
                  options={[
                    { value: 'all', label: 'All Payment Statuses' },
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Pending', label: 'Pending Payment' },
                    { value: 'Partial', label: 'Partial Advance' },
                    { value: 'Refunded', label: 'Refunded' }
                  ]}
                  size="md"
                  buttonClassName="bg-[#FAF7F2] border-[#E8E0D9] text-xs font-medium w-full"
                />
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#E8E0D9]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF7F2] text-[#80736F] font-semibold border-b border-[#E8E0D9]">
                    <tr>
                      <th className="p-3.5">Order #</th>
                      <th className="p-3.5">Customer & Phone</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Total & Payment</th>
                      <th className="p-3.5">Fulfillment</th>
                      <th className="p-3.5">Baker Assignment</th>
                      <th className="p-3.5">Delivery Courier</th>
                      <th className="p-3.5">Status Update</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D9]">
                    {filteredOrders.map(order => {
                      const bakerTask = productionTasks.find(pt => pt.orderId === order.id || pt.orderNumber === order.orderNumber);
                      const courierDelivery = deliveries.find(d => (d.orderId === order.id || d.orderNumber === order.orderNumber) && (d.status as string) !== 'Cancelled' && d.status !== 'Returned');
                      const isCustomCakeOrder = order.isCustomCake || order.id?.startsWith('ord-cc-') || Boolean(order.customCakeId) || (order.items && order.items.some(i => i.productId?.startsWith('cc-') || (i.name || '').toLowerCase().includes('custom')));
                      const reqPrep = isOrderRequiringPreparation(order, products);

                      return (
                        <tr key={order.id} className="hover:bg-[#FAF7F2]/60 transition">
                          <td className="p-3.5 font-bold text-[#762F3D]">
                            {order.orderNumber}
                            <div className="text-[10px] text-[#80736F] font-normal">{order.createdAt}</div>
                            {isCustomCakeOrder ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200 mt-1">
                                <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                Custom Cake Order
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-600 border border-gray-200 mt-1">
                                <ShoppingBag className="w-2.5 h-2.5 text-gray-500" />
                                Catalog Order
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-[#302725]">{order.customerName}</div>
                            {order.customerPhone ? (
                              <button
                                type="button"
                                onClick={(e) => handleOpenCustomerContact(order, e)}
                                className="text-[11px] font-semibold text-[#762F3D] hover:underline flex items-center gap-1 mt-0.5 bg-[#FAF7F2] hover:bg-[#F3E6DF] px-2 py-0.5 rounded-md border border-[#E8E0D9]/80 transition cursor-pointer"
                                title="Click to call or copy customer phone"
                              >
                                <Phone className="w-2.5 h-2.5 text-[#762F3D]" />
                                <span>{order.customerPhone}</span>
                              </button>
                            ) : (
                              <div className="text-[11px] text-[#80736F]">—</div>
                            )}
                          </td>
                          <td className="p-3.5 max-w-xs text-[#80736F]">
                            <div className="line-clamp-2">
                              {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-[#302725]">Rs. {order.total.toLocaleString()}</div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              order.paymentStatus === 'Refunded' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.paymentStatus} ({order.paymentMethod})
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E8E0D9] font-medium">
                              {order.fulfillmentMethod}
                            </span>
                          </td>

                          {/* Baker Assignment Column */}
                          <td className="p-3.5">
                            {!reqPrep ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200" title="Ready-made item: baking not required">
                                <span>Not Required (Ready-made)</span>
                              </span>
                            ) : bakerTask ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1 font-bold text-[#762F3D]">
                                    <ChefHat className="w-3.5 h-3.5 text-[#762F3D]" />
                                    <span>{bakerTask.assignedBaker || 'Chef Tariq'}</span>
                                  </div>
                                  {bakerTask.stage !== 'Completed' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReassignModalTask(bakerTask);
                                        setReassignBakerId(bakerTask.assignedBakerId || availableBakers[0]?.id || 'u-4');
                                        setReassignBakerName(bakerTask.assignedBaker || availableBakers[0]?.name.trim() || 'Chef Tariq');
                                        setReassignDeadline(bakerTask.deadline || '');
                                        setReassignNotes(bakerTask.notes || '');
                                      }}
                                      className="text-[10px] text-[#762F3D] hover:underline font-bold cursor-pointer"
                                      title="Reassign to another Baker"
                                    >
                                      Reassign
                                    </button>
                                  )}
                                </div>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  bakerTask.stage === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : bakerTask.stage === 'Decorating' || bakerTask.stage === 'Baking'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {bakerTask.stage}
                                </span>
                              </div>
                            ) : order.status === 'Cancelled' ? (
                              <span className="text-[11px] text-[#80736F]">Cancelled</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setAssignBakerModalOrder(order);
                                  setSelectedBakerId(availableBakers[0]?.id || 'u-4');
                                  setSelectedBakerName(availableBakers[0]?.name.trim() || 'Chef Tariq');
                                  setBakerNotes(`Prep for ${order.customerName} - ${order.orderNumber}`);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-[#762F3D]/10 hover:bg-[#762F3D] text-[#762F3D] hover:text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <ChefHat className="w-3 h-3" />
                                <span>Assign Baker</span>
                              </button>
                            )}
                          </td>

                          {/* Delivery Courier Assignment Column */}
                          <td className="p-3.5">
                            {order.fulfillmentMethod === 'Pickup' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200">
                                Store Pickup (No Delivery)
                              </span>
                            ) : courierDelivery ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 font-bold text-[#302725]">
                                  <Truck className="w-3.5 h-3.5 text-[#762F3D]" />
                                  <span>{courierDelivery.assignedStaff || 'Bilal Raza'}</span>
                                </div>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  courierDelivery.status === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : courierDelivery.status === 'Failed Delivery'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {courierDelivery.status}
                                </span>
                              </div>
                            ) : reqPrep && (order.status !== 'Ready' && order.status !== 'Completed' && bakerTask?.stage !== 'Completed') ? (
                              <div 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium"
                                title="Delivery courier can only be assigned after kitchen finishes baking and marks Ready."
                              >
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Awaiting Kitchen Prep</span>
                              </div>
                            ) : !reqPrep && order.status === 'Pending' ? (
                              <div 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-200 text-[#80736F] text-[10px] font-medium"
                                title="Confirm order first before dispatching delivery courier"
                              >
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span>Awaiting Confirmation</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setAssignDeliveryModalOrder(order);
                                  setSelectedCourierId(availableCouriers[0]?.id || 'u-6');
                                  setSelectedCourierName(availableCouriers[0]?.name.trim() || 'Bilal Raza');
                                  setDeliveryInstructions(`Delivery to ${order.deliveryAddress || 'Customer Address'}`);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Assign Courier</span>
                              </button>
                            )}
                          </td>

                          <td className="p-3.5">
                            <Dropdown
                              value={order.status}
                              onChange={(newStatus) => updateOrderStatus(order.id, newStatus as any)}
                              options={[
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Confirmed', label: 'Confirmed' },
                                { value: 'Preparing', label: 'Preparing' },
                                { value: 'Ready', label: 'Ready' },
                                { value: 'Out for Delivery', label: 'Out for Delivery' },
                                { value: 'Completed', label: 'Completed' },
                                { value: 'Cancelled', label: 'Cancelled' },
                              ]}
                              size="sm"
                              buttonClassName="bg-white border-[#E8E0D9] text-[11px] font-semibold w-36"
                            />
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-1.5 text-[#302725] hover:text-[#762F3D] hover:bg-white rounded-lg transition border border-transparent hover:border-[#E8E0D9] cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setInvoiceOrder(order)}
                                className="p-1.5 text-[#762F3D] hover:bg-[#762F3D]/10 rounded-lg transition cursor-pointer"
                                title="Print Invoice"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    open: true,
                                    title: 'Cancel / Delete Order',
                                    message: `Are you sure you want to remove Order ${order.orderNumber}?`,
                                    onConfirm: () => deleteOrder(order.id)
                                  });
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 px-4">
                          <div className="flex flex-col items-center justify-center text-center">
                            <ShoppingBag className="w-10 h-10 text-[#80736F]/40 mb-3" />
                            <h3 className="text-sm font-bold text-[#302725]">No Orders Found</h3>
                            <p className="text-xs text-[#80736F] max-w-sm mt-1">
                              No orders match your search query &ldquo;{orderSearch}&rdquo; or filter settings.
                            </p>
                            <button
                              onClick={() => {
                                setOrderSearch('');
                                setOrderStatusFilter('all');
                                setOrderPaymentFilter('all');
                              }}
                              className="mt-4 px-4 py-2 bg-[#762F3D] text-white rounded-xl text-xs font-semibold hover:bg-[#5F2030] transition cursor-pointer"
                            >
                              Reset Filters & Search
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: BAKER OPERATIONS - PRODUCTION MONITORING & KANBAN */}
          {/* ========================================================= */}
          {activeTab === 'kitchen' && (() => {
            const activeBakers = (users || []).filter(u => u.role === 'baker' && (u.status === 'active' || !u.status));

            // Deduplicate and collect all unique eligible kitchen production orders across active bakers
            const seenOrderKeys = new Set<string>();
            const eligibleTasks: (ProductionTask & { resolvedBakerId: string; resolvedBakerName: string })[] = [];

            for (const t of productionTasks || []) {
              const linkedOrder = orders.find(o => 
                (t.orderId && o.id === t.orderId) || 
                (t.orderNumber && o.orderNumber === t.orderNumber)
              );

              // 1. Exclude cancelled orders
              if (linkedOrder && linkedOrder.status === 'Cancelled') continue;
              const tStatus = String((t as any).status || t.kanbanStatus || '').toLowerCase();
              const tStage = String(t.stage || '').toLowerCase();
              if (tStatus === 'cancelled' || tStage === 'cancelled') continue;

              // 2. Exclude ready-made products that do not require preparation
              if (linkedOrder) {
                if (!isOrderRequiringPreparation(linkedOrder, products)) continue;
              } else {
                const prodName = (t.productName || '').toLowerCase();
                if (['cookie', 'cookies', 'brownie', 'brownies'].some(kw => prodName.includes(kw)) && 
                    !prodName.includes('cake') && !prodName.includes('custom')) {
                  continue;
                }
              }

              // 3. Resolve assigned baker ID against activeBakers
              let resolvedBakerId: string | null = null;
              let resolvedBakerName: string | null = null;

              for (const b of activeBakers) {
                const bTrimmed = b.name.trim().toLowerCase();
                const tBaker = (t.assignedBaker || '').trim().toLowerCase();

                // Check ID match or legacy u-baker match
                if (t.assignedBakerId && (t.assignedBakerId === b.id || (b.email === 'baker@thecakehouse.pk' && t.assignedBakerId === 'u-baker'))) {
                  resolvedBakerId = b.id;
                  resolvedBakerName = b.name.trim();
                  break;
                }

                // Check Name match (case-insensitive and trimmed)
                if (tBaker && (tBaker === bTrimmed || tBaker.includes(bTrimmed) || bTrimmed.includes(tBaker))) {
                  resolvedBakerId = b.id;
                  resolvedBakerName = b.name.trim();
                  break;
                }
              }

              // Exclude unassigned orders or orders assigned to deactivated/unknown employees
              if (!resolvedBakerId || !resolvedBakerName) continue;

              // 4. Deduplicate: Do not count the same order more than once
              const orderKey = t.orderNumber || t.orderId || t.id;
              if (seenOrderKeys.has(orderKey)) continue;
              seenOrderKeys.add(orderKey);

              eligibleTasks.push({
                ...t,
                resolvedBakerId,
                resolvedBakerName,
                assignedBaker: resolvedBakerName,
                assignedBakerId: resolvedBakerId
              });
            }

            // Also check if any assigned order in orders requiring preparation is missing a task record
            for (const o of orders || []) {
              if (o.status === 'Cancelled') continue;
              if (!o.assignedBaker && !o.assignedBakerId) continue;
              if (!isOrderRequiringPreparation(o, products)) continue;

              const orderKey = o.orderNumber || o.id;
              if (seenOrderKeys.has(orderKey)) continue;

              let resolvedBakerId: string | null = null;
              let resolvedBakerName: string | null = null;

              for (const b of activeBakers) {
                const bTrimmed = b.name.trim().toLowerCase();
                const oBaker = (o.assignedBaker || '').trim().toLowerCase();

                if (o.assignedBakerId && (o.assignedBakerId === b.id || (b.email === 'baker@thecakehouse.pk' && o.assignedBakerId === 'u-baker'))) {
                  resolvedBakerId = b.id;
                  resolvedBakerName = b.name.trim();
                  break;
                }
                if (oBaker && (oBaker === bTrimmed || oBaker.includes(bTrimmed) || bTrimmed.includes(oBaker))) {
                  resolvedBakerId = b.id;
                  resolvedBakerName = b.name.trim();
                  break;
                }
              }

              if (!resolvedBakerId || !resolvedBakerName) continue;
              seenOrderKeys.add(orderKey);

              eligibleTasks.push({
                id: `task-ord-${o.id}`,
                orderId: o.id,
                orderNumber: o.orderNumber,
                productName: o.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Custom Cake Item',
                quantity: o.items?.reduce((acc, i) => acc + i.quantity, 0) || 1,
                specifications: o.notes || 'Standard Preparation',
                customerName: o.customerName,
                orderDate: o.createdAt,
                deadline: o.deadline || 'Immediate',
                priority: 'Normal',
                stage: o.status === 'Ready' ? 'Completed' : (o.status === 'Preparing' ? 'In Preparation' : 'Queued'),
                kanbanStatus: o.status === 'Ready' ? 'Ready' : (o.status === 'Preparing' ? 'In Progress' : 'Assigned'),
                currentActivity: o.status === 'Ready' ? 'Ready' : (o.status === 'Preparing' ? 'Preparing' : 'None'),
                resolvedBakerId,
                resolvedBakerName,
                assignedBaker: resolvedBakerName,
                assignedBakerId: resolvedBakerId
              });
            }

            // Order count function per baker
            const getBakerOrderCount = (baker: User) => {
              return eligibleTasks.filter(t => t.resolvedBakerId === baker.id).length;
            };

            const allBakersTotalCount = eligibleTasks.length;

            // Selected Baker Object (ensures fallback to 'all' if selected baker was deactivated)
            const selectedBakerObj = selectedBakerFilter === 'all' 
              ? null 
              : activeBakers.find(b => b.id === selectedBakerFilter);

            // Filter production tasks strictly using employee ID
            const filteredTasks = selectedBakerFilter === 'all' || !selectedBakerObj
              ? eligibleTasks
              : eligibleTasks.filter(t => t.resolvedBakerId === selectedBakerFilter);

            const assignedTasks = filteredTasks.filter(t => getProductionKanbanStatus(t) === 'Assigned');
            const inProgressTasks = filteredTasks.filter(t => getProductionKanbanStatus(t) === 'In Progress');
            const readyTasks = filteredTasks.filter(t => getProductionKanbanStatus(t) === 'Ready');

            // Format deadline date / time helper
            const formatDueText = (deadline?: string) => {
              if (!deadline) return 'Today, 6:00 PM';
              try {
                const date = new Date(deadline);
                if (isNaN(date.getTime())) return deadline;
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isTomorrow = date.toDateString() === tomorrow.toDateString();
                const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                if (isToday) return `Today, ${timeStr}`;
                if (isTomorrow) return `Tomorrow, ${timeStr}`;
                return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
              } catch {
                return deadline;
              }
            };

            // Format completion timestamp helper
            const formatCompletedText = (timestamp?: string) => {
              if (!timestamp) return '12:30 PM';
              try {
                const date = new Date(timestamp);
                if (isNaN(date.getTime())) return timestamp;
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                if (isToday) return timeStr;
                return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
              } catch {
                return timestamp;
              }
            };

            // Check timing status for Assigned orders
            const getTimingStatus = (deadline?: string) => {
              if (!deadline) return { status: 'on_time', label: 'On Time' };
              const dueTime = new Date(deadline).getTime();
              if (isNaN(dueTime)) return { status: 'on_time', label: 'On Time' };
              const diffHours = (dueTime - Date.now()) / (1000 * 60 * 60);
              if (diffHours < 0) return { status: 'overdue', label: 'Overdue' };
              if (diffHours <= 3) return { status: 'due_soon', label: 'Due Soon' };
              return { status: 'on_time', label: 'On Time' };
            };

            const renderOrderCard = (task: ProductionTask, column: 'Assigned' | 'In Progress' | 'Ready') => {
              const linkedOrder = orders.find(o => o.id === task.orderId || o.orderNumber === task.orderNumber);
              const custName = task.customerName || linkedOrder?.customerName || 'Valued Customer';
              const activity = getProductionActivity(task);

              // Compact product thumbnail with fallback
              const productImg = task.referenceImage || 
                products.find(p => p.name === task.productName || linkedOrder?.items?.some(it => it.name === p.name))?.images?.[0] || 
                linkedOrder?.items?.[0]?.image || 
                'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80';

              // Baker Avatar & Initials (Clearly displayed on ALL cards including Ready!)
              const bakerName = task.assignedBaker || 'Assigned Baker';
              const bakerInitials = bakerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              // Timing labels
              const timing = getTimingStatus(task.deadline);
              const dueTimeStr = formatDueText(task.deadline);
              const completedTimeStr = formatCompletedText(task.completedAt || task.lastUpdatedAt);

              return (
                <div 
                  key={task.id}
                  className="bg-white rounded-2xl border border-[#E8E0D9]/70 shadow-xs hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col justify-between gap-2.5"
                >
                  {/* Top Section: Product Thumbnail + Details */}
                  <div className="flex items-start gap-3">
                    <img 
                      src={productImg} 
                      alt={task.productName} 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-[#E8E0D9]/60 shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80';
                      }}
                    />

                    <div className="flex-1 min-w-0 space-y-0.5">
                      {/* Top row: Order Number & Timing/Activity Badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-[#302725] tracking-tight">
                          {task.orderNumber || 'Custom Order'}
                        </span>

                        {/* Badge matching Reference Image */}
                        {column === 'Ready' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F6EE] text-[#1B7A43] shrink-0">
                            Ready
                          </span>
                        ) : column === 'In Progress' ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            activity === 'Baking' ? 'bg-sky-100 text-sky-800' :
                            activity === 'Decorating' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {activity === 'None' ? 'Preparing' : activity}
                          </span>
                        ) : (
                          // Assigned column timing indicator
                          timing.status === 'overdue' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 shrink-0">
                              Overdue
                            </span>
                          ) : timing.status === 'due_soon' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                              Due Soon
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                              On Time
                            </span>
                          )
                        )}
                      </div>

                      {/* Customer Name */}
                      <div className="text-xs sm:text-sm font-semibold text-[#302725] truncate">
                        {custName}
                      </div>

                      {/* Product Name & Quantity (handled without breaking alignment) */}
                      <div 
                        className="text-[11px] sm:text-xs text-[#80736F] font-medium truncate" 
                        title={`${task.productName} (${task.quantity || 1} ${task.quantity > 1 ? 'pcs' : 'pc'})`}
                      >
                        {task.productName} ({task.quantity || 1} {task.quantity > 1 ? 'pcs' : 'pc'})
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section: Responsible Baker & Due/Completed Date */}
                  <div className="border-t border-[#F2ECE6] pt-2.5 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
                    {/* Baker avatar & name - Crucially visible on EVERY card including Ready orders */}
                    <div className="flex items-center gap-1.5 min-w-0" title={`Baker: ${bakerName}`}>
                      <div className="w-5 h-5 rounded-full bg-[#762F3D]/10 text-[#762F3D] border border-[#762F3D]/20 flex items-center justify-center font-bold text-[9px] shrink-0">
                        {bakerInitials}
                      </div>
                      <span className="text-[#302725] font-semibold truncate max-w-[110px] sm:max-w-[130px]">
                        Baker: {bakerName}
                      </span>
                    </div>

                    {/* Timing Information */}
                    <div className="flex items-center gap-1 text-[#80736F] shrink-0">
                      {column === 'Ready' ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-medium text-[#302725]">Completed: {completedTimeStr}</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-[#80736F]" />
                          <span className={`font-medium ${timing.status === 'overdue' ? 'text-red-600 font-bold' : 'text-[#302725]'}`}>
                            Due: {dueTimeStr}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6 animate-fadeIn w-full max-w-full overflow-x-hidden">
                {/* Header & Baker Filter Dropdown */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FDF0EC] border border-[#FADCD5] flex items-center justify-center shrink-0 shadow-2xs">
                      <ChefHat className="w-6 h-6 text-[#762F3D]" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#302725] tracking-tight">
                        Baker Operations
                      </h2>
                      <p className="text-xs sm:text-sm text-[#80736F] mt-0.5">
                        Monitor production progress and track kitchen workflow
                      </p>
                    </div>
                  </div>

                  {/* Custom Baker Dropdown Filter (Following Reference Image) */}
                  <div className="relative shrink-0 self-end sm:self-auto" ref={bakerDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setBakerDropdownOpen(prev => !prev)}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-[#E8E0D9] shadow-xs text-xs font-bold text-[#302725] hover:border-[#762F3D]/50 hover:bg-[#FAF7F2]/50 transition cursor-pointer"
                      aria-expanded={bakerDropdownOpen}
                      aria-haspopup="listbox"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#762F3D]/10 text-[#762F3D] flex items-center justify-center shrink-0 overflow-hidden">
                        {selectedBakerObj?.avatar ? (
                          <img src={selectedBakerObj.avatar} alt={selectedBakerObj.name} className="w-full h-full object-cover" />
                        ) : selectedBakerObj ? (
                          <span className="text-[10px] font-bold text-[#762F3D]">
                            {selectedBakerObj.name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        ) : (
                          <Users className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span className="font-semibold text-xs text-[#302725]">
                        {selectedBakerObj 
                          ? `${selectedBakerObj.name.trim()} (${getBakerOrderCount(selectedBakerObj)} orders)` 
                          : `All Bakers (${allBakersTotalCount} orders)`}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#80736F] transition-transform duration-200 ${bakerDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu - Burgundy luxury styled matching reference image */}
                    {bakerDropdownOpen && (
                      <div 
                        className="absolute right-0 top-full mt-2 z-50 min-w-[260px] sm:min-w-[280px] bg-[#541624] text-white rounded-2xl shadow-2xl p-2 border border-[#762F3D]/40 animate-fadeIn"
                        role="listbox"
                      >
                        {/* All Bakers Option */}
                        <button
                          type="button"
                          onClick={() => handleSelectBakerFilter('all')}
                          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                            selectedBakerFilter === 'all'
                              ? 'bg-white/20 text-white font-bold'
                              : 'text-white/90 hover:bg-white/10 font-medium'
                          }`}
                          role="option"
                          aria-selected={selectedBakerFilter === 'all'}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs shrink-0 font-bold">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">All Bakers</span>
                          </div>
                          <span className="text-[11px] text-white/70 font-semibold shrink-0">
                            ({allBakersTotalCount} orders)
                          </span>
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        {/* Individual Active Bakers from DB */}
                        <div className="space-y-0.5 max-h-60 overflow-y-auto">
                          {activeBakers.map(baker => {
                            const count = getBakerOrderCount(baker);
                            const isSelected = selectedBakerFilter === baker.id;
                            const initials = baker.name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                            return (
                              <button
                                key={baker.id}
                                type="button"
                                onClick={() => handleSelectBakerFilter(baker.id)}
                                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-white/20 text-white font-bold'
                                    : 'text-white/90 hover:bg-white/10 font-medium'
                                }`}
                                role="option"
                                aria-selected={isSelected}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-[#762F3D] border border-white/20 text-white flex items-center justify-center text-[10px] shrink-0 font-bold overflow-hidden">
                                    {baker.avatar ? (
                                      <img src={baker.avatar} alt={baker.name} className="w-full h-full object-cover" />
                                    ) : (
                                      initials
                                    )}
                                  </div>
                                  <span className="truncate">{baker.name.trim()}</span>
                                </div>
                                <span className="text-[11px] text-white/70 font-semibold shrink-0">
                                  ({count} {count === 1 ? 'order' : 'orders'})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3-Column Production Monitoring Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6">
                  {/* Column 1: Assigned */}
                  <div className="bg-[#FDF6F4] border border-[#F5E5E2] rounded-3xl p-4 sm:p-5 flex flex-col min-h-[460px] shadow-2xs">
                    {/* Column Header */}
                    <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#F0DCD8]">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-[#A13446]" />
                        <span className="font-serif font-bold text-sm text-[#302725]">Assigned</span>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#FCEAE9] text-[#A13446]">
                        {assignedTasks.length}
                      </span>
                    </div>

                    {/* Scrollable Tasks List */}
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
                      {assignedTasks.map(t => renderOrderCard(t, 'Assigned'))}
                      {assignedTasks.length === 0 && (
                        <div className="py-14 text-center text-[#80736F]/60 text-xs italic">
                          No orders currently assigned
                        </div>
                      )}
                    </div>

                    {/* Column Footer matching reference image */}
                    {assignedTasks.length > 0 && (
                      <div className="pt-3 border-t border-[#F0DCD8]/60 text-center">
                        <span className="text-xs font-semibold text-[#A13446] hover:underline cursor-default">
                          View All Assigned &rarr;
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Column 2: In Progress */}
                  <div className="bg-[#FDF9F3] border border-[#F7EEDF] rounded-3xl p-4 sm:p-5 flex flex-col min-h-[460px] shadow-2xs">
                    {/* Column Header */}
                    <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#F0E5D3]">
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-[#A2581A]" />
                        <span className="font-serif font-bold text-sm text-[#302725]">In Progress</span>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#FDEEDC] text-[#A2581A]">
                        {inProgressTasks.length}
                      </span>
                    </div>

                    {/* Scrollable Tasks List */}
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
                      {inProgressTasks.map(t => renderOrderCard(t, 'In Progress'))}
                      {inProgressTasks.length === 0 && (
                        <div className="py-14 text-center text-[#80736F]/60 text-xs italic">
                          No orders in progress
                        </div>
                      )}
                    </div>

                    {/* Column Footer matching reference image */}
                    {inProgressTasks.length > 0 && (
                      <div className="pt-3 border-t border-[#F0E5D3]/60 text-center">
                        <span className="text-xs font-semibold text-[#A2581A] hover:underline cursor-default">
                          View All In Progress &rarr;
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Ready */}
                  <div className="bg-[#F4FAF6] border border-[#E2F2E9] rounded-3xl p-4 sm:p-5 flex flex-col min-h-[460px] shadow-2xs">
                    {/* Column Header */}
                    <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#D7EFE0]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1B7A43]" />
                        <span className="font-serif font-bold text-sm text-[#302725]">Ready</span>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#E8F6EE] text-[#1B7A43]">
                        {readyTasks.length}
                      </span>
                    </div>

                    {/* Scrollable Tasks List */}
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-1">
                      {readyTasks.map(t => renderOrderCard(t, 'Ready'))}
                      {readyTasks.length === 0 && (
                        <div className="py-14 text-center text-[#80736F]/60 text-xs italic">
                          No orders ready yet
                        </div>
                      )}
                    </div>

                    {/* Column Footer matching reference image */}
                    {readyTasks.length > 0 && (
                      <div className="pt-3 border-t border-[#D7EFE0]/60 text-center">
                        <span className="text-xs font-semibold text-[#1B7A43] hover:underline cursor-default">
                          View All Ready &rarr;
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB: DISPATCH & DELIVERY OVERSIGHT */}
          {/* ========================================================= */}
          {activeTab === 'dispatch' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E0D9] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#302725] flex items-center gap-2">
                    <Truck className="w-6 h-6 text-[#762F3D]" />
                    <span>Courier Dispatch & Delivery Oversight</span>
                  </h2>
                  <p className="text-xs text-[#80736F]">
                    Assign available delivery couriers, track live dispatches across Lahore, and monitor COD collections
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-[#FAF7F2] border border-[#E8E0D9] text-[#762F3D] px-3.5 py-1.5 rounded-xl text-xs font-bold">
                    {deliveries.length} Total Deliveries
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-xl text-xs font-bold">
                    {activeDeliveriesCount} Active on Road
                  </span>
                </div>
              </div>

              {/* Ready Orders Awaiting Courier Assignment */}
              {readyOrdersNeedingDelivery.length > 0 && (
                <div className="bg-amber-50/60 rounded-3xl border border-amber-200 p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-sm font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span>Ready Orders Awaiting Courier Assignment ({readyOrdersNeedingDelivery.length})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {readyOrdersNeedingDelivery.map(ro => (
                      <div key={ro.id} className="p-3.5 rounded-2xl bg-white border border-amber-200 flex justify-between items-center shadow-xs">
                        <div>
                          <div className="font-bold text-xs text-[#302725]">{ro.orderNumber} • {ro.customerName}</div>
                          <div className="text-[11px] text-[#80736F] truncate max-w-[200px]">{ro.deliveryAddress || 'Lahore'}</div>
                          <div className="text-[10px] font-bold text-[#762F3D]">Rs. {ro.total.toLocaleString()} ({ro.paymentStatus})</div>
                        </div>

                        <button
                          onClick={() => {
                            setAssignDeliveryModalOrder(ro);
                            setSelectedCourierName(availableCouriers[0]?.name || 'Bilal Raza');
                            setDeliveryInstructions(`Address: ${ro.deliveryAddress || 'Lahore'}`);
                          }}
                          className="px-3 py-1.5 bg-[#762F3D] hover:bg-[#5F2030] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliveries Table */}
              <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E8E0D9] bg-[#FAF7F2]/50 flex justify-between items-center">
                  <h3 className="font-serif text-sm font-bold text-[#302725]">All Deliveries Pipeline</h3>
                  <span className="text-xs text-[#80736F]">Showing all active and historical routes</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] text-[#80736F] uppercase text-[10px] tracking-wider border-b border-[#E8E0D9]">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Order # / Delivery ID</th>
                        <th className="py-3.5 px-4 font-bold">Recipient & Contact</th>
                        <th className="py-3.5 px-4 font-bold">Destination Address</th>
                        <th className="py-3.5 px-4 font-bold">Assigned Courier</th>
                        <th className="py-3.5 px-4 font-bold text-center">Status</th>
                        <th className="py-3.5 px-4 font-bold text-right">COD Due</th>
                        <th className="py-3.5 px-4 font-bold text-center">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D9]">
                      {deliveries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#80736F] text-xs">
                            No delivery dispatches recorded yet.
                          </td>
                        </tr>
                      ) : (
                        deliveries.map(del => (
                          <tr key={del.id} className="hover:bg-[#FAF7F2]/60 transition">
                            <td className="py-3.5 px-4 font-bold text-[#762F3D]">
                              {del.orderNumber}
                              <div className="text-[10px] text-[#80736F] font-normal">{del.id}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#302725]">{del.customerName}</div>
                              <div className="text-[10px] text-[#80736F]">{del.customerPhone}</div>
                            </td>
                            <td className="py-3.5 px-4 text-[#80736F] max-w-xs truncate">{del.address}</td>
                            <td className="py-3.5 px-4 font-semibold text-[#302725]">
                              <div className="flex items-center gap-1">
                                <Bike className="w-3.5 h-3.5 text-[#762F3D]" />
                                <span>{del.assignedStaff || 'Bilal Raza'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                del.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : del.status === 'Out for Delivery' || del.status === 'In Transit'
                                  ? 'bg-blue-100 text-blue-800'
                                  : del.status === 'Failed Delivery'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {del.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#762F3D]">
                              Rs. {(del.codAmountDue || 0).toLocaleString()}
                              <div className="text-[9px] text-[#80736F] font-normal">{del.paymentStatus}</div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <select
                                value={del.status}
                                onChange={async (e) => {
                                  await updateDeliveryStatus(del.id, e.target.value as any);
                                  showToast(`Delivery ${del.orderNumber} status updated to ${e.target.value}`);
                                }}
                                className="bg-white border border-[#E8E0D9] text-[11px] font-bold rounded-xl px-2 py-1 text-[#302725] cursor-pointer"
                              >
                                <option value="Assigned">Assigned</option>
                                <option value="Picked Up">Picked Up</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Failed Delivery">Failed Delivery</option>
                              </select>
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

          {/* ========================================================= */}
          {/* TAB 5: CUSTOMER DIRECTORY */}
          {/* ========================================================= */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#302725]">Customer Directory</h2>
                  <p className="text-xs text-[#80736F]">View registered bakery customers, accounts, and lifetime purchase history</p>
                </div>

                <div className="text-xs font-bold text-[#762F3D] bg-[#762F3D]/10 px-3.5 py-1.5 rounded-xl">
                  {customerList.length} Registered Accounts
                </div>
              </div>

              {/* Customer Search */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#80736F]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone number..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              {/* Customers Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#E8E0D9]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF7F2] text-[#80736F] font-semibold border-b border-[#E8E0D9]">
                    <tr>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Email & Phone</th>
                      <th className="p-3.5">Primary Address</th>
                      <th className="p-3.5">Orders Placed</th>
                      <th className="p-3.5">Account Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D9]">
                    {customerList.map(cust => {
                      const customerOrders = orders.filter(o => o.customerId === cust.id || o.customerName === cust.name);
                      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                      return (
                        <tr key={cust.id} className="hover:bg-[#FAF7F2]/60 transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#762F3D]/10 text-[#762F3D] font-bold flex items-center justify-center text-xs shrink-0">
                                {cust.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="font-bold text-[#302725]">{cust.name}</div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="text-[#302725]">{cust.email}</div>
                            {cust.phone ? (
                              <button
                                type="button"
                                onClick={() => setContactModalData({ isOpen: true, customerName: cust.name, customerPhone: cust.phone })}
                                className="text-[11px] font-semibold text-[#762F3D] hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                                title="Click to call or copy customer phone"
                              >
                                <Phone className="w-2.5 h-2.5 text-[#762F3D]" />
                                <span>{cust.phone}</span>
                              </button>
                            ) : (
                              <div className="text-[11px] text-[#80736F]">—</div>
                            )}
                          </td>
                          <td className="p-3.5 text-[#80736F]">
                            {cust.addresses?.[0] || 'Lahore, Pakistan'}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-[#762F3D]">{customerOrders.length} orders</div>
                            <div className="text-[11px] text-[#80736F]">Rs. {totalSpent.toLocaleString()} spent</div>
                          </td>
                          <td className="p-3.5">
                            <button
                              onClick={() => {
                                const newStatus = cust.status === 'active' ? 'inactive' : 'active';
                                updateUser(cust.id, { status: newStatus as any });
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                cust.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {cust.status === 'active' ? 'Active' : 'Deactivated'}
                            </button>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setSelectedCustomer(cust)}
                              className="px-3 py-1.5 bg-[#FAF7F2] text-[#762F3D] border border-[#E8E0D9] rounded-xl text-xs font-semibold hover:bg-white transition cursor-pointer"
                            >
                              View History
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: CUSTOM CAKE REQUESTS */}
          {/* ========================================================= */}
          {activeTab === 'custom' && (() => {
            const pendingCakes = customCakes.filter(c => ['Pending', 'Pending Review'].includes(c.status));
            const reviewCakes = customCakes.filter(c => ['Under Review', 'Reviewing'].includes(c.status));
            const quotedCakes = customCakes.filter(c => ['Quotation Sent', 'Quoted'].includes(c.status));
            const approvedCakes = customCakes.filter(c => ['Approved', 'Quotation Approved'].includes(c.status));
            const rejectedCakes = customCakes.filter(c => ['Rejected', 'Quotation Rejected'].includes(c.status));
            const convertedCakes = customCakes.filter(c => ['Converted to Order', 'Confirmed'].includes(c.status));

            const displayedCakes = customCakes.filter(c => {
              if (customCakeTabStatus === 'all') return true;
              if (customCakeTabStatus === 'Pending') return ['Pending', 'Pending Review'].includes(c.status);
              if (customCakeTabStatus === 'Under Review') return ['Under Review', 'Reviewing'].includes(c.status);
              if (customCakeTabStatus === 'Quotation Sent') return ['Quotation Sent', 'Quoted'].includes(c.status);
              if (customCakeTabStatus === 'Approved') return ['Approved', 'Quotation Approved'].includes(c.status);
              if (customCakeTabStatus === 'Rejected') return ['Rejected', 'Quotation Rejected'].includes(c.status);
              if (customCakeTabStatus === 'Converted to Order') return ['Converted to Order', 'Confirmed'].includes(c.status);
              return c.status.toLowerCase() === customCakeTabStatus.toLowerCase();
            });

            return (
              <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[#302725]">Custom Cake Requests</h2>
                    <p className="text-xs text-[#80736F]">Review client inspirations, manage pricing quotes, record customer approvals, and convert accepted requests to production orders</p>
                  </div>

                  <div className="text-xs font-bold text-[#762F3D] bg-[#762F3D]/10 px-3.5 py-1.5 rounded-xl">
                    {customCakes.length} Total Inquiries
                  </div>
                </div>

                {/* Status Workflow Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E0D9] pb-3">
                  {[
                    { id: 'all', label: 'All Requests', count: customCakes.length, color: 'bg-[#762F3D]' },
                    { id: 'Pending', label: 'Pending', count: pendingCakes.length, color: 'bg-amber-600' },
                    { id: 'Under Review', label: 'Under Review', count: reviewCakes.length, color: 'bg-blue-600' },
                    { id: 'Quotation Sent', label: 'Quotation Sent', count: quotedCakes.length, color: 'bg-indigo-600' },
                    { id: 'Approved', label: 'Approved', count: approvedCakes.length, color: 'bg-emerald-600' },
                    { id: 'Rejected', label: 'Rejected', count: rejectedCakes.length, color: 'bg-red-600' },
                    { id: 'Converted to Order', label: 'Converted to Order', count: convertedCakes.length, color: 'bg-purple-700' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCustomCakeTabStatus(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        customCakeTabStatus === tab.id
                          ? `${tab.color} text-white shadow-xs`
                          : 'bg-[#FAF7F2] text-[#80736F] hover:text-[#302725] border border-[#E8E0D9]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${customCakeTabStatus === tab.id ? 'bg-white/20 text-white' : 'bg-[#E8E0D9] text-[#302725]'}`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {displayedCakes.length === 0 ? (
                  <div className="p-12 text-center bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-2">
                    <Sparkles className="w-10 h-10 text-[#C5A46D] mx-auto opacity-60" />
                    <p className="text-sm font-semibold text-[#302725]">No custom cake requests in "{customCakeTabStatus}"</p>
                    <p className="text-xs text-[#80736F]">New bespoke requests submitted by clients will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedCakes.map(cake => {
                      const isPending = ['Pending', 'Pending Review'].includes(cake.status);
                      const isUnderReview = ['Under Review', 'Reviewing'].includes(cake.status);
                      const isQuotationSent = ['Quotation Sent', 'Quoted'].includes(cake.status);
                      const isApproved = ['Approved', 'Quotation Approved'].includes(cake.status);
                      const isRejected = ['Rejected', 'Quotation Rejected'].includes(cake.status);
                      const isConverted = ['Converted to Order', 'Confirmed'].includes(cake.status);

                      return (
                        <div key={cake.id} className="p-5 sm:p-6 rounded-3xl border border-[#E8E0D9] bg-[#FAF7F2] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {cake.referenceImage ? (
                              <div 
                                onClick={() => setZoomedImage(cake.referenceImage || null)}
                                className="relative group shrink-0 cursor-pointer"
                                title="Click to zoom reference photo"
                              >
                                <img
                                  src={cake.referenceImage}
                                  alt="Reference"
                                  className="w-20 h-20 object-cover rounded-2xl border border-[#E8E0D9] shadow-xs group-hover:opacity-90 transition"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/custom_wedding_cake.jpg';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Eye className="w-5 h-5" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-[#E8E0D9] flex items-center justify-center text-[#80736F] text-xs font-bold shrink-0">
                                No Photo
                              </div>
                            )}

                            <div className="space-y-1.5 text-xs flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[#762F3D] text-sm">{cake.requestNumber}</span>
                                <span className="font-semibold text-[#302725]">• {cake.occasion} ({cake.cakeType})</span>
                                <span className="bg-white border border-[#E8E0D9] px-2 py-0.5 rounded text-[10px] text-[#80736F]">
                                  {cake.pickupOrDelivery}
                                </span>
                                {isPending && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending Review</span>}
                                {isUnderReview && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Under Review</span>}
                                {isQuotationSent && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Quotation Sent</span>}
                                {isApproved && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><Check className="w-3 h-3" /> Approved by Customer</span>}
                                {isRejected && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1"><X className="w-3 h-3" /> Quotation Rejected</span>}
                                {isConverted && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-600" /> Converted to Order</span>}
                              </div>

                              <div className="text-[#302725] font-medium flex items-center gap-1.5 flex-wrap">
                                <span>Customer: <strong>{cake.customerName}</strong></span>
                                {cake.customerPhone && (
                                  <button
                                    type="button"
                                    onClick={() => setContactModalData({ isOpen: true, customerName: cake.customerName, customerPhone: cake.customerPhone })}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#762F3D] hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-md border border-[#E8E0D9]"
                                    title="Click to call customer"
                                  >
                                    <Phone className="w-2.5 h-2.5 text-[#762F3D]" />
                                    <span>{cake.customerPhone}</span>
                                  </button>
                                )}
                                {cake.customerEmail && (
                                  <span className="text-[#80736F] text-[11px]">({cake.customerEmail})</span>
                                )}
                              </div>

                              <div className="text-[#80736F] flex flex-wrap gap-2">
                                <span>Flavor: <strong className="text-[#302725]">{cake.flavor}</strong></span> •
                                <span>Size: <strong className="text-[#302725]">{cake.sizeWeight}</strong> ({cake.tiers} Tiers)</span> •
                                <span>Frosting: <strong className="text-[#302725]">{cake.froasting}</strong></span> •
                                <span>Filling: <strong className="text-[#302725]">{cake.filling}</strong></span>
                              </div>

                              <div className="text-[#80736F]">
                                Required Date: <strong className="text-[#302725]">{cake.requiredDate}</strong> • Fulfillment: <strong className="text-[#302725]">{cake.pickupOrDelivery}</strong> {cake.deliveryAddress ? `(${cake.deliveryAddress})` : ''}
                              </div>

                              {cake.personalMessage && (
                                <div className="text-[11px] bg-white p-2 rounded-xl border border-[#E8E0D9] text-[#762F3D] font-medium">
                                  Message on Cake: "{cake.personalMessage}"
                                </div>
                              )}

                              {cake.quotationNotes && (
                                <div className="text-[11px] text-blue-900 bg-blue-50/80 p-2 rounded-xl border border-blue-200/60">
                                  <strong>Quotation Notes:</strong> {cake.quotationNotes}
                                </div>
                              )}

                              {cake.rejectionReason && (
                                <div className="text-[11px] text-red-900 bg-red-50/80 p-2 rounded-xl border border-red-200/60">
                                  <strong>Rejection Note:</strong> {cake.rejectionReason}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quotation & Workflow Actions */}
                          <div className="flex flex-col sm:flex-row xl:flex-col lg:flex-row items-end sm:items-center xl:items-end gap-3 w-full xl:w-auto shrink-0 border-t xl:border-t-0 pt-3 xl:pt-0 border-[#E8E0D9]">
                            <div className="text-right">
                              <div className="text-[10px] text-[#80736F] uppercase tracking-wider font-bold">
                                {isQuotationSent || isApproved || isConverted ? 'Official Quoted Price' : 'Estimated Budget'}
                              </div>
                              <div className="font-serif text-lg font-bold text-[#762F3D]">
                                Rs. {(cake.quotedPrice || cake.estimatedPrice || 6500).toLocaleString()}
                              </div>
                            </div>

                            {/* Workflow Step Actions */}
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => reviewCustomCake(cake.id)}
                                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Mark request Under Review by bakery admin"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Review Request</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setQuoteModalCake(cake);
                                      setQuoteModalPrice(cake.quotedPrice || cake.estimatedPrice || 6500);
                                      setQuoteModalNotes(cake.quotationNotes || '');
                                    }}
                                    className="px-3.5 py-2 bg-[#762F3D] text-white rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Send Quotation</span>
                                  </button>
                                </>
                              )}

                              {isUnderReview && (
                                <button
                                  onClick={() => {
                                    setQuoteModalCake(cake);
                                    setQuoteModalPrice(cake.quotedPrice || cake.estimatedPrice || 6500);
                                    setQuoteModalNotes(cake.quotationNotes || '');
                                  }}
                                  className="px-3.5 py-2 bg-[#762F3D] text-white rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Send Quotation</span>
                                </button>
                              )}

                              {isQuotationSent && (
                                <>
                                  <button
                                    onClick={() => {
                                      setQuoteModalCake(cake);
                                      setQuoteModalPrice(cake.quotedPrice || 6500);
                                      setQuoteModalNotes(cake.quotationNotes || '');
                                    }}
                                    className="px-3 py-2 bg-white hover:bg-gray-50 text-[#302725] border border-[#E8E0D9] rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Edit quoted price or notes"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-[#80736F]" />
                                    <span>Edit Quote</span>
                                  </button>
                                  <button
                                    onClick={() => respondToQuotation(cake.id, 'approve')}
                                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Record customer acceptance (e.g. over phone)"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Record Customer Approval</span>
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <button
                                  onClick={() => {
                                    setSelectedCustomCake(cake);
                                    setCustomCakeQuotePrice(cake.quotedPrice || 6500);
                                    setCustomCakeAdvancePaid(2500);
                                  }}
                                  className="px-4 py-2 bg-[#762F3D] text-white rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                  title="Convert approved custom cake request into an official production order"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Convert to Official Order</span>
                                </button>
                              )}

                              {isRejected && (
                                <button
                                  onClick={() => {
                                    setQuoteModalCake(cake);
                                    setQuoteModalPrice(cake.quotedPrice || 6500);
                                    setQuoteModalNotes(cake.quotationNotes || '');
                                  }}
                                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Send Revised Quote</span>
                                </button>
                              )}

                              {isConverted && (
                                <button
                                  onClick={() => {
                                    setOrderTypeFilter('all');
                                    setOrderSearch(cake.convertedOrderNumber || cake.requestNumber);
                                    handleTabChange('orders');
                                  }}
                                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                  title="View linked official order in the Orders tab"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-purple-700" />
                                  <span>View Order {cake.convertedOrderNumber ? `(${cake.convertedOrderNumber})` : ''}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 7: INVENTORY & WAREHOUSE MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'inventory' && (() => {
            const totalStockUnits = inventory.reduce((acc, i) => acc + (Number(i.currentStock) || 0), 0);
            const totalValuation = inventory.reduce((acc, i) => acc + (Number(i.currentStock) || 0) * (Number(i.purchaseCost) || 0), 0);
            const lowStockCount = inventory.filter(i => (Number(i.currentStock) || 0) <= (Number(i.minStock) || 10) && (Number(i.currentStock) || 0) > 0).length;
            const outOfStockCount = inventory.filter(i => (Number(i.currentStock) || 0) === 0).length;
            const pendingRestockCount = restockRequests.filter(r => r.status === 'Pending').length;
            const activePoCount = purchaseOrders.filter(p => p.status === 'Pending' || p.status === 'Ordered' || p.status === 'Partially Received').length;

            const filteredMovements = stockMovements.filter(m => {
              const matchesType = adminMovementTypeFilter === 'all' || m.type === adminMovementTypeFilter;
              const matchesSearch = !adminMovementSearch || 
                m.ingredientName?.toLowerCase().includes(adminMovementSearch.toLowerCase()) ||
                m.reason?.toLowerCase().includes(adminMovementSearch.toLowerCase()) ||
                m.referenceNumber?.toLowerCase().includes(adminMovementSearch.toLowerCase()) ||
                m.performedBy?.toLowerCase().includes(adminMovementSearch.toLowerCase());
              return matchesType && matchesSearch;
            });

            const filteredPOs = purchaseOrders.filter(p => {
              return adminPoFilter === 'all' || p.status === adminPoFilter;
            });

            const filteredRequests = restockRequests.filter(r => {
              return adminRestockFilter === 'all' || r.status === adminRestockFilter;
            });

            return (
              <div className="space-y-6 animate-fadeIn">
                {/* Header & Main Stats */}
                <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-[#302725]">Inventory & Warehouse Operations</h2>
                      <p className="text-xs text-[#80736F]">Unified raw materials tracking, immutable stock audit movements, purchase orders, and kitchen restock stream</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAdminAdjustIngredient(inventory.length > 0 ? inventory[0] : null);
                          setAdminAdjustType('Adjustment');
                          setAdminAdjustQty('');
                          setAdminAdjustReason('');
                          setAdminAdjustRef('');
                          setAdminAdjustModalOpen(true);
                        }}
                        className="bg-[#FAF7F2] text-[#302725] border border-[#E8E0D9] hover:border-[#762F3D] px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#762F3D]" />
                        Adjust Stock
                      </button>

                      <button
                        onClick={() => {
                          setEditingInventory(null);
                          setInventoryFormData({
                            name: '',
                            category: 'Baking Essentials',
                            unit: 'kg',
                            currentStock: 50,
                            minStock: 15,
                            purchaseCost: 850,
                            supplier: 'Local Bakery Supplier',
                            status: 'In Stock'
                          });
                          setInventoryModalOpen(true);
                        }}
                        className="bg-[#762F3D] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add Ingredient
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9]">
                      <span className="text-[11px] font-semibold text-[#80736F] uppercase tracking-wider block">Raw Materials</span>
                      <p className="text-xl font-bold text-[#302725] mt-1">{inventory.length} items</p>
                      <span className="text-[10px] text-[#80736F]">{totalStockUnits.toLocaleString()} total units</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9]">
                      <span className="text-[11px] font-semibold text-[#80736F] uppercase tracking-wider block">Valuation</span>
                      <p className="text-xl font-bold text-[#762F3D] mt-1">Rs. {Math.round(totalValuation).toLocaleString()}</p>
                      <span className="text-[10px] text-[#80736F]">Total inventory worth</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9]">
                      <span className="text-[11px] font-semibold text-[#80736F] uppercase tracking-wider block">Low Stock</span>
                      <p className="text-xl font-bold text-amber-700 mt-1">{lowStockCount}</p>
                      <span className="text-[10px] text-amber-600 font-medium">Below threshold</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9]">
                      <span className="text-[11px] font-semibold text-[#80736F] uppercase tracking-wider block">Out of Stock</span>
                      <p className={`text-xl font-bold mt-1 ${outOfStockCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {outOfStockCount}
                      </p>
                      <span className="text-[10px] text-[#80736F]">Zero availability</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9]">
                      <span className="text-[11px] font-semibold text-[#80736F] uppercase tracking-wider block">Baker Requests</span>
                      <p className="text-xl font-bold text-blue-700 mt-1">{pendingRestockCount}</p>
                      <span className="text-[10px] text-blue-600 font-medium">Pending reviews</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9]">
                      <span className="text-[11px] font-semibold text-[#80736F] uppercase tracking-wider block">Active POs</span>
                      <p className="text-xl font-bold text-purple-700 mt-1">{activePoCount}</p>
                      <span className="text-[10px] text-purple-600 font-medium">In pipeline</span>
                    </div>
                  </div>

                  {/* Navigation Sub-Tabs */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E0D9] pb-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setAdminInventorySubTab('levels')}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        adminInventorySubTab === 'levels'
                          ? 'bg-[#762F3D] text-white shadow-2xs'
                          : 'bg-[#FAF7F2] text-[#80736F] hover:text-[#302725]'
                      }`}
                    >
                      <Warehouse className="w-3.5 h-3.5" />
                      <span>Stock Levels ({inventory.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminInventorySubTab('movements')}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        adminInventorySubTab === 'movements'
                          ? 'bg-[#762F3D] text-white shadow-2xs'
                          : 'bg-[#FAF7F2] text-[#80736F] hover:text-[#302725]'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Stock Movements Audit ({stockMovements.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminInventorySubTab('orders')}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        adminInventorySubTab === 'orders'
                          ? 'bg-[#762F3D] text-white shadow-2xs'
                          : 'bg-[#FAF7F2] text-[#80736F] hover:text-[#302725]'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Purchase Orders ({purchaseOrders.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminInventorySubTab('requests')}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        adminInventorySubTab === 'requests'
                          ? 'bg-[#762F3D] text-white shadow-2xs'
                          : 'bg-[#FAF7F2] text-[#80736F] hover:text-[#302725]'
                      }`}
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Kitchen Restock Queue ({restockRequests.length})</span>
                    </button>
                  </div>
                </div>

                {/* SUB-TAB 1: STOCK LEVELS & RAW MATERIALS */}
                {adminInventorySubTab === 'levels' && (
                  <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="relative max-w-md w-full">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-[#80736F]" />
                        <input
                          type="text"
                          placeholder="Search ingredient or supplier..."
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                        />
                      </div>
                      <span className="text-xs text-[#80736F]">
                        Showing {filteredInventory.length} of {inventory.length} raw ingredients
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-[#E8E0D9]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#FAF7F2] text-[#80736F] font-semibold border-b border-[#E8E0D9]">
                          <tr>
                            <th className="p-3.5">Ingredient Name</th>
                            <th className="p-3.5">Category</th>
                            <th className="p-3.5">Current Stock</th>
                            <th className="p-3.5">Minimum Level</th>
                            <th className="p-3.5">Purchase Cost</th>
                            <th className="p-3.5">Supplier</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E0D9]">
                          {filteredInventory.map(item => (
                            <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition">
                              <td className="p-3.5 font-bold text-[#302725]">{item.name}</td>
                              <td className="p-3.5 text-[#80736F]">{item.category}</td>
                              <td className="p-3.5 font-bold text-[#762F3D]">
                                {item.currentStock} {item.unit}
                              </td>
                              <td className="p-3.5 text-[#80736F]">{item.minStock} {item.unit}</td>
                              <td className="p-3.5 font-medium">Rs. {Number(item.purchaseCost || 0).toLocaleString()}</td>
                              <td className="p-3.5 text-[#80736F]">{item.supplier}</td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                  item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' :
                                  item.status === 'Critical' ? 'bg-orange-100 text-orange-800 border border-orange-200 animate-pulse' :
                                  item.status === 'Out of Stock' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex justify-end items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setAdminAdjustIngredient(item);
                                      setAdminAdjustType('Adjustment');
                                      setAdminAdjustQty('');
                                      setAdminAdjustReason('');
                                      setAdminAdjustRef('');
                                      setAdminAdjustModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-[#FAF7F2] text-[#762F3D] border border-[#E8E0D9] rounded-lg text-[11px] font-semibold hover:border-[#762F3D] cursor-pointer"
                                    title="Adjust Stock Quantity"
                                  >
                                    Adjust
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingInventory(item);
                                      setInventoryFormData(item);
                                      setInventoryModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-[#FAF7F2] text-[#302725] border border-[#E8E0D9] rounded-lg text-[11px] font-semibold hover:border-[#762F3D] cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteConfirm({
                                        open: true,
                                        title: 'Delete Ingredient',
                                        message: `Are you sure you want to remove "${item.name}" from raw material inventory?`,
                                        onConfirm: () => deleteInventoryItem(item.id)
                                      });
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {filteredInventory.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center py-10 px-4">
                                <div className="flex flex-col items-center justify-center text-center">
                                  <Warehouse className="w-10 h-10 text-[#80736F]/40 mb-2" />
                                  <h3 className="text-sm font-bold text-[#302725]">No Ingredients Found</h3>
                                  <p className="text-xs text-[#80736F] max-w-sm mt-1">
                                    No raw materials match your query &ldquo;{inventorySearch}&rdquo;.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: STOCK MOVEMENTS AUDIT LOG */}
                {adminInventorySubTab === 'movements' && (
                  <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={adminMovementTypeFilter}
                          onChange={(e) => setAdminMovementTypeFilter(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D] font-medium"
                        >
                          <option value="all">All Movement Types</option>
                          <option value="Received">Purchase Received</option>
                          <option value="Used">Production Consumption</option>
                          <option value="Wasted">Wastage</option>
                          <option value="Adjustment">Manual Adjustment</option>
                        </select>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#80736F]" />
                          <input
                            type="text"
                            placeholder="Search ingredient, ref, user..."
                            value={adminMovementSearch}
                            onChange={(e) => setAdminMovementSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                          />
                        </div>
                      </div>

                      <span className="text-xs text-[#80736F]">
                        {filteredMovements.length} logged stock transactions
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-[#E8E0D9]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#FAF7F2] text-[#80736F] font-semibold border-b border-[#E8E0D9]">
                          <tr>
                            <th className="p-3.5">Date & Time</th>
                            <th className="p-3.5">Ingredient</th>
                            <th className="p-3.5">Movement Type</th>
                            <th className="p-3.5">Quantity Change</th>
                            <th className="p-3.5">Stock Level</th>
                            <th className="p-3.5">Reason & Reference</th>
                            <th className="p-3.5">Performed By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E0D9]">
                          {filteredMovements.map(m => {
                            const isPositive = m.type === 'Received' || (m.type === 'Adjustment' && (m.newStock ?? 0) >= (m.previousStock ?? 0));
                            return (
                              <tr key={m.id} className="hover:bg-[#FAF7F2]/60 transition">
                                <td className="p-3.5 text-[#80736F] whitespace-nowrap font-mono text-[11px]">{m.createdAt}</td>
                                <td className="p-3.5 font-bold text-[#302725]">
                                  {m.ingredientName}
                                  <span className="block text-[10px] text-[#80736F] font-normal">{m.ingredientId}</span>
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                    m.type === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                                    m.type === 'Used' ? 'bg-blue-100 text-blue-800' :
                                    m.type === 'Wasted' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {m.type === 'Received' ? 'Purchase Received' :
                                     m.type === 'Used' ? 'Production Consumed' :
                                     m.type === 'Wasted' ? 'Wastage Recorded' : 'Manual Adjustment'}
                                  </span>
                                </td>
                                <td className="p-3.5 font-bold">
                                  <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                                    {isPositive ? '+' : '-'}{m.quantity} {m.unit}
                                  </span>
                                </td>
                                <td className="p-3.5 text-[#80736F] whitespace-nowrap font-mono text-[11px]">
                                  {m.previousStock} &rarr; <strong className="text-[#302725]">{m.newStock}</strong> {m.unit}
                                </td>
                                <td className="p-3.5 max-w-xs text-[#302725]">
                                  <p className="truncate">{m.reason}</p>
                                  {m.referenceNumber && (
                                    <span className="text-[10px] text-[#80736F] font-mono">Ref: {m.referenceNumber}</span>
                                  )}
                                </td>
                                <td className="p-3.5 text-[#302725] font-medium whitespace-nowrap">
                                  {m.performedBy || 'System Staff'}
                                </td>
                              </tr>
                            );
                          })}

                          {filteredMovements.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-10 px-4 text-xs text-[#80736F]">
                                No stock movements match the selected filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: PURCHASE ORDERS & RECEIVING */}
                {adminInventorySubTab === 'orders' && (
                  <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <select
                        value={adminPoFilter}
                        onChange={(e) => setAdminPoFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D] font-medium"
                      >
                        <option value="all">All Purchase Orders</option>
                        <option value="Pending">Pending</option>
                        <option value="Ordered">Ordered</option>
                        <option value="Partially Received">Partially Received</option>
                        <option value="Received">Received / Completed</option>
                      </select>

                      <span className="text-xs text-[#80736F]">
                        {filteredPOs.length} purchase records
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-[#E8E0D9]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#FAF7F2] text-[#80736F] font-semibold border-b border-[#E8E0D9]">
                          <tr>
                            <th className="p-3.5">PO Number</th>
                            <th className="p-3.5">Supplier</th>
                            <th className="p-3.5">Order Date</th>
                            <th className="p-3.5">Expected Delivery</th>
                            <th className="p-3.5">Items (Ordered vs Received)</th>
                            <th className="p-3.5">Total Cost</th>
                            <th className="p-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E0D9]">
                          {filteredPOs.map(po => (
                            <tr key={po.id} className="hover:bg-[#FAF7F2]/60 transition">
                              <td className="p-3.5 font-bold font-mono text-[#762F3D]">{po.poNumber}</td>
                              <td className="p-3.5 font-bold text-[#302725]">{po.supplierName}</td>
                              <td className="p-3.5 text-[#80736F]">{po.orderDate}</td>
                              <td className="p-3.5 text-[#80736F]">{po.expectedDeliveryDate || 'Standard Delivery'}</td>
                              <td className="p-3.5">
                                <div className="space-y-1">
                                  {po.items?.map((it, idx) => (
                                    <div key={idx} className="text-[11px] text-[#302725]">
                                      &bull; {it.ingredientName}: <strong>{it.receivedQuantity || 0}</strong> / {it.quantity} {it.unit}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3.5 font-bold text-[#302725]">
                                Rs. {Number(po.totalAmount || 0).toLocaleString()}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                                  po.status === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                                  po.status === 'Partially Received' ? 'bg-blue-100 text-blue-800' :
                                  po.status === 'Ordered' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {po.status}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {filteredPOs.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-10 px-4 text-xs text-[#80736F]">
                                No purchase orders found for this status.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 4: KITCHEN RESTOCK QUEUE */}
                {adminInventorySubTab === 'requests' && (
                  <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <select
                        value={adminRestockFilter}
                        onChange={(e) => setAdminRestockFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D] font-medium"
                      >
                        <option value="all">All Restock Requests</option>
                        <option value="Pending">Pending Review</option>
                        <option value="Approved">Approved / In PO</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Dismissed">Dismissed</option>
                      </select>

                      <span className="text-xs text-[#80736F]">
                        {filteredRequests.length} kitchen requests
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredRequests.map(req => {
                        const matched = inventory.find(i => i.name.toLowerCase() === req.ingredientName.toLowerCase());
                        const isPending = req.status === 'Pending';
                        const isApproved = req.status === 'Approved' || req.status === 'PO Created';
                        const isFulfilled = req.status === 'Fulfilled';

                        return (
                          <div
                            key={req.id}
                            className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] p-5 space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-serif font-bold text-base text-[#302725]">{req.ingredientName}</h4>
                                  <p className="text-[10px] text-[#80736F]">Requested by {req.requestedBy} &bull; {req.createdAt}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  req.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                                  req.urgency === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {req.urgency}
                                </span>
                              </div>

                              <div className="bg-white p-3 rounded-xl border border-[#E8E0D9] text-xs space-y-1">
                                <div><strong>Quantity Needed:</strong> {req.quantityNeeded}</div>
                                <div>
                                  <strong>Current In Stock:</strong>{' '}
                                  {matched ? `${matched.currentStock} ${matched.unit}` : 'Not linked'}
                                </div>
                                {req.notes && <p className="italic text-[#80736F] text-[11px]">"{req.notes}"</p>}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#E8E0D9] flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isFulfilled ? 'bg-emerald-100 text-emerald-800' :
                                isApproved ? 'bg-blue-100 text-blue-800' :
                                isPending ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isFulfilled ? 'Fulfilled' : isApproved ? 'Approved' : isPending ? 'Pending' : req.status}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => updateRestockRequestStatus(req.id, 'Approved')}
                                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateRestockRequestStatus(req.id, 'Dismissed')}
                                      className="px-2.5 py-1 bg-white border border-[#E8E0D9] hover:bg-gray-100 text-[#80736F] rounded-lg text-[10px] font-bold cursor-pointer"
                                    >
                                      Dismiss
                                    </button>
                                  </>
                                )}
                                {isApproved && (
                                  <button
                                    type="button"
                                    onClick={() => updateRestockRequestStatus(req.id, 'Fulfilled')}
                                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer"
                                  >
                                    Mark Fulfilled
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {filteredRequests.length === 0 && (
                        <div className="col-span-full text-center py-10 px-4 text-xs text-[#80736F]">
                          No restock requests found for this status.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 8: STAFF & ROLE MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'staff' && (() => {
            const roleFilterOptions = [
              { value: 'all', label: 'All' },
              { value: 'admin', label: 'Admin' },
              { value: 'cashier', label: 'Cashier' },
              { value: 'baker', label: 'Baker' },
              { value: 'inventory_manager', label: 'Inventory Manager' },
              { value: 'delivery', label: 'Delivery Staff' }
            ];

            const filteredStaff = staffRoleFilter === 'all'
              ? staffList
              : staffList.filter(u => u.role?.toLowerCase() === staffRoleFilter.toLowerCase());

            return (
              <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[#302725]">Staff & Role Permissions</h2>
                    <p className="text-xs text-[#80736F]">Manage bakery employees across Admin, Cashier, Baker, Inventory Manager, and Delivery roles</p>
                  </div>

                  <button
                    onClick={() => {
                      setStaffFormData({
                        name: '',
                        email: '',
                        phone: '+92 300 0000000',
                        role: 'baker',
                        password: '',
                        status: 'active'
                      });
                      setStaffModalOpen(true);
                    }}
                    className="bg-[#762F3D] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Staff Member
                  </button>
                </div>

                {/* Single Role Filter Dropdown */}
                <div className="flex items-center">
                  <Dropdown
                    value={staffRoleFilter}
                    onChange={(val) => setStaffRoleFilter(val)}
                    options={roleFilterOptions}
                    prefix={<span className="font-medium text-[#80736F]">Filter by Role:</span>}
                    size="md"
                    className="w-full sm:w-64"
                    buttonClassName="w-full bg-[#FAF7F2] border-[#E8E0D9] text-xs font-bold text-[#302725]"
                  />
                </div>

                {/* All Employees in Original Mixed Grid */}
                {filteredStaff.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map(member => (
                      <div key={member.id} className="p-5 rounded-3xl border border-[#E8E0D9] bg-[#FAF7F2] space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#762F3D] text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden">
                                {member.avatar ? (
                                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                  member.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-[#302725] text-sm">{member.name}</div>
                                <div className="text-[11px] text-[#80736F]">{member.email}</div>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                            }`}>
                              {member.status}
                            </span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#E8E0D9] space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#80736F]">Role:</span>
                              <span className="font-bold text-[#762F3D] uppercase text-[11px] tracking-wide">
                                {member.role.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#80736F]">Phone:</span>
                              <span className="font-medium text-[#302725]">{member.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center border-t border-[#E8E0D9]">
                          <button
                            onClick={() => {
                              const newStatus = member.status === 'active' ? 'inactive' : 'active';
                              updateUser(member.id, { status: newStatus as any });
                            }}
                            className="text-[11px] font-bold text-[#762F3D] hover:underline cursor-pointer"
                          >
                            {member.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>

                          {member.email !== 'admin@thecakehouse.pk' && (
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  open: true,
                                  title: 'Remove Staff Account',
                                  message: `Are you sure you want to remove staff member ${member.name} (${member.role})?`,
                                  onConfirm: () => deleteUser(member.id)
                                });
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete Staff"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-[#E8E0D9] bg-[#FAF7F2]/50 text-center text-xs text-[#80736F]">
                    No staff members found matching the selected role.
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 9: REPORTS & FINANCIAL ANALYTICS */}
          {/* ========================================================= */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#302725]">Financial & Sales Reports</h2>
                  <p className="text-xs text-[#80736F]">Aggregated revenue analytics, payment breakdowns, and exportable data</p>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="bg-[#762F3D] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#5F2030] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Complete CSV
                </button>
              </div>

              {/* Timeframe Filter Buttons */}
              <div className="flex flex-wrap gap-2 border-b border-[#E8E0D9] pb-4">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: 'year', label: 'This Year' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => setReportRange(r.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      reportRange === r.id 
                        ? 'bg-[#762F3D] text-white shadow-xs' 
                        : 'bg-[#FAF7F2] text-[#302725] hover:bg-[#EFEAE3]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-1">
                  <div className="text-xs text-[#80736F]">Total Period Revenue</div>
                  <div className="font-serif text-2xl font-bold text-[#762F3D]">
                    Rs. {totalRev.toLocaleString()}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-1">
                  <div className="text-xs text-[#80736F]">Average Order Value (AOV)</div>
                  <div className="font-serif text-2xl font-bold text-[#302725]">
                    Rs. {orders.length > 0 ? Math.round(totalRev / orders.length).toLocaleString() : 0}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-1">
                  <div className="text-xs text-[#80736F]">Completed Order Fulfillment</div>
                  <div className="font-serif text-2xl font-bold text-emerald-700">
                    {orders.length > 0 ? Math.round((completedOrdersCount / orders.length) * 100) : 100}%
                  </div>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div className="space-y-3 pt-2">
                <h3 className="font-serif font-bold text-base text-[#302725]">Payment Methods Distribution</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['Cash', 'Bank Transfer', 'COD', 'Card'].map(method => {
                    const count = orders.filter(o => o.paymentMethod === method).length;
                    const volume = orders.filter(o => o.paymentMethod === method).reduce((s, o) => s + (o.total || 0), 0);
                    return (
                      <div key={method} className="p-4 rounded-2xl border border-[#E8E0D9] bg-white space-y-1 shadow-2xs">
                        <div className="text-xs font-bold text-[#302725]">{method}</div>
                        <div className="font-serif text-lg font-bold text-[#762F3D]">Rs. {volume.toLocaleString()}</div>
                        <div className="text-[11px] text-[#80736F]">{count} transactions</div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 10: BAKERY SETTINGS & CONFIGURATION */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#302725]">Bakery Configuration</h2>
                <p className="text-xs text-[#80736F]">Manage store identity, contact information, business hours, and delivery policies</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                
                {/* General Info */}
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-base text-[#762F3D] border-b border-[#E8E0D9] pb-2">
                    Store Identity
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Bakery Name</label>
                      <input
                        type="text"
                        value={settingsForm.bakeryName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, bakeryName: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Brand Tagline</label>
                      <input
                        type="text"
                        value={settingsForm.tagline}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery & Financial Rules */}
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-base text-[#762F3D] border-b border-[#E8E0D9] pb-2">
                    Delivery & Ordering Rules
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Standard Delivery Fee (PKR)</label>
                      <input
                        type="number"
                        value={settingsForm.deliveryFee}
                        onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Free Delivery Over (PKR)</label>
                      <input
                        type="number"
                        value={settingsForm.freeDeliveryThreshold}
                        onChange={(e) => setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Tax / GST Rate (%)</label>
                      <input
                        type="number"
                        value={settingsForm.taxRate}
                        onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: Number(e.target.value) })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact & Hours */}
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-base text-[#762F3D] border-b border-[#E8E0D9] pb-2">
                    Contact & Operation Details
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Bakery Phone / WhatsApp</label>
                      <input
                        type="text"
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Store Address</label>
                      <input
                        type="text"
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#302725] mb-1">Business Hours</label>
                      <input
                        type="text"
                        value={settingsForm.businessHours}
                        onChange={(e) => setSettingsForm({ ...settingsForm, businessHours: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-[#762F3D]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className={`px-6 py-3 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer ${
                      saveSettingsSuccess
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : isSavingSettings
                          ? 'bg-[#762F3D]/70 text-white cursor-not-allowed opacity-80'
                          : 'bg-[#762F3D] text-white hover:bg-[#5F2030]'
                    }`}
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Settings...</span>
                      </>
                    ) : saveSettingsSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Settings Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Settings</span>
                      </>
                    )}
                  </button>

                  {saveSettingsError && (
                    <div className="text-xs text-red-600 flex items-center gap-1.5 font-medium animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{saveSettingsError}</span>
                    </div>
                  )}
                </div>

              </form>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {/* ========================================================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E8E0D9] shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-4">
              <h3 className="font-serif text-xl font-bold text-[#302725]">
                {editingProduct ? 'Edit Bakery Product' : 'Add New Bakery Product'}
              </h3>
              <button 
                onClick={() => setProductModalOpen(false)}
                className="p-1 text-[#80736F] hover:text-[#302725] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Belgian Truffle Torte"
                    value={productFormData.name || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Category *</label>
                  <Dropdown
                    value={productFormData.category || categories[0]?.name || 'Cakes'}
                    onChange={(cat) => setProductFormData({ ...productFormData, category: cat })}
                    options={categories.map(c => ({ value: c.name, label: c.name }))}
                    size="md"
                    buttonClassName="w-full bg-[#FAF7F2] border-[#E8E0D9] text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Regular Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={productFormData.price || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, price: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Discount / Original Price (PKR)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={productFormData.previousPrice || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, previousPrice: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={productFormData.stockQty ?? 20}
                    onChange={(e) => setProductFormData({ ...productFormData, stockQty: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              {/* Real Image Upload with Multer */}
              <div>
                <label className="block font-semibold text-[#302725] mb-1">Product Photo</label>
                <div className="flex items-center gap-4">
                  {productFormData.images && productFormData.images[0] && (
                    <img 
                      src={productFormData.images[0]} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded-xl border border-[#E8E0D9]" 
                    />
                  )}
                  
                  <div className="flex-1">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleProductImageUpload} 
                      accept="image/jpeg,image/png,image/webp" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-semibold hover:bg-[#EFEAE3] transition flex items-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-[#762F3D]" />
                      {uploadingImage ? 'Uploading Image...' : 'Upload Image from Computer (JPG, PNG, WEBP)'}
                    </button>
                    <p className="text-[10px] text-[#80736F] mt-1">Maximum file size: 5 MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Rich, moist layers with silky chocolate ganache..."
                  value={productFormData.description || ''}
                  onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Ingredients (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Flour, Butter, Sugar, Cocoa"
                    value={Array.isArray(productFormData.ingredients) ? productFormData.ingredients.join(', ') : (productFormData.ingredients || '')}
                    onChange={(e) => setProductFormData({ ...productFormData, ingredients: e.target.value as any })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Allergens (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Dairy, Eggs, Gluten"
                    value={Array.isArray(productFormData.allergens) ? productFormData.allergens.join(', ') : (productFormData.allergens || '')}
                    onChange={(e) => setProductFormData({ ...productFormData, allergens: e.target.value as any })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={productFormData.inStock ?? true}
                    onChange={(e) => setProductFormData({ ...productFormData, inStock: e.target.checked })}
                    className="accent-[#762F3D] w-4 h-4 rounded"
                  />
                  <span>Active & Available for Ordering</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={productFormData.featured ?? false}
                    onChange={(e) => setProductFormData({ ...productFormData, featured: e.target.checked })}
                    className="accent-[#762F3D] w-4 h-4 rounded"
                  />
                  <span>Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={productFormData.bestseller ?? false}
                    onChange={(e) => setProductFormData({ ...productFormData, bestseller: e.target.checked })}
                    className="accent-[#762F3D] w-4 h-4 rounded"
                  />
                  <span>Mark as Bestseller</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E0D9] text-[#80736F] hover:bg-[#FAF7F2] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#762F3D] text-white font-bold hover:bg-[#5F2030] shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT CATEGORY */}
      {/* ========================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-4 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#302725]">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#302725] mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artisanal Cookies"
                  value={categoryFormData.name || ''}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Slug (URL)</label>
                <input
                  type="text"
                  placeholder="e.g. cookies (auto-generated if empty)"
                  value={categoryFormData.slug || ''}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={categoryFormData.image || ''}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, image: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={categoryFormData.description || ''}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#762F3D] text-white font-bold hover:bg-[#5F2030]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ORDER DETAILS */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E8E0D9] pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#762F3D] uppercase tracking-wider">Order Breakdown</span>
                <h3 className="font-serif text-2xl font-bold text-[#302725] mt-1">{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-[#80736F]">{selectedOrder.createdAt}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E0D9]">
              <div>
                <span className="text-[#80736F]">Customer:</span>
                <div className="font-bold text-[#302725]">{selectedOrder.customerName}</div>
                {selectedOrder.customerPhone ? (
                  <button
                    type="button"
                    onClick={(e) => handleOpenCustomerContact(selectedOrder, e)}
                    className="text-xs font-semibold text-[#762F3D] hover:underline flex items-center gap-1.5 mt-1 bg-white hover:bg-[#F3E6DF] px-2.5 py-1 rounded-xl border border-[#E8E0D9] transition cursor-pointer"
                    title="Click to call or copy customer phone"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#762F3D]" />
                    <span>{selectedOrder.customerPhone}</span>
                  </button>
                ) : (
                  <div className="text-[#80736F]">{selectedOrder.customerPhone || '—'}</div>
                )}
              </div>
              <div>
                <span className="text-[#80736F]">Fulfillment & Address:</span>
                <div className="font-bold text-[#302725]">{selectedOrder.fulfillmentMethod}</div>
                <div className="text-[#80736F]">{selectedOrder.deliveryAddress || 'Store Pickup (Gulberg III, Lahore)'}</div>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-[#302725]">Ordered Items</h4>
              <div className="divide-y divide-[#E8E0D9] border border-[#E8E0D9] rounded-2xl p-4 text-xs">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-[#302725]">{item.name}</div>
                      <div className="text-[#80736F]">Qty: {item.quantity} {item.variant ? `• ${item.variant}` : ''}</div>
                    </div>
                    <div className="font-bold text-[#762F3D]">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E0D9] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#80736F]">
                <span>Subtotal</span>
                <span>Rs. {selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#80736F]">
                <span>Delivery Charge</span>
                <span>Rs. {selectedOrder.deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#302725] font-bold text-sm pt-2 border-t border-[#E8E0D9]">
                <span>Grand Total</span>
                <span className="text-[#762F3D]">Rs. {selectedOrder.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#80736F] pt-1">
                <span>Payment Method / Status</span>
                <span className="font-semibold text-[#302725]">{selectedOrder.paymentMethod} • {selectedOrder.paymentStatus}</span>
              </div>
            </div>

            {/* Operational Tracking: Baker & Courier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Baker Assignment Card */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#302725] flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-[#762F3D]" />
                    <span>Baker Assignment</span>
                  </span>
                  {(() => {
                    const bt = productionTasks.find(t => t.orderId === selectedOrder.id || t.orderNumber === selectedOrder.orderNumber);
                    return bt ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {bt.stage}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#80736F]">Unassigned</span>
                    );
                  })()}
                </div>
                {(() => {
                  const reqPrep = isOrderRequiringPreparation(selectedOrder, products);
                  if (!reqPrep) {
                    return (
                      <div className="text-[11px] text-[#80736F] italic">
                        Not required (Ready-made product)
                      </div>
                    );
                  }
                  const bt = productionTasks.find(t => t.orderId === selectedOrder.id || t.orderNumber === selectedOrder.orderNumber);
                  return bt ? (
                    <div className="text-[11px] text-[#80736F]">
                      Assigned to <strong className="text-[#302725]">{bt.assignedBaker || 'Chef Tariq'}</strong> ({bt.stage})
                    </div>
                  ) : selectedOrder.status === 'Cancelled' ? (
                    <div className="text-[11px] text-[#80736F]">Cancelled</div>
                  ) : (
                    <button
                      onClick={() => {
                        setAssignBakerModalOrder(selectedOrder);
                        setSelectedBakerId(availableBakers[0]?.id || 'u-4');
                        setSelectedBakerName(availableBakers[0]?.name.trim() || 'Chef Tariq');
                        setBakerNotes(`Prep for ${selectedOrder.customerName}`);
                      }}
                      className="w-full py-1.5 bg-[#762F3D] hover:bg-[#5F2030] text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ChefHat className="w-3 h-3" />
                      <span>Assign Baker</span>
                    </button>
                  );
                })()}
              </div>

              {/* Courier Assignment Card */}
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#302725] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#762F3D]" />
                    <span>Courier Dispatch</span>
                  </span>
                  {selectedOrder.fulfillmentMethod === 'Delivery' ? (
                    (() => {
                      const dt = deliveries.find(d => (d.orderId === selectedOrder.id || d.orderNumber === selectedOrder.orderNumber) && (d.status as string) !== 'Cancelled' && d.status !== 'Returned');
                      return dt ? (
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {dt.status}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#80736F]">Unassigned</span>
                      );
                    })()
                  ) : (
                    <span className="text-[10px] text-[#80736F]">Store Pickup</span>
                  )}
                </div>
                {selectedOrder.fulfillmentMethod === 'Delivery' ? (
                  (() => {
                    const dt = deliveries.find(d => (d.orderId === selectedOrder.id || d.orderNumber === selectedOrder.orderNumber) && (d.status as string) !== 'Cancelled' && d.status !== 'Returned');
                    const reqPrep = isOrderRequiringPreparation(selectedOrder, products);
                    const bt = productionTasks.find(t => t.orderId === selectedOrder.id || t.orderNumber === selectedOrder.orderNumber);
                    const isReady = selectedOrder.status === 'Ready' || selectedOrder.status === 'Completed' || bt?.stage === 'Completed';

                    if (dt) {
                      return (
                        <div className="text-[11px] text-[#80736F]">
                          Assigned to <strong className="text-[#302725]">{dt.assignedStaff || 'Bilal Raza'}</strong> ({dt.status})
                        </div>
                      );
                    }

                    if (reqPrep && !isReady) {
                      return (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Awaiting Kitchen Prep (Mark Ready first)</span>
                        </div>
                      );
                    }

                    if (!reqPrep && selectedOrder.status === 'Pending') {
                      return (
                        <div className="p-2 rounded-xl bg-gray-100 border border-gray-200 text-[#80736F] text-[11px] flex items-center justify-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span>Confirm order before dispatch</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        onClick={() => {
                          setAssignDeliveryModalOrder(selectedOrder);
                          setSelectedCourierId(availableCouriers[0]?.id || 'u-6');
                          setSelectedCourierName(availableCouriers[0]?.name.trim() || 'Bilal Raza');
                          setDeliveryInstructions(`Address: ${selectedOrder.deliveryAddress || 'Lahore'}`);
                        }}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3 h-3" />
                        <span>Assign Courier</span>
                      </button>
                    );
                  })()
                ) : (
                  <div className="text-[11px] text-[#80736F] italic">
                    Customer will collect from bakery counter (No delivery needed)
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setInvoiceOrder(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2.5 bg-[#762F3D] text-white rounded-xl text-xs font-bold hover:bg-[#5F2030] flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Official Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: PRINTABLE INVOICE */}
      {/* ========================================================= */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 space-y-6 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto print:m-0 print:p-0 print:border-none print:shadow-none">
            
            <div className="flex justify-between items-start border-b border-[#E8E0D9] pb-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#762F3D]">{settings.bakeryName || 'The Cake House'}</h2>
                <p className="text-[11px] text-[#80736F]">{settings.tagline || 'Artisanal Bakery & Luxury Cakes'} • {settings.city || 'Lahore, Pakistan'}</p>
                <p className="text-[10px] text-[#80736F]">Phone: {settings.phone || '+92 300 1234567'} | {settings.email || 'info@thecakehouse.pk'}</p>
              </div>

              <div className="text-right">
                <span className="bg-[#FAF7F2] border border-[#E8E0D9] px-3 py-1 rounded-full text-xs font-bold text-[#302725]">
                  OFFICIAL INVOICE
                </span>
                <div className="font-bold text-sm text-[#302725] mt-1">{invoiceOrder.orderNumber}</div>
                <div className="text-[11px] text-[#80736F]">{invoiceOrder.createdAt}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D9]">
              <div>
                <div className="font-bold text-[#302725]">Billed To:</div>
                <div>{invoiceOrder.customerName}</div>
                <div>{invoiceOrder.customerPhone}</div>
              </div>
              <div>
                <div className="font-bold text-[#302725]">Fulfillment Details:</div>
                <div>Method: {invoiceOrder.fulfillmentMethod}</div>
                <div>{invoiceOrder.deliveryAddress || 'Gulberg III Store Pickup'}</div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E8E0D9]">
              <table className="w-full text-xs text-left min-w-[320px]">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F]">
                  <tr>
                    <th className="p-2">Item Description</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {invoiceOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium text-[#302725]">
                        {it.name} {it.variant ? `(${it.variant})` : ''}
                      </td>
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p-2 text-right">Rs. {it.price.toLocaleString()}</td>
                      <td className="p-2 text-right font-bold text-[#302725]">
                        Rs. {(it.price * it.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-[#E8E0D9] pt-3 text-xs space-y-1">
              <div className="flex justify-between text-[#80736F]">
                <span>Subtotal:</span>
                <span>Rs. {invoiceOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#80736F]">
                <span>Delivery Fee:</span>
                <span>Rs. {invoiceOrder.deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#762F3D] pt-2 border-t border-[#E8E0D9]">
                <span>Total Amount:</span>
                <span>Rs. {invoiceOrder.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#80736F] text-[11px] pt-1">
                <span>Payment Status:</span>
                <span className="font-bold text-emerald-800">{invoiceOrder.paymentStatus} via {invoiceOrder.paymentMethod}</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-[#80736F] border-t border-[#E8E0D9] pt-4">
              Thank you for celebrating with {settings.bakeryName || 'The Cake House'}! Freshness & luxury guaranteed.
            </div>

            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button
                onClick={() => setInvoiceOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F]"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#762F3D] text-white font-bold hover:bg-[#5F2030] flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: CONVERT CUSTOM CAKE TO ORDER */}
      {/* ========================================================= */}
      {selectedCustomCake && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-5 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302725]">Convert to Official Order</h3>
                <p className="text-xs text-[#80736F]">{selectedCustomCake.requestNumber} • {selectedCustomCake.customerName}</p>
              </div>
              <button onClick={() => setSelectedCustomCake(null)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#302725] mb-1">Final Quoted Price (PKR)</label>
                <input
                  type="number"
                  value={customCakeQuotePrice}
                  onChange={(e) => setCustomCakeQuotePrice(Number(e.target.value))}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl font-bold text-sm text-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Advance Received (PKR)</label>
                <input
                  type="number"
                  value={customCakeAdvancePaid}
                  onChange={(e) => setCustomCakeAdvancePaid(Number(e.target.value))}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] leading-relaxed">
                Converting this approved request will create an official Order in your live database with status <strong>Confirmed</strong>, update the request status to <strong>Converted to Order</strong>, and unlock Baker assignment in production.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setSelectedCustomCake(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await convertCustomCakeToOrder(selectedCustomCake.id, customCakeQuotePrice, customCakeAdvancePaid);
                    setSelectedCustomCake(null);
                    showToast(`Custom cake converted to official order! Baker can now be assigned.`);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#762F3D] text-white font-bold hover:bg-[#5F2030] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Confirm & Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PREPARE & SEND CUSTOM CAKE QUOTATION */}
      {/* ========================================================= */}
      {quoteModalCake && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-5 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302725]">Prepare & Send Quotation</h3>
                <p className="text-xs text-[#80736F]">{quoteModalCake.requestNumber} • {quoteModalCake.customerName}</p>
              </div>
              <button onClick={() => setQuoteModalCake(null)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E0D9] space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Occasion & Type:</span>
                  <strong className="text-[#302725]">{quoteModalCake.occasion} ({quoteModalCake.cakeType})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Specs:</span>
                  <strong className="text-[#302725]">{quoteModalCake.flavor} • {quoteModalCake.sizeWeight} ({quoteModalCake.tiers})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#80736F]">Required Date:</span>
                  <strong className="text-[#302725]">{quoteModalCake.requiredDate}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Official Quoted Price (PKR) *</label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={quoteModalPrice}
                  onChange={(e) => setQuoteModalPrice(Number(e.target.value))}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl font-bold text-sm text-[#762F3D] focus:outline-none focus:border-[#762F3D]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Quotation Notes / Ingredients Inclusions</label>
                <textarea
                  rows={3}
                  value={quoteModalNotes}
                  onChange={(e) => setQuoteModalNotes(e.target.value)}
                  placeholder="e.g. Includes custom Belgian chocolate ganache, handcrafted sugar florals, and heavy-duty tier structure."
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                Submitting this quotation updates the request to <strong>Quotation Sent</strong>. The customer will review the quote in their Customer Portal to accept or decline.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setQuoteModalCake(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSendingQuote || !quoteModalPrice || quoteModalPrice <= 0}
                  onClick={async () => {
                    setIsSendingQuote(true);
                    try {
                      await sendCustomCakeQuote(quoteModalCake.id, quoteModalPrice, quoteModalNotes);
                      setQuoteModalCake(null);
                    } finally {
                      setIsSendingQuote(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-[#762F3D] text-white font-bold hover:bg-[#5F2030] shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSendingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span>Send Quotation to Customer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: ZOOM REFERENCE IMAGE */}
      {/* ========================================================= */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-transparent">
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white font-bold flex items-center gap-1 hover:text-amber-200"
            >
              <X className="w-6 h-6" /> Close Preview
            </button>
            <img 
              src={zoomedImage} 
              alt="Custom Cake Reference Zoom" 
              className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain border border-white/20" 
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: ADD / RESTOCK INVENTORY */}
      {/* ========================================================= */}
      {inventoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-4 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#302725]">
                {editingInventory ? `Edit & Restock: ${editingInventory.name}` : 'Add Raw Material'}
              </h3>
              <button onClick={() => setInventoryModalOpen(false)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInventory} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Ingredient Name *</label>
                  <input
                    type="text"
                    required
                    value={inventoryFormData.name || ''}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, name: e.target.value })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Category</label>
                  <Dropdown
                    value={inventoryFormData.category || 'Baking Essentials'}
                    onChange={(c) => setInventoryFormData({ ...inventoryFormData, category: c })}
                    options={[
                      { value: 'Baking Essentials', label: 'Baking Essentials' },
                      { value: 'Flour & Grains', label: 'Flour & Grains' },
                      { value: 'Dairy & Fats', label: 'Dairy & Fats' },
                      { value: 'Sweeteners & Syrups', label: 'Sweeteners & Syrups' },
                      { value: 'Cocoa & Chocolates', label: 'Cocoa & Chocolates' },
                      { value: 'Flavoring & Extracts', label: 'Flavoring & Extracts' },
                      { value: 'Packaging', label: 'Packaging' }
                    ]}
                    size="md"
                    buttonClassName="w-full bg-[#FAF7F2] border-[#E8E0D9] text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Current Stock Level *</label>
                  <input
                    type="number"
                    required
                    value={inventoryFormData.currentStock ?? 50}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, currentStock: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="kg, liters, boxes"
                    value={inventoryFormData.unit || 'kg'}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, unit: e.target.value })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Min Threshold Alert</label>
                  <input
                    type="number"
                    value={inventoryFormData.minStock ?? 15}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, minStock: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Cost per Unit (PKR)</label>
                  <input
                    type="number"
                    value={inventoryFormData.purchaseCost ?? 850}
                    onChange={(e) => setInventoryFormData({ ...inventoryFormData, purchaseCost: Number(e.target.value) })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Supplier / Vendor</label>
                <input
                  type="text"
                  value={inventoryFormData.supplier || ''}
                  onChange={(e) => setInventoryFormData({ ...inventoryFormData, supplier: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setInventoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#762F3D] text-white font-bold hover:bg-[#5F2030]"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7B: ADMIN STOCK ADJUSTMENT & WASTAGE */}
      {/* ========================================================= */}
      {adminAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-4 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#302725]">Record Stock Adjustment</h3>
                <p className="text-xs text-[#80736F]">Atomic inventory stock modification with permanent audit log</p>
              </div>
              <button onClick={() => setAdminAdjustModalOpen(false)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminStockAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#302725] mb-1">Select Ingredient *</label>
                <select
                  value={adminAdjustIngredient?.id || ''}
                  onChange={(e) => {
                    const found = inventory.find(i => i.id === e.target.value);
                    setAdminAdjustIngredient(found || null);
                  }}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D] font-medium"
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} — Current: {item.currentStock} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Movement Type *</label>
                  <select
                    value={adminAdjustType}
                    onChange={(e) => setAdminAdjustType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D] font-medium"
                  >
                    <option value="Adjustment">Manual Adjustment</option>
                    <option value="Received">Purchase Received</option>
                    <option value="Wasted">Wastage / Spoiled</option>
                    <option value="Used">Production Consumption</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1">
                    Quantity ({adminAdjustIngredient?.unit || 'units'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 5"
                    value={adminAdjustQty}
                    onChange={(e) => setAdminAdjustQty(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Reason / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical inventory cycle count discrepancy"
                  value={adminAdjustReason}
                  onChange={(e) => setAdminAdjustReason(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Reference Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AUDIT-2026-11, PO-102"
                  value={adminAdjustRef}
                  onChange={(e) => setAdminAdjustRef(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              {adminAdjustIngredient && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-[#302725] space-y-1">
                  <div className="flex justify-between">
                    <span>Current In Stock:</span>
                    <strong>{adminAdjustIngredient.currentStock} {adminAdjustIngredient.unit}</strong>
                  </div>
                  {adminAdjustQty && !isNaN(Number(adminAdjustQty)) && (
                    <div className="flex justify-between border-t border-amber-200/40 pt-1">
                      <span>Projected Stock:</span>
                      <strong className={
                        adminAdjustType === 'Wasted' || adminAdjustType === 'Used'
                          ? 'text-rose-700'
                          : 'text-emerald-700'
                      }>
                        {adminAdjustType === 'Received' || adminAdjustType === 'Adjustment'
                          ? adminAdjustIngredient.currentStock + Number(adminAdjustQty)
                          : Math.max(0, adminAdjustIngredient.currentStock - Number(adminAdjustQty))} {adminAdjustIngredient.unit}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setAdminAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdminAdjusting}
                  className="px-5 py-2 rounded-xl bg-[#762F3D] text-white font-bold hover:bg-[#5F2030] disabled:opacity-50"
                >
                  {isAdminAdjusting ? 'Saving...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: ADD STAFF ACCOUNT */}
      {/* ========================================================= */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-4 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#302725]">Add New Staff Account</h3>
              <button onClick={() => setStaffModalOpen(false)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#302725] mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chef Hamza"
                  value={staffFormData.name}
                  onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. baker2@thecakehouse.pk"
                  value={staffFormData.email}
                  onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Role Permission *</label>
                  <Dropdown
                    value={staffFormData.role}
                    onChange={(r) => setStaffFormData({ ...staffFormData, role: r })}
                    options={[
                      { value: 'admin', label: 'Admin' },
                      { value: 'cashier', label: 'Cashier POS' },
                      { value: 'baker', label: 'Baker / Kitchen' },
                      { value: 'inventory_manager', label: 'Inventory Manager' },
                      { value: 'delivery', label: 'Delivery Driver' }
                    ]}
                    size="md"
                    buttonClassName="w-full bg-[#FAF7F2] border-[#E8E0D9] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={staffFormData.password}
                  onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#762F3D] text-white font-bold hover:bg-[#5F2030]"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 9: CUSTOMER PROFILE & ORDER HISTORY */}
      {/* ========================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E8E0D9] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#762F3D] text-white font-serif font-bold text-lg flex items-center justify-center">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#302725]">{selectedCustomer.name}</h3>
                  <p className="text-xs text-[#80736F]">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-serif font-bold text-sm text-[#302725]">Past Orders History</h4>
              {orders.filter(o => o.customerId === selectedCustomer.id || o.customerName === selectedCustomer.name).length === 0 ? (
                <p className="text-[#80736F] italic py-4 text-center">No orders recorded for this customer yet.</p>
              ) : (
                <div className="divide-y divide-[#E8E0D9] border border-[#E8E0D9] rounded-2xl p-4">
                  {orders.filter(o => o.customerId === selectedCustomer.id || o.customerName === selectedCustomer.name).map(ord => (
                    <div key={ord.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[#762F3D]">{ord.orderNumber} • {ord.createdAt}</div>
                        <div className="text-[11px] text-[#80736F]">{ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#302725]">Rs. {ord.total.toLocaleString()}</div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-[#762F3D] text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASSIGN BAKER TO ORDER */}
      {/* ========================================================= */}
      {assignBakerModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E8E0D9] pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#762F3D] uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-[#762F3D]" />
                  <span>Kitchen Assignment</span>
                </span>
                <h3 className="font-serif text-xl font-bold text-[#302725] mt-1">
                  Assign Order {assignBakerModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#80736F]">
                  Select the Baker responsible for baking and cake preparation
                </p>
              </div>
              <button 
                onClick={() => setAssignBakerModalOrder(null)} 
                className="text-[#80736F] hover:text-[#302725] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignBakerSubmit} className="space-y-4 text-xs">
              {/* Order summary pill */}
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-1">
                <div className="font-bold text-[#302725]">{assignBakerModalOrder.customerName} ({assignBakerModalOrder.customerPhone})</div>
                <div className="text-[11px] text-[#80736F] line-clamp-2">
                  Items: {assignBakerModalOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              </div>

              {/* Select Baker Dropdown */}
              <div>
                <label className="block font-semibold text-[#302725] mb-1.5">Choose Baker *</label>
                <select
                  value={selectedBakerId}
                  onChange={(e) => {
                    setSelectedBakerId(e.target.value);
                    const b = availableBakers.find(x => x.id === e.target.value);
                    if (b) setSelectedBakerName(b.name.trim());
                  }}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-semibold text-[#302725] focus:outline-none focus:border-[#762F3D] cursor-pointer"
                  required
                >
                  {availableBakers.length > 0 ? (
                    availableBakers.map(b => (
                      <option key={b.id} value={b.id}>{b.name.trim()} ({b.email})</option>
                    ))
                  ) : (
                    <>
                      <option value="u-4">Chef Tariq (baker@thecakehouse.pk)</option>
                      <option value="u-1793516046112">Hammad (hammad@thecakehouse.pk)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Priority & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1.5">Priority</label>
                  <select
                    value={bakerPriority}
                    onChange={(e) => setBakerPriority(e.target.value as any)}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-semibold text-[#302725] focus:outline-none focus:border-[#762F3D] cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1.5">Target Completion Time</label>
                  <input
                    type="text"
                    value={bakerDeadline}
                    onChange={(e) => setBakerDeadline(e.target.value)}
                    placeholder="e.g. 2026-11-07 18:00"
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              {/* Instructions / Notes */}
              <div>
                <label className="block font-semibold text-[#302725] mb-1.5">Kitchen Instructions / Special Notes</label>
                <textarea
                  rows={2}
                  value={bakerNotes}
                  onChange={(e) => setBakerNotes(e.target.value)}
                  placeholder="e.g., Double chocolate layer, delicate sugar flower garnish..."
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setAssignBakerModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigningBaker}
                  className="px-5 py-2.5 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAssigningBaker ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChefHat className="w-4 h-4" />}
                  <span>Assign to Kitchen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REASSIGN BAKER */}
      {/* ========================================================= */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E8E0D9] pb-4">
              <div>
                <span className="text-[11px] font-bold text-[#762F3D] uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-[#762F3D]" />
                  <span>Kitchen Reassignment</span>
                </span>
                <h3 className="font-serif text-xl font-bold text-[#302725] mt-1">
                  Reassign Order {reassignModalTask.orderNumber || reassignModalTask.id}
                </h3>
                <p className="text-xs text-[#80736F]">
                  Transfer responsibility to another active kitchen Baker
                </p>
              </div>
              <button 
                onClick={() => setReassignModalTask(null)} 
                className="text-[#80736F] hover:text-[#302725] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassignBakerSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-1">
                <div className="font-bold text-[#302725]">
                  {reassignModalTask.productName} ({reassignModalTask.quantity} units)
                </div>
                <div className="text-[11px] text-[#80736F]">
                  Current Baker: <strong className="text-[#762F3D]">{reassignModalTask.assignedBaker}</strong> • Status: <strong>{getProductionKanbanStatus(reassignModalTask)}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1.5">New Assigned Baker *</label>
                <select
                  value={reassignBakerId}
                  onChange={(e) => {
                    setReassignBakerId(e.target.value);
                    const b = availableBakers.find(x => x.id === e.target.value);
                    if (b) setReassignBakerName(b.name.trim());
                  }}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-semibold text-[#302725] focus:outline-none focus:border-[#762F3D] cursor-pointer"
                  required
                >
                  {availableBakers.map(b => (
                    <option key={b.id} value={b.id}>{b.name.trim()} ({b.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1.5">Required Completion Deadline</label>
                <input
                  type="text"
                  value={reassignDeadline}
                  onChange={(e) => setReassignDeadline(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm (e.g. 2026-11-10 16:00)"
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#302725] mb-1.5">Reassignment Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  placeholder="Reason for reassignment or special handover instructions..."
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setReassignModalTask(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigningBaker}
                  className="px-5 py-2.5 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isReassigningBaker ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Confirm Reassignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASSIGN DELIVERY COURIER */}
      {/* ========================================================= */}
      {assignDeliveryModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E8E0D9] pb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Courier Dispatch</span>
                </span>
                <h3 className="font-serif text-xl font-bold text-[#302725] mt-1">
                  Dispatch Order {assignDeliveryModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#80736F]">
                  Select available delivery personnel and confirm dispatch route
                </p>
              </div>
              <button 
                onClick={() => setAssignDeliveryModalOrder(null)} 
                className="text-[#80736F] hover:text-[#302725] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDeliverySubmit} className="space-y-4 text-xs">
              {/* Order & Address summary */}
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1">
                <div className="font-bold text-[#302725]">{assignDeliveryModalOrder.customerName} • {assignDeliveryModalOrder.customerPhone}</div>
                <div className="text-[11px] text-[#80736F] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#762F3D] shrink-0" />
                  <span>{assignDeliveryModalOrder.deliveryAddress || 'Lahore, Pakistan'}</span>
                </div>
                <div className="text-[11px] font-bold text-[#762F3D] pt-1 border-t border-blue-200 flex justify-between">
                  <span>Grand Total: Rs. {assignDeliveryModalOrder.total.toLocaleString()}</span>
                  <span>Payment: {assignDeliveryModalOrder.paymentStatus} ({assignDeliveryModalOrder.paymentMethod})</span>
                </div>
              </div>

              {/* Select Courier */}
              <div>
                <label className="block font-semibold text-[#302725] mb-1.5">Select Delivery Courier *</label>
                <select
                  value={selectedCourierId}
                  onChange={(e) => {
                    setSelectedCourierId(e.target.value);
                    const c = availableCouriers.find(x => x.id === e.target.value);
                    if (c) setSelectedCourierName(c.name.trim());
                  }}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-semibold text-[#302725] focus:outline-none focus:border-[#762F3D] cursor-pointer"
                  required
                >
                  {availableCouriers.length > 0 ? (
                    availableCouriers.map(c => (
                      <option key={c.id} value={c.id}>{c.name.trim()} ({c.email})</option>
                    ))
                  ) : (
                    <>
                      <option value="u-6">Bilal Raza (delivery@thecakehouse.pk)</option>
                      <option value="u-1794061022419">Umer Hasan (umer.hasan@thecakehouse.pk)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Priority & Scheduled Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#302725] mb-1.5">Dispatch Priority</label>
                  <select
                    value={deliveryPriority}
                    onChange={(e) => setDeliveryPriority(e.target.value as any)}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-semibold text-[#302725] focus:outline-none focus:border-[#762F3D] cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent / Express</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#302725] mb-1.5">Scheduled Delivery Slot</label>
                  <input
                    type="text"
                    value={deliveryScheduledAt}
                    onChange={(e) => setDeliveryScheduledAt(e.target.value)}
                    placeholder="e.g. 2026-11-07 19:30"
                    className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block font-semibold text-[#302725] mb-1.5">Delivery Notes & Gate Instructions</label>
                <textarea
                  rows={2}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g., Ring bell, call before arrival, handle cake with care..."
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setAssignDeliveryModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E0D9] text-[#80736F] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigningDelivery}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAssigningDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  <span>Dispatch Courier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GENERIC CONFIRMATION MODAL */}
      {/* ========================================================= */}
      <DeleteConfirmModal
        open={deleteConfirm.open}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
        onConfirm={() => {
          deleteConfirm.onConfirm();
          setDeleteConfirm({ ...deleteConfirm, open: false });
        }}
      />

      {/* ========================================================= */}
      {/* CUSTOMER CONTACT MODAL (CENTERED) */}
      {/* ========================================================= */}
      <CustomerContactModal
        isOpen={contactModalData.isOpen}
        customerName={contactModalData.customerName}
        customerPhone={contactModalData.customerPhone}
        onClose={() => setContactModalData(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};
