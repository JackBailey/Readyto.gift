<template>
    <v-dialog
        v-model="dialogOpen"
    >
        <template v-slot:activator="{ props: activatorProps }">
            <v-tooltip :open-on-hover="url === ''">
                <template v-slot:activator="{ tooltipProps }">
                    <span v-bind="tooltipProps">
                        <v-btn
                            text="Auto-fill"
                            :prepend-icon="mdiRobot"
                            variant="tonal"
                            v-bind="activatorProps"
                            :disabled="url === ''"
                        />
                    </span>
                </template>
                <span>Please enter a URL to use the auto-fill feature</span>
            </v-tooltip>
        </template>
        <template v-slot:default>
            <v-card
                elevation="0"
            >
                <div
                    class="d-flex flex-column align-center justify-center"
                >
                    <v-stepper-vertical
                        v-model="currentStep"
                        color="primary"
                        height="100%"
                    >
                        <template v-slot:default="{ step }">
                            <v-stepper-vertical-item
                                :complete="step > 1"
                                value="1"
                                :icon="mdiRobot"
                                color="primary"
                                elevation="0"
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
                                elevation="0"
                            >
                                <template #title>
                                    <h3>
                                        Image selection
                                    </h3>
                                </template>
                                Please select the image you would like to use for this item.
                                <ImageSelector
                                    :images="images"
                                    @select-image="selectImage"
                                />
                                <template v-slot:next></template>
                                <template v-slot:prev></template>
                            </v-stepper-vertical-item>
                        </template>
                    </v-stepper-vertical>
                </div>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        text
                        @click="dialogOpen = false"
                        color="error"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        :disabled="currentStep < 2"
                        @click="done"
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
import { mdiRobot, mdiViewGallery } from "@mdi/js";
import ImageSelector from "@/components/dialogs/ImageSelector.vue";
import LoadingAutofill from "./LoadingAutofill.vue";

const dialogOpen = shallowRef(false);
const currentStep = shallowRef(1);
const autofillMaxAttempts = shallowRef(0);
const currentAutofillAttempt = shallowRef(0);
const images = shallowRef([]);
const currentImageIndex = shallowRef(0);

const autofillData = shallowRef({});

const emit = defineEmits(["autofill-complete"]);

const props = defineProps({
    automaticStart: {
        default: false,
        type: Boolean
    },
    currency: {
        type: String
    },
    itemID: {
        type: String
    },
    url: {
        type: String
    }
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
    const autofillResponse = JSON.parse(data);
    autofillData.value.title = autofillResponse.title;
    autofillData.value.url = autofillResponse.url;
    autofillData.value.price = autofillResponse.price;

    const bestImage = autofillResponse.bestImage;

    images.value = autofillResponse.images.map((image) => {
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

    if (images.value.length > 1) {
        currentStep.value = 2;
    } else {
        autofillData.value.image = images.value.length ? images.value[0].src : null;
        dialogOpen.value = false;
        emit("autofill-complete", autofillData.value);
    }

};

const selectImage = (index) => {
    currentImageIndex.value = index;
};

const done = () => {
    dialogOpen.value = false;
    autofillData.value.image = images.value[currentImageIndex.value].src;
    emit("autofill-complete", autofillData.value);
};
</script>
