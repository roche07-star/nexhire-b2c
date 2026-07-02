// Eve API 테스트 스크립트
const EVE_API_URL = 'https://jobizic-biz.vercel.app'
const API_KEY = 'AmfFK09xLKxhMWw+Kj4q8uoIHCQFzPoBGp8zBBrtB24='

// 테스트: Eve에 구직 요청 전송
async function testJobRequest() {
  // 임시 candidate_id (실제 ID로 교체 필요)
  const candidateId = 'test-id'
  
  const url = `${EVE_API_URL}/api/super-admin/candidates/${candidateId}/job-request`
  
  console.log('📤 Eve API 테스트:', url)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        position: '프로젝트 매니저',
        request_message: '테스트 요청',
        application_id: 'test-app-id',
        requested_at: new Date().toISOString(),
        source: 'adam'
      })
    })
    
    console.log('Status:', response.status)
    const data = await response.json()
    console.log('Response:', data)
  } catch (error) {
    console.error('Error:', error)
  }
}

testJobRequest()
