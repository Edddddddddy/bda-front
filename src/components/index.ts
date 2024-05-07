// import type { App } from 'vue'
// import * as components from './components'
// import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// const install = function (app: App) {
//   Object.entries(components).forEach(([key, value]) => {
//     app.component(key, value)
//   })
//   for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//     app.component(key, component)
//   }
// }
//
// export default install
// export * from './components'

import SvgIcon from './SvgIcon/index.vue'

const allGlobalComponents = { SvgIcon }

export default {
  install(app) {
    Object.keys(allGlobalComponents).forEach((key) => {
      app.component(key, allGlobalComponents[key])
    })
  },
}
