<template>
    <v-dialog v-model="dialogOpen">
        <template v-slot:activator="{ props: activatorProps }">
            <v-tooltip :open-on-hover="url === ''">
                <template v-slot:activator="{ tooltipProps }">
                    <span v-bind="tooltipProps">
                        <v-btn
                            text="Auto-fill"
                            :prepend-icon="mdiRobot"
                            variant="tonal"
                            v-bind="activatorProps"
                            :loading="dialogOpen"
                            :disabled="url === ''"
                        />
                    </span>
                </template>
                <span>Please enter a URL to use the auto-fill feature</span>
            </v-tooltip>
        </template>
        <template v-slot:default>
            <v-card>
                <v-card-text>
                    <v-dialog>
                        <v-card>
                            <v-card-title>Select Image</v-card-title>
                            <v-card-text>
                                <ImageSelector />
                            </v-card-text>
                            <v-card-actions>
                                <v-spacer />
                                <v-btn
                                    text
                                    @click="$emit('close')"
                                >
                                    Close
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                    <div class="autofill-timeline d-flex">
                        <v-timeline
                            direction="vertical"
                            side="end"
                            truncate-line="both"
                            align="start"
                        >
                            <ExpanderStep
                                :step="1"
                                :current-step="1"
                            >
                                <template #title>
                                    Autofill
                                </template>
                                <template #content>
                                    <LoadingAutofill
                                        :currency="currency"
                                        :itemID="itemID"
                                        :url="url"
                                    />
                                </template>
                            </ExpanderStep>
                        </v-timeline>
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
                </v-card-text>
            </v-card>
        </template>
    </v-dialog>
</template>

<script setup>
import { defineEmits, defineProps, markRaw, nextTick, onMounted, shallowRef, watch } from "vue";
import ExpanderStep from "@/components/ExpanderStep.vue";
import ImageSelector from "@/components/dialogs/ImageSelector.vue";
import LoadingAutofill from "./LoadingAutofill.vue";
import { mdiRobot } from "@mdi/js";

import { useDialogs } from "@/stores/dialogs";

const dialogs = useDialogs();
const dialogOpen = shallowRef(false);

defineProps({
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

watch(dialogOpen, () => {
    if (dialogOpen.value) {
    }
});
</script>
