import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'https://api.hobbyer.club'

type Context = { params: Promise<{ path: string[] }> }

async function handler(req: NextRequest, ctx: Context) {
  try {
    const { path } = await ctx.params
    const search = req.nextUrl.search ?? ''
    const url = `${BACKEND}/api/v1/${path.join('/')}${search}`

    const headers: Record<string, string> = {}
    const auth = req.headers.get('Authorization')
    if (auth) headers['Authorization'] = auth

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const body = hasBody ? await req.text() : undefined
    if (hasBody) {
      headers['Content-Type'] = req.headers.get('Content-Type') ?? 'application/json'
    }

    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body,
    })

    // Leer como buffer para evitar problemas de encoding
    const buffer = await backendRes.arrayBuffer()
    const text = Buffer.from(buffer).toString('utf-8')

    return new NextResponse(text, {
      status: backendRes.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[proxy] error:', String(err))
    return new NextResponse(
      JSON.stringify({ error: 'Proxy error', detail: String(err) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
