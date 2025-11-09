<template>
    <v-dialog
        v-for="(dialog, index) in dialogs.dialogs"
        :key="dialog.id"
        v-model="dialog.open"
        :max-width="dialog.maxWidth || ($vuetify.display.mobile ? '100%' : '500px')"
        :fullscreen="dialog.fullscreen !== undefined ? dialog.fullscreen : $vuetify.display.mobile ? true : false"
        :persistent="dialog.persistent"
        :scrim="dialog.opaque ? 'rgb(var(--v-theme-background))' : true"
        :opacity="dialog.opaque ? 1 : undefined"
    >
        <v-card :title="dialog.title">
            <v-card-text v-if="dialog.text">
                {{ dialog.text }}
            </v-card-text>
            <component
                :is="dialog.component"
                v-bind="{ ...dialog.props, errorMessage: dialog.error || dialog.props?.errorMessage || '' }"
                v-if="dialog.component"
                @close="dialogs.close(index)"
            />
            <v-card-actions v-if="dialog.actions">
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

const actionHandler = (action, index) => {
    if (typeof action.action === "function") {
        action.action();
    }

    if (action.action === "close" || action.closeAfterAction) {
        dialogs.close(index, action.text);
    }
};

</script>