import { defineStore } from "pinia";

export const useDialogs = defineStore("dialogs", {
    state: () => ({
        dialogs: []
    }),
    actions: {
        close(index, actionText, data = null) {
            if (this.dialogs[index].async) {
                this.dialogs[index].resolvePromise({ action: actionText, data });
            }
            this.dialogs[index].open = false;

            setTimeout(() => {
                this.dialogs.splice(index, 1);
            }, 500);
        },
        resolve(index, data) {
            if (this.dialogs[index].async) {
                this.dialogs[index].resolvePromise({ data });
                this.dialogs[index].open = false;

                setTimeout(() => {
                    this.dialogs.splice(index, 1);
                }, 500);
            }
        },
        create(dialog) {
            console.log("Creating dialog:", dialog);
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
