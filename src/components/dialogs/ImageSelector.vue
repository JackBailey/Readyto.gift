<template>
    <v-card-text
        width="500px"
        class="text-center"
    >
        <v-carousel
            v-model="currentImageIndex"
            height="400"
            hide-delimiters
        >
            <v-carousel-item
                :src="
                    image.src"
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
        <v-carousel
            class="carousel-overview"
            hide-delimiters
            :show-arrows="false"
            height="100"
            v-model="currentImageIndex"
        >
            <v-carousel-item
                v-for="(image, index) in images"
                :key="image.src"
                :value="index"
                class="pa-2"
                width="100px"
            >
                <v-img
                    :src="image.src"
                    height="80"
                    class="rounded-lg"
                    :class="{
                        'border-4 border-primary': currentImageIndex === index,
                        'border-2 border-grey lighten-1': currentImageIndex !== index
                    }"
                    @click="currentImageIndex = index"
                />
            </v-carousel-item>
        </v-carousel>
        <v-chip
            :text="`${ currentImageIndex + 1 } / ${images.length }`"
            color="primary"
            size="small"
            variant="flat"
            rounded="pill"
            elevation="14"
            class="mt-4"
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
