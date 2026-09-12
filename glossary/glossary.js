/*
 * Night Float — Proprietary and Confidential. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

const search = document.querySelector("#glossarySearch");
const terms = [...document.querySelectorAll("#termList > div")];
const buttons = [...document.querySelectorAll("[data-filter]")];
const count = document.querySelector("#termCount");
const empty = document.querySelector("#emptyTerms");
let activeCategory = "all";

function normalise(value) {
  return value.trim().toLocaleLowerCase("en");
}

export function filterTerms(query = search.value, category = activeCategory) {
  const needle = normalise(query);
  let visible = 0;
  terms.forEach((term) => {
    const categoryMatch =
      category === "all" || term.dataset.category.split(" ").includes(category);
    const textMatch = !needle || normalise(term.textContent).includes(needle);
    term.hidden = !(categoryMatch && textMatch);
    if (!term.hidden) visible += 1;
  });
  count.textContent = `${visible} of ${terms.length} terms shown`;
  empty.hidden = visible !== 0;
  return visible;
}

search.addEventListener("input", () => filterTerms());
buttons.forEach((button) =>
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    buttons.forEach((candidate) =>
      candidate.classList.toggle("active", candidate === button),
    );
    filterTerms();
  }),
);

window.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  } else if (event.key === "Escape" && document.activeElement === search) {
    search.value = "";
    filterTerms();
    search.blur();
  }
});

filterTerms();
