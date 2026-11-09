import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Dropdown } from '../components/Dropdown';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  InventoryItem,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  StockMovement,
  RestockRequest,
  InventoryDashboardStats
} from '../types';
import { PortalLayout } from '../components/PortalLayout';
import {
  LayoutDashboard,
  Boxes,
  Layers,
  ArrowLeftRight,
  AlertTriangle,
  Truck,
  FileText,
  BellRing,
  TrendingDown,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Wheat,
  DollarSign,
  Check,
  X,
  ChevronRight,
  Info,
  Calendar,
  MapPin,
  User,
  PackageCheck,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Send,
  Loader2
} from 'lucide-react';

export const InventoryManagerPage: React.FC = () => {
  const {
    currentUser,
    token,
    showToast,
    inventory,
    refetchInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    recordStockAdjustment,
    suppliers,
    fetchSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchaseOrders,
    fetchPurchaseOrders,
    createPurchaseOrder,
    receivePurchaseOrderStock,
    deletePurchaseOrder,
    stockMovements,
    fetchStockMovements,
    restockRequests,
    fetchRestockRequests,
    updateRestockRequestStatus
  } = useApp();

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'inventory' | 'levels' | 'movements' | 'alerts' | 'wastage' | 'suppliers' | 'orders' | 'requests' | 'usage' | 'reports'
  >('dashboard');

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FILTERS ---
  // Ingredients Tab Filters
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState('all');
  const [invStatusFilter, setInvStatusFilter] = useState('all');

  // Movements Tab Filters
  const [movTypeFilter, setMovTypeFilter] = useState('all');
  const [movSearchQuery, setMovSearchQuery] = useState('');

  // Alerts Tab Filters
  const [alertTypeFilter, setAlertTypeFilter] = useState<'all' | 'low' | 'out' | 'expiring' | 'expired'>('all');

  // Suppliers Tab Filters
  const [supSearchQuery, setSupSearchQuery] = useState('');

  // Purchase Orders Tab Filters
  const [poStatusFilter, setPoStatusFilter] = useState('all');
  const [poSearchQuery, setPoSearchQuery] = useState('');

  // Reports Tab Filters
  const [reportType, setReportType] = useState<'valuation' | 'lowStock' | 'expiry' | 'movements' | 'wastage'>('valuation');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('all');

  // --- MODALS STATE ---
  // 1. Add / Edit Ingredient Modal
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<InventoryItem | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    category: 'Dry Goods',
    unit: 'kg',
    currentStock: 0,
    minStock: 10,
    purchaseCost: 0,
    supplier: '',
    expiryDate: '',
    batchNumber: '',
    storageLocation: 'Pantry Shelf A',
    notes: ''
  });

  // 2. View Ingredient Drawer / Modal
  const [viewingIngredient, setViewingIngredient] = useState<InventoryItem | null>(null);

  // 3. Stock Adjustment Modal
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedIngredientForAdjustment, setSelectedIngredientForAdjustment] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'Received' | 'Used' | 'Wasted' | 'Adjustment'>('Used');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjustmentReference, setAdjustmentReference] = useState<string>('');

  // 4. Add / Edit Supplier Modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    suppliedCategories: 'Dry Goods, Baking Essentials',
    paymentTerms: 'Net 30',
    notes: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  // 5. Create Purchase Order Modal
  const [createPoModalOpen, setCreatePoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poLineItems, setPoLineItems] = useState<
    Array<{ ingredientId: string; ingredientName: string; quantity: number; unit: string; unitPrice: number }>
  >([]);

  // 6. Receive PO Stock Modal
  const [receivePoModalOpen, setReceivePoModalOpen] = useState(false);
  const [selectedPoForReceiving, setSelectedPoForReceiving] = useState<PurchaseOrder | null>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

  // 7. View PO Details Modal
  const [viewingPo, setViewingPo] = useState<PurchaseOrder | null>(null);

  // 8. Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'ingredient' | 'supplier' | 'po' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial Data Sync on Mount
  useEffect(() => {
    refetchInventory();
    fetchSuppliers();
    fetchPurchaseOrders();
    fetchStockMovements();
    fetchRestockRequests();
  }, [token]);

  // Seamlessly synchronize when inventory manager returns to an inactive browser tab or window
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refetchInventory();
        fetchSuppliers();
        fetchPurchaseOrders();
        fetchStockMovements();
        fetchRestockRequests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [token]);

  // Refresh All Data Helper
  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchInventory(),
        fetchSuppliers(),
        fetchPurchaseOrders(),
        fetchStockMovements(),
        fetchRestockRequests()
      ]);
    } catch (e) {
      console.warn('Failed to refresh inventory:', e);
    }
  };

  // --- STATS COMPUTATION ---
  const stats = useMemo(() => {
    let totalStockUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    const now = new Date();
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000);

    inventory.forEach(item => {
      const cur = Number(item.currentStock) || 0;
      const min = Number(item.minStock) || 10;
      const cost = Number(item.purchaseCost) || 0;

      totalStockUnits += cur;
      totalValuation += cur * cost;

      if (cur === 0) outOfStockCount++;
      else if (cur <= min || item.status === 'Low Stock') lowStockCount++;

      if (item.expiryDate) {
        const exp = new Date(item.expiryDate);
        if (exp < now) expiredCount++;
        else if (exp <= twoWeeksLater) expiringCount++;
      }
    });

    const pendingRequestsCount = restockRequests.filter(r => r.status === 'Pending' || r.status === 'Approved').length;
    const pendingPoCount = purchaseOrders.filter(p => p.status === 'Pending' || p.status === 'Ordered').length;

    return {
      totalItems: inventory.length,
      totalStockUnits,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      expiringCount,
      expiredCount,
      pendingRequestsCount,
      pendingPoCount
    };
  }, [inventory, restockRequests, purchaseOrders]);

  // Sidebar navigation structure strictly following Section 5 specifications
  const sidebarSections = useMemo(() => [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Inventory Management',
      items: [
        { id: 'inventory', label: 'Ingredients', icon: Boxes, badge: inventory.length },
        { id: 'levels', label: 'Stock Levels', icon: Layers },
        { id: 'movements', label: 'Stock Movements', icon: ArrowLeftRight, badge: stockMovements.length },
        { id: 'alerts', label: 'Low Stock Alerts', icon: AlertTriangle, badge: stats.lowStockCount + stats.expiringCount, badgeColor: 'bg-red-500' },
        { id: 'wastage', label: 'Wastage Records', icon: TrendingDown }
      ]
    },
    {
      title: 'Purchasing',
      items: [
        { id: 'suppliers', label: 'Suppliers', icon: Truck, badge: suppliers.length },
        { id: 'orders', label: 'Purchase Records', icon: FileText, badge: stats.pendingPoCount },
        { id: 'requests', label: 'Restock Requests', icon: BellRing, badge: stats.pendingRequestsCount, badgeColor: 'bg-amber-500' }
      ]
    },
    {
      title: 'Analytics',
      items: [
        { id: 'reports', label: 'Reports', icon: BarChart3 }
      ]
    }
  ], [inventory.length, stockMovements.length, stats, suppliers.length]);

  const breadcrumbs = useMemo(() => {
    const map: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      inventory: 'Ingredients Master Directory',
      levels: 'Stock Levels & Monitoring',
      movements: 'Stock Movements Ledger',
      alerts: 'Low Stock & Expiry Alerts',
      wastage: 'Production Usage & Wastage',
      usage: 'Production Usage & Wastage',
      suppliers: 'Suppliers Directory',
      orders: 'Purchase Orders & Records',
      requests: 'Kitchen Restock Requests',
      reports: 'Inventory Analytics & Reports'
    };
    return [
      { label: 'Inventory' },
      { label: map[activeTab] || 'Overview' }
    ];
  }, [activeTab]);

  const currentTitle = useMemo(() => {
    const map: Record<string, string> = {
      dashboard: 'Inventory Dashboard',
      inventory: 'Ingredients Directory',
      levels: 'Stock Levels & Monitoring',
      movements: 'Stock Movements',
      alerts: 'Low Stock & Expiry Alerts',
      wastage: 'Usage & Wastage Records',
      usage: 'Usage & Wastage Records',
      suppliers: 'Approved Suppliers',
      orders: 'Purchase Records',
      requests: 'Restock Requests',
      reports: 'Inventory Reports'
    };
    return map[activeTab] || 'Inventory Portal';
  }, [activeTab]);

  // Unique Categories
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [inventory]);

  // --- FILTERED DATASETS ---
  // Filtered Ingredients
  const filteredIngredients = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(invSearchQuery.toLowerCase())) ||
        (item.batchNumber && item.batchNumber.toLowerCase().includes(invSearchQuery.toLowerCase())) ||
        (item.storageLocation && item.storageLocation.toLowerCase().includes(invSearchQuery.toLowerCase()));

      const matchesCategory = invCategoryFilter === 'all' || item.category === invCategoryFilter;

      let matchesStatus = true;
      if (invStatusFilter === 'In Stock') matchesStatus = item.currentStock > item.minStock;
      else if (invStatusFilter === 'Low Stock') matchesStatus = item.currentStock <= item.minStock && item.currentStock > 0;
      else if (invStatusFilter === 'Out of Stock') matchesStatus = item.currentStock === 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, invSearchQuery, invCategoryFilter, invStatusFilter]);

  // Filtered Stock Movements
  const filteredMovements = useMemo(() => {
    return stockMovements.filter(m => {
      const matchesType = movTypeFilter === 'all' || m.type === movTypeFilter;
      const matchesSearch =
        m.ingredientName.toLowerCase().includes(movSearchQuery.toLowerCase()) ||
        (m.reason && m.reason.toLowerCase().includes(movSearchQuery.toLowerCase())) ||
        (m.performedBy && m.performedBy.toLowerCase().includes(movSearchQuery.toLowerCase())) ||
        (m.referenceNumber && m.referenceNumber.toLowerCase().includes(movSearchQuery.toLowerCase()));

      return matchesType && matchesSearch;
    });
  }, [stockMovements, movTypeFilter, movSearchQuery]);

  // Filtered Alerts
  const alertIngredients = useMemo(() => {
    const now = new Date();
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000);

    return inventory.filter(item => {
      const cur = Number(item.currentStock) || 0;
      const min = Number(item.minStock) || 10;
      const isOut = cur === 0;
      const isLow = cur <= min && cur > 0;

      let isExpired = false;
      let isExpiring = false;
      if (item.expiryDate) {
        const exp = new Date(item.expiryDate);
        if (exp < now) isExpired = true;
        else if (exp <= twoWeeksLater) isExpiring = true;
      }

      if (alertTypeFilter === 'out') return isOut;
      if (alertTypeFilter === 'low') return isLow;
      if (alertTypeFilter === 'expired') return isExpired;
      if (alertTypeFilter === 'expiring') return isExpiring;

      // 'all'
      return isOut || isLow || isExpired || isExpiring;
    });
  }, [inventory, alertTypeFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      return (
        s.name.toLowerCase().includes(supSearchQuery.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(supSearchQuery.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(supSearchQuery.toLowerCase())) ||
        (s.phone && s.phone.toLowerCase().includes(supSearchQuery.toLowerCase()))
      );
    });
  }, [suppliers, supSearchQuery]);

  // Filtered Purchase Orders
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesStatus = poStatusFilter === 'all' || po.status === poStatusFilter;
      const matchesSearch =
        po.poNumber.toLowerCase().includes(poSearchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(poSearchQuery.toLowerCase()) ||
        (po.notes && po.notes.toLowerCase().includes(poSearchQuery.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, poStatusFilter, poSearchQuery]);

  // --- ACTIONS & HANDLERS ---
  // Save Ingredient (Create or Edit)
  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientForm.name.trim()) {
      showToast('Please enter an ingredient name', 'error');
      return;
    }
    if (ingredientForm.currentStock < 0 || ingredientForm.minStock < 0) {
      showToast('Stock quantities cannot be negative', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const cur = Number(ingredientForm.currentStock);
      const min = Number(ingredientForm.minStock);
      let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
      if (cur === 0) status = 'Out of Stock';
      else if (cur <= min) status = 'Low Stock';

      if (editingIngredient) {
        await updateInventoryItem(editingIngredient.id, {
          name: ingredientForm.name.trim(),
          category: ingredientForm.category,
          unit: ingredientForm.unit,
          currentStock: cur,
          minStock: min,
          purchaseCost: Number(ingredientForm.purchaseCost) || 0,
          supplier: ingredientForm.supplier.trim() || 'General Supplier',
          status,
          expiryDate: ingredientForm.expiryDate || undefined,
          batchNumber: ingredientForm.batchNumber || undefined,
          storageLocation: ingredientForm.storageLocation || undefined,
          notes: ingredientForm.notes || undefined
        });
        showToast(`Ingredient "${ingredientForm.name}" updated successfully`);
      } else {
        await addInventoryItem({
          name: ingredientForm.name.trim(),
          category: ingredientForm.category,
          unit: ingredientForm.unit,
          currentStock: cur,
          minStock: min,
          purchaseCost: Number(ingredientForm.purchaseCost) || 0,
          supplier: ingredientForm.supplier.trim() || 'General Supplier',
          status,
          expiryDate: ingredientForm.expiryDate || undefined,
          batchNumber: ingredientForm.batchNumber || undefined,
          storageLocation: ingredientForm.storageLocation || undefined,
          notes: ingredientForm.notes || undefined,
          lastUpdated: new Date().toISOString().split('T')[0]
        });
      }
      setIngredientModalOpen(false);
      setEditingIngredient(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save ingredient', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Ingredient Modal
  const openEditIngredient = (item: InventoryItem) => {
    setEditingIngredient(item);
    setIngredientForm({
      name: item.name,
      category: item.category || 'Dry Goods',
      unit: item.unit || 'kg',
      currentStock: item.currentStock,
      minStock: item.minStock,
      purchaseCost: item.purchaseCost,
      supplier: item.supplier || '',
      expiryDate: item.expiryDate || '',
      batchNumber: item.batchNumber || '',
      storageLocation: item.storageLocation || 'Pantry Shelf A',
      notes: item.notes || ''
    });
    setIngredientModalOpen(true);
  };

  // Open Add Ingredient Modal
  const openAddIngredient = () => {
    setEditingIngredient(null);
    setIngredientForm({
      name: '',
      category: 'Dry Goods',
      unit: 'kg',
      currentStock: 10,
      minStock: 5,
      purchaseCost: 200,
      supplier: suppliers.length > 0 ? suppliers[0].name : 'Local Supplier',
      expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
      storageLocation: 'Dry Storage Shelf A',
      notes: ''
    });
    setIngredientModalOpen(true);
  };

  // Submit Stock Adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientForAdjustment) return;
    const qty = Number(adjustmentQuantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid positive quantity', 'error');
      return;
    }
    if ((adjustmentType === 'Used' || adjustmentType === 'Wasted') && qty > selectedIngredientForAdjustment.currentStock) {
      showToast(`Cannot record ${qty} ${selectedIngredientForAdjustment.unit}. Available: ${selectedIngredientForAdjustment.currentStock} ${selectedIngredientForAdjustment.unit}`, 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await recordStockAdjustment({
        ingredientId: selectedIngredientForAdjustment.id,
        type: adjustmentType,
        quantity: qty,
        reason: adjustmentReason.trim() || `Manual ${adjustmentType} adjustment`,
        referenceNumber: adjustmentReference.trim() || undefined
      });
      setAdjustmentModalOpen(false);
      setSelectedIngredientForAdjustment(null);
      setAdjustmentQuantity('');
      setAdjustmentReason('');
      setAdjustmentReference('');
    } catch (e) {
      // toast handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Supplier (Create or Edit)
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      showToast('Please provide a supplier name', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const catList = supplierForm.suppliedCategories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          name: supplierForm.name.trim(),
          contactPerson: supplierForm.contactPerson.trim(),
          phone: supplierForm.phone.trim(),
          email: supplierForm.email.trim(),
          address: supplierForm.address.trim(),
          suppliedCategories: catList,
          paymentTerms: supplierForm.paymentTerms,
          notes: supplierForm.notes.trim(),
          status: supplierForm.status
        });
      } else {
        await addSupplier({
          name: supplierForm.name.trim(),
          contactPerson: supplierForm.contactPerson.trim(),
          phone: supplierForm.phone.trim(),
          email: supplierForm.email.trim(),
          address: supplierForm.address.trim(),
          suppliedCategories: catList,
          paymentTerms: supplierForm.paymentTerms,
          notes: supplierForm.notes.trim(),
          status: supplierForm.status
        });
      }
      setSupplierModalOpen(false);
      setEditingSupplier(null);
    } catch (err: any) {
      showToast(err.message || 'Error saving supplier', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Supplier Modal
  const openEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      suppliedCategories: (sup.suppliedCategories || []).join(', '),
      paymentTerms: sup.paymentTerms || 'Net 30',
      notes: sup.notes || '',
      status: sup.status || 'Active'
    });
    setSupplierModalOpen(true);
  };

  // Open Add Supplier Modal
  const openAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      suppliedCategories: 'Dry Goods, Dairy',
      paymentTerms: 'Net 30',
      notes: '',
      status: 'Active'
    });
    setSupplierModalOpen(true);
  };

  // Create Purchase Order Lines Helper
  const openCreatePO = (preselectedIngredient?: InventoryItem, prefilledQuantity?: number) => {
    if (suppliers.length === 0) {
      showToast('Please add at least one supplier before creating purchase orders', 'info');
      setActiveTab('suppliers');
      return;
    }

    const defaultSupplier = preselectedIngredient
      ? suppliers.find(s => s.name === preselectedIngredient.supplier) || suppliers[0]
      : suppliers[0];

    setPoSupplierId(defaultSupplier.id);
    setPoExpectedDate(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
    setPoNotes('');

    if (preselectedIngredient) {
      const qty = prefilledQuantity || Math.max(preselectedIngredient.minStock * 2 - preselectedIngredient.currentStock, 10);
      setPoLineItems([
        {
          ingredientId: preselectedIngredient.id,
          ingredientName: preselectedIngredient.name,
          quantity: qty,
          unit: preselectedIngredient.unit,
          unitPrice: preselectedIngredient.purchaseCost
        }
      ]);
    } else {
      const firstItem = inventory[0];
      setPoLineItems(
        firstItem
          ? [
              {
                ingredientId: firstItem.id,
                ingredientName: firstItem.name,
                quantity: 20,
                unit: firstItem.unit,
                unitPrice: firstItem.purchaseCost
              }
            ]
          : []
      );
    }
    setCreatePoModalOpen(true);
  };

  // Save Purchase Order
  const handleSavePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === poSupplierId) || suppliers[0];
    if (!sup) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (poLineItems.length === 0) {
      showToast('Add at least one ingredient item to the purchase order', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      let calculatedTotal = 0;
      const items: PurchaseOrderItem[] = poLineItems.map(it => {
        const totalCost = it.quantity * it.unitPrice;
        calculatedTotal += totalCost;
        return {
          ingredientId: it.ingredientId,
          ingredientName: it.ingredientName,
          quantity: it.quantity,
          receivedQuantity: 0,
          unit: it.unit,
          unitPrice: it.unitPrice,
          totalCost
        };
      });

      await createPurchaseOrder({
        supplierId: sup.id,
        supplierName: sup.name,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: poExpectedDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        items,
        totalAmount: calculatedTotal,
        status: 'Ordered',
        paymentStatus: 'Unpaid',
        notes: poNotes.trim(),
        createdBy: currentUser.name || 'Salman Inventory'
      });
      setCreatePoModalOpen(false);
      setActiveTab('orders');
    } catch (err: any) {
      // toast handled
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Receive Stock Modal
  const openReceiveStock = (po: PurchaseOrder) => {
    setSelectedPoForReceiving(po);
    const initialRec: Record<string, number> = {};
    po.items.forEach(it => {
      const remaining = Math.max(it.quantity - (it.receivedQuantity || 0), 0);
      initialRec[it.ingredientId] = remaining;
    });
    setReceivedQuantities(initialRec);
    setReceivePoModalOpen(true);
  };

  // Submit Receive Stock
  const handleReceiveStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForReceiving) return;

    const payload = Object.entries(receivedQuantities).map(([ingredientId, qty]) => ({
      ingredientId,
      quantityReceived: Number(qty) || 0
    }));

    const totalToReceive = payload.reduce((acc, curr) => acc + curr.quantityReceived, 0);
    if (totalToReceive <= 0) {
      showToast('Enter at least one received quantity greater than 0', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await receivePurchaseOrderStock(selectedPoForReceiving.id, payload);
      setReceivePoModalOpen(false);
      setSelectedPoForReceiving(null);
    } catch (e) {
      // toast handled
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Item Confirmation
  const confirmDeleteAction = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.type === 'ingredient') {
        await deleteInventoryItem(deleteTarget.id);
      } else if (deleteTarget.type === 'supplier') {
        await deleteSupplier(deleteTarget.id);
      } else if (deleteTarget.type === 'po') {
        await deletePurchaseOrder(deleteTarget.id);
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (e: any) {
      showToast(e.message || 'Deletion failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV Function
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportType === 'valuation') {
      csvContent += 'ID,Name,Category,Unit,Current Stock,Min Stock,Unit Cost (PKR),Total Value (PKR),Status,Supplier\n';
      inventory.forEach(i => {
        csvContent += `"${i.id}","${i.name}","${i.category}","${i.unit}",${i.currentStock},${i.minStock},${i.purchaseCost},${i.currentStock * i.purchaseCost},"${i.status}","${i.supplier || ''}"\n`;
      });
    } else if (reportType === 'lowStock') {
      csvContent += 'ID,Name,Category,Unit,Current Stock,Min Safety Stock,Deficit,Supplier\n';
      inventory
        .filter(i => i.currentStock <= i.minStock)
        .forEach(i => {
          csvContent += `"${i.id}","${i.name}","${i.category}","${i.unit}",${i.currentStock},${i.minStock},${i.minStock - i.currentStock},"${i.supplier || ''}"\n`;
        });
    } else if (reportType === 'movements') {
      csvContent += 'Date,Type,Ingredient,Quantity,Unit,Previous Stock,New Stock,Reason,Reference,Performed By\n';
      stockMovements.forEach(m => {
        csvContent += `"${m.createdAt}","${m.type}","${m.ingredientName}",${m.quantity},"${m.unit}",${m.previousStock},${m.newStock},"${m.reason || ''}","${m.referenceNumber || ''}","${m.performedBy}"\n`;
      });
    } else {
      csvContent += 'ID,Name,Category,Stock,Cost\n';
      inventory.forEach(i => {
        csvContent += `"${i.id}","${i.name}","${i.category}",${i.currentStock},${i.purchaseCost}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `the_cake_house_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report CSV downloaded successfully');
  };

  return (
    <PortalLayout
      portalName="Inventory Portal"
      portalSubtitle="Commissary & Pantry Management"
      portalBadge="Live Stock Audit"
      sidebarSections={sidebarSections}
      activeTab={activeTab === 'usage' ? 'wastage' : activeTab}
      onTabChange={(tab: string) => setActiveTab(tab as any)}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => openCreatePO()}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E0D9] text-[#762F3D] text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#762F3D]" />
            <span className="hidden sm:inline">New Purchase Order</span>
            <span className="sm:hidden">New PO</span>
          </button>
          <button
            onClick={openAddIngredient}
            className="px-3.5 py-2 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>Add Ingredient</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* ============================================================== */}
        {/* TAB 1: INVENTORY DASHBOARD                                     */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* 8 Dynamic KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">

            {/* Total Ingredients */}
            <div
              onClick={() => setActiveTab('inventory')}
              className="bg-gradient-to-br from-white to-[#FAF4F5] p-5 rounded-3xl border border-[#E8E0D9] shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center text-[#80736F] mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#80736F] uppercase">Total Ingredients</span>
                <div className="w-8 h-8 rounded-xl bg-[#762F3D]/10 text-[#762F3D] flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-[#762F3D]">{stats.totalItems}</div>
              <p className="text-[11px] text-[#80736F] mt-1.5 flex items-center gap-1">
                <span>Across {uniqueCategories.length} categories</span>
              </p>
            </div>

            {/* Total Stock Units */}
            <div
              onClick={() => setActiveTab('inventory')}
              className="bg-gradient-to-br from-white to-sky-50/40 p-5 rounded-3xl border border-[#E8E0D9] shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center text-[#80736F] mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#80736F] uppercase">Available Stock</span>
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-[#302725]">{stats.totalStockUnits.toLocaleString()}</div>
              <p className="text-[11px] text-[#80736F] mt-1.5">Total pantry volume on hand</p>
            </div>

            {/* Total Inventory Valuation */}
            <div
              onClick={() => {
                setReportType('valuation');
                setActiveTab('reports');
              }}
              className="bg-gradient-to-br from-white to-amber-50/40 p-5 rounded-3xl border border-[#E8E0D9] shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center text-[#80736F] mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#80736F] uppercase">Pantry Valuation</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-serif font-bold text-amber-800">
                Rs. {stats.totalValuation.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#80736F] mt-1.5">Current acquisition value</p>
            </div>

            {/* Low Stock Items */}
            <div
              onClick={() => {
                setAlertTypeFilter('low');
                setActiveTab('alerts');
              }}
              className="bg-gradient-to-br from-white to-rose-50/40 p-5 rounded-3xl border border-[#E8E0D9] shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center text-[#80736F] mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#80736F] uppercase">Low Stock Alerts</span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-rose-700">{stats.lowStockCount}</div>
              <p className="text-[11px] text-[#80736F] mt-1.5">Below safety buffer</p>
            </div>

            {/* Out of Stock */}
            <div
              onClick={() => {
                setAlertTypeFilter('out');
                setActiveTab('alerts');
              }}
              className="bg-gradient-to-br from-white to-red-50/40 p-5 rounded-3xl border border-[#E8E0D9] shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center text-[#80736F] mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#80736F] uppercase">Out of Stock</span>
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-red-800">{stats.outOfStockCount}</div>
              <p className="text-[11px] text-[#80736F] mt-1.5">Requires immediate PO</p>
            </div>

            {/* Expiring Soon */}
            <div
              onClick={() => {
                setAlertTypeFilter('expiring');
                setActiveTab('alerts');
              }}
              className="bg-gradient-to-br from-white to-orange-50/40 p-5 rounded-3xl border border-[#E8E0D9] shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center text-[#80736F] mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#80736F] uppercase">Expiring (14d)</span>
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-orange-700">{stats.expiringCount}</div>
              <p className="text-[11px] text-[#80736F] mt-1.5">Batch rotation needed</p>
            </div>

            {/* Pending Purchase Orders */}
            <div
              onClick={() => setActiveTab('orders')}
              className="bg-gradient-to-br from-white to-purple-50/40 p-5 rounded-3xl border border-[#E8E0D9] shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center text-[#80736F] mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#80736F] uppercase">Active POs</span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-purple-800">{stats.pendingPoCount}</div>
              <p className="text-[11px] text-[#80736F] mt-1.5">Awaiting supplier delivery</p>
            </div>

            {/* Pending Baker Requests */}
            <div
              onClick={() => setActiveTab('requests')}
              className="bg-gradient-to-br from-white to-amber-50/40 p-5 rounded-3xl border border-[#E8E0D9] shadow-xs hover:-translate-y-0.5 transition duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center text-[#80736F] mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-[#80736F] uppercase">Baker Restock Alerts</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-serif font-bold text-amber-800">{stats.pendingRequestsCount}</div>
              <p className="text-[11px] text-[#80736F] mt-1.5">Submitted from kitchen</p>
            </div>

          </div>

          {/* Quick Shortcuts & Alert Summary Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT (8 cols): Critical Reorder Queue & Restock Requests Preview */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#E8E0D9] shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Kitchen Restock Dispatch Queue</h3>
                    <span className="bg-[#FAF7F2] text-[#762F3D] border border-[#E8E0D9] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Live Rota
                    </span>
                  </div>
                  <p className="text-xs text-[#80736F] mt-0.5">Ingredients requested by bakers or currently beneath safety margins</p>
                </div>

                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs font-bold text-[#762F3D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Requests</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Urgent Requests / Low Stock items */}
              <div className="space-y-3">
                {restockRequests.slice(0, 3).map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] border border-[#E8E0D9] transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#302725] text-sm">{req.ingredientName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.urgency === 'Critical'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : req.urgency === 'High'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {req.urgency} Urgency
                        </span>
                        <span className="text-[11px] text-[#80736F]">Qty: {req.quantityNeeded}</span>
                      </div>
                      <p className="text-xs text-[#80736F] mt-1">
                        <strong>Requested by:</strong> {req.requestedBy} • {req.createdAt}
                      </p>
                      {req.notes && (
                        <p className="text-[11px] text-[#302725] italic mt-0.5">"{req.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          const matched = inventory.find(i => i.name.toLowerCase() === req.ingredientName.toLowerCase());
                          openCreatePO(matched);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Create PO</span>
                      </button>
                      <button
                        onClick={() => updateRestockRequestStatus(req.id, 'Fulfilled')}
                        className="px-3 py-1.5 rounded-xl border border-[#E8E0D9] bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        Fulfill
                      </button>
                    </div>
                  </div>
                ))}

                {restockRequests.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#80736F]">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                    All kitchen ingredient requests have been fulfilled!
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT (4 cols): Quick Operations & Recent Stock Movements */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E8E0D9] shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-4">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Recent Stock Activity</h3>
                    <p className="text-xs text-[#80736F]">Live audit trail of inventory movements</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('movements')}
                    className="text-xs font-bold text-[#762F3D] hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {stockMovements.slice(0, 4).map(m => (
                    <div key={m.id} className="p-3 rounded-2xl bg-[#FAF7F2]/60 border border-[#E8E0D9] text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#302725] truncate">{m.ingredientName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            m.type === 'Received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type === 'Used'
                              ? 'bg-blue-100 text-blue-800'
                              : m.type === 'Wasted'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.type === 'Received' ? `+${m.quantity} ${m.unit}` : `-${m.quantity} ${m.unit}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#80736F]">
                        <span>{m.reason || 'Inventory movement'}</span>
                        <span>{m.createdAt.split(' ')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-[#E8E0D9] space-y-2">
                <button
                  onClick={() => {
                    setSelectedIngredientForAdjustment(inventory[0] || null);
                    setAdjustmentType('Used');
                    setAdjustmentQuantity('');
                    setAdjustmentReason('');
                    setAdjustmentModalOpen(true);
                  }}
                  className="w-full bg-[#FAF7F2] hover:bg-[#E8E0D9]/50 text-[#302725] py-2.5 rounded-xl font-bold text-xs transition border border-[#E8E0D9] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <TrendingDown className="w-3.5 h-3.5 text-[#762F3D]" />
                  <span>Record Usage / Wastage</span>
                </button>

                <button
                  onClick={() => openCreatePO()}
                  className="w-full bg-[#762F3D] hover:bg-[#5F2030] text-white py-2.5 rounded-xl font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C5A46D]" />
                  <span>Draft Restock PO</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TAB 2: INGREDIENTS & STOCK MANAGEMENT                       */}
      {/* ============================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">

          {/* Search, Category, Status Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Ingredients Master Directory</h3>
                <p className="text-xs text-[#80736F]">Track raw materials, stock levels, safety thresholds, and unit costs</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#80736F] bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8E0D9]">
                  Showing <strong>{filteredIngredients.length}</strong> of <strong>{inventory.length}</strong> items
                </span>
                <button
                  onClick={openAddIngredient}
                  className="px-4 py-2 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#C5A46D]" />
                  <span>Add Ingredient</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#E8E0D9]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by ingredient name, supplier, batch..."
                  value={invSearchQuery}
                  onChange={e => setInvSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <Dropdown
                  value={invCategoryFilter}
                  onChange={setInvCategoryFilter}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
                  ]}
                  size="md"
                  className="w-full"
                  buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                />
              </div>

              <div>
                <Dropdown
                  value={invStatusFilter}
                  onChange={setInvStatusFilter}
                  options={[
                    { value: 'all', label: 'All Stock Statuses' },
                    { value: 'In Stock', label: 'In Stock' },
                    { value: 'Low Stock', label: 'Low Stock' },
                    { value: 'Out of Stock', label: 'Out of Stock' }
                  ]}
                  size="md"
                  className="w-full"
                  buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                />
              </div>
            </div>
          </div>

          {/* SaaS Data Table */}
          <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Ingredient Details</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Current Stock</th>
                    <th className="py-3.5 px-4 font-semibold">Safety Min</th>
                    <th className="py-3.5 px-4 font-semibold">Cost (PKR)</th>
                    <th className="py-3.5 px-4 font-semibold">Total Valuation</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#80736F] text-xs">
                        No ingredients found matching the specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map(item => {
                      const isLow = item.currentStock <= item.minStock && item.currentStock > 0;
                      const isOut = item.currentStock === 0;

                      return (
                        <tr key={item.id} className="hover:bg-[#FAF7F2]/50 transition">
                          {/* Ingredient & Batch */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#302725] text-sm block">{item.name}</span>
                            <span className="text-[10px] text-[#80736F] flex items-center gap-1.5 mt-0.5">
                              <span>Batch: {item.batchNumber || 'BAT-2026'}</span>
                              <span>•</span>
                              <span>{item.storageLocation || 'Pantry'}</span>
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF7F2] border border-[#E8E0D9] text-[#80736F]">
                              {item.category}
                            </span>
                          </td>

                          {/* Stock Level with visual bar */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className={`font-bold text-sm ${isOut ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {item.currentStock} {item.unit}
                              </span>
                              <div className="w-20 bg-[#E8E0D9] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-600'}`}
                                  style={{
                                    width: `${Math.min(Math.max((item.currentStock / (item.minStock * 2 || 1)) * 100, 5), 100)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Min Stock */}
                          <td className="py-3.5 px-4 text-[#80736F]">
                            {item.minStock} {item.unit}
                          </td>

                          {/* Unit Cost */}
                          <td className="py-3.5 px-4 font-medium text-[#302725]">
                            Rs. {item.purchaseCost.toLocaleString()}
                          </td>

                          {/* Valuation */}
                          <td className="py-3.5 px-4 font-bold text-[#762F3D]">
                            Rs. {(item.currentStock * item.purchaseCost).toLocaleString()}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isOut
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedIngredientForAdjustment(item);
                                  setAdjustmentType('Adjustment');
                                  setAdjustmentQuantity(String(item.currentStock));
                                  setAdjustmentReason('Physical count reconciliation');
                                  setAdjustmentModalOpen(true);
                                }}
                                title="Adjust Stock Quantity"
                                className="p-1.5 rounded-lg border border-[#E8E0D9] hover:bg-[#762F3D] hover:text-white text-[#762F3D] transition cursor-pointer"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setViewingIngredient(item)}
                                title="View Details"
                                className="p-1.5 rounded-lg border border-[#E8E0D9] hover:bg-[#FAF7F2] text-[#80736F] transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => openEditIngredient(item)}
                                title="Edit Ingredient"
                                className="p-1.5 rounded-lg border border-[#E8E0D9] hover:bg-[#FAF7F2] text-[#80736F] transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setDeleteTarget({ id: item.id, name: item.name, type: 'ingredient' });
                                  setDeleteModalOpen(true);
                                }}
                                title="Delete Ingredient"
                                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-600 hover:text-white text-red-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      {/* STOCK LEVELS & THRESHOLDS MONITORING (Section 5)              */}
      {/* ============================================================== */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#80736F] tracking-wider">Total Tracked Items</span>
              <div className="font-serif text-2xl font-bold text-[#302725] mt-1">{inventory.length}</div>
              <p className="text-[11px] text-[#80736F] mt-0.5">Across all commissary categories</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Optimal Stock</span>
              <div className="font-serif text-2xl font-bold text-emerald-700 mt-1">
                {inventory.filter(i => (Number(i.currentStock) || 0) > (Number(i.minStock) || 10)).length}
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">Above safety thresholds</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-2xs bg-amber-50/20">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Low Safety Margin</span>
              <div className="font-serif text-2xl font-bold text-amber-700 mt-1">{stats.lowStockCount}</div>
              <p className="text-[11px] text-amber-700 mt-0.5">Requires replenishment soon</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-red-200 shadow-2xs bg-red-50/20">
              <span className="text-[10px] uppercase font-bold text-red-800 tracking-wider">Stockout / Depleted</span>
              <div className="font-serif text-2xl font-bold text-red-700 mt-1">{stats.outOfStockCount}</div>
              <p className="text-[11px] text-red-700 mt-0.5">Immediate purchase required</p>
            </div>
          </div>

          {/* Detailed Stock Levels Table */}
          <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E8E0D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Stock Levels & Health Monitoring</h3>
                <p className="text-xs text-[#80736F]">Real-time stock vs safety buffer benchmarks and replenishment suggestions</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedIngredientForAdjustment(inventory[0] || null);
                    setAdjustmentType('Adjustment');
                    setAdjustmentQuantity('');
                    setAdjustmentReason('Safety stock audit reconciliation');
                    setAdjustmentModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E0D9] text-[#302725] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#762F3D]" />
                  <span>Quick Stock Audit</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Ingredient & Category</th>
                    <th className="py-3.5 px-4 font-semibold">Current Stock</th>
                    <th className="py-3.5 px-4 font-semibold">Safety Buffer (Min)</th>
                    <th className="py-3.5 px-4 font-semibold">Stock Health / Capacity</th>
                    <th className="py-3.5 px-4 font-semibold">Replenishment Need</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {inventory.map(item => {
                    const cur = Number(item.currentStock) || 0;
                    const min = Number(item.minStock) || 10;
                    const ratio = min > 0 ? (cur / min) * 100 : 100;
                    const percentBar = Math.min(Math.round(ratio), 100);
                    const isOut = cur === 0;
                    const isLow = !isOut && cur <= min;
                    const reorderQty = Math.max(0, (min * 2) - cur);

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF7F2]/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#302725]">{item.name}</div>
                          <div className="text-[10px] text-[#80736F] flex items-center gap-1.5">
                            <span>{item.category}</span>
                            {item.storageLocation && (
                              <>
                                <span>•</span>
                                <span>{item.storageLocation}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-serif font-bold text-sm text-[#302725]">
                            {cur} <span className="text-[11px] font-sans font-normal text-[#80736F]">{item.unit}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#80736F]">
                          {min} {item.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span className={isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}>
                                {isOut ? 'Depleted (0%)' : isLow ? `Low (${Math.round(ratio)}%)` : `Healthy (${Math.round(ratio)}%)`}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-[#E8E0D9] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.max(percentBar, isOut ? 0 : 5)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {reorderQty > 0 ? (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block">
                              Order +{reorderQty} {item.unit}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                              Buffer Sufficient
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedIngredientForAdjustment(item);
                                setAdjustmentType('Adjustment');
                                setAdjustmentQuantity('');
                                setAdjustmentReason('');
                                setAdjustmentReference('');
                                setAdjustmentModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#E8E0D9] text-[#762F3D] font-bold text-[11px] border border-[#E8E0D9] transition cursor-pointer"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => openCreatePO(item)}
                              className="px-2.5 py-1 rounded-lg bg-[#762F3D] hover:bg-[#5F2030] text-white font-bold text-[11px] transition cursor-pointer"
                            >
                              PO
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TAB 3: STOCK MOVEMENTS & AUDIT LOG                          */}
      {/* ============================================================== */}
      {activeTab === 'movements' && (
        <div className="space-y-6">

          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Stock Movement & Audit Trail</h3>
                <p className="text-xs text-[#80736F]">Immutable history of all receipts, kitchen usage, wastage, and manual count corrections</p>
              </div>
              <div className="text-xs text-[#80736F] bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8E0D9]">
                Total Movements: <strong>{filteredMovements.length}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#E8E0D9]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by ingredient, reason, or staff..."
                  value={movSearchQuery}
                  onChange={e => setMovSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <Dropdown
                  value={movTypeFilter}
                  onChange={setMovTypeFilter}
                  options={[
                    { value: 'all', label: 'All Movement Types' },
                    { value: 'Received', label: 'Received (Deliveries & POs)' },
                    { value: 'Used', label: 'Used (Kitchen Production)' },
                    { value: 'Wasted', label: 'Wasted (Spoilage & Spills)' },
                    { value: 'Adjustment', label: 'Manual Adjustment' }
                  ]}
                  size="md"
                  className="w-full"
                  buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold">Type</th>
                    <th className="py-3.5 px-4 font-semibold">Ingredient</th>
                    <th className="py-3.5 px-4 font-semibold">Quantity Delta</th>
                    <th className="py-3.5 px-4 font-semibold">Stock Progression</th>
                    <th className="py-3.5 px-4 font-semibold">Reason / Reference</th>
                    <th className="py-3.5 px-4 font-semibold">Staff Member</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#80736F] text-xs">
                        No stock movement records found for the active filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map(m => (
                      <tr key={m.id} className="hover:bg-[#FAF7F2]/50 transition">
                        <td className="py-3.5 px-4 font-medium text-[#302725]">{m.createdAt}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              m.type === 'Received'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.type === 'Used'
                                ? 'bg-blue-100 text-blue-800'
                                : m.type === 'Wasted'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#302725]">{m.ingredientName}</td>
                        <td className="py-3.5 px-4 font-bold">
                          <span
                            className={
                              m.type === 'Received' ? 'text-emerald-700' : m.type === 'Used' || m.type === 'Wasted' ? 'text-red-600' : 'text-amber-800'
                            }
                          >
                            {m.type === 'Received' ? `+${m.quantity} ${m.unit}` : `-${m.quantity} ${m.unit}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#80736F]">
                          {m.previousStock} {m.unit} → <strong className="text-[#302725]">{m.newStock} {m.unit}</strong>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="block text-[#302725]">{m.reason || 'Operational update'}</span>
                          {m.referenceNumber && (
                            <span className="text-[10px] text-[#762F3D] font-mono">Ref: {m.referenceNumber}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#80736F]">{m.performedBy}</td>
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
      {/* 6. TAB 4: LOW STOCK & EXPIRY ALERTS                           */}
      {/* ============================================================== */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">

          {/* Sub-filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {[
                { key: 'all', label: 'All Alerts', count: stats.lowStockCount + stats.expiringCount },
                { key: 'low', label: 'Low Stock Only', count: stats.lowStockCount },
                { key: 'out', label: 'Out of Stock Only', count: stats.outOfStockCount },
                { key: 'expiring', label: 'Expiring (14d)', count: stats.expiringCount },
                { key: 'expired', label: 'Expired', count: stats.expiredCount }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setAlertTypeFilter(f.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer select-none ${
                    alertTypeFilter === f.key
                      ? 'bg-[#762F3D] text-white shadow-2xs'
                      : 'bg-[#FAF7F2] text-[#302725] border border-[#E8E0D9] hover:bg-[#E8E0D9]/50'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            <button
              onClick={() => openCreatePO()}
              className="px-4 py-2 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#C5A46D]" />
              <span>Create Purchase Order for Alerts</span>
            </button>
          </div>

          {/* Alert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alertIngredients.length === 0 ? (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-[#E8E0D9] text-center text-xs text-[#80736F]">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                No active inventory or expiry alerts for this filter.
              </div>
            ) : (
              alertIngredients.map(item => {
                const isOut = item.currentStock === 0;
                const isLow = item.currentStock <= item.minStock && item.currentStock > 0;
                const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-5 space-y-3.5 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] text-[#80736F] uppercase font-bold tracking-wider">{item.category}</span>
                          <h4 className="font-serif font-bold text-base text-[#302725] mt-0.5">{item.name}</h4>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isOut
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : isExpired
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isExpired ? 'Expired' : 'Low Stock'}
                        </span>
                      </div>

                      <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#80736F]">Current Stock:</span>
                          <strong className={isOut ? 'text-red-700' : 'text-amber-800'}>
                            {item.currentStock} {item.unit}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#80736F]">Safety Minimum:</span>
                          <span className="font-medium">{item.minStock} {item.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#80736F]">Preferred Supplier:</span>
                          <span className="font-semibold text-[#762F3D]">{item.supplier || 'Unassigned'}</span>
                        </div>
                        {item.expiryDate && (
                          <div className="flex justify-between">
                            <span className="text-[#80736F]">Expiry Date:</span>
                            <span className={isExpired ? 'font-bold text-red-700' : 'font-medium'}>
                              {item.expiryDate} {isExpired ? '(Expired)' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => openCreatePO(item)}
                        className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-2 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Order Restock</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedIngredientForAdjustment(item);
                          setAdjustmentType('Received');
                          setAdjustmentQuantity('');
                          setAdjustmentReason('Direct pantry replenishment');
                          setAdjustmentModalOpen(true);
                        }}
                        className="px-3 py-2 bg-white hover:bg-[#FAF7F2] text-[#302725] border border-[#E8E0D9] rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer"
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 7. TAB 5: SUPPLIERS DIRECTORY                                  */}
      {/* ============================================================== */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">

          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Suppliers & Vendor Network</h3>
                <p className="text-xs text-[#80736F]">Approved raw materials vendors, contact representatives, and payment terms</p>
              </div>
              <button
                onClick={openAddSupplier}
                className="px-4 py-2 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#C5A46D]" />
                <span>Add Supplier</span>
              </button>
            </div>

            <div className="pt-3 border-t border-[#E8E0D9]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search suppliers by company name, contact person, phone, email..."
                  value={supSearchQuery}
                  onChange={e => setSupSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map(sup => {
              const suppliedItems = inventory.filter(i => i.supplier === sup.name);

              return (
                <div
                  key={sup.id}
                  className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 space-y-4 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-serif font-bold text-lg text-[#302725]">{sup.name}</h4>
                        <span className="text-xs text-[#80736F] flex items-center gap-1.5 mt-0.5">
                          <User className="w-3.5 h-3.5 text-[#762F3D]" />
                          <span>{sup.contactPerson || 'Lead Account Representative'}</span>
                        </span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {sup.status}
                      </span>
                    </div>

                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-1.5 text-xs text-[#302725]">
                      <div><strong>Phone:</strong> {sup.phone || '+92 300 0000000'}</div>
                      <div><strong>Email:</strong> {sup.email || 'vendor@pakistan.pk'}</div>
                      <div><strong>Address:</strong> {sup.address || 'Lahore, Pakistan'}</div>
                      <div><strong>Terms:</strong> {sup.paymentTerms || 'Net 30'}</div>
                    </div>

                    {/* Supplied Ingredients */}
                    <div>
                      <span className="text-[10px] font-bold text-[#80736F] uppercase block mb-1.5">
                        Supplied Pantry Items ({suppliedItems.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {suppliedItems.slice(0, 3).map(it => (
                          <span key={it.id} className="bg-white border border-[#E8E0D9] text-[#762F3D] px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                            {it.name}
                          </span>
                        ))}
                        {suppliedItems.length > 3 && (
                          <span className="text-[10px] text-[#80736F] px-1.5 py-0.5">
                            +{suppliedItems.length - 3} more
                          </span>
                        )}
                        {suppliedItems.length === 0 && (
                          <span className="text-[10px] text-[#80736F] italic">No active ingredients linked</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E8E0D9] flex gap-2">
                    <button
                      onClick={() => openCreatePO(suppliedItems[0])}
                      className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-2 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Draft PO</span>
                    </button>

                    <button
                      onClick={() => openEditSupplier(sup)}
                      className="p-2 border border-[#E8E0D9] hover:bg-[#FAF7F2] text-[#80736F] rounded-xl transition cursor-pointer"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setDeleteTarget({ id: sup.id, name: sup.name, type: 'supplier' });
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 border border-red-200 hover:bg-red-600 hover:text-white text-red-600 rounded-xl transition cursor-pointer"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 8. TAB 6: PURCHASE ORDERS & RESTOCKING                         */}
      {/* ============================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">

          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Purchase Orders & Receiving</h3>
                <p className="text-xs text-[#80736F]">Create vendor purchase orders and record physical stock receipts directly into inventory</p>
              </div>
              <button
                onClick={() => openCreatePO()}
                className="px-4 py-2 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#C5A46D]" />
                <span>Create Purchase Order</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#E8E0D9]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by PO number, vendor name..."
                  value={poSearchQuery}
                  onChange={e => setPoSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <Dropdown
                  value={poStatusFilter}
                  onChange={setPoStatusFilter}
                  options={[
                    { value: 'all', label: 'All PO Statuses' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Ordered', label: 'Ordered' },
                    { value: 'Partially Received', label: 'Partially Received' },
                    { value: 'Received', label: 'Received' },
                    { value: 'Cancelled', label: 'Cancelled' }
                  ]}
                  size="md"
                  className="w-full"
                  buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">PO Number</th>
                    <th className="py-3.5 px-4 font-semibold">Vendor</th>
                    <th className="py-3.5 px-4 font-semibold">Order Date</th>
                    <th className="py-3.5 px-4 font-semibold">Expected Date</th>
                    <th className="py-3.5 px-4 font-semibold">Items</th>
                    <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {filteredPurchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#80736F] text-xs">
                        No purchase orders matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchaseOrders.map(po => {
                      const isComplete = po.status === 'Received';
                      const isOrdered = po.status === 'Ordered' || po.status === 'Partially Received';

                      return (
                        <tr key={po.id} className="hover:bg-[#FAF7F2]/50 transition">
                          <td className="py-3.5 px-4 font-bold text-[#762F3D] font-mono">{po.poNumber}</td>
                          <td className="py-3.5 px-4 font-semibold text-[#302725]">{po.supplierName}</td>
                          <td className="py-3.5 px-4 text-[#80736F]">{po.orderDate}</td>
                          <td className="py-3.5 px-4 text-[#80736F]">{po.expectedDeliveryDate}</td>
                          <td className="py-3.5 px-4 text-[#302725] font-medium">{po.items.length} item(s)</td>
                          <td className="py-3.5 px-4 font-bold text-[#762F3D]">
                            Rs. {po.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isComplete
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : po.status === 'Partially Received'
                                  ? 'bg-blue-100 text-blue-800'
                                  : po.status === 'Ordered'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {po.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isOrdered && (
                                <button
                                  onClick={() => openReceiveStock(po)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs cursor-pointer flex items-center gap-1"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>Receive Stock</span>
                                </button>
                              )}

                              <button
                                onClick={() => setViewingPo(po)}
                                title="Inspect PO Lines"
                                className="p-1.5 rounded-lg border border-[#E8E0D9] hover:bg-[#FAF7F2] text-[#80736F] transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setDeleteTarget({ id: po.id, name: po.poNumber, type: 'po' });
                                  setDeleteModalOpen(true);
                                }}
                                title="Delete PO"
                                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-600 hover:text-white text-red-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      {/* 9. TAB 7: BAKER RESTOCK REQUESTS QUEUE                         */}
      {/* ============================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-6">

          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#302725]">Kitchen Restock Requests Stream</h3>
              <p className="text-xs text-[#80736F]">Real-time ingredient requests submitted by bakery kitchen chefs</p>
            </div>
            <div className="text-xs text-[#80736F] bg-[#FAF7F2] px-3.5 py-1.5 rounded-xl border border-[#E8E0D9]">
              Pending Requests: <strong>{stats.pendingRequestsCount}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restockRequests.map(req => {
              const matchedIngredient = inventory.find(i => i.name.toLowerCase() === req.ingredientName.toLowerCase());

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 space-y-4 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-[#762F3D] text-xs block">Request #{req.id}</span>
                        <h4 className="font-serif font-bold text-lg text-[#302725] mt-0.5">{req.ingredientName}</h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.urgency === 'Critical'
                            ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                            : req.urgency === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {req.urgency} Urgency
                      </span>
                    </div>

                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-1.5 text-xs">
                      <div><strong>Quantity Needed:</strong> {req.quantityNeeded}</div>
                      <div><strong>Requested by:</strong> {req.requestedBy}</div>
                      <div><strong>Date Submitted:</strong> {req.createdAt}</div>
                      <div>
                        <strong>Current In Pantry:</strong>{' '}
                        {matchedIngredient ? `${matchedIngredient.currentStock} ${matchedIngredient.unit}` : 'Not linked'}
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-[#302725] italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                        "{req.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E8E0D9] flex flex-wrap gap-2">
                    {req.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => updateRestockRequestStatus(req.id, 'Approved')}
                          className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            openCreatePO(matchedIngredient);
                            updateRestockRequestStatus(req.id, 'PO Created');
                          }}
                          className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Create PO</span>
                        </button>
                        <button
                          onClick={() => updateRestockRequestStatus(req.id, 'Dismissed')}
                          className="px-3 py-2 rounded-xl border border-[#E8E0D9] bg-white hover:bg-gray-100 text-[#80736F] font-bold text-xs transition cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </>
                    )}

                    {req.status === 'Approved' && (
                      <>
                        <button
                          onClick={() => {
                            openCreatePO(matchedIngredient);
                            updateRestockRequestStatus(req.id, 'PO Created');
                          }}
                          className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] text-white py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Create PO</span>
                        </button>
                        <button
                          onClick={() => updateRestockRequestStatus(req.id, 'Fulfilled')}
                          className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs transition shadow-2xs cursor-pointer"
                        >
                          Mark Fulfilled
                        </button>
                      </>
                    )}

                    {req.status === 'PO Created' && (
                      <>
                        <span className="text-xs font-semibold text-blue-700 py-1.5 flex-1">
                          Purchase order in progress
                        </span>
                        <button
                          onClick={() => updateRestockRequestStatus(req.id, 'Fulfilled')}
                          className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs transition shadow-2xs cursor-pointer"
                        >
                          Mark Fulfilled
                        </button>
                      </>
                    )}

                    {req.status === 'Fulfilled' && (
                      <span className="text-xs font-bold text-emerald-700 py-1.5 px-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        &check; Stock Received & Fulfilled
                      </span>
                    )}

                    {req.status === 'Dismissed' && (
                      <span className="text-xs font-semibold text-gray-500 py-1.5 px-3 bg-gray-50 rounded-xl border border-gray-200">
                        Request Dismissed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 10. TAB 8: STOCK USAGE & WASTAGE MANAGEMENT                    */}
      {/* ============================================================== */}
      {(activeTab === 'usage' || activeTab === 'wastage') && (
        <div className="space-y-6">

          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#302725]">Kitchen Production Usage & Spoilage</h3>
              <p className="text-xs text-[#80736F]">Record raw materials consumption or discard damaged items with immediate stock deduction</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedIngredientForAdjustment(inventory[0] || null);
                  setAdjustmentType('Used');
                  setAdjustmentQuantity('');
                  setAdjustmentReason('Daily kitchen production batch');
                  setAdjustmentModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Record Usage</span>
              </button>

              <button
                onClick={() => {
                  setSelectedIngredientForAdjustment(inventory[0] || null);
                  setAdjustmentType('Wasted');
                  setAdjustmentQuantity('');
                  setAdjustmentReason('Damaged or expired disposal');
                  setAdjustmentModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Record Wastage</span>
              </button>
            </div>
          </div>

          {/* Usage & Wastage History Table */}
          <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Action</th>
                    <th className="py-3.5 px-4 font-semibold">Ingredient</th>
                    <th className="py-3.5 px-4 font-semibold">Deducted Qty</th>
                    <th className="py-3.5 px-4 font-semibold">Reason / Recipe Context</th>
                    <th className="py-3.5 px-4 font-semibold">Responsible User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {stockMovements
                    .filter(m => m.type === 'Used' || m.type === 'Wasted')
                    .map(m => (
                      <tr key={m.id} className="hover:bg-[#FAF7F2]/50 transition">
                        <td className="py-3.5 px-4 font-medium text-[#302725]">{m.createdAt}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              m.type === 'Used' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {m.type === 'Used' ? 'Kitchen Usage' : 'Wastage'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#302725]">{m.ingredientName}</td>
                        <td className="py-3.5 px-4 font-bold text-red-600">
                          -{m.quantity} {m.unit}
                        </td>
                        <td className="py-3.5 px-4 text-[#302725]">{m.reason}</td>
                        <td className="py-3.5 px-4 text-[#80736F]">{m.performedBy}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 11. TAB 9: INVENTORY REPORTS                                   */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">

          {/* Report Selection & Actions Header */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#302725]">Inventory Analytics & Reports</h3>
              <p className="text-xs text-[#80736F]">Generate dynamic valuation, reorder summaries, and audit printouts</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl border border-[#E8E0D9] bg-white hover:bg-[#FAF7F2] text-[#302725] text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#762F3D]" />
                <span>Print Report</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#C5A46D]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Report Subtype Switcher */}
          <div className="bg-white p-1.5 rounded-2xl border border-[#E8E0D9] shadow-2xs overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 min-w-max">
              {[
                { key: 'valuation', label: 'Stock Valuation & Holdings' },
                { key: 'lowStock', label: 'Low Stock & Reorder Plan' },
                { key: 'expiry', label: 'Expiry & Shelf-Life Risk' },
                { key: 'movements', label: 'Stock Movement Audit' },
                { key: 'wastage', label: 'Wastage & Loss Report' }
              ].map(r => (
                <button
                  key={r.key}
                  onClick={() => setReportType(r.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer select-none ${
                    reportType === r.key
                      ? 'bg-[#762F3D] text-white shadow-2xs font-bold'
                      : 'text-[#6B5E5B] hover:text-[#302725] hover:bg-[#FAF7F2]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report Rendered View */}
          <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs p-6 space-y-4">
            
            {/* Header summary of report */}
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-4">
              <div>
                <h4 className="font-serif font-bold text-base text-[#302725]">
                  {reportType === 'valuation' && 'Stock Valuation & Inventory Asset Holdings'}
                  {reportType === 'lowStock' && 'Low Stock Replenishment & Reorder Plan'}
                  {reportType === 'expiry' && 'Expiry Risk & Shelf-Life Countdown'}
                  {reportType === 'movements' && 'Stock Movement Audit Log'}
                  {reportType === 'wastage' && 'Wastage & Operational Spoilage Summary'}
                </h4>
                <p className="text-xs text-[#80736F]">Generated at {new Date().toLocaleString()}</p>
              </div>

              {reportType === 'valuation' && (
                <div className="text-right">
                  <span className="text-xs text-[#80736F] block">Total Asset Valuation:</span>
                  <span className="font-serif font-bold text-xl text-[#762F3D]">
                    Rs. {stats.totalValuation.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-semibold">Ingredient</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Current Stock</th>
                    <th className="py-3 px-4 font-semibold">Min Stock</th>
                    <th className="py-3 px-4 font-semibold">Unit Cost</th>
                    <th className="py-3 px-4 font-semibold">Total Value</th>
                    <th className="py-3 px-4 font-semibold">Status / Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D9]">
                  {inventory.map(item => (
                    <tr key={item.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="py-3 px-4 font-bold text-[#302725]">{item.name}</td>
                      <td className="py-3 px-4 text-[#80736F]">{item.category}</td>
                      <td className="py-3 px-4 font-semibold">{item.currentStock} {item.unit}</td>
                      <td className="py-3 px-4 text-[#80736F]">{item.minStock} {item.unit}</td>
                      <td className="py-3 px-4 font-medium">Rs. {item.purchaseCost.toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-[#762F3D]">
                        Rs. {(item.currentStock * item.purchaseCost).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-[#80736F]">
                          {item.expiryDate || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 12. MODAL: ADD / EDIT INGREDIENT                               */}
      {/* ============================================================== */}
      {ingredientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E8E0D9] max-h-[90vh] overflow-y-auto">
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">
                  {editingIngredient ? 'Edit Raw Material' : 'New Ingredient'}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">
                  {editingIngredient ? `Modify ${editingIngredient.name}` : 'Add Pantry Ingredient'}
                </h3>
              </div>
              <button
                onClick={() => setIngredientModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-[#80736F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">Ingredient Name *</label>
                <input
                  type="text"
                  required
                  value={ingredientForm.name}
                  onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                  placeholder="e.g. Belgian Dark Chocolate (Callebaut 54.5%)"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Category</label>
                  <Dropdown
                    value={ingredientForm.category}
                    onChange={v => setIngredientForm({ ...ingredientForm, category: v })}
                    options={[
                      { value: 'Dry Goods', label: 'Dry Goods' },
                      { value: 'Dairy', label: 'Dairy' },
                      { value: 'Chocolates', label: 'Chocolates' },
                      { value: 'Baking Essentials', label: 'Baking Essentials' },
                      { value: 'Packaging', label: 'Packaging' }
                    ]}
                    size="md"
                    className="w-full"
                    buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Unit of Measure</label>
                  <Dropdown
                    value={ingredientForm.unit}
                    onChange={v => setIngredientForm({ ...ingredientForm, unit: v })}
                    options={[
                      { value: 'kg', label: 'kg (Kilograms)' },
                      { value: 'L', label: 'L (Liters)' },
                      { value: 'dozen', label: 'dozen (Dozen)' },
                      { value: 'g', label: 'g (Grams)' },
                      { value: 'pcs', label: 'pcs (Pieces)' }
                    ]}
                    size="md"
                    className="w-full"
                    buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ingredientForm.currentStock}
                    onChange={e => setIngredientForm({ ...ingredientForm, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Safety Min Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ingredientForm.minStock}
                    onChange={e => setIngredientForm({ ...ingredientForm, minStock: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Cost per Unit (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ingredientForm.purchaseCost}
                    onChange={e => setIngredientForm({ ...ingredientForm, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Preferred Supplier</label>
                  <Dropdown
                    value={ingredientForm.supplier || (suppliers[0]?.name ?? '')}
                    onChange={v => setIngredientForm({ ...ingredientForm, supplier: v })}
                    options={suppliers.map(s => ({ value: s.name, label: s.name }))}
                    size="md"
                    className="w-full"
                    buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={ingredientForm.expiryDate}
                    onChange={e => setIngredientForm({ ...ingredientForm, expiryDate: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={ingredientForm.batchNumber}
                    onChange={e => setIngredientForm({ ...ingredientForm, batchNumber: e.target.value })}
                    placeholder="e.g. BAT-2026-10"
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={ingredientForm.storageLocation}
                    onChange={e => setIngredientForm({ ...ingredientForm, storageLocation: e.target.value })}
                    placeholder="e.g. Cold Room Shelf B3"
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-gray-300 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingIngredient ? 'Save Changes' : 'Create Ingredient'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIngredientModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8E0D9] bg-white font-bold text-xs text-[#302725] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 13. MODAL: STOCK ADJUSTMENT / USAGE / WASTAGE                 */}
      {/* ============================================================== */}
      {adjustmentModalOpen && selectedIngredientForAdjustment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E8E0D9] max-h-[90vh] overflow-y-auto">
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">Stock Operation</span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">
                  {selectedIngredientForAdjustment.name}
                </h3>
              </div>
              <button
                onClick={() => setAdjustmentModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-[#80736F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E0D9] flex justify-between items-center">
                <span className="text-[#80736F]">Available In Pantry:</span>
                <span className="font-serif font-bold text-base text-[#762F3D]">
                  {selectedIngredientForAdjustment.currentStock} {selectedIngredientForAdjustment.unit}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">Operation Type</label>
                <Dropdown
                  value={adjustmentType}
                  onChange={v => setAdjustmentType(v as any)}
                  options={[
                    { value: 'Used', label: 'Kitchen Usage (Production deduction)' },
                    { value: 'Wasted', label: 'Wastage (Damaged or expired discard)' },
                    { value: 'Received', label: 'Stock Receipt (Direct intake)' },
                    { value: 'Adjustment', label: 'Manual Physical Count Correction' }
                  ]}
                  size="md"
                  className="w-full"
                  buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">
                  Quantity ({selectedIngredientForAdjustment.unit}) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={adjustmentQuantity}
                  onChange={e => setAdjustmentQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">Reason / Note *</label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Batch baking for 15 anniversary cakes"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">Reference Number (Optional)</label>
                <input
                  type="text"
                  value={adjustmentReference}
                  onChange={e => setAdjustmentReference(e.target.value)}
                  placeholder="e.g. PO-2026-101 or ROTA-B5"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-gray-300 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Movement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8E0D9] bg-white font-bold text-xs text-[#302725] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 14. MODAL: ADD / EDIT SUPPLIER                                 */}
      {/* ============================================================== */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E8E0D9] max-h-[90vh] overflow-y-auto">
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">
                  {editingSupplier ? 'Edit Vendor Profile' : 'New Vendor'}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">
                  {editingSupplier ? editingSupplier.name : 'Add Raw Material Supplier'}
                </h3>
              </div>
              <button
                onClick={() => setSupplierModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-[#80736F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g. Punjab Flour Mills"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supplierForm.contactPerson}
                    onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    placeholder="sales@vendor.pk"
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Payment Terms</label>
                  <Dropdown
                    value={supplierForm.paymentTerms}
                    onChange={v => setSupplierForm({ ...supplierForm, paymentTerms: v })}
                    options={[
                      { value: 'Net 15', label: 'Net 15' },
                      { value: 'Net 30', label: 'Net 30' },
                      { value: 'Cash on Delivery', label: 'Cash on Delivery' },
                      { value: 'Advance Payment', label: 'Advance Payment' }
                    ]}
                    size="md"
                    className="w-full"
                    buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">Address</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Raiwind Road Industrial Area, Lahore"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">Supplied Categories (comma separated)</label>
                <input
                  type="text"
                  value={supplierForm.suppliedCategories}
                  onChange={e => setSupplierForm({ ...supplierForm, suppliedCategories: e.target.value })}
                  placeholder="Dry Goods, Baking Essentials"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-gray-300 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8E0D9] bg-white font-bold text-xs text-[#302725] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 15. MODAL: CREATE PURCHASE ORDER                               */}
      {/* ============================================================== */}
      {createPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E8E0D9] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">Procurement Workflow</span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Draft New Purchase Order</h3>
              </div>
              <button
                onClick={() => setCreatePoModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-[#80736F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseOrder} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Select Supplier *</label>
                  <Dropdown
                    value={poSupplierId}
                    onChange={v => setPoSupplierId(v)}
                    options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                    size="md"
                    className="w-full"
                    buttonClassName="bg-[#FAF7F2] font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#302725] mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={poExpectedDate}
                    onChange={e => setPoExpectedDate(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
              </div>

              {/* Multi-item Line Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[11px] text-[#302725] uppercase tracking-wider">Purchase Order Items</span>
                  <button
                    type="button"
                    onClick={() => {
                      const first = inventory[0];
                      if (first) {
                        setPoLineItems([
                          ...poLineItems,
                          {
                            ingredientId: first.id,
                            ingredientName: first.name,
                            quantity: 10,
                            unit: first.unit,
                            unitPrice: first.purchaseCost
                          }
                        ]);
                      }
                    }}
                    className="text-xs text-[#762F3D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {poLineItems.map((line, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] flex items-center gap-3">
                      <div className="flex-1">
                        <Dropdown
                          value={line.ingredientId}
                          onChange={newId => {
                            const matched = inventory.find(i => i.id === newId);
                            if (matched) {
                              const updated = [...poLineItems];
                              updated[idx] = {
                                ...line,
                                ingredientId: matched.id,
                                ingredientName: matched.name,
                                unit: matched.unit,
                                unitPrice: matched.purchaseCost
                              };
                              setPoLineItems(updated);
                            }
                          }}
                          options={inventory.map(i => ({ value: i.id, label: `${i.name} (${i.currentStock} ${i.unit})` }))}
                          size="sm"
                          className="w-full"
                          buttonClassName="bg-white text-xs font-semibold"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={line.quantity}
                          onChange={e => {
                            const updated = [...poLineItems];
                            updated[idx].quantity = parseFloat(e.target.value) || 0;
                            setPoLineItems(updated);
                          }}
                          placeholder="Qty"
                          className="w-full bg-white border border-[#E8E0D9] rounded-xl px-2.5 py-1 text-xs text-[#302725] text-center"
                        />
                      </div>

                      <div className="w-28 text-right font-bold text-[#762F3D]">
                        Rs. {(line.quantity * line.unitPrice).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => setPoLineItems(poLineItems.filter((_, i) => i !== idx))}
                        className="p-1 rounded-lg hover:bg-red-50 text-red-600 transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8E0D9] flex justify-between items-center font-bold">
                  <span>Estimated Total PO Amount:</span>
                  <span className="font-serif text-base text-[#762F3D]">
                    Rs. {poLineItems.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#302725] mb-1">Procurement Notes</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  placeholder="e.g. Delivery requested before morning baking shift"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#762F3D] hover:bg-[#5F2030] disabled:bg-gray-300 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Issue Purchase Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreatePoModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8E0D9] bg-white font-bold text-xs text-[#302725] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 16. MODAL: RECEIVE PURCHASE ORDER STOCK                        */}
      {/* ============================================================== */}
      {receivePoModalOpen && selectedPoForReceiving && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E8E0D9] max-h-[90vh] overflow-y-auto">
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">Stock Receiving Docket</span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">
                  Receive Stock for {selectedPoForReceiving.poNumber}
                </h3>
              </div>
              <button
                onClick={() => setReceivePoModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-[#80736F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-[#80736F]">
                Confirm physical quantities received at the commissary deck. Received stock will be automatically added to the master inventory.
              </p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedPoForReceiving.items.map(it => {
                  const alreadyReceived = it.receivedQuantity || 0;
                  const remaining = Math.max(it.quantity - alreadyReceived, 0);

                  return (
                    <div key={it.ingredientId} className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-[#302725] block">{it.ingredientName}</span>
                          <span className="text-[10px] text-[#80736F]">
                            Total Ordered: {it.quantity} {it.unit} • Already Received: {alreadyReceived} {it.unit}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#762F3D]">
                          Pending: {remaining} {it.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-[#80736F]">Receiving Now:</label>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          step="any"
                          value={receivedQuantities[it.ingredientId] ?? remaining}
                          onChange={e =>
                            setReceivedQuantities({
                              ...receivedQuantities,
                              [it.ingredientId]: parseFloat(e.target.value) || 0
                            })
                          }
                          className="w-24 bg-white border border-[#E8E0D9] rounded-xl px-2.5 py-1 text-xs text-[#302725] font-bold text-center"
                        />
                        <span className="text-xs text-[#80736F]">{it.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Intake & Add Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceivePoModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8E0D9] bg-white font-bold text-xs text-[#302725] hover:bg-[#FAF7F2] transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 17. MODAL: VIEW INGREDIENT DETAILS                             */}
      {/* ============================================================== */}
      {viewingIngredient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E8E0D9] max-h-[90vh] overflow-y-auto">
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">Raw Material Dossier</span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">{viewingIngredient.name}</h3>
              </div>
              <button
                onClick={() => setViewingIngredient(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-[#80736F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-[#302725]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E0D9]">
                  <span className="text-[10px] text-[#80736F] uppercase font-bold block">Current Stock</span>
                  <span className="font-serif font-bold text-base text-[#762F3D]">
                    {viewingIngredient.currentStock} {viewingIngredient.unit}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E0D9]">
                  <span className="text-[10px] text-[#80736F] uppercase font-bold block">Safety Min Stock</span>
                  <span className="font-serif font-bold text-base text-[#302725]">
                    {viewingIngredient.minStock} {viewingIngredient.unit}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E0D9]">
                  <span className="text-[10px] text-[#80736F] uppercase font-bold block">Unit Cost</span>
                  <span className="font-serif font-bold text-base text-[#302725]">
                    Rs. {viewingIngredient.purchaseCost.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E0D9]">
                  <span className="text-[10px] text-[#80736F] uppercase font-bold block">Holding Valuation</span>
                  <span className="font-serif font-bold text-base text-[#762F3D]">
                    Rs. {(viewingIngredient.currentStock * viewingIngredient.purchaseCost).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-2">
                <div><strong>Category:</strong> {viewingIngredient.category}</div>
                <div><strong>Preferred Vendor:</strong> {viewingIngredient.supplier || 'Unassigned'}</div>
                <div><strong>Batch Number:</strong> {viewingIngredient.batchNumber || 'BAT-2026'}</div>
                <div><strong>Storage Deck:</strong> {viewingIngredient.storageLocation || 'Pantry Shelf A'}</div>
                <div><strong>Expiry Date:</strong> {viewingIngredient.expiryDate || 'N/A'}</div>
                <div><strong>Last Verified:</strong> {viewingIngredient.lastUpdated}</div>
              </div>

              {viewingIngredient.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-900 text-[10px] uppercase font-bold block mb-1">Commissary Notes</span>
                  <p className="text-[#302725] italic">{viewingIngredient.notes}</p>
                </div>
              )}

              <button
                onClick={() => setViewingIngredient(null)}
                className="w-full bg-[#762F3D] hover:bg-[#5F2030] text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 18. MODAL: VIEW PURCHASE ORDER LINES                           */}
      {/* ============================================================== */}
      {viewingPo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E8E0D9] max-h-[90vh] overflow-y-auto">
            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">Purchase Order Overview</span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">{viewingPo.poNumber}</h3>
              </div>
              <button
                onClick={() => setViewingPo(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-[#80736F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-[#302725]">
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] space-y-1.5">
                <div><strong>Vendor:</strong> {viewingPo.supplierName}</div>
                <div><strong>Order Date:</strong> {viewingPo.orderDate}</div>
                <div><strong>Expected Delivery:</strong> {viewingPo.expectedDeliveryDate}</div>
                <div><strong>Status:</strong> {viewingPo.status}</div>
                <div><strong>Created By:</strong> {viewingPo.createdBy}</div>
              </div>

              <div>
                <span className="font-bold text-[10px] text-[#80736F] uppercase block mb-2">Itemized Breakdown</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewingPo.items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E0D9] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#302725] block">{it.ingredientName}</span>
                        <span className="text-[10px] text-[#80736F]">
                          {it.quantity} {it.unit} @ Rs. {it.unitPrice.toLocaleString()} / {it.unit}
                        </span>
                      </div>
                      <span className="font-bold text-[#762F3D]">Rs. {it.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E8E0D9] flex justify-between items-center font-bold">
                <span>Grand Total:</span>
                <span className="font-serif text-lg text-[#762F3D]">Rs. {viewingPo.totalAmount.toLocaleString()}</span>
              </div>

              <button
                onClick={() => setViewingPo(null)}
                className="w-full bg-[#762F3D] hover:bg-[#5F2030] text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 19. REUSABLE CUSTOM DELETE CONFIRMATION MODAL                   */}
      {/* ============================================================== */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={
          deleteTarget?.type === 'ingredient'
            ? 'Delete Ingredient'
            : deleteTarget?.type === 'supplier'
            ? 'Delete Supplier'
            : 'Delete Purchase Order'
        }
        message={
          deleteTarget
            ? `Are you sure you want to permanently remove "${deleteTarget.name}"? This action cannot be undone.`
            : 'Are you sure you want to remove this item?'
        }
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteAction}
        isLoading={isDeleting}
        confirmText="Confirm Delete"
      />

      </div>
    </PortalLayout>
  );
};
