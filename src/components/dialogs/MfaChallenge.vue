<template>
    <v-otp-input
        v-model="otpInput"
        :length="length"
        :type="type"
        @finish="finish"
    />
    <v-alert 
        v-if="errorMessage || error"
        type="error"
        variant="outlined"
        class="mt-4"
    >
        {{ errorMessage || error }}
    </v-alert>
</template>

<script setup>
import { defineEmits, defineProps, shallowRef, watch } from "vue";

const error = shallowRef("");

defineProps({
    errorMessage: {
        default: "",
        type: String
    },
    length: {
        default: 6,
        type: Number
    },
    type: {
        default: "number",
        type: String
    }
});

const emit = defineEmits(["finish"]);

const otpInput = shallowRef("");

watch(otpInput, () => {
    error.value = "";
    // Also emit event to clear dialog error
    emit("clearError");
});

const finish = async (value) => {
    error.value = ""; // Clear any local errors
    emit("otpEntered", value);
};
</script>