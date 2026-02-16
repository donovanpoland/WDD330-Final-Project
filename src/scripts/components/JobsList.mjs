import { renderListWithTemplate } from "../utils/utils.mjs";

export default class JobList{
    constructor(listingLocation, dataSource, listElement){
        this.listingLocation = listingLocation;
        this.dataSource = dataSource;
        this.listElement = listElement;
        this.jobsById = new Map();
    }

    async init(){
        const list = await this.dataSource.getData(this.listingLocation);
        const listWithIds = list.map((job, index) => ({
            ...job,
            _jobId: `${this.listingLocation}-${index}`
        }));

        this.jobsById = new Map(listWithIds.map((job) => [job._jobId, job]));
        this.renderList(listWithIds);
        return this.jobsById;
    }

    renderList(list) {
        renderListWithTemplate(jobCardTemplate, this.listElement, list)
    }
}

const noSalary = "No salary Listed.";
const seePosting = "See full posting for detailed responsibilities.";
const noRequirements = "No requirements listed";
const noURL = "#";

function jobCardTemplate(job){
    return`
        <article class="card grid job-card">
            <div class="grid">
                <h3>${job.CompanyName}</h3>
                <h5>${job.Position}</h4>
                <img src="${job.ImageUrl}" alt="Logo for ${job.CompanyName}">
            </div>
            <ul class="flex-row">
              <li>📍${job.Location}</li>
              <li>🕒${job.DaysListed}</li>
              <li>💰${job.Salary || noSalary}</li>
            </ul>
            <p>${job.Description}</p>
            <button class="view-job-btn" data-job-id="${job._jobId}" aria-haspopup="dialog" type="button">View</button>
        </article>`;
}

export function jobModalTemplate(job){
    return `
        <article class="grid card">
            <div class="grid modal-head">
                <div class="flex-column">
                    <h2>${job.CompanyName}</h2>
                    <h3>${job.Position}</h3>
                </div>
                <a class="btn" href="${job.CompanySite}">
                    <img src="${job.ImageUrl}" alt="" title="${job.CompanyName}">
                </a>
                <button id="close" data-close-dialog aria-label="Close" type="button">❌</button>
            </div>
            <ul class="flex-row">
                <li>📍${job.Location}</li>
                <li>🕒${job.DaysListed}</li>
                <li>💰${job.Salary || noSalary}</li>
            </ul>
            <h3>Description</h3>
            <p>${job.Description}</p>
            <h3>Responsibilities</h3>
            <p>${job.Responsibilities || seePosting}</p>
            <h3>Required</h3>
            <p>${job.Requirements || noRequirements}</p>
            <h3>Nice to haves</h3>
            <p>${job.OtherReqs || noRequirements}</p>
            <div class="flex-row modal-btns"> 
                <a class="btn" href="${job.listingURL || noURL}" target="blank">View Full Posting</a>
                <button id="add-fav">Favorite</button>
            </div>
        </article>`;
}
