import "@/assets/main.scss";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "@/App.vue";
import router from "@/router";

import vuetify from "../plugins/vuetify";

import * as Sentry from "@sentry/vue";

const app = createApp(App);

const pinia = createPinia();

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        app,
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration({ router }),
            Sentry.replayIntegration()
        ],
        // Tracing
        tracesSampleRate: 1.0, //  Capture 100% of the transactions
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: ["localhost", /^https:\/\/readyto\.gift/],
        // Session Replay
        replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
        replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
        
    });

    pinia.use(Sentry.createSentryPiniaPlugin({
        attachPiniaState: true
    }));
}

app.use(pinia);

app.use(router);
app.use(vuetify);
app.mount("#app");
