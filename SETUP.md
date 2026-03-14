# Keen Platform - Setup Guide

Complete setup instructions for the Keen education platform.

## Prerequisites

Before starting, ensure you have:
- Node.js 18 or higher
- A Neon PostgreSQL database account
- A Clerk authentication account
- A PayDigital merchant account (for QRIS payments)

## Step 1: Neon Database Setup

1. Visit [neon.tech](https://neon.tech) and create a new project
2. Copy your connection string (it will look like: `postgresql://user:password@host/database`)
3. Save this for Step 5

## Step 2: Clerk Authentication Setup

1. Go to [clerk.com](https://clerk.com) and create a new account
2. Create a new application
3. In the Clerk dashboard, get:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
4. Configure redirect URLs in Clerk:
   - Sign In: `http://localhost:3000/sign-in`
   - Sign Up: `http://localhost:3000/sign-up`
5. Save these keys for Step 5

## Step 3: PayDigital Setup (Optional - for Production)

1. Register at PayDigital.id
2. Get your API key from the dashboard
3. Save for Step 5

## Step 4: Install Dependencies

```bash
pnpm install
```

If using npm:
```bash
npm install
```

## Step 5: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_your_clerk_key
CLERK_SECRET_KEY=sk_your_clerk_secret

# Clerk Redirect URLs (keep these as is for local development)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Neon Database
DATABASE_URL=postgresql://your_user:your_password@your_host/your_database

# PayDigital (Optional - for production)
PAYDIGITAL_API_KEY=your_paydigital_api_key

# Environment
NODE_ENV=development
```

## Step 6: Initialize Database

### Option A: Using Prisma CLI (Recommended)

```bash
# Create tables in your database
pnpm exec prisma db push

# Seed with sample data (optional)
pnpm exec prisma db seed
```

### Option B: Using Migration (Production)

```bash
# Create a migration
pnpm exec prisma migrate dev --name init

# Deploy migrations
pnpm exec prisma migrate deploy
```

## Step 7: Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Test the Application

### Test User Flow
1. Click "Sign Up" to create a test account
2. Fill in your email and password
3. You should be redirected to the dashboard
4. Go back to home and enroll in a class
5. Proceed to checkout
6. Try the payment flow (QRIS)

### Test Admin Dashboard
1. In your Neon database, run:
   ```sql
   UPDATE "User" SET role = 'admin' WHERE "clerkId" = 'your_clerk_user_id';
   ```
2. Replace `your_clerk_user_id` with your actual Clerk user ID
3. Refresh the page and navigate to `/admin`

## Environment Variables Reference

### Required for Development
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - Neon database connection string

### Required for Production
- All above variables
- `PAYDIGITAL_API_KEY` - PayDigital merchant API key

### Optional
- `NODE_ENV` - Set to `production` for production builds

## Deployment to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/keen.git
git push -u origin main
```

### Step 2: Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Click "Deploy"

### Step 3: Add Environment Variables in Vercel
1. Go to your project settings
2. Click "Environment Variables"
3. Add all variables from your `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
   - `PAYDIGITAL_API_KEY`
4. Redeploy

### Step 4: Update Clerk Redirect URLs
In Clerk dashboard, add production redirect URLs:
- Sign In: `https://yourdomain.vercel.app/sign-in`
- Sign Up: `https://yourdomain.vercel.app/sign-up`

## Troubleshooting

### Database Connection Issues
- Verify your Neon connection string is correct
- Check that your IP is whitelisted in Neon
- Ensure `DATABASE_URL` doesn't have any typos

### Clerk Issues
- Make sure redirect URLs match your application URL
- Check that API keys are correctly copied (no extra spaces)
- Verify keys are in the right environment variables

### Payment Integration Issues
- Ensure `PAYDIGITAL_API_KEY` is set
- Test with PayDigital sandbox first
- Check API response in browser DevTools

### Build Issues
- Delete `.next` folder and rebuild: `rm -rf .next && pnpm build`
- Clear node_modules: `rm -rf node_modules && pnpm install`

## File Structure

```
keen/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── admin/           # Admin dashboard
│   ├── api/             # API routes
│   ├── checkout/        # Payment checkout
│   ├── dashboard/       # User dashboard
│   ├── kelas/           # Class pages
│   ├── layout.tsx
│   ├── page.tsx         # Homepage
│   └── globals.css
├── components/
│   ├── navbar.tsx       # Navigation
│   ├── theme-provider.tsx
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Utilities
├── prisma/
│   └── schema.prisma    # Database schema
├── scripts/
│   ├── init-db.js       # Database initialization
│   ├── seed.js          # Sample data
│   └── init-schema.sql  # SQL schema
├── public/              # Static assets
├── .env.example         # Environment template
├── .env.local           # Local environment (not committed)
├── README.md            # Main documentation
├── SETUP.md             # This file
├── next.config.mjs      # Next.js config
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Support

For issues or questions:
1. Check the README.md
2. Review error messages in browser console
3. Check server logs in terminal
4. Open an issue on GitHub

## Next Steps

After setup, consider:
1. Customize branding (logo, colors, fonts)
2. Add more sample classes
3. Set up email notifications
4. Configure analytics
5. Implement class content/materials
6. Add user reviews and ratings
7. Implement promotional codes

Good luck! 🚀
