'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu, Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function Navbar() {
  const router = useRouter()
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingRole, setLoadingRole] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchRole()
    } else {
      setLoadingRole(false)
    }
  }, [isSignedIn, user?.id])

  const fetchRole = async () => {
    try {
      const res = await fetch('/api/auth/get-role')
      const data = await res.json()
      setIsAdmin(data.role === 'admin')
    } catch (error) {
      setIsAdmin(false)
    } finally {
      setLoadingRole(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Keen
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden gap-8 md:flex">
            <Link href="/" className="text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300">
              Home
            </Link>
            {isSignedIn && (
              <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300">
                Dashboard
              </Link>
            )}
            {!loadingRole && isAdmin && (
              <Link href="/admin" className="text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300">
                Admin
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {/* Auth */}
            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden sm:flex">
                    {user?.firstName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  {!loadingRole && isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden gap-2 sm:flex">
                <Button variant="outline" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col gap-4 pt-8">
                  <Link href="/" className="font-medium">
                    Home
                  </Link>
                  {isSignedIn && (
                    <Link href="/dashboard" className="font-medium">
                      Dashboard
                    </Link>
                  )}
                  {!loadingRole && isAdmin && (
                    <Link href="/admin" className="font-medium">
                      Admin
                    </Link>
                  )}
                  <div className="border-t pt-4">
                    {isSignedIn ? (
                      <Button onClick={handleSignOut} variant="outline" className="w-full">
                        Sign Out
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button asChild variant="outline">
                          <Link href="/sign-in">Sign In</Link>
                        </Button>
                        <Button asChild>
                          <Link href="/sign-up">Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  )
}
