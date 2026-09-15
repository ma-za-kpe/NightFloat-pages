/*
 * Night Float — Proprietary and Confidential. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

import { DEFAULTS, EVENT_TICKS, simulate } from "../sim.js";
import { DEFAULT_HORIZON, getHorizon, projectFrames } from "../projection.js";

const search = document.querySelector("#glossarySearch");
const terms = [...document.querySelectorAll("#termList > div")];
const buttons = [...document.querySelectorAll("[data-filter]")];
const count = document.querySelector("#termCount");
const empty = document.querySelector("#emptyTerms");
const earningsHorizon = document.querySelector("#earningsHorizon");
let activeCategory = "all";

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
  const baselineFrame = simulate({
    ...DEFAULTS,
    scenario: "off",
  })[EVENT_TICKS.close];
  const stressFrame = simulate({
    ...DEFAULTS,
    scenario: "stress",
  })[EVENT_TICKS.close];
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
    earningsGross: values.active.grossFees,
    earningsSystem: values.active.systemResult,
    earningsFunder: values.active.feeWaterfall.fundingPartner,
    earningsMmfl: values.active.feeWaterfall.mmfl,
    earningsPlatform: values.active.feeWaterfall.platform,
    earningsOperations: values.active.feeWaterfall.operations,
    stressFees: values.stress.grossFees,
    stressLoss: values.stress.defaultLoss,
    stressResult: values.stress.systemResult,
  };
  Object.entries(output).forEach(([id, value]) => {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = money(value);
  });
  document.querySelector("#earningsHeadline").textContent =
    `${money(values.active.grossFees)} is not our profit.`;
  document.querySelector("#projectionDays").textContent =
    `${horizon.days.toLocaleString("en-GH")} modeled ${horizon.days === 1 ? "day" : "days"}`;
  document.querySelector("#earningsPeriod").textContent =
    horizon.label.toUpperCase();
  document.querySelector("#earningsUsedLabel").textContent =
    `FACILITY USED · ${horizon.label.toUpperCase()}`;
  document.querySelector("#earningsGrossLabel").textContent =
    `GROSS FACILITY FEES · ${horizon.label.toUpperCase()}`;
  document.querySelector("#waterfallHeading").textContent =
    `The ${horizon.label} fee waterfall`;
  document.querySelector("#stressPeriod").textContent =
    `If the same Stress-day assumptions repeated for ${horizon.label}, unresolved losses would accumulate like this:`;
  document.querySelector("#projectionRule").textContent =
    `This view repeats the same selected one-day assumptions across ${horizon.days.toLocaleString("en-GH")} modeled ${horizon.days === 1 ? "day" : "days"}. It does not compound growth, learn, or carry frozen agents into a new day. It is a transparent projection, not a forecast.`;
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

renderEarningsExample();
filterTerms();
