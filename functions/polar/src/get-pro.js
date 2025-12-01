import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
    accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? ""
});

export default async ({ res, error }) => {
    if (!process.env["POLAR_ACCESS_TOKEN"]) {
        return res.json({
            message: "Polar is not configured"
        });
    }

    try {
        if (!process.env["POLAR_PRO_PRODUCT_ID"]) {
            throw new Error("POLAR_PRO_PRODUCT_ID is not set");
        }
        const result = await polar.products.get({
            id: process.env["POLAR_PRO_PRODUCT_ID"]
        });
        
        return res.json({
            success: true,
            price: result.prices[0]
        });
    } catch (err) {
        error(`Function failed: ${err.message}`);
        return res.json({
            error: "Function failed"
        });
    }
};
