import { Product, Order, CustomCakeRequest, InventoryItem, ProductionTask, DeliveryTask, Expense, NotificationItem, User, Supplier, PurchaseOrder, StockMovement, RestockRequest } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Admin User',
    email: 'admin@thecakehouse.pk',
    phone: '+92 300 1234567',
    role: 'admin',
    status: 'active',
    addresses: ['Gulberg III, Lahore', 'DHA Phase 5, Lahore'],
    createdAt: '2025-01-01'
  },
  {
    id: 'u-2',
    name: 'Ayesha Khan',
    email: 'ayesha@gmail.com',
    phone: '+92 312 9876543',
    role: 'customer',
    status: 'active',
    addresses: ['DHA Phase 6, Lahore', 'Model Town, Lahore'],
    createdAt: '2026-01-15'
  },
  {
    id: 'u-3',
    name: 'Ahmed Raza',
    email: 'cashier@thecakehouse.pk',
    phone: '+92 321 4567890',
    role: 'cashier',
    status: 'active',
    addresses: ['Johar Town, Lahore'],
    createdAt: '2026-02-01'
  },
  {
    id: 'u-4',
    name: 'Chef Tariq',
    email: 'baker@thecakehouse.pk',
    phone: '+92 333 5554433',
    role: 'baker',
    status: 'active',
    addresses: ['Allama Iqbal Town, Lahore'],
    createdAt: '2026-02-05'
  },
  {
    id: 'u-5',
    name: 'Salman Ali',
    email: 'inventory@thecakehouse.pk',
    phone: '+92 342 1112233',
    role: 'inventory_manager',
    status: 'active',
    addresses: ['Cantt, Lahore'],
    createdAt: '2026-02-10'
  },
  {
    id: 'u-6',
    name: 'Bilal Raza',
    email: 'delivery@thecakehouse.pk',
    phone: '+92 301 9988776',
    role: 'delivery',
    status: 'active',
    addresses: ['Garden Town, Lahore'],
    createdAt: '2026-02-12'
  },
  {
    id: 'u-guest',
    name: 'Guest Visitor',
    email: 'guest@thecakehouse.pk',
    phone: '',
    role: 'guest',
    status: 'active',
    addresses: [],
    createdAt: '2026-02-15'
  }
];

export const CATEGORIES = [
  { id: 'all', name: 'All Products', count: 48 },
  { id: 'cakes', name: 'Cakes', count: 12 },
  { id: 'cupcakes', name: 'Cupcakes', count: 8 },
  { id: 'pastries', name: 'Pastries', count: 7 },
  { id: 'brownies', name: 'Brownies', count: 6 },
  { id: 'cookies', name: 'Cookies', count: 4 },
  { id: 'bread', name: 'Bread', count: 5 },
  { id: 'desserts', name: 'Desserts', count: 6 },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Chocolate Fudge Cake',
    slug: 'chocolate-fudge-cake',
    category: 'cakes',
    description: 'Rich chocolate cake with velvety fudge frosting. A perfect treat for any celebration made with premium cocoa and fresh cream.',
    price: 4500,
    previousPrice: 5000,
    images: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      '/assets/custom_wedding_cake.jpg'
    ],
    variants: [
      { size: '6 inch', weight: '1.0 kg', price: 3500 },
      { size: '8 inch', weight: '1.5 kg', price: 4500 },
      { size: '10 inch', weight: '2.5 kg', price: 6500 }
    ],
    inStock: true,
    stockQty: 25,
    featured: true,
    bestseller: true,
    rating: 4.8,
    reviewsCount: 324,
    ingredients: ['Belgian Cocoa', 'Fresh Cream', 'Unsalted Butter', 'Organic Eggs', 'Fine Flour'],
    allergens: ['Dairy', 'Eggs', 'Gluten']
  },
  {
    id: 'prod-2',
    name: 'Red Velvet Cake',
    slug: 'red-velvet-cake',
    category: 'cakes',
    description: 'Classic velvety red sponge layered with rich cream cheese frosting and fine red velvet crumbs.',
    price: 4800,
    images: [
      'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80',
      '/assets/custom_wedding_cake.jpg'
    ],
    variants: [
      { size: '6 inch', weight: '1.0 kg', price: 3800 },
      { size: '8 inch', weight: '1.5 kg', price: 4800 },
      { size: '10 inch', weight: '2.5 kg', price: 6800 }
    ],
    inStock: true,
    stockQty: 18,
    featured: true,
    bestseller: true,
    rating: 4.9,
    reviewsCount: 215,
    ingredients: ['Cream Cheese', 'Cocoa Powder', 'Buttermilk', 'Vanilla Extract', 'Butter'],
    allergens: ['Dairy', 'Eggs', 'Gluten']
  },
  {
    id: 'prod-3',
    name: 'Vanilla Cupcakes (Box of 6)',
    slug: 'vanilla-cupcakes',
    category: 'cupcakes',
    description: 'Fluffy vanilla sponge cupcakes topped with swirling pastel buttercream frosting and sprinkles.',
    price: 1200,
    images: [
      'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
    ],
    inStock: true,
    stockQty: 40,
    featured: true,
    bestseller: false,
    rating: 4.7,
    reviewsCount: 98,
    ingredients: ['Madagascar Vanilla', 'Butter', 'Sugar', 'Milk', 'Eggs'],
    allergens: ['Dairy', 'Eggs', 'Gluten']
  },
  {
    id: 'prod-4',
    name: 'Chocolate Brownies',
    slug: 'chocolate-brownies',
    category: 'brownies',
    description: 'Fudgy, rich chocolate brownies with a crackly top and gooey center. Baked daily in small batches.',
    price: 850,
    previousPrice: 950,
    images: [
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
    ],
    inStock: true,
    stockQty: 30,
    featured: true,
    bestseller: true,
    rating: 4.9,
    reviewsCount: 412,
    ingredients: ['Dark Chocolate 70%', 'Butter', 'Eggs', 'Brown Sugar', 'Walnuts'],
    allergens: ['Dairy', 'Eggs', 'Nuts', 'Gluten']
  },
  {
    id: 'prod-5',
    name: 'Butter Croissants',
    slug: 'butter-croissants',
    category: 'pastries',
    description: 'Flaky, golden-brown French butter croissants with hundreds of delicate buttery layers.',
    price: 450,
    images: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'
    ],
    inStock: true,
    stockQty: 50,
    featured: false,
    bestseller: true,
    rating: 4.6,
    reviewsCount: 150,
    ingredients: ['French Butter', 'Flour', 'Milk', 'Yeast', 'A pinch of sea salt'],
    allergens: ['Dairy', 'Gluten']
  },
  {
    id: 'prod-6',
    name: 'Chocolate Chip Cookies',
    slug: 'chocolate-chip-cookies',
    category: 'cookies',
    description: 'Chewy cookies loaded with premium Belgian milk and dark chocolate chunks.',
    price: 450,
    images: [
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80'
    ],
    inStock: true,
    stockQty: 60,
    featured: false,
    bestseller: false,
    rating: 4.8,
    reviewsCount: 180,
    ingredients: ['Chocolate Chunks', 'Brown Sugar', 'Butter', 'Flour'],
    allergens: ['Dairy', 'Eggs', 'Gluten']
  },
  {
    id: 'prod-7',
    name: 'Fresh Cream Cake',
    slug: 'fresh-cream-cake',
    category: 'cakes',
    description: 'Light vanilla sponge layered with whipped fresh cream and seasonal fresh fruits like strawberries and mangoes.',
    price: 3200,
    images: [
      '/assets/custom_wedding_cake.jpg'
    ],
    variants: [
      { size: '6 inch', weight: '1.0 kg', price: 2600 },
      { size: '8 inch', weight: '1.5 kg', price: 3200 },
      { size: '10 inch', weight: '2.5 kg', price: 4800 }
    ],
    inStock: true,
    stockQty: 12,
    featured: false,
    bestseller: true,
    rating: 4.9,
    reviewsCount: 290,
    ingredients: ['Fresh Dairy Cream', 'Vanilla Sponge', 'Fresh Seasonal Fruits'],
    allergens: ['Dairy', 'Eggs', 'Gluten']
  },
  {
    id: 'prod-8',
    name: 'Lotus Biscoff Cake',
    slug: 'lotus-biscoff-cake',
    category: 'cakes',
    description: 'Caramelized spiced sponge with Lotus Biscoff spread filling and crunchy biscuit crumb topping.',
    price: 4900,
    images: [
      'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1562440499-64c9a111f713?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { size: '6 inch', weight: '1.0 kg', price: 3900 },
      { size: '8 inch', weight: '1.5 kg', price: 4900 }
    ],
    inStock: true,
    stockQty: 15,
    featured: true,
    bestseller: true,
    rating: 5.0,
    reviewsCount: 340,
    ingredients: ['Lotus Biscoff Spread', 'Biscoff Biscuits', 'Caramel', 'Butter'],
    allergens: ['Dairy', 'Gluten', 'Soy']
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: '#TH-1024',
    customerId: 'u-2',
    customerName: 'Ayesha Khan',
    customerPhone: '+92 312 9876543',
    items: [
      { productId: 'prod-1', name: 'Chocolate Fudge Cake (8 inch)', price: 4500, quantity: 1, variant: '8 inch' }
    ],
    subtotal: 4500,
    discount: 0,
    deliveryFee: 200,
    total: 4700,
    amountPaid: 4700,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    fulfillmentMethod: 'Delivery',
    deliveryAddress: 'DHA Phase 6, Lahore',
    status: 'Out for Delivery',
    createdAt: '2026-10-28 14:30'
  },
  {
    id: 'ord-102',
    orderNumber: '#TH-1023',
    customerId: 'u-2',
    customerName: 'Ayesha Khan',
    customerPhone: '+92 312 9876543',
    items: [
      { productId: 'prod-3', name: 'Vanilla Cupcakes', price: 1200, quantity: 1 }
    ],
    subtotal: 1200,
    discount: 0,
    deliveryFee: 200,
    total: 1400,
    amountPaid: 1400,
    paymentMethod: 'COD',
    paymentStatus: 'Paid',
    fulfillmentMethod: 'Delivery',
    deliveryAddress: 'DHA Phase 6, Lahore',
    status: 'Completed',
    createdAt: '2026-10-27 11:15'
  },
  {
    id: 'ord-103',
    orderNumber: '#TH-1022',
    customerId: 'u-7',
    customerName: 'Sara Ahmed',
    customerPhone: '+92 300 5551234',
    items: [
      { productId: 'prod-5', name: 'Butter Croissants (Box of 4)', price: 450, quantity: 2 }
    ],
    subtotal: 900,
    discount: 0,
    deliveryFee: 150,
    total: 1050,
    amountPaid: 1050,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    fulfillmentMethod: 'Pickup',
    status: 'Ready',
    createdAt: '2026-10-28 16:00'
  },
  {
    id: 'ord-104',
    orderNumber: '#TH-1021',
    customerId: 'u-8',
    customerName: 'Bilal Raza',
    customerPhone: '+92 322 7766554',
    items: [
      { productId: 'prod-4', name: 'Chocolate Brownies', price: 850, quantity: 1 }
    ],
    subtotal: 850,
    discount: 0,
    deliveryFee: 0,
    total: 850,
    amountPaid: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    fulfillmentMethod: 'Pickup',
    status: 'Preparing',
    createdAt: '2026-10-28 17:10'
  }
];

export const INITIAL_CUSTOM_CAKES: CustomCakeRequest[] = [
  {
    id: 'cc-1',
    requestNumber: '#CC-501',
    customerId: 'u-2',
    customerName: 'Ayesha Khan',
    customerPhone: '+92 312 9876543',
    occasion: 'Birthday',
    cakeType: 'Round Cake',
    flavor: 'Chocolate',
    sizeWeight: '8 inch (1.5 kg)',
    tiers: 'Single Tier',
    filling: 'Chocolate Mousse',
    froasting: 'Fresh Cream',
    preferredColors: ['#762F3D', '#C5A46D', '#F3E6DF'],
    designDescription: 'A simple elegant cake with floral design and gold dusting.',
    personalMessage: 'Happy 25th Birthday Ayesha!',
    referenceImage: '/assets/custom_wedding_cake.jpg',
    requiredDate: '2026-11-05',
    pickupOrDelivery: 'Delivery',
    deliveryAddress: 'DHA Phase 6, Lahore',
    estimatedPrice: 4500,
    quotedPrice: 4800,
    status: 'Confirmed',
    createdAt: '2026-10-28 10:00'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Flour (Fine Grade)', category: 'Dry Goods', unit: 'kg', currentStock: 120, minStock: 50, purchaseCost: 180, supplier: 'Punjab Flour Mills', status: 'In Stock', expiryDate: '2026-12-15', batchNumber: 'BAT-FL-2026-10', storageLocation: 'Pantry Bin A1', lastUpdated: '2026-10-28' },
  { id: 'inv-2', name: 'Sugar (Refined)', category: 'Dry Goods', unit: 'kg', currentStock: 45, minStock: 40, purchaseCost: 220, supplier: 'Al-Madina Traders', status: 'Low Stock', expiryDate: '2027-01-20', batchNumber: 'BAT-SG-2026-08', storageLocation: 'Pantry Bin A2', lastUpdated: '2026-10-27' },
  { id: 'inv-3', name: 'Unsalted Butter', category: 'Dairy', unit: 'kg', currentStock: 25, minStock: 30, purchaseCost: 1400, supplier: 'Adams Dairy', status: 'Low Stock', expiryDate: '2026-11-12', batchNumber: 'BAT-BT-2026-15', storageLocation: 'Chiller Unit #2', lastUpdated: '2026-10-28' },
  { id: 'inv-4', name: 'Fresh Cream', category: 'Dairy', unit: 'L', currentStock: 65, minStock: 25, purchaseCost: 850, supplier: 'Haleeb Foods', status: 'In Stock', expiryDate: '2026-11-08', batchNumber: 'BAT-CR-2026-22', storageLocation: 'Cold Room #1', lastUpdated: '2026-10-28' },
  { id: 'inv-5', name: 'Belgian Dark Chocolate', category: 'Chocolates', unit: 'kg', currentStock: 18, minStock: 10, purchaseCost: 2800, supplier: 'Global Gourmet PK', status: 'In Stock', expiryDate: '2027-04-30', batchNumber: 'BAT-CH-2026-04', storageLocation: 'Dry Pantry Shelf C2', lastUpdated: '2026-10-26' },
  { id: 'inv-6', name: 'Eggs (Farm Fresh)', category: 'Dairy', unit: 'dozen', currentStock: 8, minStock: 15, purchaseCost: 350, supplier: 'Local Poultry Farm', status: 'Low Stock', expiryDate: '2026-11-06', batchNumber: 'BAT-EG-2026-30', storageLocation: 'Chiller Unit #1', lastUpdated: '2026-10-28' },
  { id: 'inv-7', name: 'Vanilla Extract (Pure)', category: 'Baking Essentials', unit: 'L', currentStock: 4, minStock: 5, purchaseCost: 3200, supplier: 'Global Gourmet PK', status: 'Low Stock', expiryDate: '2027-08-15', batchNumber: 'BAT-VN-2026-01', storageLocation: 'Spice & Essence Cabinet', lastUpdated: '2026-10-25' },
  { id: 'inv-8', name: 'Cocoa Powder (Dutch Process)', category: 'Chocolates', unit: 'kg', currentStock: 22, minStock: 12, purchaseCost: 2400, supplier: 'Global Gourmet PK', status: 'In Stock', expiryDate: '2027-03-10', batchNumber: 'BAT-CC-2026-09', storageLocation: 'Dry Pantry Shelf C1', lastUpdated: '2026-10-29' }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Punjab Flour Mills',
    contactPerson: 'Tariq Mehmood',
    phone: '+92 300 4455667',
    email: 'sales@punjabflour.pk',
    address: 'Raiwind Road Industrial Area, Lahore',
    suppliedCategories: ['Dry Goods', 'Baking Essentials'],
    status: 'Active',
    paymentTerms: 'Net 15',
    notes: 'Primary supplier for fine pastry flour and whole wheat grain.',
    createdAt: '2025-06-15'
  },
  {
    id: 'sup-2',
    name: 'Adams Dairy',
    contactPerson: 'Imran Khan',
    phone: '+92 321 8899001',
    email: 'orders@adamsdairy.pk',
    address: 'Ferozepur Road, Lahore',
    suppliedCategories: ['Dairy'],
    status: 'Active',
    paymentTerms: 'Weekly Cash',
    notes: 'Premium unsalted European-style butter and cheese.',
    createdAt: '2025-07-20'
  },
  {
    id: 'sup-3',
    name: 'Global Gourmet PK',
    contactPerson: 'Sarah Alvi',
    phone: '+92 333 5566778',
    email: 'contact@globalgourmet.pk',
    address: 'Gulberg III, MM Alam Arcade, Lahore',
    suppliedCategories: ['Chocolates', 'Baking Essentials'],
    status: 'Active',
    paymentTerms: 'Net 30',
    notes: 'Official distributor for Belgian Callebaut chocolate and vanilla beans.',
    createdAt: '2025-08-10'
  },
  {
    id: 'sup-4',
    name: 'Al-Madina Traders',
    contactPerson: 'Bilal Ahmed',
    phone: '+92 345 1122334',
    email: 'info@almadinatraders.pk',
    address: 'Akbari Mandi, Lahore',
    suppliedCategories: ['Dry Goods'],
    status: 'Active',
    paymentTerms: 'Net 15',
    notes: 'Wholesale refined sugar, caster sugar, and brown sugar.',
    createdAt: '2025-09-01'
  },
  {
    id: 'sup-5',
    name: 'Haleeb Foods',
    contactPerson: 'Noman Sheikh',
    phone: '+92 300 9988776',
    email: 'b2b@haleebfoods.pk',
    address: 'Defense Road, Lahore',
    suppliedCategories: ['Dairy'],
    status: 'Active',
    paymentTerms: 'Net 30',
    notes: 'Heavy whipping cream, fresh milk, and condensed milk.',
    createdAt: '2025-09-15'
  },
  {
    id: 'sup-6',
    name: 'Local Poultry Farm',
    contactPerson: 'Asif Ali',
    phone: '+92 312 3344556',
    email: 'asif@poultryfarm.pk',
    address: 'Barki Road, Lahore',
    suppliedCategories: ['Dairy'],
    status: 'Active',
    paymentTerms: 'Cash on Delivery',
    notes: 'Daily delivery of grade-A fresh organic eggs.',
    createdAt: '2025-10-01'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-101',
    poNumber: 'PO-2026-101',
    supplierId: 'sup-3',
    supplierName: 'Global Gourmet PK',
    orderDate: '2026-10-28',
    expectedDeliveryDate: '2026-11-05',
    items: [
      {
        ingredientId: 'inv-5',
        ingredientName: 'Belgian Dark Chocolate',
        quantity: 20,
        receivedQuantity: 20,
        unit: 'kg',
        unitPrice: 2800,
        totalCost: 56000
      },
      {
        ingredientId: 'inv-8',
        ingredientName: 'Cocoa Powder (Dutch Process)',
        quantity: 15,
        receivedQuantity: 15,
        unit: 'kg',
        unitPrice: 2400,
        totalCost: 36000
      }
    ],
    totalAmount: 92000,
    status: 'Received',
    paymentStatus: 'Paid',
    notes: 'Festive season batch restock for artisanal chocolate fudge cakes.',
    createdBy: 'Salman Inventory',
    receivedAt: '2026-10-31',
    createdAt: '2026-10-28'
  },
  {
    id: 'po-102',
    poNumber: 'PO-2026-102',
    supplierId: 'sup-2',
    supplierName: 'Adams Dairy',
    orderDate: '2026-11-01',
    expectedDeliveryDate: '2026-11-04',
    items: [
      {
        ingredientId: 'inv-3',
        ingredientName: 'Unsalted Butter',
        quantity: 40,
        receivedQuantity: 0,
        unit: 'kg',
        unitPrice: 1400,
        totalCost: 56000
      }
    ],
    totalAmount: 56000,
    status: 'Ordered',
    paymentStatus: 'Unpaid',
    notes: 'Urgent restock requested due to weekend high volume custom cake orders.',
    createdBy: 'Salman Inventory',
    createdAt: '2026-11-01'
  },
  {
    id: 'po-103',
    poNumber: 'PO-2026-103',
    supplierId: 'sup-6',
    supplierName: 'Local Poultry Farm',
    orderDate: '2026-11-02',
    expectedDeliveryDate: '2026-11-03',
    items: [
      {
        ingredientId: 'inv-6',
        ingredientName: 'Eggs (Farm Fresh)',
        quantity: 30,
        receivedQuantity: 0,
        unit: 'dozen',
        unitPrice: 350,
        totalCost: 10500
      }
    ],
    totalAmount: 10500,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    notes: 'Low stock safety buffer replenishment.',
    createdBy: 'Salman Inventory',
    createdAt: '2026-11-02'
  }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    ingredientId: 'inv-5',
    ingredientName: 'Belgian Dark Chocolate',
    type: 'Received',
    quantity: 20,
    previousStock: 8,
    newStock: 28,
    unit: 'kg',
    reason: 'Received shipment against PO-2026-101',
    referenceNumber: 'PO-2026-101',
    performedBy: 'Salman Inventory',
    createdAt: '2026-10-31 10:30'
  },
  {
    id: 'mov-2',
    ingredientId: 'inv-5',
    ingredientName: 'Belgian Dark Chocolate',
    type: 'Used',
    quantity: 10,
    previousStock: 28,
    newStock: 18,
    unit: 'kg',
    reason: 'Kitchen batch for 12 Chocolate Fudge Cakes',
    referenceNumber: 'KITCHEN-ROTA-24',
    performedBy: 'Chef Tariq',
    createdAt: '2026-11-01 14:15'
  },
  {
    id: 'mov-3',
    ingredientId: 'inv-3',
    ingredientName: 'Unsalted Butter',
    type: 'Used',
    quantity: 15,
    previousStock: 40,
    newStock: 25,
    unit: 'kg',
    reason: 'Buttercream batch preparation for wedding cake tiers',
    referenceNumber: 'ORD-101',
    performedBy: 'Chef Tariq',
    createdAt: '2026-11-02 09:00'
  },
  {
    id: 'mov-4',
    ingredientId: 'inv-6',
    ingredientName: 'Eggs (Farm Fresh)',
    type: 'Wasted',
    quantity: 2,
    previousStock: 10,
    newStock: 8,
    unit: 'dozen',
    reason: 'Cracked shells discovered during cold storage inspection',
    referenceNumber: 'WASTE-REPORT-08',
    performedBy: 'Salman Inventory',
    createdAt: '2026-11-02 16:45'
  },
  {
    id: 'mov-5',
    ingredientId: 'inv-1',
    ingredientName: 'Flour (Fine Grade)',
    type: 'Adjustment',
    quantity: 5,
    previousStock: 115,
    newStock: 120,
    unit: 'kg',
    reason: 'Monthly physical inventory count reconciliation',
    referenceNumber: 'AUDIT-OCT-2026',
    performedBy: 'Salman Inventory',
    createdAt: '2026-10-31 18:00'
  }
];

export const INITIAL_RESTOCK_REQUESTS: RestockRequest[] = [
  {
    id: 'req-1',
    ingredientName: 'Belgian Dark Chocolate',
    quantityNeeded: '15 kg',
    urgency: 'High',
    notes: 'Urgent custom 3-tier anniversary cake scheduled for tomorrow requires extra dark cocoa and couverture.',
    requestedBy: 'Chef Tariq',
    status: 'Pending',
    createdAt: '2026-11-02 11:20'
  },
  {
    id: 'req-2',
    ingredientName: 'Unsalted Butter',
    quantityNeeded: '20 kg',
    urgency: 'Critical',
    notes: 'Main mixer deck running low on butter for morning brioche and cake sponges.',
    requestedBy: 'Chef Tariq',
    status: 'Pending',
    createdAt: '2026-11-03 08:45'
  }
];

export const INITIAL_PRODUCTION_TASKS: ProductionTask[] = [
  {
    id: 'pt-1',
    orderId: 'ord-101',
    productName: 'Chocolate Fudge Cake (8 inch)',
    quantity: 1,
    specifications: '8 inch, Chocolate Mousse filling, Fresh cream frosting',
    assignedBaker: 'Chef Tariq',
    deadline: '2026-10-28 13:00',
    stage: 'Decorating',
    notes: 'Extra chocolate shavings on top.'
  },
  {
    id: 'pt-2',
    customCakeId: 'cc-1',
    productName: 'Custom Birthday Cake (Ayesha)',
    quantity: 1,
    specifications: '8 inch Round, Chocolate, Floral design in burgundy & gold',
    assignedBaker: 'Chef Tariq',
    deadline: '2026-11-04 18:00',
    stage: 'Queued',
    notes: 'Awaiting final glaze check.'
  },
  {
    id: 'pt-3',
    orderId: 'ord-104',
    productName: 'Chocolate Brownies',
    quantity: 1,
    specifications: 'Standard box with walnuts',
    assignedBaker: 'Chef Tariq',
    deadline: '2026-10-28 18:00',
    stage: 'Baking',
    notes: 'Bake for 35 mins at 180°C.'
  }
];

export const INITIAL_DELIVERIES: DeliveryTask[] = [
  {
    id: 'del-101',
    orderId: 'ord-101',
    orderNumber: '#TH-1024',
    customerId: 'u-2',
    customerName: 'Ayesha Khan',
    customerPhone: '+92 312 9876543',
    customerEmail: 'customer@thecakehouse.pk',
    address: 'House 42-B, Sector Z, Phase 6, DHA, Lahore',
    instructions: 'Fragile fondant tier! Please handle gently and ring the side entrance bell.',
    items: [
      { productId: 'prod-1', name: 'Chocolate Fudge Cake (8 inch)', price: 4500, quantity: 1, variant: '8 inch', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' }
    ],
    totalAmount: 4700,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Paid',
    codAmountDue: 0,
    assignedStaff: 'Bilal Raza',
    assignedStaffId: 'u-delivery',
    assignedStaffPhone: '+92 301 9988776',
    scheduledAt: '2026-11-03 16:30',
    estimatedTime: '16:30 - 17:15',
    priority: 'High',
    status: 'Out for Delivery',
    timeline: [
      { status: 'Assigned', timestamp: '2026-11-03 14:00', updatedBy: 'Admin Dispatch', notes: 'Assigned to courier route DHA Phase 6' },
      { status: 'Picked Up', timestamp: '2026-11-03 15:10', updatedBy: 'Bilal Raza', notes: 'Packed in thermal chilled case' },
      { status: 'Out for Delivery', timestamp: '2026-11-03 16:00', updatedBy: 'Bilal Raza', notes: 'Dispatched on bakery courier bike #4' }
    ],
    createdAt: '2026-11-03 13:45'
  },
  {
    id: 'del-102',
    orderId: 'ord-105',
    orderNumber: '#TH-1025',
    customerId: 'u-cust-3',
    customerName: 'Dr. Hamza Tariq',
    customerPhone: '+92 300 8472911',
    customerEmail: 'hamza.tariq@punjab.med.pk',
    address: 'Apartment 402, Signature Heights, MM Alam Road, Gulberg III, Lahore',
    instructions: 'Do NOT ring the doorbell (infant sleeping). Please call on arrival and wait at lobby.',
    items: [
      { productId: 'prod-2', name: 'Red Velvet Cake (2 lbs)', price: 3800, quantity: 1, variant: '2 lbs', image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=80' },
      { productId: 'prod-6', name: 'Lotus Biscoff Cake (2 lbs)', price: 4800, quantity: 1, variant: '2 lbs', image: '/assets/custom_wedding_cake.jpg' }
    ],
    totalAmount: 8850,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    codAmountDue: 8850,
    assignedStaff: 'Bilal Raza',
    assignedStaffId: 'u-delivery',
    assignedStaffPhone: '+92 301 9988776',
    scheduledAt: '2026-11-03 18:00',
    estimatedTime: '17:45 - 18:30',
    priority: 'Urgent',
    status: 'In Transit',
    timeline: [
      { status: 'Assigned', timestamp: '2026-11-03 15:30', updatedBy: 'Admin Dispatch' },
      { status: 'Picked Up', timestamp: '2026-11-03 16:45', updatedBy: 'Bilal Raza' },
      { status: 'In Transit', timestamp: '2026-11-03 17:15', updatedBy: 'Bilal Raza', notes: 'Heading toward Gulberg III via Main Boulevard' }
    ],
    createdAt: '2026-11-03 15:15'
  },
  {
    id: 'del-103',
    orderId: 'ord-106',
    orderNumber: '#TH-1026',
    customerId: 'u-cust-4',
    customerName: 'Zainab Malik',
    customerPhone: '+92 321 4455667',
    customerEmail: 'zainab.malik@outlook.com',
    address: 'House 18-A, Block C, Model Town, Lahore',
    instructions: 'Deliver to Gate #2. Security guard has been informed to receive if unavailable.',
    items: [
      { productId: 'prod-3', name: 'Vanilla Cupcakes (Box of 6)', price: 1200, quantity: 2, image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80' }
    ],
    totalAmount: 2650,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    codAmountDue: 2650,
    assignedStaff: 'Bilal Raza',
    assignedStaffId: 'u-delivery',
    assignedStaffPhone: '+92 301 9988776',
    scheduledAt: '2026-11-03 19:30',
    estimatedTime: '19:15 - 20:00',
    priority: 'Normal',
    status: 'Assigned',
    timeline: [
      { status: 'Assigned', timestamp: '2026-11-03 16:00', updatedBy: 'Admin User', notes: 'Assigned for evening slot' }
    ],
    createdAt: '2026-11-03 15:50'
  },
  {
    id: 'del-104',
    orderId: 'ord-107',
    orderNumber: '#TH-1027',
    customerId: 'u-cust-5',
    customerName: 'Usman Ali',
    customerPhone: '+92 333 9812345',
    customerEmail: 'usman.ali@gmail.com',
    address: 'Villa 12, Sector C, Bahria Town, Lahore',
    instructions: 'Main entrance porch. Call before leaving Ring Road.',
    items: [
      { productId: 'prod-5', name: 'Butter Croissants (Box of 4)', price: 450, quantity: 3, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80' }
    ],
    totalAmount: 1600,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    codAmountDue: 0,
    assignedStaff: 'Bilal Raza',
    assignedStaffId: 'u-delivery',
    assignedStaffPhone: '+92 301 9988776',
    scheduledAt: '2026-11-03 20:30',
    estimatedTime: '20:15 - 21:00',
    priority: 'Normal',
    status: 'Picked Up',
    timeline: [
      { status: 'Assigned', timestamp: '2026-11-03 17:00', updatedBy: 'Admin Dispatch' },
      { status: 'Picked Up', timestamp: '2026-11-03 18:00', updatedBy: 'Bilal Raza', notes: 'Package secured' }
    ],
    createdAt: '2026-11-03 16:50'
  },
  {
    id: 'del-105',
    orderId: 'ord-102',
    orderNumber: '#TH-1023',
    customerId: 'u-2',
    customerName: 'Ayesha Khan',
    customerPhone: '+92 312 9876543',
    customerEmail: 'customer@thecakehouse.pk',
    address: 'House 42-B, Sector Z, Phase 6, DHA, Lahore',
    instructions: 'Leave with housekeeper Bano if not home.',
    items: [
      { productId: 'prod-3', name: 'Vanilla Cupcakes (Box of 6)', price: 1200, quantity: 1, image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80' }
    ],
    totalAmount: 1400,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Paid',
    codAmountDue: 1400,
    codAmountCollected: 1400,
    codCollectedAt: '2026-11-02 13:20',
    assignedStaff: 'Bilal Raza',
    assignedStaffId: 'u-delivery',
    assignedStaffPhone: '+92 301 9988776',
    scheduledAt: '2026-11-02 13:00',
    priority: 'Normal',
    status: 'Delivered',
    recipientName: 'Bano (Housekeeper)',
    deliveryNotes: 'Delivered safely in person, exact cash Rs. 1,400 collected.',
    proofOfDelivery: 'Signed on paper delivery receipt',
    timeline: [
      { status: 'Assigned', timestamp: '2026-11-02 11:30', updatedBy: 'Admin' },
      { status: 'Picked Up', timestamp: '2026-11-02 12:15', updatedBy: 'Bilal Raza' },
      { status: 'Out for Delivery', timestamp: '2026-11-02 12:45', updatedBy: 'Bilal Raza' },
      { status: 'Delivered', timestamp: '2026-11-02 13:20', updatedBy: 'Bilal Raza', notes: 'Handed to housekeeper Bano' }
    ],
    completedAt: '2026-11-02 13:20',
    createdAt: '2026-11-02 11:15'
  },
  {
    id: 'del-106',
    orderId: 'ord-108',
    orderNumber: '#TH-1018',
    customerId: 'u-cust-6',
    customerName: 'Major Imran Bashir',
    customerPhone: '+92 301 2233445',
    customerEmail: 'imran.bashir@cantt.pk',
    address: 'Bungalow 7, Officers Colony, Cantt, Lahore',
    instructions: 'Check ID at gate with military police.',
    items: [
      { productId: 'prod-4', name: 'Chocolate Brownies', price: 850, quantity: 2, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80' }
    ],
    totalAmount: 1950,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    codAmountDue: 1950,
    assignedStaff: 'Bilal Raza',
    assignedStaffId: 'u-delivery',
    assignedStaffPhone: '+92 301 9988776',
    scheduledAt: '2026-11-02 17:00',
    priority: 'High',
    status: 'Failed Delivery',
    failedReason: 'Customer phone unreachable and gate refused access',
    deliveryNotes: 'Attempted phone call 4 times from Cantt checkpost. Military guard refused unescorted entry.',
    timeline: [
      { status: 'Assigned', timestamp: '2026-11-02 15:00', updatedBy: 'Admin' },
      { status: 'Out for Delivery', timestamp: '2026-11-02 16:30', updatedBy: 'Bilal Raza' },
      { status: 'Failed Delivery', timestamp: '2026-11-02 17:25', updatedBy: 'Bilal Raza', notes: 'Unreachable at security gate' }
    ],
    completedAt: '2026-11-02 17:25',
    createdAt: '2026-11-02 14:40'
  },
  {
    id: 'del-107',
    orderId: 'ord-109',
    orderNumber: '#TH-1015',
    customerId: 'u-cust-7',
    customerName: 'Fatima Sheikh',
    customerPhone: '+92 322 8899112',
    customerEmail: 'fatima.sheikh@gmail.com',
    address: 'Plot 28, Block G-3, Johar Town, Lahore',
    instructions: 'Ring bell twice. Near Expo Centre.',
    items: [
      { productId: 'prod-1', name: 'Chocolate Fudge Cake', price: 4500, quantity: 1, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' }
    ],
    totalAmount: 4750,
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    codAmountDue: 0,
    assignedStaff: 'Bilal Raza',
    assignedStaffId: 'u-delivery',
    assignedStaffPhone: '+92 301 9988776',
    scheduledAt: '2026-11-01 14:00',
    priority: 'Normal',
    status: 'Delivered',
    recipientName: 'Fatima Sheikh (Self)',
    deliveryNotes: 'Delivered in pristine condition directly to customer.',
    completedAt: '2026-11-01 14:18',
    createdAt: '2026-11-01 12:30'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp-1', title: 'Sugar & Flour Bulk Purchase', category: 'Ingredients', amount: 18500, date: '2026-10-27', paymentMethod: 'Bank Transfer', description: 'Monthly stock replenishment from Punjab Mills', createdBy: 'Salman Ali' },
  { id: 'exp-2', title: 'Electric Bill - Bakery Outlet', category: 'Utilities', amount: 32000, date: '2026-10-25', paymentMethod: 'Bank Transfer', description: 'LESCO monthly electricity bill', createdBy: 'Admin User' },
  { id: 'exp-3', title: 'Delivery Fuel Allowance', category: 'Delivery', amount: 4500, date: '2026-10-28', paymentMethod: 'Cash', description: 'Weekly petrol stipend for delivery bikes', createdBy: 'Admin User' }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif-1', title: 'New Order Received', message: 'Order #TH-1024 placed by Ayesha Khan (Rs. 4,700)', type: 'order', read: false, createdAt: '10 mins ago' },
  { id: 'notif-2', title: 'Low Stock Alert', message: 'Unsalted Butter stock is low (25 kg remaining)', type: 'inventory', read: false, createdAt: '1 hour ago' },
  { id: 'notif-3', title: 'Custom Cake Request', message: 'New custom birthday cake request #CC-501 submitted', type: 'cake', read: true, createdAt: 'Yesterday' }
];
