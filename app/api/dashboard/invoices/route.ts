import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate HTML for invoice
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${order.txId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #7c3aed; }
          .invoice-details { margin-bottom: 30px; }
          .details-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; color: #7c3aed; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invoice</h1>
          <p>Transaction ID: ${order.txId}</p>
        </div>

        <div class="invoice-details">
          <div class="details-row">
            <div>
              <p><strong>Customer:</strong></p>
              <p>${user.name || 'N/A'}</p>
              <p>${user.email}</p>
            </div>
            <div>
              <p><strong>Order Date:</strong></p>
              <p>${new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Size/Color</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.product.name}</td>
                <td>${item.quantity}</td>
                <td>${item.size || '-'} ${item.color ? '• ' + item.color : ''}</td>
                <td>Rp ${(item.price).toLocaleString('id-ID')}</td>
                <td>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <div class="details-row" style="justify-content: flex-end; width: 300px; margin: 0 0 0 auto;">
            <span>Total:</span>
            <span class="total">Rp ${order.total.toLocaleString('id-ID')}</span>
          </div>
          <p style="margin-top: 20px; color: #666;">
            Status: <strong style="color: ${order.status === 'paid' ? '#10b981' : order.status === 'expired' ? '#ef4444' : '#f59e0b'}">${order.status.toUpperCase()}</strong>
          </p>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>This is an automated invoice. Please keep it for your records.</p>
        </div>
      </body>
      </html>
    `

    // Return as downloadable HTML (can be print-to-PDF)
    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoice-${order.txId}.html"`,
      },
    })
  } catch (error) {
    console.error('Generate invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
