import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <SignIn appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-white dark:bg-slate-950 shadow-lg',
          },
        }} />
        <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Admin? <Link href="/admin-login" className="font-medium text-purple-600 dark:text-purple-400 hover:underline">Sign in here</Link>
        </div>
      </div>
    </div>
  )
}
