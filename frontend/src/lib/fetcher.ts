export async function backendFetch(path: string, opts: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',
    ...opts
  })
  return res.json()
}