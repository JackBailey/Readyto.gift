import { Client, Storage } from "node-appwrite";
import { getLinkPreview } from "./link-preview-js.js";
import getSite from "./get-site.js";
import { InputFile } from "node-appwrite/file";
import mime from "mime-types";
import { TidyURL } from "tidy-url";

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

const getPreview = async (url, country, { log, error }) => {
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

    for (const method of requestMethods) {
        log(`Trying request method: ${method.name}`);

        try {
            console.log({ method });
            const data = await getLinkPreview({ url, log, error }, {
                followRedirects: "follow",
                headers: {
                    "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
                },
                timeout: 15000,
                proxy: method.type === "proxy" ? method.proxy : null
            });

            log(`Request method succeeded: ${method.name}`);
            return data;
        } catch (err) {
            error(`Request method failed: ${method.name} - ${err.message}`);
            // try next method
        }
    }

    throw new Error("All request methods failed, it may be blocked.");
};

const getBestImage = (url, images) => {
    const site = getSite(url);

    switch (site) {
    case "amazon":
        return images.sort((a, b) => {
            // Extract size information from the current image URL
            const aMatch = /_(SX|SY|UF|SR)(\d+),?(\d+)?_/.test(a);
            const bMatch = /_(SX|SY|UF|SR)(\d+),?(\d+)?_/.test(b);
            
            if (aMatch === bMatch) {
                return 0;
            }
        
            // If a has a match and b doesn't, a should come before b
            if (aMatch) {
                return -1;
            }
        
            // If b has a match and a doesn't, b should come before a
            return 1;
        })[0];
    default:
        return images[0];
    }
};

export default async ({ req, res, log, error }) => {
    try {
        const { url, currency, itemID } = req.bodyJson;

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

        const data = await getPreview(url, country, { log, error });
        const site = getSite(url);

        if (
            site === "amazon" &&
            data.images && data.images.find((img) => img.includes("/captcha/"))
        ) {
            return res.json({
                error: "Amazon is blocking access to the image. Please try again later."
            });
        }

        let imageID, imageSize;

        if (data.images && data.images.length) {
            const imageData = await fetch(getBestImage(data.url, data.images));
            if (!imageData.ok) {
                throw new Error("Failed to fetch image");
            }
            try {
                // delete original
                await storage.deleteFile(
                    "66866e74001d3e2f2629",
                    itemID
                );
            }  catch {
                // ignore error if file does not exist
            }
    
            const imageBuffer = await imageData.arrayBuffer();
    
            const mimeType = imageData.headers.get("content-type") || "image/jpeg";
            const fileExt = mime.extension(mimeType) || "jpg";
    
            const result = await storage.createFile(
                "66866e74001d3e2f2629",
                itemID,
                InputFile.fromBuffer(imageBuffer, `image.${fileExt}`)
            );

            imageID = result.$id;
            imageSize = result.sizeOriginal;
        }

        const autofillData = {
            title: formatTitle(data, site),
            url: data.url ? TidyURL.clean(data.url).url : "",
            image: "",
            imageID,
            imageSize,
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
