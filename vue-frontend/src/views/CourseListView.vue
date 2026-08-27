<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <!-- 사이드바 -->
      <AppSidebar />

      <!-- 메인 -->
      <main class="main-content">
        <div class="content-header">
          <div>
            <h1 class="page-title">테스트베드 탐색</h1>
            <p class="page-subtitle" v-if="host">
              호스트 계정으로 등록한 실증 슬롯을 확인하고 새 슬롯을 추가할 수 있습니다.
            </p>
            <p class="page-subtitle" v-else>
              산업군별 실증 현장을 살펴보고 우리 제품에 맞는 테스트베드를 신청하세요.
            </p>
          </div>

          <router-link
            v-if="host"
            to="/testbeds/new"
            class="btn btn-primary create-course-btn"
          >
            실증 슬롯 등록
          </router-link>
        </div>

        <!-- 필터 -->
        <div class="filter-bar">
          <button
            v-for="cat in categoryFilters"
            :key="cat.code"
            :class="['filter-chip', { active: selectedCategory === cat.code }]"
            @click="selectCategory(cat.code)"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="loading-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card">
            <div class="skeleton-thumb"></div>
            <div class="skeleton-body">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        </div>

        <!-- 인증 만료 : "데이터 없음" 과 구분해서 말한다 -->
        <SessionExpiredNotice v-else-if="authExpired" />

        <!-- 슬롯 그리드 -->
        <div v-else-if="filteredSlots.length" class="course-grid fade-in">
          <CourseCard
            v-for="slot in filteredSlots"
            :key="slot.id"
            :course="slot"
          />
        </div>

        <!-- 빈 상태 -->
        <div v-else class="empty-state">
          <p>해당 산업군에 등록된 실증 슬롯이 없습니다.</p>

          <router-link
            v-if="host"
            to="/testbeds/new"
            class="btn btn-primary empty-action-btn"
          >
            첫 실증 슬롯 등록하기
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CourseCard from '@/components/CourseCard.vue'
import SessionExpiredNotice from '@/components/SessionExpiredNotice.vue'
import { authExpired } from '@/domain/session.js'
import { useCourseStore, ALL_CATEGORIES } from '@/store/course.js'
import { useAuthStore } from '@/store/auth.js'
import { isHost } from '@/domain/pocket.js'

const courseStore = useCourseStore()
const auth = useAuthStore()

// storeToRefs 로 꺼내야 반응성이 유지된다.
// 그냥 구조분해하면 loading 이 최초 값(false)으로 고정돼 스켈레톤이 뜨지 않는다.
const { loading, selectedCategory, courses } = storeToRefs(courseStore)
const categoryFilters = courseStore.categoryFilters

const host = computed(() => isHost(auth.user?.role))

// 필터는 enum 코드로 비교한다 (라벨 비교는 라벨 변경 시 조용히 깨진다)
const filteredSlots = computed(() => {
  if (!Array.isArray(courses.value)) return []
  if (selectedCategory.value === ALL_CATEGORIES) return courses.value
  return courses.value.filter(c => c.category === selectedCategory.value)
})

function selectCategory(code) {
  courseStore.setCategory(code)
}

onMounted(() => {
  courseStore.fetchCourses()
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}

/* 사이드바 */








/* 메인 */
.main-content {
  min-width: 0;
}

.content-header {
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin-top: 8px;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.create-course-btn {
  white-space: nowrap;
  text-decoration: none;
}

/* 필터 */
.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.filter-chip {
  padding: 9px 18px;
  border-radius: var(--radius-pill);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.02em;
  border: 1px solid var(--glass-edge);
  background: var(--glass-bg-thin);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-sm);
  color: var(--color-text-secondary);
  transition: var(--transition);
  cursor: pointer;
}

.filter-chip:hover {
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--shadow-md);
}
.filter-chip:active { transform: scale(0.97); }

.filter-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 1px 2px rgba(36,34,73,0.10), 0 6px 18px rgba(80,101,192,0.30);
}

/* 슬롯 그리드 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* 스켈레톤 */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.skeleton-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.skeleton-thumb {
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-line.short {
  width: 40%;
}

.skeleton-line.medium {
  width: 70%;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--color-text-muted);
  font-size: 15px;
}

.empty-action-btn {
  display: inline-flex;
  margin-top: 16px;
  text-decoration: none;
}

@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .course-grid,
  .loading-grid {
    grid-template-columns: 1fr;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>