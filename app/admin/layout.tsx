import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { Navbar } from '@/components/navbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  
  // Note: Both Clerk admins AND separate admin system users can access
  // - Clerk admins: userId exists with admin role (checked in page.tsx)
  // - Separate admin users: will be checked via Zustand store in page.tsx
  // - Unauthorized users: will see spinner and redirect to /admin-login in page.tsx
  
  // Only require userId for Clerk-based admins
  // Let the page component handle all authentication logic
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />
      {children}
    </div>
  )
}
