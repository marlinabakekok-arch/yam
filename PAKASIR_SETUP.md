# Pakasir Payment Gateway Integration

Sistem payment telah di-upgrade ke menggunakan **Pakasir** sebagai payment gateway.

## Setup Pakasir

### 1. Buat Akun Pakasir
- Daftar di https://pakasir.com
- Login ke dashboard

### 2. Buat Project
- Di dashboard Pakasir, buat project baru
- Catat **Project Slug** (contoh: `depodomain`)
- Buka detail project dan catat **API Key**

### 3. Konfigurasi Environment Variables

Update file `.env`:

```env
# Pakasir Payment Gateway
PAKASIR_PROJECT=your_project_slug
PAKASIR_API_KEY=your_api_key
```

Ganti:
- `your_project_slug` dengan Project Slug dari Pakasir
- `your_api_key` dengan API Key dari Pakasir

### 4. Setup Webhook URL

Di dashboard Pakasir, masuk ke detail project Anda:

1. Cari field **Webhook URL**
2. Isi dengan URL berikut:
   ```
   https://yourdomain.com/api/webhooks/pakasir
   ```
   (Ganti `yourdomain.com` dengan domain website Anda)

3. Save/Update project

Webhook URL ini akan menerima notifikasi pembayaran dari Pakasir secara real-time.

## Fitur yang Tersedia

### Metode Pembayaran yang Didukung
- ✅ QRIS (Default)
- ✅ Virtual Account (BNI, BRI, BCA, CIMB, etc.)
- ✅ Paypal
- Dan metode lainnya sesuai konfigurasi Pakasir

### API Endpoints

#### 1. Create Order (QRIS)
```bash
POST /api/qris/create
Content-Type: application/json

{
  "items": [
    {
      "productId": "prod123",
      "quantity": 2,
      "size": "M",
      "color": "Black"
    }
  ],
  "address": {
    "fullName": "John Doe",
    "phone": "081234567890",
    "address": "Jl. Main St 123",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "postalCode": "12345"
  },
  "couponCode": "SUMMER2025" // optional
}
```

#### 2. Check Payment Status
```bash
GET /api/qris/status/{txId}
```

**Response:**
```json
{
  "txId": "INV1710754800123",
  "status": "paid|pending|expired|cancelled",
  "amount": 100000,
  "total": 101000,
  "expiredAt": "2025-03-17T15:00:00Z",
  "paidAt": "2025-03-17T14:30:00Z"
}
```

#### 3. Cancel Order
```bash
POST /api/qris/cancel/{txId}
```

#### 4. Webhook (Pakasir → Your App)
Pakasir akan POST ke `/api/webhooks/pakasir` saat pembayaran selesai:

```json
{
  "amount": 100000,
  "order_id": "INV1710754800123",
  "project": "your_project_slug",
  "status": "completed",
  "payment_method": "qris",
  "completed_at": "2025-03-17T14:30:00Z"
}
```

## Testing

### Mode Sandbox
1. Buat project di Pakasir dengan Mode **Sandbox**
2. Gunakan API endpoints seperti biasa
3. Lakukan payment simulation untuk test:

```bash
curl -X POST https://app.pakasir.com/api/paymentsimulation \
  -H 'Content-Type: application/json' \
  -d '{
    "project": "your_project_slug",
    "order_id": "INV1710754800123",
    "amount": 100000,
    "api_key": "your_api_key"
  }'
```

### Production Mode
1. Upgrade project ke Mode **Production** di Pakasir
2. Ganti `PAKASIR_API_KEY` di `.env` dengan production key
3. Test dengan pembayaran nyata

## Features

### ✅ Real-time Payment Status
- Sistem auto-check status setiap 5 detik
- Webhook real-time saat pembayaran berhasil
- Auto-expire order yang melewati waktu batas

### ✅ Multiple Payment Methods
- QRIS + VA
- Paypal (dengan kurs fixed Rp 15.000/USD)
- Metode lainnya sesuai konfigurasi

### ✅ Security
- Verifikasi amount & order_id di webhook
- User ownership validation
- API authentication

### ✅ Order Management
- Create orders dengan detail produk & alamat
- Check payment status
- Cancel pending orders
- Auto-expire expired orders

## Troubleshooting

### Error: "Payment gateway not configured"
**Solusi:** Pastikan `PAKASIR_PROJECT` dan `PAKASIR_API_KEY` sudah diisi di `.env`

### Payment tidak terdeteksi
1. Pastikan webhook URL sudah terdaftar di Pakasir
2. Check logs di Pakasir dashboard untuk status webhook
3. Verify amount tidak ada typo

### Order stuck di "pending"
1. Check apakah sudah lewat waktu expired
2. Cek status di Pakasir dashboard
3. Gunakan API untuk check status: `GET /api/qris/status/{txId}`

## Links Berguna

- 📖 [Dokumentasi Pakasir](https://pakasir.com/docs)
- 🔑 [Dashboard Pakasir](https://app.pakasir.com)
- 💬 [Support Pakasir](https://pakasir.com/support)

---

**Catatan:** Pastikan semua environment variables sudah dikonfigurasi sebelum deploy ke production!
