import { Client, Storage } from "node-appwrite";
import fetch from "node-fetch";
import { getLinkPreview } from "./link-preview-js.js";
import getSite from "./get-site.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { InputFile } from "node-appwrite/file";
import mime from "mime-types";
import { TidyURL } from "tidy-url";

const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

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

const getPreview = async (url, country, site, storage, itemID, { log, error }) => {
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

            if (
                site === "amazon" &&
            data.images && data.images.find((img) => img.includes("/captcha/"))
            ) {
                throw new Error("Amazon is blocking access to the page with a CAPTCHA, please try again later.");
            }

            if (data.images && data.images.length) {
                const bestImage = getBestImage(data.url, data.images);
                log(`Best image selected: ${bestImage}, site: ${site}`);
                const imageData = await fetch(bestImage, {
                    followRedirects: "follow",
                    headers: {
                        "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
                    },
                    timeout: 15000,
                    agent: method.type === "proxy" ? new HttpsProxyAgent(method.proxy) : null
                });
            
                if (imageData.ok) {
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

                    log({ contenttype: imageData.headers.get("content-type") });

                    const mimeType = imageData.headers.get("content-type") || "image/jpeg";
                    const fileExt = mime.extension(mimeType) || "png";
    
                    const result = await storage.createFile(
                        "66866e74001d3e2f2629",
                        itemID,
                        InputFile.fromBuffer(imageBuffer, `image.${fileExt}`)
                    );

                    data.imageID = result.$id;
                    data.imageSize = result.sizeOriginal;
                }
            }

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
        images = images
            .filter(url => {
                // Exclude non-photo assets
                const badPatterns = /(icon|logo|favicon|svg|header|account|shopping|favourites)/i;
                return !badPatterns.test(url);
            })
            .map(url => {
                // Attempt to extract width if available in URL
                const widthMatch = url.match(/width=(\d+)/);
                const width = widthMatch ? parseInt(widthMatch[1], 10) : 0;

                // Score image based on heuristics
                let score = 0;
                if (url.includes("product")) score += 2;
                if (width >= 500) score += 3;
                else if (width >= 300) score += 1;
                if (/\.(jpg|jpeg|png)$/i.test(url)) score += 1;

                return { url, score, width };
            })
            .sort((a, b) => b.score - a.score);
        return images[0]?.url;
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

        const site = getSite(url);
        const data = await getPreview(url, country, site, storage, itemID, { log, error });

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
