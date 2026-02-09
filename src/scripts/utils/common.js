import { renderWithTemplate, loadTemplate, onReady, listen } from "./utils.mjs";

// When DOM is loaded, load the header and footer
onReady(async () => {
  await loadHeaderFooter();
  getCurrentYear();
});

// get current year for footer
function getCurrentYear() {
  const today = new Date();
  const currentYear = document.querySelector("#current-year");
  if (currentYear) {
    currentYear.innerHTML = "&copy; " + today.getFullYear();
  }
}

// get header and footer path in html and template
export async function loadHeaderFooter() {
  // Add header to page
  const headerTemplate = await loadTemplate("/partials/header.html");
  const headerElement = document.querySelector("#dy-header");
  // Ensure header element is on page
  if (headerElement) {
    renderWithTemplate(headerTemplate, headerElement);
  }

  // Add footer to page
  const footerTemplate = await loadTemplate("/partials/footer.html");
  const footerElement = document.querySelector("#dy-footer");
  // Ensure footer element is on page
  if (footerElement) {
    renderWithTemplate(footerTemplate, footerElement);
  }

  const navButton = document.querySelector("#ham-btn");
  const navBar = document.querySelector("#nav-bar");
  // Add class for showing navigation on hamburger button click
  listen(navButton, "click", () => {
    navButton.classList.toggle("show");
    navBar.classList.toggle("show");
  });
  // Remove class for showing navigation on page resize
  listen(window, "resize", () => {
    navButton.classList.remove("show");
    navBar.classList.remove("show");
  });
}
