#!/usr/bin/env bash
# PoCket 로드맵 대시보드 이슈 생성 — 실행: bash scripts/create-roadmap-issue.sh
set -e
cd "$(dirname "$0")/.."
gh label create roadmap --color 5B74E0 --description "로드맵 · 범위 외 확장" 2>/dev/null || true
URL=$(gh issue create \
  --title "📍 PoCket 로드맵 대시보드 (팀 공동 편집)" \
  --label roadmap \
  --body-file docs/roadmap.md)
echo "생성됨: $URL"
gh issue pin "$URL" 2>/dev/null && echo "이슈를 상단에 고정했습니다" || echo "(고정은 수동으로: 이슈 우측 Pin issue)"
