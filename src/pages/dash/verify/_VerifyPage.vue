<template>
    <div class="page-content">
        <h1>Verify</h1>
        <div class="verify">
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
    </div>
</template>

<script>
import { mdiAlert, mdiInformation } from "@mdi/js";
import { account } from "@/appwrite";
import { useAuthStore } from "@/stores/auth";

export default {
    data() {
        return {
            alert: false,
            auth: useAuthStore(),
            loadingVerification: false,
            mdiAlert
        };
    },
    methods: {
        async verify() {
            this.loadingVerification = true;
            this.alert = false;

            const { userId, secret } = Object.fromEntries(
                new URLSearchParams(window.location.search)
            );

            if (!userId || !secret) {
                this.alert = {
                    text: "Invalid verification link.",
                    title: "Error"
                };
                this.loadingVerification = false;
                return;
            }

            try {
                await account.updateVerification(userId, secret);

                this.alert = {
                    icon: mdiInformation,
                    text: "Account successfully verified, redirecting you to the main page.",
                    title: "Success",
                    type: "success"
                };

                await this.auth.init();

                setTimeout(() => {
                    window.location.href = "/dash/lists";
                }, 2000);
            } catch (error) {
                this.alert = {
                    text: error.message,
                    title: "Error"
                };
            }

            this.loadingVerification = false;
        }
    },
    mounted() {
        this.verify();
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
    .verify {
        width: 100%;
    }
    hr {
        width: 100%;
    }
}
</style>
