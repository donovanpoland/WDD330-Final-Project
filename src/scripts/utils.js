// if the DOM is still loading, wait then call functions
export function onReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

// pass template and parent element into function and replace the content of the parent element with the template
// also pass a function(and data here)
// if no data or function is passed data, callback = undefined
function renderWithTemplate(template, parentElement, callback, data) {
  parentElement.innerHTML = template;
  if (callback) {
    callback(data);
  }
}

// load template from path
export async function loadTemplate(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Failed to load ${path}: ${res.status}`);
    } // end if
    return await res.text();
  } catch (error) {
    //end try
    console.log("", error);
    throw error;
  } //end catch
} //end loadTemplate function

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

export function listen(selector, event, handler) {
  const element =
    typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!element) return null;
  element.addEventListener(event, (e) => handler(element, e));
  return element;
}
