/*
 * Night Float — Proprietary and Confidential. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

import { avoidedCashIn, roundMoney } from "./sim.js";

export const DEFAULT_HORIZON = "day";

export const HORIZONS = Object.freeze([
  Object.freeze({ key: "day", label: "1 day", days: 1 }),
  Object.freeze({ key: "week", label: "1 week", days: 7 }),
  Object.freeze({ key: "month", label: "1 month", days: 30 }),
  Object.freeze({ key: "quarter", label: "3 months", days: 90 }),
  Object.freeze({ key: "half-year", label: "6 months", days: 180 }),
  Object.freeze({ key: "year", label: "1 year", days: 365 }),
]);

export function getHorizon(key) {
  const horizon = HORIZONS.find((candidate) => candidate.key === key);
  if (!horizon) throw new RangeError(`Unknown projection horizon: ${key}`);
  return horizon;
}

export function projectFrames(activeFrame, baselineFrame, horizonKey) {
  const { key, label, days } = getHorizon(horizonKey);
  const metrics = activeFrame.metrics;
  const totals = metrics.totals;
  const fees = metrics.feeWaterfall;
  const scale = (value) => roundMoney(value * days);
  const grossFees = scale(metrics.grossFees);
  const defaultLoss = scale(metrics.defaultLoss);

  return {
    key,
    label,
    days,
    refusedCashIn: scale(totals.refusedCashIn),
    refusedCashOut: scale(totals.refusedCashOut),
    avoidedCashIn: scale(avoidedCashIn(activeFrame, baselineFrame)),
    emergencyA2A: scale(totals.emergencyA2A),
    allocatedVolume: scale(metrics.allocated),
    utilisedPrincipal: scale(totals.utilisedPrincipal),
    idleAllocated: scale(totals.idleAllocated),
    acceptedAgentDays: scale(metrics.acceptedAgents),
    priceRejectedAgentDays: scale(metrics.priceRejected),
    frozenEvents: scale(metrics.frozen),
    defaultedPrincipal: scale(metrics.defaultedPrincipal),
    defaultLoss,
    grossFees,
    systemResult: roundMoney(grossFees - defaultLoss),
    utilisationRate: metrics.utilisationRate,
    settlementRate: metrics.settlementRate,
    feeWaterfall: {
      fundingPartner: scale(fees.fundingPartner),
      mmfl: scale(fees.mmfl),
      platform: scale(fees.platform),
      operations: scale(fees.operations),
      customerFeeShare: scale(fees.customerFeeShare),
    },
  };
}
