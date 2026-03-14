import { SignIn } from '@clerk/nextjs'

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
      </div>
    </div>
  )
}
