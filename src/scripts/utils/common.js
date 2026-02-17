import { renderWithTemplate, loadTemplate, onReady, listen } from "./utils.mjs";

// Run shared page setup only after the DOM is ready.
onReady(async () => {
  // Inject common header/footer partials into the current page.
  await loadHeaderFooter();
  // Update the footer year to the current year.
  getCurrentYear();
});

// Find #current-year and set a copyright year string.
function getCurrentYear() {
  const today = new Date();
  const currentYear = document.querySelector("#current-year");
  if (currentYear) {
    currentYear.innerHTML = "&copy; " + today.getFullYear();
  }
}

// Load header/footer HTML partials and attach common nav interactions.
export async function loadHeaderFooter() {
  // Load header template text from /public/partials/header.html.
  const headerTemplate = await loadTemplate("/partials/header.html");
  // Target element where header template will render.
  const headerElement = document.querySelector("#dy-header");
  // Not every page may include a header placeholder.
  if (headerElement) {
    renderWithTemplate(headerTemplate, headerElement);
  }

  // Load footer template text from /public/partials/footer.html.
  const footerTemplate = await loadTemplate("/partials/footer.html");
  // Target element where footer template will render.
  const footerElement = document.querySelector("#dy-footer");
  // Not every page may include a footer placeholder.
  if (footerElement) {
    renderWithTemplate(footerTemplate, footerElement);
  }

  // Mobile nav controls (injected by header template).
  const navButton = document.querySelector("#ham-btn");
  const navBar = document.querySelector("#nav-bar");
  // Toggle menu open/closed when the hamburger is clicked.
  listen(navButton, "click", () => {
    navButton.classList.toggle("show");
    navBar.classList.toggle("show");
  });
  // Reset mobile nav state when viewport size changes.
  listen(window, "resize", () => {
    navButton.classList.remove("show");
    navBar.classList.remove("show");
  });
}
