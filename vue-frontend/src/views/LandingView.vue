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
            <router-link to="/login" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
            <router-link to="/testbeds" class="btn btn-outline btn-lg">테스트베드 둘러보기</router-link>
          </div>
          <div class="hero-stats">
            <div class="stat"><span class="stat-num">1,200+</span><span class="stat-label">실증 슬롯</span></div>
            <div class="stat"><span class="stat-num">340+</span><span class="stat-label">호스트 현장</span></div>
            <div class="stat"><span class="stat-num">28,000+</span><span class="stat-label">실증 완료</span></div>
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
          <router-link to="/login" class="section-link">전체 보기 →</router-link>
        </div>
        <div class="course-grid">
          <div v-for="slot in featuredSlots" :key="slot.id" class="course-card-landing">
            <div class="card-thumb" :style="{ background: category(slot.category).tint }">
              <span class="thumb-icon" aria-hidden="true">{{ category(slot.category).icon }}</span>
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
            <div class="feature-icon">{{ f.icon }}</div>
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
        <router-link to="/login" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
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

const features = [
  { icon:'🎯', title:'AI 테스트베드 매칭', desc:'제품 카테고리와 실증 이력을 분석해 맞는 현장을 추천합니다.' },
  { icon:'🏢', title:'검증된 실제 현장', desc:'카페·물류센터·병원 등 운영 중인 현장이 직접 슬롯을 등록합니다.' },
  { icon:'📝', title:'신청부터 확정까지', desc:'신청·승인·결제를 한 흐름으로 처리해 실증 준비 기간을 줄입니다.' },
  { icon:'⭐', title:'상호 평가 기반 신뢰', desc:'실증이 끝나면 호스트와 스타트업이 서로 평가해 다음 매칭의 근거가 됩니다.' },
]
</script>

<style scoped>
.landing { background: var(--color-bg-secondary); }

/* 히어로 */
.hero {
  background: var(--gradient-brand-wash);
  border-bottom: 1px solid var(--color-border);
  padding: 80px 0 64px;
}
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
  padding: 5px 14px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}
.hero-title {
  font-size: 42px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.5px;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}
.hero-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 460px;
  margin-bottom: 28px;
}
.hero-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 40px;
}
.btn-lg { padding: 12px 28px; font-size: 15px; }
.hero-stats {
  display: flex;
  gap: 36px;
}
.stat { display: flex; flex-direction: column; gap: 2px; }
.stat-num { font-size: 22px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-logo {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 50px;
  box-shadow: var(--shadow-lg);
}

/* 슬롯 섹션 */
.popular-section { padding: 64px 0; }
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
.section-title.center { text-align: center; margin-bottom: 40px; }
.section-link { font-size: 14px; color: var(--color-primary); font-weight: 500; }
.section-link:hover { text-decoration: underline; }

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.course-card-landing {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
}
.course-card-landing:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.card-thumb {
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb-teal   { background: #E1F5EE; }
.thumb-blue   { background: #E6F1FB; }
.thumb-purple { background: #EEEDFE; }
.thumb-pink   { background: #FBEAF0; }
.thumb-icon { font-size: 40px; line-height: 1; }
.card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.card-body .badge { align-self: flex-start; }
.card-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; }
.card-meta { display: flex; justify-content: space-between; align-items: center; }
.instructor { font-size: 12px; color: var(--color-text-secondary); }
.price { font-size: 14px; font-weight: 600; color: var(--color-primary); }

/* 특징 */
.features-section { padding: 64px 0; background: var(--color-bg-primary); }
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.feature-card {
  padding: 28px 24px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  transition: var(--transition);
}
.feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.feature-icon { font-size: 32px; margin-bottom: 12px; }
.feature-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.feature-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }

/* CTA */
.cta-section {
  padding: 80px 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  text-align: center;
}
.cta-inner { max-width: 600px; margin: 0 auto; padding: 0 24px; }
.cta-inner h2 { font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 12px; }
.cta-inner p { font-size: 16px; color: rgba(255,255,255,0.8); margin-bottom: 32px; }
.cta-inner .btn-primary {
  background: #fff;
  color: var(--color-primary);
  border-color: #fff;
  font-weight: 600;
}
.cta-inner .btn-primary:hover { background: var(--color-primary-light); }

/* 푸터 */
.footer {
  background: var(--color-text-primary);
  padding: 32px 0;
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
