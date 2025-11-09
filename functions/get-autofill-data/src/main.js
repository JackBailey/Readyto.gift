import { Client, Storage } from "node-appwrite";
import { Buffer } from "buffer";
import getBestImage from "./modules/get-best-image.js";
import { getLinkPreview } from "./link-preview-js.js";
import getSite from "./get-site.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { InputFile } from "node-appwrite/file";
import mime from "mime-types";
import { Polar } from "@polar-sh/sdk";
import { TidyURL } from "tidy-url";

const polar = new Polar({
    accessToken: process.env["POLAR_ACCESS_TOKEN"] ?? ""
});

const bandwidthCostPerGB = {
    currency: "usd",
    amount: 8
};

const formatTitle = (data, site) => {
    let { title, description } = data;

    if (!title) title = description;

    if (title) {
        if (site === "amazon") {
            title = title
                .replace(/^Amazon\.[^:]+:\s*/, "")
                .replace("Free delivery and returns on all eligible orders. Shop ", "")
                .replace(/\s*:\s*.*$/, "");
        }
    }

    return title ? title.slice(0, 128).trim() : "";
};

const getPreview = async (url, country, site, storage, itemID, userID, { log, error }) => {
    const requestMethods = [];

    if (process.env.APPWRITE_USE_LOCAL_FETCH !== "false") {
        requestMethods.push({
            type: "standard",
            name: "Local Fetch"
        });
    }

    const proxies = process.env.APPWRITE_HTTP_PROXIES
        ? process.env.APPWRITE_HTTP_PROXIES.split(",")
        : [];

    for (const [index, proxy] of proxies.entries()) {
        requestMethods.push({
            type: "proxy",
            name: `Proxy ${index + 1}`,
            proxy
        });
    }

    let proxyUsername = process.env.APPWRITE_PROXY_USERNAME;
    const proxyCountryPrefix = process.env.APPWRITE_PROXY_COUNTRY_PREFIX;
    const proxyPassword = process.env.APPWRITE_PROXY_PASSWORD;
    const proxyHost = process.env.APPWRITE_PROXY_HOST;
    const proxyAttempts = parseInt(process.env.APPWRITE_PROXY_ATTEMPTS) || 0;

    if (proxyUsername && proxyPassword && proxyHost && proxyAttempts && proxyAttempts > 0) {
        if (proxyUsername && proxyUsername.includes("{country}")) {
            if (country) {
                proxyUsername = proxyUsername.replace("{country}", proxyCountryPrefix + country);
            } else {
                proxyUsername = proxyUsername.replace("{country}", "");
            }
        }

        for (let i = 0; i < proxyAttempts; i++) {
            const authPart = proxyUsername && proxyPassword
                ? `${proxyUsername}:${proxyPassword}@`
                : "";
            const proxyUrl = `http://${authPart}${proxyHost}`;

            requestMethods.push({
                type: "proxy",
                name: `Rotating Proxy ${i + 1}`,
                proxy: proxyUrl
            });
        }
    }

    log(`Total request methods to try: ${requestMethods.length}`);

    let totalBandwidth = 0;

    for (const method of requestMethods) {
        log(`Trying request method: ${method.name}`);

        const fetchOptions = {
            followRedirects: "follow",
            headers: {
                "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
            },
            timeout: 15000,
            agent: method.type === "proxy" ? new HttpsProxyAgent(method.proxy) : null
        };

        try {
            console.log({ method });
            const data = await getLinkPreview({ url, log, error }, fetchOptions);
            totalBandwidth += parseInt(data.size) || 0;

            log(`Request method succeeded: ${method.name}`);

            if (
                site === "amazon" &&
            data.images && data.images.find((img) => img.src.includes("/captcha/"))
            ) {
                throw new Error("Amazon is blocking access to the page with a CAPTCHA, please try again later.");
            }

            if (data.images && data.images.length) {
                const bestImageResult = await getBestImage({
                    images: data.images,
                    site,
                    fetchOptions,
                    log
                });

                totalBandwidth += bestImageResult.fetchedSize || 0;

                if (bestImageResult.image) {
                    const bestImage = bestImageResult.image;
                    log("Best image found:", JSON.stringify(bestImage.image, null, 2));
                    try {
                    // delete original
                        await storage.deleteFile(
                            "66866e74001d3e2f2629",
                            itemID
                        );
                    }  catch {
                    // ignore error if file does not exist
                    }

                    log({ length: bestImage.data.byteLength });
    
                    const imageBuffer = Buffer.from(bestImage.data);

                    const mimeType = bestImage.contentType || "image/jpeg";
                    const fileExt = mime.extension(mimeType) || "png";
    
                    const result = await storage.createFile(
                        "66866e74001d3e2f2629",
                        itemID,
                        InputFile.fromBuffer(imageBuffer, `image.${fileExt}`)
                    );

                    data.imageID = result.$id;
                    data.imageSize = result.sizeOriginal;
                } else {
                    log("No suitable image found.");
                }
            }

            const bandwidthGB = totalBandwidth / (1024 * 1024 * 1024);
            const costInCents = parseFloat((bandwidthGB * bandwidthCostPerGB.amount).toFixed(12));

            try {
                await polar.events.ingest({
                    events: [{
                        name: "autofill",
                        externalCustomerId: userID,
                        metadata: {
                            itemID,
                            imageFound: data.imageID ? true : false,
                            totalBandwidth,
                            _cost: {
                                amount: costInCents,
                                currency: bandwidthCostPerGB.currency
                            }
                        }
                    }]
                });
            } catch (err) {
                error(`Polar event ingestion failed: ${err.message}`);
            }

            return data;
        } catch (err) {
            error(`Request method failed: ${method.name} - ${err.message}`);
            // try next method
        }
    }

    throw new Error("All request methods failed, it may be blocked.");
};

export default async ({ req, res, log, error }) => {
    try {
        const { url, currency, itemID } = req.bodyJson;
        const userID = req.headers["x-appwrite-user-id"];

        if (!url) {
            return res.json({
                error: "No URL provided"
            });
        }

        if (!itemID) {
            return res.json({
                error: "No item ID provided"
            });
        }

        const countryMap = {
            USD: "us",
            GBP: "gb",
            EUR: "eu",
            AUD: "au",
            CAD: "ca"
        };

        const client = new Client()
            .setEndpoint("https://appwrite.readyto.gift/v1") // Your API Endpoint
            .setProject("6838baa30010ce23e059") // Your project ID
            .setJWT(req.headers["x-appwrite-user-jwt"]);

        const storage = new Storage(client);

        let country = "";
        if (currency && countryMap[currency]) {
            country = countryMap[currency];
        }

        const site = getSite(url);
        const data = await getPreview(url, country, site, storage, itemID, userID, { log, error });

        const autofillData = {
            title: formatTitle(data, site),
            url: data.url ? TidyURL.clean(data.url).url : "",
            image: "",
            imageID: data.imageID,
            imageSize: data.imageSize,
            price: data.price
        };

        log("Autofill data:", autofillData);

        return res.json(autofillData);
    } catch (err) {
        error(err);
        error("Could not get link preview: " + err.message);

        return res.json({
            error: err.message
        });
    }
};
