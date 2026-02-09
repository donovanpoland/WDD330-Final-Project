

export class HttpError extends Error {
    constructor(message, { status, payload, url } = {}) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.payload = payload;
        this.url = url;
    }
}


export async function fetchJson(url, options = {}) {
    // fetch data from url, await response
    const res = await fetch(url, options);
    // declare data
    let data;
    try {
        // convert to json
        data = await res.json();
    } catch {
        // if response is not json throw error
        throw new HttpError("Invalid JSON response", {
        status: res.status,
        url,
        });
    }

    // if response is not ok throw error
    if (!res.ok) {
        throw new HttpError("Request failed", {
        status: res.status,
        payload: data,
        url,
        });
    }
    // Return data as json
    return data;
}
