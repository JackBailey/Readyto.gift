<template>
    <v-list-item :prepend-icon="mdiClockCheck">
        <v-list-item-title> Time-based One-Time Password (TOTP) </v-list-item-title>
        <template #append>
            <v-dialog v-model="dialogOpen">
                <template v-slot:activator>
                    <v-btn
                        :icon="mdiPlusThick"
                        color="primary"
                        variant="tonal"
                        @click="dialogOpen = true"
                        size="small"
                        class="ml-4"
                        v-if="!totpFactor"
                    />
                    <v-btn-group class="ml-4" density="compact" variant="tonal" v-else>
                        <v-btn
                            :prepend-icon="mdiTrashCan"
                            color="error"
                            variant="tonal"
                            size="small"
                            @click="removeTOTP"
                        >
                            Remove
                        </v-btn>
                        <v-btn v-bind="menuOpen" size="small" slim width="2rem" min-width="0">
                            <v-icon :icon="mdiMenuDown" />
                            <v-menu
                                activator="parent"
                                location="bottom start"
                                transition="fade-transition"
                                v-model="menuOpen"
                            >
                                <v-list density="compact" rounded="lg" slim>
                                    <ManageRecoveryCodes
                                        action="get"
                                        :icon="mdiDownload"
                                        title="Download Recovery Codes"
                                        @closed="menuOpen = false"
                                    />
                                    <ManageRecoveryCodes
                                        action="regenerate"
                                        :icon="mdiRefresh"
                                        title="Regenerate Recovery Codes"
                                        @closed="menuOpen = false"
                                    />
                                </v-list>
                            </v-menu>
                        </v-btn>
                    </v-btn-group>
                </template>
                <template v-slot:default>
                    <v-card>
                        <v-card-title> Add TOTP Authenticator </v-card-title>
                        <v-card-text>
                            <div class="enable-mfa">
                                <v-timeline
                                    direction="vertical"
                                    side="end"
                                    truncate-line="both"
                                    align="start"
                                >
                                    <ExpanderStep
                                        :currentStep="currentStep"
                                        :icon="mdiShieldKey"
                                        :step="1"
                                        :error="errors[0]"
                                    >
                                        <template #title> Authenticator setup </template>
                                        <template #content>
                                            <p v-if="!errors[0]">
                                                Scan the QR code or paste the secret into your
                                                authenticator to begin.
                                                <img :src="totpQrcode" class="totp-qrcode mt-4" />
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
                                    </ExpanderStep>
                                    <ExpanderStep
                                        :currentStep="currentStep"
                                        :icon="mdiShieldCheck"
                                        :step="2"
                                        :error="errors[1]"
                                    >
                                        <template #title> Verify authenticator </template>
                                        <template #content>
                                            <p>
                                                Enter the 6-digit code generated by your
                                                authenticator app to verify setup.
                                            </p>
                                            <v-otp-input
                                                class="d-block"
                                                name="Your TOTP code"
                                                v-model="totpInput"
                                                @finish="enableTOTP"
                                            />
                                            <v-btn
                                                color="primary"
                                                @click="enableTOTP"
                                                class="mt-4"
                                                :disabled="totpInput.length < 6"
                                            >
                                                Next
                                            </v-btn>
                                        </template>
                                    </ExpanderStep>
                                    <ExpanderStep
                                        :currentStep="currentStep"
                                        :icon="mdiCheck"
                                        :step="3"
                                    >
                                        <template #title> Setup complete! </template>
                                        <template #content>
                                            <p>Two factor authentication is now all set up!</p>
                                            <p>
                                                Below are your recovery codes, which are used to
                                                recover your account if you lose access to your
                                                authenticator.<br />
                                                Please save these codes in a secure location.
                                            </p>
                                            <v-card
                                                class="recovery-codes-container mt-4"
                                                variant="tonal"
                                            >
                                                <RecoveryCodes :recoveryCodes="recoveryCodes" />
                                            </v-card>
                                            <v-btn
                                                color="primary"
                                                @click="dialogOpen = false"
                                                class="mt-4"
                                            >
                                                Done
                                            </v-btn>
                                        </template>
                                    </ExpanderStep>
                                </v-timeline>
                            </div>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn @click="prevStep" color="primary" :disabled="currentStep === 1">
                                Back
                            </v-btn>
                            <v-btn text @click="dialogOpen = false" color="error"> Cancel </v-btn>
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
import { computed, reactive, shallowRef, watch } from "vue";
import {
    mdiCheck,
    mdiClockCheck,
    mdiContentCopy,
    mdiDownload,
    mdiMenuDown,
    mdiPlusThick,
    mdiRefresh,
    mdiShieldCheck,
    mdiShieldKey,
    mdiTrashCan
} from "@mdi/js";
import { markRaw } from "vue";

import ExpanderStep from "@/components/account/ExpanderStep.vue";
import ManageRecoveryCodes from "./ManageRecoveryCodes.vue";
import RecoveryCodes from "./RecoveryCodes.vue";
import RemoveTOTP from "./RemoveTOTP.vue";
import { useAuthStore } from "@/stores/auth";
import { useDialogs } from "@/stores/dialogs";

const auth = useAuthStore();
const dialogs = useDialogs();

const dialogOpen = shallowRef(false);
const menuOpen = shallowRef(false);
const currentStep = shallowRef(1);

const totpSecret = shallowRef("");
const totpQrcode = shallowRef("");
const totpUriCopySnackbar = shallowRef(false);

const totpInput = shallowRef("");

const recoveryCodes = shallowRef([]);

const errors = reactive(Array(3).fill(null));

const totpFactor = computed(() => {
    return auth.mfaFactors && auth.mfaFactors.totp;
});

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

const removeTOTP = async () => {
    dialogs.create({
        component: markRaw(RemoveTOTP),
        fullscreen: false,
        maxWidth: undefined
    });
};

const enableTOTP = async () => {
    try {
        recoveryCodes.value = await auth.getRecoveryCodes(totpInput.value);

        await account.updateMFAAuthenticator({
            otp: totpInput.value,
            type: "totp"
        });

        const factors = await account.listMFAFactors();
        auth.setMfaFactors(factors);

        nextStep(); // Move to recovery codes + success step
    } catch (error) {
        console.log({ error });
        errors[1] = error.message;
        console.log(errors);
        console.error({ error });
    }
};

watch(dialogOpen, async (nowOpen) => {
    if (nowOpen) {
        if (auth.user.mfa) {
            // TOTP is already enabled, no need to setup
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
