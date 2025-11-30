import { defineStore } from "pinia";

export const useUserLists = defineStore("userLists",{
    state: () => ({
        listCount: {
            public: 0,
            private: 0
        }
    }),
    actions: {
        setCount({ public: publicCount, private: privateCount }) {
            this.listCount.public = publicCount;
            this.listCount.private = privateCount;
        },
        adjustCount(isPrivate, delta) {
            if (isPrivate) {
                this.listCount.private += delta;
            } else {
                this.listCount.public += delta;
            }
        }
    }
});
