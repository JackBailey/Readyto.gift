<template>
    <div class="page-content">
        <h1>Start Recovery</h1>
        <div
            class="recovery"
        >
            <v-form @submit.prevent="startRecovery">
                <v-text-field
                    v-model="recoveryDetails.email"
                    label="Email"
                    type="email"
                    autofocus
                />
                <v-btn
                    type="submit"
                    color="primary"
                    :loading="loadingRecovery"
                >Start</v-btn>
            </v-form>
            <v-alert
                :type="alert.type || 'error'"
                border="start"
                elevation="2"
                v-if="alert"
                :icon="alert.icon || mdiAlert"
                :title="alert.title"
                :text="alert.text"
                class="my-4"
            />
            <p>
                Remember your login?
                <router-link :to="`/dash/login?redirect=${redirectPath}`">Login here</router-link>
            </p>
        </div>
    </div>
</template>

<script>
import { mdiAlert, mdiGithub } from "@mdi/js";
import { account } from "@/appwrite";
import { clientRouter } from "@/pages/_clientRouter";
import { LOGIN_METHODS } from "astro:env/client";
import { useAuthStore } from "@/stores/auth";

export default {
    data() {
        const route = clientRouter.currentRoute.value;
        const { redirect } = route.query;
        const redirectPath = redirect
            ? decodeURIComponent(redirect)
            : "/dash/lists";
        return {
            alert: false,
            auth: useAuthStore(),
            loadingRecovery: false,
            mdiAlert,
            mdiGithub,
            methods: LOGIN_METHODS
                ? LOGIN_METHODS.split(",")
                : [],
            recoveryDetails: {
                email: ""
            },
            redirectPath
        };
    },
    methods: {
        async startRecovery() {
            this.alert = false;
            this.loadingRecovery = true;
            try {
                await account.createRecovery(
                    this.recoveryDetails.email,
                    "https://readyto.gift/dash/recovery/complete"
                );
                this.alert = {
                    text: "Recovery email sent",
                    title: "Success",
                    type: "success"
                };
            } catch (error) {
                this.alert = {
                    text: error.message,
                    title: "Error"
                };
            }
            this.loadingRecovery = false;
        }
    }
};
</script>

<style lang="scss" scoped>
.page-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    align-items: center;
    width: 400px;
    max-width: 90%;
    margin: auto;
    .recovery {
        width: 100%;
        form {
            button {
                width: 100%;
            }
        }
        > p {
            text-align: center;
            margin-top: 1rem;
        }
    }
}
</style>
