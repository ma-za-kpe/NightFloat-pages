/*
 * Night Float — Proprietary and Confidential. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

import {
  DEFAULTS,
  EVENT_TICKS,
  MODEL_LIMITS,
  SEED,
  TICKS,
  agentHealth,
  clamp,
  comparableBaseline,
  phaseForTick,
  simulate,
  timeForTick,
} from "./sim.js";
import { DEFAULT_HORIZON, HORIZONS, projectFrames } from "./projection.js";
import { pathGeometry } from "./visual.js";

const COLORS = Object.freeze({
  gold: "#ffcf33",
  green: "#39df92",
  amber: "#ffb547",
  red: "#ff5d69",
  blue: "#55b8ff",
  purple: "#d879ff",
});
const PRESENTER_START = 35;

const state = {
  params: { ...DEFAULTS },
  tick: PRESENTER_START,
  playing: true,
  speedIndex: 1,
  speeds: [1, 4, 12],
  lastAdvance: 0,
  activeTape: null,
  baseTape: null,
  animationTime: 0,
  tour: null,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  staticCanvasSignature: "",
  horizon: DEFAULT_HORIZON,
};

const $ = (id) => document.getElementById(id);
const elements = {
  marketStaticCanvas: $("marketStaticCanvas"),
  marketCanvas: $("marketCanvas"),
  packetCanvas: $("packetCanvas"),
  chartCanvas: $("chartCanvas"),
  clock: $("clock"),
  dayLabel: $("dayLabel"),
  phaseBadge: $("phaseBadge"),
  booksBadge: $("booksBadge"),
  eventBanner: $("eventBanner"),
  playButton: $("playButton"),
  restartButton: $("restartButton"),
  nightButton: $("nightButton"),
  speedButton: $("speedButton"),
  timeline: $("timeline"),
  tourButton: $("tourButton"),
  resetButton: $("resetButton"),
  fundingModel: $("fundingModel"),
  legalWarning: $("legalWarning"),
  assumptionsButton: $("assumptionsButton"),
  assumptionsDialog: $("assumptionsDialog"),
  assumptionTable: $("assumptionTable"),
  reducedMotionToggle: $("reducedMotionToggle"),
  refusedMetric: $("refusedMetric"),
  refusedDelta: $("refusedDelta"),
  utilisedMetric: $("utilisedMetric"),
  allocatedMetric: $("allocatedMetric"),
  settledMetric: $("settledMetric"),
  defaultMetric: $("defaultMetric"),
  profitMetric: $("profitMetric"),
  feeMetric: $("feeMetric"),
  incidentCount: $("incidentCount"),
  incidentList: $("incidentList"),
  ledgerAllocated: $("ledgerAllocated"),
  ledgerUtilised: $("ledgerUtilised"),
  ledgerIdle: $("ledgerIdle"),
  ledgerCash: $("ledgerCash"),
  feeSplitSummary: $("feeSplitSummary"),
  infoPopover: $("infoPopover"),
  projectionHorizon: $("projectionHorizon"),
  projectionScope: $("projectionScope"),
  projectionAllocated: $("projectionAllocated"),
  projectionDisclaimer: $("projectionDisclaimer"),
};

const controlMap = {
  optIn: { output: "optInValue", format: (value) => `${value}%` },
  defaultRate: {
    output: "defaultRateValue",
    format: (value) => `${Number(value).toFixed(1)}%`,
  },
  facilityFee: {
    output: "facilityFeeValue",
    format: (value) => `${Number(value).toFixed(1)}%`,
  },
  demand: { output: "demandValue", format: (value) => `${value}%` },
  cashOutShare: { output: "cashOutShareValue", format: (value) => `${value}%` },
  bookCap: { output: "bookCapValue", format: (value) => `GHS ${value}k` },
  scoreThreshold: {
    output: "scoreThresholdValue",
    format: (value) => Number(value).toFixed(2),
  },
};

function money(value, compact = false) {
  const number = Number(value) || 0;
  if (compact && Math.abs(number) >= 1000000) {
    return `GHS ${(number / 1000000).toFixed(Math.abs(number) >= 10000000 ? 0 : 1)}m`;
  }
  if (compact && Math.abs(number) >= 1000) {
    return `GHS ${(number / 1000).toFixed(Math.abs(number) >= 100000 ? 0 : 1)}k`;
  }
  return `GHS ${Math.round(number).toLocaleString("en-GH")}`;
}

function resizeCanvas(canvas) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const pixelWidth = Math.max(1, Math.floor(rect.width * ratio));
  const pixelHeight = Math.max(1, Math.floor(rect.height * ratio));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width: rect.width, height: rect.height, ratio };
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(
    x,
    y,
    width,
    height,
    Math.min(radius, width / 2, height / 2),
  );
}

function marketNodes(width, height) {
  return {
    score: {
      x: width * 0.17,
      y: height * 0.115,
      label: "SCORE",
      color: "#9d7aff",
    },
    pool: {
      x: width * 0.5,
      y: height * 0.13,
      label: "MMFL POOL",
      color: COLORS.gold,
    },
    bank: {
      x: width * 0.81,
      y: height * 0.115,
      label: "FUNDER",
      color: COLORS.blue,
    },
    sweeper: {
      x: width * 0.9,
      y: height * 0.72,
      label: "SWEEPER",
      color: COLORS.green,
    },
  };
}

function drawStaticMarket() {
  const { context, width, height, ratio } = resizeCanvas(
    elements.marketStaticCanvas,
  );
  const signature = `${Math.round(width)}:${Math.round(height)}:${ratio}`;
  if (state.staticCanvasSignature === signature) return;
  state.staticCanvasSignature = signature;
  context.clearRect(0, 0, width, height);
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0b0d18");
  gradient.addColorStop(1, "#080a11");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(255,255,255,.035)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 42) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y < height; y += 42) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.strokeStyle = "rgba(120,129,151,.12)";
  context.lineWidth = 14;
  [0.27, 0.84].forEach((lineY) => {
    context.beginPath();
    context.moveTo(width * 0.08, height * lineY);
    context.lineTo(width * 0.92, height * lineY);
    context.stroke();
  });
  context.strokeStyle = "rgba(255,255,255,.07)";
  context.lineWidth = 1;
  context.setLineDash([6, 10]);
  [0.27, 0.84].forEach((lineY) => {
    context.beginPath();
    context.moveTo(width * 0.08, height * lineY);
    context.lineTo(width * 0.92, height * lineY);
    context.stroke();
  });
  context.setLineDash([]);
  const compact = width < 520;
  context.textAlign = "left";
  context.font = `800 ${compact ? 6 : 8}px system-ui`;
  context.fillStyle = "rgba(220,224,234,.38)";
  context.fillText(
    compact ? "CASH-IN BELT" : "MARKET SPINE · CASH-IN BELT",
    width * 0.09,
    height * 0.315,
  );
  context.fillText(
    compact ? "MIXED" : "LORRY EDGE · MIXED",
    width * 0.43,
    height * 0.315,
  );
  context.fillText(
    compact ? "CASH-OUT" : "RESIDENTIAL EDGE · CASH-OUT",
    width * 0.73,
    height * 0.315,
  );
}

function drawPartnerNodes(context, width, height) {
  const nodes = marketNodes(width, height);
  Object.entries(nodes).forEach(([key, node]) => {
    const parameter =
      key === "pool"
        ? "mmfl"
        : key === "bank"
          ? "bank"
          : key === "score"
            ? "score"
            : "sweep";
    const available = state.params[parameter];
    context.save();
    context.globalAlpha = available ? 1 : 0.32;
    context.fillStyle = "rgba(13,16,27,.96)";
    context.strokeStyle = available ? node.color : COLORS.red;
    context.lineWidth = 1;
    roundedRect(context, node.x - 37, node.y - 19, 74, 38, 9);
    context.fill();
    context.stroke();
    context.fillStyle = available ? node.color : COLORS.red;
    context.font = "800 8px ui-monospace, monospace";
    context.textAlign = "center";
    context.fillText(node.label, node.x, node.y + 3);
    if (key === "bank" && available) {
      context.fillStyle = "rgba(85,184,255,.62)";
      context.font = "700 5px ui-monospace, monospace";
      context.fillText("VAULT STATIC", node.x, node.y + 12);
    }
    if (!available) {
      context.font = "900 15px system-ui";
      context.fillText("×", node.x + 29, node.y - 11);
    }
    context.restore();
  });
}

function drawEntities() {
  const frame = state.activeTape?.[state.tick];
  if (!frame) return;
  const { context, width, height } = resizeCanvas(elements.marketCanvas);
  context.clearRect(0, 0, width, height);
  drawPartnerNodes(context, width, height);
  const maxCash = Math.max(...frame.agents.map((agent) => agent.cash), 1);
  frame.agents.forEach((agent) => {
    const x = agent.x * width;
    const y = agent.y * height;
    const health = agentHealth(agent, state.tick);
    const color =
      agent.cashOutRefusedNow && !agent.refusedNow
        ? COLORS.purple
        : health === "green"
          ? COLORS.green
          : health === "amber"
            ? COLORS.amber
            : health === "red"
              ? COLORS.red
              : "#555b69";
    context.save();
    if (agent.funded && state.tick >= EVENT_TICKS.release) {
      context.strokeStyle = "rgba(85,184,255,.75)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(x, y, 8.5, 0, Math.PI * 2);
      context.stroke();
    }
    if (agent.priceAccepted === false && state.tick >= EVENT_TICKS.release) {
      context.strokeStyle = "rgba(174,180,193,.7)";
      context.lineWidth = 1;
      context.setLineDash([2, 2]);
      context.beginPath();
      context.arc(x, y, 8.5, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
    }
    if (agent.facility.idle > 1 && state.tick < EVENT_TICKS.settle) {
      context.strokeStyle = "rgba(255,207,51,.42)";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(x, y, 11.2, 0, Math.PI * 2);
      context.stroke();
    }
    context.shadowColor = color;
    context.shadowBlur = health === "idle" ? 0 : 8;
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, 4.2, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    const drawerHeight = clamp((agent.cash / maxCash) * 9, 1, 9);
    context.fillStyle = "rgba(230,233,241,.35)";
    context.fillRect(x + 7, y + 5 - drawerHeight, 2, drawerHeight);
    context.fillStyle = "rgba(230,233,241,.55)";
    context.font = "650 6px ui-monospace, monospace";
    context.textAlign = "center";
    context.fillText(agent.id, x, y + 13);
    if (agent.refusedNow && !agent.frozen) {
      context.fillStyle = "#080a12";
      context.font = "900 6px system-ui";
      context.fillText("!", x, y + 2);
    } else if (agent.cashOutRefusedNow) {
      context.strokeStyle = "#080a12";
      context.lineWidth = 1;
      context.strokeRect(x - 2.2, y - 2.2, 4.4, 4.4);
    }
    if (agent.frozen) {
      context.strokeStyle = COLORS.red;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(x - 6, y - 6);
      context.lineTo(x + 6, y + 6);
      context.moveTo(x + 6, y - 6);
      context.lineTo(x - 6, y + 6);
      context.stroke();
    }
    context.restore();
  });
}

function drawPath(context, from, to, color, progress, dashed = false) {
  const { first, second, point } = pathGeometry(
    from,
    to,
    progress,
    state.reducedMotion,
  );
  context.save();
  context.strokeStyle = color;
  context.globalAlpha = dashed ? 0.4 : 0.25;
  context.lineWidth = 1;
  context.setLineDash(dashed ? [4, 7] : []);
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.bezierCurveTo(first.x, first.y, second.x, second.y, to.x, to.y);
  context.stroke();
  context.shadowColor = color;
  context.shadowBlur = state.reducedMotion ? 0 : 12;
  context.fillStyle = color;
  context.globalAlpha = 1;
  context.beginPath();
  context.arc(point.x, point.y, 2.6, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function pointForEntity(id, frame, nodes, width, height) {
  if (id === "pool") return nodes.pool;
  if (id === "sweeper") return nodes.sweeper;
  if (id === "customers") return { x: width * 0.08, y: height * 0.72 };
  const agent = frame.agents.find((candidate) => candidate.id === id);
  return agent ? { x: agent.x * width, y: agent.y * height } : nodes.pool;
}

function drawPackets() {
  const frame = state.activeTape?.[state.tick];
  if (!frame) return;
  const { context, width, height } = resizeCanvas(elements.packetCanvas);
  context.clearRect(0, 0, width, height);
  const nodes = marketNodes(width, height);
  if (state.params.score) {
    drawPath(
      context,
      nodes.score,
      nodes.pool,
      "#9d7aff",
      state.animationTime * 0.00018,
      true,
    );
  }
  frame.packets
    .slice(0, MODEL_LIMITS.maxVisiblePackets)
    .forEach((movement, index) => {
      const from = pointForEntity(movement.from, frame, nodes, width, height);
      const to = pointForEntity(movement.to, frame, nodes, width, height);
      const color =
        movement.kind === "a2a"
          ? COLORS.red
          : movement.kind === "sweep" || movement.kind === "settlement"
            ? COLORS.green
            : movement.kind === "lock"
              ? COLORS.blue
              : COLORS.gold;
      drawPath(
        context,
        from,
        to,
        color,
        state.animationTime * 0.00032 + index * 0.071,
        movement.kind === "a2a" || movement.kind === "sweep",
      );
    });
}

function drawChart() {
  const { context, width, height } = resizeCanvas(elements.chartCanvas);
  context.clearRect(0, 0, width, height);
  if (!state.activeTape || !state.baseTape) return;
  const padding = { left: 30, right: 10, top: 10, bottom: 20 };
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const active = state.activeTape.map(
    (frame) => frame.metrics.totals.refusedCashIn,
  );
  const baseline = state.baseTape.map(
    (frame) => frame.metrics.totals.refusedCashIn,
  );
  const maximum = Math.max(10, ...active, ...baseline) * 1.08;
  context.strokeStyle = "rgba(255,255,255,.07)";
  context.lineWidth = 1;
  context.font = "7px ui-monospace, monospace";
  context.fillStyle = "rgba(255,255,255,.28)";
  for (let row = 0; row <= 3; row += 1) {
    const y = padding.top + (usableHeight * row) / 3;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillText(Math.round(maximum * (1 - row / 3)), 2, y + 3);
  }
  const line = (values, color, lineWidth) => {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.beginPath();
    values.forEach((value, index) => {
      const x = padding.left + (usableWidth * index) / (TICKS - 1);
      const y = padding.top + usableHeight * (1 - value / maximum);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  };
  line(
    baseline,
    "rgba(145,151,166,.55)",
    document.body.classList.contains("baseline-emphasis") ? 3 : 1.3,
  );
  line(active, COLORS.gold, 2);
  const markerX = padding.left + (usableWidth * state.tick) / (TICKS - 1);
  context.strokeStyle = "rgba(255,255,255,.22)";
  context.setLineDash([3, 4]);
  context.beginPath();
  context.moveTo(markerX, padding.top);
  context.lineTo(markerX, padding.top + usableHeight);
  context.stroke();
  context.setLineDash([]);
}

function renderClock() {
  const [phase, phaseClass] = phaseForTick(state.tick);
  elements.clock.textContent = timeForTick(state.tick);
  elements.dayLabel.textContent = state.tick < 12 ? "DAY 0" : "NEXT DAY";
  elements.phaseBadge.textContent = phase;
  elements.phaseBadge.dataset.phase = phaseClass;
  elements.timeline.value = state.tick;
  elements.playButton.textContent = state.playing ? "Ⅱ" : "▶";
}

function renderBooks(frame) {
  const books = frame.books;
  elements.booksBadge.textContent = books.ok ? "BOOKS OK" : "BOOKS BROKEN";
  elements.booksBadge.className = `books-badge ${books.ok ? "ok" : "broken"}`;
  elements.ledgerAllocated.textContent = money(frame.metrics.allocated, true);
  elements.ledgerUtilised.textContent = money(
    frame.metrics.totals.utilisedPrincipal,
    true,
  );
  elements.ledgerIdle.textContent = money(
    frame.metrics.totals.idleAllocated,
    true,
  );
  elements.ledgerCash.textContent = money(
    frame.metrics.totals.drawerCash,
    true,
  );
}

function renderMetrics() {
  const frame = state.activeTape[state.tick];
  const baseline = state.baseTape[state.tick];
  const projection = projectFrames(frame, baseline, state.horizon);
  const avoided = projection.avoidedCashIn;
  const periodSuffix =
    projection.days === 1
      ? "this modeled day"
      : `across ${projection.days.toLocaleString("en-GH")} modeled days`;
  elements.refusedMetric.textContent =
    projection.refusedCashIn.toLocaleString("en-GH");
  elements.refusedDelta.textContent =
    state.params.scenario === "off"
      ? `${money(projection.emergencyA2A, true)} bounded emergency A2A · ${periodSuffix}`
      : `${Math.max(0, avoided).toLocaleString("en-GH")} avoided vs identical baseline · ${periodSuffix}`;
  elements.refusedDelta.className =
    state.params.scenario !== "off" && avoided > 0 ? "positive" : "";
  elements.utilisedMetric.textContent = `${Math.round(projection.utilisationRate)}%`;
  elements.allocatedMetric.textContent = `${money(projection.allocatedVolume, true)} allocation volume · ${money(projection.idleAllocated, true)} idle volume · ${projection.priceRejectedAgentDays.toLocaleString("en-GH")} declined agent-days`;
  elements.settledMetric.textContent =
    projection.settlementRate === null
      ? "—"
      : `${projection.settlementRate.toFixed(1)}%`;
  elements.defaultMetric.textContent =
    projection.settlementRate === null
      ? "Settlement pending"
      : `${projection.frozenEvents.toLocaleString("en-GH")} freeze events · ${money(projection.defaultedPrincipal, true)} unresolved principal`;
  elements.defaultMetric.className =
    projection.defaultedPrincipal > 0
      ? "negative"
      : projection.settlementRate !== null
        ? "positive"
        : "";
  elements.profitMetric.textContent = money(projection.systemResult, true);
  elements.profitMetric.style.color =
    projection.systemResult < 0 ? COLORS.red : "";
  const split = projection.feeWaterfall;
  const customerShare =
    state.params.fundingModel === "customer"
      ? ` · User fee_share ${money(split.customerFeeShare, true)}`
      : "";
  elements.feeMetric.textContent = `Fees ${money(projection.grossFees, true)} · Funder ${money(split.fundingPartner, true)} · MMFL ${money(split.mmfl, true)} · Platform ${money(split.platform, true)}${customerShare}`;
  elements.projectionScope.textContent = `${projection.days.toLocaleString("en-GH")} modeled ${projection.days === 1 ? "day" : "days"}`;
  elements.projectionAllocated.textContent = `${money(projection.allocatedVolume, true)} allocation volume`;
  elements.projectionDisclaimer.textContent = `${projection.label} · same selected day repeated · live market and books stay daily · model projection, not a forecast`;
  renderBooks(frame);
}

function renderIncidents() {
  const incidents = state.activeTape[state.tick].incidents.slice().reverse();
  elements.incidentCount.textContent = incidents.length;
  if (!incidents.length) {
    elements.incidentList.innerHTML =
      '<div class="incident-empty">No incidents yet.<br>Advance the clock or toggle a partner outage.</div>';
    return;
  }
  elements.incidentList.innerHTML = incidents
    .map(
      (incident) =>
        `<article class="incident-item ${incident.severity}" data-code="${incident.code}"><time>${incident.timestamp}</time><div><strong>${incident.entity} · ${incident.code}</strong><p><b>Event:</b> ${incident.event}. ${incident.immediate_consequence}</p><dl><div><dt>Safeguard</dt><dd>${incident.safeguard}</dd></div><div><dt>Residual</dt><dd>${incident.residual_exposure}</dd></div><div><dt>Decision</dt><dd>${incident.decision_required}</dd></div></dl></div></article>`,
    )
    .join("");
}

function renderBanner() {
  const bannerMap = {
    0: ["21:00 · FORECAST WINDOW", false],
    34: ["05:30 · PARTNER APPROVAL", false],
    36: [
      state.params.scenario === "off"
        ? "06:00 · NO SCHEDULED RELEASE"
        : "06:00 · NIGHT FLOAT RELEASE",
      state.params.scenario === "off",
    ],
    56: [
      state.params.scenario === "stress"
        ? "11:00 · RISK SIGNAL"
        : "11:00 · MIDDAY CHECK",
      state.params.scenario === "stress",
    ],
    76: [
      state.params.sweep && state.params.scenario !== "stress"
        ? "16:00 · DUSK SWEEP"
        : "16:00 · SWEEP FAILED",
      !state.params.sweep || state.params.scenario === "stress",
    ],
    84: [
      state.activeTape[state.tick].metrics.frozen
        ? `${state.activeTape[state.tick].metrics.frozen} TILLS OUT OF TOMORROW'S FILE`
        : "18:00 · SETTLEMENT",
      state.activeTape[state.tick].metrics.frozen > 0,
    ],
  };
  const entry = bannerMap[state.tick];
  if (!entry) {
    elements.eventBanner.classList.remove("show", "danger");
    return;
  }
  elements.eventBanner.textContent = entry[0];
  elements.eventBanner.classList.toggle("danger", entry[1]);
  elements.eventBanner.classList.add("show");
}

function renderAssumptions() {
  const frame = state.activeTape[state.tick];
  const rows = [
    ["Seed", SEED],
    ["Clock", "96 × 15 minutes"],
    [
      "Projection horizon",
      `${HORIZONS.find((horizon) => horizon.key === state.horizon).label} · repeated-day arithmetic`,
    ],
    ["Presenter start", "05:45"],
    [
      "Funding",
      state.params.fundingModel === "partner"
        ? "Partner-backed"
        : "Customer-supported · unresolved",
    ],
  ];
  rows.push(
    [
      "Facility fee",
      `${state.params.facilityFee.toFixed(1)}% of utilised principal`,
    ],
    ["Book cap", money(state.params.bookCap * 1000)],
    ["Default risk", `${state.params.defaultRate.toFixed(1)}%`],
    ["Demand", `${state.params.demand}%`],
    ["Corridor mix", `${state.params.cashOutShare}% cash-out-heavy`],
    ["Score threshold", state.params.scoreThreshold.toFixed(2)],
    [
      "A2A rule",
      `≤ GHS ${MODEL_LIMITS.a2aMaxHop}, ${MODEL_LIMITS.a2aMaxHopsPerAgent} hops, 15 min`,
    ],
    ["Books", frame.books.ok ? "Both identities pass" : "BROKEN"],
  );
  elements.assumptionTable.innerHTML = rows
    .map(
      ([label, value]) =>
        `<div><span>${label}</span><strong>${value}</strong></div>`,
    )
    .join("");
  elements.reducedMotionToggle.checked = state.reducedMotion;
}

function renderAll() {
  if (!state.activeTape || !state.baseTape) return;
  drawStaticMarket();
  renderClock();
  renderMetrics();
  renderIncidents();
  drawEntities();
  drawPackets();
  drawChart();
  renderBanner();
  renderAssumptions();
}

function recompute() {
  try {
    state.activeTape = simulate(state.params);
    state.baseTape = comparableBaseline(state.params);
    renderAll();
  } catch (error) {
    elements.booksBadge.textContent = "BOOKS BROKEN";
    elements.booksBadge.className = "books-badge broken";
    state.playing = false;
    elements.eventBanner.textContent = error.message;
    elements.eventBanner.classList.add("show", "danger");
    return false;
  }
  return true;
}

function feeSplitCopy() {
  return state.params.fundingModel === "customer"
    ? "Users fee_share 32% · MMFL 26% · Platform 22% · Operations 20%"
    : "Funder 38% · MMFL 27% · Platform 22% · Operations 13%";
}

function syncMotionMode() {
  document.body.classList.toggle("reduced-motion", state.reducedMotion);
  elements.reducedMotionToggle.checked = state.reducedMotion;
}

function syncControls() {
  Object.entries(controlMap).forEach(([key, config]) => {
    $(key).value = state.params[key];
    $(config.output).textContent = config.format(state.params[key]);
  });
  elements.fundingModel.value = state.params.fundingModel;
  elements.projectionHorizon.value = state.horizon;
  elements.legalWarning.hidden = state.params.fundingModel !== "customer";
  const customerControl = document.querySelector(".customer-only");
  customerControl.classList.toggle(
    "disabled",
    state.params.fundingModel !== "customer",
  );
  $("optIn").disabled = state.params.fundingModel !== "customer";
  elements.feeSplitSummary.textContent = feeSplitCopy();
  $("mmflToggle").checked = state.params.mmfl;
  $("bankToggle").checked = state.params.bank;
  $("scoreToggle").checked = state.params.score;
  $("sweepToggle").checked = state.params.sweep;
  document
    .querySelectorAll(".scenario-button")
    .forEach((button) =>
      button.classList.toggle(
        "active",
        button.dataset.scenario === state.params.scenario,
      ),
    );
}

function applyScenario(scenario, { play = true } = {}) {
  state.params.scenario = scenario;
  if (scenario === "off" || scenario === "on") {
    Object.assign(state.params, {
      defaultRate: 2,
      mmfl: true,
      bank: true,
      score: true,
      sweep: true,
    });
  } else {
    Object.assign(state.params, {
      defaultRate: 12,
      sweep: false,
      mmfl: true,
      bank: true,
      score: true,
      bookCap: 70,
    });
  }
  state.tick = PRESENTER_START;
  state.playing = play;
  syncControls();
  recompute();
}

function openAssumptions() {
  renderAssumptions();
  if (!elements.assumptionsDialog.open) elements.assumptionsDialog.showModal();
}

function showInfo(button) {
  const message = button.dataset.info;
  const rect = button.getBoundingClientRect();
  elements.infoPopover.textContent = message;
  elements.infoPopover.hidden = false;
  const width = Math.min(320, window.innerWidth - 24);
  const left = clamp(
    rect.left + rect.width / 2 - width / 2,
    12,
    window.innerWidth - width - 12,
  );
  const preferredTop = rect.bottom + 8;
  elements.infoPopover.style.left = `${left}px`;
  elements.infoPopover.style.top = `${Math.min(preferredTop, window.innerHeight - 130)}px`;
}

function setupInfoButtons() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".info-button");
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      showInfo(button);
      return;
    }
    if (!event.target.closest("#infoPopover")) {
      elements.infoPopover.hidden = true;
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") elements.infoPopover.hidden = true;
  });
}

function jumpToAct(act) {
  if (act === 1) applyScenario("off", { play: false });
  if (act === 2) applyScenario("on", { play: false });
  if (act === 3) {
    applyScenario("on", { play: false });
    state.params.cashOutShare = 50;
    state.tick = 44;
    syncControls();
    recompute();
  }
  if (act === 4) {
    applyScenario("stress", { play: false });
    state.tick = 83;
    renderAll();
  }
  if (act === 5) openAssumptions();
}

function setupPresenterKeys() {
  window.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (
      ["INPUT", "SELECT", "TEXTAREA"].includes(tag) ||
      elements.assumptionsDialog.open
    ) {
      return;
    }
    if (/^[1-5]$/.test(event.key)) {
      jumpToAct(Number(event.key));
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      state.playing = !state.playing;
      renderClock();
      return;
    }
    if (event.key === "[") {
      state.playing = false;
      state.tick = clamp(state.tick - 1, 0, TICKS - 1);
      renderAll();
      return;
    }
    if (event.key === "]") {
      state.playing = false;
      state.tick = clamp(state.tick + 1, 0, TICKS - 1);
      renderAll();
      return;
    }
    if (event.key.toLowerCase() === "b") {
      document.body.classList.toggle("baseline-emphasis");
      drawChart();
    }
  });
}

function setupControls() {
  Object.entries(controlMap).forEach(([key, config]) => {
    $(key).addEventListener("input", (event) => {
      state.params[key] = Number(event.target.value);
      $(config.output).textContent = config.format(state.params[key]);
      recompute();
    });
  });
  elements.fundingModel.addEventListener("change", (event) => {
    state.params.fundingModel = event.target.value;
    syncControls();
    recompute();
  });
  elements.projectionHorizon.addEventListener("change", (event) => {
    state.horizon = event.target.value;
    renderAll();
  });
  const toggles = {
    mmflToggle: "mmfl",
    bankToggle: "bank",
    scoreToggle: "score",
    sweepToggle: "sweep",
  };
  Object.entries(toggles).forEach(([id, key]) =>
    $(id).addEventListener("change", (event) => {
      state.params[key] = event.target.checked;
      recompute();
    }),
  );
  document
    .querySelectorAll(".scenario-button")
    .forEach((button) =>
      button.addEventListener("click", () =>
        applyScenario(button.dataset.scenario),
      ),
    );
  elements.playButton.addEventListener("click", () => {
    state.playing = !state.playing;
    renderClock();
  });
  elements.restartButton.addEventListener("click", () => {
    state.tick = PRESENTER_START;
    state.playing = false;
    state.tour = null;
    renderAll();
  });
  elements.nightButton.addEventListener("click", () => {
    state.tick = 0;
    state.playing = false;
    state.tour = null;
    renderAll();
  });
  elements.timeline.addEventListener("input", (event) => {
    state.tick = Number(event.target.value);
    state.playing = false;
    state.tour = null;
    renderAll();
  });
  elements.speedButton.addEventListener("click", () => {
    state.speedIndex = (state.speedIndex + 1) % state.speeds.length;
    elements.speedButton.textContent = `${state.speeds[state.speedIndex]}×`;
  });
  elements.resetButton.addEventListener("click", () => {
    state.params = { ...DEFAULTS };
    state.horizon = DEFAULT_HORIZON;
    state.tick = PRESENTER_START;
    state.tour = null;
    state.playing = false;
    syncControls();
    recompute();
  });
  elements.assumptionsButton.addEventListener("click", openAssumptions);
  $("printAssumptions").addEventListener("click", () => window.print());
  elements.reducedMotionToggle.addEventListener("change", (event) => {
    state.reducedMotion = event.target.checked;
    syncMotionMode();
    drawPackets();
  });
  elements.tourButton.addEventListener("click", startTour);
  window.addEventListener("resize", () => {
    state.staticCanvasSignature = "";
    renderAll();
  });
}

function loadShareableView() {
  const query = new URLSearchParams(window.location.search);
  const scenario = query.get("scenario");
  if (["off", "on", "stress"].includes(scenario)) {
    state.params.scenario = scenario;
    if (scenario === "stress") {
      Object.assign(state.params, {
        defaultRate: 12,
        sweep: false,
        bookCap: 70,
      });
    }
  }
  const fundingModel = query.get("funding");
  if (["partner", "customer"].includes(fundingModel)) {
    state.params.fundingModel = fundingModel;
  }
  const horizon = query.get("horizon");
  if (HORIZONS.some((candidate) => candidate.key === horizon)) {
    state.horizon = horizon;
  }
  Object.keys(controlMap).forEach((key) => {
    if (query.has(key) && Number.isFinite(Number(query.get(key)))) {
      state.params[key] = Number(query.get(key));
    }
  });
  ["mmfl", "bank", "score", "sweep"].forEach((key) => {
    if (query.has(key)) {
      state.params[key] = !["0", "false", "off"].includes(
        query.get(key).toLowerCase(),
      );
    }
  });
  if (query.has("time")) {
    state.tick = clamp(Number(query.get("time")) || 0, 0, TICKS - 1);
    state.playing = false;
  }
  if (query.get("motion") === "reduce") state.reducedMotion = true;
  if (query.get("deck") === "1") document.body.classList.add("deck-mode");
  if (query.get("embed") === "1") document.body.classList.add("embed-mode");
  return query;
}

function startTour() {
  if (state.tour) {
    state.tour = null;
    state.playing = false;
    elements.tourButton.innerHTML =
      '<span class="play-icon">▶</span> Guided run';
    renderAll();
    return;
  }
  state.tour = { step: 0, holdUntil: 0, startedAt: performance.now() };
  state.speedIndex = 2;
  elements.speedButton.textContent = "12×";
  applyScenario("off");
  state.tick = PRESENTER_START;
  state.playing = true;
  elements.tourButton.textContent = "■ Stop guided run";
}

function progressTour(now) {
  if (!state.tour) return;
  if (now - state.tour.startedAt > 90000) {
    state.playing = false;
    state.tour = null;
    elements.tourButton.innerHTML =
      '<span class="play-icon">▶</span> Guided run';
    return;
  }
  if (state.tour.step === 0 && state.tick >= 52) {
    state.playing = false;
    state.tour.step = 1;
    state.tour.holdUntil = now + 2200;
  } else if (state.tour.step === 1 && now >= state.tour.holdUntil) {
    applyScenario("on");
    state.tick = PRESENTER_START;
    state.tour = { ...state.tour, step: 2, holdUntil: 0 };
  } else if (state.tour.step === 2 && state.tick >= 52) {
    state.playing = false;
    state.tour.step = 3;
    state.tour.holdUntil = now + 2200;
  } else if (state.tour.step === 3 && now >= state.tour.holdUntil) {
    applyScenario("on");
    state.params.cashOutShare = 50;
    state.tick = 43;
    syncControls();
    recompute();
    state.tour = { ...state.tour, step: 4, holdUntil: now + 2200 };
  } else if (state.tour.step === 4 && now >= state.tour.holdUntil) {
    applyScenario("stress");
    state.tick = 73;
    state.tour = { ...state.tour, step: 5, holdUntil: 0 };
  } else if (state.tour.step === 5 && state.tick >= 88) {
    state.playing = false;
    state.tour = null;
    elements.tourButton.innerHTML =
      '<span class="play-icon">▶</span> Guided run';
    renderAll();
  }
}

function animationLoop(now) {
  state.animationTime = now;
  progressTour(now);
  if (state.playing) {
    const interval = 1100 / state.speeds[state.speedIndex];
    if (now - state.lastAdvance >= interval) {
      state.lastAdvance = now;
      state.tick = state.tick >= TICKS - 1 ? PRESENTER_START : state.tick + 1;
      renderAll();
    } else if (!state.reducedMotion) {
      drawPackets();
    }
  }
  requestAnimationFrame(animationLoop);
}

const query = loadShareableView();
syncMotionMode();
syncControls();
setupInfoButtons();
setupControls();
setupPresenterKeys();
recompute();
if (query.get("assumptions") === "1") openAssumptions();
if (query.get("tour") === "1") startTour();
requestAnimationFrame(animationLoop);
