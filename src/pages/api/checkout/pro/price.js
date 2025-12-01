import { POLAR_ACCESS_TOKEN, POLAR_PRO_PRODUCT_ID } from "astro:env/server";
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
    accessToken: POLAR_ACCESS_TOKEN
});

export const GET = async () => {
    try {
        const result = await polar.products.get({
            id: POLAR_PRO_PRODUCT_ID
        });

        const prices = result.prices.filter((price) => !price.isArchived);

        if (prices.length === 0) {
            return new Response(JSON.stringify({
                error: "No active prices found for Pro product"
            }), {
                status: 404,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            price: prices[0]
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (err) {
        console.error(`Request failed: ${err.message}`);
        return new Response(JSON.stringify({
            error: "Request failed"
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
};