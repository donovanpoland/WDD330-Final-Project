import JobList, { jobModalTemplate } from "../components/JobsList.mjs";
import JobData from "../data/jobData.mjs";

const dataSource = new JobData({ useLocal: true });
const jobsById = new Map();
const dialog = document.querySelector("#dialog");

const lists = [
  { source: "indeed", selector: "#job-list-indeed" },
  { source: "glassdoor", selector: "#job-list-glassdoor" },
  { source: "linkedin", selector: "#job-list-linkedin" },
];

async function initJobsPage() {
  await Promise.all(
    lists.map(async ({ source, selector }) => {
      const element = document.querySelector(selector);
      if (!element) return;

      const jobsList = new JobList(source, dataSource, element);
      const scopedJobs = await jobsList.init();
      scopedJobs.forEach((job, jobId) => jobsById.set(jobId, job));
    }),
  );
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest(".view-job-btn");
  if (viewButton && dialog) {
    const selectedJob = jobsById.get(viewButton.dataset.jobId);
    if (!selectedJob) return;

    dialog.innerHTML = jobModalTemplate(selectedJob);
    dialog.showModal();
    return;
  }

  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton && dialog?.open) {
    dialog.close();
  }
});

if (dialog) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

initJobsPage();
