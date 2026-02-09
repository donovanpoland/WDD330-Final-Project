// if the DOM is still loading, wait then call functions
export function onReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }// else if/else
}//end onReady

// pass single static template and parent element into function and replace the content of the parent element with the template
// also pass a function(and data here)
// if no data or function is passed then data and callback = undefined
export function renderWithTemplate(template, parentElement, callback, data) {
  parentElement.innerHTML = template;
  if (callback) {
    callback(data);
  }// end if
}// end renderWithTemplate

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

// add listener to selector
export function listen(selector, event, handler) {
  const element =
    typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!element) return null;
  element.addEventListener(event, (e) => handler(element, e));
  return element;
}// end listen

// render a list of items using a template function
export function renderListWithTemplate(template, parentElement, list, position = "afterbegin", clear = false) {
  const htmlStrings = list.map(template);
  // if clear is true we need to clear out the contents of the parent.
  if (clear) {
    parentElement.innerHTML = "";
  } // end if
  parentElement.insertAdjacentHTML(position, htmlStrings.join(""));
}// end renderListWithTemplate
