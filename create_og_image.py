from PIL import Image, ImageDraw, ImageFont
import os

# 이미지 크기 (OG 표준)
width = 1200
height = 630

# 이미지 생성
img = Image.new('RGB', (width, height), color='#6366f1')  # 보라-파랑 배경

# 그라디언트 효과 (간단한 버전)
draw = ImageDraw.Draw(img)
for i in range(height):
    r = int(99 + (118 - 99) * i / height)
    g = int(102 + (74 - 102) * i / height)
    b = int(241 + (162 - 241) * i / height)
    draw.rectangle([(0, i), (width, i+1)], fill=(r, g, b))

# 흰색 카드 배경
card_x = 150
card_y = 100
card_width = 900
card_height = 430
draw.rounded_rectangle(
    [(card_x, card_y), (card_x + card_width, card_y + card_height)],
    radius=30,
    fill='white'
)

try:
    # 시스템 폰트 사용
    font_large = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 70)  # 맑은 고딕 Bold
    font_medium = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 50)   # 맑은 고딕
    font_small = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 30)
    font_tiny = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 24)
except:
    # 폰트 로드 실패 시 기본 폰트
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_tiny = ImageFont.load_default()

# 텍스트 추가
# 1. Jobizic 로고
draw.text((600, 170), "Jobizic", fill='#6366f1', font=font_large, anchor="mm")

# 2. 메인 헤드라인
draw.text((600, 270), "AI가 1분 만에 분석하는", fill='#1a202c', font=font_medium, anchor="mm")
draw.text((600, 330), "합격 이력서", fill='#1a202c', font=font_medium, anchor="mm")

# 3. 서브 헤드라인
draw.text((600, 400), "Claude AI 기반 정확한 강점/약점 분석", fill='#4a5568', font=font_small, anchor="mm")

# 4. 배지들
# 무료 3회 배지
badge1_x = 400
badge1_y = 470
badge1_width = 180
badge1_height = 50
draw.rounded_rectangle(
    [(badge1_x, badge1_y), (badge1_x + badge1_width, badge1_y + badge1_height)],
    radius=25,
    fill='#d4edda'
)
draw.text((badge1_x + 90, badge1_y + 25), "무료 3회 체험", fill='#1a7a4a', font=font_tiny, anchor="mm")

# Claude Sonnet 4 배지
badge2_x = 620
badge2_y = 470
badge2_width = 180
badge2_height = 50
draw.rounded_rectangle(
    [(badge2_x, badge2_y), (badge2_x + badge2_width, badge2_y + badge2_height)],
    radius=25,
    fill='#d6e9f8'
)
draw.text((badge2_x + 90, badge2_y + 25), "Claude Sonnet 4", fill='#1a4fa0', font=font_tiny, anchor="mm")

# 5. 하단 URL
draw.text((600, 590), "jobizic.com", fill='white', font=font_small, anchor="mm")

# 저장
output_path = os.path.join(os.path.dirname(__file__), 'public', 'og-image.png')
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, 'PNG')

print(f"OG image created: {output_path}")
print(f"Size: {width}x{height}px")
