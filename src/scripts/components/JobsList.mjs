import { renderListWithTemplate } from "../utils/utils.mjs";

export default class JobList{
    constructor(listingLocation, dataSource, listElement){
        this.listingLocation = listingLocation;
        this.dataSource = dataSource;
        this.listElement = listElement;
    }

    async init(){
        const list = await this.dataSource.getData(this.listingLocation);
        this.renderList(list);
    }

    renderList(list) {
        renderListWithTemplate(jobCardTemplate, this.listElement, list)
    }
}

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
              <li>💰${job.Salary}</li>
            </ul>
            <p>${job.Description}</p>
            <button id="view-job-btn">View</button>
        </article>`;
}

function jobModleTemplate(job){
    
}
