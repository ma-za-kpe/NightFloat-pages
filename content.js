/*
 * Night Float — Proprietary public demonstration · source-visible · no reuse licence. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

export const PARTNERSHIP_ASKS = Object.freeze([
  Object.freeze({
    id: "sandbox",
    title: "Sandbox path",
    pitch: "FIO pre-consult and a pilot/sandbox letter in MMFL’s name",
    detail:
      "Will MMFL sponsor a BoG/FIO pre-consult and file the appropriate letter?",
  }),
  Object.freeze({
    id: "data",
    title: "Minimum data",
    pitch:
      "Read-only 30-day hourly cash-in/out data for one market and 50 agents",
    detail:
      "Can the pilot receive approved, read-only hourly cash-in/out data for one corridor and 50 agents?",
  }),
  Object.freeze({
    id: "rail",
    title: "Exact rail",
    pitch:
      "An approved pool-wallet or liquidity-tag API—not consumer Send Money",
    detail:
      "Which MMFL-controlled pool or liquidity-tag mechanism may allocate and recall e-float?",
  }),
  Object.freeze({
    id: "owners",
    title: "Named owners",
    pitch: "A named MMFL product/legal owner and agent-network owner",
    detail:
      "Who owns product/legal and who owns the agent network inside MMFL?",
  }),
  Object.freeze({
    id: "partners",
    title: "Dusk + risk partners",
    pitch:
      "Validation of scoring, facility capacity, and the physical-cash dusk rail",
    detail:
      "Who can validate scoring, facility capacity, and the physical-cash reverse rail?",
  }),
  Object.freeze({
    id: "tax-loss",
    title: "Tax + loss owner",
    pitch:
      "Written tax treatment and a named contractual owner for principal shortfall",
    detail:
      "What is the written tax treatment, and who contractually owns principal shortfall?",
  }),
]);

export const SOURCE_REGISTER = Object.freeze([
  Object.freeze({
    id: "bog-annual-2025",
    issuer: "Bank of Ghana",
    title: "Payment Systems Oversight Annual Report 2025",
    date: "2026",
    verified: "15 September 2026",
    url: "https://www.bog.gov.gh/wp-content/uploads/2026/08/Payment-Systems-Annual-Report-2025.pdf",
    scope: "Sector transaction mix and the 41% A2A signal.",
  }),
  Object.freeze({
    id: "act-987",
    issuer: "Bank of Ghana",
    title: "Payment Systems and Services Act, 2019 (Act 987)",
    date: "2019",
    verified: "15 September 2026",
    url: "https://www.bog.gov.gh/wp-content/uploads/2022/03/Payment-Systems-and-Services-Act-2019-Act-987_.pdf",
    scope:
      "Primary legal text; not proof that the proposed facility is approved.",
  }),
  Object.freeze({
    id: "bog-sandbox",
    issuer: "Bank of Ghana",
    title: "Regulatory Sandbox Framework",
    date: "2022",
    verified: "15 September 2026",
    url: "https://www.bog.gov.gh/wp-content/uploads/2023/02/Regulatory-Sandbox-Framework-19th-August-2022.pdf",
    scope:
      "Sandbox process context; the correct Night Float path remains to be confirmed.",
  }),
  Object.freeze({
    id: "bog-licences",
    issuer: "Bank of Ghana",
    title: "Licence Categories",
    date: "Current web guidance",
    verified: "15 September 2026",
    url: "https://www.bog.gov.gh/fintech-innovation/licence-categories/",
    scope:
      "Licensed-role context; no licence or partnership is claimed for Night Float.",
  }),
  Object.freeze({
    id: "mof-elevy",
    issuer: "Ghana Ministry of Finance",
    title: "Confirmation of E-Levy repeal",
    date: "3 April 2025",
    verified: "15 September 2026",
    url: "https://www.mofep.gov.gh/news-and-events/2025-04-03/more-money-less-taxes-and-smarter-spending%E2%80%94new-economic-reforms",
    scope:
      "Public tax context only; the exact VAT, withholding, and facility treatment still needs written advice.",
  }),
]);

export function renderPartnershipAsks(list, { pitch = false } = {}) {
  if (!list) return 0;
  list.replaceChildren(
    ...PARTNERSHIP_ASKS.map((ask, index) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      const title = document.createElement("b");
      title.textContent = pitch ? ask.pitch : ask.title;
      item.append(number, title);
      if (!pitch) {
        const detail = document.createElement("p");
        detail.textContent = ask.detail;
        item.append(detail);
      }
      return item;
    }),
  );
  return PARTNERSHIP_ASKS.length;
}
