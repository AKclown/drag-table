import 'ant-design-vue/dist/reset.css';
import './assets/reset.css'

import Antd from 'ant-design-vue';
import { createApp } from 'vue'
// import App from './App.vue'
import App from './jsx/App.jsx'


const app = createApp(App)

app.use(Antd).mount('#app')
