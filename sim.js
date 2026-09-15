/*
 * Night Float — Proprietary public demonstration · source-visible · no reuse licence. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

export const TICKS = 96;
export const TICK_COUNT = TICKS;
export const AGENT_COUNT = 50;
export const SEED = 2026;
export const EVENT_TICKS = Object.freeze({
  forecast: 0,
  lock: 0,
  approval: 34,
  preflight: 34,
  release: 36,
  midday: 52,
  stress: 56,
  sweep: 76,
  settle: 84,
  close: 95,
});
export const EXPLAINER =
  "Seed 2026 · partner-backed default · fictional model data · cash-in comparison only · coded principal, fee, and safeguarding identities checked every tick · customer funding identity unresolved";

export const DEFAULTS = Object.freeze({
  scenario: "on",
  fundingModel: "partner",
  optIn: 36,
  defaultRate: 2,
  facilityFee: 0.5,
  demand: 100,
  cashOutShare: 10,
  bookCap: 100,
  scoreThreshold: 0.68,
  mmfl: true,
  bank: true,
  score: true,
  sweep: true,
});

export const PARAMETER_RULES = Object.freeze({
  optIn: Object.freeze({ min: 0, max: 80, step: 1 }),
  defaultRate: Object.freeze({ min: 0, max: 20, step: 0.5 }),
  facilityFee: Object.freeze({ min: 0.1, max: 1.2, step: 0.1 }),
  demand: Object.freeze({ min: 50, max: 180, step: 5 }),
  cashOutShare: Object.freeze({ min: 0, max: 100, step: 5 }),
  bookCap: Object.freeze({ min: 20, max: 500, step: 10 }),
  scoreThreshold: Object.freeze({ min: 0.5, max: 0.9, step: 0.02 }),
});

export const SCENARIO_PRESETS = Object.freeze({
  off: Object.freeze({
    scenario: "off",
    defaultRate: 2,
    bookCap: 100,
    mmfl: true,
    bank: true,
    score: true,
    sweep: true,
  }),
  on: Object.freeze({
    scenario: "on",
    defaultRate: 2,
    bookCap: 100,
    mmfl: true,
    bank: true,
    score: true,
    sweep: true,
  }),
  stress: Object.freeze({
    scenario: "stress",
    defaultRate: 12,
    bookCap: 70,
    mmfl: true,
    bank: true,
    score: true,
    sweep: false,
  }),
});

const BOOLEAN_PARAMETERS = Object.freeze(["mmfl", "bank", "score", "sweep"]);
const FUNDING_MODELS = Object.freeze(["partner", "customer"]);

export function normaliseScenario(value) {
  if (value === "baseline") return "off";
  if (value === "dawn") return "on";
  if (Object.hasOwn(SCENARIO_PRESETS, value)) return value;
  throw new RangeError(`Unknown scenario: ${value}`);
}

function snapToStep(value, { min, max, step }) {
  const bounded = clamp(value, min, max);
  const snapped = min + Math.round((bounded - min) / step) * step;
  return Number(snapped.toFixed(8));
}

export function normaliseConfig(input = {}, { mode = "strict" } = {}) {
  const requested = input.scenario ?? DEFAULTS.scenario;
  let scenario;
  try {
    scenario = normaliseScenario(requested);
  } catch (error) {
    if (mode === "strict") throw error;
    scenario = DEFAULTS.scenario;
  }
  const merged = {
    ...DEFAULTS,
    ...SCENARIO_PRESETS[scenario],
    ...input,
    scenario,
  };
  for (const [name, rule] of Object.entries(PARAMETER_RULES)) {
    const value = Number(merged[name]);
    const valid =
      Number.isFinite(value) && value >= rule.min && value <= rule.max;
    const snapped = valid ? snapToStep(value, rule) : null;
    const onStep = valid && Math.abs(snapped - value) < 1e-8;
    if (mode === "strict" && (!valid || !onStep)) {
      throw new RangeError(
        `${name} must be ${rule.min}–${rule.max} in steps of ${rule.step}`,
      );
    }
    merged[name] =
      mode === "strict" ? value : snapToStep(value || rule.min, rule);
  }
  if (!FUNDING_MODELS.includes(merged.fundingModel)) {
    if (mode === "strict") throw new RangeError("Unknown funding model");
    merged.fundingModel = DEFAULTS.fundingModel;
  }
  for (const name of BOOLEAN_PARAMETERS) {
    if (typeof merged[name] !== "boolean") {
      if (mode === "strict") throw new TypeError(`${name} must be boolean`);
      merged[name] = Boolean(merged[name]);
    }
  }
  return merged;
}

export function scenarioConfig(scenario, overrides = {}) {
  return normaliseConfig({ ...overrides, scenario });
}

export function normaliseTick(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return EVENT_TICKS.preflight + 1;
  return Math.round(clamp(number, 0, TICKS - 1));
}

export const MODEL_LIMITS = Object.freeze({
  maxPacketAmount: 3500,
  maxVisiblePackets: 200,
  a2aMaxHop: 400,
  a2aMaxHopsPerAgent: 2,
  a2aDelayTicks: 1,
  agentCashReserve: 500,
  safeguardedCustomerBalance: 270000,
});

export const FEE_WATERFALLS = Object.freeze({
  partner: Object.freeze({
    fundingPartner: 0.38,
    mmfl: 0.27,
    platform: 0.22,
    operations: 0.13,
    customerFeeShare: 0,
  }),
  customer: Object.freeze({
    fundingPartner: 0,
    mmfl: 0.26,
    platform: 0.22,
    operations: 0.2,
    customerFeeShare: 0.32,
  }),
});

export function feeWaterfallRates(fundingModel = DEFAULTS.fundingModel) {
  const rates = FEE_WATERFALLS[fundingModel];
  if (!rates) throw new RangeError(`Unknown funding model: ${fundingModel}`);
  return rates;
}

export function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function timeForTick(tick) {
  const minutes = (21 * 60 + tick * 15) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function hourForTick(tick) {
  return ((21 * 60 + tick * 15) % 1440) / 60;
}

export function phaseForTick(tick) {
  if (tick < 12) return ["NIGHT WINDOW", "night"];
  if (tick < 34) return ["MARKET ASLEEP", "night"];
  if (tick < 36) return ["PRE-OPEN", "ready"];
  if (tick < 56) return ["MORNING PEAK", "live"];
  if (tick < 76) return ["TRADING", "live"];
  if (tick < 84) return ["DUSK SWEEP", "ready"];
  return ["SETTLEMENT", "settle"];
}

export function cashInFactor(hour) {
  if (hour >= 6 && hour < 8.5) return 1.15;
  if (hour >= 8.5 && hour < 11) return 0.85;
  if (hour >= 11 && hour < 15) return 0.48;
  if (hour >= 15 && hour < 18.5) return 0.34;
  return 0.025;
}

export function cashOutFactor(hour) {
  if (hour >= 6 && hour < 9) return 0.24;
  if (hour >= 9 && hour < 12) return 0.45;
  if (hour >= 12 && hour < 17.5) return 0.82;
  if (hour >= 17.5 && hour < 19.5) return 0.5;
  return 0.02;
}

export function getFeeWaterfall(grossFees, fundingModel) {
  const shares = FEE_WATERFALLS[fundingModel] || FEE_WATERFALLS.partner;
  const entries = Object.entries(shares);
  const waterfall = Object.fromEntries(
    entries.map(([name, ratio]) => [name, roundMoney(grossFees * ratio)]),
  );
  const distributed = Object.values(waterfall).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  waterfall.operations = roundMoney(
    waterfall.operations + roundMoney(grossFees) - roundMoney(distributed),
  );
  return waterfall;
}

export function expectedMorningNeed(agent, params) {
  const base =
    agent.type === "cashin" ? 4700 : agent.type === "mixed" ? 2600 : 600;
  return base * agent.scale * (params.demand / 100);
}

export function agentHealth(agent, tick) {
  if (agent.frozen || agent.refusedNow) return "red";
  if (hourForTick(tick) < 6 || hourForTick(tick) >= 19.5) return "idle";
  const expectedHour =
    agent.type === "cashin"
      ? 950 * agent.scale
      : agent.type === "mixed"
        ? 520 * agent.scale
        : 130 * agent.scale;
  if (agent.ownEfloat + agent.facility.idle < expectedHour * 0.55) {
    return "amber";
  }
  return "green";
}

function poissonish(rate, randomValue) {
  return Math.max(0, Math.round(rate * (0.72 + randomValue * 0.62)));
}

function addIncident(incidents, tick, severity, title, body, code = title) {
  if (!incidents.some((item) => item.tick === tick && item.code === code)) {
    incidents.push({
      tick,
      timestamp: timeForTick(tick),
      severity,
      entity: code.includes("-") ? code.split("-").at(-1) : "SYSTEM",
      code,
      event: title,
      title,
      immediate_consequence: body,
      body,
      safeguard:
        "The model records the event, preserves both accounting identities, and prevents unsupported value movement.",
      residual_exposure:
        severity === "danger"
          ? "Exposure remains visible until the affected dependency or principal shortfall is resolved."
          : "No hidden balance adjustment is assumed.",
      decision_required:
        severity === "info"
          ? "Confirm the assumption before pilot approval."
          : "Review the affected rule before the next allocation window.",
    });
  }
}

function packet({
  id,
  from,
  to,
  amount,
  principalSource,
  legalClaim,
  state,
  createdTick,
  etaTick,
  agentId = null,
  kind,
  senderBalanceAfterHop = null,
}) {
  return {
    id,
    from,
    to,
    amount: roundMoney(amount),
    principal_source: principalSource,
    legal_claim: legalClaim,
    state,
    created_tick: createdTick,
    eta_tick: etaTick,
    agent_id: agentId,
    kind,
    sender_balance_after_hop: senderBalanceAfterHop,
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export function createWorld(params = DEFAULTS) {
  const merged = normaliseConfig(params);
  const random = mulberry32(SEED);
  const cashOutCount = Math.round((AGENT_COUNT * merged.cashOutShare) / 100);
  const mixedCount = Math.min(15, AGENT_COUNT - cashOutCount);
  const cashInCount = AGENT_COUNT - cashOutCount - mixedCount;
  const types = [
    ...Array(cashInCount).fill("cashin"),
    ...Array(mixedCount).fill("mixed"),
    ...Array(cashOutCount).fill("cashout"),
  ];

  for (let index = types.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [types[index], types[swapIndex]] = [types[swapIndex], types[index]];
  }

  const agents = Array.from({ length: AGENT_COUNT }, (_, index) => {
    const col = index % 10;
    const row = Math.floor(index / 10);
    const type = types[index];
    const eFloatRanges = {
      cashin: [360, 1050],
      mixed: [700, 1500],
      cashout: [1400, 2900],
    };
    const cashRanges = {
      cashin: [2200, 6200],
      mixed: [1700, 4700],
      cashout: [450, 1600],
    };
    const range = ([minimum, maximum]) =>
      minimum + random() * (maximum - minimum);
    const ownEfloat = range(eFloatRanges[type]);
    const cash = range(cashRanges[type]);
    return {
      id: `A${String(index + 1).padStart(2, "0")}`,
      type,
      zone:
        col < 4 ? "Market spine" : col < 7 ? "Lorry edge" : "Residential edge",
      x: 0.115 + col * 0.079 + (random() - 0.5) * 0.026,
      y: 0.34 + row * 0.105 + (random() - 0.5) * 0.03,
      ownEfloat,
      initialEfloat: ownEfloat,
      cash,
      initialCash: cash,
      score: 0.54 + random() * 0.44,
      feeTolerance: 0.35 + random() * 0.73,
      riskRoll: random() * 100,
      scale: 0.72 + random() * 0.68,
      facility: {
        principal_source: "none",
        legal_claim: "none",
        state: "released",
        allocated: 0,
        idle: 0,
        utilised: 0,
        repaid: 0,
        defaulted: 0,
      },
      feeDue: 0,
      feePaid: 0,
      feeReceivable: 0,
      feeWrittenOff: 0,
      settled: 0,
      shortfall: 0,
      servedCashIn: 0,
      refusedCashIn: 0,
      servedCashOut: 0,
      refusedCashOut: 0,
      emergencyA2A: 0,
      a2aHops: 0,
      refusedNow: false,
      cashOutRefusedNow: false,
      frozen: false,
      nextEligible: true,
      funded: false,
      priceAccepted: null,
    };
  });

  const demand = Array.from({ length: TICKS }, () =>
    agents.map(() => ({
      inNoise: random(),
      outNoise: random(),
      inValue: 65 + random() * 115,
      outValue: 70 + random() * 150,
    })),
  );

  const lockEligible = Math.round((2000 * merged.optIn) / 100);
  const customers = [
    { id: "cash-in", label: "Cash-in / supplier-pay", count: 920 },
    { id: "cash-out", label: "Cash-out / notes-home", count: 1080 },
    {
      id: "lock-eligible",
      label: "Overnight lock-eligible subset",
      count: lockEligible,
      subset: true,
    },
  ];
  return { agents, demand, customers };
}

export function buildBooks({
  capacity,
  allocated,
  agents,
  settledPrincipal,
  defaultedPrincipal,
  fundingModel,
  customerCapacity,
  accruedFees = 0,
  collectedFees = 0,
  feeReceivable = 0,
  feeWrittenOff = 0,
}) {
  const closed = agents.some(
    (agent) =>
      agent.facility.state === "repaid" || agent.facility.state === "defaulted",
  );
  const idleAllocated = closed
    ? 0
    : agents.reduce((sum, agent) => sum + agent.facility.idle, 0);
  const utilisedPrincipal = closed
    ? 0
    : agents.reduce((sum, agent) => sum + agent.facility.utilised, 0);
  const poolUnallocated = Math.max(0, capacity - allocated);
  const facilityAssets =
    poolUnallocated +
    idleAllocated +
    utilisedPrincipal +
    settledPrincipal +
    defaultedPrincipal;
  const facilityDelta = roundMoney(capacity - facilityAssets);
  const customerClaims = MODEL_LIMITS.safeguardedCustomerBalance;
  const safeguardedVaultBalance = customerClaims;
  const customerLoss = 0;
  const customerDelta = roundMoney(
    customerClaims - safeguardedVaultBalance - customerLoss,
  );
  const feeDelta = roundMoney(
    accruedFees - collectedFees - feeReceivable - feeWrittenOff,
  );
  const identifiedFundingAsset = fundingModel === "partner" ? capacity : 0;
  const crossLedgerDelta = roundMoney(capacity - identifiedFundingAsset);
  const arithmeticOk =
    Math.abs(facilityDelta) <= 0.02 &&
    Math.abs(customerDelta) <= 0.02 &&
    Math.abs(feeDelta) <= 0.02;
  return {
    facility: {
      sourcePrincipal: roundMoney(capacity),
      poolUnallocated: roundMoney(poolUnallocated),
      idleAllocated: roundMoney(idleAllocated),
      utilisedPrincipal: roundMoney(utilisedPrincipal),
      settledPrincipal: roundMoney(settledPrincipal),
      explainedLoss: roundMoney(defaultedPrincipal),
      delta: facilityDelta,
    },
    safeguarding: {
      customerClaims: roundMoney(customerClaims),
      safeguardedVaultBalance: roundMoney(safeguardedVaultBalance),
      explainedCustomerLoss: customerLoss,
      delta: customerDelta,
    },
    fees: {
      accrued: roundMoney(accruedFees),
      collected: roundMoney(collectedFees),
      receivable: roundMoney(feeReceivable),
      writtenOff: roundMoney(feeWrittenOff),
      delta: feeDelta,
    },
    crossLedger: {
      requiredFacilityFunding: roundMoney(capacity),
      identifiedFundingAsset: roundMoney(identifiedFundingAsset),
      unresolvedFundingGap: crossLedgerDelta,
      status: fundingModel === "partner" ? "separate" : "unresolved",
      lossBearer: fundingModel === "partner" ? "agent-liability" : "unassigned",
      unresolvedPrincipal: roundMoney(defaultedPrincipal),
      customerLockCapacity: roundMoney(customerCapacity),
    },
    ok: arithmeticOk,
    complete: arithmeticOk && Math.abs(crossLedgerDelta) <= 0.02,
    status: !arithmeticOk
      ? "broken"
      : Math.abs(crossLedgerDelta) > 0.02
        ? "unresolved"
        : "reconciled",
  };
}

export function assertBooks(books) {
  const ledger = books?.books || books;
  if (!ledger?.ok) {
    const error = new Error(
      `BOOKS BROKEN: facility delta ${ledger?.facility?.delta ?? "unknown"}; customer delta ${ledger?.safeguarding?.delta ?? "unknown"}`,
    );
    error.code = "BOOKS_BROKEN";
    throw error;
  }
  return true;
}

export function idleAllocated(tick) {
  return (
    tick?.metrics?.idleAllocated ?? tick?.metrics?.totals?.idleAllocated ?? 0
  );
}

function consumeEfloat(agent, amount) {
  const fromOwn = Math.min(agent.ownEfloat, amount);
  agent.ownEfloat -= fromOwn;
  const fromFacility = Math.min(agent.facility.idle, amount - fromOwn);
  agent.facility.idle -= fromFacility;
  agent.facility.utilised += fromFacility;
  if (fromFacility > 0) agent.facility.state = "utilised";
}

function addEfloat(agent, amount) {
  agent.ownEfloat += amount;
}

export function processCashIn(agent, amount) {
  if (agent.ownEfloat + agent.facility.idle < amount) {
    agent.refusedCashIn += 1;
    agent.refusedNow = true;
    return false;
  }
  consumeEfloat(agent, amount);
  agent.cash += amount;
  agent.servedCashIn += 1;
  return true;
}

export function processCashOut(agent, amount) {
  if (agent.cash < amount) {
    agent.refusedCashOut += 1;
    agent.cashOutRefusedNow = true;
    return false;
  }
  agent.cash -= amount;
  addEfloat(agent, amount);
  agent.servedCashOut += 1;
  return true;
}

export function sweepAgent(agent) {
  const allocated = agent.facility.allocated ?? agent.facility.utilised ?? 0;
  const settlementDue = allocated + (agent.feeDue ?? 0);
  const availableEfloat = (agent.facility.idle ?? 0) + agent.ownEfloat;
  const settlementGap = Math.max(0, settlementDue - availableEfloat);
  const availableCash = Math.max(0, agent.cash - MODEL_LIMITS.agentCashReserve);
  const swept = Math.min(settlementGap, availableCash);
  agent.cash -= swept;
  addEfloat(agent, swept);
  return swept;
}

export function simulate(inputParams = DEFAULTS, forcedScenario) {
  const params = normaliseConfig({
    ...inputParams,
    ...(forcedScenario ? { scenario: forcedScenario } : {}),
  });
  const scenario = params.scenario;
  const { agents, demand, customers } = createWorld(params);
  const incidents = [];
  const frames = [];
  const queuedA2A = [];
  const bookCap = params.bookCap * 1000;
  const customerCapacity = Math.round(2000 * (params.optIn / 100) * 135);
  let capacity =
    params.fundingModel === "customer"
      ? Math.min(bookCap, customerCapacity)
      : bookCap;
  if (
    (!params.bank && params.fundingModel === "partner") ||
    !params.mmfl ||
    scenario === "off"
  ) {
    capacity = 0;
  }

  let proposed = 0;
  let allocated = 0;
  let settled = 0;
  let settledPrincipal = 0;
  let defaultLoss = 0;
  let defaultedPrincipal = 0;
  let frozen = 0;
  let priceRejected = 0;
  let acceptedAgents = 0;
  let sweptTotal = 0;
  let collectedFees = 0;
  const feeWrittenOff = 0;

  if (params.fundingModel === "customer" && scenario !== "off") {
    addIncident(
      incidents,
      0,
      "info",
      "Classification unresolved",
      "Customer-supported mode is a sandbox hypothesis. The legal claim remains tagged still-customer; redemption and loss ownership require written approval.",
      "CUSTOMER_CLASSIFICATION",
    );
  }

  for (let tick = 0; tick < TICKS; tick += 1) {
    const hour = hourForTick(tick);
    const packets = [];
    agents.forEach((agent) => {
      agent.refusedNow = false;
      agent.cashOutRefusedNow = false;
    });

    if (
      tick === EVENT_TICKS.forecast &&
      params.fundingModel === "customer" &&
      scenario !== "off" &&
      capacity > 0
    ) {
      packets.push(
        packet({
          id: "customer-lock-cohort",
          from: "customers",
          to: "pool",
          amount: capacity,
          principalSource: "customer-lock",
          legalClaim: "still-customer",
          state: "locked",
          createdTick: tick,
          etaTick: tick,
          kind: "lock",
        }),
      );
    }

    queuedA2A
      .filter((transfer) => transfer.etaTick === tick)
      .forEach((transfer) => {
        const recipient = agents.find((agent) => agent.id === transfer.to);
        addEfloat(recipient, transfer.amount);
        packets.push(
          packet({
            ...transfer,
            id: `a2a-${transfer.from}-${transfer.to}-${tick}`,
            principalSource: "none",
            legalClaim: "agent-efloat",
            state: "released",
            createdTick: tick - 1,
            etaTick: tick,
            kind: "a2a",
          }),
        );
      });

    if (tick === EVENT_TICKS.approval && scenario !== "off") {
      if (!params.mmfl) {
        addIncident(
          incidents,
          tick,
          "danger",
          "MMFL rails unavailable",
          "No allocation can be authorised. Night Float release is cancelled.",
          "MMFL_OUT",
        );
      }
      if (!params.bank && params.fundingModel === "partner") {
        addIncident(
          incidents,
          tick,
          "danger",
          "Funding partner unavailable",
          "Partner-backed capacity is zero; eligible demand remains unfunded.",
          "FUNDER_OUT",
        );
      }
      if (!params.score) {
        addIncident(
          incidents,
          tick,
          "warning",
          "Scoring service unavailable",
          "A transparent rules-only fallback uses a higher threshold and halves approved limits.",
          "SCORE_OUT",
        );
      }
    }

    if (
      tick === EVENT_TICKS.release &&
      scenario !== "off" &&
      params.mmfl &&
      capacity > 0
    ) {
      const threshold = params.score
        ? params.scoreThreshold
        : Math.max(0.8, params.scoreThreshold);
      const considered = agents
        .filter((agent) => agent.type !== "cashout" && agent.score >= threshold)
        .map((agent) => ({
          agent,
          need: Math.max(
            0,
            expectedMorningNeed(agent, params) - agent.ownEfloat,
          ),
        }))
        .filter((entry) => entry.need > 150);
      priceRejected = considered.filter(
        ({ agent }) => params.facilityFee > agent.feeTolerance,
      ).length;
      considered.forEach(({ agent }) => {
        agent.priceAccepted = params.facilityFee <= agent.feeTolerance;
      });
      const eligible = considered
        .filter(({ agent }) => agent.priceAccepted)
        .sort(
          (left, right) =>
            right.agent.score * right.need - left.agent.score * left.need,
        );
      proposed = considered.reduce((sum, entry) => sum + entry.need, 0);
      let remaining = capacity;

      eligible.forEach(({ agent, need }) => {
        if (remaining <= 0) return;
        const allocation = roundMoney(
          Math.min(
            need * (params.score ? 1 : 0.5),
            MODEL_LIMITS.maxPacketAmount,
            remaining,
          ),
        );
        if (allocation < 100) return;
        const principalSource =
          params.fundingModel === "customer"
            ? "customer-lock"
            : "partner-facility";
        const legalClaim =
          params.fundingModel === "customer" ? "still-customer" : "pool";
        Object.assign(agent.facility, {
          principal_source: principalSource,
          legal_claim: legalClaim,
          state: "allocated",
          allocated: roundMoney(allocation),
          idle: roundMoney(allocation),
        });
        agent.funded = true;
        allocated = roundMoney(allocated + allocation);
        remaining = roundMoney(remaining - allocation);
        acceptedAgents += 1;
        packets.push(
          packet({
            id: `allocation-${agent.id}`,
            from: "pool",
            to: agent.id,
            amount: allocation,
            principalSource,
            legalClaim,
            state: "allocated",
            createdTick: tick,
            etaTick: tick + 1,
            agentId: agent.id,
            kind: "allocation",
          }),
        );
      });

      if (priceRejected > 0) {
        addIncident(
          incidents,
          tick,
          "warning",
          "Agents declined the price",
          `${priceRejected} eligible agents rejected the ${params.facilityFee.toFixed(1)}% daily fee and received no allocation.`,
          "PRICE_REJECTION",
        );
      }
      if (proposed > allocated + 100) {
        addIncident(
          incidents,
          tick,
          "warning",
          "Allocation constraint reached",
          `${Math.round(proposed - allocated).toLocaleString("en-GH")} GHS of considered demand was unallocated because price, cap, score, or funding bound first.`,
          "ALLOCATION_CONSTRAINT",
        );
      }
    }

    if (tick > EVENT_TICKS.release && tick <= EVENT_TICKS.release + 4) {
      agents
        .filter((agent) => agent.funded)
        .slice(0, MODEL_LIMITS.maxVisiblePackets)
        .forEach((agent) => {
          packets.push(
            packet({
              id: `allocation-${agent.id}`,
              from: "pool",
              to: agent.id,
              amount: agent.facility.allocated,
              principalSource: agent.facility.principal_source,
              legalClaim: agent.facility.legal_claim,
              state: agent.facility.state,
              createdTick: EVENT_TICKS.release,
              etaTick: EVENT_TICKS.release + 1,
              agentId: agent.id,
              kind: "allocation",
            }),
          );
        });
    }

    if (tick === EVENT_TICKS.stress && scenario === "stress") {
      const target = agents.find((agent) => agent.funded) || agents[16];
      target.riskRoll = -1;
      addIncident(
        incidents,
        tick,
        "danger",
        `${target.id} risk signal deteriorated`,
        "The till remains monitored; settlement will test the freeze, principal-loss, and next-day exclusion rules.",
        "STRESS_SIGNAL",
      );
    }

    if (hour >= 6 && hour < 19.5) {
      agents.forEach((agent, index) => {
        const profile =
          agent.type === "cashin"
            ? { inRate: 4.8, outRate: 0.65 }
            : agent.type === "mixed"
              ? { inRate: 2.6, outRate: 1.9 }
              : { inRate: 0.55, outRate: 4.2 };
        const shock = demand[tick][index];
        const scale = agent.scale * (params.demand / 100);
        const cashIns = poissonish(
          profile.inRate * cashInFactor(hour) * scale,
          shock.inNoise,
        );
        const cashOuts = poissonish(
          profile.outRate * cashOutFactor(hour) * scale,
          shock.outNoise,
        );

        if (agent.frozen) {
          agent.refusedCashIn += cashIns;
          agent.refusedCashOut += cashOuts;
          agent.refusedNow = cashIns > 0;
          agent.cashOutRefusedNow = cashOuts > 0;
          return;
        }

        for (let transaction = 0; transaction < cashIns; transaction += 1) {
          const amount = shock.inValue * (0.75 + transaction * 0.045);
          processCashIn(agent, amount);
        }

        for (let transaction = 0; transaction < cashOuts; transaction += 1) {
          const amount = shock.outValue * (0.72 + transaction * 0.055);
          processCashOut(agent, amount);
        }
        agent.feeDue = (agent.facility.utilised * params.facilityFee) / 100;
      });

      if (scenario === "off" && hour < 12) {
        const needy = agents.filter(
          (agent) =>
            agent.refusedNow &&
            agent.type !== "cashout" &&
            agent.a2aHops < MODEL_LIMITS.a2aMaxHopsPerAgent,
        );
        const donors = agents.filter((agent) => agent.ownEfloat > 1600);
        needy.slice(0, 3).forEach((recipient, index) => {
          const donor = donors[index % Math.max(1, donors.length)];
          if (!donor || donor.id === recipient.id) return;
          const transferAmount = Math.min(
            MODEL_LIMITS.a2aMaxHop,
            donor.ownEfloat - 1200,
          );
          if (transferAmount <= 0) return;
          donor.ownEfloat -= transferAmount;
          recipient.a2aHops += 1;
          recipient.emergencyA2A += transferAmount;
          queuedA2A.push({
            from: donor.id,
            to: recipient.id,
            amount: transferAmount,
            etaTick: tick + MODEL_LIMITS.a2aDelayTicks,
            senderBalanceAfterHop: roundMoney(donor.ownEfloat),
          });
        });
      }
    }

    if (tick === EVENT_TICKS.sweep && scenario !== "off" && !params.sweep) {
      addIncident(
        incidents,
        tick,
        "danger",
        "Dusk sweep unavailable",
        "Only existing e-value and natural reverse flows can settle. Drawer cash remains visible but cannot be transformed by the missing rail.",
        "SWEEP_OUT",
      );
    }

    if (
      tick >= EVENT_TICKS.sweep &&
      tick < EVENT_TICKS.settle &&
      scenario !== "off" &&
      params.sweep
    ) {
      agents
        .filter((agent) => agent.funded)
        .forEach((agent) => {
          const swept = sweepAgent(agent);
          if (swept > 0) {
            sweptTotal += swept;
            packets.push(
              packet({
                id: `sweep-${agent.id}-${tick}`,
                from: agent.id,
                to: "sweeper",
                amount: swept,
                principalSource: "none",
                legalClaim: "agent-cash",
                state: "repaid",
                createdTick: tick,
                etaTick: tick + 1,
                agentId: agent.id,
                kind: "sweep",
              }),
            );
          }
        });
    }

    if (tick === EVENT_TICKS.settle && scenario !== "off") {
      agents
        .filter((agent) => agent.funded)
        .forEach((agent) => {
          agent.feeDue = (agent.facility.utilised * params.facilityFee) / 100;
          if (params.sweep) {
            const finalSweep = sweepAgent(agent);
            sweptTotal += finalSweep;
          }
          const due = agent.facility.allocated + agent.feeDue;
          const totalEfloat = agent.facility.idle + agent.ownEfloat;
          const forcedDefault = agent.riskRoll < params.defaultRate;
          const available = forcedDefault ? totalEfloat * 0.36 : totalEfloat;
          const paid = Math.min(due, Math.max(0, available));
          const fromIdle = Math.min(agent.facility.idle, paid);
          agent.facility.idle -= fromIdle;
          agent.ownEfloat = Math.max(0, agent.ownEfloat - (paid - fromIdle));
          agent.settled = paid;
          agent.shortfall = Math.max(0, due - paid);
          agent.facility.repaid = Math.min(agent.facility.allocated, paid);
          agent.feePaid = Math.min(
            agent.feeDue,
            Math.max(0, paid - agent.facility.repaid),
          );
          agent.feeReceivable = Math.max(0, agent.feeDue - agent.feePaid);
          collectedFees += agent.feePaid;
          agent.facility.defaulted = Math.max(
            0,
            agent.facility.allocated - agent.facility.repaid,
          );
          settled += paid;
          settledPrincipal += agent.facility.repaid;
          defaultedPrincipal += agent.facility.defaulted;
          agent.facility.idle = 0;
          if (agent.facility.defaulted > 1) {
            agent.frozen = true;
            agent.nextEligible = false;
            agent.facility.state = "defaulted";
            frozen += 1;
            defaultLoss += agent.facility.defaulted;
            addIncident(
              incidents,
              tick,
              "danger",
              `${agent.id} missed settlement`,
              `${Math.round(agent.facility.defaulted).toLocaleString("en-GH")} GHS principal and ${roundMoney(agent.feeReceivable).toLocaleString("en-GH")} GHS fee remain unpaid. ${agent.id} is out of tomorrow’s allocation file.`,
              `DEFAULT-${agent.id}`,
            );
          } else {
            agent.facility.state = "repaid";
          }
          if (agent.feeReceivable > 0.01) {
            addIncident(
              incidents,
              tick,
              "warning",
              `${agent.id} fee remains unpaid`,
              `${roundMoney(agent.feeReceivable).toLocaleString("en-GH")} GHS is recorded as a fee receivable, not distributed cash.`,
              `FEE_RECEIVABLE-${agent.id}`,
            );
          }
          packets.push(
            packet({
              id: `settlement-${agent.id}`,
              from: agent.id,
              to: "pool",
              amount: paid,
              principalSource: agent.facility.principal_source,
              legalClaim: agent.facility.legal_claim,
              state: agent.facility.state,
              createdTick: tick,
              etaTick: tick + 1,
              agentId: agent.id,
              kind: "settlement",
            }),
          );
        });
    }

    if (tick > EVENT_TICKS.settle && tick <= EVENT_TICKS.settle + 3) {
      agents
        .filter((agent) => agent.funded)
        .slice(0, MODEL_LIMITS.maxVisiblePackets)
        .forEach((agent) => {
          packets.push(
            packet({
              id: `settlement-${agent.id}`,
              from: agent.id,
              to: "pool",
              amount: agent.settled,
              principalSource: agent.facility.principal_source,
              legalClaim: agent.facility.legal_claim,
              state: agent.facility.state,
              createdTick: EVENT_TICKS.settle,
              etaTick: EVENT_TICKS.settle + 1,
              agentId: agent.id,
              kind: "settlement",
            }),
          );
        });
    }

    if (
      tick === 44 &&
      agents.some(
        (agent) => agent.type === "cashout" && agent.refusedCashOut > 0,
      )
    ) {
      addIncident(
        incidents,
        tick,
        "info",
        "Cash-out corridor remains constrained",
        "Night Float supplies e-float, not banknotes. Physical-cash refusals require a different intervention.",
        "CASH_OUT_CONSTRAINT",
      );
    }

    const totals = agents.reduce(
      (accumulator, agent) => {
        accumulator.refusedCashIn += agent.refusedCashIn;
        accumulator.refusedCashOut += agent.refusedCashOut;
        accumulator.servedCashIn += agent.servedCashIn;
        accumulator.servedCashOut += agent.servedCashOut;
        accumulator.emergencyA2A += agent.emergencyA2A;
        accumulator.utilisedPrincipal += agent.facility.utilised;
        accumulator.idleAllocated += agent.facility.idle;
        accumulator.drawerCash += agent.cash;
        return accumulator;
      },
      {
        refusedCashIn: 0,
        refusedCashOut: 0,
        servedCashIn: 0,
        servedCashOut: 0,
        emergencyA2A: 0,
        utilisedPrincipal: 0,
        idleAllocated: 0,
        drawerCash: 0,
      },
    );
    const grossFees = (totals.utilisedPrincipal * params.facilityFee) / 100;
    const feeReceivable = agents.reduce(
      (sum, agent) =>
        sum +
        (tick >= EVENT_TICKS.settle
          ? agent.feeReceivable
          : Math.max(0, agent.feeDue - agent.feePaid)),
      0,
    );
    const feeWaterfall = getFeeWaterfall(collectedFees, params.fundingModel);
    const books = buildBooks({
      capacity,
      allocated,
      agents,
      settledPrincipal,
      defaultedPrincipal,
      fundingModel: params.fundingModel,
      customerCapacity,
      accruedFees: grossFees,
      collectedFees,
      feeReceivable,
      feeWrittenOff,
    });
    assertBooks(books);
    const settlementRate =
      allocated > 0 && tick >= EVENT_TICKS.settle
        ? clamp((settledPrincipal / allocated) * 100, 0, 100)
        : null;

    frames.push({
      tick,
      time: timeForTick(tick),
      t: timeForTick(tick),
      agents: agents.map((agent) => ({
        ...agent,
        efloat: roundMoney(agent.ownEfloat + agent.facility.idle),
        ownEfloat: roundMoney(agent.ownEfloat),
        cash: roundMoney(agent.cash),
        facility: Object.fromEntries(
          Object.entries(agent.facility).map(([key, value]) => [
            key,
            typeof value === "number" ? roundMoney(value) : value,
          ]),
        ),
      })),
      customers: customers.map((cohort) => ({ ...cohort })),
      packets: packets.slice(0, MODEL_LIMITS.maxVisiblePackets),
      incidents: incidents
        .filter((incident) => incident.tick <= tick)
        .map((incident) => ({ ...incident })),
      books,
      metrics: {
        capacity: roundMoney(capacity),
        proposed: roundMoney(proposed),
        allocated: roundMoney(allocated),
        bookCap,
        customerCapacity,
        totals: Object.fromEntries(
          Object.entries(totals).map(([key, value]) => [
            key,
            roundMoney(value),
          ]),
        ),
        utilised: roundMoney(totals.utilisedPrincipal),
        idleAllocated: roundMoney(totals.idleAllocated),
        refusedCashIn: totals.refusedCashIn,
        refusedCashOut: totals.refusedCashOut,
        accruedFees: roundMoney(grossFees),
        collectedFees: roundMoney(collectedFees),
        feeReceivable: roundMoney(feeReceivable),
        feeWrittenOff: roundMoney(feeWrittenOff),
        grossFees: roundMoney(grossFees),
        feeWaterfall,
        defaultLoss: roundMoney(defaultLoss),
        defaultedPrincipal: roundMoney(defaultedPrincipal),
        cashResultBeforeCosts: roundMoney(collectedFees - defaultLoss),
        systemResult: roundMoney(collectedFees - defaultLoss),
        settlementRate,
        settled: roundMoney(settled),
        settledPrincipal: roundMoney(settledPrincipal),
        frozen,
        sweptTotal: roundMoney(sweptTotal),
        acceptedAgents,
        priceRejected,
        allocationRate:
          proposed > 0 ? roundMoney((allocated / proposed) * 100) : 0,
        utilisationRate:
          allocated > 0
            ? roundMoney((totals.utilisedPrincipal / allocated) * 100)
            : 0,
      },
    });
  }
  return deepFreeze(frames);
}

export function comparableBaseline(params = DEFAULTS) {
  return simulate({ ...params, ...SCENARIO_PRESETS.off });
}

export function avoidedCashIn(activeFrame, baselineFrame) {
  return (
    baselineFrame.metrics.totals.refusedCashIn -
    activeFrame.metrics.totals.refusedCashIn
  );
}

export function modelSnapshot(params = DEFAULTS) {
  const tape = simulate(params);
  const final = tape[TICKS - 1];
  return {
    seed: SEED,
    ticks: TICKS,
    params: { ...DEFAULTS, ...params },
    finalKpis: final.metrics,
    booksOk: tape.every((frame) => frame.books.ok),
  };
}
