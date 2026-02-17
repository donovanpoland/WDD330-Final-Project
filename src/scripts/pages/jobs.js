import JobList, { jobModalTemplate } from "../components/JobsList.mjs";
import JobData from "../data/jobData.mjs";

const rapidApiKey = String(import.meta.env.VITE_RAPIDAPI_KEY || "").trim();
const searchQuery = import.meta.env.VITE_JSEARCH_QUERY || "developer jobs in utah";
const searchCountry = import.meta.env.VITE_JSEARCH_COUNTRY || "us";
const searchNumPages = Number.parseInt(import.meta.env.VITE_JSEARCH_NUM_PAGES || "3", 10);

// Shared data source instance for all job sections.
// If a RapidAPI key exists, use JSearch; otherwise fallback to local JSON.
const dataSource = new JobData({
  useLocal: !rapidApiKey,
  query: searchQuery,
  country: searchCountry,
  numPages: Number.isFinite(searchNumPages) && searchNumPages > 0 ? searchNumPages : 1,
  datePosted: import.meta.env.VITE_JSEARCH_DATE_POSTED || "all",
});
// Global lookup map across all sections: jobId -> job object.
const jobsById = new Map();
// One shared native dialog for all "View" actions.
const dialog = document.querySelector("#dialog");
const listsRoot = document.querySelector("#jobs-lists");
const searchContext = document.querySelector("#search-context");

function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderSearchContext() {
  if (!searchContext) return;
  const match = String(searchQuery).trim().match(/^(.*?)\s+jobs?\s+in\s+(.*)$/i);
  const category = match ? `${toTitleCase(match[1])} Jobs` : toTitleCase(searchQuery);
  const location = match ? toTitleCase(match[2]) : String(searchCountry || "").toUpperCase();
  const country = String(searchCountry || "").toUpperCase();

  searchContext.innerHTML = `
    <h2>Active Search</h2>
    <p>Category: <strong>${category}</strong></p>
    <p>Location: <strong>${location}</strong> (${country})</p>
  `;
}

function sourceKey(source) {
  return String(source || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getJobSources(job) {
  const sources = Array.isArray(job?.Sources) && job.Sources.length ? job.Sources : [job?.Source];
  return sources
    .map((source) => String(source || "").trim())
    .filter(Boolean);
}

function ensureListMount(source) {
  if (!listsRoot) return null;
  const key = sourceKey(source);
  let mount = Array.from(listsRoot.children).find(
    (node) => node?.dataset?.sourceKey === key,
  );
  if (!mount) {
    mount = document.createElement("div");
    mount.dataset.sourceKey = key;
    listsRoot.append(mount);
  }
  return mount;
}

// Load each source list and merge source-level maps into page-level jobsById.
async function initJobsPage() {
  const allJobs = await dataSource.getData();
  const jobsBySource = new Map();

  allJobs.forEach((job) => {
    getJobSources(job).forEach((source) => {
      const existing = jobsBySource.get(source) || [];
      existing.push(job);
      jobsBySource.set(source, existing);
    });
  });

  const allSources = Array.from(jobsBySource.keys());

  if (listsRoot) {
    listsRoot.innerHTML = "";
  }

  for (const source of allSources) {
    const element = ensureListMount(source);
    if (!element) continue;

    const jobsList = new JobList(source, dataSource, element);
    // Render one section at a time to show content as soon as possible.
    const mappedJobs = await jobsList.init(jobsBySource.get(source) || []);
    // Merge map entries for global modal lookup.
    mappedJobs.forEach((job, jobId) => jobsById.set(jobId, job));
  }

  // DevTools helper for verifying cache writes/reads.
  if (typeof window !== "undefined") {
    const storageKey = dataSource.getStorageKey();
    const raw = window.localStorage.getItem(storageKey);
    let cachedCount = 0;
    try {
      const parsed = JSON.parse(raw || "[]");
      cachedCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      cachedCount = 0;
    }
    window.jobsDebug = {
      storageKey,
      cachedRaw: raw,
      cachedCount,
      renderedCount: jobsById.size,
    };
    console.log("Jobs debug:", window.jobsDebug);
  }
}

// Event delegation for dynamically rendered buttons (cards + modal).
document.addEventListener("click", (event) => {
  // Open dialog for the clicked job card.
  const viewButton = event.target.closest(".view-job-btn");
  if (viewButton && dialog) {
    const selectedJob = jobsById.get(viewButton.dataset.jobId);
    if (!selectedJob) return;

    dialog.innerHTML = jobModalTemplate(selectedJob);
    dialog.showModal();
    return;
  }

  // Close dialog when close button inside modal is clicked.
  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton && dialog?.open) {
    dialog.close();
  }
});

if (dialog) {
  // Native dialog: clicking backdrop returns target===dialog.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

// Initial page data/render flow.
renderSearchContext();
initJobsPage();
