import Vue from "vue";
import App from "./App.vue";

import store from "./vuex/store";
import router from "./router";
import { sync } from "vuex-router-sync";
sync(store, router);
import axios from "./common/services/axios";
axios(Vue, store);

import "./assets/css/global.css";
//fontawesome
import { fas } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
library.add(fas);
Vue.component("font-awesome-icon", FontAwesomeIcon);
import "./assets/font-awesome/fontawesome-all.css"; //Versão antiga

// bootstrap
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
import PortalVue from "portal-vue";
Vue.use(PortalVue);

import Notifications from "vue-notification";
Vue.use(Notifications);

import SocketIoInstance from "./socketInstance.js";
import VueSocketio from "vue-socket.io";
Vue.use(VueSocketio, SocketIoInstance, store);

Vue.config.productionTip = false;

var vm = new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");

global.vm = vm;
