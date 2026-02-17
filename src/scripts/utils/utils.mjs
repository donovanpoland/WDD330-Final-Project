// Run a callback once DOM is ready.
// If DOM is already parsed, run immediately.
export function onReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
}

// Replace a container's HTML with a template string.
// Optional callback runs after render and receives optional data.
export function renderWithTemplate(template, parentElement, callback, data) {
  parentElement.innerHTML = template;
  if (callback) {
    callback(data);
  }
}

// Fetch an HTML template file and return it as text.
export async function loadTemplate(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Failed to load ${path}: ${res.status}`);
    }
    return await res.text();
  } catch (error) {
    // Log once, then rethrow so caller decides UI behavior.
    console.log("", error);
    throw error;
  }
}

// Add an event listener to either:
// 1) a CSS selector string (first match), or
// 2) a direct element/window/document reference.
// Returns the resolved element, or null when not found.
export function listen(selector, event, handler) {
  const element =
    typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!element) return null;
  element.addEventListener(event, (e) => handler(element, e));
  return element;
}

// Render an array by mapping each item through a template function.
// position controls insertAdjacentHTML target.
// clear=true empties container before inserting.
export function renderListWithTemplate(template, parentElement, list, position = "afterbegin", clear = false) {
  const htmlStrings = list.map(template);
  // Optional hard reset before inserting new items.
  if (clear) {
    parentElement.innerHTML = "";
  }
  parentElement.insertAdjacentHTML(position, htmlStrings.join(""));
}
