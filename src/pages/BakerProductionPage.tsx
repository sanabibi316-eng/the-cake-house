import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Dropdown } from '../components/Dropdown';
import { ProductionTask, InventoryItem, ProductionKanbanStatus, ProductionActivity, getProductionKanbanStatus, getProductionActivity } from '../types';
import { PortalLayout, PortalSidebarSection } from '../components/PortalLayout';
import {
  ChefHat,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  AlertTriangle,
  Calendar,
  Flame,
  Layers,
  FileText,
  Eye,
  X,
  Check,
  AlertCircle,
  PackageCheck,
  Wheat,
  Send,
  Info,
  Timer,
  UtensilsCrossed,
  ArrowRight,
  TrendingUp,
  Maximize2,
  ChevronRight,
  BadgeAlert,
  Cake,
  Boxes,
  User as UserIcon,
  Bell,
  LogOut,
  LayoutDashboard,
  Play,
  Lock,
  Key,
  Camera,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

interface BakerStats {
  totalAssigned: number;
  pending: number;
  inPreparation: number;
  completed: number;
  overdue: number;
  todayScheduleCount: number;
  lowStockIngredientsCount: number;
  recentTasks?: ProductionTask[];
}

export type BakerTabType = 'dashboard' | 'assigned' | 'active' | 'upcoming' | 'completed' | 'history' | 'profile' | 'notifications';

export const BakerProductionPage: React.FC = () => {
  const {
    currentUser,
    token,
    orders,
    products,
    productionTasks,
    updateProductionStage,
    updateProductionKanban,
    refetchProductionTasks,
    refetchOrders,
    inventory,
    restockRequests,
    fetchRestockRequests,
    showToast,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    refetchNotifications,
    updateProfile,
    changePassword,
    logout,
    setCurrentView
  } = useApp();

  // Active Main Navigation Tab (with direct URL hash & localStorage persistence)
  const [activeTab, setActiveTab] = useState<BakerTabType>(() => {
    try {
      const hash = window.location.hash.replace('#', '') as BakerTabType;
      const validTabs: BakerTabType[] = ['dashboard', 'assigned', 'active', 'completed', 'history', 'profile', 'notifications'];
      if (validTabs.includes(hash)) return hash;
      const saved = localStorage.getItem('th_baker_active_tab') as BakerTabType;
      if (validTabs.includes(saved)) return saved;
    } catch {}
    return 'dashboard';
  });

  const handleTabChange = (tabId: string) => {
    if (tabId === 'logout') {
      logout();
      setCurrentView('home');
      return;
    }
    const validTabs: BakerTabType[] = ['dashboard', 'assigned', 'active', 'completed', 'history', 'profile', 'notifications'];
    if (validTabs.includes(tabId as BakerTabType)) {
      setActiveTab(tabId as BakerTabType);
      try {
        localStorage.setItem('th_baker_active_tab', tabId);
        window.location.hash = tabId;
      } catch {}
    }
  };

  // Dynamic Baker Stats
  const [bakerStats, setBakerStats] = useState<BakerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters for Assigned Tasks Tab
  const [assignedSearch, setAssignedSearch] = useState('');
  const [assignedPriority, setAssignedPriority] = useState('all');

  // Filters for In Progress Tasks Tab
  const [inProgressSearch, setInProgressSearch] = useState('');
  const [inProgressActivity, setInProgressActivity] = useState('all');
  const [inProgressPriority, setInProgressPriority] = useState('all');

  // Filters for Ready Tasks Tab
  const [readySearch, setReadySearch] = useState('');

  // Filters for History Tab
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Modals State
  const [selectedTaskForSpecs, setSelectedTaskForSpecs] = useState<ProductionTask | null>(null);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockIngredientName, setRestockIngredientName] = useState('');
  const [restockQuantityNeeded, setRestockQuantityNeeded] = useState('');
  const [restockUrgency, setRestockUrgency] = useState<'Normal' | 'High' | 'Critical'>('High');
  const [restockNotes, setRestockNotes] = useState('');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [bakerStockTab, setBakerStockTab] = useState<'stock' | 'requests'>('stock');
  const [bakerStockSearch, setBakerStockSearch] = useState('');

  // Profile Form States
  const [profileName, setProfileName] = useState(currentUser.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatar || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sync profile form state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notifications Page States
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [notifSearch, setNotifSearch] = useState('');

  // Unread notification count
  const unreadNotifCount = useMemo(() => {
    return (notifications || []).filter(n => !n.read).length;
  }, [notifications]);

  // Formatted joining date
  const joinDateDisplay = useMemo(() => {
    if (currentUser.createdAt) {
      try {
        return new Date(currentUser.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {}
    }
    return 'Artisanal Kitchen Staff';
  }, [currentUser.createdAt]);

  // Filtered Notifications List
  const displayedNotifications = useMemo(() => {
    return (notifications || []).filter(n => {
      if (notifFilter === 'unread' && n.read) return false;
      if (notifSearch.trim()) {
        const query = notifSearch.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(query);
        const matchesMsg = n.message?.toLowerCase().includes(query);
        const matchesOrder = n.orderNumber?.toLowerCase().includes(query);
        return Boolean(matchesTitle || matchesMsg || matchesOrder);
      }
      return true;
    });
  }, [notifications, notifFilter, notifSearch]);

  // Profile Save Action
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    // Pakistani phone format validation
    const cleanedPhone = profilePhone.replace(/[\s\-\(\)]/g, '');
    const isPakPhone = /^((\+92)|(0092)|(92)|0)?3[0-9]{9}$/.test(cleanedPhone);
    if (cleanedPhone && !isPakPhone && cleanedPhone.length < 10) {
      setProfileError('Please enter a valid Pakistani phone number (e.g., 0300 1234567 or +92 300 1234567).');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await updateProfile({
        name: profileName.trim(),
        phone: profilePhone.trim(),
        avatar: profileAvatar.trim()
      });

      if (res.success) {
        setProfileSuccess('Profile details saved successfully to database!');
        showToast('Profile updated successfully!', 'success');
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Change Action
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await changePassword({
        currentPassword,
        newPassword
      });

      if (res.success) {
        setPasswordSuccess('Password changed successfully!');
        showToast('Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      } else {
        setPasswordError(res.error || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error occurred while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Navigate to task from notification
  const handleNavigateToNotificationTask = (orderRef?: string) => {
    if (!orderRef) return;
    const cleanRef = orderRef.trim().toLowerCase();

    // Look for matching task in assigned, in progress, or ready
    const inAssigned = allAssignedTasks.find(t => 
      (t.orderNumber && t.orderNumber.toLowerCase().includes(cleanRef)) ||
      (t.id && t.id.toLowerCase().includes(cleanRef)) ||
      (t.orderId && t.orderId.toLowerCase().includes(cleanRef))
    );
    if (inAssigned) {
      setAssignedSearch(orderRef);
      handleTabChange('assigned');
      return;
    }

    const inProgress = allInProgressTasks.find(t => 
      (t.orderNumber && t.orderNumber.toLowerCase().includes(cleanRef)) ||
      (t.id && t.id.toLowerCase().includes(cleanRef)) ||
      (t.orderId && t.orderId.toLowerCase().includes(cleanRef))
    );
    if (inProgress) {
      setInProgressSearch(orderRef);
      handleTabChange('active');
      return;
    }

    const inReady = allReadyTasks.find(t => 
      (t.orderNumber && t.orderNumber.toLowerCase().includes(cleanRef)) ||
      (t.id && t.id.toLowerCase().includes(cleanRef)) ||
      (t.orderId && t.orderId.toLowerCase().includes(cleanRef))
    );
    if (inReady) {
      setReadySearch(orderRef);
      handleTabChange('completed');
      return;
    }

    // Default to active tab
    handleTabChange('active');
  };

  // Fetch Live Baker Stats from Backend
  const fetchBakerStats = async () => {
    try {
      setStatsLoading(true);
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/baker/stats', { headers });
      if (res.ok) {
        const data = await res.json();
        setBakerStats(data);
      }
    } catch (e) {
      console.warn('Failed to load baker stats:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  // Automatic Data Synchronization on Mount
  useEffect(() => {
    fetchBakerStats();
    refetchProductionTasks();
    if (refetchOrders) refetchOrders();
  }, [token]);

  // Seamlessly synchronize when baker returns to an inactive browser tab or window
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchBakerStats();
        refetchProductionTasks();
        if (refetchOrders) refetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [token]);

  // Restock Request Submission Handler
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockIngredientName.trim()) {
      showToast('Please specify an ingredient name', 'error');
      return;
    }

    try {
      setIsSubmittingRestock(true);
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/baker/ingredient-request', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ingredientName: restockIngredientName.trim(),
          quantityNeeded: restockQuantityNeeded.trim(),
          urgency: restockUrgency,
          notes: restockNotes.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Restock alert sent successfully', 'success');
        setRestockModalOpen(false);
        setRestockIngredientName('');
        setRestockQuantityNeeded('');
        setRestockNotes('');
        await fetchRestockRequests();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to submit restock request', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Restock request submission error', 'error');
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Strict Baker Scoping: Each Baker sees ONLY orders assigned to their own authenticated employee account
  const myAssignedTasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return productionTasks;
    return productionTasks.filter(task => {
      const idMatch = Boolean(task.assignedBakerId && task.assignedBakerId === currentUser.id);
      const nameMatch = Boolean(task.assignedBaker && currentUser.name && task.assignedBaker.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
      return idMatch || nameMatch;
    });
  }, [productionTasks, currentUser]);

  // Base Category Lists (Single Source of Truth for authenticated Baker)
  const allAssignedTasks = useMemo(() => {
    return myAssignedTasks.filter(t => getProductionKanbanStatus(t) === 'Assigned');
  }, [myAssignedTasks]);

  const allInProgressTasks = useMemo(() => {
    return myAssignedTasks.filter(t => getProductionKanbanStatus(t) === 'In Progress');
  }, [myAssignedTasks]);

  const allReadyTasks = useMemo(() => {
    return myAssignedTasks.filter(t => getProductionKanbanStatus(t) === 'Ready');
  }, [myAssignedTasks]);

  // Filtered lists for each individual tab
  const displayedAssignedTasks = useMemo(() => {
    return allAssignedTasks.filter(t => {
      const q = assignedSearch.toLowerCase();
      const matchSearch = !q ||
        t.productName.toLowerCase().includes(q) ||
        (t.orderNumber && t.orderNumber.toLowerCase().includes(q)) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.cakeSpecs?.flavor && t.cakeSpecs.flavor.toLowerCase().includes(q)) ||
        (t.specifications && t.specifications.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      const matchPriority = assignedPriority === 'all' || t.priority === assignedPriority;
      return matchSearch && matchPriority;
    });
  }, [allAssignedTasks, assignedSearch, assignedPriority]);

  const displayedInProgressTasks = useMemo(() => {
    return allInProgressTasks.filter(t => {
      const q = inProgressSearch.toLowerCase();
      const matchSearch = !q ||
        t.productName.toLowerCase().includes(q) ||
        (t.orderNumber && t.orderNumber.toLowerCase().includes(q)) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.cakeSpecs?.flavor && t.cakeSpecs.flavor.toLowerCase().includes(q)) ||
        (t.specifications && t.specifications.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      const matchPriority = inProgressPriority === 'all' || t.priority === inProgressPriority;
      const act = getProductionActivity(t);
      const matchActivity = inProgressActivity === 'all' || 
        act === inProgressActivity || 
        (inProgressActivity === 'Preparing' && act === 'None');
      return matchSearch && matchPriority && matchActivity;
    });
  }, [allInProgressTasks, inProgressSearch, inProgressPriority, inProgressActivity]);

  const displayedReadyTasks = useMemo(() => {
    return allReadyTasks.filter(t => {
      const q = readySearch.toLowerCase();
      return !q ||
        t.productName.toLowerCase().includes(q) ||
        (t.orderNumber && t.orderNumber.toLowerCase().includes(q)) ||
        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
        (t.cakeSpecs?.flavor && t.cakeSpecs.flavor.toLowerCase().includes(q));
    });
  }, [allReadyTasks, readySearch]);

  // Completed Tasks for Production History
  const completedTasks = useMemo(() => {
    return myAssignedTasks.filter(task => {
      if (getProductionKanbanStatus(task) !== 'Ready') return false;
      const matchesSearch =
        task.productName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (task.orderNumber && task.orderNumber.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
        (task.customerName && task.customerName.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
        (task.cakeSpecs?.personalMessage && task.cakeSpecs.personalMessage.toLowerCase().includes(historySearchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [myAssignedTasks, historySearchQuery]);

  // Action Handlers
  const handleStartProduction = async (task: ProductionTask) => {
    try {
      setUpdatingTaskId(task.id);
      const ok = await updateProductionKanban(task.id, {
        kanbanStatus: 'In Progress',
        currentActivity: 'Preparing'
      });
      if (ok) {
        await fetchBakerStats();
        await refetchProductionTasks();
        if (refetchOrders) await refetchOrders();
        showToast(`Started production on ${task.orderNumber || task.productName}`, 'success');
        if (selectedTaskForSpecs && selectedTaskForSpecs.id === task.id) {
          setSelectedTaskForSpecs(prev => prev ? { ...prev, kanbanStatus: 'In Progress', currentActivity: 'Preparing' } : null);
        }
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to start production', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleUpdateActivity = async (task: ProductionTask, activity: ProductionActivity) => {
    try {
      setUpdatingTaskId(task.id);
      const ok = await updateProductionKanban(task.id, {
        kanbanStatus: 'In Progress',
        currentActivity: activity
      });
      if (ok) {
        await fetchBakerStats();
        await refetchProductionTasks();
        showToast(`Activity updated: ${activity}`, 'success');
        if (selectedTaskForSpecs && selectedTaskForSpecs.id === task.id) {
          setSelectedTaskForSpecs(prev => prev ? { ...prev, currentActivity: activity } : null);
        }
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to update activity', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleMarkReady = async (task: ProductionTask) => {
    try {
      setUpdatingTaskId(task.id);
      const ok = await updateProductionKanban(task.id, {
        kanbanStatus: 'Ready',
        currentActivity: 'Ready'
      });
      if (ok) {
        await fetchBakerStats();
        await refetchProductionTasks();
        if (refetchOrders) await refetchOrders();
        showToast(`Order ${task.orderNumber || task.productName} marked as Ready!`, 'success');
        if (selectedTaskForSpecs && selectedTaskForSpecs.id === task.id) {
          setSelectedTaskForSpecs(prev => prev ? { ...prev, kanbanStatus: 'Ready', currentActivity: 'Ready', stage: 'Completed' } : null);
        }
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to mark ready', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Helper Functions for Data Resolution
  const getProductImage = (task: ProductionTask) => {
    if (task.referenceImage) return task.referenceImage;
    const linkedOrder = orders?.find(o => o.id === task.orderId || o.orderNumber === task.orderNumber);
    const productObj = products?.find(p => p.name === task.productName || linkedOrder?.items?.some(it => it.name === p.name));
    return productObj?.images?.[0] || linkedOrder?.items?.[0]?.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80';
  };

  const getCustomerName = (task: ProductionTask) => {
    if (task.customerName) return task.customerName;
    const linkedOrder = orders?.find(o => o.id === task.orderId || o.orderNumber === task.orderNumber);
    return linkedOrder?.customerName || 'Valued Customer';
  };

  const getOrderDate = (task: ProductionTask) => {
    if (task.orderDate) return task.orderDate;
    const linkedOrder = orders?.find(o => o.id === task.orderId || o.orderNumber === task.orderNumber);
    if (linkedOrder?.createdAt) {
      try {
        return new Date(linkedOrder.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return linkedOrder.createdAt;
      }
    }
    return 'Today';
  };

  const isOverdue = (task: ProductionTask) => {
    if (getProductionKanbanStatus(task) === 'Ready') return false;
    if (!task.deadline) return false;
    return new Date(task.deadline).getTime() < Date.now();
  };

  // Stage Progress Helpers
  const getStageBadge = (stage: ProductionTask['stage']) => {
    switch (stage) {
      case 'Queued': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'In Preparation': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Baking': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Decorating': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Quality Check': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'Urgent') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
          Urgent
        </span>
      );
    }
    if (priority === 'High') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-200">
          <span>⚡</span> High
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
        Normal
      </span>
    );
  };

  // Sidebar Configuration
  const sidebarSections: PortalSidebarSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Flame }
      ]
    },
    {
      title: 'Production',
      items: [
        { id: 'assigned', label: 'Assigned Tasks', icon: UtensilsCrossed, badge: allAssignedTasks.length || null },
        { id: 'active', label: 'In Progress Tasks', icon: Flame, badge: allInProgressTasks.length || null, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'completed', label: 'Ready Tasks', icon: CheckCircle2, badge: allReadyTasks.length || null, badgeColor: 'bg-emerald-100 text-emerald-800' },
        { id: 'history', label: 'Production History', icon: PackageCheck }
      ]
    },
    {
      title: 'Account',
      items: [
        { id: 'profile', label: 'My Profile', icon: UserIcon },
        { 
          id: 'notifications', 
          label: 'Notifications', 
          icon: Bell, 
          badge: unreadNotifCount > 0 ? unreadNotifCount : null,
          badgeColor: 'bg-[#5C1A24] text-white' 
        },
        { id: 'logout', label: 'Logout', icon: LogOut, danger: true }
      ]
    }
  ];

  return (
    <PortalLayout
      portalName="Baker Production"
      portalBadge="Artisanal Kitchen"
      portalSubtitle={`Kitchen Production & Order Fulfillment • ${currentUser.name || 'Chef Tariq'} • MM Alam Deck Oven #1`}
      sidebarSections={sidebarSections}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      headerActions={
        <button
          type="button"
          onClick={() => {
            setRestockIngredientName('');
            setRestockQuantityNeeded('');
            setRestockNotes('');
            setRestockModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Wheat className="w-4 h-4 text-[#C5A46D]" />
          <span>Request Restock</span>
        </button>
      }
    >
      <div className="space-y-6">

        {/* ============================================================== */}
        {/* TAB 1: BAKER DASHBOARD (OVERVIEW)                              */}
        {/* ============================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 3 Dynamic Metric KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab('assigned')}
                className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs cursor-pointer hover:border-sky-500 hover:shadow-md transition group"
              >
                <div className="flex justify-between items-center text-[#80736F] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-sky-700">Assigned Tasks</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#302725]">
                  {allAssignedTasks.length}
                </div>
                <p className="text-[11px] text-[#80736F] mt-1 flex items-center gap-1 group-hover:text-sky-700 font-medium">
                  <span>Waiting to start production</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>

              <div
                onClick={() => setActiveTab('active')}
                className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs cursor-pointer hover:border-amber-500 hover:shadow-md transition group"
              >
                <div className="flex justify-between items-center text-[#80736F] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-amber-700">In Progress Tasks</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-amber-700">
                  {allInProgressTasks.length}
                </div>
                <p className="text-[11px] text-[#80736F] mt-1 flex items-center gap-1 group-hover:text-amber-700 font-medium">
                  <span>Preparing, baking, decorating</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>

              <div
                onClick={() => setActiveTab('completed')}
                className="bg-white p-5 rounded-3xl border border-[#E8E0D9] shadow-xs cursor-pointer hover:border-emerald-500 hover:shadow-md transition group"
              >
                <div className="flex justify-between items-center text-[#80736F] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-700">Ready Tasks</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700">
                  {allReadyTasks.length}
                </div>
                <p className="text-[11px] text-[#80736F] mt-1 flex items-center gap-1 group-hover:text-emerald-700 font-medium">
                  <span>Ready for dispatch or pickup</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </div>
            </div>

            {/* Kitchen Station Overview Action Banner */}
            <div className="bg-gradient-to-r from-[#762F3D] to-[#5F2030] text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A46D] bg-[#302725]/40 px-2.5 py-0.5 rounded-full inline-block">
                  Kitchen Station Overview
                </span>
                <h3 className="font-serif text-xl font-bold">Kitchen Production Dashboard</h3>
                <p className="text-xs text-[#FAF7F2]/80 max-w-xl">
                  Manage assigned orders, log live baking activities (Preparing, Baking, Decorating), and finish orders seamlessly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('assigned')}
                className="bg-[#C5A46D] hover:bg-[#B3935D] text-[#302725] px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>View Assigned Orders ({allAssignedTasks.length})</span>
              </button>
            </div>

            {/* Today's Kitchen Schedule & Recent Tasks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Active Tasks Queue (Cols 1-7) */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8E0D9] shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#E8E0D9]">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Assigned Work Orders</h3>
                    <p className="text-xs text-[#80736F]">Orders currently assigned to your station</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('assigned')}
                    className="text-xs font-bold text-[#762F3D] hover:underline cursor-pointer"
                  >
                    View All ({myAssignedTasks.length}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {myAssignedTasks.slice(0, 5).map(task => {
                    const kStatus = getProductionKanbanStatus(task);
                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-[#762F3D] transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#302725]">{task.productName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              kStatus === 'Ready' ? 'bg-emerald-100 text-emerald-800' :
                              kStatus === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                              'bg-sky-100 text-sky-800'
                            }`}>
                              {kStatus}
                            </span>
                            {getPriorityBadge(task.priority)}
                          </div>
                          <p className="text-xs text-[#80736F]">
                            Order: <strong>{task.orderNumber || 'Custom'}</strong> • Due: {task.deadline}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForSpecs(task)}
                            className="px-3 py-1.5 rounded-xl border border-[#E8E0D9] bg-white text-xs font-bold text-[#302725] hover:bg-[#FAF7F2] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#762F3D]" />
                            <span>Specs</span>
                          </button>
                          {kStatus === 'Assigned' && (
                            <button
                              type="button"
                              onClick={() => handleStartProduction(task)}
                              className="px-3 py-1.5 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Flame className="w-3.5 h-3.5 text-[#C5A46D]" />
                              <span>Start</span>
                            </button>
                          )}
                          {kStatus === 'In Progress' && (
                            <button
                              type="button"
                              onClick={() => handleMarkReady(task)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Ready</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {myAssignedTasks.length === 0 && (
                    <div className="py-8 text-center text-[#80736F] text-xs italic">
                      No orders currently assigned to your station.
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Material Inventory Quick Watch (Cols 8-12) */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8E0D9] shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#E8E0D9]">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#302725]">Ingredient Stock Watch</h3>
                    <p className="text-xs text-[#80736F]">Live raw material availability & restock alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRestockIngredientName('');
                      setRestockQuantityNeeded('');
                      setRestockNotes('');
                      setRestockModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#762F3D] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    + Report Low
                  </button>
                </div>

                {/* Sub-tab Switcher: Stock vs Restock Requests */}
                <div className="flex items-center gap-2 p-1 bg-[#FAF7F2] rounded-xl border border-[#E8E0D9] text-xs">
                  <button
                    type="button"
                    onClick={() => setBakerStockTab('stock')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                      bakerStockTab === 'stock'
                        ? 'bg-white text-[#762F3D] shadow-2xs'
                        : 'text-[#80736F] hover:text-[#302725]'
                    }`}
                  >
                    Raw Materials ({inventory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBakerStockTab('requests')}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                      bakerStockTab === 'requests'
                        ? 'bg-white text-[#762F3D] shadow-2xs'
                        : 'text-[#80736F] hover:text-[#302725]'
                    }`}
                  >
                    Restock Requests ({restockRequests.length})
                  </button>
                </div>

                {bakerStockTab === 'stock' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search ingredients..."
                      value={bakerStockSearch}
                      onChange={e => setBakerStockSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl focus:outline-none focus:border-[#762F3D]"
                    />

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {inventory
                        .filter(ing => !bakerStockSearch || ing.name.toLowerCase().includes(bakerStockSearch.toLowerCase()))
                        .map(ing => {
                          const isOut = ing.currentStock === 0;
                          const isLow = !isOut && ing.currentStock <= ing.minStock;
                          return (
                            <div
                              key={ing.id}
                              className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] flex items-center justify-between text-xs hover:border-[#762F3D]/40 transition"
                            >
                              <div>
                                <p className="font-bold text-[#302725]">{ing.name}</p>
                                <p className="text-[10px] text-[#80736F]">{ing.category} &bull; Min: {ing.minStock} {ing.unit}</p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <div>
                                  <p className="font-bold text-[#762F3D]">{ing.currentStock} {ing.unit}</p>
                                  <span
                                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                      isOut
                                        ? 'bg-red-100 text-red-700'
                                        : isLow
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                  </span>
                                </div>
                                {(isLow || isOut) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRestockIngredientName(ing.name);
                                      setRestockQuantityNeeded(`${ing.minStock * 2} ${ing.unit}`);
                                      setRestockUrgency(isOut ? 'Critical' : 'High');
                                      setRestockModalOpen(true);
                                    }}
                                    className="p-1 text-[#762F3D] hover:bg-white rounded-lg transition"
                                    title="Quick Request Restock"
                                  >
                                    +
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {restockRequests.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#80736F]">
                        No restock requests submitted yet.
                      </div>
                    ) : (
                      restockRequests.map(req => {
                        const isPending = req.status === 'Pending';
                        const isApproved = req.status === 'Approved' || req.status === 'PO Created';
                        const isFulfilled = req.status === 'Fulfilled';

                        return (
                          <div
                            key={req.id}
                            className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D9] space-y-1 text-xs"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-[#302725]">{req.ingredientName}</p>
                                <p className="text-[10px] text-[#80736F]">
                                  Needed: <strong>{req.quantityNeeded}</strong> &bull; {req.createdAt}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  isFulfilled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isApproved
                                    ? 'bg-blue-100 text-blue-800'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {isFulfilled ? 'Fulfilled' : isApproved ? 'Approved / In PO' : isPending ? 'Pending' : req.status}
                              </span>
                            </div>
                            {req.notes && (
                              <p className="text-[10px] text-[#80736F] italic">"{req.notes}"</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ASSIGNED TASKS PAGE (STANDALONE DEDICATED VIEW)          */}
        {/* ============================================================== */}
        {activeTab === 'assigned' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Page Header & Filter Bar */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 shadow-2xs">
                    <UtensilsCrossed className="w-6 h-6 text-sky-700" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[#302725] tracking-tight">
                      Assigned Tasks
                    </h2>
                    <p className="text-xs text-[#80736F] mt-0.5">
                      Orders assigned to your station awaiting production start. Review recipes and click Start Production.
                    </p>
                  </div>
                </div>

                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0">
                  {displayedAssignedTasks.length} Pending Order{displayedAssignedTasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Filter / Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-8 relative">
                  <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by cake name, order #, customer, flavor..."
                    value={assignedSearch}
                    onChange={e => setAssignedSearch(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <select
                    value={assignedPriority}
                    onChange={e => setAssignedPriority(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl px-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid of Assigned Task Cards */}
            {displayedAssignedTasks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E8E0D9] p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-600 mx-auto flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#302725]">No Pending Assigned Tasks</h3>
                <p className="text-xs text-[#80736F] max-w-md mx-auto">
                  All assigned tasks have been started or completed. Great job keeping the oven hot!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {displayedAssignedTasks.map(task => {
                  const taskOverdue = isOverdue(task);
                  const isUpdating = updatingTaskId === task.id;
                  const productImg = getProductImage(task);
                  const customerName = getCustomerName(task);
                  const orderDate = getOrderDate(task);

                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between hover:border-[#762F3D]/50"
                    >
                      <div className="p-5 space-y-3.5">
                        {/* Header: Order #, Customer, Priority */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-bold text-xs text-[#762F3D] block">{task.orderNumber || 'Custom Order'}</span>
                            <h3 className="font-semibold text-sm text-[#302725] line-clamp-1">{customerName}</h3>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {getPriorityBadge(task.priority)}
                            {taskOverdue && (
                              <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-red-600 text-white animate-pulse">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Thumbnail + Title & Quantity */}
                        <div className="flex items-start gap-3 bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E0D9]/70">
                          <img
                            src={productImg}
                            alt={task.productName}
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border border-[#E8E0D9]/80 shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-bold text-xs sm:text-sm text-[#302725] line-clamp-1" title={task.productName}>
                              {task.productName}
                            </h4>
                            <div className="text-xs text-[#80736F]">
                              Quantity: <strong className="text-[#302725]">{task.quantity || 1} units</strong>
                            </div>
                            {task.cakeSpecs?.flavor && (
                              <div className="text-[11px] text-[#762F3D] font-semibold truncate">
                                Flavor: {task.cakeSpecs.flavor}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cake Specifications Box (if present) */}
                        {task.cakeSpecs && (task.cakeSpecs.tiers || task.cakeSpecs.filling || task.cakeSpecs.frosting || task.cakeSpecs.sizeWeight) && (
                          <div className="p-2.5 rounded-xl bg-white border border-[#E8E0D9]/70 text-[11px] space-y-1">
                            <span className="font-bold text-[#80736F] uppercase text-[9px] tracking-wider block">Cake Specs:</span>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[#302725]">
                              {task.cakeSpecs.tiers && (
                                <div>Tiers: <span className="font-semibold">{task.cakeSpecs.tiers}</span></div>
                              )}
                              {task.cakeSpecs.filling && (
                                <div className="truncate">Filling: <span className="font-semibold">{task.cakeSpecs.filling}</span></div>
                              )}
                              {task.cakeSpecs.frosting && (
                                <div className="truncate">Frosting: <span className="font-semibold">{task.cakeSpecs.frosting}</span></div>
                              )}
                              {task.cakeSpecs.sizeWeight && (
                                <div>Size: <span className="font-semibold">{task.cakeSpecs.sizeWeight}</span></div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Special Instructions */}
                        {(task.notes || task.specifications) && (
                          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 text-[11px] text-[#80736F]">
                            <span className="font-bold text-amber-900 text-[10px] uppercase block mb-0.5">Special Instructions:</span>
                            <p className="line-clamp-2 italic text-[#302725]">{task.notes || task.specifications}</p>
                          </div>
                        )}

                        {/* Dates: Assigned Date & Required Due Date */}
                        <div className="text-[11px] text-[#80736F] space-y-0.5 pt-1">
                          <div className="flex justify-between items-center">
                            <span>Assigned Date:</span>
                            <span className="font-medium text-[#302725]">{orderDate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Required Due:</span>
                            <span className={`font-semibold ${taskOverdue ? 'text-red-600' : 'text-[#302725]'}`}>
                              {task.deadline || 'Today'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="p-4 bg-[#FAF7F2]/60 border-t border-[#E8E0D9] flex items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForSpecs(task)}
                          className="px-3.5 py-2 rounded-xl border border-[#E8E0D9] bg-white text-xs font-bold text-[#302725] hover:bg-[#FAF7F2] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#762F3D]" />
                          <span>Specs</span>
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStartProduction(task)}
                          className="flex-1 py-2 px-4 rounded-xl bg-[#762F3D] hover:bg-[#5F2030] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Flame className="w-3.5 h-3.5 text-[#C5A46D]" />
                          )}
                          <span>Start Production</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: IN PROGRESS TASKS PAGE (STANDALONE DEDICATED VIEW)       */}
        {/* ============================================================== */}
        {activeTab === 'active' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Page Header & Filter Bar */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
                    <Flame className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[#302725] tracking-tight">
                      In Progress Tasks
                    </h2>
                    <p className="text-xs text-[#80736F] mt-0.5">
                      Orders currently undergoing kitchen preparation. Update your live activity and mark Ready once finished.
                    </p>
                  </div>
                </div>

                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0">
                  {displayedInProgressTasks.length} In Progress
                </span>
              </div>

              {/* Filter / Search Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search active bakes by cake, customer, order #..."
                    value={inProgressSearch}
                    onChange={e => setInProgressSearch(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={inProgressActivity}
                    onChange={e => setInProgressActivity(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl px-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  >
                    <option value="all">All Activities</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Baking">Baking</option>
                    <option value="Decorating">Decorating</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={inProgressPriority}
                    onChange={e => setInProgressPriority(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl px-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid of In Progress Task Cards */}
            {displayedInProgressTasks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E8E0D9] p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                  <Flame className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#302725]">No Orders Currently In Progress</h3>
                <p className="text-xs text-[#80736F] max-w-md mx-auto">
                  You have no active bakes currently in progress. Start an order from your Assigned Tasks list.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('assigned')}
                  className="px-4 py-2 rounded-xl bg-[#762F3D] text-white text-xs font-bold hover:bg-[#5F2030] transition cursor-pointer"
                >
                  View Assigned Tasks ({allAssignedTasks.length})
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {displayedInProgressTasks.map(task => {
                  const taskOverdue = isOverdue(task);
                  const isUpdating = updatingTaskId === task.id;
                  const currentAct = getProductionActivity(task);
                  const productImg = getProductImage(task);
                  const customerName = getCustomerName(task);
                  const startDate = getOrderDate(task);

                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between hover:border-amber-400/60"
                    >
                      <div className="p-5 space-y-3.5">
                        {/* Header: Order #, Customer, Priority */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-bold text-xs text-[#762F3D] block">{task.orderNumber || 'Custom Order'}</span>
                            <h3 className="font-semibold text-sm text-[#302725] line-clamp-1">{customerName}</h3>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {getPriorityBadge(task.priority)}
                            {taskOverdue && (
                              <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-red-600 text-white animate-pulse">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Product Thumbnail + Title & Quantity */}
                        <div className="flex items-start gap-3 bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E0D9]/70">
                          <img
                            src={productImg}
                            alt={task.productName}
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border border-[#E8E0D9]/80 shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-bold text-xs sm:text-sm text-[#302725] line-clamp-1" title={task.productName}>
                              {task.productName}
                            </h4>
                            <div className="text-xs text-[#80736F]">
                              Quantity: <strong className="text-[#302725]">{task.quantity || 1} units</strong>
                            </div>
                            {task.cakeSpecs?.flavor && (
                              <div className="text-[11px] text-[#762F3D] font-semibold truncate">
                                Flavor: {task.cakeSpecs.flavor}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Current Activity Switcher */}
                        <div className="space-y-1.5 pt-0.5">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#80736F]">
                            <span>Current Baker Activity:</span>
                            <span className="text-[#762F3D] font-bold">
                              {currentAct === 'None' ? 'Preparing' : currentAct}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['Preparing', 'Baking', 'Decorating'] as const).map(act => {
                              const isActive = (currentAct === act) || (currentAct === 'None' && act === 'Preparing');
                              return (
                                <button
                                  key={act}
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateActivity(task, act)}
                                  className={`py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                    isActive
                                      ? act === 'Baking'
                                        ? 'bg-orange-500 text-white shadow-xs'
                                        : act === 'Decorating'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-[#FAF7F2] text-[#80736F] border border-[#E8E0D9] hover:bg-[#EFEAE3]'
                                  }`}
                                >
                                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                                  <span>{act}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Special Instructions */}
                        {(task.notes || task.specifications) && (
                          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 text-[11px] text-[#80736F]">
                            <span className="font-bold text-amber-900 text-[10px] uppercase block mb-0.5">Special Instructions:</span>
                            <p className="line-clamp-2 italic text-[#302725]">{task.notes || task.specifications}</p>
                          </div>
                        )}

                        {/* Dates: Started & Required Due Date */}
                        <div className="text-[11px] text-[#80736F] space-y-0.5 pt-1">
                          <div className="flex justify-between items-center">
                            <span>Started Date:</span>
                            <span className="font-medium text-[#302725]">{startDate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Required Due:</span>
                            <span className={`font-semibold ${taskOverdue ? 'text-red-600' : 'text-[#302725]'}`}>
                              {task.deadline || 'Today'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="p-4 bg-[#FAF7F2]/60 border-t border-[#E8E0D9] flex items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForSpecs(task)}
                          className="px-3.5 py-2 rounded-xl border border-[#E8E0D9] bg-white text-xs font-bold text-[#302725] hover:bg-[#FAF7F2] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#762F3D]" />
                          <span>Specs</span>
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleMarkReady(task)}
                          className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Mark as Ready</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: READY TASKS PAGE (STANDALONE DEDICATED VIEW)             */}
        {/* ============================================================== */}
        {activeTab === 'completed' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Page Header & Filter Bar */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8E0D9] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-[#302725] tracking-tight">
                      Ready Tasks
                    </h2>
                    <p className="text-xs text-[#80736F] mt-0.5">
                      Orders whose kitchen production has been completed. Ready for customer counter pickup or delivery courier dispatch.
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0">
                  {displayedReadyTasks.length} Ready Order{displayedReadyTasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Filter / Search Bar */}
              <div className="relative pt-2">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-5" />
                <input
                  type="text"
                  placeholder="Search completed bakes by cake, customer, order #..."
                  value={readySearch}
                  onChange={e => setReadySearch(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>
            </div>

            {/* Grid of Ready Task Cards */}
            {displayedReadyTasks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E8E0D9] p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#302725]">No Completed Orders Awaiting Handover</h3>
                <p className="text-xs text-[#80736F] max-w-md mx-auto">
                  Orders you mark as Ready will appear here as finished production records.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {displayedReadyTasks.map(task => {
                  const productImg = getProductImage(task);
                  const customerName = getCustomerName(task);
                  const linkedOrder = orders?.find(o => o.id === task.orderId || o.orderNumber === task.orderNumber);
                  const isPickup = linkedOrder?.fulfillmentMethod === 'Pickup';

                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-3xl border border-[#E8E0D9] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between hover:border-emerald-300"
                    >
                      <div className="p-5 space-y-3.5">
                        {/* Header: Order #, Customer, Ready Pill */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-bold text-xs text-[#762F3D] block">{task.orderNumber || 'Custom Order'}</span>
                            <h3 className="font-semibold text-sm text-[#302725] line-clamp-1">{customerName}</h3>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F6EE] text-[#1B7A43] flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 text-[#1B7A43]" />
                            <span>Ready</span>
                          </span>
                        </div>

                        {/* Product Thumbnail + Title & Quantity */}
                        <div className="flex items-start gap-3 bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E0D9]/70">
                          <img
                            src={productImg}
                            alt={task.productName}
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shrink-0 border border-[#E8E0D9]/80 shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-bold text-xs sm:text-sm text-[#302725] line-clamp-1" title={task.productName}>
                              {task.productName}
                            </h4>
                            <div className="text-xs text-[#80736F]">
                              Quantity: <strong className="text-[#302725]">{task.quantity || 1} units</strong>
                            </div>
                            {task.cakeSpecs?.flavor && (
                              <div className="text-[11px] text-[#762F3D] font-semibold truncate">
                                Flavor: {task.cakeSpecs.flavor}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Assigned Baker & Completion Timestamp */}
                        <div className="p-2.5 rounded-xl bg-white border border-[#E8E0D9]/70 text-xs space-y-1.5">
                          <div className="flex justify-between items-center text-[#80736F]">
                            <span>Assigned Baker:</span>
                            <span className="font-bold text-[#302725]">{task.assignedBaker || currentUser.name}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#80736F]">
                            <span>Completed At:</span>
                            <strong className="text-emerald-800 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{task.completedAt || task.lastUpdatedAt || 'Recently completed'}</span>
                            </strong>
                          </div>
                        </div>

                        {/* Handover Status */}
                        <div className="pt-0.5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border ${
                            isPickup
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isPickup ? 'Store Pickup • Ready at Counter' : 'Home Delivery • Ready for Courier Dispatch'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="p-4 bg-[#FAF7F2]/60 border-t border-[#E8E0D9] flex items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTaskForSpecs(task)}
                          className="px-3.5 py-2 rounded-xl border border-[#E8E0D9] bg-white text-xs font-bold text-[#302725] hover:bg-[#FAF7F2] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#762F3D]" />
                          <span>Specs</span>
                        </button>

                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Production Finished</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: PRODUCTION HISTORY                                      */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-[#E8E0D9] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#302725]">Production History Log</h2>
                  <p className="text-xs text-[#80736F]">Audit log of artisanal bakes and confectionery output</p>
                </div>
                <span className="bg-[#FAF7F2] border border-[#E8E0D9] px-3 py-1.5 rounded-xl text-xs font-bold text-[#762F3D]">
                  {completedTasks.length} Past Records
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter completed tasks by product, order number..."
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#E8E0D9] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#80736F] uppercase text-[10px] tracking-wider border-b border-[#E8E0D9]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Order #</th>
                      <th className="py-3.5 px-4 font-bold">Cake / Pastry Item</th>
                      <th className="py-3.5 px-4 font-bold">Baker</th>
                      <th className="py-3.5 px-4 font-bold">Deadline</th>
                      <th className="py-3.5 px-4 font-bold text-center">Status</th>
                      <th className="py-3.5 px-4 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D9]">
                    {completedTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#80736F] text-xs">
                          No production history records found.
                        </td>
                      </tr>
                    ) : (
                      completedTasks.map(task => (
                        <tr key={task.id} className="hover:bg-[#FAF7F2]/60 transition">
                          <td className="py-3.5 px-4 font-bold text-[#762F3D]">{task.orderNumber}</td>
                          <td className="py-3.5 px-4 font-bold text-[#302725]">{task.productName}</td>
                          <td className="py-3.5 px-4 text-[#80736F]">{task.assignedBaker}</td>
                          <td className="py-3.5 px-4 text-[#80736F]">{task.deadline}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Completed
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedTaskForSpecs(task)}
                              className="px-3 py-1 rounded-xl border border-[#E8E0D9] text-[#762F3D] font-bold hover:bg-[#FAF7F2] cursor-pointer"
                            >
                              Inspect
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
        {/* 6. MY PROFILE TAB                                             */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E0D9]">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">
                  Baker Staff Portal
                </span>
                <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#302725]">
                  My Profile & Account
                </h2>
                <p className="text-xs sm:text-sm text-[#80736F] mt-0.5">
                  Manage your personal contact info, view employee status, and ensure account security.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Kitchen Staff
                </span>
              </div>
            </div>

            {/* Profile Grid: 1 col on mobile, 3 cols on lg */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column: Identity & Account Summary (lg:col-span-1) */}
              <div className="space-y-6">
                
                {/* Identity Card */}
                <div className="bg-white rounded-3xl p-6 border border-[#E8E0D9] shadow-xs text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-[#5C1A24] to-[#762F3D]" />

                  {/* Avatar with luxury border */}
                  <div className="relative mx-auto mt-6 w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#FAF7F2] flex items-center justify-center">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="font-serif text-3xl font-black text-[#5C1A24]">
                        {currentUser.name ? currentUser.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'BK'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-xl text-[#302725] mt-4">
                    {currentUser.name || 'Baker Employee'}
                  </h3>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5C1A24]/10 text-[#5C1A24] text-xs font-bold mt-1">
                    <ChefHat className="w-3.5 h-3.5 text-[#C5A46D]" />
                    <span>Baker • Kitchen Operations</span>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#E8E0D9] space-y-3 text-left text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#80736F] font-semibold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#5C1A24]" />
                        Employee ID
                      </span>
                      <span className="font-mono font-bold text-[#302725] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8E0D9]">
                        {currentUser.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#80736F] font-semibold flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#5C1A24]" />
                        Work Email
                      </span>
                      <span className="font-medium text-[#302725] truncate max-w-[160px]" title={currentUser.email}>
                        {currentUser.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#80736F] font-semibold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#5C1A24]" />
                        Phone
                      </span>
                      <span className="font-medium text-[#302725]">
                        {currentUser.phone || 'Not provided'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#80736F] font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#5C1A24]" />
                        Joined
                      </span>
                      <span className="font-medium text-[#302725]">
                        {joinDateDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Restrictions & Security Info */}
                <div className="bg-[#FAF7F2] rounded-3xl p-5 border border-[#E8E0D9] shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#5C1A24]">
                    <Lock className="w-4 h-4 text-[#C5A46D]" />
                    <span>Role & Permission Security</span>
                  </div>
                  <p className="text-[11px] text-[#80736F] leading-relaxed">
                    Bakers have operational privileges to manage production queues, prepare recipes, and fulfill kitchen orders.
                  </p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-[#80736F]">
                      <span>Role Level</span>
                      <span className="font-bold text-[#302725]">Kitchen Staff (Protected)</span>
                    </div>
                    <div className="flex items-center justify-between text-[#80736F]">
                      <span>Status</span>
                      <span className="font-bold text-emerald-700">Active (Locked by Admin)</span>
                    </div>
                    <div className="flex items-center justify-between text-[#80736F]">
                      <span>Access Scope</span>
                      <span className="font-bold text-[#302725]">Assigned Production Only</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Edit Details Form & Password Change (lg:col-span-2) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Edit Personal Details Form */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E0D9] shadow-xs">
                  <div className="pb-4 border-b border-[#E8E0D9]">
                    <h3 className="font-serif font-bold text-lg text-[#302725]">
                      Personal Information
                    </h3>
                    <p className="text-xs text-[#80736F] mt-0.5">
                      Update your contact information and display photo. Role and employee ID cannot be changed.
                    </p>
                  </div>

                  {profileSuccess && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {profileError && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#302725] mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="e.g. Chef Tariq"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-white text-xs font-medium text-[#302725] focus:outline-hidden focus:border-[#5C1A24] focus:ring-1 focus:ring-[#5C1A24]"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-[#302725] mb-1.5">
                        Phone Number (Pakistan) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="0300 1234567 or +92 300 1234567"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-white text-xs font-medium text-[#302725] focus:outline-hidden focus:border-[#5C1A24] focus:ring-1 focus:ring-[#5C1A24]"
                        />
                      </div>
                      <span className="text-[10px] text-[#80736F] mt-1 block">
                        Used for urgent dispatch notifications and manager contact.
                      </span>
                    </div>

                    {/* Email (Read-Only) */}
                    <div>
                      <label className="block text-xs font-bold text-[#302725] mb-1.5 flex items-center justify-between">
                        <span>Work Email Address</span>
                        <span className="text-[10px] font-semibold text-[#80736F] flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Managed by Administrator
                        </span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          value={currentUser.email}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-[#FAF7F2] text-xs font-medium text-[#80736F] cursor-not-allowed select-none"
                        />
                      </div>
                    </div>

                    {/* Profile Photo URL / Avatar */}
                    <div>
                      <label className="block text-xs font-bold text-[#302725] mb-1.5">
                        Profile Photo (URL or Presets)
                      </label>
                      <div className="relative">
                        <Camera className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="url"
                          value={profileAvatar}
                          onChange={(e) => setProfileAvatar(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-white text-xs font-medium text-[#302725] focus:outline-hidden focus:border-[#5C1A24] focus:ring-1 focus:ring-[#5C1A24]"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-[#80736F]">Quick avatar:</span>
                        <button
                          type="button"
                          onClick={() => setProfileAvatar('https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80')}
                          className="text-[10px] px-2 py-0.5 rounded border border-[#E8E0D9] bg-[#FAF7F2] hover:bg-stone-200 text-[#302725]"
                        >
                          Chef 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileAvatar('https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=150&auto=format&fit=crop&q=80')}
                          className="text-[10px] px-2 py-0.5 rounded border border-[#E8E0D9] bg-[#FAF7F2] hover:bg-stone-200 text-[#302725]"
                        >
                          Chef 2
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileAvatar('')}
                          className="text-[10px] px-2 py-0.5 rounded border border-[#E8E0D9] bg-[#FAF7F2] hover:bg-stone-200 text-rose-700"
                        >
                          Clear Photo
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="px-5 py-2.5 rounded-xl bg-[#5C1A24] hover:bg-[#43131A] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {profileLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

                {/* Password Change Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E0D9] shadow-xs">
                  <div className="pb-4 border-b border-[#E8E0D9]">
                    <h3 className="font-serif font-bold text-lg text-[#302725]">
                      Security & Password
                    </h3>
                    <p className="text-xs text-[#80736F] mt-0.5">
                      Ensure your account credentials are kept private and updated regularly.
                    </p>
                  </div>

                  {passwordSuccess && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#302725] mb-1.5">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Key className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-white text-xs font-medium text-[#302725] focus:outline-hidden focus:border-[#5C1A24] focus:ring-1 focus:ring-[#5C1A24]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#302725] mb-1.5">
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-white text-xs font-medium text-[#302725] focus:outline-hidden focus:border-[#5C1A24] focus:ring-1 focus:ring-[#5C1A24]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#302725] mb-1.5">
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#80736F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                            minLength={6}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-white text-xs font-medium text-[#302725] focus:outline-hidden focus:border-[#5C1A24] focus:ring-1 focus:ring-[#5C1A24]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-5 py-2.5 rounded-xl border border-[#5C1A24] text-[#5C1A24] hover:bg-[#5C1A24]/5 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {passwordLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-[#5C1A24]/30 border-t-[#5C1A24] rounded-full animate-spin" />
                            <span>Updating Password...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            <span>Change Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 7. NOTIFICATIONS TAB                                          */}
        {/* ============================================================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E0D9]">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">
                  Baker Alerts & Activity
                </span>
                <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#302725] flex items-center gap-3">
                  <span>Notifications</span>
                  {unreadNotifCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#5C1A24] text-white text-xs font-bold">
                      {unreadNotifCount} New
                    </span>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-[#80736F] mt-0.5">
                  Real-time order assignments, production updates, and kitchen schedule notices.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    await refetchNotifications();
                    showToast('Notifications refreshed', 'info');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#E8E0D9] bg-white hover:bg-[#FAF7F2] text-[#302725] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Refresh notifications"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#5C1A24]" />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  disabled={unreadNotifCount === 0}
                  onClick={async () => {
                    await markAllNotificationsRead();
                    showToast('All notifications marked as read', 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#5C1A24] hover:bg-[#43131A] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All as Read</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E8E0D9] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setNotifFilter('all')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    notifFilter === 'all'
                      ? 'bg-[#5C1A24] text-white shadow-2xs'
                      : 'text-[#80736F] hover:bg-[#FAF7F2] hover:text-[#302725]'
                  }`}
                >
                  All ({notifications?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setNotifFilter('unread')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    notifFilter === 'unread'
                      ? 'bg-[#5C1A24] text-white shadow-2xs'
                      : 'text-[#80736F] hover:bg-[#FAF7F2] hover:text-[#302725]'
                  }`}
                >
                  <span>Unread</span>
                  {unreadNotifCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      notifFilter === 'unread' ? 'bg-white/20 text-white' : 'bg-[#5C1A24] text-white'
                    }`}>
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#80736F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E8E0D9] text-xs font-medium text-[#302725] bg-[#FAF7F2] focus:bg-white focus:outline-hidden focus:border-[#5C1A24]"
                />
                {notifSearch && (
                  <button
                    onClick={() => setNotifSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#80736F] hover:text-[#302725]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            {displayedNotifications.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E0D9] shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] text-[#80736F] flex items-center justify-center mx-auto mb-4 border border-[#E8E0D9]">
                  <Bell className="w-8 h-8 text-[#C5A46D]" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#302725]">
                  {notifFilter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
                </h3>
                <p className="text-xs text-[#80736F] mt-1 max-w-sm mx-auto">
                  {notifFilter === 'unread'
                    ? "You're all caught up! There are no unread notifications waiting for your attention."
                    : "No notification records found in your queue. Real-time order assignments and production alerts will appear here."}
                </p>
                {notifFilter === 'unread' && notifications?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setNotifFilter('all')}
                    className="mt-4 px-4 py-2 rounded-xl border border-[#E8E0D9] bg-[#FAF7F2] text-xs font-bold text-[#302725] hover:bg-stone-200 transition"
                  >
                    View All Notifications ({notifications.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedNotifications.map((n) => {
                  const isUnread = !n.read;
                  const isOverdue = n.title?.toLowerCase().includes('overdue');
                  const isAssign = n.title?.toLowerCase().includes('assigned');

                  return (
                    <div
                      key={n.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isUnread
                          ? 'bg-white border-[#5C1A24]/30 shadow-xs'
                          : 'bg-[#FAF7F2]/60 border-[#E8E0D9] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Icon Badge */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isOverdue
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : isAssign
                            ? 'bg-[#5C1A24]/10 text-[#5C1A24] border-[#5C1A24]/20'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isOverdue ? (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          ) : isAssign ? (
                            <ChefHat className="w-5 h-5 text-[#5C1A24]" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-amber-600" />
                          )}
                        </div>

                        {/* Title, Message, Date */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-xs sm:text-sm font-bold ${
                              isUnread ? 'text-[#302725]' : 'text-[#80736F]'
                            }`}>
                              {n.title}
                            </h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#5C1A24] shrink-0" title="Unread" />
                            )}
                            {n.orderNumber && (
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#5C1A24] border border-[#E8E0D9]">
                                {n.orderNumber}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#80736F] mt-1 leading-relaxed">
                            {n.message}
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-[10px] text-[#80736F]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#C5A46D]" />
                              {n.createdAt ? new Date(n.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Recent'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {n.orderNumber && (
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              handleNavigateToNotificationTask(n.orderNumber || n.orderId);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-[#5C1A24]/30 bg-white hover:bg-[#5C1A24] hover:text-white text-[#5C1A24] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <span>Open Task</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markNotificationRead(n.id)}
                            className="p-1.5 rounded-xl border border-[#E8E0D9] bg-white hover:bg-stone-100 text-[#80736F] hover:text-[#302725] transition cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* 9. MODAL: FULL CAKE SPECIFICATIONS & BAKER INSTRUCTIONS       */}
      {/* ============================================================== */}
      {selectedTaskForSpecs && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E8E0D9] overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-5 bg-[#FAF7F2] border-b border-[#E8E0D9] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[#762F3D] uppercase tracking-wider">
                  Baker Recipe & Production Blueprint
                </span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">
                  {selectedTaskForSpecs.productName} ({selectedTaskForSpecs.orderNumber || selectedTaskForSpecs.id})
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskForSpecs(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-[#80736F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#302725]">

              {/* Reference Image */}
              {selectedTaskForSpecs.referenceImage && (
                <div>
                  <h4 className="font-bold text-[#80736F] uppercase text-[10px] mb-2">Customer Design / Reference Preview</h4>
                  <img
                    src={selectedTaskForSpecs.referenceImage}
                    alt="Cake Reference"
                    className="w-full max-h-64 object-cover rounded-2xl border border-[#E8E0D9]"
                  />
                </div>
              )}

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E0D9]">
                <div>
                  <span className="text-[#80736F] text-[10px] uppercase font-bold">Assigned Baker</span>
                  <div className="font-semibold mt-0.5">{selectedTaskForSpecs.assignedBaker}</div>
                </div>
                <div>
                  <span className="text-[#80736F] text-[10px] uppercase font-bold">Deadline</span>
                  <div className="font-semibold text-amber-700 mt-0.5">{selectedTaskForSpecs.deadline}</div>
                </div>
                <div>
                  <span className="text-[#80736F] text-[10px] uppercase font-bold">Current Stage</span>
                  <div className="font-semibold mt-0.5">{selectedTaskForSpecs.stage}</div>
                </div>
                {selectedTaskForSpecs.cakeSpecs?.flavor && (
                  <div>
                    <span className="text-[#80736F] text-[10px] uppercase font-bold">Flavor Base</span>
                    <div className="font-semibold mt-0.5">{selectedTaskForSpecs.cakeSpecs.flavor}</div>
                  </div>
                )}
                {selectedTaskForSpecs.cakeSpecs?.tiers && (
                  <div>
                    <span className="text-[#80736F] text-[10px] uppercase font-bold">Tier Assembly</span>
                    <div className="font-semibold mt-0.5">{selectedTaskForSpecs.cakeSpecs.tiers} Tiers</div>
                  </div>
                )}
                {selectedTaskForSpecs.cakeSpecs?.sizeWeight && (
                  <div>
                    <span className="text-[#80736F] text-[10px] uppercase font-bold">Target Weight / Size</span>
                    <div className="font-semibold mt-0.5">{selectedTaskForSpecs.cakeSpecs.sizeWeight}</div>
                  </div>
                )}
              </div>

              {/* Detailed Instructions */}
              <div>
                <h4 className="font-bold text-[#80736F] uppercase text-[10px] mb-1.5">Chef Instructions</h4>
                <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D9] text-[#302725] leading-relaxed">
                  {selectedTaskForSpecs.specifications || 'Standard kitchen recipe and decorating guidelines apply.'}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E0D9] flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTaskForSpecs(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E8E0D9] bg-white text-xs font-bold text-[#302725] hover:bg-[#FAF7F2] transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {getProductionKanbanStatus(selectedTaskForSpecs) === 'Assigned' && (
                  <button
                    type="button"
                    disabled={updatingTaskId === selectedTaskForSpecs.id}
                    onClick={async () => {
                      await handleStartProduction(selectedTaskForSpecs);
                      setSelectedTaskForSpecs(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#5C1A24] hover:bg-[#43131A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Production</span>
                  </button>
                )}

                {getProductionKanbanStatus(selectedTaskForSpecs) === 'In Progress' && (
                  <button
                    type="button"
                    disabled={updatingTaskId === selectedTaskForSpecs.id}
                    onClick={async () => {
                      await handleMarkReady(selectedTaskForSpecs);
                      setSelectedTaskForSpecs(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark as Ready</span>
                  </button>
                )}

                {getProductionKanbanStatus(selectedTaskForSpecs) === 'Ready' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Production Completed
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 10. MODAL: INGREDIENT RESTOCK REQUEST                          */}
      {/* ============================================================== */}
      {restockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E8E0D9] p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#E8E0D9]">
              <div>
                <span className="text-[10px] font-bold text-[#762F3D] uppercase">Kitchen Stock Alert</span>
                <h3 className="font-serif font-bold text-lg text-[#302725]">Request Raw Material</h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-[#80736F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#302725] mb-1">Ingredient Name *</label>
                <input
                  type="text"
                  required
                  value={restockIngredientName}
                  onChange={e => setRestockIngredientName(e.target.value)}
                  placeholder="e.g. Belgian Dark Chocolate, Unsalted Butter"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#302725] mb-1">Quantity Needed</label>
                <input
                  type="text"
                  value={restockQuantityNeeded}
                  onChange={e => setRestockQuantityNeeded(e.target.value)}
                  placeholder="e.g. 5 kg, 10 liters"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#302725] mb-1">Kitchen Urgency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'High', 'Critical'] as const).map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setRestockUrgency(u)}
                      className={`py-2 rounded-xl border font-bold text-xs transition ${
                        restockUrgency === u
                          ? 'bg-[#762F3D] text-white border-[#762F3D]'
                          : 'bg-[#FAF7F2] text-[#302725] border-[#E8E0D9] hover:bg-gray-100'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#302725] mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  placeholder="e.g. Needed for urgent custom 3-tier anniversary cake"
                  className="w-full bg-[#FAF7F2] border border-[#E8E0D9] rounded-xl px-3.5 py-2 text-xs text-[#302725] focus:outline-none focus:border-[#762F3D]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8E0D9] text-xs font-bold text-[#302725] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRestock}
                  className="flex-1 py-2.5 rounded-xl bg-[#762F3D] text-white text-xs font-bold hover:bg-[#5F2030] disabled:opacity-50"
                >
                  {isSubmittingRestock ? 'Sending...' : 'Send Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PortalLayout>
  );
};
