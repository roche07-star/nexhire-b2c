import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createClient } from '@supabase/supabase-js'
import ResumeViewer from './ResumeViewer'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
  }

  const { id } = await params

  // 이력서 조회
  const { data: resume, error } = await supabase
    .from('generated_resumes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !resume) {
    return (
      <main style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>이력서를 찾을 수 없습니다</h1>
        <p style={{ color: 'var(--muted)' }}>요청하신 이력서가 존재하지 않습니다.</p>
      </main>
    )
  }

  // 권한 확인
  if (resume.user_email !== session.user.email) {
    return (
      <main style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>접근 권한이 없습니다</h1>
        <p style={{ color: 'var(--muted)' }}>본인의 이력서만 확인할 수 있습니다.</p>
      </main>
    )
  }

  return <ResumeViewer resume={resume} />
}
