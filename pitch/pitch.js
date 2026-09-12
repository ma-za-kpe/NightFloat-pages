/*
 * Night Float — Proprietary and Confidential. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

import {
  DEFAULTS,
  EVENT_TICKS,
  SEED,
  assertBooks,
  avoidedCashIn,
  comparableBaseline,
  idleAllocated,
  simulate,
} from "../sim.js";

const slides = [...document.querySelectorAll(".slide")];
const previous = document.querySelector("#previousSlide");
const next = document.querySelector("#nextSlide");
const play = document.querySelector("#playDeck");
const number = document.querySelector("#slideNumber");
const progress = document.querySelector("#deckProgress");
const dots = document.querySelector("#slideDots");
const status = document.querySelector("#deckStatus");
const query = new URLSearchParams(window.location.search);
let current = Math.max(
  0,
  Math.min(slides.length - 1, (Number(query.get("slide")) || 1) - 1),
);
let windTunnelRun = 0;

export function formatPitchMoney(value) {
  return `GHS ${Math.round(value).toLocaleString("en-GH")}`;
}

export function slideIndex(value, total = slides.length) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, value));
}

export function safeReplaceSlideUrl(
  historyObject,
  locationObject,
  slideNumber,
) {
  try {
    historyObject.replaceState(
      null,
      "",
      `${locationObject.pathname}?slide=${slideNumber}`,
    );
    return true;
  } catch {
    return false;
  }
}

function setText(selector, value) {
  const target = document.querySelector(selector);
  if (target) target.textContent = value;
  return Boolean(target);
}

export function renderEvidence() {
  const booksTarget = document.querySelector("#pitchBooks");
  try {
    const active = simulate({
      ...DEFAULTS,
      fundingModel: "partner",
      scenario: "on",
    })[EVENT_TICKS.midday];
    const baseline = comparableBaseline({
      ...DEFAULTS,
      fundingModel: "partner",
    })[EVENT_TICKS.midday];
    const stress = simulate({
      ...DEFAULTS,
      fundingModel: "partner",
      scenario: "stress",
      defaultRate: 12,
      sweep: false,
      bookCap: 70,
    })[EVENT_TICKS.settle];
    assertBooks(active);
    assertBooks(baseline);
    assertBooks(stress);
    const eligible = active.agents.filter(
      (agent) => agent.priceAccepted !== null,
    ).length;
    setText(
      "#pitchAvoided",
      Math.max(0, avoidedCashIn(active, baseline)).toLocaleString("en-GH"),
    );
    setText(
      "#pitchAllocated",
      `${formatPitchMoney(active.metrics.allocated)} / ${formatPitchMoney(active.metrics.bookCap)} cap`,
    );
    setText(
      "#pitchAccepted",
      `${active.metrics.acceptedAgents} of ${eligible} eligible accepted`,
    );
    setText("#pitchUtilised", `${Math.round(active.metrics.utilisationRate)}%`);
    setText(
      "#pitchIdle",
      `${formatPitchMoney(idleAllocated(active))} idle · utilised ÷ allocated`,
    );
    setText("#pitchFrozen", `${stress.metrics.frozen} frozen`);
    setText(
      "#pitchLoss",
      `${formatPitchMoney(stress.metrics.defaultedPrincipal)} unresolved · agent liability; ultimate loss owner TBD`,
    );
    if (booksTarget) {
      booksTarget.textContent = "BOOKS OK";
      booksTarget.className = "ok";
    }
    return { seed: SEED, active, baseline, stress };
  } catch (error) {
    if (booksTarget) {
      booksTarget.textContent = "BOOKS BROKEN";
      booksTarget.className = "broken";
    }
    setText("#pitchAvoided", "WITHHELD");
    setText("#pitchAllocated", error.message);
    return null;
  }
}

export function showSlide(requested, announce = true) {
  const nextIndex = slideIndex(requested);
  const changed = nextIndex !== current;
  current = nextIndex;
  slides.forEach((slide, index) => {
    const active = index === current;
    slide.classList.toggle("active", active);
    slide.setAttribute("aria-hidden", String(!active));
    slide.inert = !active;
  });
  [...(dots?.children || [])].forEach((dot, index) => {
    dot.classList.toggle("active", index === current);
    dot.setAttribute("aria-current", index === current ? "step" : "false");
  });
  if (number) {
    number.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  }
  if (progress) {
    progress.style.width = slides.length
      ? `${((current + 1) / slides.length) * 100}%`
      : "0%";
  }
  if (previous) previous.disabled = current === 0;
  if (next) next.disabled = current === slides.length - 1;
  if (changed) {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  safeReplaceSlideUrl(window.history, window.location, current + 1);
  if (announce && status) {
    const slide = slides[current];
    const title =
      slide?.dataset.title ||
      slide?.querySelector("h1, h2")?.textContent?.trim() ||
      slide?.getAttribute("aria-label") ||
      "Untitled";
    status.textContent = `Slide ${current + 1} of ${slides.length}: ${title}`;
  }
  return current;
}

export function runWindTunnel() {
  showSlide(3);
  const frame = document.querySelector("#pitchWindTunnel");
  if (!frame) return false;
  windTunnelRun += 1;
  frame.src = `../?embed=1&tour=1&motion=reduce&run=${windTunnelRun}`;
  if (play) {
    play.textContent = "↻";
    play.setAttribute("aria-label", "Replay 90-second wind tunnel");
  }
  return true;
}

slides.forEach((slide, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
  dot.addEventListener("click", () => showSlide(index));
  dots?.append(dot);
});

previous?.addEventListener("click", () => showSlide(current - 1));
next?.addEventListener("click", () => showSlide(current + 1));
play?.addEventListener("click", runWindTunnel);
window.addEventListener("keydown", (event) => {
  if (
    ["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A", "IFRAME"].includes(
      event.target.tagName,
    )
  ) {
    return;
  }
  if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)) {
    event.preventDefault();
    showSlide(current + 1);
  } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    showSlide(current - 1);
  } else if (event.key === "Home") {
    event.preventDefault();
    showSlide(0);
  } else if (event.key === "End") {
    event.preventDefault();
    showSlide(slides.length - 1);
  }
});

renderEvidence();
showSlide(current, false);
window.requestAnimationFrame(() =>
  document.body.classList.remove("deck-booting"),
);
