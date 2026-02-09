import JobList from "../components/JobsList.mjs";
import JobData from "../data/jobData.mjs";

const dataSource = new JobData({ useLocal: true });

const lists = [
  { source: "indeed", selector: "#job-list-indeed" },
  { source: "glassdoor", selector: "#job-list-glassdoor" },
  { source: "linkedin", selector: "#job-list-linkedin" },
];

lists.forEach(({ source, selector }) => {
  const element = document.querySelector(selector);
  if (!element) return;
  const jobsList = new JobList(source, dataSource, element);
  jobsList.init();
});
