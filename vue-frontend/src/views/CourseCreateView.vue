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
            <h1 class="page-title">실증 슬롯 등록</h1>
            <p class="page-subtitle">우리 현장을 실증 테스트베드로 공개합니다. 환경 스펙과 실증비를 입력해 주세요.</p>
          </div>
        </div>

        <div class="form-card">
          <form class="course-form" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label class="form-label" for="title">슬롯명</label>
              <input
                id="title"
                v-model.trim="form.title"
                type="text"
                class="form-input"
                placeholder="예: 강남 직영 카페 - 무인 주문 로봇 실증"
                maxlength="100"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="description">현장 · 환경 스펙</label>
              <textarea
                id="description"
                v-model.trim="form.description"
                class="form-textarea"
                rows="6"
                placeholder="현장 규모, 이용객 수, 전원·네트워크 조건, 실증 가능 기간 등을 입력해 주세요."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="thumbnail">현장 사진 <span class="optional">(선택)</span></label>
              <input
                id="thumbnail"
                v-model.trim="form.thumbnailUrl"
                type="url"
                class="form-input"
                placeholder="https://example.com/photo.jpg"
              />
              <p class="field-help">
                사진 주소를 넣으면 슬롯 카드에 사진이 보입니다. 비워 두면 산업군 기호가 표시됩니다.
              </p>
              <p class="field-warn">
                아직 서버에 사진을 저장하는 기능이 준비되지 않아, 지금 입력한 주소는 저장되지 않습니다.
              </p>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="category">산업군</label>
                <select id="category" v-model="form.category" class="form-select">
                  <option disabled value="">산업군을 선택하세요</option>
                  <option
                    v-for="option in categoryOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="price">실증비</label>
                <input
                  id="price"
                  v-model.number="form.price"
                  type="number"
                  min="0"
                  :max="PRICE_MAX"
                  step="1"
                  class="form-input"
                  placeholder="예: 1200000"
                  aria-describedby="price-hint"
                />
                <p id="price-hint" class="field-hint">최대 {{ formatFee(PRICE_MAX) }}원까지 입력할 수 있습니다.</p>
              </div>
            </div>

            <div v-show="validationError" class="error-box" role="alert">
              {{ validationError }}
            </div>

            <div v-show="submitError" class="error-box" role="alert">
              {{ submitError }}
            </div>

            <div v-show="submitSuccess" class="success-box" role="status">
              {{ submitSuccess }}
            </div>

            <div class="form-actions">
              <router-link to="/testbeds" class="btn btn-ghost">
                취소
              </router-link>

              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting">등록 중...</span>
                <span v-else>실증 슬롯 등록</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { courseApi } from '@/api/course.js'
import { useAuthStore } from '@/store/auth.js'
import { CATEGORIES, PRICE_MAX, formatFee, isHost, apiErrorMessage } from '@/domain/pocket.js'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  title: '',
  description: '',
  category: '',
  price: null,
  thumbnailUrl: ''
})

const submitting = ref(false)
const validationError = ref('')
const submitError = ref('')
const submitSuccess = ref('')

// 산업군 8종을 매핑 모듈에서 그대로 가져온다 (여기에 따로 나열하면 또 갈라진다)
const categoryOptions = CATEGORIES.map(({ code, label }) => ({ value: code, label }))

function validateForm() {
  validationError.value = ''

  if (!isHost(auth.user?.role)) {
    validationError.value = '호스트 계정만 실증 슬롯을 등록할 수 있습니다.'
    return false
  }

  if (!form.title) {
    validationError.value = '슬롯명을 입력해 주세요.'
    return false
  }

  if (!form.description) {
    validationError.value = '현장·환경 스펙을 입력해 주세요.'
    return false
  }

  if (!form.category) {
    validationError.value = '산업군을 선택해 주세요.'
    return false
  }

  if (form.price === null || form.price === undefined || form.price === '') {
    validationError.value = '실증비를 입력해 주세요.'
    return false
  }

  const price = Number(form.price)
  if (Number.isNaN(price) || price < 0) {
    validationError.value = '실증비는 0 이상의 숫자로 입력해 주세요.'
    return false
  }

  // courses.price 가 DECIMAL(10,2) 라 정수부가 8자리뿐이다.
  // 넘겨 보내면 DB 가 "Out of range value for column 'price'" 로 거절하고
  // 사용자에게는 일반적인 실패 문구만 보인다. 입력 단계에서 막는다.
  if (price > PRICE_MAX) {
    validationError.value = `실증비는 최대 ${formatFee(PRICE_MAX)}원까지 입력할 수 있습니다.`
    return false
  }

  return true
}

async function handleSubmit() {
  submitError.value = ''
  submitSuccess.value = ''

  if (!validateForm()) return

  submitting.value = true

  try {
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      // 백엔드에 아직 없는 필드. 지금은 무시되지만, 컬럼이 생기면 이 줄만으로 동작한다.
      thumbnailUrl: form.thumbnailUrl || null
    }

    const res = await courseApi.create(payload)
    console.log('[CourseCreate] create response =', res.data)

    submitSuccess.value = '실증 슬롯이 등록되었습니다.'

    const createdCourseId =
      res.data?.data?.id ??
      res.data?.id

    if (createdCourseId) {
      setTimeout(() => {
        router.push(`/testbeds/${createdCourseId}`)
      }, 500)
    } else {
      setTimeout(() => {
        router.push('/testbeds')
      }, 500)
    }
  } catch (error) {
    console.error('[CourseCreate] create failed:', error)
    submitError.value = apiErrorMessage(error, '실증 슬롯 등록에 실패했습니다.', {
      403: '호스트 계정만 실증 슬롯을 등록할 수 있습니다.'
    })
  } finally {
    submitting.value = false
  }
}
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
  margin-bottom: 20px;
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

.form-card {
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-edge);
  box-shadow: var(--shadow-glass);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.course-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.optional {
  font-weight: 500;
  color: var(--color-text-muted);
}
.field-help {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
.field-warn {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-warning-light);
  color: var(--color-warning);
  font-size: 12.5px;
  line-height: 1.6;
}
.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 제약을 입력 전에 알려 준다 — 보내고 나서 거절당하면 이유를 모른다 */
.field-hint {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  padding: 12px 14px;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-text-primary);
  outline: none;
  transition: var(--transition);
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.form-textarea {
  resize: vertical;
  min-height: 140px;
  line-height: 1.5;
}

.error-box {
  background: #fef2f2;
  color: #dc2626;
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: 13px;
}

.success-box {
  background: #ecfdf3;
  color: #15803d;
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 6px;
}

@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

/* 투명도를 줄이도록 설정한 사용자에게는 유리를 불투명하게 —
   가드가 없으면 설정을 켜도 blur 와 반투명이 그대로 남는다. */
@media (prefers-reduced-transparency: reduce) {
  .form-card {
    background: var(--color-bg-primary);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border-color: var(--color-border);
  }
}
</style>
