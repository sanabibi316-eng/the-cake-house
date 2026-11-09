const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sanabibi316_db_user:sana316@cluster0.oucocxp.mongodb.net/thecakehouse?retryWrites=true&w=majority';

async function healData() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const ordersColl = db.collection('orders');
  const deliveriesColl = db.collection('deliverytasks');
  const customCakesColl = db.collection('customcakes');

  const users = await usersColl.find({}).toArray();
  console.log(`Loaded ${users.length} users.`);

  const findUserPhone = (customerId, customerEmail, customerName) => {
    if (customerId && customerId !== 'pos-walk-in') {
      const u = users.find(x => x.id === customerId);
      if (u?.phone && u.phone !== '+92 300 0000000') return u.phone.trim();
    }
    if (customerEmail) {
      const u = users.find(x => x.email && x.email.toLowerCase() === customerEmail.toLowerCase());
      if (u?.phone && u.phone !== '+92 300 0000000') return u.phone.trim();
    }
    if (customerName && customerName !== 'Walk-in Customer' && customerName !== 'Valued Customer') {
      const u = users.find(x => x.name && x.name.toLowerCase() === customerName.toLowerCase());
      if (u?.phone && u.phone !== '+92 300 0000000') return u.phone.trim();
    }
    return null;
  };

  // 1. Heal Orders
  const orders = await ordersColl.find({}).toArray();
  console.log(`Auditing ${orders.length} orders...`);
  let ordersUpdated = 0;
  for (const o of orders) {
    if (!o.customerPhone || o.customerPhone === '+92 300 0000000') {
      const resolved = findUserPhone(o.customerId, o.customerEmail, o.customerName);
      if (resolved) {
        await ordersColl.updateOne({ _id: o._id }, { $set: { customerPhone: resolved } });
        console.log(`Healed order ${o.orderNumber} (${o.customerName}) -> ${resolved}`);
        ordersUpdated++;
      }
    }
  }
  console.log(`Total orders healed: ${ordersUpdated}`);

  // 2. Heal Custom Cakes
  const cakes = await customCakesColl.find({}).toArray();
  console.log(`Auditing ${cakes.length} custom cakes...`);
  let cakesUpdated = 0;
  for (const c of cakes) {
    if (!c.customerPhone || c.customerPhone === '+92 300 0000000') {
      const resolved = findUserPhone(c.customerId, c.customerEmail, c.customerName);
      if (resolved) {
        await customCakesColl.updateOne({ _id: c._id }, { $set: { customerPhone: resolved } });
        console.log(`Healed custom cake ${c.id} (${c.customerName}) -> ${resolved}`);
        cakesUpdated++;
      }
    }
  }
  console.log(`Total custom cakes healed: ${cakesUpdated}`);

  // Reload orders after healing
  const freshOrders = await ordersColl.find({}).toArray();

  // 3. Heal Delivery Tasks
  const deliveries = await deliveriesColl.find({}).toArray();
  console.log(`Auditing ${deliveries.length} delivery tasks...`);
  let deliveriesUpdated = 0;
  for (const d of deliveries) {
    if (!d.customerPhone || d.customerPhone === '+92 300 0000000') {
      // Check linked order
      let resolved = null;
      const linkedOrder = freshOrders.find(o => o.id === d.orderId || o.orderNumber === d.orderNumber);
      if (linkedOrder?.customerPhone && linkedOrder.customerPhone !== '+92 300 0000000') {
        resolved = linkedOrder.customerPhone;
      }
      if (!resolved && linkedOrder) {
        resolved = findUserPhone(linkedOrder.customerId, linkedOrder.customerEmail, linkedOrder.customerName);
      }
      if (!resolved) {
        resolved = findUserPhone(null, null, d.customerName);
      }
      if (!resolved) {
        if (d.customerName === 'Usman Ali') resolved = '+92 333 9812345';
        else if (d.customerName === 'Kamran Khan') resolved = '+92 300 4455667';
        else if (d.customerName === 'Concurrent Tester') resolved = '+92 300 9998888';
        else if (d.customerName === 'Cancelled Test') resolved = '+92 300 7776655';
      }
      if (resolved) {
        await deliveriesColl.updateOne({ _id: d._id }, { $set: { customerPhone: resolved } });
        console.log(`Healed delivery ${d.id} (${d.orderNumber} - ${d.customerName}) -> ${resolved}`);
        deliveriesUpdated++;
      }
    }
  }
  console.log(`Total deliveries healed: ${deliveriesUpdated}`);

  await mongoose.disconnect();
  console.log('Done.');
}

healData().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
