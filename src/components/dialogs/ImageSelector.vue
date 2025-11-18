<template>
    <v-card-text width="500px">
        <v-carousel
            v-model="currentImageIndex"
            height="400"
            progress="primary"
            hide-delimiters
        >
            <v-carousel-item
                :src="image.src"
                v-for="image in images"
                :key="image.src"
            />
            <v-overlay
                :scrim="false"
                content-class="w-100 h-100 d-flex flex-column align-center justify-end pointer-pass-through py-3"
                contained
                model-value
                no-click-animation
                persistent
            />
        </v-carousel>
        <v-chip
            :text="`${ currentImageIndex + 1 } / ${images.length }`"
            color="primary"
            size="small"
            variant="flat"
            rounded="pill"
            elevation="14"
            align="center"
        />
    </v-card-text>
    <v-card-actions>
        <v-btn
            text
            color="error"
        >
            Cancel
        </v-btn>
        <v-btn
            text
            color="primary"
            variant="tonal"
        >
            Select
        </v-btn>
    </v-card-actions>
</template>

<script setup>
import { defineEmits, defineProps, shallowRef } from "vue";

const currentImageIndex = shallowRef(0);

const props = defineProps({
    images: {
        required: true,
        type: Array
    }
});


</script>
