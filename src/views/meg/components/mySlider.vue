<template>
  <div class="Container">
    <div class="slider-header">
      <span :style="{ fontSize: titleFontSize + 'px' }">{{ title }}</span>
      <div class="hr-line" />
    </div>
    <div class="card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MySlider',
  props: {
    title: {
      type: String,
      default: 'Card Title',
    },
    titleFontSize: {
      type: Number,
      default: 16,
    },
  },
})
</script>

<style scoped lang="scss">
.Container {
  width: 100%;
  top: 5px;
  height: calc( 100vh - $meg-tabbar-height - $meg-menu-height - 5px);
  display: flex;
  flex-wrap: wrap;
  //gap: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 10px;
  //box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.slider-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 5px;
}
.hr-line {
  width: 100%;
  height: 1px;
  background-color: #e6e6e6; /* 横线颜色 */
  margin: 0 0 10px 0; /* 调整横线与标题和内容之间的距离 */
}

.card-content {
  min-height: 100px; /* 确保内容高度至少为100px */
}
</style>
