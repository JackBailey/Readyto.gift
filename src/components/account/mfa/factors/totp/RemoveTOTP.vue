<template>
    <v-card title="Remove TOTP Authenticator">
        <v-card-text class="d-flex">
            <v-timeline direction="vertical" side="end" truncate-line="both" align="start">
                <ExpanderStep :current-step="currentStep" :step="1" :icon="mdiClockCheck">
                    <template #title> Verify with TOTP </template>
                    <template #content>
                        <v-otp-input
                            v-model="totpCode"
                            length="6"
                            type="number"
                            label="Enter your authenticator code"
                            @finish="verifyTOTP"
                        />
                        <v-btn
                            color="primary"
                            class="mt-4"
                            :disabled="totpCode.length !== 6"
                            @click="verifyTOTP"
                        >
                            Verify
                        </v-btn>
                        <v-alert v-if="error" class="mt-4" type="error" border="start" dense>
                            {{ error }}
                        </v-alert>
                    </template>
                </ExpanderStep>
                <ExpanderStep :current-step="currentStep" :step="2" :icon="mdiCheck">
                    <template #title> Removal Successful </template>
                    <template #content>
                        <p>
                            Your TOTP authenticator has been successfully removed from your account.
                        </p>
                    </template>
                </ExpanderStep>
            </v-timeline>
        </v-card-text>
        <v-card-actions>
            <v-btn @click="emit('close')" text> Close </v-btn>
            <v-spacer />
            <v-btn
                :disabled="currentStep !== 2"
                color="primary"
                @click="emit('close')"
                variant="tonal"
            >
                Done
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup>
import { defineEmits, defineProps, shallowRef, watch } from "vue";
import { mdiCheck, mdiClockCheck } from "@mdi/js";
import { account } from "@/appwrite";
import ExpanderStep from "@/components/account/ExpanderStep.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

defineProps({
    icon: {
        default: null,
        required: false,
        type: String
    },
    title: {
        default: null,
        required: false,
        type: String
    }
});

const emit = defineEmits({
    close: () => true
});

const dialogOpen = shallowRef(false);
const currentStep = shallowRef(1);
const totpCode = shallowRef("");
const recoveryCodes = shallowRef([]);
const error = shallowRef("");

const nextStep = () => {
    currentStep.value += 1;
};

const verifyTOTP = async () => {
    error.value = "";
    try {
        await auth.completeMFAchallenge(totpCode.value);
        await account.deleteMFAAuthenticator({
            type: "totp"
        });

        const factors = await account.listMFAFactors();
        auth.setMfaFactors(factors);

        await account.updateMFA({
            mfa: false
        });

        nextStep();
    } catch {
        error.value = "Invalid TOTP code. Please try again.";
    }
};

watch(dialogOpen, async (nowOpen) => {
    if (nowOpen) {
        emit("opened");
        currentStep.value = 1;
        totpCode.value = "";
        recoveryCodes.value = [];
        error.value = "";
    } else {
        emit("closed");
    }
});
</script>
