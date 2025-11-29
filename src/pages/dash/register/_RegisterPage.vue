<template>
    <div class="page-content">
        <h1>Register</h1>
        <div class="password-register">
            <v-form @submit.prevent="register">
                <v-text-field
                    v-model.trim="registrationDetails.name"
                    label="Name"
                    type="text"
                    autofocus
                />
                <v-text-field
                    v-model.trim="registrationDetails.email"
                    label="Email"
                    type="email"
                />
                <v-text-field
                    v-model.trim="registrationDetails.password"
                    label="Password"
                    type="password"
                />
                <v-text-field
                    v-model.trim="registrationDetails.passwordConfirmation"
                    label="Password Confirmation"
                    type="password"
                />
                <v-btn
                    type="submit"
                    color="primary"
                    :loading="loadingRegistration"
                >Register</v-btn>
            </v-form>
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
            Already have an account?
            <a :href="`/dash/login?redirect=${redirectPath}`">Login here</a>
        </p>
    </div>
</template>

<script>
import { mdiAlert, mdiInformation } from "@mdi/js";
import { account } from "@/appwrite";
import { ID } from "appwrite";
import { useAuthStore } from "@/stores/auth";

export default {
    data() {
        const { redirect } = Object.fromEntries(
            new URLSearchParams(window.location.search)
        );
        const redirectPath = redirect
            ? redirect
            : "/dash/lists";
        const successRedirect = window.location.origin + redirectPath;
        return {
            alert: false,
            auth: useAuthStore(),
            loadingRegistration: false,
            mdiAlert,
            redirectPath,
            registrationDetails: {
                email: "",
                password: ""
            },
            successRedirect
        };
    },
    methods: {
        async register() {
            this.alert = false;
            if (!this.registrationDetails.name) {
                this.alert = {
                    text: "Please enter a name.",
                    title: "Error"
                };
                return;
            }

            if (!this.registrationDetails.email) {
                this.alert = {
                    text: "Please enter an email address.",
                    title: "Error"
                };
                return;
            }

            if (!this.registrationDetails.password) {
                this.alert = {
                    text: "Please enter a password.",
                    title: "Error"
                };
                return;
            }

            if (
                this.registrationDetails.password !== this.registrationDetails.passwordConfirmation
            ) {
                this.alert = {
                    text: "Passwords do not match.",
                    title: "Error"
                };
                return;
            }

            this.loadingRegistration = true;
            try {
                const accResp = await account.create(
                    ID.unique(),
                    this.registrationDetails.email.trim(),
                    this.registrationDetails.password.trim(),
                    this.registrationDetails.name.trim()
                );

                if (accResp.status === true) {
                    this.alert = {
                        icon: mdiInformation,
                        text: "Account created successfully, redirecting you to the login page.",
                        title: "Success",
                        type: "success"
                    };

                    this.loadingRegistration = false;

                    setTimeout(() => {
                        window.location.href = `/dash/login?redirect=${this.redirectPath}`;
                    }, 2000);
                }
            } catch (error) {
                this.alert = {
                    text: error.message,
                    title: "Error"
                };

                this.loadingRegistration = false;
                return;
            }
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
    .password-register {
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
