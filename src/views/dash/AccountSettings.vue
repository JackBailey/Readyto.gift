<template>
    <div class="page-content">
        <v-card
            variant="tonal"
            color="secondary"
        >
            <v-card-title>
                Account Settings
            </v-card-title>
            <v-card-text>
                <p>This is a placeholder for the Account Settings page.</p>
                <p>Here you will be able to manage your account details, change your password, and configure other
                    settings related to your profile.</p>
            </v-card-text>
        </v-card>

        <v-card
            class="mt-4"
            variant="tonal"
            color="secondary"
        >
            <v-card-title>
                Personal Information
            </v-card-title>

            <v-list
                class="mt-0"
                width="max-content"
            >
                <UpdateAccountField
                    name="Full Name"
                    :icon="mdiAccount"
                    v-model="personalInfo.fullName"
                    :save="saveName"
                    autocomplete="name"
                />
                <UpdateAccountField
                    name="Email"
                    :icon="mdiEmail"
                    v-model="personalInfo.email"
                    :save="saveEmail"
                    autocomplete="email"
                />
            </v-list>
        </v-card>

        <v-card
            class="mt-4"
            variant="tonal"
            color="secondary"
        >
            <v-card-title>
                Security Settings
            </v-card-title>
            <v-card-text>
                <p>Manage your security settings here, including changing your password.</p>
            </v-card-text>
            <v-list width="max-content">
                <UpdateAccountField
                    name="Password"
                    :icon="mdiFormTextboxPassword"
                    v-model="personalInfo.password"
                    :save="savePassword"
                    autocomplete="new-password"
                />
                <TwoFactorAuthSettings />
            </v-list>
        </v-card>
    </div>
</template>

<script setup>
import { reactive } from "vue";

import { mdiAccount, mdiEmail, mdiFormTextboxPassword } from "@mdi/js";
import { AppwriteException } from "appwrite";
import { useAuthStore } from "@/stores/auth";
import { useDialogs } from "@/stores/dialogs";

import { account } from "@/appwrite";

import TwoFactorAuthSettings from "@/components/account/mfa/TwoFactorAuthSettings.vue";
import UpdateAccountField from "@/components/UpdateAccountField.vue";

const auth = useAuthStore();
const dialogs = useDialogs();

const personalInfo = reactive({
    email: {
        passwordConfirmation: "",
        value: auth.user?.email || ""
    },
    fullName: {
        value: auth.user?.name || ""
    },
    password: {
        passwordConfirmation: "",
        value: ""
    }
});

const saveName = async () => {
    const result = await account.updateName(personalInfo.fullName.value);
    if (result.$id) {
        auth.setUser(result);
        return true;
    } else {
        dialogs.create({
            text: `There was an error updating your name: ${result.message}`,
            title: "Error Updating Name",
            type: "error"
        });
        return false;
    }
};

const saveEmail = async () => {
    try {
        const result = await account.updateEmail(personalInfo.email.value, personalInfo.email.passwordConfirmation);

        auth.setUser(result);
        await account.createEmailVerification({ url: "https://readyto.gift/dash/verify" });
        dialogs.create({
            actions: [
                {
                    action: "close",
                    color: "primary",
                    text: "OK"
                }
            ],
            text: "A verification email has been sent to your new email address.",
            title: "Verification Email Sent",
            type: "info"
        });
        return true;
    } catch (error) {
        if (error instanceof AppwriteException) {
            dialogs.create({
                actions: [
                    {
                        action: "close",
                        color: "primary",
                        text: "OK"
                    }
                ],
                text: error.message,
                title: "Error Updating Email",
                type: "error"
            });
            return;
        }
        dialogs.create({
            actions: [
                {
                    action: "close",
                    color: "primary",
                    text: "OK"
                }
            ],
            text: error.message,
            title: "Error Updating Email",
            type: "error"
        });
        return false;
    }
};

const savePassword = async () => {
    try {
        await account.updatePassword({
            oldPassword: personalInfo.password.passwordConfirmation,
            password: personalInfo.password.value
        });
        personalInfo.password.value = "";
        personalInfo.password.passwordConfirmation = "";
        dialogs.create({
            actions: [
                {
                    action: "close",
                    color: "primary",
                    text: "OK"
                }
            ],
            text: "Your password has been successfully updated.",
            title: "Password Updated",
            type: "success"
        });
        return true;
    } catch (error) {
        if (error instanceof AppwriteException) {
            dialogs.create({
                actions: [
                    {
                        action: "close",
                        color: "primary",
                        text: "OK"
                    }
                ],
                text: error.message,
                title: "Error Updating Password",
                type: "error"
            });
            return false;
        }
        dialogs.create({
            actions: [
                {
                    action: "close",
                    color: "primary",
                    text: "OK"
                }
            ],
            text: error.message,
            title: "Error Updating Password",
            type: "error"
        });
        return false;
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