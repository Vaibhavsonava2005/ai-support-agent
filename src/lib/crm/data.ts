import { Customer, Order } from '@/lib/agent/types';

export const customers: Customer[] = [
  // 1. VIP Loyal - Sarah Chen - 5yr account, 100+ orders, 2 refunds, VIP
  {
    id: 'CUST-001',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    status: 'vip',
    accountAge: 1825,
    totalOrders: 127,
    totalSpent: 45890.50,
    fraudScore: 0.02,
    isVIP: true,
    notes: 'Platinum member since 2021. Excellent payment history.',
    createdAt: '2021-06-15',
    refundHistory: [
      { id: 'REF-001', orderId: 'ORD-1001', amount: 89.99, reason: 'Wrong size', date: '2024-03-15', status: 'approved' },
      { id: 'REF-002', orderId: 'ORD-1055', amount: 149.99, reason: 'Defective item', date: '2025-11-20', status: 'approved' },
    ],
  },
  // 2. VIP High Spender - James Morrison
  {
    id: 'CUST-002',
    name: 'James Morrison',
    email: 'j.morrison@business.com',
    status: 'vip',
    accountAge: 1095,
    totalOrders: 58,
    totalSpent: 78450.00,
    fraudScore: 0.05,
    isVIP: true,
    notes: 'Enterprise account. Corporate buyer.',
    createdAt: '2023-06-15',
    refundHistory: [],
  },
  // 3. Serial Returner - Karen Mitchell - 3+ refunds in 90 days TRIGGER
  {
    id: 'CUST-003',
    name: 'Karen Mitchell',
    email: 'karen.m@gmail.com',
    status: 'active',
    accountAge: 730,
    totalOrders: 32,
    totalSpent: 4250.00,
    fraudScore: 0.45,
    isVIP: false,
    notes: 'Frequent returns. Pattern detected.',
    createdAt: '2024-06-15',
    refundHistory: [
      { id: 'REF-010', orderId: 'ORD-3001', amount: 59.99, reason: 'Changed mind', date: '2026-04-10', status: 'approved' },
      { id: 'REF-011', orderId: 'ORD-3015', amount: 34.99, reason: 'Not as described', date: '2026-05-02', status: 'approved' },
      { id: 'REF-012', orderId: 'ORD-3022', amount: 79.99, reason: 'Wrong color', date: '2026-05-28', status: 'approved' },
      { id: 'REF-013', orderId: 'ORD-3030', amount: 44.99, reason: 'Too small', date: '2026-06-05', status: 'pending' },
    ],
  },
  // 4. Fraud Risk High - Mike Johnson - fraud score 0.85
  {
    id: 'CUST-004',
    name: 'Mike Johnson',
    email: 'mike.j.2025@hotmail.com',
    status: 'flagged',
    accountAge: 180,
    totalOrders: 5,
    totalSpent: 2340.00,
    fraudScore: 0.85,
    isVIP: false,
    notes: 'Multiple chargebacks reported. Possible stolen payment method.',
    createdAt: '2025-12-15',
    refundHistory: [
      { id: 'REF-020', orderId: 'ORD-4001', amount: 299.99, reason: 'Never received', date: '2026-02-10', status: 'denied' },
      { id: 'REF-021', orderId: 'ORD-4003', amount: 499.99, reason: 'Unauthorized purchase', date: '2026-03-25', status: 'denied' },
    ],
  },
  // 5. Fraud Risk Medium - Alex Petrov - fraud score 0.75
  {
    id: 'CUST-005',
    name: 'Alex Petrov',
    email: 'alex.petrov@mail.ru',
    status: 'flagged',
    accountAge: 365,
    totalOrders: 10,
    totalSpent: 3890.00,
    fraudScore: 0.75,
    isVIP: false,
    notes: 'Multiple accounts detected with similar shipping addresses.',
    createdAt: '2025-06-15',
    refundHistory: [
      { id: 'REF-025', orderId: 'ORD-5001', amount: 189.99, reason: 'Item damaged', date: '2026-01-15', status: 'approved' },
      { id: 'REF-026', orderId: 'ORD-5005', amount: 259.99, reason: 'Missing parts', date: '2026-04-20', status: 'pending' },
    ],
  },
  // 6. New Account - Emily Davis - 3 days old TRIGGER
  {
    id: 'CUST-006',
    name: 'Emily Davis',
    email: 'emily.d.new@gmail.com',
    status: 'new',
    accountAge: 3,
    totalOrders: 1,
    totalSpent: 129.99,
    fraudScore: 0.30,
    isVIP: false,
    notes: 'Brand new account.',
    createdAt: '2026-06-14',
    refundHistory: [],
  },
  // 7. New Account - Tom Wilson - 5 days old TRIGGER
  {
    id: 'CUST-007',
    name: 'Tom Wilson',
    email: 'tom.wilson99@outlook.com',
    status: 'new',
    accountAge: 5,
    totalOrders: 2,
    totalSpent: 245.98,
    fraudScore: 0.25,
    isVIP: false,
    notes: 'New account. First-time buyer.',
    createdAt: '2026-06-12',
    refundHistory: [],
  },
  // 8. Regular Customer - Lisa Park
  {
    id: 'CUST-008',
    name: 'Lisa Park',
    email: 'lisa.park@email.com',
    status: 'active',
    accountAge: 400,
    totalOrders: 15,
    totalSpent: 2890.50,
    fraudScore: 0.08,
    isVIP: false,
    notes: 'Good standing customer.',
    createdAt: '2025-05-10',
    refundHistory: [
      { id: 'REF-030', orderId: 'ORD-8001', amount: 49.99, reason: 'Wrong item shipped', date: '2025-12-20', status: 'approved' },
    ],
  },
  // 9. Regular Customer - David Brown
  {
    id: 'CUST-009',
    name: 'David Brown',
    email: 'david.b@email.com',
    status: 'active',
    accountAge: 240,
    totalOrders: 8,
    totalSpent: 1560.00,
    fraudScore: 0.10,
    isVIP: false,
    notes: 'Reliable customer.',
    createdAt: '2025-10-20',
    refundHistory: [],
  },
  // 10. Problematic - Rachel Green - missing receipts pattern
  {
    id: 'CUST-010',
    name: 'Rachel Green',
    email: 'rachel.green@yahoo.com',
    status: 'active',
    accountAge: 548,
    totalOrders: 20,
    totalSpent: 3450.00,
    fraudScore: 0.40,
    isVIP: false,
    notes: 'Frequent refund requests often without proof.',
    createdAt: '2024-12-15',
    refundHistory: [
      { id: 'REF-040', orderId: 'ORD-10001', amount: 89.99, reason: 'Defective', date: '2025-08-10', status: 'approved' },
      { id: 'REF-041', orderId: 'ORD-10010', amount: 65.00, reason: 'Not as pictured', date: '2026-01-05', status: 'denied' },
      { id: 'REF-042', orderId: 'ORD-10018', amount: 120.00, reason: 'Quality issue', date: '2026-04-15', status: 'approved' },
      { id: 'REF-043', orderId: 'ORD-10025', amount: 55.00, reason: 'Changed mind', date: '2026-05-30', status: 'pending' },
    ],
  },
  // 11. International - Yuki Tanaka
  {
    id: 'CUST-011',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@email.jp',
    status: 'active',
    accountAge: 730,
    totalOrders: 12,
    totalSpent: 3200.00,
    fraudScore: 0.05,
    isVIP: false,
    notes: 'International customer. Japan-based.',
    createdAt: '2024-06-15',
    refundHistory: [
      { id: 'REF-050', orderId: 'ORD-11001', amount: 75.00, reason: 'Shipping damage', date: '2025-09-20', status: 'approved' },
    ],
  },
  // 12. First-time Refund - Chris Martinez - loyal, 0 refunds
  {
    id: 'CUST-012',
    name: 'Chris Martinez',
    email: 'chris.martinez@email.com',
    status: 'active',
    accountAge: 365,
    totalOrders: 25,
    totalSpent: 5600.00,
    fraudScore: 0.03,
    isVIP: false,
    notes: 'Excellent customer. Never requested a refund.',
    createdAt: '2025-06-15',
    refundHistory: [],
  },
  // 13. Fraud Alert Critical - Bob Smith - fraud 0.92
  {
    id: 'CUST-013',
    name: 'Bob Smith',
    email: 'totallyreal@tempmail.com',
    status: 'flagged',
    accountAge: 14,
    totalOrders: 3,
    totalSpent: 4999.97,
    fraudScore: 0.92,
    isVIP: false,
    notes: 'SUSPICIOUS: Temp email, high-value orders, immediate refund requests.',
    createdAt: '2026-06-03',
    refundHistory: [
      { id: 'REF-060', orderId: 'ORD-13001', amount: 1299.99, reason: 'Never received', date: '2026-06-08', status: 'denied' },
      { id: 'REF-061', orderId: 'ORD-13002', amount: 1899.99, reason: 'Wrong item', date: '2026-06-12', status: 'denied' },
    ],
  },
  // 14. Edge Case - Diana Prince - exactly at 90-day boundary
  {
    id: 'CUST-014',
    name: 'Diana Prince',
    email: 'diana.prince@email.com',
    status: 'active',
    accountAge: 100,
    totalOrders: 7,
    totalSpent: 1890.00,
    fraudScore: 0.20,
    isVIP: false,
    notes: 'Borderline refund frequency.',
    createdAt: '2026-03-09',
    refundHistory: [
      { id: 'REF-070', orderId: 'ORD-14001', amount: 45.99, reason: 'Wrong size', date: '2026-03-20', status: 'approved' },
      { id: 'REF-071', orderId: 'ORD-14003', amount: 89.99, reason: 'Defective', date: '2026-04-15', status: 'approved' },
      { id: 'REF-072', orderId: 'ORD-14005', amount: 55.00, reason: 'Not needed', date: '2026-05-10', status: 'approved' },
    ],
  },
  // 15. Loyal but Dissatisfied - Marcus Williams
  {
    id: 'CUST-015',
    name: 'Marcus Williams',
    email: 'marcus.w@email.com',
    status: 'active',
    accountAge: 1460,
    totalOrders: 80,
    totalSpent: 22500.00,
    fraudScore: 0.12,
    isVIP: false,
    notes: 'Long-time customer. Recent quality complaints increasing.',
    createdAt: '2022-06-15',
    refundHistory: [
      { id: 'REF-080', orderId: 'ORD-15010', amount: 199.99, reason: 'Quality decline', date: '2025-09-10', status: 'approved' },
      { id: 'REF-081', orderId: 'ORD-15025', amount: 149.99, reason: 'Material different', date: '2025-12-20', status: 'approved' },
      { id: 'REF-082', orderId: 'ORD-15040', amount: 89.99, reason: 'Stitching defect', date: '2026-04-05', status: 'approved' },
      { id: 'REF-083', orderId: 'ORD-15055', amount: 279.99, reason: 'Wrong product sent', date: '2026-05-25', status: 'approved' },
      { id: 'REF-084', orderId: 'ORD-15060', amount: 159.99, reason: 'Color faded', date: '2026-06-10', status: 'pending' },
    ],
  },
];

// Sample orders for each customer
export const orders: Order[] = [
  { id: 'ORD-1090', customerId: 'CUST-001', items: [{ name: 'Premium Leather Jacket', price: 299.99, quantity: 1 }], total: 299.99, date: '2026-06-01', daysSincePurchase: 16 },
  { id: 'ORD-2010', customerId: 'CUST-002', items: [{ name: 'Executive Desk Set', price: 549.99, quantity: 1 }, { name: 'Ergonomic Chair', price: 899.99, quantity: 1 }], total: 1449.98, date: '2026-05-20', daysSincePurchase: 28 },
  { id: 'ORD-3035', customerId: 'CUST-003', items: [{ name: 'Summer Dress', price: 64.99, quantity: 1 }], total: 64.99, date: '2026-06-10', daysSincePurchase: 7 },
  { id: 'ORD-4005', customerId: 'CUST-004', items: [{ name: 'Gaming Laptop', price: 1499.99, quantity: 1 }], total: 1499.99, date: '2026-06-05', daysSincePurchase: 12 },
  { id: 'ORD-5008', customerId: 'CUST-005', items: [{ name: 'Wireless Headphones', price: 199.99, quantity: 1 }], total: 199.99, date: '2026-06-08', daysSincePurchase: 9 },
  { id: 'ORD-6001', customerId: 'CUST-006', items: [{ name: 'Running Shoes', price: 129.99, quantity: 1 }], total: 129.99, date: '2026-06-14', daysSincePurchase: 3 },
  { id: 'ORD-7002', customerId: 'CUST-007', items: [{ name: 'Backpack Pro', price: 89.99, quantity: 1 }, { name: 'Water Bottle', price: 24.99, quantity: 1 }], total: 114.98, date: '2026-06-12', daysSincePurchase: 5 },
  { id: 'ORD-8005', customerId: 'CUST-008', items: [{ name: 'Yoga Mat Premium', price: 79.99, quantity: 1 }], total: 79.99, date: '2026-05-15', daysSincePurchase: 33 },
  { id: 'ORD-9003', customerId: 'CUST-009', items: [{ name: 'Bluetooth Speaker', price: 149.99, quantity: 1 }], total: 149.99, date: '2026-06-01', daysSincePurchase: 16 },
  { id: 'ORD-10030', customerId: 'CUST-010', items: [{ name: 'Kitchen Blender', price: 89.99, quantity: 1 }], total: 89.99, date: '2026-06-05', daysSincePurchase: 12 },
  { id: 'ORD-11005', customerId: 'CUST-011', items: [{ name: 'Art Supply Set', price: 159.99, quantity: 1 }], total: 159.99, date: '2026-05-25', daysSincePurchase: 23 },
  { id: 'ORD-12010', customerId: 'CUST-012', items: [{ name: 'Smart Watch Pro', price: 349.99, quantity: 1 }], total: 349.99, date: '2026-06-10', daysSincePurchase: 7 },
  { id: 'ORD-13003', customerId: 'CUST-013', items: [{ name: 'Diamond Earrings', price: 1799.99, quantity: 1 }], total: 1799.99, date: '2026-06-10', daysSincePurchase: 7 },
  { id: 'ORD-14006', customerId: 'CUST-014', items: [{ name: 'Electric Kettle', price: 69.99, quantity: 1 }], total: 69.99, date: '2026-06-08', daysSincePurchase: 9 },
  { id: 'ORD-15065', customerId: 'CUST-015', items: [{ name: 'Wool Sweater', price: 129.99, quantity: 1 }], total: 129.99, date: '2026-06-12', daysSincePurchase: 5 },
];

export function getCustomerById(id: string): Customer | undefined {
  return customers.find(c => c.id === id);
}

export function getCustomerOrders(customerId: string): Order[] {
  return orders.filter(o => o.customerId === customerId);
}

export function getOrderById(orderId: string): Order | undefined {
  return orders.find(o => o.id === orderId);
}
