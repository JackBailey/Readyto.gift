<template>
    <v-dialog
        max-width="500px"
        v-model="dialogOpen"
    >
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                v-bind="activatorProps"
                :prepend-icon="item.fulfillment ? mdiGiftOff : mdiGift"
                :variant="variant"
            >
                {{ item.fulfillment ? item.fulfillment.name : "Fulfill" }}
            </v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card
                title="Fulfill Item"
                v-if="!item.fulfillment"
            >
                <v-card-text>
                    <v-text-field
                        label="Your name"
                        v-model="name"
                        autofocus
                        @keyup.enter="fulfillItem"
                        maxlength="32"
                        counter
                    />

                    <b>Thank you!</b>

                    This will only be shown to other viewers of this list to help prevent
                    duplicates.<br />
                    It will
                    <span
                        class="text-error"
                        style="font-weight: bold; text-decoration: underline"
                    >not be shown</span>
                    to the owner of this list.

                    <v-alert
                        v-if="alert"
                        type="error"
                        border="start"
                        elevation="2"
                        :icon="mdiAlert"
                        :title="alert.title"
                        :text="alert.text"
                        class="mt-4"
                    />
                </v-card-text>
                <v-card-actions>
                    <v-btn
                        text="Cancel"
                        @click="isActive.value = false"
                    />
                    <v-btn
                        color="primary"
                        text="Fulfill"
                        @click="fulfillItem"
                        variant="elevated"
                        :loading="loading"
                    />
                </v-card-actions>
            </v-card>
            <v-card
                title="Unfulfill Item"
                v-else
            >
                <v-card-text>
                    Are you sure you want to do this? It can be undone at any time

                    <v-alert
                        v-if="alert"
                        type="error"
                        border="start"
                        elevation="2"
                        :icon="mdiAlert"
                        :title="alert.title"
                        :text="alert.text"
                        class="mt-4"
                    />
                </v-card-text>
                <v-card-actions>
                    <v-btn
                        text="Cancel"
                        @click="isActive.value = false"
                    />
                    <v-btn
                        color="primary"
                        text="Unfulfill"
                        @click="unfulfillItem"
                        variant="elevated"
                        :loading="loading"
                    />
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script>
import { AppwriteException, ID } from "appwrite";
import { mdiAlert, mdiGift, mdiGiftOff } from "@mdi/js";
import { databases } from "@/appwrite";
import { useAuthStore } from "@/stores/auth";

export default {
    title: "ListDialog",
    props: {
        item: {
            type: Object,
            default: () => ({})
        },
        variant: {
            type: String,
            default: "elevated"
        }
    },
    data() {
        return {
            alert: false,
            auth: useAuthStore(),
            dialogOpen: false,
            loading: false,
            mdiAlert,
            mdiGift,
            mdiGiftOff,
            name: ""
        };
    },
    methods: {
        async fulfillItem() {
            this.loading = true;
            this.alert = false;
            let result;
            try {
                result = await databases.createDocument(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_FULFILLMENT_COLLECTION,
                    ID.unique(),
                    {
                        item: this.item.$id,
                        name: this.name !== "" ? this.name : null
                    }
                );
            } catch (e) {
                if (e instanceof AppwriteException) {
                    this.alert = {
                        text: e.message,
                        title: "Error"
                    };
                } else {
                    this.alert = {
                        text: "An unknown error occurred.",
                        title: "Error"
                    };
                }
                this.loading = false;
                return;
            }

            this.$emit("fulfillItem", result);

            this.dialogOpen = false;
            this.loading = false;
        },
        async unfulfillItem() {
            this.loading = true;
            this.alert = false;
            try {
                await databases.deleteDocument(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_FULFILLMENT_COLLECTION,
                    this.item.fulfillment.$id
                );
            } catch (e) {
                if (e instanceof AppwriteException) {
                    this.alert = {
                        text: e.message,
                        title: "Error"
                    };
                } else {
                    this.alert = {
                        text: "An unknown error occurred.",
                        title: "Error"
                    };
                }
                this.loading = false;
                return;
            }

            this.$emit("unfulfillItem");

            this.dialogOpen = false;
            this.loading = false;
        }
    },
    mounted() {
        if (this.auth.user && this.auth.user.name) {
            this.name = this.auth.user.name.split(" ")[0];
        }
    }
};
</script>
