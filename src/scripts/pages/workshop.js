import { renderListWithTemplate, listen } from "../utils/utils.mjs";
import { formatSourceLabel } from "../utils/formatters.mjs";
import { getStoredFavorites, saveFavorites } from "../utils/jobStorage.mjs";

const STATUS_VALUES = [
  "discovered",
  "analyzing",
  "tailoring",
  "ready",
  "applied",
  "interviewing",
  "offer",
  "archived",
];
const STATUS_CLASS_NAMES = STATUS_VALUES.map((status) => `status-${status}`);

export default class FavoriteList {
  constructor() {
    this.favoritesEl = document.querySelector("#favorites");
    this.detailsEl = document.querySelector("#details");
    this.manualEntry = document.querySelector("#manual");
    this.manualSaveTopButton = document.querySelector("#save-manual-top");
    this.textModal = document.querySelector("#job-text-modal");
    this.selectedFavoriteKey = null;
  }

  async init() {
    this.renderFavorites();
    listen(this.manualEntry, "click", () => this.renderManualEntry());
    listen(this.manualSaveTopButton, "click", () => this.saveDetails());
    listen(this.favoritesEl, "change", (_, event) =>
      this.handleStatusChange(event),
    );
    listen(this.favoritesEl, "click", (_, event) =>
      this.handleFavoriteClick(event),
    );
    listen(this.detailsEl, "click", (_, event) =>
      this.handleDetailsClick(event),
    );
    this.ensureTextModal();
  }

  renderFavorites(favoritesList = getStoredFavorites()) {
    if (!this.favoritesEl) return;
    renderListWithTemplate(
      favoritesTemplate,
      this.favoritesEl,
      favoritesList,
      "afterbegin",
      true,
    );
    if (!favoritesList.length) {
      this.favoritesEl.innerHTML = `<p>No favorites yet.</p>`;
      this.selectedFavoriteKey = null;
      this.renderDetailsPlaceholder();
      return;
    }
    this.bindFavoriteCardProgress();
    this.applySelectedCardUI();
    this.renderSelectedJobDetails();
  }

  renderManualEntry() {
    this.selectedFavoriteKey = null;
    this.applySelectedCardUI();
    this.detailsEl.innerHTML =
      ManualDetailsTemplate({}) +
      ManualListingDetailsTemplate({}) +
      ResearchDetailsTemplate({}) +
      NotesTemplate({});
  }

  handleStatusChange(event) {
    const statusSelect = event.target.closest("select.status");
    if (!statusSelect) return;
    const statusClass = getStatusClass(statusSelect.value);
    statusSelect.classList.remove(...STATUS_CLASS_NAMES);
    statusSelect.classList.add(statusClass);

    const card = statusSelect.closest("article.fav");
    const statusImage = card?.querySelector("img.status");
    if (!statusImage) return;
    statusImage.classList.remove(...STATUS_CLASS_NAMES);
    statusImage.classList.add(statusClass);
  }

  handleFavoriteClick(event) {
    const trashButton = event.target.closest(".trash");
    const clickedCard = event.target.closest("article.fav");
    if (!clickedCard) return;
    const encodedKey = clickedCard.dataset?.favoriteKey;
    if (!encodedKey) return;
    const favoriteKey = decodeURIComponent(encodedKey);

    if (trashButton) {
      const currentFavorites = getStoredFavorites();
      const updatedFavorites = currentFavorites.filter(
        (job) => getFavoriteKey(job) !== favoriteKey,
      );
      saveFavorites(updatedFavorites);
      if (this.selectedFavoriteKey === favoriteKey) {
        this.selectedFavoriteKey = null;
        this.renderDetailsPlaceholder();
      }
      this.renderFavorites(updatedFavorites);
      return;
    }

    this.selectedFavoriteKey = favoriteKey;
    this.applySelectedCardUI();
    this.renderSelectedJobDetails();
  }

  bindFavoriteCardProgress() {
    const cards = this.favoritesEl?.querySelectorAll("article.fav") || [];
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => toggleCardProgress(card, true));
      card.addEventListener("mouseleave", () => {
        if (card.classList.contains("selected")) return;
        toggleCardProgress(card, false);
      });
      card.addEventListener("focusin", () => toggleCardProgress(card, true));
      card.addEventListener("focusout", (event) => {
        if (card.contains(event.relatedTarget)) return;
        if (card.classList.contains("selected")) return;
        toggleCardProgress(card, false);
      });
    });
  }

  applySelectedCardUI() {
    const cards = this.favoritesEl?.querySelectorAll("article.fav") || [];
    cards.forEach((card) => {
      const encodedKey = card.dataset?.favoriteKey;
      const cardKey = encodedKey ? decodeURIComponent(encodedKey) : "";
      const isSelected =
        Boolean(this.selectedFavoriteKey) &&
        cardKey === this.selectedFavoriteKey;
      card.classList.toggle("selected", isSelected);
      toggleCardProgress(card, isSelected);
    });
  }

  renderSelectedJobDetails() {
    if (!this.detailsEl) return;
    if (!this.selectedFavoriteKey) {
      this.renderDetailsPlaceholder();
      return;
    }
    const selectedJob = getStoredFavorites().find(
      (job) => getFavoriteKey(job) === this.selectedFavoriteKey,
    );
    if (!selectedJob) {
      this.renderDetailsPlaceholder();
      return;
    }
    if (isManualJob(selectedJob)) {
      this.detailsEl.innerHTML =
        ManualDetailsTemplate(selectedJob) +
        ManualListingDetailsTemplate(selectedJob) +
        ResearchDetailsTemplate(selectedJob) +
        NotesTemplate(selectedJob);
      return;
    }
    this.detailsEl.innerHTML =
      JobDetailsTemplate(selectedJob) +
      JobListingDetailsTemplate(selectedJob) +
      ResearchDetailsTemplate(selectedJob) +
      NotesTemplate(selectedJob);
  }

  handleDetailsClick(event) {
    const toggleButton = event.target.closest("[data-toggle-fieldset]");
    if (toggleButton) {
      const fieldset = toggleButton.closest("fieldset");
      if (!fieldset) return;
      const isCollapsed = fieldset.classList.toggle("collapsed");
      toggleButton.setAttribute("aria-expanded", String(!isCollapsed));
      toggleButton.textContent = isCollapsed ? "Expand" : "Collapse";
      return;
    }

    const openButton = event.target.closest("[data-open-job-text]");
    if (openButton) {
      const selectedJob = this.getSelectedJob();
      if (!selectedJob) return;
      const field = String(openButton.dataset.jobTextField || "").trim();
      const title = String(openButton.dataset.jobTextTitle || "Details").trim();
      this.openJobTextModal(title, selectedJob[field]);
      return;
    }
  }

  renderDetailsPlaceholder() {
    if (!this.detailsEl) return;
    this.detailsEl.innerHTML = `<p>Select a favorite to load company details.</p>`;
  }

  getSelectedJob() {
    if (!this.selectedFavoriteKey) return null;
    return (
      getStoredFavorites().find(
        (job) => getFavoriteKey(job) === this.selectedFavoriteKey,
      ) || null
    );
  }

  ensureTextModal() {
    if (!this.textModal) return;
    if (this.textModal.dataset.bound === "true") return;
    const closeButton = this.textModal.querySelector("[data-close-job-text]");
    closeButton?.addEventListener("click", () => {
      if (this.textModal?.open) this.textModal.close();
    });
    this.textModal.addEventListener("click", (event) => {
      if (event.target === this.textModal) {
        this.textModal.close();
      }
    });
    this.textModal.dataset.bound = "true";
  }

  openJobTextModal(title, textValue) {
    if (!this.textModal) this.ensureTextModal();
    const titleElement = this.textModal?.querySelector("#job-text-modal-title");
    const contentElement = this.textModal?.querySelector(
      "#job-text-modal-content",
    );
    if (!titleElement || !contentElement || !this.textModal) return;
    titleElement.textContent = title;
    contentElement.textContent = String(
      textValue || "No description provided.",
    );
    this.textModal.showModal();
  }

  saveDetails() {
    if (this.selectedFavoriteKey) {
      this.saveSelectedJobDetails();
      return;
    }
    this.saveManualJob();
  }

  saveManualJob() {
    const manualJob = this.buildManualJobFromForm();
    if (!manualJob) return;
    const currentFavorites = getStoredFavorites();
    const updatedFavorites = [...currentFavorites, manualJob];
    saveFavorites(updatedFavorites);
    this.selectedFavoriteKey = getFavoriteKey(manualJob);
    this.renderFavorites(updatedFavorites);
  }

  saveSelectedJobDetails() {
    const updates = {
      Mission: getFieldValue(this.detailsEl, "#r-mission"),
      Recruiter: getFieldValue(this.detailsEl, "#r-recruiter"),
      CEO: getFieldValue(this.detailsEl, "#r-ceo"),
      Notes: getFieldValue(this.detailsEl, "#notes"),
    };
    const currentFavorites = getStoredFavorites();
    const updatedFavorites = currentFavorites.map((job) => {
      if (getFavoriteKey(job) !== this.selectedFavoriteKey) return job;
      return { ...job, ...updates };
    });
    saveFavorites(updatedFavorites);
    this.renderFavorites(updatedFavorites);
  }

  buildManualJobFromForm() {
    const companyName = getFieldValue(this.detailsEl, "#c-name");
    const position = getFieldValue(this.detailsEl, "#position");
    if (!companyName || !position) return null;
    return {
      _jobId: `manual-${Date.now()}`,
      CompanyName: companyName,
      Position: position,
      listingURL: getFieldValue(this.detailsEl, "#app-url"),
      CompanySite: getFieldValue(this.detailsEl, "#site-url"),
      Location: getFieldValue(this.detailsEl, "#m-location"),
      WorkType: getFieldValue(this.detailsEl, "#m-work-type"),
      DaysListed: getFieldValue(this.detailsEl, "#m-list-date"),
      Salary: getFieldValue(this.detailsEl, "#m-salary"),
      Description: getFieldValue(this.detailsEl, "#m-description"),
      Responsibilities: getFieldValue(this.detailsEl, "#m-responsibilities"),
      Requirements: getFieldValue(this.detailsEl, "#m-requirements"),
      Benefits: getFieldValue(this.detailsEl, "#m-benefits"),
      Notes: getFieldValue(this.detailsEl, "#notes"),
      Mission: getFieldValue(this.detailsEl, "#r-mission"),
      Recruiter: getFieldValue(this.detailsEl, "#r-recruiter"),
      CEO: getFieldValue(this.detailsEl, "#r-ceo"),
      ImageUrl: "",
      Source: "Manual",
      listingSource: "Manual",
      status: "discovered",
    };
  }
}

const favoriteList = new FavoriteList();
favoriteList.init();

function toggleCardProgress(card, isVisible) {
  const targets = card?.querySelectorAll(".progress, .trash") || [];
  targets.forEach((element) => {
    element.classList.toggle("hidden", !isVisible);
  });
}

function normalizeStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return STATUS_VALUES.includes(normalized) ? normalized : "discovered";
}

function getStatusClass(value) {
  return `status-${normalizeStatus(value)}`;
}

function optionSelected(value, currentStatus) {
  return value === currentStatus ? " selected" : "";
}

function getFavoriteKey(job) {
  return String(job?._jobId || job?.listingURL || "").trim();
}

function safeAttr(value) {
  return String(value || "").replaceAll('"', "&quot;");
}

function getFieldValue(root, selector) {
  const field = root?.querySelector(selector);
  return String(field?.value || "").trim();
}

function isManualJob(job) {
  const source = String(job?.Source || job?.listingSource || "")
    .trim()
    .toLowerCase();
  const id = String(job?._jobId || "")
    .trim()
    .toLowerCase();
  return source === "manual" || id.startsWith("manual-");
}

function favoritesTemplate(job) {
  const sourceLabel = formatSourceLabel(job?.listingSource || job?.Source);
  const currentStatus = normalizeStatus(job?.status);
  const favoriteKey = encodeURIComponent(getFavoriteKey(job));
  return `
        <article class="fav card grid" data-favorite-key="${favoriteKey}">
            <div class="head flex-column">
                <p>${job.CompanyName}</p>
                <p class="position">${job.Position}</p>
            </div>
            <div class="image flex-column">
                <img class="status ${getStatusClass(currentStatus)}" src="${job.ImageUrl || ""}" alt="${job.CompanyName || "Company"} logo" width="60" height="60">
                <p>${sourceLabel}</p>
            </div>
            <!-- Status Select (manual progress) -->
            <div class="progress flex-row hidden">
                <label class="flex-column">Select progress status
                    <select class="status ${getStatusClass(currentStatus)}">
                        <option value="discovered"${optionSelected("discovered", currentStatus)}>Discovered</option>
                        <option value="analyzing"${optionSelected("analyzing", currentStatus)}>Analyzing</option>
                        <option value="tailoring"${optionSelected("tailoring", currentStatus)}>Tailoring Resume</option>
                        <option value="ready"${optionSelected("ready", currentStatus)}>Ready to Apply</option>
                        <option value="applied"${optionSelected("applied", currentStatus)}>Applied</option>
                        <option value="interviewing"${optionSelected("interviewing", currentStatus)}>Interviewing</option>
                        <option value="offer"${optionSelected("offer", currentStatus)}>Offer</option>
                        <option value="archived"${optionSelected("archived", currentStatus)}>Archived / Rejected</option>
                    </select>
                </label>
            </div>
            <img class="trash hidden" src="/images/icons/trash-solid-full.svg" alt="Remove" title="Remove Job from Favorites" width="30" height="30">
        </article>`;
}

function JobDetailsTemplate(job) {
  return `
        <fieldset class="flex-row card">
            <legend class="fieldset-legend">
                <span>Details</span>
                <button type="button" class="collapse-btn" data-toggle-fieldset aria-expanded="true">Collapse</button>
            </legend>

            <label for="c-name">Company Name
                <input id="c-name" type="text" value="${safeAttr(job?.CompanyName)}" readonly>
            </label>

            <label for="position">Position
                <input id="position" type="text" value="${safeAttr(job?.Position)}" readonly>
            </label>

            <label for="app-url">Application URL
                <div class="flex-row">
                    <input id="app-url" type="url" value="${safeAttr(job?.listingURL)}" readonly>
                    <a class="btn" href="${job?.listingURL || "#"}" target="_blank" rel="noopener noreferrer">Visit</a>
                </div>
            </label>

            <label for="site-url">Company Site
                <div class="flex-row">
                    <input id="site-url" type="url" value="${safeAttr(job?.CompanySite)}" readonly>
                    <a class="btn" href="${job?.CompanySite || "#"}" target="_blank" rel="noopener noreferrer">Visit</a>
                </div>
            </label>
        </fieldset>`;
}

function JobListingDetailsTemplate(job) {
  return `
        <fieldset class="card flex-row">
            <legend class="fieldset-legend">
                <span>Listing Details</span>
                <button type="button" class="collapse-btn" data-toggle-fieldset aria-expanded="true">Collapse</button>
            </legend>

            <label for="location">Location
                <input id="location" type="text" value="${safeAttr(job?.Location)}" readonly>
            </label>

            <label for="work-type">Work Type
                <input id="work-type" type="text" value="${safeAttr(job?.WorkType)}" readonly>
            </label>

            <label for="days-listed">Days Listed
                <input id="days-listed" type="text" value="${safeAttr(job?.DaysListed)}" readonly>
            </label>

            <label for="salary">Salary
                <input id="salary" type="text" value="${safeAttr(job?.Salary)}" readonly>
            </label>
            <div class="listing-actions flex-row">
                <div class="flex-column">
                    <p>Description</p>
                    <button
                        type="button"
                        class="btn"
                        data-open-job-text
                        data-job-text-field="Description"
                        data-job-text-title="Description"
                    >View full description</button>
                </div>

                <div class="flex-column">
                    <p>Responsibilities</p>
                    <button
                        type="button"
                        class="btn"
                        data-open-job-text
                        data-job-text-field="Responsibilities"
                        data-job-text-title="Responsibilities"
                    >View responsibilities</button>
                </div>

                <div class="flex-column">
                    <p>Qualifications</p>
                    <button
                        type="button"
                        class="btn"
                        data-open-job-text
                        data-job-text-field="Requirements"
                        data-job-text-title="Qualifications"
                    >View qualifications</button>
                </div>

                <div class="flex-column">
                    <p>Benefits</p>
                    <button
                        type="button"
                        class="btn"
                        data-open-job-text
                        data-job-text-field="Benefits"
                        data-job-text-title="Benefits"
                    >View benefits</button>
                </div>
            </div>
        </fieldset>`;
}

function ManualDetailsTemplate(job) {
  return `
        <fieldset class="flex-row card">
            <legend class="fieldset-legend">
                <span>Details</span>
                <button type="button" class="collapse-btn" data-toggle-fieldset aria-expanded="true">Collapse</button>
            </legend>

            <!-- Company Name -->
            <label for="c-name" name="c-name">
            Company Name 
            <input id="c-name" type="text" value="${safeAttr(job?.CompanyName)}">
            </label>

            <!-- Position -->
            <label for="position" name="position">
                Position
                <input id="position" type="text" value="${safeAttr(job?.Position)}">
            </label>

            <!-- Application URL -->
            <label for="app-url" name="app-url">
                Application URL
                <div class="flex-row">
                <input id="app-url" type="url" value="${safeAttr(job?.listingURL)}">
                <a class="btn" href="${job.CompanySite}" target="_blank">Visit</a>
                </div>
            </label>

            <!-- Company Site -->
            <label for="site-url" name="site-url">
                Company Site
                <div class="flex-row">
                <input id="site-url" type="url" value="${safeAttr(job?.CompanySite)}">
                <a class="btn" href="${job.CompanySite}" target="_blank">Visit</a>
                </div>
            </label>
        </fieldset>`;
}

function ManualListingDetailsTemplate(job) {
  return `
        <fieldset class="card flex-row manual-listing">
            <legend class="fieldset-legend">
                <span>Listing Details</span>
                <button type="button" class="collapse-btn" data-toggle-fieldset aria-expanded="true">Collapse</button>
            </legend>

            <label for="m-location">Location
                <input id="m-location" type="text" value="${safeAttr(job?.Location)}">
            </label>

            <label for="m-work-type">Work Type
                <input id="m-work-type" type="text" value="${safeAttr(job?.WorkType)}">
            </label>

            <label for="m-list-date">List Date
                <input id="m-list-date" type="text" value="${safeAttr(job?.DaysListed)}">
            </label>

            <label for="m-salary">Salary
                <input id="m-salary" type="text" value="${safeAttr(job?.Salary)}">
            </label>

            <div class="manual-long-grid">
                <label class="long-field" for="m-description">Description
                    <textarea id="m-description" rows="5">${String(job?.Description || "")}</textarea>
                </label>

                <label class="long-field" for="m-responsibilities">Responsibilities
                    <textarea id="m-responsibilities" rows="4">${String(job?.Responsibilities || "")}</textarea>
                </label>

                <label class="long-field" for="m-requirements">Qualifications
                    <textarea id="m-requirements" rows="4">${String(job?.Requirements || "")}</textarea>
                </label>

                <label class="long-field" for="m-benefits">Benefits
                    <textarea id="m-benefits" rows="4">${String(job?.Benefits || "")}</textarea>
                </label>
            </div>
        </fieldset>`;
}

function ResearchDetailsTemplate(job) {
  const missionInfo = "Mission: verify on the company's About or Mission page.";
  const recruiterInfo =
    "Recruiter: check the job posting first, then LinkedIn if not listed.";
  const ceoInfo =
    "CEO: verify on the company's leadership page or recent filings.";
  return `
        <fieldset class="card flex-row">
           <legend class="fieldset-legend">
                <span>Research</span>
                <button type="button" class="collapse-btn" data-toggle-fieldset aria-expanded="true">Collapse</button>
           </legend>
           <label for="r-mission">
             <span class="label-head">
                Mission 
                <img 
                class="info-hint"
                src="/images/icons/dm-info.svg" 
                alt="Information source guidance"
                width="16"
                height="16"
                title="${missionInfo}">
             </span>
             <input id="r-mission" type="text" value="${safeAttr(job?.Mission)}">
           </label>
           <!-- Hiring Agent -->
           <label for="r-recruiter">
               <span class="label-head">
                    Recruiter
                    <img 
                    class="info-hint"
                    src="/images/icons/dm-info.svg" 
                    alt="Information source guidance"
                    width="16"
                    height="16"
                    title="${recruiterInfo}">
               </span>
               <input id="r-recruiter" type="text" value="${safeAttr(job?.Recruiter)}">
           </label>
           <!-- CEO -->
           <label for="r-ceo">
               <span class="label-head">
                    CEO
                    <img 
                    class="info-hint"
                    src="/images/icons/dm-info.svg" 
                    alt="Information source guidance"
                    width="16"
                    height="16"
                    title="${ceoInfo}">
               </span>
               <input id="r-ceo" type="text" value="${safeAttr(job?.CEO)}">
           </label>
        </fieldset>`;
}

function NotesTemplate(job) {
  return `
        <fieldset class="card flex-row">
           <legend class="fieldset-legend">
                <span>Notes</span>
                <button type="button" class="collapse-btn" data-toggle-fieldset aria-expanded="true">Collapse</button>
           </legend>
           <label for="notes">Notes
               <textarea id="notes" rows="5">${String(job?.Notes || "")}</textarea>
           </label>
        </fieldset>`;
}
