'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ActivityPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/activity/liked')
  }, [router])

  return null
}
