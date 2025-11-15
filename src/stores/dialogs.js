import { defineStore } from "pinia";
import { v7 as uuidv7 } from "uuid";

export const useDialogs = defineStore("dialogs", {
    state: () => ({
        dialogs: []
    }),
    actions: {
        close(id, actionText, data = null) {
            let dialog = this.dialogs.find((d) => d.id === id);
            if (dialog.async) {
                dialog.resolvePromise({ action: actionText, data });
            }

            dialog.open = false;

            setTimeout(() => {
                delete this.dialogs[id];
            }, 500);
        },
        create(dialog) {
            console.log("Creating dialog:", dialog);
            let resolvePromise;
            let promise;

            if (dialog.async) {
                promise = new Promise((resolve) => {
                    resolvePromise = resolve;
                });
            }

            this.dialogs.push({ open: true, resolvePromise, id: uuidv7(), ...dialog });

            return dialog.async ? promise : null;
        }
    }
});
