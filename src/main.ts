import Buefy from 'buefy'
import Vue from 'vue'

import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

Vue.use(Buefy, { defaultIconPack: 'fas' })

new Vue({
  name: 'App',
  render: h => h(App),
  router
}).$mount('#app')
