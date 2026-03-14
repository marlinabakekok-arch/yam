# Keen - Education Platform

A modern online education platform built with Next.js, featuring class management, user authentication, and QRIS payment integration.

## Features

- **User Authentication** - Secure authentication with Clerk
- **Class Marketplace** - Browse and enroll in online classes
- **Payment Processing** - QRIS payment gateway integration
- **User Dashboard** - View enrolled classes and order history
- **Admin Dashboard** - Manage classes and view analytics
- **Dark Mode Support** - Built-in dark theme support

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Clerk
- **Payments**: PayDigital QRIS
- **Charts**: Recharts
- **Data Fetching**: SWR

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Neon PostgreSQL database
- Clerk account
- PayDigital API key

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Set up environment variables in `.env.local`:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your credentials:
   - Clerk keys from [clerk.com](https://clerk.com)
   - Neon database URL from [neon.tech](https://neon.tech)
   - PayDigital API key

4. Initialize the database:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma db seed  # Optional: seed with sample data
```

5. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── page.tsx                 # Homepage with class listings
├── (auth)/                  # Authentication pages
│   ├── sign-in/
│   └── sign-up/
├── kelas/                   # Class detail pages
├── checkout/                # Payment checkout
├── dashboard/               # User dashboard
├── admin/                   # Admin dashboard
└── api/                     # API routes
    ├── qris/                # Payment API
    ├── dashboard/           # User data API
    └── admin/               # Admin API

components/
├── navbar.tsx              # Navigation component
└── ui/                      # shadcn/ui components

lib/
├── prisma.ts              # Prisma client
└── utils.ts               # Utility functions

prisma/
└── schema.prisma          # Database schema
```

## Database Schema

### User
- `id` - Primary key
- `clerkId` - Clerk user ID
- `email` - User email
- `name` - User name
- `role` - User role (user/admin)
- `createdAt` - Creation timestamp

### Kelas (Classes)
- `id` - Primary key
- `title` - Class title
- `slug` - URL slug
- `description` - Class description
- `price` - Class price in IDR
- `thumbnail` - Thumbnail image URL
- `groupLink` - Telegram/Discord group link
- `createdAt` - Creation timestamp

### Transaction
- `id` - Primary key
- `txId` - Transaction ID from PayDigital
- `userId` - User ID (foreign key)
- `kelasId` - Class ID (foreign key)
- `amount` - Transaction amount
- `total` - Total price
- `status` - Payment status (pending/success/failed/cancelled)
- `qrString` - QRIS QR code data
- `payUrl` - PayDigital payment URL
- `expiredAt` - Payment expiration time
- `paidAt` - Payment completion time
- `createdAt` - Creation timestamp

## API Endpoints

### Payment
- `POST /api/qris/create` - Create QRIS payment
- `GET /api/qris/status/[txId]` - Check payment status
- `POST /api/qris/cancel` - Cancel pending payment

### User Dashboard
- `GET /api/dashboard/enrollments` - Get enrolled classes
- `GET /api/dashboard/orders` - Get order history

### Admin
- `GET /api/admin/analytics` - Get analytics data

## Admin Access

To grant admin access:

1. In your database, update the user's role:
   ```sql
   UPDATE "User" SET role = 'admin' WHERE "clerkId" = 'user_xxxxx';
   ```

2. The user will now have access to `/admin` dashboard

## Deployment

Deploy to Vercel:

```bash
git push origin main
```

The app will deploy automatically with all environment variables configured in Vercel settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Support

For issues or questions, please open an issue on GitHub.
