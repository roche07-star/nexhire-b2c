import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { analysisId, name } = await request.json()

    if (!analysisId || !name) {
      return NextResponse.json({ error: 'analysisId and name are required' }, { status: 400 })
    }

    // result JSON에서 name 업데이트
    const { data: currentData, error: fetchError } = await supabase
      .from('analyses')
      .select('result')
      .eq('id', analysisId)
      .eq('user_email', session.user.email)
      .single()

    if (fetchError || !currentData) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    const result = typeof currentData.result === 'string'
      ? JSON.parse(currentData.result)
      : currentData.result

    result.name = name

    const { error: updateError } = await supabase
      .from('analyses')
      .update({ result })
      .eq('id', analysisId)
      .eq('user_email', session.user.email)

    if (updateError) {
      console.error('Update name error:', updateError)
      return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
    }

    return NextResponse.json({ success: true, name })
  } catch (error) {
    console.error('Update name error:', error)
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
  }
}
