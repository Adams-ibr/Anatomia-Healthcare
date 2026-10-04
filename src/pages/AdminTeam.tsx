// AdminTeam - Public-facing team page management
// Similar to AdminMembers but focused on team members displayed on the public website

import AdminMembers from './AdminMembers'

export default function AdminTeam() {
  // For now, reuse AdminMembers component
  // In a full implementation, this could have additional fields like:
  // - Featured status
  // - Display order
  // - Public profile visibility
  // - Custom public bio (different from internal bio)
  return <AdminMembers />
}
