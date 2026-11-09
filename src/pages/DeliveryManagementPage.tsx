import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Dropdown } from '../components/Dropdown';
import { CustomerContactModal } from '../components/CustomerContactModal';
import { PortalLayout } from '../components/PortalLayout';
import { DeliveryTask, DeliveryStatus } from '../types';
import { 
  LayoutDashboard,
  Truck, MapPin, Phone, CheckCircle2, AlertTriangle, Clock, 
  Calendar, Search, Filter, Navigation, User, ExternalLink, 
  FileText, X, ChevronRight, RefreshCw, Banknote, ShieldCheck, 
  AlertCircle, Check, ArrowRight, Package, Sparkles, Bell
} from 'lucide-react';

export const DeliveryManagementPage: React.FC = () => {
  const { 
    currentUser, 
    deliveries, 
    deliveryStats, 
    fetchDeliveries, 
    fetchDeliveryStats, 
    updateDeliveryStatus, 
    confirmDelivery, 
    failDelivery, 
    collectCodPayment,
    notifications,
    showToast
  } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'assigned' | 'active' | 'schedule' | 'history' | 'cod' | 'collectionsHistory'
  >('dashboard');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [codStatusFilter, setCodStatusFilter] = useState<string>('all');

  // Automatically fetch latest delivery records and live statistics on mount
  useEffect(() => {
    fetchDeliveries();
    fetchDeliveryStats();
  }, []);

  // Seamlessly synchronize when delivery personnel returns to an inactive browser tab or window
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchDeliveries();
        fetchDeliveryStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  // Customer Contact Confirmation Modal state (Centered Modal)
  const [contactModalData, setContactModalData] = useState<{
    isOpen: boolean;
    customerName?: string;
    customerPhone: string;
  }>({
    isOpen: false,
    customerName: '',
    customerPhone: ''
  });

  const handleOpenContactModal = (phone: string, name?: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setContactModalData({
      isOpen: true,
      customerName: name || '',
      customerPhone: phone || ''
    });
  };

  const handleCloseContactModal = () => {
    setContactModalData(prev => ({ ...prev, isOpen: false }));
  };

  // Modals state
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryTask | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Delivery Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmRecipientName, setConfirmRecipientName] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmProof, setConfirmProof] = useState('Signed delivery receipt');
  const [confirmCollectCod, setConfirmCollectCod] = useState(true);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Failed Delivery Modal
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [failReason, setFailReason] = useState('Customer unreachable by phone');
  const [failNotes, setFailNotes] = useState('');
  const [isSubmittingFail, setIsSubmittingFail] = useState(false);

  // COD Collection Modal
  const [isCodModalOpen, setIsCodModalOpen] = useState(false);
  const [codAmountInput, setCodAmountInput] = useState<string>('');
  const [isSubmittingCod, setIsSubmittingCod] = useState(false);

  // Open in Google Maps helper
  const handleOpenMaps = (address: string) => {
    const query = encodeURIComponent(`${address}, Lahore, Pakistan`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  // Categorized Deliveries
  const activeDeliveries = useMemo(() => {
    return deliveries.filter(d => 
      d.status === 'Assigned' || 
      d.status === 'Picked Up' || 
      d.status === 'In Transit' || 
      d.status === 'Out for Delivery' ||
      d.status === 'Pending Assignment'
    );
  }, [deliveries]);

  const inTransitDeliveries = useMemo(() => {
    return deliveries.filter(d => 
      d.status === 'Picked Up' || 
      d.status === 'In Transit' || 
      d.status === 'Out for Delivery'
    );
  }, [deliveries]);

  const assignedDeliveries = useMemo(() => {
    return deliveries.filter(d => 
      d.status === 'Assigned' || 
      d.status === 'Pending Assignment'
    );
  }, [deliveries]);

  const historyDeliveries = useMemo(() => {
    return deliveries.filter(d => 
      d.status === 'Delivered' || 
      d.status === 'Failed Delivery' || 
      d.status === 'Returned'
    );
  }, [deliveries]);

  const codDeliveries = useMemo(() => {
    return deliveries.filter(d => 
      d.paymentMethod?.toLowerCase().includes('delivery') || 
      d.paymentMethod === 'COD' ||
      (d.codAmountDue && d.codAmountDue > 0)
    );
  }, [deliveries]);

  const collectedCodDeliveries = useMemo(() => {
    return deliveries.filter(d => 
      (d.codAmountCollected && d.codAmountCollected > 0) || 
      (d.status === 'Delivered' && (d.paymentMethod?.toLowerCase().includes('delivery') || d.paymentMethod === 'COD'))
    );
  }, [deliveries]);

  // Today's Deliveries (scheduled today)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDeliveries = useMemo(() => {
    return deliveries.filter(d => d.scheduledAt?.startsWith(todayStr) || d.createdAt?.startsWith(todayStr));
  }, [deliveries, todayStr]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = deliveries.length;
    const inProgress = deliveries.filter(d => d.status === 'Picked Up' || d.status === 'In Transit' || d.status === 'Out for Delivery').length;
    const pending = deliveries.filter(d => d.status === 'Assigned' || d.status === 'Pending Assignment').length;
    const completed = deliveries.filter(d => d.status === 'Delivered').length;
    const failed = deliveries.filter(d => d.status === 'Failed Delivery' || d.status === 'Returned').length;
    
    const codPending = deliveries
      .filter(d => d.status !== 'Delivered' && d.status !== 'Failed Delivery' && (d.paymentMethod?.toLowerCase().includes('delivery') || d.paymentMethod === 'COD'))
      .reduce((sum, d) => sum + (d.codAmountDue || 0), 0);

    const codCollected = deliveries
      .reduce((sum, d) => sum + (d.codAmountCollected || 0), 0);

    return {
      totalAssigned: deliveryStats?.totalAssigned ?? total,
      inProgress: deliveryStats?.inProgressDeliveries ?? inProgress,
      pending: deliveryStats?.pendingDeliveries ?? pending,
      completed: deliveryStats?.totalDelivered ?? completed,
      failed: deliveryStats?.failedDeliveries ?? failed,
      codPending: deliveryStats?.codPendingTotal ?? codPending,
      codCollected: deliveryStats?.codCollectedToday ?? codCollected
    };
  }, [deliveries, deliveryStats]);

  // Filtered Active Deliveries
  const filteredActive = useMemo(() => {
    return activeDeliveries.filter(d => {
      const matchesSearch = 
        d.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.items && d.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || d.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [activeDeliveries, searchTerm, statusFilter, priorityFilter]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyDeliveries.filter(d => {
      const matchesSearch = 
        d.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [historyDeliveries, searchTerm, statusFilter]);

  // Filtered COD Deliveries
  const filteredCodDeliveries = useMemo(() => {
    return codDeliveries.filter(d => {
      const matchesSearch = 
        d.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.address.toLowerCase().includes(searchTerm.toLowerCase());

      const isFullyPaid = (d.codAmountCollected || 0) >= (d.codAmountDue || d.totalAmount || 0) || d.status === 'Delivered';
      const matchesStatus = 
        codStatusFilter === 'all' ||
        (codStatusFilter === 'collected' && isFullyPaid) ||
        (codStatusFilter === 'pending' && !isFullyPaid);

      return matchesSearch && matchesStatus;
    });
  }, [codDeliveries, searchTerm, codStatusFilter]);

  const unreadNotifsCount = notifications ? notifications.filter(n => !n.read).length : 0;
  const pendingCodOrdersCount = codDeliveries.filter(d => d.status !== 'Delivered' && (d.codAmountDue || 0) > 0).length;

  // Sidebar Sections (Organized per Section 2 specifications)
  const sidebarSections = useMemo(() => [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Delivery Management',
      items: [
        { id: 'assigned', label: 'Assigned Deliveries', icon: Package, badge: assignedDeliveries.length },
        { 
          id: 'active', 
          label: 'Active Deliveries', 
          icon: Truck, 
          badge: inTransitDeliveries.length,
          badgeColor: inTransitDeliveries.length > 0 ? 'bg-blue-100 text-blue-800' : undefined 
        },
        { id: 'schedule', label: 'Scheduled Stops', icon: Calendar, badge: todayDeliveries.length },
        { id: 'history', label: 'Delivery History', icon: CheckCircle2, badge: historyDeliveries.length }
      ]
    },
    {
      title: 'Cash Management',
      items: [
        { 
          id: 'cod', 
          label: 'COD Collections', 
          icon: Banknote, 
          badge: pendingCodOrdersCount > 0 ? pendingCodOrdersCount : undefined, 
          badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200' 
        },
        { id: 'collectionsHistory', label: 'Collection History', icon: ShieldCheck }
      ]
    },
    {
      title: 'Account',
      items: [
        { id: 'account_profile', label: 'My Profile', icon: User },
        { 
          id: 'account_notifications', 
          label: 'Notifications', 
          icon: Bell, 
          badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined, 
          badgeColor: 'bg-[#762F3D] text-white' 
        }
      ]
    }
  ], [assignedDeliveries.length, inTransitDeliveries.length, todayDeliveries.length, historyDeliveries.length, pendingCodOrdersCount, unreadNotifsCount]);

  // Open Confirm Modal
  const handleOpenConfirm = (del: DeliveryTask) => {
    setSelectedDelivery(del);
    setConfirmRecipientName(del.customerName);
    setConfirmNotes('Delivered in pristine condition directly to customer.');
    setConfirmProof('Signed delivery receipt');
    setConfirmCollectCod(Boolean(del.codAmountDue && del.codAmountDue > 0));
    setIsConfirmModalOpen(true);
  };

  // Submit Confirm Delivery
  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !confirmRecipientName.trim()) return;

    setIsSubmittingConfirm(true);
    const success = await confirmDelivery(selectedDelivery.id, {
      recipientName: confirmRecipientName.trim(),
      deliveryNotes: confirmNotes.trim(),
      proofOfDelivery: confirmProof,
      collectCod: confirmCollectCod
    });
    setIsSubmittingConfirm(false);
    if (success) {
      setIsConfirmModalOpen(false);
      setSelectedDelivery(null);
    }
  };

  // Open Fail Modal
  const handleOpenFail = (del: DeliveryTask) => {
    setSelectedDelivery(del);
    setFailReason('Customer unreachable by phone');
    setFailNotes('');
    setIsFailModalOpen(true);
  };

  // Submit Fail Delivery
  const handleFailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !failReason.trim()) return;

    setIsSubmittingFail(true);
    const success = await failDelivery(selectedDelivery.id, failReason.trim(), failNotes.trim());
    setIsSubmittingFail(false);
    if (success) {
      setIsFailModalOpen(false);
      setSelectedDelivery(null);
    }
  };

  // Open COD Collection Modal
  const handleOpenCodModal = (del: DeliveryTask) => {
    setSelectedDelivery(del);
    setCodAmountInput(String(del.codAmountDue || del.totalAmount || ''));
    setIsCodModalOpen(true);
  };

  // Submit COD Collection
  const handleCodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    const num = Number(codAmountInput);
    if (isNaN(num) || num <= 0) return;

    setIsSubmittingCod(true);
    const success = await collectCodPayment(selectedDelivery.id, num);
    setIsSubmittingCod(false);
    if (success) {
      setIsCodModalOpen(false);
      setSelectedDelivery(null);
    }
  };

  // Open Details Modal
  const handleOpenDetails = (del: DeliveryTask) => {
    setSelectedDelivery(del);
    setIsDetailsModalOpen(true);
  };

  // Status Badge Colors (Compact SaaS Palette)
  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'Out for Delivery':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'In Transit':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Picked Up':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Assigned':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Failed Delivery':
      case 'Returned':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-[#FAF7F2] text-[#80736F] border-[#E8E0D9]';
    }
  };

  const getPriorityBadge = (priority: string = 'Normal') => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'High':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      default:
        return 'bg-[#FAF7F2] text-[#80736F] border-[#E8E0D9]';
    }
  };

  // Total Shift Progress Percentage
  const shiftProgressPercent = useMemo(() => {
    const total = deliveries.length;
    if (total === 0) return 100;
    return Math.round((stats.completed / total) * 100);
  }, [deliveries.length, stats.completed]);

  /* ============================================================== */
  /* REUSABLE COMPACT DELIVERY CARD (SECTION 5 SPECIFICATION)        */
  /* ============================================================== */
  const renderCompactDeliveryCard = (del: DeliveryTask, mode: 'active' | 'assigned' | 'dashboard') => {
    const isCod = del.paymentMethod?.toLowerCase().includes('delivery') || del.paymentMethod === 'COD' || (del.codAmountDue && del.codAmountDue > 0);
    const itemCount = del.items ? del.items.reduce((s, i) => s + i.quantity, 0) : 0;

    return (
      <div
        key={del.id}
        className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E0D9] shadow-2xs hover:shadow-xs hover:border-[#762F3D]/30 transition-all flex flex-col justify-between space-y-3 w-full min-w-0"
      >
        <div className="space-y-2.5 min-w-0">
          {/* Top Row: Order ID, Status, Priority & Payment Tag */}
          <div className="flex items-center justify-between gap-2 border-b border-[#E8E0D9]/60 pb-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#762F3D] tracking-tight">{del.orderNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(del.status)}`}>
                {del.status}
              </span>
              {del.priority && del.priority !== 'Normal' && (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase tracking-wider ${getPriorityBadge(del.priority)}`}>
                  {del.priority}
                </span>
              )}
            </div>

            <div className="text-right shrink-0">
              {isCod ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                  COD: Rs. {(del.codAmountDue || del.totalAmount || 0).toLocaleString()}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Paid (Rs. {(del.totalAmount || 0).toLocaleString()})
                </span>
              )}
            </div>
          </div>

          {/* Customer Details Row */}
          <div className="space-y-2 text-xs min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="font-bold text-[#302725] text-sm truncate">{del.customerName}</span>
              <button
                type="button"
                onClick={(e) => handleOpenContactModal(del.customerPhone, del.customerName, e)}
                className="text-[11px] font-semibold text-[#762F3D] hover:underline flex items-center gap-1 shrink-0 bg-[#FAF7F2] hover:bg-[#F3E6DF] px-2 py-0.5 rounded-md border border-[#E8E0D9]/80 transition cursor-pointer"
                title="Click to call or copy phone"
              >
                <Phone className="w-3 h-3 text-[#762F3D]" />
                <span>{del.customerPhone}</span>
              </button>
            </div>

            {/* Address with Map Icon */}
            <div className="flex items-start gap-1.5 bg-[#FAF7F2] p-2 rounded-lg border border-[#E8E0D9]/80 text-[#302725] min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#762F3D] shrink-0 mt-0.5" />
              <span className="flex-1 text-[11px] leading-relaxed break-words">{del.address}</span>
              <button
                type="button"
                onClick={() => handleOpenMaps(del.address)}
                className="p-1 rounded bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-[#E8E0D9] shrink-0 transition"
                title="Open GPS Navigation in Google Maps"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Special Instructions (Compact Callout) */}
            {del.instructions && (
              <div className="px-2.5 py-1.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-amber-900 text-[11px] flex items-start gap-1.5 min-w-0">
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-tight break-words"><strong>Instructions:</strong> {del.instructions}</span>
              </div>
            )}

            {/* Package Item Summary (Compact) */}
            {del.items && del.items.length > 0 && (
              <div className="text-[10px] text-[#80736F] flex items-center justify-between pt-0.5 min-w-0">
                <span className="truncate">
                  📦 {itemCount} {itemCount === 1 ? 'item' : 'items'} ({del.items.map(i => i.name).slice(0, 2).join(', ')}{del.items.length > 2 ? '...' : ''})
                </span>
                <span className="shrink-0 font-medium text-[#6B5E5B]">
                  Window: {del.estimatedTime || 'Standard'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Area (Consistent Button Heights & Layout) */}
        <div className="pt-2 border-t border-[#E8E0D9]/60 space-y-2 w-full min-w-0">
          {mode === 'active' && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F] shrink-0">Stage:</span>
              <Dropdown
                value={del.status}
                onChange={(newStatus) => updateDeliveryStatus(del.id, newStatus as DeliveryStatus)}
                options={[
                  { value: 'Assigned', label: '1. Assigned to Courier' },
                  { value: 'Picked Up', label: '2. Picked Up from Bakery' },
                  { value: 'In Transit', label: '3. In Transit on Route' },
                  { value: 'Out for Delivery', label: '4. Out for Delivery' },
                ]}
                size="sm"
                className="flex-1 min-w-0"
                buttonClassName="bg-[#FAF7F2] text-xs font-semibold h-7.5 py-1"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={(e) => handleOpenContactModal(del.customerPhone, del.customerName, e)}
              className="h-8 px-2.5 rounded-lg bg-white border border-[#E8E0D9] hover:bg-[#FAF7F2] text-[#762F3D] text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer select-none"
              title={`Call / Copy (${del.customerPhone})`}
            >
              <Phone className="w-3 h-3 text-[#762F3D]" />
              <span>Call</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMaps(del.address)}
              className="h-8 px-2.5 rounded-lg bg-white border border-[#E8E0D9] hover:bg-blue-50 text-blue-700 text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
              title="Open GPS Navigation"
            >
              <Navigation className="w-3 h-3 text-blue-600" />
              <span>Navigate</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenDetails(del)}
              className="h-8 px-2.5 rounded-lg bg-white border border-[#E8E0D9] hover:bg-[#FAF7F2] text-[#302725] text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
              title="View Complete Delivery Details"
            >
              <FileText className="w-3 h-3 text-[#80736F]" />
              <span>Details</span>
            </button>

            {mode === 'active' && (
              <button
                type="button"
                onClick={() => handleOpenFail(del)}
                className="h-8 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer flex items-center justify-center"
                title="Report Delivery Issue"
              >
                <span>Issue</span>
              </button>
            )}

            {mode === 'active' && (
              <button
                type="button"
                onClick={() => handleOpenConfirm(del)}
                className="h-8 flex-1 min-w-[80px] sm:min-w-[100px] px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Complete</span>
              </button>
            )}

            {mode === 'assigned' && (
              <button
                type="button"
                onClick={() => updateDeliveryStatus(del.id, 'Picked Up')}
                className="h-8 flex-1 min-w-[90px] sm:min-w-[120px] px-2.5 sm:px-3 rounded-lg bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Truck className="w-3 h-3 text-[#C5A46D]" />
                <span>Pick Up & Start</span>
              </button>
            )}

            {mode === 'dashboard' && (
              <button
                type="button"
                onClick={() => handleOpenConfirm(del)}
                className="h-8 flex-1 min-w-[80px] sm:min-w-[100px] px-2.5 sm:px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Check className="w-3 h-3 stroke-[2.5]" />
                <span>Complete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PortalLayout
      portalName="Delivery Portal"
      portalSubtitle="Courier & Dispatch Console"
      portalBadge="Active Route Shift"
      sidebarSections={sidebarSections}
      activeTab={activeTab}
      onTabChange={(tab: string) => setActiveTab(tab as any)}
      compact={true}
      headerActions={
        <button
          onClick={() => setActiveTab('active')}
          className="h-8 px-2.5 sm:px-3 rounded-lg bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer select-none"
        >
          <Truck className="w-3.5 h-3.5 text-[#C5A46D]" />
          <span className="hidden sm:inline">Active Route</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
            {inTransitDeliveries.length}
          </span>
        </button>
      }
    >
      <div className="space-y-4 sm:space-y-4.5 w-full min-w-0">

        {/* ============================================================== */}
        {/* 1. TAB CONTENT: DASHBOARD OVERVIEW (SECTION 4 SPECIFICATION)   */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-4.5 w-full min-w-0">

            {/* 4 Compact Statistic Cards (Responsive 2/4 cols, consistent heights) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full min-w-0">
              
              {/* Card 1: Assigned Deliveries */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E0D9] shadow-2xs hover:shadow-xs transition flex items-center justify-between min-w-0">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#80736F] block truncate">
                    Assigned Deliveries
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-[#302725] tracking-tight">
                    {stats.pending}
                  </div>
                  <span className="text-[10px] text-amber-700 font-medium block truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Ready for pickup
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2: Active Deliveries */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E0D9] shadow-2xs hover:shadow-xs transition flex items-center justify-between min-w-0">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#80736F] block truncate">
                    Active Deliveries
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-blue-900 tracking-tight">
                    {stats.inProgress}
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium block truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In transit on route
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              {/* Card 3: Completed Deliveries */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E0D9] shadow-2xs hover:shadow-xs transition flex items-center justify-between min-w-0">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#80736F] block truncate">
                    Completed Deliveries
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-900 tracking-tight">
                    {stats.completed}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium block truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Doorstep dropoffs
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Card 4: Outstanding COD */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E0D9] shadow-2xs hover:shadow-xs transition flex items-center justify-between min-w-0">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#80736F] block truncate">
                    Outstanding COD
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-[#762F3D] tracking-tight truncate">
                    Rs. {stats.codPending.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[#80736F] font-medium block truncate">
                    Rs. {stats.codCollected.toLocaleString()} remitted
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] text-[#762F3D] border border-[#E8E0D9] flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>

            </div>

            {/* Urgent Priority Alert Banner (if any urgent order is active) */}
            {activeDeliveries.some(d => d.priority === 'Urgent') && (
              <div className="bg-red-50/90 border border-red-200 p-3 rounded-xl flex items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-900 truncate">
                    <strong className="font-bold">Urgent Orders on Route:</strong> You have high-priority custom bakery deliveries requiring immediate dispatch.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPriorityFilter('Urgent');
                    setActiveTab('active');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  View Urgent
                </button>
              </div>
            )}

            {/* Balanced Dashboard Layout: Operations (2 cols) + Quick Overview (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5 w-full min-w-0">

              {/* Main Area: Delivery Operations (2 Columns) */}
              <div className="lg:col-span-2 space-y-4 min-w-0">

                {/* Active Deliveries Operations Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E0D9] shadow-2xs space-y-3.5 w-full min-w-0">
                  <div className="flex justify-between items-center border-b border-[#E8E0D9]/60 pb-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Truck className="w-4 h-4 text-[#762F3D] shrink-0" />
                      <h3 className="font-serif font-bold text-base text-[#302725] truncate">Active Route Operations</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F2] text-[#762F3D] border border-[#E8E0D9]">
                        {inTransitDeliveries.length} in route
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('active')}
                      className="text-xs font-bold text-[#762F3D] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Manage All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {inTransitDeliveries.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-[#302725]">No active stops in transit</p>
                      <p className="text-[11px] text-[#80736F]">
                        {assignedDeliveries.length > 0 
                          ? `You have ${assignedDeliveries.length} orders waiting in Assigned Deliveries ready to pick up.`
                          : 'All scheduled route deliveries are currently complete.'}
                      </p>
                      {assignedDeliveries.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('assigned')}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-[#762F3D] text-white text-xs font-bold hover:bg-[#5F2030] transition cursor-pointer"
                        >
                          View Assigned Orders ({assignedDeliveries.length})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full min-w-0">
                      {inTransitDeliveries.slice(0, 4).map(del => renderCompactDeliveryCard(del, 'dashboard'))}
                    </div>
                  )}
                </div>

                {/* Upcoming Scheduled Stops Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E0D9] shadow-2xs space-y-3 w-full min-w-0">
                  <div className="flex justify-between items-center border-b border-[#E8E0D9]/60 pb-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="w-4 h-4 text-[#C5A46D] shrink-0" />
                      <h3 className="font-serif font-bold text-base text-[#302725] truncate">Upcoming Stops Progression</h3>
                      <span className="text-[10px] text-[#80736F]">({todayDeliveries.length} stops today)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('schedule')}
                      className="text-xs font-bold text-[#762F3D] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Full Schedule</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {todayDeliveries.length === 0 ? (
                    <p className="text-xs text-[#80736F] text-center py-4">No scheduled route stops recorded for today.</p>
                  ) : (
                    <div className="space-y-2 w-full min-w-0">
                      {todayDeliveries.slice(0, 3).map((del, idx) => (
                        <div
                          key={del.id}
                          className="p-2.5 rounded-xl border border-[#E8E0D9]/70 bg-[#FAF7F2]/40 flex items-center justify-between gap-3 text-xs min-w-0"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-full bg-[#762F3D] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-[#302725] truncate">{del.customerName}</span>
                                <span className="font-mono text-[10px] text-[#80736F]">({del.orderNumber})</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold ${getStatusBadge(del.status)}`}>
                                  {del.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#6B5E5B] truncate mt-0.5">{del.address}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleOpenContactModal(del.customerPhone, del.customerName, e)}
                              className="p-1.5 rounded-lg bg-white border border-[#E8E0D9] text-[#762F3D] hover:bg-[#FAF7F2] transition cursor-pointer"
                              title="Call Customer"
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenMaps(del.address)}
                              className="p-1.5 rounded-lg bg-white border border-[#E8E0D9] text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="GPS Navigation"
                            >
                              <Navigation className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Secondary Area: Quick Overview (1 Column) */}
              <div className="space-y-4 min-w-0">

                {/* Delivery Shift Progression Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E0D9] shadow-2xs space-y-3 w-full min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Shift Progress</span>
                    <span className="text-xs font-bold text-[#762F3D]">{shiftProgressPercent}% Done</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#FAF7F2] rounded-full h-2 border border-[#E8E0D9] overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${shiftProgressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                    <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E8E0D9]/60">
                      <div className="text-[10px] text-[#80736F]">Total Stops</div>
                      <div className="font-bold text-sm text-[#302725]">{deliveries.length}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60">
                      <div className="text-[10px] text-emerald-800">Delivered</div>
                      <div className="font-bold text-sm text-emerald-900">{stats.completed}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/60">
                      <div className="text-[10px] text-blue-800">In Route</div>
                      <div className="font-bold text-sm text-blue-900">{stats.inProgress}</div>
                    </div>
                  </div>
                </div>

                {/* COD Remittance Summary Card */}
                <div className="bg-gradient-to-br from-[#5F2030] to-[#762F3D] text-white rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 w-full min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A46D]">Cash Collection</span>
                    <Banknote className="w-4 h-4 text-[#C5A46D]" />
                  </div>

                  <div>
                    <div className="text-[11px] text-[#F3E6DF]">Cash in Hand to Remit:</div>
                    <div className="text-2xl font-serif font-bold text-white mt-0.5">
                      Rs. {stats.codCollected.toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/15 text-[11px] text-[#F3E6DF] flex justify-between items-center">
                    <span>Pending Doorstep COD:</span>
                    <span className="font-bold text-white">Rs. {stats.codPending.toLocaleString()}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('cod')}
                    className="w-full py-2 rounded-lg bg-[#C5A46D] hover:bg-[#b0915d] text-[#302725] font-bold text-xs transition shadow-2xs cursor-pointer select-none"
                  >
                    Manage COD Collections
                  </button>
                </div>

                {/* Recent Delivery Activity Feed */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E0D9] shadow-2xs space-y-3 w-full min-w-0">
                  <h4 className="font-serif text-sm font-bold text-[#302725]">Recent Delivery Log</h4>
                  
                  <div className="space-y-2 text-xs w-full min-w-0">
                    {deliveries.slice(0, 4).map(del => {
                      const lastEvent = del.timeline && del.timeline.length > 0 ? del.timeline[del.timeline.length - 1] : null;
                      return (
                        <div key={del.id} className="flex items-start gap-2.5 pb-2 border-b border-[#E8E0D9]/50 last:border-none last:pb-0 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#762F3D] mt-1.5 shrink-0"></div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="font-bold text-[#302725] truncate">{del.orderNumber}</span>
                              <span className="text-[10px] text-[#80736F] shrink-0">{lastEvent?.timestamp?.substring(11, 16) || 'Today'}</span>
                            </div>
                            <p className="text-[11px] text-[#6B5E5B] truncate">
                              {del.customerName} • <span className="font-semibold text-[#762F3D]">{del.status}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 2. TAB CONTENT: ASSIGNED DELIVERIES                            */}
        {/* ============================================================== */}
        {activeTab === 'assigned' && (
          <div className="space-y-3.5 w-full min-w-0">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E0D9] shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full min-w-0">
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-base text-[#302725]">Assigned Courier Orders</h3>
                <p className="text-xs text-[#80736F]">Bakery kitchen orders dispatched and waiting for courier route pickup</p>
              </div>
              <span className="text-xs font-semibold text-[#80736F] bg-[#FAF7F2] px-3 py-1 rounded-lg border border-[#E8E0D9] shrink-0">
                {assignedDeliveries.length} orders pending pickup
              </span>
            </div>

            {assignedDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-[#E8E0D9] space-y-2 w-full min-w-0">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-serif font-bold text-base text-[#302725]">No New Assigned Orders</h4>
                <p className="text-xs text-[#80736F] max-w-md mx-auto">
                  All assigned orders have been picked up. Check Active Deliveries to manage current deliveries on route.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 w-full min-w-0">
                {assignedDeliveries.map(del => renderCompactDeliveryCard(del, 'assigned'))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. TAB CONTENT: ACTIVE DELIVERIES                              */}
        {/* ============================================================== */}
        {activeTab === 'active' && (
          <div className="space-y-3.5 w-full min-w-0">
            
            {/* Search & Filters Toolbar */}
            <div className="bg-white p-3 rounded-xl border border-[#E8E0D9] shadow-2xs flex flex-col md:flex-row gap-2.5 justify-between items-stretch md:items-center w-full min-w-0">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-[#80736F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by order #, customer, phone, address..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8E0D9] text-xs text-[#302725] focus:outline-none focus:border-[#762F3D] transition"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#80736F] hover:text-[#302725]">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status and Priority Filters */}
              <div className="flex items-center gap-2 shrink-0">
                <Dropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'Assigned', label: 'Assigned' },
                    { value: 'Picked Up', label: 'Picked Up' },
                    { value: 'In Transit', label: 'In Transit' },
                    { value: 'Out for Delivery', label: 'Out for Delivery' },
                  ]}
                  size="sm"
                  className="w-32"
                  buttonClassName="bg-[#FAF7F2] text-xs font-semibold h-8 py-1"
                />

                <Dropdown
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={[
                    { value: 'all', label: 'All Priorities' },
                    { value: 'Urgent', label: 'Urgent Only' },
                    { value: 'High', label: 'High Priority' },
                    { value: 'Normal', label: 'Normal' },
                  ]}
                  size="sm"
                  className="w-32"
                  buttonClassName="bg-[#FAF7F2] text-xs font-semibold h-8 py-1"
                />

                {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPriorityFilter('all'); }}
                    className="h-8 px-2.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F3E6DF] text-[#762F3D] text-xs font-bold transition border border-[#E8E0D9]"
                    title="Reset Search and Filters"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Active Cards Grid */}
            {filteredActive.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-[#E8E0D9] shadow-2xs space-y-2 w-full min-w-0">
                <Truck className="w-10 h-10 text-[#C5A46D] mx-auto opacity-70" />
                <h3 className="font-serif text-base font-bold text-[#302725]">No Active Deliveries Match</h3>
                <p className="text-xs text-[#80736F] max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'No orders match your filter criteria. Try clearing search filters.'
                    : 'You currently have no active deliveries on route.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 w-full min-w-0">
                {filteredActive.map(del => renderCompactDeliveryCard(del, 'active'))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. TAB CONTENT: SCHEDULED STOPS                                */}
        {/* ============================================================== */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E0D9] shadow-2xs space-y-4 w-full min-w-0">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-3 min-w-0">
              <div>
                <h3 className="font-serif text-base font-bold text-[#302725]">Route Dispatch Schedule</h3>
                <p className="text-xs text-[#80736F]">Optimal sequential stop progression for today's deliveries</p>
              </div>
              <span className="bg-[#FAF7F2] text-[#762F3D] border border-[#E8E0D9] px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                {todayDeliveries.length} Stops
              </span>
            </div>

            {todayDeliveries.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Calendar className="w-8 h-8 text-[#C5A46D] mx-auto opacity-70" />
                <p className="text-xs font-semibold text-[#302725]">No deliveries scheduled for today</p>
                <p className="text-[11px] text-[#80736F]">New orders appear here automatically once assigned.</p>
              </div>
            ) : (
              <div className="space-y-2.5 w-full min-w-0">
                {todayDeliveries.map((del, index) => (
                  <div
                    key={del.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-[#E8E0D9] hover:border-[#762F3D]/40 transition bg-[#FAF7F2]/30 w-full min-w-0"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full bg-[#762F3D] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-[#762F3D]">{del.orderNumber}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] border font-bold ${getStatusBadge(del.status)}`}>
                            {del.status}
                          </span>
                          <span className="text-[10px] text-[#80736F]">
                            Window: <strong>{del.estimatedTime || 'Standard Route'}</strong>
                          </span>
                        </div>

                        <div className="font-bold text-xs text-[#302725]">{del.customerName}</div>
                        <div className="text-[11px] text-[#6B5E5B] truncate">{del.address}</div>

                        {del.instructions && (
                          <div className="text-[10px] italic text-amber-800 bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200/60 inline-block max-w-full truncate">
                            Note: {del.instructions}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => handleOpenContactModal(del.customerPhone, del.customerName, e)}
                        className="h-8 px-2.5 rounded-lg bg-white border border-[#E8E0D9] text-[#762F3D] hover:bg-[#FAF7F2] transition text-xs font-bold flex items-center gap-1 cursor-pointer select-none"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenMaps(del.address)}
                        className="h-8 px-2.5 rounded-lg bg-white border border-[#E8E0D9] text-blue-600 hover:bg-blue-50 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Navigate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. TAB CONTENT: COD COLLECTIONS (SECTION 7 SPECIFICATION)      */}
        {/* ============================================================== */}
        {activeTab === 'cod' && (
          <div className="space-y-4 w-full min-w-0">

            {/* 4 Compact COD Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full min-w-0">
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E0D9] shadow-2xs space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#80736F] block truncate">
                  Total Outstanding COD
                </span>
                <div className="text-lg sm:text-xl font-bold text-amber-900 truncate">
                  Rs. {stats.codPending.toLocaleString()}
                </div>
                <span className="text-[10px] text-amber-700 block truncate">To collect from customers</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 block truncate">
                  Cash Collected in Hand
                </span>
                <div className="text-lg sm:text-xl font-bold text-emerald-900 truncate">
                  Rs. {stats.codCollected.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-700 block truncate">Ready for store remittance</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E8E0D9] shadow-2xs space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#80736F] block truncate">
                  Pending Collections
                </span>
                <div className="text-lg sm:text-xl font-bold text-[#302725] truncate">
                  {pendingCodOrdersCount} orders
                </div>
                <span className="text-[10px] text-[#80736F] block truncate">Uncollected doorstep orders</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E8E0D9] shadow-2xs space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#80736F] block truncate">
                  Remitted Collections
                </span>
                <div className="text-lg sm:text-xl font-bold text-emerald-800 truncate">
                  {collectedCodDeliveries.length} orders
                </div>
                <span className="text-[10px] text-emerald-700 block truncate">Reconciled shift receipts</span>
              </div>
            </div>

            {/* COD Table Container */}
            <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-2xs overflow-hidden w-full min-w-0">
              
              {/* Table Controls Header */}
              <div className="p-3.5 border-b border-[#E8E0D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#302725]">COD Order Ledger</h3>
                  <p className="text-xs text-[#80736F]">Doorstep cash collection and remittance verification</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Dropdown
                    value={codStatusFilter}
                    onChange={setCodStatusFilter}
                    options={[
                      { value: 'all', label: 'All COD Statuses' },
                      { value: 'pending', label: 'Pending Only' },
                      { value: 'collected', label: 'Collected Only' },
                    ]}
                    size="sm"
                    className="w-36"
                    buttonClassName="bg-[#FAF7F2] text-xs font-semibold h-8 py-1"
                  />
                </div>
              </div>

              {filteredCodDeliveries.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#80736F]">
                  No COD orders found matching criteria.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] font-bold text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3.5">Order #</th>
                        <th className="py-2.5 px-3.5">Customer</th>
                        <th className="py-2.5 px-3.5">Delivery Address</th>
                        <th className="py-2.5 px-3.5">COD Due</th>
                        <th className="py-2.5 px-3.5">Collected</th>
                        <th className="py-2.5 px-3.5">Status</th>
                        <th className="py-2.5 px-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D9]/60">
                      {filteredCodDeliveries.map(del => {
                        const isFullyPaid = (del.codAmountCollected || 0) >= (del.codAmountDue || del.totalAmount || 0) || del.status === 'Delivered';

                        return (
                          <tr key={del.id} className="hover:bg-[#FAF7F2]/40 transition">
                            <td className="py-2.5 px-3.5 font-mono font-bold text-[#762F3D]">{del.orderNumber}</td>
                            <td className="py-2.5 px-3.5">
                              <div className="font-bold text-[#302725]">{del.customerName}</div>
                              <button
                                type="button"
                                onClick={(e) => handleOpenContactModal(del.customerPhone, del.customerName, e)}
                                className="text-[10px] text-[#80736F] hover:text-[#762F3D] hover:underline flex items-center gap-1 transition"
                              >
                                <Phone className="w-2.5 h-2.5 text-[#762F3D]" />
                                <span>{del.customerPhone}</span>
                              </button>
                            </td>
                            <td className="py-2.5 px-3.5 max-w-xs truncate text-[#6B5E5B]">{del.address}</td>
                            <td className="py-2.5 px-3.5 font-bold text-[#302725]">
                              Rs. {(del.codAmountDue || del.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-emerald-700">
                              Rs. {(del.codAmountCollected || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3.5">
                              {isFullyPaid ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  ✓ Cash Collected
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Pending Collection
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              {isFullyPaid ? (
                                <span className="text-[11px] text-emerald-700 font-bold">Collected</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCodModal(del)}
                                  className="h-7 px-2.5 rounded-lg bg-[#FAF7F2] hover:bg-[#762F3D] text-[#762F3D] hover:text-white border border-[#E8E0D9] text-xs font-bold transition cursor-pointer"
                                >
                                  Record Cash
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 6. TAB CONTENT: COLLECTION HISTORY & REMITTANCE                */}
        {/* ============================================================== */}
        {activeTab === 'collectionsHistory' && (
          <div className="space-y-4 w-full min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full min-w-0">
              <div className="bg-white p-3.5 rounded-xl border border-[#E8E0D9] shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Total Remitted Today</span>
                <div className="font-serif text-xl font-bold text-emerald-700">
                  Rs. {stats.codCollected.toLocaleString()}
                </div>
                <p className="text-[10px] text-[#80736F]">Cash collected & verified</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E8E0D9] shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Collected Orders Count</span>
                <div className="font-serif text-xl font-bold text-[#302725]">
                  {collectedCodDeliveries.length} orders
                </div>
                <p className="text-[10px] text-[#80736F]">Successful doorstep receipts</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#E8E0D9] shadow-2xs space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Collection Integrity</span>
                <div className="font-serif text-xl font-bold text-[#762F3D]">100%</div>
                <p className="text-[10px] text-emerald-700 font-semibold">Zero cash discrepancies</p>
              </div>
            </div>

            {/* Collection History Table */}
            <div className="bg-white rounded-2xl border border-[#E8E0D9] shadow-2xs overflow-hidden w-full min-w-0">
              <div className="p-3.5 border-b border-[#E8E0D9]">
                <h3 className="font-serif font-bold text-base text-[#302725]">Doorstep COD Remittance History</h3>
                <p className="text-xs text-[#80736F]">Detailed transaction ledger of cash collected by {currentUser.name || 'Bilal Raza'}</p>
              </div>

              {collectedCodDeliveries.length === 0 ? (
                <div className="p-8 text-center text-[#80736F] text-xs">
                  No COD collections recorded for this shift yet.
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#E8E0D9] text-[#80736F] uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-2.5 px-3.5">Order #</th>
                        <th className="py-2.5 px-3.5">Customer</th>
                        <th className="py-2.5 px-3.5">Amount Collected</th>
                        <th className="py-2.5 px-3.5">Payment Method</th>
                        <th className="py-2.5 px-3.5">Proof Note</th>
                        <th className="py-2.5 px-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E0D9]/60">
                      {collectedCodDeliveries.map(del => (
                        <tr key={del.id} className="hover:bg-[#FAF7F2]/40 transition">
                          <td className="py-2.5 px-3.5 font-mono font-bold text-[#762F3D]">{del.orderNumber}</td>
                          <td className="py-2.5 px-3.5">
                            <div className="font-bold text-[#302725]">{del.customerName}</div>
                            <div className="text-[10px] text-[#80736F]">{del.customerPhone}</div>
                          </td>
                          <td className="py-2.5 px-3.5 font-serif font-bold text-emerald-800">
                            Rs. {(del.codAmountCollected || del.codAmountDue || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3.5 text-[#6B5E5B]">{del.paymentMethod}</td>
                          <td className="py-2.5 px-3.5 text-[#6B5E5B]">{del.proofOfDelivery || 'Customer signature verified'}</td>
                          <td className="py-2.5 px-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Reconciled & Remitted
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 7. TAB CONTENT: DELIVERY HISTORY                               */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-3.5 w-full min-w-0">
            {/* Search bar */}
            <div className="bg-white p-3 rounded-xl border border-[#E8E0D9] shadow-2xs flex flex-col sm:flex-row gap-2.5 justify-between items-center w-full min-w-0">
              <div className="relative flex-1 w-full min-w-0">
                <Search className="w-3.5 h-3.5 text-[#80736F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search history by order #, customer, phone, or address..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8E0D9] text-xs text-[#302725] focus:outline-none focus:border-[#762F3D] transition"
                />
              </div>

              <Dropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Outcomes' },
                  { value: 'Delivered', label: 'Delivered Only' },
                  { value: 'Failed Delivery', label: 'Failed Attempts' },
                ]}
                size="sm"
                className="w-36"
                buttonClassName="bg-[#FAF7F2] text-xs font-semibold h-8 py-1"
              />
            </div>

            {/* History List */}
            {filteredHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-[#E8E0D9] shadow-2xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#C5A46D] mx-auto opacity-70" />
                <h3 className="font-serif text-base font-bold text-[#302725]">No History Records Found</h3>
                <p className="text-xs text-[#80736F]">Completed deliveries will appear here with proof notes and timestamps.</p>
              </div>
            ) : (
              <div className="space-y-2.5 w-full min-w-0">
                {filteredHistory.map(del => (
                  <div
                    key={del.id}
                    className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E0D9] shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full min-w-0"
                  >
                    <div className="space-y-1 text-xs flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[#762F3D]">{del.orderNumber}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] border font-bold ${getStatusBadge(del.status)}`}>
                          {del.status}
                        </span>
                        <span className="text-[#80736F] text-[10px]">Completed: {del.completedAt || del.scheduledAt || 'Today'}</span>
                      </div>

                      <div className="font-bold text-xs text-[#302725] flex items-center gap-1.5 flex-wrap">
                        <span>{del.customerName}</span>
                        <button
                          type="button"
                          onClick={(e) => handleOpenContactModal(del.customerPhone, del.customerName, e)}
                          className="text-[11px] text-[#80736F] hover:text-[#762F3D] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Phone className="w-2.5 h-2.5 text-[#762F3D]" />
                          <span>({del.customerPhone})</span>
                        </button>
                      </div>
                      <div className="text-[#6B5E5B] truncate">{del.address}</div>

                      {del.recipientName && (
                        <div className="text-[10px] text-emerald-800 font-medium">
                          ✓ Received by: <strong>{del.recipientName}</strong> {del.proofOfDelivery ? `(${del.proofOfDelivery})` : ''}
                        </div>
                      )}

                      {del.failedReason && (
                        <div className="text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Reason: {del.failedReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <div className="text-right">
                        <div className="font-bold text-xs text-[#302725]">Rs. {(del.totalAmount || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-[#80736F]">{del.paymentMethod}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(del)}
                        className="h-8 px-3 rounded-lg bg-[#FAF7F2] hover:bg-[#762F3D] text-[#762F3D] hover:text-white border border-[#E8E0D9] text-xs font-bold transition cursor-pointer"
                      >
                        Audit Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* 8. MODAL: DELIVERY CONFIRMATION (COMPACT SAAS DIALOG)           */}
      {/* ============================================================== */}
      {isConfirmModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 space-y-4 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#302725]">Confirm Delivery Completion</h3>
                  <p className="text-[11px] text-[#80736F]">{selectedDelivery.orderNumber} • {selectedDelivery.customerName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-[#80736F] hover:text-[#302725] p-1 rounded-lg hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#302725] mb-1">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={confirmRecipientName}
                  onChange={e => setConfirmRecipientName(e.target.value)}
                  placeholder="Person who physically received the package..."
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E0D9] bg-[#FAF7F2] text-[#302725] focus:outline-none focus:border-[#762F3D] font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#302725] mb-1">Proof / Relationship</label>
                <select
                  value={confirmProof}
                  onChange={e => setConfirmProof(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E0D9] bg-[#FAF7F2] text-[#302725] focus:outline-none focus:border-[#762F3D] font-medium"
                >
                  <option value="Customer in Person (Self)">Customer in Person (Self)</option>
                  <option value="Family Member / Relative">Family Member / Relative</option>
                  <option value="Security Guard / Gate Post">Security Guard / Gate Post</option>
                  <option value="Domestic Staff / Housekeeper">Domestic Staff / Housekeeper</option>
                  <option value="Reception / Office Front Desk">Reception / Office Front Desk</option>
                  <option value="Signed delivery receipt">Signed delivery receipt</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#302725] mb-1">Delivery Notes</label>
                <textarea
                  rows={2}
                  value={confirmNotes}
                  onChange={e => setConfirmNotes(e.target.value)}
                  placeholder="E.g. Verified fresh, handed over with candle set..."
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E8E0D9] bg-[#FAF7F2] text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              {/* If COD order, cash collection confirmation */}
              {Boolean(selectedDelivery.codAmountDue && selectedDelivery.codAmountDue > 0) && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-900">Cash on Delivery Required:</span>
                    <span className="font-bold text-sm text-[#762F3D]">Rs. {(selectedDelivery.codAmountDue || 0).toLocaleString()}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-200/60">
                    <input
                      type="checkbox"
                      checked={confirmCollectCod}
                      onChange={e => setConfirmCollectCod(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#762F3D] rounded border-[#E8E0D9]"
                    />
                    <span className="text-[11px] font-semibold text-amber-900">
                      I confirm exact cash was collected and counted from customer
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="h-8 px-3 rounded-lg border border-[#E8E0D9] hover:bg-[#FAF7F2] text-[#302725] font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingConfirm}
                  className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingConfirm ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Confirm Delivery</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. MODAL: REPORT FAILED DELIVERY (COMPACT SAAS DIALOG)         */}
      {/* ============================================================== */}
      {isFailModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 space-y-3.5 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#302725]">Report Delivery Issue</h3>
                  <p className="text-[11px] text-[#80736F]">{selectedDelivery.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsFailModalOpen(false)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFailSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#302725] mb-1">Reason for Failure</label>
                <select
                  value={failReason}
                  onChange={e => setFailReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E0D9] bg-[#FAF7F2] text-[#302725] font-semibold"
                >
                  <option value="Customer unreachable by phone">Customer unreachable by phone (multiple attempts)</option>
                  <option value="Gate locked / Security denied access">Gate locked / Security guard denied entry</option>
                  <option value="Wrong delivery address provided">Wrong delivery address provided</option>
                  <option value="Customer refused package / cancelled">Customer refused package / cancelled</option>
                  <option value="Customer requested rescheduled time">Customer requested rescheduled time slot</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#302725] mb-1">Attempt Details</label>
                <textarea
                  rows={2}
                  value={failNotes}
                  onChange={e => setFailNotes(e.target.value)}
                  placeholder="Explain attempt details (e.g. called 3 times, waited 10 mins at gate)..."
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E8E0D9] bg-[#FAF7F2] text-[#302725]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setIsFailModalOpen(false)}
                  className="h-8 px-3 rounded-lg border border-[#E8E0D9] text-[#302725] font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFail}
                  className="h-8 px-3.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition"
                >
                  {isSubmittingFail ? 'Saving...' : 'Mark as Failed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. MODAL: COD CASH COLLECTION FORM                            */}
      {/* ============================================================== */}
      {isCodModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 sm:p-5 space-y-3.5 border border-[#E8E0D9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#E8E0D9] pb-2.5">
              <h3 className="font-serif text-base font-bold text-[#302725]">Record Cash Collection</h3>
              <button onClick={() => setIsCodModalOpen(false)} className="text-[#80736F] hover:text-[#302725]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCodSubmit} className="space-y-3 text-xs">
              <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#E8E0D9] space-y-1">
                <div className="text-[#80736F]">Order: <span className="font-bold text-[#302725]">{selectedDelivery.orderNumber}</span></div>
                <div className="text-[#80736F]">Customer: <span className="font-bold text-[#302725]">{selectedDelivery.customerName}</span></div>
                <div className="text-[#80736F]">Amount Due: <span className="font-bold text-[#762F3D]">Rs. {(selectedDelivery.codAmountDue || selectedDelivery.totalAmount || 0).toLocaleString()}</span></div>
              </div>

              <div>
                <label className="block font-bold text-[#302725] mb-1">Amount Collected (PKR)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={codAmountInput}
                  onChange={e => setCodAmountInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E0D9] bg-[#FAF7F2] font-bold text-sm text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E0D9]">
                <button
                  type="button"
                  onClick={() => setIsCodModalOpen(false)}
                  className="h-8 px-3 rounded-lg border border-[#E8E0D9] text-[#302725] font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCod}
                  className="h-8 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {isSubmittingCod ? 'Recording...' : 'Save Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 11. MODAL: COMPLETE DELIVERY AUDIT DETAILS (SECTION 6)         */}
      {/* ============================================================== */}
      {isDetailsModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 border border-[#E8E0D9] shadow-2xl max-h-[88vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start border-b border-[#E8E0D9] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-[#762F3D]">{selectedDelivery.orderNumber}</span>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedDelivery.status)}`}>
                    {selectedDelivery.status}
                  </span>
                </div>
                <p className="text-xs text-[#80736F] mt-0.5">Assigned Courier: {selectedDelivery.assignedStaff || 'Bilal Raza'} • MM Alam Branch</p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-[#80736F] hover:text-[#302725] p-1 rounded-lg hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Destination Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Customer Details</span>
                <div className="font-bold text-xs text-[#302725]">{selectedDelivery.customerName}</div>
                <button
                  type="button"
                  onClick={(e) => handleOpenContactModal(selectedDelivery.customerPhone, selectedDelivery.customerName, e)}
                  className="flex items-center gap-1.5 text-[#762F3D] font-semibold hover:underline cursor-pointer"
                >
                  <Phone className="w-3 h-3 text-[#762F3D]" />
                  <span>{selectedDelivery.customerPhone}</span>
                </button>
                {selectedDelivery.customerEmail && (
                  <div className="text-[10px] text-[#80736F] truncate">{selectedDelivery.customerEmail}</div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Destination Address</span>
                <div className="text-[11px] text-[#302725] leading-relaxed break-words">{selectedDelivery.address}</div>
                <button
                  onClick={() => handleOpenMaps(selectedDelivery.address)}
                  className="text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer pt-0.5 text-[11px]"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Open in Google Maps</span>
                </button>
              </div>
            </div>

            {/* Special Instructions Callout */}
            {selectedDelivery.instructions && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="break-words"><strong>Courier Instructions:</strong> {selectedDelivery.instructions}</span>
              </div>
            )}

            {/* Itemized Bakery Package */}
            {selectedDelivery.items && selectedDelivery.items.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Package Contents</span>
                <div className="border border-[#E8E0D9] rounded-xl overflow-hidden divide-y divide-[#E8E0D9]/70 text-xs">
                  {selectedDelivery.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center bg-white">
                      <div>
                        <span className="font-bold text-[#302725]">{item.quantity}x {item.name}</span>
                        {item.variant && <span className="text-[#80736F] ml-1">({item.variant})</span>}
                      </div>
                      <span className="font-semibold text-[#80736F]">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="p-2.5 bg-[#FAF7F2] flex justify-between items-center font-bold text-xs">
                    <span>Total Order Amount</span>
                    <span className="text-[#762F3D]">Rs. {(selectedDelivery.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Trail Timeline */}
            {selectedDelivery.timeline && selectedDelivery.timeline.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#80736F]">Status Progression Timeline</span>
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-2 text-xs">
                  {selectedDelivery.timeline.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#762F3D] mt-1.5 shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#302725]">{event.status}</span>
                          <span className="text-[10px] text-[#80736F]">{event.timestamp}</span>
                        </div>
                        <p className="text-[10px] text-[#80736F]">Logged by {event.updatedBy}</p>
                        {event.notes && <p className="text-[#302725] italic text-[11px] mt-0.5">{event.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E0D9]">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="h-8 px-4 rounded-lg bg-[#FAF7F2] hover:bg-[#E8E0D9] text-[#302725] text-xs font-bold transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MODAL: CUSTOMER CONTACT CONFIRMATION (CENTERED) */}
      <CustomerContactModal
        isOpen={contactModalData.isOpen}
        customerName={contactModalData.customerName}
        customerPhone={contactModalData.customerPhone}
        onClose={handleCloseContactModal}
      />

    </PortalLayout>
  );
};
