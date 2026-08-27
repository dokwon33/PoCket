<template>
  <div class="thumb" :style="{ background: cat.tint }">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="course?.title || ''"
      class="thumb-photo"
      loading="lazy"
      @error="failed = true"
    />
    <Icon
      v-else
      :name="cat.icon"
      :size="iconSize"
      :stroke-width="1.4"
      :style="{ color: cat.ink }"
      class="thumb-symbol"
    />
  </div>
</template>

<script setup>
/**
 * 실증 슬롯 썸네일
 *
 * 호스트가 사진을 등록했으면 사진을, 없으면 산업군 기호를 보여준다.
 * 사진 주소가 깨졌을 때도 기호로 되돌아간다 — 빈 네모가 남지 않게.
 *
 * ⚠️ thumbnailUrl 은 아직 백엔드에 없는 필드다. 컬럼이 생기면 이 컴포넌트는
 *    수정 없이 그대로 동작한다.
 */
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon.vue'
import { category } from '@/domain/pocket.js'

const props = defineProps({
  course: { type: Object, default: () => ({}) },
  iconSize: { type: Number, default: 42 }
})

const failed = ref(false)
const cat = computed(() => category(props.course?.category))
const src = computed(() => props.course?.thumbnailUrl || props.course?.thumbnail_url || null)

// 다른 슬롯으로 바뀌면 실패 상태를 초기화한다
watch(src, () => { failed.value = false })
</script>

<style scoped>
.thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
}
.thumb-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-symbol {
  opacity: 0.72;
}
</style>
