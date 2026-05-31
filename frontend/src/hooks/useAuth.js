export function parseToken(token) {
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function getUserRole() {
  const token = localStorage.getItem('token')
  return parseToken(token)?.rol || null
}

export function getUserId() {
  const token = localStorage.getItem('token')
  return parseToken(token)?.sub || null
}

export function isAuthenticated() {
  return !!localStorage.getItem('token')
}
