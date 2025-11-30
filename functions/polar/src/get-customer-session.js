import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
    accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? ""
});

// const organizationId = process.env["POLAR_ORG_ID"] ?? "";

export default async ({ req, res, error }) => {
    try {
        const user = req.headers["x-appwrite-user-id"];

        if (!user) {
            return res.json({
                error: "No user ID provided"
            });
        }

        const result = await polar.customerSessions.create({
            externalCustomerId: user
        });
        
        return res.json({
            success: true,
            customerSession: result
        });
    } catch (err) {
        error(`Function failed: ${err.message}`);
        return res.json({
            error: "Function failed"
        });
    }
};
