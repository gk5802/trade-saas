import { backendFetch } from '@/lib/fetcher'

export async function POST(req: Request) {
  const body = await req.json()
  const res = await backendFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })
  return new Response(JSON.stringify(res))
}