<template>
    <v-card-text>
        Please enter the authentication code from your authenticator app.
        <v-otp-input
            v-model="code"
            length="6"
            type="number"
            label="Authentication Code"
            autocomplete="one-time-code"
            autofocus
            @finish="submit"
            :error="!!errorMessage"
        />
        <v-alert
            v-if="errorMessage"
            type="error"
            class="mt-4"
            border="start"
            text
            width="500px"
            max-width="100%"
        >
            {{ errorMessage }}
        </v-alert>
    </v-card-text>
    <v-card-actions>
        <v-btn
            text
            @click="$emit('cancel')"
        >
            Cancel
        </v-btn>
        <v-spacer />
        <v-btn
            color="primary"
            :disabled="code.length !== 6"
            @click="submit"
        >
            Submit
        </v-btn>
    </v-card-actions>
</template>

<script setup>
import { defineEmits, shallowRef } from "vue";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits(["cancel", "success"]);

const auth = useAuthStore();

const code = shallowRef("");
const errorMessage = shallowRef("");

const submit = async () => {
    try {
        await auth.completeMFAchallenge(code.value);
        emit("success");
    } catch (error) {
        errorMessage.value = error.message || "An unknown error occurred.";
    } finally {
        code.value = "";
    }
};
</script>
