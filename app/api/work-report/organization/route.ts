import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabase } from '@/lib/supabase'

// GET: 조직 정보 조회
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('organization, organization_type')
      .eq('email', session.user.email)
      .single()

    if (error) {
      console.error('Organization fetch error:', error)
      throw new Error('조직 정보 조회 실패')
    }

    return NextResponse.json({
      organization: data?.organization || '',
      organizationType: data?.organization_type || 'company',
    })

  } catch (error: any) {
    console.error('Organization GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

// POST: 조직 정보 저장
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organization, organizationType } = body

    if (!organization || !organizationType) {
      return NextResponse.json(
        { error: '조직 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!['company', 'school'].includes(organizationType)) {
      return NextResponse.json(
        { error: '조직 유형은 company 또는 school이어야 합니다.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('users')
      .update({
        organization,
        organization_type: organizationType,
      })
      .eq('email', session.user.email)

    if (error) {
      console.error('Organization update error:', error)
      throw new Error('조직 정보 저장 실패')
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Organization POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save organization' },
      { status: 500 }
    )
  }
}
