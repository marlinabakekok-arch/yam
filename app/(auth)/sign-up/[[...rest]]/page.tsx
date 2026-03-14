import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <SignUp appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-white dark:bg-slate-950 shadow-lg',
          },
        }} />
      </div>
    </div>
  )
}
