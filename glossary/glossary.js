/*
 * Night Float — Proprietary public demonstration · source-visible · no reuse licence. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

import {
  DEFAULTS,
  EVENT_TICKS,
  comparableBaseline,
  scenarioConfig,
  simulate,
} from "../sim.js?v=d711319f06b7";
import { DEFAULT_HORIZON, getHorizon, projectFrames } from "../projection.js?v=e861609b8b69";

const search = document.querySelector("#glossarySearch");
const terms = [...document.querySelectorAll("#termList > div")];
const buttons = [...document.querySelectorAll("[data-filter]")];
const count = document.querySelector("#termCount");
const empty = document.querySelector("#emptyTerms");
const earningsHorizon = document.querySelector("#earningsHorizon");
let activeCategory = "all";
const mobileQuery = window.matchMedia?.("(max-width: 620px)");

function money(value) {
  const sign = value < 0 ? "−" : "";
  return `${sign}GHS ${Math.abs(value).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function earningsSnapshot(horizonKey = DEFAULT_HORIZON) {
  const activeTape = simulate(DEFAULTS);
  const activeFrame = activeTape[EVENT_TICKS.close];
  const baselineFrame = comparableBaseline(DEFAULTS)[EVENT_TICKS.close];
  const stressFrame = simulate(scenarioConfig("stress"))[EVENT_TICKS.close];
  return {
    active: projectFrames(activeFrame, baselineFrame, horizonKey),
    stress: projectFrames(stressFrame, baselineFrame, horizonKey),
  };
}

export function renderEarningsExample(horizonKey = earningsHorizon.value) {
  const values = earningsSnapshot(horizonKey);
  const horizon = getHorizon(horizonKey);
  const output = {
    earningsUtilised: values.active.utilisedPrincipal,
    earningsGross: values.active.accruedFees,
    earningsCollected: values.active.collectedFees,
    earningsUnpaid: values.active.feeReceivable,
    earningsSystem: values.active.cashResultBeforeCosts,
    earningsFunder: values.active.feeWaterfall.fundingPartner,
    earningsMmfl: values.active.feeWaterfall.mmfl,
    earningsPlatform: values.active.feeWaterfall.platform,
    earningsOperations: values.active.feeWaterfall.operations,
    stressFees: values.stress.collectedFees,
    stressLoss: values.stress.defaultLoss,
    stressResult: values.stress.cashResultBeforeCosts,
  };
  Object.entries(output).forEach(([id, value]) => {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = money(value);
  });
  document.querySelector("#earningsHeadline").textContent =
    `${money(values.active.collectedFees)} was collected—not earned profit.`;
  document.querySelector("#projectionDays").textContent =
    `${horizon.days.toLocaleString("en-GH")} modeled ${horizon.days === 1 ? "day" : "days"}`;
  document.querySelector("#earningsPeriod").textContent =
    horizon.label.toUpperCase();
  document.querySelector("#earningsUsedLabel").textContent =
    `FACILITY USED · ${horizon.label.toUpperCase()}`;
  document.querySelector("#earningsGrossLabel").textContent =
    `FEES DUE · ${horizon.label.toUpperCase()}`;
  document.querySelector("#waterfallHeading").textContent =
    `The ${horizon.label} collected-fee waterfall`;
  document.querySelector("#stressPeriod").textContent =
    `If the same Stress-day assumptions repeated for ${horizon.label}, unresolved losses would accumulate like this:`;
  document.querySelector("#projectionRule").textContent =
    `This is arithmetic sensitivity only: it repeats one complete synthetic closing day ${horizon.days.toLocaleString("en-GH")} times. It does not model weekends, learning, probabilities, changing agents, recovery, or costs. It cannot price a pilot or forecast earnings.`;
  return values;
}

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
  if (needle) {
    document.querySelector("#dictionary")?.classList.remove("is-collapsed");
    document
      .querySelector("#dictionary .section-toggle")
      ?.setAttribute("aria-expanded", "true");
  }
  return visible;
}

function setSectionCollapsed(section, button, collapsed) {
  section.classList.toggle("is-collapsed", collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.textContent = collapsed ? "Show section" : "Hide section";
}

function setupProgressiveSections() {
  const hashTarget = window.location.hash
    ? document.querySelector(window.location.hash)
    : null;
  document.querySelectorAll(".section-block").forEach((section, index) => {
    const heading = section.querySelector(":scope > .section-heading");
    if (!heading) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-toggle";
    button.setAttribute("aria-expanded", "true");
    button.textContent = "Hide section";
    heading.append(button);
    const containsTarget = hashTarget && section.contains(hashTarget);
    if (mobileQuery?.matches && index > 0 && !containsTarget) {
      setSectionCollapsed(section, button, true);
    }
    button.addEventListener("click", () => {
      setSectionCollapsed(
        section,
        button,
        !section.classList.contains("is-collapsed"),
      );
    });
  });
}

search.addEventListener("input", () => filterTerms());
buttons.forEach((button) =>
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    buttons.forEach((candidate) =>
      candidate.classList.toggle("active", candidate === button),
    );
    buttons.forEach((candidate) =>
      candidate.setAttribute("aria-pressed", String(candidate === button)),
    );
    filterTerms();
  }),
);
earningsHorizon.addEventListener("change", () => renderEarningsExample());

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

setupProgressiveSections();
buttons.forEach((button) =>
  button.setAttribute(
    "aria-pressed",
    String(button.dataset.filter === activeCategory),
  ),
);
renderEarningsExample();
filterTerms();
