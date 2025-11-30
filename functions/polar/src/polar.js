// import { Client, Users } from "node-appwrite";
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
    accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? ""
});

// const organizationId = process.env["POLAR_ORG_ID"] ?? "";

export const getTiers = async (userID) => {
    if (!userID) return [];
    try {
        const subscriptionsResponse = await polar.subscriptions.list({
            externalCustomerId: userID
        });

        if (subscriptionsResponse.result.pagination.totalCount === 0) {
            return [];
        }

        const tiers = subscriptionsResponse.result.items.map(sub => sub.product.metadata?.tier);

        return tiers;
    } catch (err) {
        console.error(`Error fetching tiers for user ${userID}: ${err.message}`);
        return [];
    }
};