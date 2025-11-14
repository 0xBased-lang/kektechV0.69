/**
 * User Activity Page Route
 * Shows user's personal trading history and statistics
 * Route: /marketplace/activity
 */

import { UserActivityPage } from '@/components/marketplace/UserActivityPage'

export default function ActivityRoute() {
  return (
    <div className="min-h-screen py-12 px-4">
      <UserActivityPage />
    </div>
  )
}

// Metadata
export const metadata = {
  title: 'My Activity - 𝕂Ǝ𝕂TV Trading History',
  description: 'View your complete trading activity, offers made, offers received, and trading statistics.',
}
