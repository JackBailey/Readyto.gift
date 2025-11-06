<template>
    <v-dialog
        v-for="(dialog, index) in dialogs.dialogs"
        :key="dialog.id"
        v-model="dialog.open"
        :max-width="dialog.maxWidth || $vuetify.display.mobile ? '100%' : '500px'"
        :fullscreen="dialog.fullscreen !== undefined ? dialog.fullscreen : $vuetify.display.mobile ? true : false"
        :persistent="dialog.persistent"
        :scrim="dialog.opaque ? 'rgb(var(--v-theme-background))' : true"
        :opacity="dialog.opaque ? 1 : undefined"
        transition="ease-in-out 10000ms"
    >
        <v-card :title="dialog.title">
            <v-card-text>
                {{ dialog.text }}
            </v-card-text>
            <component
                :is="dialog.component"
                v-bind="{ ...dialog.props, errorMessage: dialog.error || dialog.props?.errorMessage || '' }"
                v-if="dialog.component"
                v-on="{ ...createEventHandlers(dialog.events, index), clearError: () => setDialogError(index, '') }"
            />
            <v-card-actions>
                <v-btn
                    v-for="action in dialog.actions"
                    :key="action.text"
                    @click="actionHandler(action, index)"
                    :color="action.color || 'primary'"
                    :variant="action.variant || 'text'"
                    :to="action.to"
                >
                    {{ action.text }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>


<script setup>
import { useDialogs } from "@/stores/dialogs";

const dialogs = useDialogs();

const setDialogError = (dialogIndex, error) => {
    if (dialogs.dialogs[dialogIndex]) {
        dialogs.dialogs[dialogIndex].error = error;
    }
};

const createEventHandlers = (events, dialogIndex) => {
    if (!events) return {};
    
    return Object.fromEntries(
        Object.entries(events).map(([eventName, handler]) => [
            eventName,
            async (...args) => {
                try {
                    const result = await handler(...args);
                    
                    // Auto-resolve dialog if handler returns data (not null, undefined, or false)
                    if (result !== undefined && result !== null && result !== false) {
                        dialogs.resolve(dialogIndex, result);
                    }
                    
                    return result;
                } catch (error) {
                    // Set error on the dialog instead of closing it
                    setDialogError(dialogIndex, error.message || "An error occurred");
                    throw error;
                }
            }
        ])
    );
};

const actionHandler = (action, index) => {
    if (typeof action.action === "function") {
        action.action();
    }

    if (action.action === "close" || action.closeAfterAction) {
        dialogs.close(index, action.text);
    }
};

</script>