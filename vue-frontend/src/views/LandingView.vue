<template>
  <div class="landing">
    <SplitPortal />
    <AppHeader />

    <!-- 히어로 섹션 -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content fade-in-up">
          <span class="hero-badge">PoCket 테스트베드</span>
          <h1 class="hero-title">필요한 시간대만 빌려도<br>진짜 손님이 써보는 테스트베드</h1>
          <div class="hero-actions">
            <router-link to="/testbeds" class="btn btn-primary btn-lg">현장 둘러보기</router-link>
            <router-link to="/register" class="btn btn-outline btn-lg">우리 현장 등록하기</router-link>
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
        <div class="section-header" v-reveal>
          <h2 class="section-title">지금 열려 있는 현장</h2>
          <router-link to="/testbeds" class="section-link">전체 보기 →</router-link>
        </div>
        <div class="course-grid">
          <!-- 카드가 hover 로 떠오르니 누를 수 있다고 읽힌다. 실제로 누르면
               로그인 상태에서는 슬롯 상세로, 아니면 로그인을 거쳐 그리로 간다. -->
          <component
            :is="linkable ? 'router-link' : 'a'"
            v-for="(slot, i) in featuredSlots"
            :key="slot.id"
            v-reveal="{ delay: Math.min(i, 5) * 60 }"
            :to="linkable ? `/testbeds/${slot.id}` : undefined"
            :href="linkable ? undefined : '/login?redirect=/testbeds'"
            class="course-card-landing"
          >
            <div class="card-thumb">
              <SlotThumb :course="slot" :icon-size="42" />
            </div>
            <div class="card-body">
              <span class="badge" :style="categoryStyle(slot.category)">{{ categoryLabel(slot.category) }}</span>
              <h3 class="card-title">{{ slot.title }}</h3>
              <div class="card-meta">
                <span class="instructor">{{ hostName(slot) }}</span>
                <span class="price">₩{{ formatFee(slot.price) }}</span>
              </div>
            </div>
          </component>
        </div>
      </div>
    </section>

    <!-- 특징 섹션 -->
    <section class="features-section">
      <div class="section-inner">
        <h2 class="section-title center" v-reveal>현장을 구하는 데 몇 달을 쓰지 않도록</h2>
        <div class="features-grid">
          <div
            v-for="(f, i) in features"
            :key="f.title"
            class="feature-card"
            v-reveal="{ delay: i * 60 }"
          >
            <div class="feature-icon"><Icon :name="f.icon" :size="30" :stroke-width="1.5" /></div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-inner" v-reveal="{ y: 24 }">
        <h2>검증할 현장부터 골라보세요</h2>
        <p>조건을 보고, 신청하고, 결제하면 확정됩니다. 그 다음은 현장에서 확인하세요.</p>
        <router-link to="/testbeds" class="btn btn-primary btn-lg">현장 둘러보기</router-link>
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
import { onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import SplitPortal from '@/components/SplitPortal.vue'
import Icon from '@/components/Icon.vue'
import CountUp from '@/components/CountUp.vue'
import SlotThumb from '@/components/SlotThumb.vue'
import { categoryLabel, categoryStyle, formatFee } from '@/domain/pocket.js'
import { hostName, primeHosts } from '@/domain/hosts.js'
import { courseApi } from '@/api/course.js'
import { useAuthStore } from '@/store/auth.js'

/**
 * 로그인 전에 보여줄 소개용 카드.
 *
 * 게이트웨이가 /api/courses 를 익명에게 401 로 막기 때문에, 로그인 전에는
 * 실제 목록을 받을 수가 없다. 그때 이 카드로 화면을 채운다.
 * 로그인한 사용자에게는 아래에서 실제 슬롯으로 교체한다.
 */
const SAMPLE_SLOTS = [
  { id:1, title:'강남 직영 카페 · 무인 주문 로봇 실증',   category:'BACKEND',      instructorName:'브루잉랩',      price:1200000 },
  { id:2, title:'대형 마트 3개점 · 스마트 선반 실증',      category:'FRONTEND',     instructorName:'리테일파트너스', price:2400000 },
  { id:3, title:'수도권 물류센터 · 자율주행 AGV 실증',     category:'DEVOPS',       instructorName:'한성로지스',    price:5600000 },
  { id:4, title:'종합병원 외래 · 문진 AI 실증',            category:'DATA_SCIENCE', instructorName:'미래의료원',    price:4800000 },
  { id:5, title:'강남 오피스 12층 · 스마트 회의실 실증',   category:'MOBILE',       instructorName:'워크스페이스K', price:1800000 },
  { id:6, title:'IDC 상면 · 발열 예측 센서 실증',          category:'DATABASE',     instructorName:'클라우드센터',  price:3200000 },
]

const featuredSlots = ref(SAMPLE_SLOTS)

/* 샘플 카드의 id 는 실제 슬롯이 아니다. 진짜 목록으로 교체된 뒤에만 상세로 보낸다. */
const linkable = ref(false)

onMounted(async () => {
  // 익명이면 요청하지 않는다 — 401 인터셉터가 "세션 만료"로 오인해 토큰을 마크한다
  if (!useAuthStore().accessToken) return

  try {
    const res = await courseApi.getCourses()
    const list = Array.isArray(res.data?.data) ? res.data.data : []
    if (!list.length) return

    // 서버가 정렬을 받지 않는다. "인기"는 신청 건수 기준으로 화면에서 골라 낸다.
    featuredSlots.value = [...list]
      .sort((a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0))
      .slice(0, 6)

    linkable.value = true
    await primeHosts(featuredSlots.value)
  } catch (e) {
    console.warn('[PoCket] 인기 테스트베드 조회 실패 — 소개용 카드를 유지한다:', e?.response?.status)
  }
})

const stats = [
  { value: 1200,  suffix: '+', label: '실증 슬롯' },
  { value: 340,   suffix: '+', label: '호스트 현장' },
  { value: 28000, suffix: '+', label: '실증 완료' },
]

const features = [
  { icon:'target', title:'조건에 맞는 현장을 찾아줍니다', desc:'제품 카테고리와 지난 실증 이력을 함께 봅니다.' },
  { icon:'office', title:'운영 중인 현장이 직접 등록합니다', desc:'카페·리테일·물류·헬스케어·오피스 등 8개 산업군.' },
  { icon:'document', title:'결제하면 바로 확정됩니다', desc:'따로 심사를 기다릴 필요가 없습니다.' },
  { icon:'star', title:'끝나면 서로 평가합니다', desc:'그 평판이 다음 매칭의 근거가 됩니다.' },
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
  color: var(--color-link);
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
/* ── 반응형 ──────────────────────────────────────────────────
   이 화면에는 폭 미디어쿼리가 하나도 없었다. 390px 에서 scrollWidth 가 420 이라
   히어로가 화면 밖으로 밀려 나갔다(범인: .hero-content, right 429).
   기준 폭은 다른 화면과 같은 992px, 그리고 폰용 600px 두 단계만 쓴다. */
@media (max-width: 992px) {
  .hero { padding: 88px 0 72px; }
  .hero-inner { grid-template-columns: 1fr; gap: 32px; }
  /* 로고 타일이 auto 트랙이라 텍스트 칸의 최소 폭을 밀어낸다 */
  .hero-visual { display: none; }
  .hero-title { font-size: 40px; }
  .course-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .features-section { padding: 72px 0; }
  .popular-section { padding: 72px 0; }
}

@media (max-width: 600px) {
  .hero { padding: 56px 0 48px; }
  .hero-title { font-size: 31px; }
  .hero-actions { flex-direction: column; align-items: stretch; }
  .hero-actions .btn { width: 100%; text-align: center; }
  .hero-stats { flex-wrap: wrap; }
  .stat + .stat { border-left: none; }
  .course-grid, .features-grid { grid-template-columns: minmax(0, 1fr); }
  .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
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
.section-link { font-size: 14px; color: var(--color-link); font-weight: 500; }
.section-link:hover { text-decoration: underline; }

.course-grid {
  display: grid;
  /* 1fr 은 min-content 아래로 줄어들지 않는다. 좁은 화면에서 칸이 밖으로 밀려 나간다. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.course-card-landing {
  display: block;
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
/* 썸네일은 SlotThumb(자식 컴포넌트) 안에 있어 :deep() 으로 짚어야 한다 */
.card-thumb :deep(.thumb-symbol),
.card-thumb :deep(.thumb-photo) { transition: var(--transition); }
.course-card-landing:hover :deep(.thumb-symbol),
.course-card-landing:hover :deep(.thumb-photo) { transform: scale(1.06); }
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  color: var(--color-link);
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
  color: var(--color-link);
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

/* 투명도를 줄이도록 설정한 사용자에게는 유리를 불투명하게 —
   가드가 없으면 설정을 켜도 blur 와 반투명이 그대로 남는다. */
@media (prefers-reduced-transparency: reduce) {
  .hero-badge,
  .hero-stats,
  .course-card-landing,
  .feature-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
