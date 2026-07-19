# EnergyCircle Engineering Constitution

**Status:** Approved and frozen for implementation  
**Authority:** Governs all EnergyCircle implementation  
**Relationship to Scope:** The Scope defines the product and milestone. This Constitution defines the engineering invariants that every implementation must preserve.

## 1. Purpose

This Constitution protects EnergyCircle from architectural drift as the product grows. It defines project truth, interaction transactions, truth states, deterministic authority, representation behavior, AI boundaries, provenance requirements, and failure modes that must be actively prevented.

It is intentionally separate from the product Scope:

- The **Scope** explains what EnergyCircle is, what it does, what it does not do, and what the interactive milestone must accomplish.
- The **Engineering Constitution** governs how every EnergyCircle capability must preserve truth, synchronization, traceability, and user trust.
- Later PRDs, specifications, implementation plans, modules, and tests must comply with both.

When another module or representation is added, it inherits this Constitution automatically unless the Constitution itself is explicitly amended.

## 2. Constitutional hierarchy

EnergyCircle implementation decisions follow this order of authority:

1. Approved product Scope
2. This Engineering Constitution
3. Approved PRD and acceptance criteria
4. Approved technical specification
5. Implementation checklist
6. Module-level design and code

No lower-level artifact may weaken or bypass a higher-level invariant.

### 2.1 Non-blocking progress rule

> **The Constitution may reject an implementation that violates a governing invariant, but it may not block milestone progress solely because a future capability has not yet been implemented.**

Constitutional requirements fall into two categories:

- **Current obligations:** Invariants that apply to the capabilities being implemented or accepted in the active milestone. These must be satisfied now.
- **Compatibility obligations:** Constraints that keep the architecture capable of supporting an identified future capability without requiring that capability to ship now.

Undo, redo, revision history, timeline playback, collaborative editing, additional architecture families, and later representations are not automatically required for the current interactive milestone. Their mention requires the current architecture to avoid making them structurally impossible; it does not make their immediate delivery an acceptance condition.

A future capability becomes a current obligation only when it is required by the approved Scope, activated by an approved milestone or PRD, or needed to satisfy an existing acceptance condition.

The Constitution governs progress. It must not become a substitute for progress.

## 3. Canonical-State Invariant

> **No representation may author or retain an independent version of EnergyCircle project truth. Every domain-changing interaction must produce exactly one governed state transition—or one governed preview transaction followed by one committed transition—from which all calculations, sizing, warnings, feasibility states, causal insights, visualizations, blueprints, and exports are derived. Local view state may control selection, hover, zoom, pan, and playback, but never physical or project data.**

This is the primary engineering invariant of EnergyCircle.

### 3.1 Project truth

Project truth includes all state that changes the meaning, physical behavior, feasibility, cost, risk, construction, operation, or documentation of a project, including:

- Property geometry, terrain, elevation, and boundaries
- User goals and required loads
- Assets, components, routes, and connections
- Component placement, dimensions, capacity, and configuration
- Physical parameters and units
- System architecture and dependencies
- Calculated outputs and sizing
- Assumptions, estimates, evidence, and unknowns
- Warnings, failures, recovery conditions, and feasibility
- Cost and price evidence
- Blueprint annotations and export content
- Project revision identity

Project truth may be changed only through the governed transition mechanism.

### 3.2 Derived state

Derived state is computed from project truth and must not become a second editable source of truth. It includes:

- Energy and mass balances
- Hydraulic and electrical results
- Component sizing
- Losses, runtime, and recharge requirements
- Feasibility classifications
- Warning and failure propagation
- Causal insights
- Cost totals and comparisons
- Visual paths and annotations
- Blueprint and export content

Derived state must be reproducible from the canonical project revision and the applicable engine version.

### 3.3 View state

View state may remain local when it does not alter project meaning. It includes:

- Hover
- Selection
- Zoom
- Pan
- Camera rotation
- Open or closed panels
- Layer visibility
- Animation playback
- Temporary focus and highlighting

View state must never contain authoritative geometry, parameters, calculations, warnings, feasibility, or export data.

## 4. Governed interaction transactions

Every domain-changing user action is a transaction.

### 4.1 Transaction lifecycle

For continuous gestures such as dragging:

1. **Begin:** Pointer-down starts a governed preview transaction from a known canonical revision.
2. **Preview:** Pointer movement produces governed preview state and preview-derived consequences without creating durable project revisions.
3. **Validate:** The engine checks constraints, supported bounds, units, and required dependencies.
4. **Commit:** Pointer-up creates exactly one committed canonical project revision if the change is valid.
5. **Reject or constrain:** An invalid change is rejected, constrained, or committed with an explicit warning according to the governing rule.
6. **Cancel:** Cancellation discards preview state and leaves the canonical revision unchanged.

The same lifecycle applies to parameter editing, replacement, rerouting, resizing, addition, deletion, and scenario changes.

### 4.2 Transaction properties

Every committed transaction must be:

- **Atomic:** The project cannot remain partially updated.
- **Deterministic:** The same valid transition from the same revision produces the same project result.
- **Traceable:** The changed fields, prior revision, new revision, and reason are identifiable.
- **Validated:** Constraints are evaluated before the new revision is accepted.
- **Reversible where practical:** The transaction model must permit undo and redo without reconstructing intent from renderer state.
- **Representation-independent:** The same transition may be initiated from any view, but no view owns the resulting truth.

### 4.3 Revision behavior

A committed domain transition creates one new project revision. Preview movements do not create revision history.

This model must remain compatible with:

- Undo and redo
- Change history
- Timeline playback
- Scenario comparison
- Saved project revisions
- Future collaborative editing

Those capabilities need not all exist immediately, but current implementation must not make them structurally impossible.

## 5. Truth-State Taxonomy

EnergyCircle does not treat every displayed value as the same kind of truth.

Every consequential value must be classifiable as one of five states.

### 5.1 Measured

A value observed or supplied for the actual property or component.

Measured values should identify, when available:

- Unit
- Measurement method or source
- Measurement date
- User or source attribution
- Known tolerance

### 5.2 Assumed

A value intentionally used because a measurement is unavailable or a scenario requires a provisional condition.

Assumptions must be:

- Clearly labeled
- Inspectable
- Editable when appropriate
- Included in confidence and feasibility interpretation
- Prevented from visually masquerading as measurements

### 5.3 Calculated

A value deterministically derived from governed inputs.

Calculated values must identify:

- Governing inputs
- Units
- Formula or calculation method
- Engine or rule version where material
- Any assumptions inherited from their inputs

### 5.4 Estimated

A bounded approximation based on stated evidence, heuristics, ranges, or reference data.

Estimates must identify:

- Basis
- Range or uncertainty where meaningful
- Source and retrieval date when external evidence is used
- Important assumptions
- Freshness when time-sensitive

An estimate must not be presented as a measurement or guaranteed outcome.

### 5.5 Unknown

A required or useful value that is not currently known.

Unknown values must remain explicit. They may:

- Request measurement
- Reduce confidence
- Produce a fragile result
- Block a conclusion
- Cause the system to refuse an unsupported result

Unknown is a valid product state, not a defect to hide.

### 5.6 Truth propagation

Derived outputs inherit the uncertainty and status of their governing inputs. A calculated result produced from assumed or estimated inputs remains calculated, but its presentation must disclose the underlying assumption or estimate.

No formatting, visual hierarchy, AI explanation, or export may erase truth-state provenance.

## 6. Deterministic Authority

Deterministic engines are authoritative wherever EnergyCircle can calculate or validate physical and project behavior.

This includes, as applicable:

- Energy balance
- Water volume
- Elevation head
- Flow and pressure
- Hydraulic and electrical losses
- Efficiency
- Runtime
- Recharge requirements
- Component sizing
- Dependency propagation
- Feasibility classification
- Failure and recovery conditions

The governing constraint remains:

> **No generated claim may exceed the deterministic energy balance.**

When a deterministic conclusion is unavailable, EnergyCircle must expose the missing information or unsupported condition rather than allow another layer to invent certainty.

## 7. Representation Invariants

Every representation is a projection of the current canonical project revision.

Representations include:

- Interactive system layout
- System-flow visualization
- Technical or architectural illustration
- Blueprint
- Exploded or component view
- Field guidance
- Reports
- SVG and other exports
- Demo and generated presentation materials

### 7.1 Required behavior

- Representations may emphasize different aspects of the project.
- Representations may maintain local view state.
- Representations may not maintain independent domain state.
- A domain change initiated in one representation must propagate through the canonical transition mechanism.
- Every affected representation must render the resulting revision.
- An export must identify or be reproducibly associated with the canonical revision from which it was generated.

### 7.2 Computational synchronization

Visual synchronization alone is insufficient.

> **A representation is synchronized only when its geometry, calculations, warnings, feasibility, failure state, annotations, and exports derive from the same canonical revision.**

Moving a component in a blueprint without updating the governed project is not synchronization. It is representational drift.

## 8. Causal Insight Boundary

After a meaningful interaction, EnergyCircle should surface the single most decision-relevant consequence supported by the before-and-after governed state.

The insight may explain:

- What changed
- By how much it changed
- Which relationship caused the change
- Whether a threshold was crossed
- Which component or condition is limiting performance
- Which assumptions or unknowns affect the conclusion

The insight must:

- Be derived from deterministic state differences
- Be traceable to supporting values
- Preserve truth-state labels
- Explain rather than decide

Acceptable:

> “The 32 mm pipe is consuming 31% of the available head.”

Acceptable scenario comparison:

> “A 50 mm pipe scenario reduces modeled head loss from 31% to 12%, assuming the same route, flow, and roughness values.”

Not acceptable without additional governed authority:

> “You should install a 50 mm pipe.”

Causal insights may clarify a decision. They may not silently become professional recommendations.

## 9. AI Constitution

GPT-5.6 is an intelligence, interpretation, and explanation layer. It is not the source of physical truth.

### 9.1 Permitted roles

GPT-5.6 may:

- Interpret property descriptions and user goals
- Propose structured inputs for user confirmation
- Explain deterministic results
- Explain warnings, failures, assumptions, and unknowns
- Compare governed scenarios
- Organize documented evidence
- Assist navigation and interaction
- Generate documentation grounded in canonical state

### 9.2 Prohibited roles

GPT-5.6 may not:

- Invent measurements, prices, sources, or physical results
- Override deterministic calculations
- Assign an unsupported engineering or safety score
- Create a feasibility verdict outside the governed engine
- Convert an explanation into an unsupported prescription
- Hide missing or contradictory information
- Maintain a separate project model
- Generate export claims that cannot be traced to the canonical revision
- Present itself as a licensed professional or final engineering authority

### 9.3 Structured AI boundary

AI-produced structured inputs remain proposed values until validated and accepted through a governed transition. AI-produced explanations remain derived presentation, never canonical project truth.

## 10. Architectural Anti-Patterns

The following conditions are prohibited and must be testable.

### AP-001: Renderer-owned project truth

A renderer stores or mutates authoritative geometry, parameters, components, relationships, or calculated results outside the canonical project state.

### AP-002: Blueprint-only mutation

A blueprint change does not affect the calculations, warnings, feasibility, and other affected representations.

### AP-003: Private calculator state

A calculator maintains domain inputs or results that are not represented in canonical state.

### AP-004: Duplicated domain models

Interactive, architectural, blueprint, field, or export modules maintain separate versions of the project.

### AP-005: Decorative simulation

A scenario changes colors, animations, or labels without changing governed system behavior.

### AP-006: Unsupported feasibility

A viable, fragile, or infeasible label is not reproducibly derived from governed conditions.

### AP-007: AI authority leakage

AI creates a score, verdict, measurement, price, physical result, or recommendation outside the deterministic and evidence boundaries.

### AP-008: Prescriptive insight

A causal explanation is converted into an action recommendation without the additional inputs and authority required to support it.

### AP-009: Stale export

An export is generated from a template, renderer-local copy, or revision other than the current selected canonical revision.

### AP-010: False truth styling

Measured, assumed, calculated, estimated, and unknown values are presented without meaningful distinction.

### AP-011: Hardcoded claim presented as current truth

A hardcoded price, performance value, failure outcome, or promotional statement is presented without its assumption or evidence status.

### AP-012: Partial transition

An interaction updates some dependent state while leaving other affected project truth on the prior revision.

### AP-013: Non-reproducible derived output

The same canonical revision and engine version can produce materially different calculations, verdicts, geometry, or exports without an explicit stochastic model.

### AP-014: Hidden uncertainty

Missing, contradictory, stale, or unsupported information is silently replaced with certainty.

### AP-015: Representational synchronization without computational synchronization

Views appear visually aligned while their calculations, warnings, feasibility, or annotations derive from different state.

## 11. Verification Obligations

Every implementation module must demonstrate that it does not introduce a prohibited anti-pattern.

At minimum, verification must establish:

- A domain-changing interaction creates one committed revision.
- Cancelled previews do not alter canonical state.
- Undo restores the prior canonical state when undo is supported.
- All affected calculations derive from the committed revision.
- Warnings and feasibility use the same revision.
- Every affected representation updates from that revision.
- Exports are associated with the intended revision.
- Truth-state provenance survives calculations, explanations, and exports.
- AI cannot introduce authoritative values or verdicts.
- Repeated evaluation of the same revision is reproducible.

The anti-pattern list is intended to become a source for regression and acceptance tests. Test implementation details belong in later specifications and checklists.

## 12. Provenance and Reuse

EnergyCircle is a distinct Energy-pillar product within the wider Food, Water, Shelter, and Energy vision.

Prior projects may provide:

- Design lineage
- Conceptual lessons
- Interaction philosophy
- Evidence of previous weaknesses
- General engineering patterns

Prior projects do not become EnergyCircle merely because they share philosophy.

Any proposed code reuse must:

- Have a strong engineering justification
- Be explicitly identified before reuse
- Have clear ownership and licensing
- Be isolated and reviewable
- Be documented as pre-existing work
- Be distinguishable from new EnergyCircle work in commit history and submission materials

When reuse is uncertain, EnergyCircle should implement the capability specifically rather than import prior code.

## 13. Constitutional Review

A design or implementation decision fails constitutional review if it:

- Creates another source of project truth
- Bypasses governed transitions
- Obscures a truth state
- Allows a representation to drift
- Grants AI unsupported authority
- Produces an untraceable verdict, insight, or export
- Introduces a listed architectural anti-pattern

Constitutional review asks:

1. What is the canonical input?
2. What transition changes it?
3. What deterministic or evidence-backed process derives the result?
4. Which truth state applies?
5. Which representations consume the result?
6. How is revision consistency verified?
7. Could AI or a renderer introduce conflicting truth?

If those questions cannot be answered, implementation must stop until the architectural ambiguity is resolved.

## 14. Amendment Rule

This Constitution may evolve, but it may not be weakened silently.

An amendment must:

- Identify the invariant or anti-pattern affected
- Explain the engineering reason
- Describe the effect on project truth and existing representations
- Identify required migration and regression coverage
- Be explicitly approved before implementation

Convenience, deadline pressure, visual polish, or framework limitations are not sufficient reasons to bypass a constitutional invariant.

## 15. Approval Condition

This Constitution becomes governing only after explicit approval.

Approval confirms that:

- The distinction between project truth, derived state, and view state is correct.
- Governed preview and committed transactions are required.
- The five truth states are authoritative.
- Deterministic engines govern physical results and feasibility.
- Causal insights explain but do not decide.
- Representations and exports derive from canonical revisions.
- AI remains within the stated limits.
- The architectural anti-patterns are prohibited and testable.
