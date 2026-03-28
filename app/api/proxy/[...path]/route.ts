import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'http://54.207.88.46:8000'

type Context = { params: Promise<{ path: string[] }> }

async function handler(req: NextRequest, ctx: Context) {
  try {
    const { path } = await ctx.params
    const search = req.nextUrl.search ?? ''
    const url = `${BACKEND}/api/v1/${path.join('/')}${search}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const auth = req.headers.get('Authorization')
    if (auth) headers['Authorization'] = auth

    const body =
      req.method !== 'GET' && req.method !== 'HEAD'
        ? await req.text()
        : undefined

    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body,
    })

    const data = await backendRes.text()
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[proxy] error:', err)
    return NextResponse.json(
      { error: 'Proxy error', detail: String(err) },
      { status: 500 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
