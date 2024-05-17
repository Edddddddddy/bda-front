<template>
  <MySlider class="contatiner" title="Edit Amplifier">
    <MyCard title="Workflow Control">
      <LabelButton footerText="Finalize" />
    </MyCard>
    <MyCard title="Amplifier Setup">
      <LabelButton footerText="New" />
      <LabelButton footerText="Delete" />
    </MyCard>
    <MyCard title="Edit Selected Amplifier">
      <LabelButton footerText="Edit Amplifier" />
    </MyCard>
  </MySlider>
</template>
<script setup lang="ts">
import MyCard from '@/views/meg/components/myCard.vue'
import LabelButton from '@/views/meg/components/labelButton.vue'
import MySlider from '@/views/meg/components/mySlider.vue'
</script>

<style scoped lang="scss">
.contatiner {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 10px;
}
</style>
