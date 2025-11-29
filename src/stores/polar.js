import { defineStore } from "pinia";
import { functions } from "@/appwrite";

export const usePolarStore = defineStore("polar", {
    state: () => ({
        hasFreeSubscription: null,
        hasProSubscription: null,
        meters: {
            publicLists: null
        }
    }),
    actions: {
        async init() {
            const polarSession = await functions.createExecution({
                functionId: "690fc8f4002cff45eddc",
                async: false
            });

            if (polarSession.status === "completed") {
                const responseData = JSON.parse(polarSession.responseBody);
                this.hasFreeSubscription = responseData.hasFreeSubscription;
                this.hasProSubscription = responseData.hasProSubscription;
                this.meters.publicLists = responseData.publicListMeter;
            } else {
                console.error("Failed to retrieve Polar session");
            }
        },
        async getProCheckout() {
            const checkout = await functions.createExecution({
                functionId: "690fc8f4002cff45eddd",
                async: false
            });

            if (checkout.status === "completed") {
                console.log("Polar Pro checkout URL:", checkout.responseBody);
                return JSON.parse(checkout.responseBody).checkoutUrl;
            }
            
            throw new Error("Failed to retrieve Polar Pro checkout URL");
        }
    }
});
