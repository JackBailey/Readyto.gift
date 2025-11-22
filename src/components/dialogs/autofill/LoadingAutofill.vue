<template>
    <div>
        <v-timeline
            :direction="$vuetify.display.mobile ? 'vertical' : 'horizontal'"
            truncate-line="both"
            side="end"
            align="center"
        >
            <v-timeline-item
                v-for="(step, index) in timelineSteps"
                :key="index"
                :dot-color="
                    index > currentStep ? 'transparent' : 'primary'
                "
                :fill-dot="index <= currentStep"
                :data-completed="index < currentStep"
                :data-active="index === currentStep"
            >
                <template #icon>
                    <v-icon
                        :icon="step.icon"
                        color="primary"
                        v-if="index > currentStep"
                    />
                    <v-icon
                        :icon="mdiLoading"
                        color="white"
                        class="v-icon--spin"
                        v-else-if="index === currentStep"
                    />
                    <v-icon
                        :icon="step.completeIcon || step.icon"
                        color="white"
                        v-else
                    />
                </template>
                <div class="text-center">
                    <div class="text-h6">{{ step.label }}</div>
                </div>
            </v-timeline-item>
        </v-timeline>
    </div>
</template>


<script setup>
import { client, databases, functions } from "@/appwrite";
import { computed, defineProps, onMounted, onUnmounted, shallowRef } from "vue";
import { mdiCheck, mdiFileDocument, mdiFileDocumentCheck, mdiImage, mdiImageCheck, mdiLoading, mdiWeb, mdiWebCheck } from "@mdi/js";
import { useDialogs } from "@/stores/dialogs";

const dialogs = useDialogs();

const totalAttempts = shallowRef(0);
const currentAttempt = shallowRef(0);
const attemptStatus = shallowRef("");
const outputData = shallowRef(null);
const status = shallowRef("");

const autofillSubscription = shallowRef(null);

const currentStep = computed(() => {
    if (attemptStatus.value) {
        switch (attemptStatus.value) {
        case "starting":
            return 0;
        case "processing":
            return 1;
        case "finding-best-image":
        case "processing-best-image":
            return 2;
        case "completed":
            return 4;
        }
    }
    return 0;
});

const timelineSteps = [
    {
        completeIcon: mdiWebCheck,
        icon: mdiWeb,
        label: "Fetching page data"
    },
    {
        completeIcon: mdiFileDocumentCheck,
        icon: mdiFileDocument,
        label: "Processing page data"
    },
    {
        completeIcon: mdiImageCheck,
        icon: mdiImage,
        label: "Finding images"
    },
    {
        icon: mdiCheck,
        label: "Finishing up"
    }
];

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

let pollingFallback = null;

const emit = defineEmits(["cancel", "complete", "attempt-update", "attempt-max-update"]);

const autofill = async () => {
    try {
        pollingFallback = null;
        const result = await functions.createExecution(
            "get-autofill-data",
            JSON.stringify({
                currency: props.currency,
                itemID: props.itemID,
                url: props.url
            }),
            true
        );

        const executionID = result.$id;

        if (result.status !== "failed") {
            // Fall back to manual polling incase socket fails, or completes before socket connects
            pollingFallback = setInterval(async () => {
                try {
                    const pollResult = await databases.getDocument(
                        import.meta.env.VITE_APPWRITE_DB,
                        "autofills",
                        executionID
                    );

                    switch (pollResult.status) {
                    case "failed":
                        clearInterval(pollingFallback);
                        emit("cancel");
                        dialogs.create({
                            actions: [
                                {
                                    action: "close",
                                    color: "primary",
                                    text: "OK"
                                }
                            ],
                            fullscreen: false,
                            text: "All autofill attempts have failed. Please try again later or fill in the details manually.",
                            title: "Autofill Error",
                            type: "error"
                        });
                        break;
                    case "completed":
                        clearInterval(pollingFallback);
                        setTimeout(() => {
                            emit("complete", pollResult.outputData);
                        }, 500);
                        break;
                    }
                } catch (err) {
                    if (err.message === "AppwriteException: Document with the requested ID could not be found.") throw err;
                }
            }, 5000);

            autofillSubscription.value = client.subscribe([
                "executions",
                `databases.wishlist.collections.autofills.documents.${executionID}` // try without, then with just
            ], (response) => {
                clearInterval(pollingFallback); // Clear the recheck timeout on receiving an update
                if (response.channels.includes("rows")) {

                    currentAttempt.value = response.payload.attempt;
                    totalAttempts.value = response.payload.totalAttempts;
                    attemptStatus.value = response.payload.attemptStatus;
                    outputData.value = response.payload.outputData;
                    status.value = response.payload.status;

                    emit("attempt-update", currentAttempt.value);
                    emit("attempt-max-update", totalAttempts.value);

                    if (status.value === "failed") {
                        emit("cancel");
                        dialogs.create({
                            actions: [
                                {
                                    action: "close",
                                    color: "primary",
                                    text: "OK"
                                }
                            ],
                            fullscreen: false,
                            text: "All autofill attempts have failed. Please try again later or fill in the details manually.",
                            title: "Autofill Error",
                            type: "error"
                        });
                    }

                    if (status.value === "completed") {
                        setTimeout(() => {
                            emit("complete", outputData.value);
                        }, 500);
                    }
                } else if (response.channels.includes("executions")) {
                    if (response.payload.status === "completed") {
                        // Just in case the DB update is delayed
                        setTimeout(() => {
                            emit("complete", outputData.value);
                        }, 500);
                    } else {
                        if (response.payload.status === "failed") {
                            emit("cancel");
                            dialogs.create({
                                actions: [
                                    {
                                        action: "close",
                                        color: "primary",
                                        text: "OK"
                                    }
                                ],
                                fullscreen: false,
                                text: response.payload.errors,
                                title: "Autofill Error",
                                type: "error"
                            });
                        }
                    }
                }
            });
        } else {
            throw new Error("Autofill function execution failed to start.");
        }
    } catch (error) {
        console.error({
            error
        });
        emit("cancel");
        dialogs.create({
            actions: [
                {
                    action: "close",
                    color: "primary",
                    text: "OK"
                }
            ],
            fullscreen: false,
            text: `An error occurred during autofill: ${error.message || error}`,
            title: "Autofill Error",
            type: "error"
        });
    }
};

onMounted(() => {
    autofill();
});

onUnmounted(() => {
    if (autofillSubscription.value) {
        autofillSubscription.value(); // Unsubscribe from the subscription
    }
    if (pollingFallback) {
        clearInterval(pollingFallback);
    }
});

</script>


<style lang="scss" scoped>
.v-icon--spin {
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

:deep(.v-timeline) {
    .v-timeline-item[data-completed="true"] .v-timeline-divider__after,
    .v-timeline-item[data-completed="true"] .v-timeline-divider__before,
    .v-timeline-item[data-active="true"] .v-timeline-divider__before {
        background-color: rgb(var(--v-theme-primary)) !important;
    }
}

</style>
