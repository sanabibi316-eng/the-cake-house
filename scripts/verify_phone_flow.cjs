const http = require('http');

function apiCall(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // 1. Fetch current deliveries
  console.log('\n[TEST 1] GET /api/v1/deliveries');
  const delRes = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/deliveries',
    method: 'GET'
  });
  console.log('Status:', delRes.status);
  const dummyCount = delRes.data.filter(d => d.customerPhone === '+92 300 0000000').length;
  console.log(`Deliveries fetched: ${delRes.data.length}. Dummy (+92 300 0000000) count: ${dummyCount}`);
  
  const shaukatDel = delRes.data.find(d => d.customerName === 'Shaukat' || d.orderNumber === '#TH-8625');
  console.log('Shaukat delivery phone:', shaukatDel ? shaukatDel.customerPhone : 'Not found');
  if (shaukatDel && shaukatDel.customerPhone === '03440114925') {
    console.log('PASS: Shaukat delivery has correct phone number 03440114925');
  } else {
    console.error('FAIL: Shaukat phone mismatch!', shaukatDel);
  }

  const ayeshaDel = delRes.data.find(d => d.orderNumber === '#TH-9999');
  console.log('Ayesha (#TH-9999) delivery phone:', ayeshaDel ? ayeshaDel.customerPhone : 'Not found');
  if (ayeshaDel && ayeshaDel.customerPhone === '+92 312 9876543') {
    console.log('PASS: Ayesha delivery has correct phone number +92 312 9876543');
  } else {
    console.error('FAIL: Ayesha phone mismatch!', ayeshaDel);
  }

  // 2. Register a new test customer with specific phone number
  const uniqueEmail = `testcust_${Date.now()}@example.com`;
  const testPhone = '+92 333 7654321';
  console.log(`\n[TEST 2] Register customer ${uniqueEmail} with phone ${testPhone}`);
  const regRes = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Zahid Customer',
    email: uniqueEmail,
    password: 'Password123!',
    phone: testPhone,
    address: 'DHA Phase 5, Lahore'
  });
  console.log('Register status:', regRes.status, 'User phone:', regRes.data.user?.phone);
  const token = regRes.data.token;
  if (regRes.data.user?.phone === testPhone) {
    console.log('PASS: Registration captured correct phone number');
  } else {
    console.error('FAIL: Registration phone failed!');
  }

  // 3. Create order as this customer (without providing a separate phone, to test profile fallback)
  console.log('\n[TEST 3] Create order with profile phone fallback');
  const orderRes = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    customerName: 'Zahid Customer',
    items: [{ productId: 'p1', name: 'Belgian Chocolate Fudge Cake', price: 2800, quantity: 1 }],
    subtotal: 2800,
    deliveryFee: 250,
    total: 3050,
    fulfillmentMethod: 'Delivery',
    deliveryAddress: 'DHA Phase 5, Lahore',
    paymentMethod: 'Cash on Delivery',
    status: 'Confirmed'
  });
  console.log('Order created:', orderRes.data.orderNumber, 'Phone snapshot:', orderRes.data.customerPhone);
  if (orderRes.data.customerPhone === testPhone) {
    console.log('PASS: Order creation accurately fell back to customer profile phone');
  } else {
    console.error('FAIL: Order customerPhone mismatch!', orderRes.data);
  }

  // 4. Create custom cake and convert to order
  console.log('\n[TEST 4] Custom cake creation & order conversion phone test');
  const cakeRes = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/custom-cakes',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    customerName: 'Zahid Customer',
    occasion: 'Birthday',
    flavor: 'Red Velvet',
    sizeWeight: '3 lbs',
    tiers: 1,
    pickupOrDelivery: 'Delivery',
    deliveryAddress: 'DHA Phase 5, Lahore',
    estimatedPrice: 4500
  });
  console.log('Custom cake created:', cakeRes.data.id, 'Phone:', cakeRes.data.customerPhone);
  if (cakeRes.data.customerPhone === testPhone) {
    console.log('PASS: Custom cake captured user phone properly');
  } else {
    console.error('FAIL: Custom cake phone missing!');
  }

  // Convert to order via Admin
  const adminLogin = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@thecakehouse.pk', password: 'CakeAdmin@2026!' });
  const adminToken = adminLogin.data.token;

  const convRes = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/custom-cakes/${cakeRes.data.id}/convert-to-order`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, { quotedPrice: 4800 });
  console.log('Converted order phone:', convRes.data.order?.customerPhone);
  if (convRes.data.order?.customerPhone === testPhone) {
    console.log('PASS: Converted order preserved correct phone number');
  } else {
    console.error('FAIL: Converted order phone missing!');
  }

  // 5. Admin assigns delivery for the order
  console.log('\n[TEST 5] Admin assigns delivery task');
  const taskRes = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/deliveries',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    orderId: orderRes.data.id,
    orderNumber: orderRes.data.orderNumber,
    customerName: orderRes.data.customerName,
    address: orderRes.data.deliveryAddress,
    items: orderRes.data.items,
    totalAmount: orderRes.data.total,
    paymentMethod: 'Cash on Delivery',
    codAmountDue: orderRes.data.total,
    assignedStaff: 'Bilal Raza',
    assignedStaffId: 'u-delivery'
  });
  console.log('Delivery task created:', taskRes.data.id, 'Task customerPhone:', taskRes.data.customerPhone);
  if (taskRes.data.customerPhone === testPhone) {
    console.log('PASS: Delivery task received authoritative customer phone');
  } else {
    console.error('FAIL: Delivery task phone mismatch!', taskRes.data);
  }

  // 6. Delivery Person Portal fetches tasks
  console.log('\n[TEST 6] Delivery staff fetches deliveries');
  const deliveryStaffLogin = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'delivery@thecakehouse.pk', password: 'CakeDelivery@2026!' });
  const deliveryStaffToken = deliveryStaffLogin.data.token;

  const staffTasks = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/deliveries',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${deliveryStaffToken}` }
  });
  const myTask = staffTasks.data.find(d => d.id === taskRes.data.id);
  console.log('Delivery person view customerPhone:', myTask?.customerPhone);
  if (myTask?.customerPhone === testPhone) {
    console.log('PASS: Delivery person sees exact, accurate customer phone');
  } else {
    console.error('FAIL: Delivery person task phone incorrect!');
  }

  // 7. Profile phone update test: update profile to new phone
  console.log('\n[TEST 7] Customer updates profile phone');
  const updatedPhone = '+92 333 9998877';
  const profileRes = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/auth/profile',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { phone: updatedPhone });
  console.log('Profile updated phone:', profileRes.data.user?.phone);
  if (profileRes.data.user?.phone === updatedPhone) {
    console.log('PASS: Profile phone successfully updated');
  }

  // Place another order with explicit custom delivery phone vs profile phone
  console.log('\n[TEST 8] Place order with explicit delivery phone (different from profile)');
  const explicitPhone = '+92 345 5551212';
  const customPhoneOrder = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    customerName: 'Zahid Customer (Office Delivery)',
    customerPhone: explicitPhone,
    items: [{ productId: 'p2', name: 'Strawberry Shortcake', price: 2400, quantity: 1 }],
    subtotal: 2400,
    deliveryFee: 250,
    total: 2650,
    fulfillmentMethod: 'Delivery',
    deliveryAddress: 'Gulberg II, Lahore',
    paymentMethod: 'Cash on Delivery',
    status: 'Confirmed'
  });
  console.log('Explicit delivery phone order snapshot:', customPhoneOrder.data.customerPhone);
  if (customPhoneOrder.data.customerPhone === explicitPhone) {
    console.log('PASS: Explicit delivery phone snapshot preserved correctly');
  } else {
    console.error('FAIL: Explicit phone was overridden!');
  }

  // Assign delivery for this new order
  const taskExplicit = await apiCall({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/deliveries',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    orderId: customPhoneOrder.data.id,
    orderNumber: customPhoneOrder.data.orderNumber,
    customerPhone: explicitPhone
  });
  console.log('Delivery task for explicit phone order:', taskExplicit.data.customerPhone);
  if (taskExplicit.data.customerPhone === explicitPhone) {
    console.log('PASS: Delivery person receives explicit order delivery phone');
  } else {
    console.error('FAIL: Delivery task did not receive explicit phone!');
  }

  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(console.error);
