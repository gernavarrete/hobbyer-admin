import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'http://54.207.88.46:8000'

async function handler(
  req: NextRequest,
  ctx: RouteContext<'/api/proxy/[...path]'>
) {
  const { path } = await ctx.params
  const joined = path.join('/')
  const search = req.nextUrl.search ?? ''
  const url = `${BACKEND}/api/v1/${joined}${search}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  const auth = req.headers.get('Authorization')
  if (auth) headers['Authorization'] = auth

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.text()
      : undefined,
  })

  const data = await backendRes.text()
  return new NextResponse(data, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
