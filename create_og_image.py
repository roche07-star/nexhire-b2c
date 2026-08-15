from PIL import Image, ImageDraw, ImageFont
import os

# 이미지 크기 (OG 표준)
width = 1200
height = 630

# 이미지 생성 - 그라디언트 배경
img = Image.new('RGB', (width, height), color='#667eea')

draw = ImageDraw.Draw(img)

# 부드러운 그라디언트 (보라-파랑)
for i in range(height):
    r = int(102 + (116 - 102) * (i / height) ** 1.5)
    g = int(126 + (74 - 126) * (i / height) ** 1.5)
    b = int(234 + (162 - 234) * (i / height) ** 1.5)
    draw.rectangle([(0, i), (width, i+1)], fill=(r, g, b))

# === 왼쪽: 비주얼 섹션 (500px) ===
left_section_width = 500

# 왼쪽 배경 (약간 어두운 오버레이)
draw.rectangle([(0, 0), (left_section_width, height)], fill=(80, 90, 180, 220))

# 문서 아이콘 (이력서)
doc_x = 180
doc_y = 200
doc_width = 140
doc_height = 200
# 문서 본체
draw.rounded_rectangle(
    [(doc_x, doc_y), (doc_x + doc_width, doc_y + doc_height)],
    radius=15,
    fill='white'
)
# 문서 접힌 모서리
fold_size = 30
draw.polygon(
    [(doc_x + doc_width - fold_size, doc_y),
     (doc_x + doc_width, doc_y + fold_size),
     (doc_x + doc_width, doc_y)],
    fill='#e0e0e0'
)
# 문서 선들 (텍스트 표현)
for i in range(4):
    line_y = doc_y + 80 + i * 25
    draw.rectangle(
        [(doc_x + 20, line_y), (doc_x + doc_width - 20, line_y + 3)],
        fill='#667eea'
    )

# 체크마크 (합격)
check_x = 260
check_y = 430
check_size = 80
# 체크마크 원
draw.ellipse(
    [(check_x, check_y), (check_x + check_size, check_y + check_size)],
    fill='#10b981'
)
# 체크마크 선 (✓)
try:
    font_check = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 60)
    draw.text((check_x + check_size // 2, check_y + check_size // 2), "✓",
              fill='white', font=font_check, anchor="mm")
except:
    pass

# AI 심볼 (작은 원들로 표현)
ai_x = 100
ai_y = 350
for i in range(3):
    for j in range(3):
        if (i + j) % 2 == 0:  # 체크무늬 패턴
            cx = ai_x + i * 35
            cy = ai_y + j * 35
            draw.ellipse([(cx, cy), (cx + 25, cy + 25)], fill='#fbbf24')

# === 오른쪽: 텍스트 섹션 ===
text_x = left_section_width + 80
text_start_y = 150

# 흰색 반투명 카드
card_x = left_section_width + 40
card_y = 120
card_width = width - left_section_width - 80
card_height = 390
draw.rounded_rectangle(
    [(card_x, card_y), (card_x + card_width, card_y + card_height)],
    radius=25,
    fill=(255, 255, 255, 250)
)

try:
    font_logo = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 75)
    font_main = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 48)
    font_sub = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 32)
    font_badge = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 24)
except:
    font_logo = ImageFont.load_default()
    font_main = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_badge = ImageFont.load_default()

# 로고
draw.text((text_x, 180), "Jobizic", fill='#667eea', font=font_logo, anchor="lm")

# 장식 라인
line_y = 225
draw.rectangle([(text_x, line_y), (text_x + 150, line_y + 4)], fill='#764ba2')

# 메인 카피
draw.text((text_x, 290), "AI가 1분 만에", fill='#1a202c', font=font_main, anchor="lm")
draw.text((text_x, 350), "분석하는 합격 이력서", fill='#1a202c', font=font_main, anchor="lm")

# 서브 카피
draw.text((text_x, 415), "정확한 강점/약점 분석", fill='#64748b', font=font_sub, anchor="lm")

# 배지
badge_x = text_x
badge_y = 465
badge_width = 180
badge_height = 48
draw.rounded_rectangle(
    [(badge_x, badge_y), (badge_x + badge_width, badge_y + badge_height)],
    radius=24,
    fill='#10b981'
)
draw.text(
    (badge_x + badge_width // 2, badge_y + badge_height // 2),
    "무료 3회 체험",
    fill='white',
    font=font_badge,
    anchor="mm"
)

# 하단 URL
draw.text((width - 150, height - 40), "jobizic.com",
          fill='white', font=font_sub, anchor="mm")

# 저장
output_path = os.path.join(os.path.dirname(__file__), 'public', 'og-image.png')
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, 'PNG', optimize=True, quality=95)

print(f"OG image created: {output_path}")
print(f"Size: {width}x{height}px")
print("Layout: Left visual (icons) + Right text")
