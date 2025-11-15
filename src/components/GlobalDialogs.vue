<template>
    <v-dialog
        v-for="(dialog, index) in dialogs.dialogs"
        :key="dialog.id"
        v-model="dialog.open"
        :max-width="dialog.maxWidth || (
            $vuetify.display.mobile ? '100%' : '500px')"
        :fullscreen="dialog.fullscreen !== undefined ? dialog.fullscreen : $vuetify.display.mobile ? true : false"
        :persistent="dialog.persistent"
        :scrim="dialog.opaque ? 'rgb(var(--v-theme-background))' : true"
        :opacity="dialog.opaque ? 1 : undefined"
        width="max-content"
    >
        <v-card :title="dialog.title">
            <v-card-text v-if="dialog.text">
                {{ dialog.text }}
            </v-card-text>
            <component
                :is="dialog.component"
                v-bind="dialog.props"
                v-if="dialog.component"
                v-on="dialogEmits[index]"
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
import { computed } from "vue";
import { useDialogs } from "@/stores/dialogs";

const dialogs = useDialogs();

const dialogEmits = computed(() => {
    return dialogs.dialogs.map((dialog, index) => {
        if (!dialog.emits) return {};

        const emits = {};
        for (const emit of dialog.emits) {
            emits[emit] = () => {
                dialogs.close(index, emit);
            };
        }

        return emits;
    });
});

const actionHandler = (action, index) => {
    if (typeof action.action === "function") {
        action.action();
    }

    if (action.action === "close" || action.closeAfterAction) {
        dialogs.close(index, action.text);
    }
};

</script>
