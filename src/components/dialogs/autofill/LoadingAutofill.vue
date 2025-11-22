<template>
    <v-card
        variant="tonal"
        color="primary"
    >
        <v-card-title class="d-flex align-center ga-4">
            Auto-Fill in Progress
            <v-icon
                :icon="mdiLoading"
                class="ml-2"
            />
        </v-card-title>
        <v-card-text>
            <div>
                <v-timeline direction="horizontal">
                    <v-timeline-item>
                        <template v-slot:opposite>
                            Opposite content
                        </template>
                        <div>
                            <div class="text-h6">Content title</div>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>
                    </v-timeline-item>

                    <v-timeline-item>
                        <template v-slot:opposite>
                            Opposite content
                        </template>
                        <div>
                            <div class="text-h6">Content title</div>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>
                    </v-timeline-item>

                    <v-timeline-item>
                        <template v-slot:opposite>
                            Opposite content
                        </template>
                        <div>
                            <div class="text-h6">Content title</div>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            </p>
                        </div>
                    </v-timeline-item>
                </v-timeline>
            </div>

            <p>Loading...</p>
            <p>{{ status }}</p>
            <p>Attempt {{ currentAttempt }} of {{ totalAttempts }}</p>
            <p>{{ attemptStatus }}</p>
        </v-card-text>
    </v-card>
</template>


<script setup>
import { defineProps, shallowRef } from "vue";
import { mdiLoading } from "@mdi/js";

const totalAttempts = shallowRef(0);
const currentAttempt = shallowRef(0);
const attemptStatus = shallowRef("");
const outputData = shallowRef(null);
const status = shallowRef("");

const props = defineProps({
    currency: {
        required: true,
        type: String
    },
    itemID: {
        required: true,
        type: String
    },
    url: {
        required: true,
        type: String
    }
});

const emit = defineEmits(["cancel", "complete"]);
</script>


<style lang="scss" scoped>
.v-card-title {
    :deep(.v-icon__svg)  {
        animation: spin 2s linear infinite;
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
