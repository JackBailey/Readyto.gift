<template>
    <v-dialog max-width="90%" :fullscreen="false" v-model="dialogOpen">
        <template v-slot:activator="{ props: activatorProps }">
            <v-list-item v-bind="activatorProps" :prepend-icon="icon">
                {{ title }}
            </v-list-item>
        </template>
        <template v-slot:default>
            <v-card :title="title">
                <v-card-text class="d-flex">
                    <v-timeline direction="vertical" side="end" truncate-line="both" align="start">
                        <ExpanderStep
                            :current-step="currentStep"
                            :step="1"
                            :icon="mdiAlert"
                            v-if="action === 'regenerate'"
                        >
                            <template #title> Confirm Action </template>
                            <template #content>
                                <v-alert type="warning" border="start" dense>
                                    This action will invalidate your existing recovery codes. Make
                                    sure to save your new recovery codes once generated.
                                </v-alert>
                                <v-btn color="primary" class="mt-4" @click="nextStep">
                                    Continue
                                </v-btn>
                            </template>
                        </ExpanderStep>
                        <ExpanderStep :current-step="currentStep" :step="2" :icon="mdiClockCheck">
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
                                <v-alert
                                    v-if="error"
                                    class="mt-4"
                                    type="error"
                                    border="start"
                                    dense
                                >
                                    {{ error }}
                                </v-alert>
                            </template>
                        </ExpanderStep>
                        <ExpanderStep :current-step="currentStep" :step="3" :icon="mdiCheck">
                            <template #title> Manage Recovery Codes </template>
                            <template #content>
                                <RecoveryCodes :recoveryCodes="recoveryCodes" />
                            </template>
                        </ExpanderStep>
                    </v-timeline>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="dialogOpen = false" text> Close </v-btn>
                    <v-spacer />
                    <v-btn
                        v-if="currentStep > (props.action === 'regenerate' ? 1 : 2)"
                        text
                        @click="prevStep"
                        color="error"
                    >
                        Back
                    </v-btn>
                    <v-btn
                        :disabled="currentStep !== 3"
                        color="primary"
                        @click="dialogOpen = false"
                        variant="tonal"
                    >
                        Done
                    </v-btn>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script setup>
import { defineEmits, defineProps, shallowRef, watch } from "vue";
import { mdiAlert, mdiCheck, mdiClockCheck } from "@mdi/js";
import ExpanderStep from "@/components/account/ExpanderStep.vue";
import RecoveryCodes from "./RecoveryCodes.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const props = defineProps({
    action: {
        required: true,
        type: String
    },
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
    closed: () => true,
    opened: () => true
});

const dialogOpen = shallowRef(false);
const currentStep = shallowRef(props.action === "regenerate" ? 1 : 2);
const totpCode = shallowRef("");
const recoveryCodes = shallowRef([]);
const error = shallowRef("");

const prevStep = () => {
    currentStep.value -= 1;
};

const nextStep = () => {
    currentStep.value += 1;
};

const verifyTOTP = async () => {
    error.value = "";
    try {
        await auth.completeMFAchallenge(totpCode.value);
        if (props.action === "regenerate") {
            recoveryCodes.value = await auth.regenerateRecoveryCodes();
        } else {
            recoveryCodes.value = await auth.getRecoveryCodes();
        }
        nextStep();
    } catch {
        error.value = "Invalid TOTP code. Please try again.";
    }
};

watch(dialogOpen, async (nowOpen) => {
    if (nowOpen) {
        emit("opened");
        currentStep.value = props.action === "regenerate" ? 1 : 2;
        totpCode.value = "";
        recoveryCodes.value = [];
        error.value = "";
    } else {
        emit("closed");
    }
});
</script>
