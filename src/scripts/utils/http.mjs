
// Custom error type for HTTP requests so callers can inspect status/url/payload.
export class HttpError extends Error {
    constructor(message, { status, payload, url } = {}) {
        super(message);
        this.name = "HttpError";
        // HTTP status code, when available.
        this.status = status;
        // Parsed response body (useful for API error details).
        this.payload = payload;
        // URL that failed.
        this.url = url;
    }
}


// Fetch JSON from a URL and throw rich errors for invalid JSON or non-2xx responses.
export async function fetchJson(url, options = {}) {
    // Execute request with optional fetch config (headers, method, body, etc.).
    const res = await fetch(url, options);
    // Will hold parsed JSON body.
    let data;
    try {
        // Parse response body as JSON.
        data = await res.json();
    } catch {
        // Response exists but body is not valid JSON.
        throw new HttpError("Invalid JSON response", {
        status: res.status,
        url,
        });
    }

    // Convert non-2xx responses into a typed error.
    if (!res.ok) {
        throw new HttpError("Request failed", {
        status: res.status,
        payload: data,
        url,
        });
    }
    // Successful request with parsed JSON body.
    return data;
}
