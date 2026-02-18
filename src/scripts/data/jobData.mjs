import { fetchJson } from "../utils/http.mjs";
import { fakeData, jSearchurl } from "./urls.mjs";
import { getStoredJobs, saveJobs } from "../utils/jobStorage.mjs";


export default class JobData {
  constructor({
    useLocal = true,
    baseUrl = "",
    query = "developer jobs in utah",
    page = 1,
    numPages = 1,
    country = "us",
    datePosted = "all",
  } = {}) {
    this.useLocal = useLocal;
    this.baseUrl = baseUrl;
    this.query = query;
    this.page = page;
    this.numPages = numPages;
    this.country = country;
    this.datePosted = datePosted;
    // Fastest layer: in-memory cache for this page session.
    this.cachedJobs = null;
    // Prevents duplicate fetches when multiple callers ask at once.
    this.jobsPromise = null;
  }

  getStorageKey() {
    // Include request parameters in cache key so changing filters/page count refreshes data.
    if (this.useLocal) {
      return "jobs:data:local:v2";
    }

    const queryPart = encodeURIComponent(String(this.query || "").trim().toLowerCase());
    const countryPart = encodeURIComponent(String(this.country || "").trim().toLowerCase());
    const datePart = encodeURIComponent(String(this.datePosted || "all").trim().toLowerCase());
    return `jobs:data:jsearch:v2:q=${queryPart}:c=${countryPart}:d=${datePart}:p=${this.page}:n=${this.numPages}`;
  }

  // Return the endpoint to fetch all jobs from.
  // Local mode always points to the same JSON file.
  // Remote mode can return all jobs or source-filtered jobs.
  sourceMapped(source) {
    if (this.useLocal) {
      return fakeData;
    }

    if (this.baseUrl) {
      if (!source) return `${this.baseUrl}/jobs`;
      // Encode source so values like "my source" are URL-safe.
      const safeSource = encodeURIComponent(source || "");
      return `${this.baseUrl}/jobs?source=${safeSource}`;
    }

    // JSearch endpoint with the most common filters.
    const params = new URLSearchParams({
      query: this.query,
      page: String(this.page),
      num_pages: String(this.numPages),
      country: this.country,
      date_posted: this.datePosted,
    });
    return `${jSearchurl}search?${params.toString()}`;
  }

  inferSources(job) {
    const publisher = String(job.job_publisher || "").trim();
    // Use apply_options when present; otherwise use an empty list.
    const applyOptions = Array.isArray(job.apply_options) ? job.apply_options : [];
    const uniqueByLower = new Map();

    if (publisher) {
      uniqueByLower.set(publisher.toLowerCase(), publisher);
    }

    applyOptions.forEach((opt) => {
      const optionPublisher = String(opt?.publisher || "").trim();
      if (!optionPublisher) return;
      const key = optionPublisher.toLowerCase();
      if (!uniqueByLower.has(key)) {
        uniqueByLower.set(key, optionPublisher);
      }
    });

    // If we found source names, return them; otherwise return a generic fallback.
    return uniqueByLower.size ? Array.from(uniqueByLower.values()) : ["Other"];
  }

  getCompanyDomain(siteUrl) {
    return String(siteUrl || "")
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }

  normalizeApplyOptions(job) {
    // Transform raw apply options when present; otherwise return an empty list.
    return Array.isArray(job.apply_options)
      ? job.apply_options
          .map((option) => ({
            publisher: String(option?.publisher || "").trim() || "Apply",
            applyLink: String(option?.apply_link || "").trim(),
            isDirect: Boolean(option?.is_direct),
          }))
          .filter((option) => option.applyLink)
      : [];
  }

  getPreferredApplyLink(job, applyOptions) {
    return (
      applyOptions.find((option) => option.isDirect)?.applyLink ||
      String(job.job_apply_link || "").trim() ||
      applyOptions[0]?.applyLink ||
      "#"
    );
  }

  normalizeRawJSearchResponse(response) {
    // Use response.data when available; otherwise treat as no jobs.
    const rawJobs = Array.isArray(response?.data) ? response.data : [];
    return rawJobs.map((job) => this.normalizeJSearchJob(job));
  }

  normalizeJSearchJob(job) {
    const key = String(import.meta.env.VITE_LOGODEV_PUBLIC_KEY || "").trim();
    const highlights = job.job_highlights || {};
    const sources = this.inferSources(job);
    const companySite = String(job.employer_website || "").trim();
    const noURL = "#";
    const companyDomain = this.getCompanyDomain(companySite);
    const applyOptions = this.normalizeApplyOptions(job);
    const preferredApplyLink = this.getPreferredApplyLink(job, applyOptions);
    // Show "Remote"/"On-site" when boolean is provided; otherwise mark as unknown.
    const workType =
      typeof job.job_is_remote === "boolean"
        ? (job.job_is_remote ? "Remote" : "On-site")
        : "Unknown";

    return {
      CompanyName: job.employer_name || "Unknown Company",
      Source: sources[0],
      Sources: sources,
      Position: job.job_title || "Unknown Position",
      CompanySite: companySite || "#",
      ImageUrl: job.employer_logo || `https://img.logo.dev/${companyDomain}?token=${key}` || noURL,
      Location:
        [job.job_city, job.job_state].filter(Boolean).join(", ") ||
        job.job_country ||
        "Unknown Location",
      WorkType: workType,
      DaysListed: job.job_posted_at || "Recently posted",
      // Show salary range only when both min and max values exist.
      Salary:
        job.job_min_salary && job.job_max_salary
          ? `$${job.job_min_salary} - $${job.job_max_salary}`
          : "No salary Listed",
      Description: job.job_description || "No description provided.",
      Responsibilities: highlights.Responsibilities || "No responsibilities listed.",
      // Join qualification bullets when present; otherwise use a default message.
      Requirements: Array.isArray(highlights.Qualifications)
        ? highlights.Qualifications.join(" ")
        : "No Requirements listed.",
      OtherReqs: "",
      Benefits: highlights.Benefits,
      ApplyOptions: applyOptions,
      listingURL: preferredApplyLink,
    };
  }

  async fetchRemoteJobs() {
    const url = this.sourceMapped();
    const apiKey = String(import.meta.env.VITE_RAPIDAPI_KEY || "").trim();

    if (!apiKey) {
      throw new Error("Missing VITE_RAPIDAPI_KEY for JSearch requests.");
    }

    const response = await fetchJson(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      },
    });
    console.log("JSearch raw response:", response);

    // JSearch returns { data: [...] }.
    return this.normalizeRawJSearchResponse(response);
  }

  async fetchJobs() {
    if (this.useLocal) {
      const url = this.sourceMapped();
      const response = await fetchJson(url);

      // Support both pre-normalized arrays and raw JSearch { data: [...] } payloads.
      if (Array.isArray(response)) {
        return response;
      }

      return this.normalizeRawJSearchResponse(response);
    }

    if (this.baseUrl) {
      const url = this.sourceMapped();
      return fetchJson(url);
    }

    return this.fetchRemoteJobs();
  }

  // Get full dataset once, using this priority:
  // 1) in-memory cache
  // 2) localStorage
  // 3) network/file fetch
  async getAllJobs() {
    // 1) Return from memory if we already loaded jobs.
    if (this.cachedJobs) return this.cachedJobs;

    // 2) Try browser storage before making a fetch call.
    const storedJobs = getStoredJobs(this.getStorageKey());
    if (storedJobs.length) {
      this.cachedJobs = storedJobs;
      return storedJobs;
    }

    // If a fetch is already running, reuse that same promise.
    if (this.jobsPromise) {
      return this.jobsPromise;
    }

    // 3) Fetch once, normalize shape, cache it in storage + memory.
    this.jobsPromise = (async () => {
      const jobs = await this.fetchJobs();
      // Guard against malformed responses; always continue with an array.
      // Keep jobs only when fetch returned an array; otherwise use empty list.
      const normalizedJobs = Array.isArray(jobs) ? jobs : [];
      saveJobs(normalizedJobs, this.getStorageKey());
      this.cachedJobs = normalizedJobs;
      return normalizedJobs;
    })();

    try {
      return await this.jobsPromise;
    } finally {
      // Allow future refresh attempts if needed.
      this.jobsPromise = null;
    }
  }

  // Public method used by UI:
  // returns all jobs, or only jobs that match a source.
  async getData(source) {
    try {
      const data = await this.getAllJobs();
      if (!source) return data;
      // Normalize source comparison so case differences do not break filtering.
      const normalized = String(source || "").trim().toLowerCase();
      return data.filter((job) => {
        const primary = String(job.Source || "").trim().toLowerCase();
        // Include all listed sources when Sources is an array; otherwise compare against an empty list.
        const multi = Array.isArray(job.Sources)
          ? job.Sources.map((item) => String(item || "").trim().toLowerCase())
          : [];
        return primary === normalized || multi.includes(normalized);
      });
    } catch (error) {
      console.error("Error loading job data:", error);
      return [];
    }
  }
}
