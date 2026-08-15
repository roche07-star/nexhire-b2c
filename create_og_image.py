from PIL import Image, ImageDraw, ImageFont
import os

# 이미지 크기 (OG 표준)
width = 1200
height = 630

# 이미지 생성 - 더 세련된 그라디언트
img = Image.new('RGB', (width, height), color='#667eea')

# 부드러운 그라디언트 효과 (보라-파랑)
draw = ImageDraw.Draw(img)
for i in range(height):
    # 더 부드러운 색상 전환
    r = int(102 + (116 - 102) * (i / height) ** 1.5)
    g = int(126 + (74 - 126) * (i / height) ** 1.5)
    b = int(234 + (162 - 234) * (i / height) ** 1.5)
    draw.rectangle([(0, i), (width, i+1)], fill=(r, g, b))

# 흰색 카드 배경 (더 큰 카드, 그림자 효과)
card_x = 120
card_y = 80
card_width = 960
card_height = 470

# 그림자 효과 (투명도 없이 어두운 색으로)
shadow_offset = 8
shadow_color = (80, 80, 120)
draw.rounded_rectangle(
    [(card_x + shadow_offset, card_y + shadow_offset),
     (card_x + card_width + shadow_offset, card_y + card_height + shadow_offset)],
    radius=32,
    fill=shadow_color
)

# 실제 카드
draw.rounded_rectangle(
    [(card_x, card_y), (card_x + card_width, card_y + card_height)],
    radius=32,
    fill='white'
)

try:
    # 시스템 폰트 사용
    font_logo = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 85)      # 로고
    font_large = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 56)     # 메인
    font_medium = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 36)      # 서브
    font_small = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 26)       # 배지
    font_url = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 28)         # URL
except:
    font_logo = ImageFont.load_default()
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_url = ImageFont.load_default()

# 텍스트 중앙 정렬
center_x = width // 2

# 1. Jobizic 로고 (더 크고 눈에 띄게)
draw.text((center_x, 150), "Jobizic", fill='#667eea', font=font_logo, anchor="mm")

# 장식 라인 (로고 아래)
line_width = 100
line_y = 195
draw.rectangle(
    [(center_x - line_width // 2, line_y), (center_x + line_width // 2, line_y + 4)],
    fill='#764ba2'
)

# 2. 메인 헤드라인 (간격 조정)
draw.text((center_x, 270), "AI가 1분 만에 분석하는", fill='#1a202c', font=font_large, anchor="mm")
draw.text((center_x, 340), "합격 이력서", fill='#1a202c', font=font_large, anchor="mm")

# 3. 서브 헤드라인
draw.text((center_x, 415), "AI 기반 정확한 강점/약점 분석", fill='#64748b', font=font_medium, anchor="mm")

# 4. 배지 (무료 3회만)
badge_x = center_x - 100
badge_y = 480
badge_width = 200
badge_height = 55

# 무료 3회 배지 (더 눈에 띄게)
draw.rounded_rectangle(
    [(badge_x, badge_y), (badge_x + badge_width, badge_y + badge_height)],
    radius=28,
    fill='#10b981'  # 더 선명한 초록
)
draw.text(
    (badge_x + badge_width // 2, badge_y + badge_height // 2),
    "✓ 무료 3회 체험",
    fill='white',
    font=font_small,
    anchor="mm"
)

# 5. 하단 URL (더 눈에 띄게)
draw.text((center_x, 590), "jobizic.com", fill='white', font=font_url, anchor="mm")

# 저장
output_path = os.path.join(os.path.dirname(__file__), 'public', 'og-image.png')
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, 'PNG', optimize=True, quality=95)

print(f"OG image created: {output_path}")
print(f"Size: {width}x{height}px")
