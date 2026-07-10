// PortOne 결제 취소 스크립트
require('dotenv').config({ path: '.env.local' });

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
const MERCHANT_UID = 'payment_1783671560408_pbvwcd';
const CANCEL_AMOUNT = 9900;

async function cancelPayment() {
  try {
    // Step 1: Access Token 발급
    const tokenResponse = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_key: process.env.PORTONE_STORE_ID?.replace('store-', ''),
        imp_secret: PORTONE_API_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.code !== 0) {
      throw new Error('토큰 발급 실패: ' + tokenData.message);
    }

    const accessToken = tokenData.response.access_token;
    console.log('✅ Access Token 발급 완료');

    // Step 2: 결제 취소
    const cancelResponse = await fetch('https://api.iamport.kr/payments/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken,
      },
      body: JSON.stringify({
        merchant_uid: MERCHANT_UID,
        cancel_request_amount: CANCEL_AMOUNT,
        reason: '테스트 결제 취소',
      }),
    });

    const cancelData = await cancelResponse.json();

    if (cancelData.code === 0) {
      console.log('✅ 결제 취소 성공!');
      console.log('환불 금액:', cancelData.response.cancel_amount);
      console.log('취소 상태:', cancelData.response.status);
    } else {
      console.error('❌ 취소 실패:', cancelData.message);
    }

  } catch (error) {
    console.error('오류:', error.message);
  }
}

cancelPayment();
