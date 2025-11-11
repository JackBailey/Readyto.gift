<template>
    <v-dialog
        :max-width="$vuetify.display.mobile ? '100%' : '90%'"
        :fullscreen="$vuetify.display.mobile ? true : false"
        v-model="dialogOpen"
    >
        <template v-slot:activator="{ props: activatorProps }">
            <v-list-item v-bind="activatorProps" :prepend-icon="mdiPencil" title="Edit List" link />
        </template>

        <template v-slot:default="{ isActive }">
            <v-card title="Edit List">
                <v-card-text class="d-flex flex-column ga-4">
                    <ListFields v-model:list="editedList" :previousValues="previousValues" />
                    <v-alert
                        v-if="alert"
                        type="error"
                        dismissible
                        border="start"
                        class="mt-4"
                        elevation="2"
                        :icon="mdiAlert"
                        :title="alert.title"
                        :text="alert.text"
                    />
                </v-card-text>
                <v-card-actions>
                    <v-btn text="Cancel" @click="isActive.value = false" />
                    <v-btn
                        color="primary"
                        text="Save"
                        @click="updateList"
                        variant="elevated"
                        :loading="loading"
                    />
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script>
import { AppwriteException, Query } from "appwrite";
import { mdiAlert, mdiPencil } from "@mdi/js";
import { databases } from "@/appwrite";
import ListFields from "@/components/dialogs/fields/ListFields.vue";
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
    components: {
        ListFields
    },
    data() {
        return {
            alert: false,
            dialogOpen: false,
            editedList: {},
            listId: null,
            loading: false,
            mdiAlert,
            mdiPencil,
            previousValues: {}
        };
    },
    watch: {
        dialogOpen(open) {
            if (open === true) {
                this.editedList = {
                    currency: this.list.currency,
                    description: this.list.description,
                    itemCount: this.list.items.length,
                    shortUrl: this.list.shortUrl,
                    title: this.list.title
                };
                this.previousValues = { ...this.editedList };
                this.listId = this.list.$id;
            } else {
                this.$emit("dialogClosed");
            }
        }
    },
    methods: {
        async updateList() {
            this.alert = false;
            this.loading = true;
            if (this.editedList.shortUrl) {
                try {
                    const conflictingDocuments = await databases.listDocuments(
                        import.meta.env.VITE_APPWRITE_DB,
                        import.meta.env.VITE_APPWRITE_LIST_COLLECTION,
                        [
                            Query.equal("shortUrl", this.editedList.shortUrl),
                            Query.notEqual("$id", this.listId)
                        ]
                    );

                    if (conflictingDocuments.total !== 0) {
                        this.alert = {
                            text: "Short URL already in use.",
                            title: "Error"
                        };
                        this.loading = false;
                        return;
                    }
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

            let listResponse;

            try {
                listResponse = await databases.updateDocument(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_LIST_COLLECTION,
                    this.listId,
                    this.editedList
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

            this.$emit("updateList", {
                list: listResponse
            });

            this.loading = false;
            this.dialogOpen = false;
        }
    }
};
</script>
