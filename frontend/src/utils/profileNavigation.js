export function getProfileMenuItems(user) {
  const items = []

  if (user?.role === 'OWNER') {
    items.push(
      { key: 'members', path: '/members' },
      { key: 'operations', path: '/operations' },
    )
  }

  items.push({ key: 'logout', path: null })
  return items
}
