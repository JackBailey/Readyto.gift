<template>
    <v-dialog
        :max-width="$vuetify.display.mobile ? '100%' : '500px'"
        v-model="dialogOpen"
        scrollable 
    >
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                v-bind="activatorProps"
                :icon="mdiFileDocumentArrowRight"
                :variant="variant"
            />
        </template>

        <template v-slot:default="{ isActive }">
            <template v-if="!success">
                <v-card title="Move Item">
                    <template v-slot:title>
                        Move Item
                        <v-card-text class="pa-0 pt-2">
                            What list would you like to move this item to?
                        </v-card-text>
                    </template>
                    <v-card-text>
                        
                        <div
                            class="lists mt-5 loader"
                            v-if="loading"
                        >
                            <v-skeleton-loader
                                :height="50"
                                class="mb-4 pa-4"
                                v-for="i in 5"
                                :key="i"
                            />
                        </div>
                        <div
                            class="lists mt-5"
                            v-else
                        >
                            <ListCard
                                v-for="list in lists"
                                :key="list.$id"
                                :list="list"
                                :selected="selectedList === list.$id"
                                @click="selectList(list)"
                                type="selectable"
                            />
                        </div>
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
                            text="Move"
                            @click="moveToList"
                            variant="elevated"
                            :disabled="selectedList === null"
                            :loading="loadingMove"
                        />
                    </v-card-actions>
                </v-card>
            </template>
            <template v-else>
                <v-card title="Item Moved">
                    <template v-slot:title>
                        Item Moved
                    </template>
                    <v-card-text>
                        The item has been moved to the selected list.
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            @click="goToList"
                            text="View List"
                        />
                        <v-btn
                            text="Close"
                            color="primary"
                            variant="elevated"
                            @click="closeAfterSuccess"
                        />
                    </v-card-actions>
                </v-card>
            </template>
        </template>
    </v-dialog>
</template>

<script>
import { AppwriteException, Query } from "appwrite";
import { mdiAlert, mdiFileDocumentArrowRight } from "@mdi/js";
import { databases } from "@/appwrite";
import ListCard from "../ListCard.vue";
import { useAuthStore } from "@/stores/auth";
export default {
    title: "ListDialog",
    components: {
        ListCard
    },
    props: {
        item: {
            type: Object,
            default: () => ({})
        },
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
            auth: useAuthStore(),
            dialogOpen: false,
            listId: null,
            lists: [],
            loading: false,
            loadingMove: false,
            mdiAlert,
            mdiFileDocumentArrowRight,
            selectedList: null,
            success: false
        };
    },
    watch: {
        dialogOpen(value) {
            if (value) {
                this.getLists();
            }
        }
    },
    methods: {
        closeAfterSuccess() {
            this.dialogOpen = false;
            this.$emit("removeItem", this.item.$id);
        },
        async getLists() {
            this.loading = true;
            try {
                const response = await databases.listDocuments(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_LIST_COLLECTION,
                    [
                        Query.equal("author", this.auth.user.$id),
                        Query.orderDesc("$updatedAt"),
                        Query.notEqual("$id", this.list.$id)
                    ]
                );

                if (response.total === 0) {
                    this.alert = {
                        text: "You have no other lists to move this item to.",
                        title: "No lists"
                    };
                    this.loading = false;
                    return;
                }

                this.lists = response.documents;

                this.loading = false;
            } catch (e) {
                console.error(e);
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
        },
        async moveToList() {
            this.loadingMove = true;
            try {
                await databases.updateDocument(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_ITEM_COLLECTION,
                    this.item.$id,
                    {
                        list: this.selectedList
                    }
                );

                this.loadingMove = false;
                this.success = true;
            } catch (error) {
                console.error(error);
                if (error instanceof AppwriteException) {
                    this.alert = {
                        text: error.message,
                        title: "Error"
                    };
                } else {
                    this.alert = {
                        text: "An unknown error occurred.",
                        title: "Error"
                    };
                }
                this.loadingMove = false;
                return;
            }
        },
        goToList() {
            this.$router.push(`/list/${this.selectedList}`);
            this.$emit("loadList", this.selectedList);
            this.dialogOpen = false;
        },
        selectList(list) {
            if (this.selectedList === list.$id) {
                this.selectedList = null;
                return;
            }
            this.selectedList = list.$id;
        }
    }
};
</script>
