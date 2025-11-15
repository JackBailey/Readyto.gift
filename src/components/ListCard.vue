<template>
    <v-card
        :href=" props.header || props.type === 'selectable' ? undefined : `/list/${props.list.$id}${quickCreateURL && ownList ? `?quickcreateurl=${props.quickCreateURL}` : ''}`"
        :title="props.list.title"
        variant="tonal"
        :color="props.selected ? 'primary' : 'default'"
        :class="['list-card', 'mb-4', props.type]"
    >
        <template v-slot:title>
            <h1 v-if="props.header">{{ props.list.title }}</h1>
            <h3 v-else>{{ props.list.title }}</h3>
        </template>
        <template
            v-slot:subtitle
        >
            <div class="chips">
                <v-chip
                    v-if="!props.ownList && props.type !== 'selectable'"
                    :prepend-avatar="userAvatar(list.authorName)"
                    variant="tonal"
                    color="primary"
                    rounded
                >
                    {{ list.authorName }}
                </v-chip>
                <v-chip
                    :prepend-icon="mdiFileDocumentMultiple"
                    variant="tonal"
                    rounded
                    v-if="list.itemCount !== null"
                >
                    {{ list.itemCount }} items
                </v-chip>
                <v-chip
                    :prepend-icon="mdiUpdate"
                    variant="tonal"
                    rounded
                >
                    {{ new Date(list.$updatedAt).toLocaleString() }}
                </v-chip>
                <v-chip
                    :prepend-icon="mdiInvoiceList"
                    variant="tonal"
                    rounded
                    v-if="authStore.userPrefs.showTotalPrice && list.items && list.items.length > 0"
                >
                    {{
                        currencyStore.formatter(props.list.currency).format(
                            list.items.reduce((sum, item) => sum + (item.price || 0), 0) +
                                (
                                    !ownList || (ownList && spoilSurprises) ? communityItems.reduce((sum, item) => sum + (item.price || 0), 0) : 0
                                )
                        )
                    }}
                </v-chip>
            </div>
        </template>

        <template v-slot:append>
            <ListManagementButtons
                :list="props.list"
                :currency="list.currency"
                :quickCreateQueryURL="props.quickCreateURL"
                :wishlistOwner="ownList"
                :listSaved="props.listSaved"
                @newItem="(data) => emit('newItem', data)"
                @updateList="(data) => emit('updateList', data)"
                v-if="props.header && !$vuetify.display.mobile"
            />
        </template>

        <v-card-text v-if="props.header && (props.list.description || $vuetify.display.mobile || !authStore.isLoggedIn)">
            <VueMarkdown
                v-if="props.list.description"
                :source="props.list.description"
                class="description user-item-markdown mb-4"
            />
            <div class="mobile-list-buttons">
                <ListManagementButtons
                    :list="props.list"
                    :currency="list.currency"
                    :quickCreateQueryURL="props.quickCreateURL"
                    :wishlistOwner="ownList"
                    :listSaved="props.listSaved"
                    @newItem="(data) => emit('newItem', data)"
                    @updateList="(data) => emit('updateList', data)"
                    v-if="props.header && $vuetify.display.mobile"
                />
            </div>
            <v-alert
                v-if="!authStore.isLoggedIn"
                type="info"
                elevation="2"
                :icon="mdiAlert"
                class="m-4 mb-8"
                color="primary"
            >
                <router-link
                    style="color: inherit; font-weight: bold;"
                    to="/dash/login"
                >Log in</router-link> to add your own items, to avoid the list creator receiving duplicate gifts, and to manage your wish lists!
            </v-alert>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { defineEmits, defineProps } from "vue";
import { mdiFileDocumentMultiple, mdiInvoiceList, mdiUpdate } from "@mdi/js";
import { avatars } from "@/appwrite";
import ListManagementButtons from "@/components/dialogs/ListManagementButtons.vue";
import { useAuthStore } from "@/stores/auth";
import { useCurrencyStore } from "@/stores/currency";
import VueMarkdown from "vue-markdown-render";

const emit = defineEmits(["newItem", "updateList"]);

const currencyStore = useCurrencyStore();
const authStore = useAuthStore();

const props = defineProps({
    buttonProps: {
        default: () => ({}),
        type: Object
    },
    communityItems: {
        default: () => ([]),
        type: Array
    },
    header: {
        default: false,
        type: Boolean
    },
    list: {
        required: true,
        type: Object
    },
    listSaved: {
        default: false,
        type: Boolean
    },
    ownList: {
        default: false,
        type: Boolean
    },
    quickCreateURL: {
        default: null,
        type: [String, Boolean]
    },
    selected: {
        default: false,
        type: Boolean
    },
    spoilSurprises: {
        default: false,
        type: Boolean
    },
    type: {
        default: "default",
        type: String
    }
});

const userAvatar = (name) => {
    return avatars.getInitials(name, 32, 32);
};
</script>

<style lang="scss" scoped>
.list-card {
    &.selectable {
        cursor: pointer;
    }
    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
}
:deep(.v-card-title) {
    h1, h3 {
        word-break: break-word;
        white-space: pre-wrap;
    }
}
:deep(.v-card-subtitle) {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    .avatar {
        display: block;
        border-radius: 50%;
        box-sizing: border-box;
    }
    word-break: break-word;
    white-space: pre-wrap;
}

.mobile-list-buttons {
    text-align: center;
}
</style>
