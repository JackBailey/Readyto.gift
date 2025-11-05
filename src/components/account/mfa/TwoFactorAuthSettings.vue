<template>
    <v-list>
        <v-list-item
            title="Multi-Factor Authentication (MFA)"
            subtitle="Require another step after using your usual login method."
            :prepend-icon="mdiShieldCheck"
        >
            <template v-slot:append>
                <v-tooltip
                    :text="
                        mfaFactorCount > 0
                            ? (auth.user.mfa ? 'Disable MFA' : 'Enable MFA')
                            : 'You need at least one MFA method enabled to use MFA.'"
                >
                    <template v-slot:activator="{ props }">
                        <div v-bind="props">
                            <v-switch
                                inset
                                color="primary"
                                hide-details
                                :disabled="mfaFactorCount === 0"
                            />
                        </div>
                    </template>
                </v-tooltip>
            </template>
        </v-list-item>
        <v-list-item>
            <v-list>
                <TOTPFactor />
            </v-list>
        </v-list-item>
        
    </v-list>
</template>

<script setup>
import { computed } from "vue";
import { mdiShieldCheck } from "@mdi/js";
import TOTPFactor from "./factors/TOTP.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const mfaFactorCount = computed(() => Object.values(auth.mfaFactors).filter(factor => factor === true).length);
</script>

<style lang="scss">
.mfa {
    > .v-card-item > .v-card-item__content {
        > .v-card-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }
    }
}

.v-list-item.mfa-item {
    > .v-list-item__prepend,
    > .v-list-item__append {
        align-self: flex-start;
    }
    > .v-list-item__content > .v-card-title {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        .v-input__details {
            display: none;
        }
    }
}

.enable-mfa {
    display: flex;
}

.totp-qrcode {
    width: 12rem;
    height: 12rem;
    display: block;
    max-width: 80%;
    border-radius: 1rem;
    background-color: white;
    padding: 0.7rem;
}

.timeline-item-body {
    transition: max-height 0.25s ease-in-out;
    max-height: 0;
    overflow: hidden;
}

.v-timeline-item[data-active="true"] .timeline-item-body {
    max-height: 200vh;
}

.recovery-codes-container {
    .recovery-codes {
        padding: 0 1rem;
        font-size: 1.2rem;
        margin: 0;
        // display: flex;
        // flex-wrap: wrap;
        // margin-top: 1rem;
        // .recovery-code {
        //     background-color: rgb(var(--v-theme-surface));
        //     border-radius: 0.5rem;
        //     padding: 0.5rem 1rem;
        //     font-family: monospace;
        //     margin: 0.25rem;
        //     outline: 1px solid rgb(var(--v-theme-on-surface));
        // }
    }
    // .v-btn {
    //     margin-left: auto;
    //     margin-top: 1rem;
    // }
}

.v-timeline-item {
    &[data-step="4"] {
        .v-otp-input {
            justify-content: flex-start;
            width: 30rem;
            font-weight: bold;
        }
    }
}
</style>