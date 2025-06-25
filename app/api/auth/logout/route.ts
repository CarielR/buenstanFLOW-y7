// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  // Borrar cookie
  response.cookies.set({
    name: 'auth-token',
    value: '',
    maxAge: 0,
    path: '/',
  })
  return response
}
