import { NextRequest, NextResponse } from 'next/server';
import { customers, orders, getCustomerById, getCustomerOrders } from '@/lib/crm/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const customer = getCustomerById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    const customerOrders = getCustomerOrders(id);
    return NextResponse.json({ customer, orders: customerOrders });
  }

  return NextResponse.json({
    customers: customers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      isVIP: c.isVIP,
      accountAge: c.accountAge,
      totalOrders: c.totalOrders,
      fraudScore: c.fraudScore,
      refundCount: c.refundHistory.length,
    })),
    total: customers.length,
  });
}
