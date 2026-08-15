from PIL import Image, ImageDraw, ImageFont
import os

width = 1200
height = 630

# 베이스 이미지
img = Image.new('RGB', (width, height), '#0f172a')
draw = ImageDraw.Draw(img)

# 배경 - 다크 그라디언트
for y in range(height):
    progress = y / height
    r = int(15 + (88 - 15) * progress)
    g = int(23 + (80 - 23) * progress)
    b = int(42 + (157 - 42) * progress)
    draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))

# 큰 원형 장식 (왼쪽 상단)
draw.ellipse([(-100, -100), (300, 300)], fill=(102, 126, 234, 30))

# 작은 원형 장식 (오른쪽 하단)
draw.ellipse([(900, 400), (1300, 800)], fill=(116, 74, 162, 30))

# 메인 컨텐츠 영역
content_x = 100
content_y = 150

# 폰트 로드
try:
    font_brand = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 90)
    font_hero = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 64)
    font_sub = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 38)
    font_badge = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 28)
except:
    font_brand = font_hero = font_sub = font_badge = ImageFont.load_default()

# Jobizic 브랜드 (그라디언트 느낌의 밝은 색)
draw.text((content_x, content_y), "Jobizic",
          fill='#a78bfa', font=font_brand, anchor="lt")

# 메인 카피 (두 줄, 여백 충분히)
hero_y = content_y + 130
draw.text((content_x, hero_y), "AI가 1분만에 분석해서",
          fill='#f1f5f9', font=font_hero, anchor="lt")

hero_y += 85
draw.text((content_x, hero_y), "수정하는 합격 이력서",
          fill='#ffffff', font=font_hero, anchor="lt")

# 서브 카피
sub_y = hero_y + 100
draw.text((content_x, sub_y), "정확한 강점/약점 분석으로 취업 성공률 UP",
          fill='#cbd5e1', font=font_sub, anchor="lt")

# 배지 (네온 스타일)
badge_y = sub_y + 80
badge_x = content_x
badge_w = 200
badge_h = 58

# 배지 외곽선 (네온 효과)
for i in range(3):
    offset = i * 2
    alpha = 100 - i * 30
    draw.rounded_rectangle(
        [(badge_x - offset, badge_y - offset),
         (badge_x + badge_w + offset, badge_y + badge_h + offset)],
        radius=30,
        outline=(16, 185, 129, alpha),
        width=2
    )

# 배지 본체
draw.rounded_rectangle(
    [(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)],
    radius=29,
    fill='#10b981'
)

draw.text((badge_x + badge_w//2, badge_y + badge_h//2),
          "무료 3회 체험",
          fill='#ffffff', font=font_badge, anchor="mm")

# URL (우측 하단, 밝은 보라)
draw.text((width - 160, height - 55), "jobizic.com",
          fill='#c4b5fd', font=font_sub, anchor="lt")

# 작은 장식 요소 (우측 상단 - 브랜드 포인트)
accent_x = width - 150
accent_y = 80
for i in range(3):
    draw.ellipse(
        [(accent_x + i*40, accent_y), (accent_x + i*40 + 20, accent_y + 20)],
        fill='#a78bfa' if i % 2 == 0 else '#10b981'
    )

# 저장
output_path = os.path.join(os.path.dirname(__file__), 'public', 'og-image.png')
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path, 'PNG', optimize=True, quality=95)

print(f"Created: {output_path}")
print(f"Style: Professional dark gradient with neon accents")
