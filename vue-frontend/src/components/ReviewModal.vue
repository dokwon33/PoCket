<template>
  <ModalSheet labelledby="review-title" :locked="saving" @close="close">
      <h3 id="review-title" class="sheet-title">
        {{ isEdit ? '평가 수정' : '실증 평가 남기기' }}
      </h3>
      <p class="sheet-desc">{{ slotTitle }}</p>

      <div class="field">
        <span class="field-label">평점</span>
        <StarRating v-model="rating" :size="30" />
        <span class="rating-hint">{{ RATING_LABEL[rating] || '별을 눌러 점수를 선택하세요' }}</span>
      </div>

      <div class="field">
        <label class="field-label" for="review-comment">한 줄 평 <span class="optional">(선택)</span></label>
        <textarea
          id="review-comment"
          v-model.trim="comment"
          class="comment"
          rows="4"
          maxlength="500"
          placeholder="현장 환경, 협조 정도, 다시 협업할 의향 등을 적어 주세요."
        ></textarea>
        <span class="counter">{{ comment.length }}/500</span>
      </div>

      <div v-show="error" class="error-msg" role="alert">{{ error }}</div>

      <div class="actions">
        <button type="button" class="btn btn-ghost" @click="close" :disabled="saving">취소</button>
        <button type="button" class="btn btn-primary" @click="submit" :disabled="saving || !rating">
          <span v-if="saving">저장 중...</span>
          <span v-else>{{ isEdit ? '수정' : '평가 남기기' }}</span>
        </button>
      </div>
  </ModalSheet>
</template>

<script setup>
import { computed, ref } from 'vue'
import ModalSheet from '@/components/ModalSheet.vue'
import StarRating from '@/components/StarRating.vue'
import { reviewApi } from '@/api/review.js'
import { apiErrorMessage } from '@/domain/pocket.js'

const RATING_LABEL = {
  1: '많이 아쉬웠어요',
  2: '아쉬웠어요',
  3: '보통이에요',
  4: '좋았어요',
  5: '아주 좋았어요'
}

const props = defineProps({
  /** 평가 대상 실증 건 */
  target: { type: Object, required: true }, // { enrollmentId, revieweeId, slotTitle }
  /** 수정할 기존 평가 (없으면 신규) */
  existing: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved'])

const rating = ref(props.existing?.rating ?? 0)
const comment = ref(props.existing?.comment ?? '')
const saving = ref(false)
const error = ref('')

const isEdit = computed(() => Boolean(props.existing?.id))
const slotTitle = computed(() => props.target?.slotTitle || `실증 #${props.target?.enrollmentId}`)

function close() {
  if (saving.value) return
  emit('close')
}

async function submit() {
  if (!rating.value) {
    error.value = '평점을 선택해 주세요.'
    return
  }

  error.value = ''
  saving.value = true
  try {
    if (isEdit.value) {
      await reviewApi.update(props.existing.id, { rating: rating.value, comment: comment.value || null })
    } else {
      await reviewApi.create({
        enrollmentId: props.target.enrollmentId,
        revieweeId: props.target.revieweeId ?? null,
        rating: rating.value,
        comment: comment.value || null
      })
    }
    emit('saved')
  } catch (e) {
    error.value = apiErrorMessage(e, '평가를 저장하지 못했습니다.', {
      403: '이 실증 건의 당사자만 평가할 수 있습니다.',
      404: '평가할 실증 건을 찾을 수 없습니다.',
      409: '이미 평가를 남긴 실증 건입니다.'
    })
  } finally {
    saving.value = false
  }
}

</script>

<style scoped>
.sheet-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
}
.sheet-desc {
  margin-top: 6px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.field {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.optional {
  font-weight: 500;
  color: var(--color-text-muted);
}
.rating-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  min-height: 18px;
}

.comment {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  resize: vertical;
  transition: var(--transition);
}
.comment:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(80, 101, 192, 0.14);
}
.counter {
  align-self: flex-end;
  font-size: 12px;
  color: var(--color-text-muted);
}

.error-msg {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: #FDECEC;
  color: #B02525;
  font-size: 13.5px;
}

.actions {
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
