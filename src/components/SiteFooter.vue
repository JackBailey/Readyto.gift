<template>
    <v-footer class="mb-4 v-card--variant-tonal pa-0">
        <div class="made-by">
            <p>Created by <a
                href="https://jackbailey.dev"
                target="_blank"
            >
                Jack Bailey
            </a></p>
        </div>
        <div class="footer-links">
            <v-btn
                :prepend-icon="mdiCash"
                slim
                href="https://github.com/sponsors/jackbailey"
            >
                <v-list-item-title>Donate</v-list-item-title>
            </v-btn>
            <v-btn
                :icon="mdiGithub"
                slim
                href="https://github.com/JackBailey/Readyto.gift"
                class="ml-2"
                density="compact"
                size="large"
            />
        </div>
    </v-footer>
</template>

<script setup>
import { mdiCash, mdiGithub } from "@mdi/js";
</script>

<style lang="scss" scoped>
.v-footer {
    display: flex;
    justify-content: space-between;
    width: var(--section-width);
    margin: 0 auto;
    .made-by {
        a {
            background-color: transparent;
            color: rgb(var(--v-theme-primary));
            text-decoration: underline;
        }
    }
    .footer-links {
        display: flex;
        align-items: center;
    }
}
</style>