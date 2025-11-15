<template>
    <v-dialog
        :max-width="$vuetify.display.mobile ? '100%' : '500px'"
        :fullscreen="$vuetify.display.mobile ? true : false"
        v-model="dialogOpen"
    >
        <template v-slot:activator="{ props: activatorProps }">
            <v-list-item
                v-bind="activatorProps"
                :prepend-icon="mdiDelete"
                title="Delete List"
                link
                base-color="error"
            />
        </template>

        <template v-slot:default="{ isActive }">
            <v-card title="Delete List">
                <v-card-text>
                    Are you sure you want to delete this list?
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
                    <v-btn text="Cancel" @click="isActive.value = false" />
                    <v-btn
                        color="error"
                        text="Delete"
                        @click="deleteList"
                        variant="elevated"
                        :loading="loading"
                    />
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script>
import { databases, storage } from "@/appwrite";
import { mdiAlert, mdiDelete } from "@mdi/js";
import { AppwriteException } from "appwrite";
export default {
    title: "ListDialog",
    props: {
        list: {
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
            dialogOpen: false,
            listId: null,
            loading: false,
            mdiAlert,
            mdiDelete
        };
    },
    watch: {
        dialogOpen(open) {
            if (open !== true) {
                this.$emit("dialogClosed");
            }
        }
    },
    methods: {
        async deleteList() {
            this.loading = true;
            this.alert = false;
            try {
                await Promise.all(
                    this.list.items.map(async (item) => {
                        if (item.imageID) {
                            await storage.deleteFile(
                                import.meta.env.VITE_APPWRITE_IMAGE_BUCKET,
                                item.imageID
                            );
                        }
                    })
                );

                await databases.deleteDocument(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_LIST_COLLECTION,
                    this.list.$id
                );

                this.$router.push("/dash/lists");

                this.dialogOpen = false;
                this.loading = false;
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
        }
    }
};
</script>
