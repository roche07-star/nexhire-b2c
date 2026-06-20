# 동의 체크 테스트

## 방법 1: 브라우저 콘솔에서 직접 확인

F12 → Console에서 실행:

```javascript
fetch('/api/consents/check')
  .then(res => res.json())
  .then(data => console.log('Consent check result:', data))
```

## 방법 2: Supabase에서 확인

```sql
SELECT * FROM consents
WHERE user_email = '본인이메일@gmail.com'
  AND consent_type = 'privacy_required';
```

## 방법 3: 동의 기록 삭제 (테스트용)

```sql
DELETE FROM consents
WHERE user_email = '본인이메일@gmail.com';
```

삭제 후 다시 로그인하면 동의 페이지가 나타남
