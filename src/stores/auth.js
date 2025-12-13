import { atom } from "nanostores";
import { client } from "@/appwrite";

export const user = atom(null);

export const init = async ({ user: userData, session }) => {
    client.setSession(session);
    user.set(userData);
    console.log("Auth initialized with user:", userData);
};

export default {
    init,
    user
};