<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Menu from './menu/index.vue'
import Tabber from './tabbar/index.vue'
import Main from './main/index.vue'
import Slider from './slider/index.vue'
import useUserStore from '@/store/modules/user.ts'

let userStore = useUserStore()
let $route = useRoute()
const showSettings = ref(false)
</script>

<template>
  <div class="layout_container">
    <div class="layout_menu">
      <el-button @click="showSettings = true">设置</el-button>
      <el-menu
        :default-active="$route.path"
        active-text-color="#fff"
        background-color="#001529"
        text-color="#959ea6"
        mode="horizontal"
      >
        <Menu :menuList="userStore.menuRoutes[2].children" />
      </el-menu>
    </div>
    <div class="layout_tabbar">
      <Tabber />
    </div>
    <div class="layout_slider">
      <Slider />
    </div>
    <div class="layout_main">
      <Main />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout_container {
  width: 100%;
  height: 100vh;
  //background: yellow;
  .layout_menu {
    height: $meg-menu-height;
    width: 100vw;
    background: #81a2be;
    display: flex;
    .el-button {
      height: $meg-menu-height;
    }
    .el-menu {
      flex: 1;
      height: $meg-menu-height;
    }
  }
  .layout_tabbar {
    width: 100vw;
    height: $meg-tabbar-height;
    flex-direction: column;
    //background: red;
  }
  .layout_slider {
    top: calc($meg-menu-height + $meg-tabbar-height);
    width: $meg-slider-width;
    height: calc(100vh - $meg-menu-height - $meg-tabbar-height);
    //background-color: green;
  }
  .layout_main {
    position: fixed;
    top: calc($meg-menu-height + $meg-tabbar-height);
    left: $meg-slider-width;
    width: calc(100vw - $meg-slider-width);
    height: calc(100vh - $meg-menu-height - $meg-tabbar-height);
    //background-color: blue;
  }
}
</style>
