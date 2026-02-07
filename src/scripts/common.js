import { loadHeaderFooter, onReady } from "./utils";

// When DOM is loaded, load the header and footer
onReady(async () => {
  await loadHeaderFooter();
  getCurrentYear();
});

function getCurrentYear() {
  const today = new Date();
  const currentYear = document.querySelector("#current-year");
  if (currentYear) {
    currentYear.innerHTML = "&copy; " + today.getFullYear();
  }
}
