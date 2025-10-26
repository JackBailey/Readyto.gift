import { defineStore } from "pinia";

export const useDialogs = defineStore("dialogs", {
    state: () => ({
        dialogs: []
    }),
    actions: {
        close(index, actionText) {
            if (this.dialogs[index].async) {
                this.dialogs[index].resolvePromise(actionText);
            }
            this.dialogs[index].open = false;

            setTimeout(() => {
                this.dialogs.splice(index, 1);
            }, 500);
        },
        create(dialog) {
            let resolvePromise;
            let promise;

            if (dialog.async) {
                promise = new Promise((resolve) => {
                    resolvePromise = resolve;
                });
            };

            this.dialogs.push({ open: true, resolvePromise, ...dialog });

            return dialog.async ? promise : null;
        }
        
    }
});
