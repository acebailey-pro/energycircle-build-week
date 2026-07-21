# EnergyCircle

**Property energy systems, made legible.**

**Live judge demo:** https://energycircle-build-week.ace0048.chatgpt.site/

EnergyCircle is an interactive planning environment for understanding how a
property-scale energy system behaves as one connected whole. Its Build Week
release includes governed interactive reference systems for all nine original
EnergyCircle families. Each family connects property resources, components,
calculations, storage, loads, failures, cost evidence, questions, and synchronized
representations through the same canonical-state model.

![EnergyCircle hillside energy system](public/energycircle-social.png)

## The judging path

Before selecting a system, set the property objective, starting budget, and
available or possible resources. EnergyCircle compares all nine families with a
visible reason and next measurement; the comparison explains but does not choose.

1. Select any of the nine energy families and open its complete system.
2. Move the highlighted component or edit a family-specific system variable.
3. Watch geometry, routing, resource quality, losses, useful output, runtime,
   warnings, system verdict, and the causal explanation update together.
4. Switch between **Property**, **System**, and **Blueprint** to see the same
   project revision represented three ways.
5. Toggle the active family’s failure condition and trace it through every route,
   calculation, warning, and verdict.
6. Ask plain-language property questions and inspect the deterministic answer.
7. Compare accessible and professionally installed cost envelopes, including
   their evidence basis, date, exclusions, and uncertainty.
8. Continue into the governed **Engineering Package**: inspect the connected
   component schedule, itemized planning budget, five-condition resilience
   matrix, family-specific field sequence, and portable revision record.
9. Open **$0 to complete** to compare existing-property, reclaimed or assisted,
   one-service starter, staged, and complete-system paths without presenting
   avoided demand or donated equipment as free whole-property generation.
10. Use **Print / save PDF** to produce a detailed multi-page pre-build field
    package from the current canonical revision.

The initial reference scenario is intentionally **FRAGILE**: its modeled usable
storage is 6.47 kWh against a defined 7.2 kWh autonomy target. One direct
manipulation can cross that threshold, making the reason visible rather than
merely reporting a score.

### 90-second judge path

1. Open **Gravity storage** and drag the upper reservoir uphill.
2. Watch head, losses, stored energy, runtime, warnings, verdict, and the causal
   explanation update from one governed state transition.
3. Open **Solar PV**, **Wind**, or **Hybrid** to confirm that each family has its
   own components, variables, calculations, failure condition, and cost range.
4. Open **$0 to complete** to compare no-new-equipment, reclaimed or assisted,
   starter, staged, and complete paths.
5. Open **Resilience**, then **Field sequence**.
6. Select a component and replace **Standard new** with **Verified reclaimed**
   or **High-duty / serviceable**; performance, cost, assembly, and export follow.
7. Open **Exploded assemblies** and **Cost of inaction**.
8. Select **Print / save PDF** to generate the detailed pre-build field package,
   or open **Revision record** to download the canonical JSON record.

No account, credentials, or sample-data upload is required.

## What is implemented

- Direct manipulation of every property component
- Structured property and objective intake with governed budget and resource states
- Deterministic comparison of all nine architecture families, including the
  reason, first measurement, reference verdict, and an explicit non-decision boundary
- Governed preview transactions with one revision committed at interaction end
- Nine first-class interactive systems: solar PV, solar thermal, wind, water
  and pressure, bioenergy, thermal recovery, mechanical and human power,
  gravity storage, and coordinated hybrids
- Deterministic hydraulic, electrical, thermal, wind, biogas, mechanical,
  storage, and combined-system calculations
- Darcy-Weisbach pipe-loss modeling for the reference system
- Live head, loss, storage, runtime, warning, and feasibility outputs
- Property, system, and blueprint views derived from one canonical state
- Causal insights that explain consequences without making unsupported decisions
- Explicit **assumed**, **calculated**, and **unknown** truth states
- A governed failure path for every family
- Evidence-backed or explicitly bounded cost estimates with freshness metadata
- Itemized component and site-work budget allowances derived from each active
  family's current planning envelope
- A connected component schedule with roles, dependencies, failure traces, and
  maintenance checkpoints
- Five deterministic resilience conditions evaluated without mutating the
  canonical project revision
- Six-stage, family-specific field sequences that distinguish planning from
  construction and expose professional-review boundaries
- Stable revision fingerprints and downloadable machine-readable project records
- Governed component replacement with visible performance, storage, cost,
  service-life, evidence, and safety effects
- Exploded assemblies for every modeled component, including parts, interfaces,
  inspection gates, failure effects, assembly order, service access, and isolation
- User-editable cost-of-inaction scenarios with operating cost, disruption
  exposure, escalation, time horizons, unpriced effects, and non-decision framing
- Five-stage access paths for all nine families, including an explicit $0 entry,
  deterministic starter and staged output, preserved-investment guidance, and
  honest capability boundaries
- A print-quality, multi-page pre-build field package that expands with the
  active component count and covers decision summary, access, inputs, truth
  states, property brief, nine-family comparison, architecture, connections,
  every exploded assembly, budget,
  cost-of-inaction, procurement, resilience, field sequence, exclusions, and
  sign-off
- Plain-language property questions grounded in the active deterministic result
- Keyboard-accessible component movement and reduced-motion support
- Unit, server-render, and real-browser interaction tests

## Canonical-state rule

No representation updates independently. Every meaningful domain interaction
passes through a governed EnergyCircle state transition. Calculations, warnings,
verdicts, visualizations, and explanations are then derived from that revision.
Selection, hover, and view mode remain local view state and never become
physical project data.

The approved [Product Scope](SCOPE.md) and
[Engineering Constitution](ENGINEERING_CONSTITUTION.md) govern this milestone.

## Built with Codex and GPT-5.6

OpenAI Codex and GPT-5.6 were used as the implementation partner throughout the
Build Week development period. The collaboration included:

- translating the approved scope and constitution into verifiable source code;
- implementing the new deterministic engine and transaction model;
- connecting every renderer to canonical EnergyCircle state;
- generating and stress-testing the causal-insight interaction;
- building unit, server-render, and Microsoft Edge interaction tests;
- reviewing accessibility, responsive behavior, and Build Week submission needs;
- generating the original social-preview illustration used by this repository.

Engineering decisions remained constrained by the approved product definition.
AI-authored explanations are not allowed to create physical values, feasibility
scores, or recommendations outside the governed deterministic engine.

## Build Week provenance

This repository's EnergyCircle implementation was written as new work for
OpenAI Build Week 2026. A pre-Build Week EnergyCircle prototype archived on
July 8, 2026 was used as product-definition lineage for the nine-family energy
catalog: solar PV, solar thermal, wind, water and pressure, bioenergy, thermal
recovery, mechanical and human power, gravity storage, and coordinated hybrid
systems. Its application code, calculations, interface, and assets were not
imported into this repository.

The prior Metabolic Systems Builder project was also inspected only as reference
material for design lineage, deterministic-engineering lessons, and
architectural anti-patterns. **No source code or assets from either prior
application were reused in this Build Week implementation.**

## Run locally

Requirements: Node.js 22.13 or newer.

~~~bash
npm install
npm run dev
~~~

Open **http://localhost:5173**.

## Verify

~~~bash
npm test
npm run lint
~~~

The test command runs deterministic engine tests, a production build,
server-render checks, and a real-browser interaction test. The browser test
uses Microsoft Edge, Chrome, or Chromium when available and otherwise reports
a skip.

## Technology

- React 19
- TypeScript
- vinext / Vite
- Cloudflare Workers-compatible production output
- Node test runner
- Playwright Core for browser verification

## Model boundary

EnergyCircle is an explanatory planning model, not a construction
recommendation. Reference terrain, flow, efficiency, storage, and load values
are labeled assumptions. Geotechnical conditions, installed cost, and permit
requirements remain explicitly unknown.

## License

[MIT](LICENSE)
