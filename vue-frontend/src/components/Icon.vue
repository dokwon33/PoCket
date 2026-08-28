<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

/**
 * 선 아이콘 세트
 *
 * 이모지를 쓰지 않는 이유:
 *  - OS 폰트라 맥/윈도우/안드로이드에서 모양이 다르다
 *  - 색을 통제할 수 없어 정해둔 팔레트를 깨뜨린다
 *  - 활성/비활성 같은 상태를 표현할 수 없다
 *
 * 전부 stroke = currentColor 라, 부모의 color 를 그대로 따라간다.
 */
const ICONS = {
  // ── 내비게이션 ──
  compass: [
    'M12 3a9 9 0 100 18 9 9 0 000-18',
    'M15.4 8.6l-2 4.8-4.8 2 2-4.8z'
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  check: [
    'M12 3a9 9 0 100 18 9 9 0 000-18',
    'M8.4 12.2l2.4 2.4 4.8-5'
  ],
  star: [
    'M12 3.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z'
  ],
  user: [
    'M12 4a3.6 3.6 0 100 7.2 3.6 3.6 0 000-7.2',
    'M4.8 20a7.2 7.2 0 0114.4 0'
  ],
  logout: [
    'M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3',
    'M15 8l4 4-4 4',
    'M19 12H9'
  ],

  // ── 랜딩 특징 ──
  target: [
    'M12 3a9 9 0 100 18 9 9 0 000-18',
    'M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9',
    'M12 11.2a.8.8 0 100 1.6.8.8 0 000-1.6'
  ],
  document: [
    'M7 3h7l5 5v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z',
    'M14 3v5h5',
    'M9 13h6',
    'M9 17h4'
  ],

  // ── 상태 ──
  lock: [
    'M7 10.5h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z',
    'M9 10.5V8a3 3 0 016 0v2.5'
  ],
  inbox: [
    'M4 13l2.5-7h11L20 13v5a1 1 0 01-1 1H5a1 1 0 01-1-1z',
    'M4 13h4l1.2 2.2h5.6L16 13h4'
  ],

  // ── 산업군 ──
  cup: [
    'M5 8h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4z',
    'M16 9.5h1.4a2.5 2.5 0 010 5H16',
    'M8 4.4v1.6',
    'M11.6 4v2'
  ],
  storefront: [
    'M4 9.5h16V19a1 1 0 01-1 1H5a1 1 0 01-1-1z',
    'M3.4 9.5L5 5h14l1.6 4.5',
    'M9.5 20v-5h5v5'
  ],
  package: [
    'M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z',
    'M4.3 7.4L12 11.5l7.7-4.1',
    'M12 11.5V21'
  ],
  health: [
    'M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z'
  ],
  office: [
    'M4 20.5V5a1 1 0 011-1h7a1 1 0 011 1v15.5',
    'M13 10h6a1 1 0 011 1v9.5',
    'M3 20.5h18',
    'M7 8h2',
    'M7 12h2',
    'M7 16h2',
    'M16 14h1',
    'M16 17.5h1'
  ],
  shield: [
    'M12 3.2l7.4 3v5.9c0 4.4-3 7.8-7.4 8.7-4.4-.9-7.4-4.3-7.4-8.7V6.2z',
    'M9.2 11.8l2.2 2.2 4.2-4.4'
  ],
  server: [
    'M4 4.6h16a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4a1 1 0 011-1z',
    'M4 13.4h16a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4a1 1 0 011-1z',
    'M6.6 7.6h1.2',
    'M6.6 16.4h1.2'
  ],
  pin: [
    'M12 21s6.8-6.1 6.8-10.8A6.8 6.8 0 105.2 10.2C5.2 14.9 12 21 12 21z',
    'M12 12.7a2.5 2.5 0 100-5 2.5 2.5 0 000 5'
  ],

  // ── 탐색 ──
  search: [
    'M10.8 17.6a6.8 6.8 0 100-13.6 6.8 6.8 0 000 13.6',
    'M15.7 15.7L20.5 20.5'
  ],
  clock: [
    'M12 21a9 9 0 100-18 9 9 0 000 18',
    'M12 7.2V12l3.1 1.9'
  ],
  compare: [
    'M12 4.2v15.6',
    'M6.6 8.4L3.4 14.2h6.4z',
    'M17.4 8.4l-3.2 5.8h6.4z',
    'M6.6 8.4L12 6.6l5.4 1.8'
  ],
  x: ['M6.4 6.4l11.2 11.2', 'M17.6 6.4L6.4 17.6'],

  // 펼침/접힘 표시
  chevron: ['M6.5 9.5L12 15l5.5-5.5']
}

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 1.6 }
})

const paths = computed(() => {
  const found = ICONS[props.name]
  if (!found) console.warn('[PoCket] 없는 아이콘:', props.name)
  return found || ICONS.pin
})
</script>

<style scoped>
.icon {
  display: block;
  flex-shrink: 0;
}
</style>
