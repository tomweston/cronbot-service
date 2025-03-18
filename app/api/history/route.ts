import { NextResponse } from 'next/server'
import { loadHistory } from '../../lib/history'

export async function GET() {
  try {
    const history = await loadHistory()
    return NextResponse.json(history)
  } catch (error) {
    console.error('Error loading history:', error)
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}
