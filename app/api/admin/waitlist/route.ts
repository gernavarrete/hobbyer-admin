import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '50'
  const page = searchParams.get('page') || '1'

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/waitlist?limit=${limit}&page=${page}`,
      {
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json',
        },
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: 'Backend no disponible' },
      { status: 503 }
    )
  }
}
