# chickenrunv2

늙은 심술 고양이를 피해 농장을 탈출하는 세로 스크롤 닭 러너 게임 (Vite + Three.js).

## 실행

```bash
npm install
npx vite --host      # 개발 서버 (http://localhost:3000)
npx vite build       # dist/ 로 빌드
```

## 에셋 파이프라인

`raw_videos/`, `raw_backgrounds/` 원본을 스프라이트 시트와 배경으로 변환합니다 (`raw_videos/`는 저장소에 포함되지 않습니다).

```bash
python scripts/asset_pipeline.py videos --char cat_grumpy
python scripts/asset_pipeline.py portraits
```
