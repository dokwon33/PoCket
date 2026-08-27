<template>
  <div class="landing">
    <SplitPortal />
    <AppHeader />

    <!-- 히어로 섹션 -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content fade-in-up">
          <span class="hero-badge">B2B 실증 테스트베드 매칭</span>
          <h1 class="hero-title">제품을 검증할 현장,<br>더 빠르게 찾으세요</h1>
          <p class="hero-desc">카페·물류센터·병원 등 실제 현장이 등록한 실증 슬롯을 AI가 우리 제품에 맞춰 추천합니다.</p>
          <div class="hero-actions">
            <router-link to="/register" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
            <router-link to="/testbeds" class="btn btn-outline btn-lg">테스트베드 둘러보기</router-link>
          </div>
          <div class="hero-stats">
            <div v-for="(s, i) in stats" :key="s.label" class="stat">
              <span class="stat-num">
                <CountUp :to="s.value" :delay="i * 130" />{{ s.suffix }}
              </span>
              <span class="stat-label">{{ s.label }}</span>
            </div>
          </div>
        </div>
        <div class="hero-visual fade-in">
          <img src="@/assets/images/logo/pocket-app-icon-1024.svg" alt="PoCket" class="hero-logo" />
        </div>
      </div>
    </section>

    <!-- 인기 테스트베드 -->
    <section class="popular-section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">인기 테스트베드</h2>
          <router-link to="/testbeds" class="section-link">전체 보기 →</router-link>
        </div>
        <div class="course-grid">
          <div v-for="slot in featuredSlots" :key="slot.id" class="course-card-landing">
            <div class="card-thumb" :style="{ background: category(slot.category).tint }">
              <Icon class="thumb-icon" :name="category(slot.category).icon" :size="42" :stroke-width="1.4" :style="{ color: category(slot.category).ink }" />
            </div>
            <div class="card-body">
              <span class="badge" :style="categoryStyle(slot.category)">{{ categoryLabel(slot.category) }}</span>
              <h3 class="card-title">{{ slot.title }}</h3>
              <div class="card-meta">
                <span class="instructor">{{ slot.host }}</span>
                <span class="price">₩{{ formatFee(slot.price) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 특징 섹션 -->
    <section class="features-section">
      <div class="section-inner">
        <h2 class="section-title center">왜 PoCket인가요?</h2>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-icon"><Icon :name="f.icon" :size="30" :stroke-width="1.5" /></div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-inner">
        <h2>지금 바로 시작하세요</h2>
        <p>수백 곳의 현장과 스타트업이 PoCket에서 실증을 연결하고 있습니다.</p>
        <router-link to="/register" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
      </div>
    </section>

    <!-- 푸터 -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <img src="@/assets/images/logo/pocket-symbol-inverse.svg" alt="PoCket" />
          <span>PoCket</span>
        </div>
        <p class="footer-copy">© 2026 PoCket. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'
import SplitPortal from '@/components/SplitPortal.vue'
import Icon from '@/components/Icon.vue'
import CountUp from '@/components/CountUp.vue'
import { category, categoryLabel, categoryStyle, formatFee } from '@/domain/pocket.js'

// 랜딩 전용 예시 데이터 (API 미연동 — 로그인 전에도 보여주는 소개용 카드)
const featuredSlots = [
  { id:1, title:'강남 직영 카페 · 무인 주문 로봇 실증',   category:'BACKEND',      host:'브루잉랩',      price:1200000 },
  { id:2, title:'대형 마트 3개점 · 스마트 선반 실증',      category:'FRONTEND',     host:'리테일파트너스', price:2400000 },
  { id:3, title:'수도권 물류센터 · 자율주행 AGV 실증',     category:'DEVOPS',       host:'한성로지스',    price:5600000 },
  { id:4, title:'종합병원 외래 · 문진 AI 실증',            category:'DATA_SCIENCE', host:'미래의료원',    price:4800000 },
  { id:5, title:'강남 오피스 12층 · 스마트 회의실 실증',   category:'MOBILE',       host:'워크스페이스K', price:1800000 },
  { id:6, title:'IDC 상면 · 발열 예측 센서 실증',          category:'DATABASE',     host:'클라우드센터',  price:3200000 },
]

const stats = [
  { value: 1200,  suffix: '+', label: '실증 슬롯' },
  { value: 340,   suffix: '+', label: '호스트 현장' },
  { value: 28000, suffix: '+', label: '실증 완료' },
]

const features = [
  { icon:'target', title:'AI 테스트베드 매칭', desc:'제품 카테고리와 실증 이력을 분석해 맞는 현장을 추천합니다.' },
  { icon:'office', title:'검증된 실제 현장', desc:'카페·물류센터·병원 등 운영 중인 현장이 직접 슬롯을 등록합니다.' },
  { icon:'document', title:'신청부터 확정까지', desc:'신청·승인·결제를 한 흐름으로 처리해 실증 준비 기간을 줄입니다.' },
  { icon:'star', title:'상호 평가 기반 신뢰', desc:'실증이 끝나면 호스트와 스타트업이 서로 평가해 다음 매칭의 근거가 됩니다.' },
]
</script>

<style scoped>
.landing { background: var(--color-bg-secondary); }

/* 히어로 */
.hero {
  position: relative;
  /* 배경은 body::before 의 색층이 담당한다 */
  background: transparent;
  padding: 128px 0 104px;
  overflow: hidden;
}
.hero-inner { position: relative; z-index: 1; }
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 48px;
  align-items: center;
}
.hero-badge {
  display: inline-block;
  padding: 8px 16px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-sm);
  color: var(--color-primary);
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  margin-bottom: 24px;
}
.hero-title {
  font-size: 52px;
  font-weight: 700;
  line-height: 1.18;
  letter-spacing: -0.045em;
  color: var(--color-text-primary);
  margin-bottom: 20px;
}
.hero-desc {
  font-size: 17.5px;
  color: var(--color-text-secondary);
  line-height: 1.72;
  max-width: 480px;
  margin-bottom: 36px;
}
.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 56px;
}
.btn-lg { padding: 15px 30px; font-size: 16px; border-radius: var(--radius-md); }

/* 숫자는 유리 트레이에 올려 한 덩어리로 읽히게 한다 */
.hero-stats {
  display: inline-flex;
  gap: 8px;
  padding: 18px 8px;
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 22px;
}
.stat + .stat { border-left: 1px solid var(--glass-edge); }
.stat-num {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.045em;
  color: var(--color-text-primary);
}
.stat-label { font-size: 12.5px; font-weight: 500; color: var(--color-text-secondary); }
.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-logo {
  width: 216px;
  height: 216px;
  object-fit: contain;
  border-radius: 54px;
  box-shadow:
    0 8px 20px rgba(36,34,73,0.10),
    0 32px 72px rgba(80,101,192,0.28);
  animation: float 6s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-logo { animation: none; }
}

/* 슬롯 섹션 */
.popular-section { padding: 96px 0; }
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-title { font-size: 28px; font-weight: 700; letter-spacing: -0.04em; color: var(--color-text-primary); }
.section-title.center { text-align: center; margin-bottom: 40px; }
.section-link { font-size: 14px; color: var(--color-primary); font-weight: 500; }
.section-link:hover { text-decoration: underline; }

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.course-card-landing {
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: var(--transition);
}
.course-card-landing:hover {
  transform: translateY(-6px);
  background: var(--glass-bg-strong);
  box-shadow: var(--shadow-glass), 0 28px 64px rgba(36,34,73,0.14);
}
/* 실제 목록의 CourseCard 와 같은 규격을 쓴다 — 미리보기가 본품과 달라 보이면 안 된다 */
.card-thumb {
  position: relative;
  height: 136px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%);
  pointer-events: none;
}
.thumb-teal   { background: #E1F5EE; }
.thumb-blue   { background: #E6F1FB; }
.thumb-purple { background: #EEEDFE; }
.thumb-pink   { background: #FBEAF0; }
.thumb-icon {
  opacity: 0.72;
  transition: var(--transition);
}
.course-card-landing:hover .thumb-icon { transform: scale(1.06); }
.card-body { padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 10px; }
.card-body .badge { align-self: flex-start; }
.card-title {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
  line-height: 1.45;
}
.card-meta { display: flex; justify-content: space-between; align-items: center; }
.instructor { font-size: 13px; color: var(--color-text-secondary); }
.price {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
}

/* 특징 */
.features-section { padding: 96px 0; background: transparent; }
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.feature-card {
  padding: 34px 26px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
  border-radius: var(--radius-xl);
  text-align: center;
  transition: var(--transition);
}
.feature-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
.feature-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
  color: var(--color-primary);
}
.feature-title { font-size: 16px; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 10px; }
.feature-desc { font-size: 13.5px; color: var(--color-text-secondary); line-height: 1.68; }

/* CTA */
.cta-section {
  padding: 104px 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  text-align: center;
}
.cta-inner { max-width: 600px; margin: 0 auto; padding: 0 24px; }
.cta-inner h2 { font-size: 38px; font-weight: 700; letter-spacing: -0.04em; color: #fff; margin-bottom: 14px; }
.cta-inner p { font-size: 17px; color: rgba(255,255,255,0.82); margin-bottom: 36px; line-height: 1.7; }
.cta-inner .btn-primary {
  background: #fff;
  color: var(--color-primary);
  border-color: #fff;
  font-weight: 700;
  box-shadow: 0 10px 30px rgba(0,0,0,0.18);
}
.cta-inner .btn-primary:hover { background: var(--color-primary-light); }

/* 푸터 */
.footer {
  background: var(--color-text-primary);
  padding: 44px 0;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.footer-logo img { width: 28px; height: 28px; }
.footer-copy { font-size: 13px; color: rgba(255,255,255,0.5); }
</style>
