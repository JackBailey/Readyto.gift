<template>
    <div class="app-nav">
        <v-app-bar
            color="primary"
            width="lg"
            variant="tonal"
            elevation="6"
        >
            <v-toolbar-title>
                <v-icon size="x-small">
                    {{ mdiGift }}
                </v-icon>
                readyto.gift
            </v-toolbar-title>

            <template v-slot:append>
                <v-btn
                    to="/dash/lists"
                    v-if="auth.user"
                    :prepend-icon="mdiFormatListBulleted"
                    color="on-primary-container"
                    variant="tonal"
                >Lists</v-btn>

                <v-menu
                    :close-on-content-click="false"
                    v-model="menu"
                >
                    <template v-slot:activator="{ props }">
                        <v-btn
                            :icon="mdiAccountCircle"
                            v-bind="props"
                            class="ml-2"
                            density="compact"
                            size="large"
                        />
                    </template>
                    <v-card>
                        <v-list v-if="auth.user">
                            <v-list-item
                                :prepend-avatar="auth.user.name ? auth.avatar.href : null"
                                :subtitle="auth.user.name ? auth.user.email : null"
                                :title="auth.user.name || auth.user.email"
                            />
                        </v-list>
                        <v-divider v-if="auth.user" />
                        <v-list>
                            <v-list-item>
                                <v-switch
                                    v-model="auth.newUserPrefs.darkMode"
                                    label="Dark Mode"
                                    hide-details
                                    inset
                                    color="primary"
                                />
                            </v-list-item>
                            <v-list-item>
                                <v-switch
                                    v-model="auth.newUserPrefs.showTotalPrice"
                                    label="Show Total Price"
                                    hide-details
                                    inset
                                    color="primary"
                                />
                            </v-list-item>                            
                            <v-list-item v-if="!!auth.user">
                                <v-switch
                                    v-model="auth.newUserPrefs.spoilSurprises"
                                    label="Spoil Surprises"
                                    hide-details
                                    inset
                                    color="primary"
                                />
                            </v-list-item>
                            <v-list-item v-if="!!auth.user">
                                <v-btn
                                    to="/dash/recovery/start"
                                    :prepend-icon="mdiLockReset"
                                    variant="tonal"
                                >   
                                    Change Password
                                </v-btn>
                            </v-list-item>
                        </v-list>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn
                                @click="logIn"
                                color="primary"
                                v-if="!auth.user"
                                :loading="loadingLoginLogout"
                            >
                                Log In</v-btn>

                            <v-btn
                                @click="logout"
                                color="error"
                                :loading="loadingLoginLogout"
                                v-else
                            >Logout</v-btn>
                            <v-btn @click="menu = false">Cancel</v-btn>

                            <v-btn
                                @click="updatePrefs"
                                color="primary"
                                variant="elevated"
                            >Save</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-menu>
            </template>


            <v-progress-linear
                :active="loading"
                indeterminate
                color="primary"
                absolute
                bottom
            />
        </v-app-bar>
    </div>
</template>

<script>
import {
    mdiAccountCircle,
    mdiCog,
    mdiFormatListBulleted,
    mdiGift,
    mdiGithub,
    mdiLockReset,
    mdiMenu
} from "@mdi/js";
import { account } from "@/appwrite";
import { useAuthStore } from "@/stores/auth";
export default {
    props: {
        loading: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            auth: useAuthStore(),
            drawer: true,
            loadingLoginLogout: false,
            mdiAccountCircle,
            mdiCog,
            mdiFormatListBulleted,
            mdiGift,
            mdiGithub,
            mdiLockReset,
            mdiMenu,
            menu: false
        };
    },
    methods: {
        async updatePrefs() {
            if (this.auth.user) {
                const accountResponse = await account.updatePrefs(this.auth.newUserPrefs);
                this.auth.userPrefs = accountResponse.prefs;
            } else {
                localStorage.setItem("userPrefs", JSON.stringify(this.auth.newUserPrefs));
            }

            this.auth.userPrefs = { ...this.auth.newUserPrefs };

            this.menu = false;
        },
        logIn() {
            this.loadingLoginLogout = true;
            this.menu = false;
            this.$router.push({
                path: "/dash/login",
                query: {
                    redirect: this.$route.fullPath
                }
            });
            this.loadingLoginLogout = false;
        },
        async logout() {
            this.loadingLoginLogout = true;
            await account.deleteSession("current");
            this.auth.user = null;
            this.menu = false;
            await this.auth.init();
            if (this.$route.meta && this.$route.meta.requiresAuth) {
                this.logIn();
            } else {
                this.loadingLoginLogout = false;
            }
        }
    }
};
</script>