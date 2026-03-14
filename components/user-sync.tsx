'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function UserSync() {
  const { user } = useUser()

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      // Sync user ke database
      fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.primaryEmailAddress.emailAddress,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null,
        }),
      }).catch(console.error)
    }
  }, [user])

  return null
}
