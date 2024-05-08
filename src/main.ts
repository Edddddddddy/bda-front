import { createApp } from 'vue'
import './style.css'
import App from '@/App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 配置国际化
//@ts-ignore
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })

//svg插件配置代码
import 'virtual:svg-icons-register'
//自定义插件
import globalComponent from '@/components/index'
app.use(globalComponent)
//引入模板全局样式
import '@/styles/index.scss'

app.mount('#app')
