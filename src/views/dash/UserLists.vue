<template>
    <div class="page-content">
        <v-alert
            type="warning"
            border="start"
            elevation="32"
            :icon="mdiInformation"
            title="Verification Required"
            text="Please verify your email address to create lists."
            class="mb-4"
            v-if="auth?.user?.emailVerification === false"
        >
            <v-card-actions>
                <v-btn
                    variant="outlined"
                    @click="verifyEmail"
                >
                    Send Verification Email
                </v-btn>
                <v-dialog
                    max-width="500"
                    v-model="verificationDialog"
                >
                    <v-card>
                        <v-card-text>
                            A verification email has been sent to {{ auth.user.email }}. Please
                            check your inbox and spam folder, the link will be valid for 7 days.
                        </v-card-text>

                        <v-card-actions>
                            <v-spacer />

                            <v-btn
                                text="Close"
                                @click="verificationDialog = false"
                            />
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-card-actions>
        </v-alert>
        <PWAPrompt/>
        <v-card
            color="surface"
            variant="flat"
            class="pa-0 mb-4"
        >
            <v-card-item class="px-0">
                <template v-slot:title>
                    <h1 class="mb-0">Your lists</h1>
                </template>
                <template v-slot:append>
                    <CreateList
                        @createList="createList"
                        :disabled="auth?.user?.emailVerification === false"
                    />
                </template>
            </v-card-item>
            <v-card-text class="px-0">
                <div class="sorting">
                    <v-btn-group
                        variant="tonal"
                        divided
                    >
                        <v-btn ref="sortTypeButton">
                            {{ auth.userPrefs.listSorting.type.name }}
                            <v-menu
                                activator="parent"
                                location="bottom start"
                                transition="fade-transition"
                            >
                                <v-list
                                    variant="tonal"
                                    rounded="xl"
                                    :items="sorting.typeOptions"
                                    item-title="name"
                                    item-value="value"
                                    class="py-0 mt-2"
                                    return-object=""
                                    @update:selected="setSortType"
                                />
                            </v-menu>
                        </v-btn>
                        <v-btn
                            :icon="auth.newUserPrefs.listSorting.order === 'asc' ? mdiSortAscending : mdiSortDescending"
                            @click="toggleSortDirection"
                        />
                    </v-btn-group>
                    <v-select
                        :items="sorting.typeOptions"
                        item-title="text"
                        item-value="value"
                        v-model="auth.newUserPrefs.listSorting.type"
                        return-object
                        hide-details
                        :menu-props="{
                            activator: $refs.sortTypeButton,
                            closeOnClick: true,
                        }"
                        v-show="false"
                    />
                </div>
                
            </v-card-text>
        </v-card>
        <v-card
            variant="tonal"
            class="mb-4"
            v-if="quickCreateURL"
        >
            <v-card-text>
                <p>
                    Select or create a list to add the following item to:
                </p>
                <strong>URL:</strong> {{ quickCreateURL }}
            </v-card-text>
        </v-card>
        <div
            class="loaders"
            v-if="loading"
        >
            <v-skeleton-loader type="list-item-two-line" />
            <v-skeleton-loader type="list-item-two-line" />
            <v-skeleton-loader type="list-item-two-line" />

            <v-card
                class="pa-0 mb-4"
                variant="flat"
                color="surface"
            >
                <v-card-item class="px-0">
                    <template v-slot:title>
                        <h2 class="mb-0">Saved lists</h2>
                    </template>
                    <template v-slot:prepend>
                        <v-icon>{{ mdiStar }}</v-icon>
                    </template>
                </v-card-item>
            </v-card>

            <v-skeleton-loader type="list-item-two-line" />
            <v-skeleton-loader type="list-item-two-line" />
            <v-skeleton-loader type="list-item-two-line" />
        </div>

        <v-list v-else-if="!loading && lists?.length">
            <ListCard
                v-for="list in lists"
                :key="list.$id"
                :list="list"
                :quickCreateURL="quickCreateURL"
                :ownList="list.author === auth.user.$id"
            />

        </v-list>
        <v-card
            class="pa-0 mb-4"
            variant="flat"
            color="surface"
            v-if="!loading && savedLists.length"
        >
            <v-card-item class="px-0">
                <template v-slot:title>
                    <h2 class="mb-0">Saved lists</h2>
                </template>
                <template v-slot:prepend>
                    <v-icon>{{ mdiStar }}</v-icon>
                </template>
            </v-card-item>
        </v-card>
        <v-list
            v-if="!loading && savedLists.length"
        >
            <ListCard
                v-for="list in savedLists"
                :key="list.$id"
                :list="list"
                :quickCreateURL="quickCreateURL"
                :ownList="list.author === auth.user.$id"
            />
        </v-list>

        <div
            class="no-items"
            v-if="!loading && !lists?.length && !savedLists.length"
        >
            <v-spacer height="20" />
            <v-alert
                type="info"
                :icon="mdiInformation"
                elevation="2"
                class="mt-5"
                text="No lists currently exist. Add some!"
            />
        </div>
    </div>
</template>

<script>
import { account, databases } from "@/appwrite";
import { mdiInformation, mdiSortAscending, mdiSortDescending, mdiStar } from "@mdi/js";
import CreateList from "@/components/dialogs/CreateList.vue";
import ListCard from "@/components/ListCard.vue";
import PWAPrompt from "@/components/PWAPrompt.vue";
import { Query } from "appwrite";
import { useAuthStore } from "@/stores/auth";
import { useDialogs } from "@/stores/dialogs";
import validation from "@/utils/validation";

export default {
    components: {
        CreateList,
        ListCard,
        PWAPrompt
    },
    data() {
        return {
            auth: useAuthStore(),
            dialogs: useDialogs(),
            lists: [],
            loading: true,
            mdiInformation,
            mdiSortAscending,
            mdiSortDescending,
            mdiStar,
            quickCreateURL: false,
            savedLists: [],
            sorting: {
                typeOptions: [
                    { name: "Title", value: "title" },
                    { name: "Last updated", value: "$updatedAt" },
                    { name: "Created", value: "$createdAt" },
                    { name: "Item Count", value: "itemCount" }
                ]
            },
            verificationDialog: false
        };
    },
    methods: {
        createList(data) {
            const query = {};
            if (this.quickCreateURL) {
                query.quickcreateurl = this.quickCreateURL;
            }
            this.$router.push({
                name: "list",
                params: {
                    id: data.list.$id
                },
                query
            });
        },
        async getLists() {
            this.loading = true;

            const listQuery = [
                this.auth.userPrefs.listSorting.order === "asc"
                    ? Query.orderAsc(this.auth.userPrefs.listSorting.type.value)
                    : Query.orderDesc(this.auth.userPrefs.listSorting.type.value)
            ];

            const authorQuery = Query.equal("author", this.auth.user.$id);

            if (this.auth.userPrefs?.savedLists.length) {
                listQuery.push(
                    Query.or([
                        authorQuery,
                        Query.equal("$id", this.auth.userPrefs.savedLists)
                    ])
                );
            } else {
                listQuery.push(authorQuery);
            }

            try {
                const lists = await databases.listDocuments(
                    import.meta.env.VITE_APPWRITE_DB,
                    import.meta.env.VITE_APPWRITE_LIST_COLLECTION,
                    listQuery
                );
    
                this.savedLists = lists.documents.filter(list => this.auth.userPrefs.savedLists.includes(list.$id));
                this.lists = lists.documents.filter(list => !this.auth.userPrefs.savedLists.includes(list.$id));
    
                this.loading = false;
            } catch(error) {
                this.dialogs.create({
                    actions: [
                        {
                            action: this.getLists,
                            closeAfterAction: true,
                            text: "Retry"
                        }
                    ],
                    text: error,
                    title: "Failed to load lists"
                });
            }

        },
        async setSortType(event) {
            this.auth.newUserPrefs.listSorting.type = event[0];
            await this.getLists();
            try {
                await this.auth.updatePrefs(this.auth.newUserPrefs);
            } catch {
                alert("Failed to update user prefs");
            }
        },
        async toggleSortDirection() {
            this.auth.newUserPrefs.listSorting.order = this.auth.newUserPrefs.listSorting.order === "asc" ? "desc" : "asc";
            await this.getLists();
            try {
                await this.auth.updatePrefs(this.auth.newUserPrefs);
            } catch {
                alert("Failed to update user prefs");
            }
        },
        async verifyEmail() {
            try {
                await account.createVerification("https://readyto.gift/dash/verify");

                this.verificationDialog = true;
            } catch (error) {
                alert(error);
            }
        }
    },
    async mounted() {
        await this.getLists();

        // Handle quick create URL query
        const { title, text, url } = this.$route.query;

        if (!title && !text && !url) return;

        if (!url) {
            if (text.match(validation.urlRegexGlobal)) {
                this.quickCreateURL = text.match(validation.urlRegexGlobal)[0];
            }
            else if (title.match(validation.urlRegexGlobal)) {
                this.quickCreateURL = title.match(validation.urlRegexGlobal)[0];
            }
        } else {
            this.quickCreateURL = url;
        }
    }
};
</script>

<style lang="scss" scoped>
main {
    .page-content {
        width: var(--section-width);
        margin: 0 auto;
        padding: 2rem 0;

        h1, h2 {
            word-break: break-word;
            white-space: pre-wrap;
        }
    }


}
</style>
