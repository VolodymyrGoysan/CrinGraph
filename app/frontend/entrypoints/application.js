// 'https://vite-ruby.netlify.app/guide/rails'
//
// Example: Load Rails libraries in Vite.
//
// import * as Turbo from '@hotwired/turbo'
// Turbo.start()
//
// import ActiveStorage from '@rails/activestorage'
// ActiveStorage.start()
//
// // Import all channels.
// const channels = import.meta.globEager('./**/*_channel.js')
//
// Example: Import a stylesheet in app/frontend/index.css
// import '~/index.css'

import "@hotwired/turbo-rails"
import "trix"
import "@rails/actiontext"
import * as bootstrap from "bootstrap"

import "../helpers"

import { createApp } from "vue";
import App from "../components/App.vue";

const app = createApp(App).mount("#app");
