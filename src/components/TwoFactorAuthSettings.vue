<template>
    <v-list-item :prepend-icon="mdiTwoFactorAuthentication">
        <v-list-item-title>Two-Factor Authentication (2FA)</v-list-item-title>
        <v-list-item-subtitle>
            <span v-if="auth.user.mfa">2FA is currently enabled on your account.</span>
            <span v-else>2FA is currently disabled on your account.</span>
        </v-list-item-subtitle>
        <template v-slot:append>
            <v-dialog v-model="dialogOpen">
                <template v-slot:activator="{ props: activatorProps }">
                    <v-btn
                        text
                        class="ml-5"
                        v-bind="activatorProps"
                        variant="tonal"
                    >
                        {{ auth.user.mfa ? 'Disable' : 'Enable' }} 2FA
                    </v-btn>
                </template>
                <template v-slot:default>
                    <v-card>
                        <v-card-title>
                            {{ auth.user.mfa ? 'Disable' : 'Enable' }} Two-Factor Authentication
                        </v-card-title>
                        <v-card-text>
                            <div
                                class="enable-mfa"
                                v-if="!auth.user.mfa"
                            >
                                <v-timeline
                                    direction="vertical"
                                    side="end"
                                    truncate-line="both"
                                    align="start"
                                >
                                    <TwoFactorStep
                                        :currentStep="currentStep"
                                        :icon="mdiShieldKey"
                                        :step="1"
                                        :error="errors[0]"
                                    >
                                        <template #title>
                                            Authenticator setup
                                        </template>
                                        <template #content>
                                            <p v-if="!errors[0]">
                                                Scan the QR code or paste the secret into your authenticator to begin.
                                                <img
                                                    :src="totpQrcode"
                                                    class="totp-qrcode mt-4"
                                                />
                                                <v-text-field
                                                    :value="totpSecret"
                                                    readonly=""
                                                    variant="outlined"
                                                    class="mt-4"
                                                    rounded
                                                    hint="Copy this into your authenticator if you are unable to scan the above QR code!"
                                                    persistent-hint=""
                                                >
                                                    <template v-slot:append-inner>
                                                        <v-btn
                                                            :icon="mdiContentCopy"
                                                            size="small"
                                                            variant="tonal"
                                                            @click="copyTotpSecret"
                                                        />

                                                        <v-snackbar
                                                            v-model="totpUriCopySnackbar"
                                                            width="max-content"
                                                        >
                                                            Copied MFA secret to clipboard!
                                                        </v-snackbar>
                                                    </template>
                                                </v-text-field>
                                            </p>
                                            <v-btn
                                                class="mt-4"
                                                color="primary"
                                                @click="nextStep"
                                                v-if="!errors[0]"
                                            >
                                                Next
                                            </v-btn>
                                        </template>
                                    </TwoFactorStep>
                                    <TwoFactorStep
                                        :currentStep="currentStep"
                                        :icon="mdiShieldCheck"
                                        :step="2"
                                        :error="errors[1]"
                                    >
                                        <template #title>
                                            Verify authenticator
                                        </template>
                                        <template #content>
                                            <p>
                                                Enter the 6-digit code generated by your authenticator app to verify setup.
                                            </p>
                                            <v-otp-input
                                                class="d-block"
                                                name="Your 2FA code"
                                                v-model="totpInput"
                                                @finish="enable2FA"
                                            />
                                            <v-btn
                                                color="primary"
                                                @click="enable2FA"
                                                class="mt-4"
                                                :disabled="totpInput.length < 6"
                                            >
                                                Next
                                            </v-btn>
                                        </template>
                                    </TwoFactorStep>
                                    <TwoFactorStep
                                        :currentStep="currentStep"
                                        :icon="mdiCheck"
                                        :step="3"
                                    >
                                        <template #title>
                                            Setup complete!
                                        </template>
                                        <template #content>
                                            <p>Two factor authentication is now all set up!</p>
                                            <p>
                                                Below are your recovery codes, which are used to recover your account if you lose access to your authenticator.<br/>
                                                Please save these codes in a secure location.
                                            </p>
                                            <v-card
                                                class="recovery-codes-container mt-4"
                                                variant="tonal"
                                            >
                                                <v-card-text>
                                                    <ol class="recovery-codes">
                                                        <li
                                                            class="recovery-code"
                                                            v-for="recoveryCode in recoveryCodes"
                                                            :key="recoveryCode"
                                                        >
                                                            {{ recoveryCode }}
                                                        </li>
                                                    </ol>
                                                    <v-btn @click="downloadRecoverycodes">
                                                        Download
                                                    </v-btn>
                                                </v-card-text>
                                            </v-card>
                                            <v-btn
                                                color="primary"
                                                @click="dialogOpen = false"
                                                class="mt-4"
                                            >
                                                Done
                                            </v-btn>
                                        </template>
                                    </TwoFactorStep>
                                </v-timeline>
                            </div>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn
                                @click="prevStep"
                                color="primary"
                                :disabled="currentStep === 1"
                            >
                                Back
                            </v-btn>
                            <v-btn
                                text
                                @click="dialogOpen = false"
                                color="error"
                            >
                                Cancel
                            </v-btn>
                            <v-spacer />
                            <!-- <v-btn>
                                Done
                            </v-btn> -->
                        </v-card-actions>
                    </v-card>
                </template>
            </v-dialog>
        </template>
    </v-list-item>
</template>

<script setup>
import { account, avatars } from "@/appwrite";
import { mdiCheck, mdiContentCopy, mdiShieldCheck, mdiShieldKey, mdiTwoFactorAuthentication } from "@mdi/js";
import { reactive, shallowRef, watch } from "vue";
import TwoFactorStep from "./TwoFactorStep.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const dialogOpen = shallowRef(false);
const currentStep = shallowRef(1);

const totpSecret = shallowRef("");
const totpQrcode = shallowRef("");
const totpUriCopySnackbar = shallowRef(false);

const totpInput = shallowRef("");

const recoveryCodes = shallowRef([]);

const errors = reactive(Array(3).fill(null));

const copyTotpSecret = () => {
    window.navigator.clipboard.writeText(totpSecret.value);
    totpUriCopySnackbar.value = true;
};

const prevStep = () => {
    currentStep.value -= 1;
};

const nextStep = () => {
    currentStep.value += 1;
};

const enable2FA = async () => {
    try {
        try {
            recoveryCodes.value = await account.createMFARecoveryCodes();
        } catch (error) {
            if (error.type === "user_recovery_codes_already_exists") {
                const challenge = await account.createMFAChallenge({
                    factor: "totp"
                });
                const challengeId = challenge.$id;

                await account.updateMFAChallenge({
                    challengeId,
                    otp: totpInput.value
                });

                recoveryCodes.value = (await account.getMFARecoveryCodes()).recoveryCodes;
            } else {
                throw error;
            }
        }

        const totpResponse = await account.updateMFAAuthenticator({
            otp: totpInput.value,
            type: "totp"
        });

        console.log(totpResponse);

        const account = await account.updateMFA({
            mfa: true
        });

        auth.setUser(account);

        nextStep(); // Move to recovery codes + success step
    } catch (error) {
        console.log({ error });
        errors[1] = error.message;
        console.log(errors);
        console.error({ error });
    }
};

const downloadRecoverycodes = () => {
    const textData = recoveryCodes.value.join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", "data:text/plain;charset=UTF-8," + encodeURIComponent(textData));
    link.setAttribute("download", "readyto_gift-recovery-codes.txt");
    document.body.appendChild(link);
    link.click();
    document.removeChild(link);
};

watch(dialogOpen, async (nowOpen) => {
    if (nowOpen) {
        if (auth.user.mfa) {
            // 2FA is already enabled, no need to setup
            return;
        }
        try {
            const totpResponse = await account.createMfaAuthenticator({
                type: "totp"
            });
            
            totpSecret.value = totpResponse.secret;
    
            totpQrcode.value = avatars.getQR({
                download: false,
                margin: 0,
                size: 800,
                text: totpResponse.uri
            });
        } catch (error) {
            errors[0] = error.message;
        }
    } else {
        currentStep.value = 1;
        totpSecret.value = "";
        totpQrcode.value = "";
        totpInput.value = "";
        errors.fill(null);
    }
});

watch(totpInput, () => {
    errors[1] = null;
});

</script>

<style lang="scss">
.enable-mfa {
    display: flex;
}

.totp-qrcode {
    width: 12rem;
    height: 12rem;
    display: block;
    max-width: 80%;
    border-radius: 1rem;
    background-color: white;
    padding: 0.7rem;
}

.timeline-item-body {
    transition: max-height 0.25s ease-in-out;
    max-height: 0;
    overflow: hidden;
}

.v-timeline-item[data-active="true"] .timeline-item-body {
    max-height: 200vh;
}

.recovery-codes-container {
    .recovery-codes {
        padding: 0 1rem;
        font-size: 1.2rem;
        margin: 0;
        // display: flex;
        // flex-wrap: wrap;
        // margin-top: 1rem;
        // .recovery-code {
        //     background-color: rgb(var(--v-theme-surface));
        //     border-radius: 0.5rem;
        //     padding: 0.5rem 1rem;
        //     font-family: monospace;
        //     margin: 0.25rem;
        //     outline: 1px solid rgb(var(--v-theme-on-surface));
        // }
    }
    // .v-btn {
    //     margin-left: auto;
    //     margin-top: 1rem;
    // }
}

.v-timeline-item {
    &[data-step="4"] {
        .v-otp-input {
            justify-content: flex-start;
            width: 30rem;
            font-weight: bold;
        }
    }
}
</style>