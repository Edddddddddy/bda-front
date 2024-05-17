<template>
  <div class="Container">
    <TabbarContainer
      class="ToggleVisibility"
      footerText="Toggle Visibility"
      :containerWidth="85"
    >
      <LabelButton footerText="Show All" />
    </TabbarContainer>
    <TabbarContainer
      class="ImportExport"
      footerText="Import & Export"
      :containerWidth="138"
    >
      <LabelButton footerText="Import" />
      <LabelButton footerText="Export" />
    </TabbarContainer>
  </div>
</template>
<script setup lang="ts">
import LabelButton from '@/views/meg/components/labelButton.vue'
import TabbarContainer from '@/views/meg/components/tabbarContainer.vue'
</script>

<style scoped lang="scss">
.Container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
