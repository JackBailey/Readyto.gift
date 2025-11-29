<template>
    <div
        class="page-content"
        v-if="notFound"
    >
        <h1>404</h1>
        <p>Page not found</p>
        <v-btn to="/">Go Home</v-btn>
    </div>
    <div
        class="page-content"
        v-else
    >
        <v-progress-circular
            indeterminate
            size="64"
        />
    </div>
</template>

<script>
import { APPWRITE_DB, APPWRITE_LIST_COLLECTION } from "astro:env/client";
import { databases } from "@/appwrite";
import { Query } from "appwrite";
export default {
    data() {
        return {
            notFound: false
        };
    },
    async mounted() {
        const path = window.location.pathname.slice(1);
        
        const redirectMap = {
            "": "/dash/lists",
            "/dash": "/dash/lists"
        };

        if (redirectMap[path]) {
            window.location.href = redirectMap[path] + window.location.search;
            return;
        }

        if (path) {
            try {
                const document = await databases.listDocuments(
                    APPWRITE_DB,
                    APPWRITE_LIST_COLLECTION,
                    [
                        Query.equal("shortUrl", path)
                    ]
                );

                if (document.total !== 0) {
                    window.location.href = `/list/${document.documents[0].$id}`;
                } else {
                    this.notFound = true;
                }
            } catch (error) {
                this.notFound = true;
                this.error = error.code;
            }
        } else {
            window.location.href = "/dash/lists";
        }
    }
};
</script>

<style lang="scss" scoped>
.page-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    align-items: center;
    text-align: center;

    h1 {
        font-size: 8rem;
    }

    p {
        font-size: 2rem;
    }
}
</style>
