<template>
    <div
        class="page-content"
        v-if="!list"
    >
        <v-skeleton-loader type="card" />
        <v-skeleton-loader type="card" />
        <v-skeleton-loader type="card" />
    </div>
    <div
        class="page-content"
        v-else
    >
        <PWAPrompt class="mb-5"/>
        <ListCard
            :header="true"
            :list="list"
            :list-saved="listSaved"
            :quickCreateURL="quickCreateURL"
            :own-list="wishlistOwner"
            @updateList="updateList"
            @newItem="addItem"
        />
        <div class="filters">
            <v-switch
                label="Show Fulfilled"
                v-model="showFulfilled"
                color="primary"
                inset
                v-if="!wishlistOwner"
            />
        </div>
        <v-alert
            v-if="!wishlistOwner"
            type="info"
            :icon="mdiInformation"
            elevation="2"
            class="mt-5"
            text="Make sure to mark anything as Fulfilled if you've purchased or plan on purchasing any of the items on the list! This will not be shown to the owner of this list."
            color="primary"
        />

        <div
            class="items"
            v-if="itemsByPriceGroups && itemsByPriceGroups.length"
        >
            <div
                class="item-price-group"
                v-for="priceGroup in itemsByPriceGroups"
                :key="priceGroup.price"
            >
                <h3>{{ priceGroup.title }}</h3>
                <v-divider />
                <div class="item-price-group-items">
                    <ListItem
                        v-for="item in priceGroup.items"
                        :key="item.$id"
                        :item="item"
                        :list="list"
                        :wishlistOwner="wishlistOwner"
                        :currency="list.currency"
                        @removeItem="removeItem(item.$id)"
                        @loadList="loadList($event)"
                        @editItem="editItem($event)"
                        @fulfillItem="fulfillItem($event)"
                        @unfulfillItem="unfulfillItem($event)"
                    />
                </div>
            </div>
        </div>
        <div
            class="no-items"
            v-else
        >
            <v-spacer height="20" />
            <v-alert
                type="info"
                :icon="mdiInformation"
                elevation="2"
                class="mt-5"
                color="primary"
            >
                <template
                    v-slot:text
                    v-if="list.items && list.items.length"
                >
                    Items exist on this list, but they've all been fulfilled. Lucky them!
                </template>
                <template
                    v-slot:text
                    v-else
                >
                    No items currently exist in this list.
                    <template v-if="wishlistOwner"> Add some! </template>
                </template>
            </v-alert>
        </div>
    </div>
</template>

<script>
import { databases } from "@/appwrite";
import ListCard from "@/components/ListCard.vue";
import ListItem from "@/components/ListItem.vue";
import { mdiInformation  } from "@mdi/js";
import PWAPrompt from "@/components/PWAPrompt.vue";
import { Query } from "appwrite";
import { useAuthStore } from "@/stores/auth";
import { useCurrencyStore } from "@/stores/currency";
import { useDialogs } from "@/stores/dialogs";
export default {
    components: {
        ListCard,
        ListItem,
        PWAPrompt
    },
    data() {
        return {
            auth: useAuthStore(),
            currency: useCurrencyStore(),
            dialogs: useDialogs(),
            fulfillments: [],
            list: false,
            mdiInformation,
            newItem: {
                description: "",
                image: "",
                price: 0,
                priority: "none",
                title: "",
                url: ""
            },
            priceGroups: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
            pwaPromo: false,
            quickCreateURL: this.$route.query.quickcreateurl,
            showFulfilled: localStorage.getItem("showFulfilled") !== "false",
            sort: "price"
        };
    },
    computed: {
        itemsByPriceGroups() {
            if (!this.list || !this.list.items ||this.list.items.length === 0) return [];

            const priceGroupItems = this.priceGroups
                .map((price, index) => {
                    const lowerBound = index === 0 ? 0 : this.priceGroups[index - 1];
                    const upperBound = price;

                    return {
                        items: this.list.items
                            .filter((item) => {
                                if (!this.showFulfilled && !this.wishlistOwner && item.fulfillment)
                                    return false;
                                if (item.price >= lowerBound && item.price < upperBound) {
                                    return item;
                                }
                            })
                            .sort((a, b) => {
                                if (!this.wishlistOwner) {
                                    if (a.fulfillment && !b.fulfillment) return 1;
                                    if (!a.fulfillment && b.fulfillment) return -1;
                                }

                                if (this.sort === "price") {
                                    return a.price - b.price;
                                }
                                return a.title.localeCompare(b.title);
                            }),
                        price,
                        title:
                            this.currency
                                .formatter(this.list.currency)
                                .format(lowerBound)
                                .split(".")[0] +
                            " - " +
                            this.currency
                                .formatter(this.list.currency)
                                .format(upperBound)
                                .split(".")[0]
                    };
                })
                .filter((priceGroup) => priceGroup.items.length);
            return priceGroupItems;
        },
        listSaved() {
            if (!this.auth.userPrefs.savedLists) return false;
            return this.auth.userPrefs.savedLists.includes(this.list.$id);
        },
        spoilSurprises() {
            return this.auth.userPrefs.spoilSurprises;
        },
        wishlistOwner() {
            return this.auth.isLoggedIn && this.auth.user.$id === this.list.author;
        }
    },
    methods: {
        async updateList(data) {
            this.list.title = data.list.title;
            this.list.description = data.list.description;
            this.list.currency = data.list.currency;
            this.list.shortUrl = data.list.shortUrl;
            this.list.itemCount = data.list.itemCount;
            this.list.$updatedAt = data.list.$updatedAt;
        },
        addItem(data) {
            this.list.items.push(data.item);
            this.$nextTick(() => {
                setTimeout(() => {
                    const newItem = this.$el.querySelector(`[data-item-id="${data.item.$id}"]`);
                    newItem.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }, 500);
            });
        },
        editItem(data) {
            this.list.items = this.list.items.map((item) => {
                if (item.$id === data.item.$id) {
                    return data.item;
                }
                return item;
            });
        },
        async removeItem(id) {
            this.list.items = this.list.items.filter((item) => item.$id !== id);

            const updatedList = await databases.updateDocument(
                import.meta.env.VITE_APPWRITE_DB,
                import.meta.env.VITE_APPWRITE_LIST_COLLECTION,
                this.list.$id,
                {
                    itemCount: this.list.items.length
                }
            );

            this.updateList({ list: updatedList });
        },
        fulfillItem(data) {
            this.list.items = this.list.items.map((item) => {
                if (item.$id === data.item.$id) {
                    item.fulfillment = data;
                }
                return item;
            });

            this.$nextTick(() => {
                const el = this.$el.querySelector(`[data-item-id="${data.item.$id}"]`);
                el.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });
        },
        unfulfillItem(itemId) {
            this.list.items = this.list.items.map((item) => {
                if (item.$id === itemId) {
                    item.fulfillment = null;
                }
                return item;
            });

            this.$nextTick(() => {
                const el = this.$el.querySelector(`[data-item-id="${itemId}"]`);
                el.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            });
        },
        async createAvoidSpoilersDialog(list) {
            if (!this.auth.user && this.auth.previouslyLoggedInUserID && list.author === this.auth.previouslyLoggedInUserID) {
                const dialogResponse = await this.dialogs.create({
                    actions: [
                        {
                            action: () => {
                                this.auth.removePreviouslyLoggedInUserID();
                            },
                            closeAfterAction: true,
                            color: "error",
                            text: "Continue Anyway",
                            variant: "text"
                        },
                        {
                            closeAfterAction: true,
                            color: "primary",
                            text: "Log In",
                            to: "/dash/login?redirect=" + encodeURIComponent(this.$route.fullPath),
                            variant: "elevated"
                        }
                    ],
                    async: true,
                    opaque: true,
                    persistent: true,
                    text: "It appears you may have created this list. Would you like to log in, to avoid spoilers?",
                    title: "Warning",
                    variant: "warning"
                });

                return dialogResponse === "No";
            }
        },
        async loadList(listId) {
            try {
                let list = await databases.getDocument(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_LIST_COLLECTION,
                    listId,
                    [
                        Query.select(["*","items.*"])
                    ]
                );

                let loadedAsAuthor = this.auth.user && list.author === this.auth.user.$id;

                const redirectingToLoginPage = await this.createAvoidSpoilersDialog(list);

                if (redirectingToLoginPage) return;

                window.document.title = list.title + " - Readyto.gift";
            
                this.fulfillments = [];

                if (list.items && list.items.length) {
                    this.fulfillments = (await databases.listDocuments(
                        import.meta.env.VITE_APPWRITE_DB,
                        import.meta.env.VITE_APPWRITE_FULFILLMENT_COLLECTION,
                        [
                            Query.equal("item", list.items.map((item) => item.$id)),
                            Query.select(["*", "item.*"])
                        ]
                    )).documents;
                }

                list.items = list.items
                    .sort((a, b) => {
                        if (this.sort === "price") {
                            return a.price - b.price;
                        }
                        return a.title.localeCompare(b.title);
                    })
                    .map((item) => {
                        item.fulfillment = this.fulfillments.find(
                            (fulfillment) => {
                                return fulfillment.item.$id === item.$id;
                            }
                        );

                        return item;
                    });
    
                this.list = list;
                window.addEventListener("appinstalled", () => {
                    this.pwaPromo = false;
                });

                this.auth.$subscribe((mutation, state) => {
                    if (!state.user && loadedAsAuthor) {
                        this.createAvoidSpoilersDialog(this.list);
                        loadedAsAuthor = false;
                    }
                });
            } catch (error) {
                console.error(error)
                this.dialogs.create({
                    actions: [
                        {
                            action: "close",
                            color: "primary",
                            text: "OK"
                        }
                    ],
                    text: "An error occurred while trying to load this list. Please try again later. " + error.message,
                    title: "Error",
                    variant: "error"
                });
            }
        }
    },
    watch: {
        showFulfilled(val) {
            localStorage.setItem("showFulfilled", val);
        }
    },
    mounted() {
        this.loadList(this.$route.params.id);
    }
};
</script>

<style lang="scss" scoped>
main {
    .page-content {
        width: var(--section-width);
        margin: 0 auto;
        padding: 2rem 0;
        .list-header {
            padding: 1rem;
            h1 {
                word-break: break-word;
                white-space: pre-wrap;
            }

            .mobile-list-buttons {
                text-align: center;
            }
        }

        .filters {
            display: flex;
            justify-content: flex-end;
        }

        .items {
            margin-top: 1rem;
            .item-price-group {
                h3 {
                    font-size: 2rem;
                    margin-top: 2rem;
                }
                hr {
                    margin: 0.5rem 0 1rem;
                }
                .item-price-group-items {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
            }
        }
    }

    @media screen and (max-width: 768px) {
        .page-content {
            .list-header {
                h1 {
                    flex-direction: column;
                    align-items: start;
                }
            }
        }
    }
}
</style>