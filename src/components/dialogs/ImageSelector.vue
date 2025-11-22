<template>
    <v-card-text
        width="500px"
        class="text-center"
    >
        <Splide
            :has-track="false"
            :options="mainSliderOptions"
            ref="main"
            aria-label="..."
        >
            <SplideTrack>
                <SplideSlide
                    v-for="image in images"
                    :key="image.src"
                >
                    <v-img
                        :src="image.src"
                        height="400"
                        contain
                    />
                </SplideSlide>

            </SplideTrack>
            <div class="splide__arrows">
                <v-btn
                    class="splide__arrow splide__arrow--prev"
                    :icon="mdiChevronRight"
                />
                <v-btn
                    class="splide__arrow splide__arrow--next"
                    :icon="mdiChevronRight"
                />
            </div>
        </Splide>
        <Splide
            :options="thumbSliderOptions"
            ref="thumbnail"
            class="thumbnail"
        >
            <SplideSlide
                v-for="image in images"
                :key="image.src"
            >
                <v-img
                    :src="image.src"
                    contain
                />
            </SplideSlide>
        </Splide>
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
</template>

<script setup>
import { defineEmits, defineProps, onMounted, shallowRef, useTemplateRef } from "vue";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/vue-splide";
import { mdiChevronRight } from "@mdi/js";

import "@splidejs/vue-splide/css";

const currentImageIndex = shallowRef(0);
const emit = defineEmits(["select-image"]);

// Ref: https://codestax.medium.com/easy-way-to-create-a-slider-in-vue-js-with-splide-js-8905e88dc8ab
const mainSliderOptions = {
    arrows: true,
    pagination: false,
    perPage: 1,
    type: "slide"
};

const thumbSliderOptions = {
    arrows: false,
    fixedWidth: 100,
    focus: "center",
    gap: 0,
    isNavigation: true,
    pagination: false,
    type: "slide"
};

const mainSlider = useTemplateRef("main");
const thumbnailSlider = useTemplateRef("thumbnail");

defineProps({
    images: {
        required: true,
        type: Array
    }
});

onMounted(() => {
    mainSlider.value.splide.sync(thumbnailSlider.value.splide);

    mainSlider.value.splide.on("move", (newIndex) => {
        currentImageIndex.value = newIndex;
        emit("select-image", newIndex);
    });
});

</script>

<style lang="scss">
.thumbnail {
    .splide__track--nav > .splide__list > .splide__slide.is-active {
        border: 5px solid rgb(var(--v-theme-primary));
    }
}
</style>
