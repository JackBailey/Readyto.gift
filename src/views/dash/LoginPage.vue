<template>
    <div class="page-content">
        <h1>Log In</h1>
        <div
            class="password-login"
            v-if="methods.includes('password')"
        >
            <v-form @submit.prevent="passwordLogin">
                <v-text-field
                    v-model="passwordLoginDetails.email"
                    label="Email"
                    type="email"
                    autofocus
                />
                <v-text-field
                    v-model="passwordLoginDetails.password"
                    label="Password"
                    type="password"
                />
                <v-btn
                    type="submit"
                    color="primary"
                    :loading="loadingLogin"
                >Login</v-btn>
            </v-form>
        </div>
        <v-divider
            v-if="methods.includes('password') && methods.length > 1"
            color="border"
            :thickness="3"
        />
        <div class="buttons">
            <v-btn
                variant="tonal"
                :prepend-icon="methodsData[method].icon"
                @click="methodsData[method].login()"
                v-for="method in methods.filter((method) => method !== 'password')"
                :key="method"
            >Login with {{ methodsData[method].name }}</v-btn>
            <v-alert
                v-if="methods.length === 0"
                type="error"
                :icon="mdiAlert"
                class="mt-4"
                text="No login methods are enabled. Please contact the site administrator."
            />
        </div>
        <div class="alert">
            <v-alert
                :type="alert.type || 'error'"
                border="start"
                elevation="2"
                v-if="alert"
                :icon="alert.icon || mdiAlert"
                :title="alert.title"
                :text="alert.text"
                class="mt-4"
            />
        </div>
        <p>
            Don't have an account?
            <router-link :to="`/dash/register?redirect=${redirectPath}`">Register here</router-link>
        </p>
        <p v-if="methods.includes('password')">
            <router-link to="/dash/recovery/start">Forgot your password?</router-link>
        </p>
    </div>
</template>

<script>
import { mdiAlert, mdiGithub } from "@mdi/js";
import { account } from "@/appwrite";
import { OAuthProvider } from "appwrite";
import { setUser as setSentryUser } from "@sentry/vue";
import { useAuthStore } from "@/stores/auth";

export default {
    data() {
        const redirectPath = this.$route.query.redirect
            ? decodeURIComponent(this.$route.query.redirect)
            : "/dash/lists";
        const errorRedirect = window.location.origin + "/dash/error";
        const successRedirect = window.location.origin + redirectPath;
        return {
            alert: false,
            auth: useAuthStore(),
            loadingLogin: false,
            mdiAlert,
            mdiGithub,
            methods: import.meta.env.VITE_LOGIN_METHODS
                ? import.meta.env.VITE_LOGIN_METHODS.split(",")
                : [],
            methodsData: {
                github: {
                    icon: mdiGithub,
                    login: () => {
                        account.createOAuth2Session(
                            OAuthProvider.Github,
                            successRedirect,
                            errorRedirect,
                            ["user"]
                        );
                    },
                    name: "Github"
                }
            },
            passwordLoginDetails: {
                email: "",
                password: ""
            },
            redirectPath,
            successRedirect
        };
    },
    methods: {
        async passwordLogin() {
            this.loadingLogin = true;
            try {
                const accountResp = await account.createEmailPasswordSession(
                    this.passwordLoginDetails.email,
                    this.passwordLoginDetails.password
                );

                if (import.meta.env.VITE_SENTRY_DSN) {
                    setSentryUser({
                        email: accountResp.email,
                        id: accountResp.$id,
                        username: accountResp.name
                    });
                }


                this.auth.setPreviouslyLoggedInUserID(accountResp.$id);
            } catch (error) {
                this.alert = {
                    text: error.message,
                    title: "Error"
                };

                this.loadingLogin = false;
                return;
            }

            await this.auth.init();
            this.$router.push(this.redirectPath);
        }
    },
    mounted() {
        if (this.auth.user) {
            account.deleteSession("current");
            this.auth.user = null;
            this.auth.init();
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
    .password-login {
        width: 100%;
        form {
            button {
                width: 100%;
            }
        }
    }
    hr {
        width: 100%;
    }
    .buttons {
        width: 100%;
        button {
            width: 100%;
        }
    }
}
</style>
