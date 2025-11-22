<template>
    <v-dialog
        v-model="dialogOpen"
        :max-width="$vuetify.display.mobile ? '100%' : '90%'"
        :fullscreen="$vuetify.display.mobile ? true : false"
    >
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                v-bind="activatorProps"
                :append-icon="mdiPlus"
                base-color="primary"
                :variant="variant"
                v-if="!item"
            >
                Add{{ wishlistOwner ? "" : " Purchased" }} Item
            </v-btn>
            <v-btn
                v-bind="activatorProps"
                :icon="mdiPencil"
                base-color="primary"
                :variant="variant"
                v-else
            />
        </template>

        <template v-slot:default="{ isActive }">
            <v-card
                :title="
                    item
                        ? 'Edit' + (wishlistOwner ? '' : ' Purchased') + ' Item'
                        : 'Create' + (wishlistOwner ? '' : ' Purchased') + ' Item'
                "
            >
                <v-card-text>
                    <v-alert
                        v-if="!wishlistOwner && !item"
                        type="info"
                        elevation="2"
                        :icon="mdiAlert"
                        class="m-4 mb-8"
                        color="primary"
                    >
                        You are adding an item to someone else's wishlist. This item will be marked
                        as purchased on their list, but it will not be shown to the wishlist owner.
                        This should help prevent duplicate items.
                    </v-alert>
                    <ItemFields
                        v-model:item="modifiedItem"
                        :currency="currency"
                        :errors="errors"
                        @file-state="setFileState"
                        :uploading-file="uploadingFile"
                        :wishlistOwner="wishlistOwner"
                        :previousValues="previousValues"
                    />
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
                    <AutofillButton
                        :url="modifiedItem.url"
                        :currency="currency"
                        :itemID="itemID"
                        :automaticStart="!!quickCreateURL"
                        @autofill-complete="autofillComplete"
                    />
                    <v-btn
                        text="Cancel"
                        @click="isActive.value = false"
                    />
                    <v-btn
                        color="primary"
                        text="Save"
                        @click="editItem"
                        variant="elevated"
                        :loading="loading"
                        v-if="item"
                    />
                    <v-btn
                        color="primary"
                        text="Create"
                        @click="createItem"
                        variant="elevated"
                        :loading="loading"
                        v-else
                    />
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>
</template>

<script>
import { AppwriteException, ID } from "appwrite";
import { databases, storage } from "@/appwrite";
import { mdiAlert, mdiPencil, mdiPlus, mdiRobot } from "@mdi/js";
import AutofillButton from "@/components/dialogs/autofill/AutofillButton.vue";
import ItemFields from "@/components/dialogs/fields/ItemFields.vue";
import mime from "mime-types";
import { useAuthStore } from "@/stores/auth";
import { useDialogs } from "@/stores/dialogs";

export default {
    title: "ListDialog",
    props: {
        currency: {
            type: String,
            required: true
        },
        item: {
            type: Object
        },
        list: {
            type: Object,
            default: () => ({})
        },
        quickCreateURL: {
            type: String,
            default: ""
        },
        variant: {
            type: String,
            default: "elevated"
        },
        wishlistOwner: {
            type: Boolean,
            default: false
        }
    },
    components: {
        AutofillButton,
        ItemFields
    },
    data() {
        return {
            alert: false,
            auth: useAuthStore(),
            dialogOpen: false,
            dialogs: useDialogs(),
            errors: {},
            fileState: false,
            itemID: null,
            listId: null,
            loading: false,
            mdiAlert,
            mdiPencil,
            mdiPlus,
            mdiRobot,
            modifiedItem: {
                description: "",
                displayPrice: true,
                image: null,
                imageFile: null,
                imageID: null,
                price: "",
                priority: "none",
                title: "",
                url: ""
            },
            previousValues: {},
            uploadingFile: false
        };
    },
    watch: {
        async dialogOpen(open) {
            this.errors = {};
            if (open === true) {
                this.listId = this.list.$id;

                if (this.item) {
                    this.itemID = this.item.$id;
                    this.modifiedItem = {
                        description: this.item.description,
                        displayPrice: this.item.displayPrice,
                        image: this.item.image,
                        imageID: this.item.imageID,
                        price: this.item.price,
                        priority: this.item.priority,
                        title: this.item.title,
                        url: this.item.url
                    };

                    this.previousValues = { ...this.modifiedItem };

                    if (this.item.imageID) {
                        const file = await storage.getFile(
                            import.meta.env.VITE_APPWRITE_IMAGE_BUCKET,
                            this.item.imageID
                        );

                        this.modifiedItem.imageFile = new File(
                            ["a".repeat(file.sizeOriginal)],
                            file.name
                        );
                    }
                } else {
                    this.itemID = ID.unique();
                }
            }
        },
        quickCreateURL(newURL) {
            if (newURL) {
                this.dialogOpen = true;
                this.modifiedItem.url = newURL;
                this.itemID = ID.unique();

                this.$emit("unsetQuickCreateURL", "");
            }
        }
    },
    methods: {
        async setFileState(value) {
            this.fileState = value;
            if (value === "removed") {
                try {
                    await storage.deleteFile(
                        import.meta.env.VITE_APPWRITE_IMAGE_BUCKET,
                        this.modifiedItem.imageID
                    );
                } catch (e) {
                    console.error("Failed to delete file:", e);
                }
                this.modifiedItem.imageFile = null;
                this.modifiedItem.imageID = null;
            }
        },
        async createItem() {
            let result;
            this.alert = false;
            this.loading = true;

            if (this.modifiedItem.title === "") {
                this.alert = {
                    text: "Title is required.",
                    title: "Error"
                };
                this.loading = false;
                return;
            }
            try {
                if (this.modifiedItem.image) {
                    await this.downloadRemoteImage(this.modifiedItem.image);
                }
                if (this.modifiedItem.imageFile && !this.modifiedItem.imageID) {
                    this.uploadingFile = true;
                    const fileUpload = await storage.createFile(
                        import.meta.env.VITE_APPWRITE_IMAGE_BUCKET,
                        ID.unique(),
                        this.modifiedItem.imageFile
                    );

                    this.uploadingFile = false;
                    this.modifiedItem.imageID = fileUpload.$id;
                    this.modifiedItem.image = "";
                }

                result = await databases.createDocument(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_ITEM_COLLECTION,
                    this.itemID,
                    {
                        communityList: this.wishlistOwner ? null : this.listId,
                        contributorId: this.wishlistOwner ? null : this.auth.user.$id,
                        contributorName: this.wishlistOwner ? null : this.auth.user.name,
                        description: this.modifiedItem.description || null,
                        displayPrice: this.modifiedItem.displayPrice,
                        image: this.modifiedItem.image || null,
                        imageID: this.modifiedItem.imageID || null,
                        list: this.wishlistOwner ? this.listId : null,
                        price: parseFloat(this.modifiedItem.price) || 0,
                        priority: this.modifiedItem.priority,
                        title: this.modifiedItem.title,
                        url: this.modifiedItem.url || null
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
                console.error(e);
                this.loading = false;
                return;
            }

            this.$emit("newItem", {
                item: result
            });

            try {
                if (this.wishlistOwner) {
                    const updatedList = await databases.updateDocument(
                        import.meta.env.VITE_APPWRITE_DB,
                        import.meta.env.VITE_APPWRITE_LIST_COLLECTION,
                        this.listId,
                        {
                            itemCount: this.list.items.length
                        }
                    );

                    this.$emit("updateList", {
                        list: updatedList
                    });
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

            this.modifiedItem = {
                description: "",
                displayPrice: true,
                image: "",
                imageID: null,
                price: 0,
                priority: "none",
                title: "",
                url: ""
            };

            this.dialogOpen = false;
            this.loading = false;
        },
        async editItem() {
            let result;
            this.alert = false;
            this.loading = true;

            try {
                // Upload hotlinked image if present (manually added)
                if (this.modifiedItem.image) {
                    await this.downloadRemoteImage(this.modifiedItem.image);
                }

                if (["removed", "replaced"].includes(this.fileState)) {
                    try {
                        if (this.modifiedItem.imageID) {
                            await storage.deleteFile(
                                import.meta.env.VITE_APPWRITE_IMAGE_BUCKET,
                                this.modifiedItem.imageID
                            );

                            this.modifiedItem.imageID = null;
                        }

                    } catch (e) {
                        console.error("Failed to delete file:", e);
                    }
                }

                if (["added", "replaced"].includes(this.fileState)) {
                    this.uploadingFile = true;
                    const fileUpload = await storage.createFile(
                        import.meta.env.VITE_APPWRITE_IMAGE_BUCKET,
                        ID.unique(),
                        this.modifiedItem.imageFile,
                        []
                    );

                    this.uploadingFile = false;

                    this.modifiedItem.imageID = fileUpload.$id;
                    this.modifiedItem.image = "";
                }

                result = await databases.updateDocument(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_ITEM_COLLECTION,
                    this.item.$id,
                    {
                        description: this.modifiedItem.description || null,
                        displayPrice: this.modifiedItem.displayPrice,
                        image: this.modifiedItem.image || null,
                        imageID: this.modifiedItem.imageID || null,
                        price: parseFloat(this.modifiedItem.price) || 0,
                        priority: this.modifiedItem.priority,
                        title: this.modifiedItem.title,
                        url: this.modifiedItem.url || null
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

            this.$emit("editItem", {
                item: result
            });

            this.dialogOpen = false;
            this.loading = false;
        },
        async downloadRemoteImage(imageURL) {
            try {
                const imageResponse = await fetch(imageURL);

                let imageBlob = await imageResponse.blob();

                let fileExt = mime.extension(imageBlob.type) || "png";

                if (fileExt === "webp") {
                    // Leave webp as is, due to https://github.com/appwrite/appwrite/issues/10699
                    return;
                }

                const imageFile = new File(
                    [imageBlob], `image.${fileExt}`,
                    { type: imageBlob.type }
                );
                this.fileState = this.modifiedItem.imageID ? "replaced" : "added";
                this.modifiedItem.imageFile = imageFile;
                this.modifiedItem.image = "";
            } catch (error) {
                // Will just be hotlinked instead
                console.error("Failed to download remote image:", error);
            }
        },
        async autofillComplete(responseData) {
            this.previousValues = { ...this.modifiedItem };

            this.modifiedItem.title = responseData.title || this.modifiedItem.title;
            this.modifiedItem.price = responseData.price
                ? responseData.price.price
                : this.modifiedItem.price;

            if (responseData.image) {
                this.modifiedItem.image = responseData.image;
            }

            this.modifiedItem.url = responseData.url || this.modifiedItem.url;
        }
    },
    mounted() {
        if (this.quickCreateURL) {
            this.dialogOpen = true;
            this.modifiedItem.url = this.quickCreateURL;
            this.itemID = ID.unique();

            this.$emit("unsetQuickCreateURL", "");
        }
    }
};
</script>
