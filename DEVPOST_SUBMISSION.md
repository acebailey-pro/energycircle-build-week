# EnergyCircle Devpost submission package

## Project name

EnergyCircle

## Tagline

Turn a property's sun, wind, water, heat, biomass, motion, and elevation into understandable, testable energy-system paths.

## Category

Apps for Your Life

## Repository

https://github.com/acebailey-pro/energycircle-build-week

## Live demo and judge instructions

https://energycircle-build-week.ace0048.chatgpt.site/

No credentials are required. Start with Gravity storage and drag the upper
reservoir uphill. Set a property objective, budget, and resource profile to see
all nine families compared. Then open another family, inspect $0 to complete, run a
failure or resilience condition, and use Print / save PDF to generate the
detailed field package.

## Description

### Inspiration

Properties often contain useful energy resources—sunlight, wind, flowing or
stored water, elevation, waste heat, biomass, and human motion—but existing
tools usually examine them separately. A homeowner can find thousands of pages
of information and still not understand what a complete system would look like,
what limits it, what it may cost, or what must be measured next.

EnergyCircle makes property-scale energy systems legible. It begins with a
living reference property rather than an empty form, then lets the user directly
manipulate the physical system and see the consequences.

### What it does

EnergyCircle contains nine governed system families:

- Solar photovoltaic
- Solar thermal
- Wind generation and water lifting
- Water flow and pressure recovery
- Bioenergy
- Thermal recovery
- Mechanical and human power
- Gravity storage
- Coordinated property hybrids

Each family is a working deterministic reference model with its own components,
property interaction, variables, energy or resource balance, storage behavior,
failure condition, warnings, feasibility verdict, cost range, and questions.

A structured property brief captures the user's objective, starting budget, and
eight resource conditions. EnergyCircle compares all nine families with a
visible compatibility score, evidence-based reason, next measurement, and
reference verdict. The comparison explains what fits; it does not choose a
system for the user. An absent required resource produces zero fictional output,
while a possible but unmeasured resource visibly derates the model.

In the gravity-storage demonstration, moving one reservoir changes geometry,
hydraulic head, route length, Darcy-Weisbach losses, stored energy, runtime,
warnings, feasibility, visualization, and the causal explanation through one
governed state transition. The visual never changes independently of the
calculation.

### Access from $0 to complete

A full installation is not everyone's starting point. Every family includes a
five-stage access path:

1. Use what already exists with $0 in new equipment
2. Reclaimed or assisted entry
3. One-service starter
4. Expandable staged system
5. Complete reference system

The free level may reduce demand or provide a direct service; it is never
misrepresented as free generated electricity. Starter and staged outputs are
recalculated by the governed engine and state their prerequisites and limits.

### From interaction to a field package

Every active revision produces an Engineering Package containing:

- Connected component schedule
- Itemized accessible and installed planning budgets
- Governed reclaimed, standard-new, and high-duty component replacement
- Exploded assemblies with parts, interfaces, inspection gates, failure effects,
  service access, isolation, and assembly sequence
- Editable cost-of-inaction scenarios with visible assumptions and unpriced effects
- Deterministic resilience matrix
- Family-specific field sequence
- Assumptions, unknowns, exclusions, and professional-review boundaries
- Stable revision fingerprint
- Downloadable canonical JSON record
- Detailed multi-page print/PDF pre-build package
- Property brief and complete nine-family architecture comparison

The export supports measurement, comparison, quoting, procurement conversations,
commissioning, and maintenance planning. It does not pretend to replace local
permits, selected-equipment data, licensed design, or site inspection.

### Technical implementation

EnergyCircle is built with React, TypeScript, vinext/Vite, and a deterministic
system engine. Its central invariant is:

> No representation may update independently of canonical project state.

Every meaningful interaction passes through a governed preview transaction.
Pointer movement can preview calculations without changing project truth; the
completed interaction commits exactly one project revision. Calculations,
warnings, verdicts, costs, resilience cases, visualizations, explanations, and
exports derive from that revision.

Values are labeled as measured, assumed, calculated, estimated, or unknown.
AI-generated language cannot create physical values or feasibility scores.

### How Codex and GPT-5.6 were used

Codex and GPT-5.6 served as the implementation partner throughout Build Week.
They accelerated:

- Translation of the approved product scope into production code
- Provenance review of pre-existing product-direction material
- Design and implementation of the canonical transaction model
- Deterministic hydraulic, electrical, thermal, wind, biogas, mechanical, and
  hybrid calculations
- Responsive interface and direct-manipulation development
- Accessibility and truth-state review
- Engineering-package and export generation
- Automated unit, server-render, production-build, and browser tests across all
  nine families

The human product decisions remained explicit: preserve the full nine-family
vision, expose uncertainty, make access part of every system, and prevent AI
explanations from overriding physical truth.

### Build Week provenance

A July 8, 2026 EnergyCircle prototype was used only as product-definition
lineage for the nine-family catalog. Its code, calculations, interface, and
assets were not imported. The prior Metabolic Systems Builder was inspected as
design lineage and as a source of architectural lessons; no source code or
assets from it were reused. The implementation in the submitted repository was
written as new Build Week work, with dated commits and the disclosure preserved
in the README.

### What I learned

An interactive engineering product cannot treat visualization as decoration.
When a user moves a real component, every representation must follow the same
physical truth. EnergyCircle also demonstrates that accessibility is not the
same as pretending complex infrastructure is free: a responsible tool can show
what someone can do today, what can grow later, and where safety and
professional review remain necessary.

## Required answers still owned by the submitter

- Submitter type: Individual
- Country of residence: [enter personally]
- /feedback session ID: [generate from the primary Codex build task]
- Public YouTube demo URL: [record and upload]
