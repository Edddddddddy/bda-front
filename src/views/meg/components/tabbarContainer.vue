<template>
  <div class="tabbarContainer" :style="{ width: containerWidth + 'px' }">
    <div class="content">
      <slot></slot>
    </div>
    <div class="footer">
      {{ footerText }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TabbarContainer',
  props: {
    footerText: {
      type: String,
      default: '',
    },
    containerWidth: {
      type: Number,
      default: 100,
    },
  },
})
</script>

<style scoped lang="scss">
.tabbarContainer {
  height: calc($meg-tabbar-height - 4px);
  display: flex;
  flex-direction: column;
  border: 1px solid #ccc;
  border-radius: 10px;
  .content {
    height: calc($meg-tabbar-height - 4px);
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    flex-direction: column;
    column-count: 1; /* 初始列数 */
    column-gap: 0; /* 列间距 */
    //break-inside: avoid;
  }

  .footer {
    height: 12px;
    font-size: 10px;
    text-align: center;
    border-radius:  1px 1px 10px 10px;
    background-color: #f9f9f9;
    border-top: 1px solid #eee;
  }
}
</style>
