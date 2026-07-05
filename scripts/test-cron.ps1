# Cron Job 테스트 스크립트 (PowerShell)

Write-Host "🧪 Testing Cron Job: process-plan-changes" -ForegroundColor Cyan
Write-Host ""

# URL 설정
$LocalUrl = "http://localhost:3000/api/cron/process-plan-changes"
$ProdUrl = "https://jobizic.vercel.app/api/cron/process-plan-changes"

# 로컬 환경 테스트
$Url = $LocalUrl

# Headers
$Headers = @{
    "Content-Type" = "application/json"
}

# CRON_SECRET 환경변수가 있으면 추가
if ($env:CRON_SECRET) {
    Write-Host "Using CRON_SECRET authentication" -ForegroundColor Yellow
    $Headers["Authorization"] = "Bearer $env:CRON_SECRET"
} else {
    Write-Host "No CRON_SECRET (open endpoint for testing)" -ForegroundColor Yellow
}

try {
    Write-Host "Calling: $Url" -ForegroundColor Green
    $Response = Invoke-RestMethod -Uri $Url -Method Get -Headers $Headers

    Write-Host ""
    Write-Host "📊 Results:" -ForegroundColor Cyan
    $Response | ConvertTo-Json -Depth 10

    Write-Host ""
    Write-Host "✅ Test complete" -ForegroundColor Green

} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
