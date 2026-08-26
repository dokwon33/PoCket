<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <!-- 사이드바 -->
      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">메뉴</div>

          <router-link
            to="/testbeds"
            class="sidebar-item"
            :class="{ active: $route.path === '/testbeds' }"
          >
            <span class="si-icon">🧭</span> 테스트베드 탐색
          </router-link>

          <router-link
            v-if="host"
            to="/testbeds/new"
            class="sidebar-item"
          >
            <span class="si-icon">➕</span> 실증 슬롯 등록
          </router-link>

          <router-link
            v-if="!host"
            to="/applications"
            class="sidebar-item"
          >
            <span class="si-icon">✅</span> 내 실증 신청
          </router-link>

          <router-link
            to="/mypage"
            class="sidebar-item"
          >
            <span class="si-icon">⭐</span> 마이페이지
          </router-link>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-label">계정</div>
          <router-link to="/mypage" class="sidebar-item">
            <span class="si-icon">👤</span> 마이페이지
          </router-link>
          <button class="sidebar-item sidebar-btn" @click="handleLogout">
            <span class="si-icon">🚪</span> 로그아웃
          </button>
        </div>
      </aside>

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
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/AppHeader.vue'
import CourseCard from '@/components/CourseCard.vue'
import { useCourseStore, ALL_CATEGORIES } from '@/store/course.js'
import { useAuthStore } from '@/store/auth.js'
import { isHost } from '@/domain/pocket.js'

const router = useRouter()
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

function handleLogout() {
  auth.logout()
  router.push('/')
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
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.sidebar-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: var(--transition);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-sans);
  text-decoration: none;
}

.sidebar-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.sidebar-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}

.si-icon {
  font-size: 15px;
}

.sidebar-btn {
  color: var(--color-text-secondary);
}

/* 메인 */
.main-content {
  min-width: 0;
}

.content-header {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
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
  margin-bottom: 24px;
}

.filter-chip {
  padding: 7px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  transition: var(--transition);
  cursor: pointer;
}

.filter-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
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