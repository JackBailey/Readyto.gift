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
            <v-stepper-vertical
                v-model="currentStep"
                color="primary"
            >
                <template v-slot:default="{ step }">
                    <v-stepper-vertical-item
                        :complete="step > 1"
                        value="1"
                        :icon="mdiRobot"
                        color="primary"
                    >
                        <template #title>
                            <h3>
                                Auto-Fill
                                <v-chip
                                    v-if="step === 1 && autofillMaxAttempts > 0"
                                    rounded="pill"
                                    size="small"
                                    class="ml-2"
                                    color="primary"
                                >
                                    Attempt {{ currentAutofillAttempt }} of {{ autofillMaxAttempts }}
                                </v-chip>
                            </h3>
                        </template>
                        <LoadingAutofill
                            :currency="currency"
                            :itemID="itemID"
                            :url="url"
                            @finished="currentStep = 2"
                            @attempt-update="currentAutofillAttempt = $event"
                            @attempt-max-update="autofillMaxAttempts = $event"
                            @cancel="dialogOpen = false"
                            @complete="autofillComplete"
                        />
                        <template v-slot:next>
                        </template>
                        <template v-slot:prev></template>
                    </v-stepper-vertical-item>
                    <v-stepper-vertical-item
                        :complete="step > 2"
                        title="Image selection"
                        value="2"
                        :icon="mdiViewGallery"
                    >
                        <template #title>
                            <h3>
                                Image selection
                            </h3>
                        </template>
                        <ImageSelector :images="images"/>
                        <template v-slot:next>
                            <v-btn
                                color="primary"
                            >
                                Done
                            </v-btn>
                        </template>

                        <template v-slot:prev="{ prev }">
                        </template>
                    </v-stepper-vertical-item>
                </template>
            </v-stepper-vertical>
        </template>
    </v-dialog>
</template>

<script setup>
import { defineEmits, defineProps, markRaw, nextTick, onMounted, shallowRef, watch } from "vue";
import ExpanderStep from "@/components/ExpanderStep.vue";
import ImageSelector from "@/components/dialogs/ImageSelector.vue";
import LoadingAutofill from "./LoadingAutofill.vue";
import { mdiRobot, mdiViewGallery } from "@mdi/js";

import { useDialogs } from "@/stores/dialogs";

const dialogs = useDialogs();
const dialogOpen = shallowRef(false);
const currentStep = shallowRef(1);
const autofillMaxAttempts = shallowRef(0);
const currentAutofillAttempt = shallowRef(0);
const images = shallowRef([]);


const props = defineProps({
    automaticStart: {
        default: false,
        required: false,
        type: Boolean
    },
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

console.log({
    automaticStart: props.automaticStart
});

if (props.automaticStart) {
    dialogOpen.value = true;
}

watch(dialogOpen, () => {
    if (dialogOpen.value) {
        currentStep.value = 1;
        autofillMaxAttempts.value = 0;
        currentAutofillAttempt.value = 0;
    }
});

const autofillComplete = (data) => {
    currentStep.value = 2;
    const autofillData = JSON.parse(data);
    console.log({ autofillData });

    const bestImage = autofillData.bestImage;

    images.value = autofillData.images.map((image) => {
        image.best = image.src === bestImage.src;
        return image;
    }).sort((a, b) => {
        if (a.best && !b.best) {
            return -1;
        }
        if (!a.best && b.best) {
            return 1;
        }
        return 0;
    });
};
</script>
