<template>
  <router-view />

  <!--
    개발 도구. import.meta.env.DEV 는 빌드 시점에 false 로 치환되고
    v-if 가 죽은 가지가 되므로, 운영 번들에는 DevPanel 이 아예 포함되지 않는다.
    여는 방법은 Ctrl(⌘) + Alt + D — 화면에 단서를 남기지 않는다.
  -->
  <DevPanel v-if="isDev" />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

const isDev = import.meta.env.DEV

// 비동기 로드라 운영에서는 청크 자체가 만들어지지 않는다
const DevPanel = isDev
  ? defineAsyncComponent(() => import('@/components/DevPanel.vue'))
  : null
</script>
