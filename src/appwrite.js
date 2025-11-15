import { Account, Avatars, Client, Databases, Functions, Locale, Storage } from "appwrite";

const host = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";

const client = new Client().setEndpoint(host).setProject(import.meta.env.VITE_APPWRITE_PROJECT);

if (import.meta.env.VITE_APPWRITE_DEV_KEY) {
    client.setDevKey(import.meta.env.VITE_APPWRITE_DEV_KEY);
}

const account = new Account(client);

const databases = new Databases(client);

const storage = new Storage(client);

const avatars = new Avatars(client);

const functions = new Functions(client);

const locale = new Locale(client);

export { avatars, client, account, storage, databases, functions, locale };
