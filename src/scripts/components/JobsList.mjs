import { renderListWithTemplate } from "../utils/utils.mjs";

// Handles one source-specific job list section (indeed, glassdoor, linkedin).
export default class JobList{
    constructor(listingLocation, dataSource, listElement){
        // Which source this list represents.
        this.listingLocation = listingLocation;
        // Data provider (fetch/cache layer).
        this.dataSource = dataSource;
        // DOM node where cards render.
        this.listElement = listElement;
        // Source-scoped lookup map: jobId -> job object.
        this.jobsById = new Map();
    }

    async init(listOverride){
        // Load jobs for this source only unless list is provided by page controller.
        // Use the provided list when passed from page-level grouping; otherwise fetch by source.
        const list = Array.isArray(listOverride)
            ? listOverride
            : await this.dataSource.getData(this.listingLocation);
        // If no jobs exist for this source, remove its mount and skip rendering.
        if (!list.length) {
            this.listElement.remove();
            return new Map();
        }
        // Add stable local ids so each View button can target one job.
        const listWithIds = list.map((job, index) => ({
            ...job,
            listingURL: resolveListingUrlForSource(job, this.listingLocation),
            listingSource: resolveListingSourceForModal(job, this.listingLocation),
            _jobId: `${this.listingLocation}-${index}`
        }));

        // Build lookup map for fast modal lookup by id.
        this.jobsById = new Map(listWithIds.map((job) => [job._jobId, job]));
        // Render visible job cards into this list section.
        await this.renderList(listWithIds);
        // Return map so page-level controller can merge all source maps.
        return this.jobsById;
    }

    async renderList(list) {
        this.listElement.innerHTML = jobSectionTemplate(this.listingLocation);
        const innerList = this.listElement.querySelector(".jobs-source-list");
        if (!innerList) return;
        await renderListInChunks(jobCardTemplate, innerList, list);
    }
}

const seePosting = "See full posting for detailed responsibilities.";
const noRequirements = "No requirements listed.";
const noURL = "#";
const cardDescriptionLength = 180;
const renderChunkSize = 8;

function nextFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

async function renderListInChunks(template, parentElement, list) {
    if (!Array.isArray(list) || !list.length) return;
    parentElement.innerHTML = "";

    for (let index = 0; index < list.length; index += renderChunkSize) {
        const chunk = list.slice(index, index + renderChunkSize);
        renderListWithTemplate(template, parentElement, chunk, "beforeend", false);
        await nextFrame();
    }
}

// Shorten description text for card display
function truncateText(text, maxLength = cardDescriptionLength) {
    const safeText = String(text || "").trim();
    if (safeText.length <= maxLength) return safeText;
    return `${safeText.slice(0, maxLength).trimEnd()}...`;
}

function resolveListingUrlForSource(job, sourceLabel) {
    const normalizedSource = String(sourceLabel || "").trim().toLowerCase();
    // Use apply options when present; otherwise use an empty list.
    const options = Array.isArray(job?.ApplyOptions) ? job.ApplyOptions : [];
    const matchingOption = options.find((option) =>
        String(option?.publisher || "").trim().toLowerCase().includes(normalizedSource),
    );
    return matchingOption?.applyLink || job?.listingURL || noURL;
}

function resolveListingSourceForModal(job, sourceLabel) {
    const sourceValue = String(sourceLabel || "").trim();
    if (sourceValue.toLowerCase() !== "other") return sourceValue;

    const options = Array.isArray(job?.ApplyOptions) ? job.ApplyOptions : [];
    const fromSelectedLink = options.find((option) => option?.applyLink === job?.listingURL)?.publisher;
    if (fromSelectedLink) return fromSelectedLink;
    if (options[0]?.publisher) return options[0].publisher;
    if (job?.Source && String(job.Source).trim().toLowerCase() !== "other") return job.Source;
    return job?.CompanyName || "Publisher";
}

function formatSourceLabel(source) {
    const value = String(source || "").trim();
    if (!value) return "Publisher";
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function toListItems(value, fallbackText) {
    // Use value directly when it is already an array; otherwise split string text into list items.
    const list = Array.isArray(value)
        ? value
        : String(value || "")
            .split(/\n+|•|(?<=\.)\s+(?=[A-Z])/)
            .map((item) => item.trim())
            .filter(Boolean);
    // Use parsed items when available; otherwise show a single fallback item.
    const safeList = list.length ? list : [fallbackText];
    return safeList.map((item) => `<li>${item}</li>`).join("");
}

// Card markup shown in each source list.
function jobCardTemplate(job){
    return`
        <article class="card grid job-card">
            <div class="grid">
                <h3>${job.CompanyName}</h3>
                <h5>${job.Position}</h5>
                <img src="${job.ImageUrl}" alt="${job.CompanyName} Logo">
            </div>
            <ul class="flex-row">
              <li title="${job.Location}">📍${job.WorkType || "Unknown"}</li>
              <li>🕒${job.DaysListed}</li>
              <li>💰${job.Salary}</li>
            </ul>
            <p>${truncateText(job.Description)}</p>
            <button class="view-job-btn" 
                data-job-id="${job._jobId}" 
                aria-haspopup="dialog" 
                type="button">View
            </button>
        </article>`;
}

// Full detail markup rendered inside the shared dialog.
export function jobModalTemplate(job){
    return `
        <article class="grid card">
            <div class="grid modal-head">
                <div class="flex-column">
                    <h2>${job.CompanyName}</h2>
                    <h3>${job.Position}</h3>
                </div>
                <a href="${job.CompanySite || noURL}" target="_blank">
                    <img src="${job.ImageUrl}" alt="${job.CompanyName} Logo" title="Go to ${job.CompanyName}">
                </a>
                <button id="close" 
                    data-close-dialog 
                    aria-label="Close" 
                    type="button">❌
                </button>
            </div>
            <ul class="flex-row">
                <li>📍${job.Location}</li>
                <li>🕒${job.DaysListed}</li>
                <li>💰${job.Salary}</li>
            </ul>
            <h3>Description</h3>
            <ul class="modal-detail-list">${toListItems(job.Description)}</ul>
            <h3>Responsibilities</h3>
            <ul class="modal-detail-list">${toListItems(job.Responsibilities, seePosting)}</ul>
            <h3>Qualifications</h3>
            <ul class="modal-detail-list">${toListItems(job.Requirements, noRequirements)}</ul>
            <h3>Benefits</h3>
            <ul class="modal-detail-list">${toListItems(job.Benefits)}</ul>
            <div class="flex-row modal-btns"> 
                <a class="btn" 
                    href="${job.listingURL || noURL}"
                    target="_blank" 
                    rel="noopener noreferrer"
                    >View Full Posting on ${formatSourceLabel(job.listingSource)}
                </a>
                <button id="add-fav">Favorite</button>
            </div>
        </article>`;
}

function jobSectionTemplate(source){
    const sourceValue = String(source || "").trim();
    const sourceLabel = formatSourceLabel(sourceValue);
    const sourceId = sourceValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `
        <section id="${sourceId}" class="grid list-container">
            <h2>${sourceLabel}</h2>
            <div class="flex-row job-list jobs-source-list">
            <!-- Insert list of jobs here with template-->
            </div>
        </section>`
}
