import { fetchJson } from "../utils/http.mjs";
import { fakeData } from "./urls.mjs";


export default class JobData {
  constructor({ useLocal = true, baseUrl = "" } = {}) {
    this.useLocal = useLocal;
    this.baseUrl = baseUrl;
  }

  // map data based on source of job data
  sourceMapped(source) {
    if (this.useLocal) {
      const localMap = {
        indeed: fakeData,
        linkedin: fakeData,
        glassdoor: fakeData,
      };
      return localMap[source] || fakeData;
    }

    const safeSource = encodeURIComponent(source || "");
    return `${this.baseUrl}/jobs?source=${safeSource}`;
  }

  async getData(source) {
    try {
      const url = this.sourceMapped(source);
      const data = await fetchJson(url);
      if (!source) return data;
      const normalized = String(source).toLowerCase();
      return data.filter((job) => String(job.Source || "").toLowerCase() === normalized);
    } catch (error) {
      console.error("Error loading job data:", error);
      return [];
    }
  }
}
