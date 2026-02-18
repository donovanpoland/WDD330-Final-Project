import { renderListWithTemplate, listen } from "../utils/utils.mjs";
import { formatSourceLabel } from "../utils/formatters.mjs";
import { getStoredFavorites } from "../utils/jobStorage.mjs";

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

export default class FavoriteList{
    constructor(){
        // Data provider (fetch/cache layer).
        // this.dataSource = dataSource;
        // DOM node where cards render.
        // this.listElement = listElement;
        this.favoritesEl = document.querySelector("#favorites");
        this.detailsEl = document.querySelector("#details");
        this.canvasEL = document.querySelector("#canvas");
        this.manualEntry = document.querySelector("#manual");
        
    }

    async init(){
        this.renderFavorites();
        listen(this.manualEntry, "click", ()=> this.renderManualEntry());
        listen(this.favoritesEl, "change", (_, event) => this.handleStatusChange(event));
    }

    renderFavorites(favoritesList = getStoredFavorites()){
        if(!this.favoritesEl) return;
        renderListWithTemplate(favoritesTemplate, this.favoritesEl, favoritesList, "afterbegin", true);
        if (!favoritesList.length) {
            this.favoritesEl.innerHTML = `<p>No favorites yet.</p>`;
        }
    }

    renderManualEntry(){
        this.detailsEl.innerHTML = ManualDetailsTemplate({}) + ManualOtherDetailsTemplate({});
    }

    handleStatusChange(event){
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
}


const favoriteList = new FavoriteList();
favoriteList.init();


function favoritesTemplate(job){
    const sourceLabel = formatSourceLabel(job?.listingSource || job?.Source);
    const currentStatus = normalizeStatus(job?.status);
    return `
        <article id="${job.id}" class="fav card grid">
            <div class="head flex-column">
                <p>${job.CompanyName}</p>
                <p class="position">${job.Position}</p>
            </div>
            <div class="image flex-column">
                <img class="status ${getStatusClass(currentStatus)}" src="${job.ImageUrl || ""}" alt="${job.CompanyName || "Company"} logo" width="60" height="60">
                <p>${sourceLabel}</p>
            </div>
            <!-- Status Select (manual progress) -->
            <div class="progress flex-row">
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
            <img class="trash" src="/images/icons/trash-solid-full.svg" alt="Remove" title="Remove Job from Favorites" width="44" high="44">
        </article>`;
}

function normalizeStatus(value){
    const normalized = String(value || "").trim().toLowerCase();
    return STATUS_VALUES.includes(normalized) ? normalized : "discovered";
}

function getStatusClass(value){
    return `status-${normalizeStatus(value)}`;
}

function optionSelected(value, currentStatus){
    return value === currentStatus ? " selected" : "";
}

function ManualDetailsTemplate(job){
    return `
        <fieldset class="flex-row card">
            <legend>Details</legend>

            <!-- Company Name -->
            <label for="c-name" name="c-name">
            Company Name 
            <input id="c-name" type="text">
            </label>

            <!-- Position -->
            <label for="position" name="position">
                Position
                <input id="position" type="url">
            </label>

            <!-- Application URL -->
            <label for="app-url" name="app-url">
                Application URL
                <div class="flex-row">
                <input id="app-url" type="url">
                <a class="btn" href="${job.CompanySite}" target="_blank">Visit</a>
                </div>
            </label>

            <!-- Company Site -->
            <label for="site-url" name="site-url">
                Company Site
                <div class="flex-row">
                <input id="site-url" type="url">
                <a class="btn" href="${job.CompanySite}" target="_blank">Visit</a>
                </div>
            </label>
        </fieldset>`                 
}

function ManualOtherDetailsTemplate(){
    return `
        <fieldset class="card flex-row">
           <legend>Other info</legend>
           <label for="">
             Mission
             <input type="text">
           </label>
           <!-- Hiring Agent -->
           <label for="">
               Hiring Agent
               <input type="text">
           </label>
           <!-- CEO -->
           <label for="">
               CEO
               <input type="text">
           </label>
           <!-- Notes -->
           <label for="">
               Notes
               <input type="textbox">
           </label>
        </fieldset>`;
}
