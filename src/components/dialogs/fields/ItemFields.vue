<template>
    <v-form
        validate-on="blur"
        @submit.prevent
    >
        <v-text-field
            label="Title"
            v-model.trim="item.title"
            maxlength="128"
            counter
            :autofocus="!item.url"
            :rules="[() => !!item.title || 'Title is required']"
        />
        <v-textarea
            label="Description"
            v-model.trim="item.description"
            maxlength="4000"
            counter
            persistent-hint
            hint="This field supports markdown!"
            class="mb-2"
        />
        <v-text-field
            type="url"
            label="Website"
            v-model.trim="item.url"
            :prepend-icon="mdiLink"
            :rules="[validateUrl]"
            :error-messages="errors.url"
        />
        <div class="image">
            <v-text-field
                type="url"
                label="Image"
                v-model.trim="item.image"
                :prepend-icon="mdiFileLink"
                persistent-hint
                hint="This should be a direct link to an image."
                v-show="!item.imageID && !item.imageFile"
            />
            <v-file-input
                :prepend-icon="mdiImage"
                v-model="item.imageFile"
                accept=".png,.jpg,.jpeg,.webp"
                label="Image"
                clearable
                show-size="1000"
                ref="image-upload-input"
                v-show="item.imageID || item.imageFile"
                @change="fileUploaded"
                @click:clear="fileRemoved"
            />
            <v-btn
                :prepend-icon="mdiUpload"
                variant="tonal"
                color="primary"
                @click="uploadImage"
                rounded="sm"
                size="x-large"
                :loading="uploadingFile"
            >
                Max 20MB
            </v-btn>
        </div>
        <v-text-field
            type="number"
            label="Price"
            step="0.01"
            placeholder="0"
            v-model="item.price"
            :prefix="currencyStore.getCurrency(currency).symbol"
            :prepend-icon="mdiCash"
        />
        <v-switch
            label="Show Price"
            v-model="item.displayPrice"
            color="primary"
            inset
        />
        <v-select
            label="Priority"
            v-model="item.priority"
            :items="
                Object.entries(priorityMap).map((priority) => ({
                    title: priority[1].text,
                    value: priority[0]
                }))
            "
        />
    </v-form>
</template>

<script setup>
import { mdiCash, mdiFileLink, mdiImage, mdiLink, mdiUpload } from "@mdi/js";
import { ref, useTemplateRef } from "vue";
import { priorityMap } from "@/utils";
import { useCurrencyStore } from "@/stores/currency";
import validation from "@/utils/validation";

const emit = defineEmits(["file-state"]);

const item = defineModel("item");
const currencyStore = useCurrencyStore();

const imageUploadInput = useTemplateRef("image-upload-input");

let newFileUploaded = ref(false);

const uploadImage = () => {
    imageUploadInput.value.click();
};

const fileUploaded = () => {
    const file = imageUploadInput.value.files[0];
    if (file) {
        newFileUploaded.value = true;
        if (item.value && item.value.imageID) {
            emit("file-state", "replaced");
        } else {
            emit("file-state", "added");
        }
    }
};

const fileRemoved = () => {
    emit("file-state", "removed");
};

defineProps({
    currency: {
        required: true,
        type: String
    },
    errors: {
        default: () => ({}),
        type: Object
    },
    uploadingFile: {
        default: false,
        type: Boolean
    }
});

const validateUrl = (url) => {
    return url === "" || validation.urlRegex.test(url) ? true : "Invalid URL";
};
</script>

<style scoped>
.v-input--error {
    margin-bottom: 5px;
}

.image {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;

    @media screen and (max-width: 768px){
        flex-direction: column;
        gap: 1rem;

        .v-btn {
            margin-bottom: 1rem;
        }
    }
}
</style>
