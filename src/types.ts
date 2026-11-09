export type UserRole = 'guest' | 'customer' | 'admin' | 'cashier' | 'baker' | 'inventory_manager' | 'delivery';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  addresses: string[];
  avatar?: string;
  createdAt: string;
}

export interface ProductVariant {
  size: string;
  weight: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  previousPrice?: number;
  images: string[];
  variants?: ProductVariant[];
  inStock: boolean;
  stockQty: number;
  featured: boolean;
  bestseller: boolean;
  rating: number;
  reviewsCount: number;
  ingredients: string[];
  allergens?: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  variant?: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax?: number;
  total: number;
  amountPaid: number;
  amountReceived?: number;
  changeDue?: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'COD' | 'Card';
  paymentStatus: 'Paid' | 'Pending' | 'Partial' | 'Refunded';
  fulfillmentMethod: 'Delivery' | 'Pickup';
  deliveryAddress?: string;
  cashierId?: string;
  cashierName?: string;
  assignedBaker?: string;
  assignedBakerId?: string;
  productionStage?: string;
  deadline?: string;
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Completed' | 'Cancelled';
  isCustomCake?: boolean;
  customCakeId?: string;
  requiresPreparation?: boolean;
  createdAt: string;
}

export type CustomCakeStatus = 
  | 'Pending' 
  | 'Under Review' 
  | 'Quotation Sent' 
  | 'Approved' 
  | 'Rejected' 
  | 'Converted to Order'
  | 'Pending Review' 
  | 'Quotation Approved' 
  | 'Quotation Rejected' 
  | 'Confirmed' 
  | 'In Production' 
  | 'Ready' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Delivered' 
  | 'In Kitchen' 
  | 'Quoted' 
  | 'Reviewing';

export interface CustomCakeRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  occasion: string;
  cakeType: string;
  flavor: string;
  sizeWeight: string;
  tiers: string;
  filling: string;
  froasting: string;
  preferredColors: string[];
  designDescription: string;
  personalMessage: string;
  referenceImage?: string;
  requiredDate: string;
  pickupOrDelivery: 'Pickup' | 'Delivery';
  deliveryAddress?: string;
  estimatedPrice: number;
  quotedPrice?: number;
  quotationNotes?: string;
  rejectionReason?: string;
  convertedOrderId?: string;
  convertedOrderNumber?: string;
  status: CustomCakeStatus;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  purchaseCost: number;
  supplier: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Critical';
  expiryDate?: string;
  batchNumber?: string;
  storageLocation?: string;
  reorderQuantity?: number;
  notes?: string;
  lastUpdated: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  suppliedCategories: string[];
  status: 'Active' | 'Inactive';
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  receivedQuantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Approved' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  notes?: string;
  createdBy: string;
  receivedAt?: string;
  createdAt?: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: 'Received' | 'Used' | 'Wasted' | 'Adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  unit: string;
  reason: string;
  referenceNumber?: string;
  performedBy: string;
  performedById?: string;
  createdAt: string;
}

export interface RestockRequest {
  id: string;
  ingredientName: string;
  quantityNeeded: string;
  urgency: 'Normal' | 'High' | 'Critical';
  notes?: string;
  requestedBy: string;
  status: 'Pending' | 'Approved' | 'PO Created' | 'Fulfilled' | 'Dismissed';
  createdAt: string;
}

export interface InventoryDashboardStats {
  totalItems: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
  totalValuation: number;
  pendingRestockRequestsCount: number;
  pendingPurchaseOrdersCount: number;
  recentMovements: StockMovement[];
}

export type ProductionKanbanStatus = 'Assigned' | 'In Progress' | 'Ready';
export type ProductionActivity = 'Preparing' | 'Baking' | 'Decorating' | 'Ready' | 'None';

export interface ProductionTask {
  id: string;
  orderId?: string;
  orderNumber?: string;
  customCakeId?: string;
  customerName?: string;
  orderDate?: string;
  productName: string;
  quantity: number;
  specifications: string;
  referenceImage?: string;
  assignedBaker: string;
  assignedBakerId?: string;
  deadline: string;
  priority?: 'Normal' | 'High' | 'Urgent';
  kanbanStatus?: ProductionKanbanStatus;
  currentActivity?: ProductionActivity;
  stage: 'Queued' | 'In Preparation' | 'Baking' | 'Decorating' | 'Quality Check' | 'Completed';
  notes?: string;
  cakeSpecs?: {
    flavor?: string;
    sizeWeight?: string;
    tiers?: string;
    filling?: string;
    frosting?: string;
    preferredColors?: string[];
    personalMessage?: string;
    allergens?: string[];
  };
  ingredientsDeducted?: boolean;
  completedAt?: string;
  lastUpdatedBy?: string;
  lastUpdatedById?: string;
  lastUpdatedAt?: string;
}

export function getProductionKanbanStatus(task: ProductionTask): ProductionKanbanStatus {
  if (task.kanbanStatus) return task.kanbanStatus;
  if (task.stage === 'Completed' || task.stage === 'Quality Check') return 'Ready';
  if (['In Preparation', 'Baking', 'Decorating'].includes(task.stage)) return 'In Progress';
  return 'Assigned';
}

export function getProductionActivity(task: ProductionTask): ProductionActivity {
  if (task.currentActivity && task.currentActivity !== 'None') return task.currentActivity;
  if (task.stage === 'Baking') return 'Baking';
  if (task.stage === 'Decorating') return 'Decorating';
  if (task.stage === 'In Preparation') return 'Preparing';
  if (task.stage === 'Completed' || task.stage === 'Quality Check') return 'Ready';
  return 'None';
}

export type DeliveryStatus =
  | 'Pending Assignment'
  | 'Assigned'
  | 'Picked Up'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Failed Delivery'
  | 'Returned';

export interface DeliveryTimelineEvent {
  status: DeliveryStatus;
  timestamp: string;
  updatedBy: string;
  notes?: string;
}

export interface DeliveryTaskItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
}

export interface DeliveryTask {
  id: string;
  orderId?: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  instructions?: string;
  items?: DeliveryTaskItem[];
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'Pending' | 'Paid' | 'Partial' | 'Refunded';
  codAmountDue?: number;
  codAmountCollected?: number;
  codCollectedAt?: string;
  assignedStaff: string;
  assignedStaffId?: string;
  assignedStaffPhone?: string;
  scheduledAt: string;
  estimatedTime?: string;
  priority?: 'Normal' | 'High' | 'Urgent';
  status: DeliveryStatus;
  recipientName?: string;
  deliveryNotes?: string;
  failedReason?: string;
  proofOfDelivery?: string;
  timeline?: DeliveryTimelineEvent[];
  completedAt?: string;
  createdAt?: string;
}

export interface DeliveryDashboardStats {
  totalAssigned: number;
  pendingDeliveries: number;
  inProgressDeliveries: number;
  deliveredToday: number;
  totalDelivered: number;
  failedDeliveries: number;
  codPendingTotal: number;
  codCollectedToday: number;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  description: string;
  createdBy: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  itemCount?: number;
}

export interface BakerySettings {
  bakeryName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  currency: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  taxRate: number;
  businessHours: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  salesByDay: { day: string; sales: number; orders: number }[];
  recentOrders: Order[];
  recentCustomers: User[];
  topSellingProducts: { name: string; quantity: number; revenue: number; image: string }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'cake' | 'inventory' | 'delivery' | 'system';
  read: boolean;
  createdAt: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  orderId?: string;
  orderNumber?: string;
}

export function isOrderRequiringPreparation(order: Order, products?: Product[]): boolean {
  if (order.requiresPreparation !== undefined) return Boolean(order.requiresPreparation);
  if (order.isCustomCake || order.id?.startsWith('ord-cc-')) return true;
  if (!order.items || order.items.length === 0) return true;

  const readyMadeKeywords = ['cookie', 'cookies', 'brownie', 'brownies'];
  const hasPrepItem = order.items.some(item => {
    const itemName = (item.name || '').toLowerCase();
    if (readyMadeKeywords.some(kw => itemName.includes(kw))) {
      return false;
    }
    if (products) {
      const prod = products.find(p => p.id === item.productId || p.name.toLowerCase() === itemName);
      if (prod && ['cookies', 'brownies', 'ready-made', 'packaged'].includes(prod.category.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return hasPrepItem;
}

