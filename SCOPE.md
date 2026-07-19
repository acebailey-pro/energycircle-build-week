# EnergyCircle Interactive Milestone Scope

**Project:** EnergyCircle  
**Repository:** `acebailey-pro/energycircle-build-week`  
**Event:** OpenAI Build Week 2026  
**Stage:** Devpost Guided Build — Scope  
**Status:** Approved and frozen for implementation

## 1. Locked objective

The active milestone is:

> **Build the interactive EnergyCircle experience.**

EnergyCircle must become an interactive property-scale energy system planning and blueprint environment. The milestone is not satisfied by placing controls beside a static illustration. Users must be able to manipulate the system and see connected responses across:

- Layout and component placement
- Editable system parameters
- Calculations and system sizing
- Warnings and failure conditions
- Feasibility status
- Visual system behavior
- Synchronized blueprint outputs

The interactive system comes first in implementation order. Blueprint synchronization follows from the same canonical project state.

This objective is locked. Remaining time may change implementation and verification order, but it does not authorize a redesign, restart, reduction, or different product definition.

## 2. Product mission

EnergyCircle helps people explore, configure, understand, and visualize integrated energy systems for real properties. It connects physical assets and constraints that are normally considered separately—including ponds, elevation, sunlight, wind, tanks and cisterns, irrigation pressure, existing buildings, and open land—into complete, understandable system architectures.

EnergyCircle must carry an idea far enough that a user can understand it, test it, price it, build it, operate it, maintain it, and identify the professional review still required.

Every system is understood as a connected whole:

**Source → conversion → storage → distribution → load → recharge → failure protection**

The product must communicate that system quickly, spatially, and visually. It must support accessible DIY configurations and more advanced or higher-budget installations without pretending that one configuration, calculation, or recommendation fits every property.

## 3. Primary users

Primary users include:

- Property and land owners exploring the energy potential of existing assets
- Homestead and resilient-home owners planning practical energy systems
- DIY users who need accessible configurations, clear assumptions, and explicit limits
- Users evaluating more advanced or higher-budget property installations
- Builders, contractors, and operators who need a physical and operational picture
- Educators and learners exploring how integrated property-energy systems behave
- Reviewing professionals who need clear inputs, calculations, assumptions, warnings, and boundaries

EnergyCircle supports these users without replacing licensed engineers, electricians, contractors, surveys, permits, inspections, or professional approval.

## 4. Core user outcome

A user can move from:

> “What useful energy assets and constraints does this property have?”

to:

> “I can see and manipulate a complete proposed system; understand its physical relationships, sizing, feasibility, risks, assumptions, and unknowns; and obtain synchronized visual and blueprint representations of the current design.”

The experience must let the user see cause and effect. A meaningful visual or parameter change must produce understandable connected consequences rather than updating an isolated number.

## 5. In-scope capabilities

The EnergyCircle product scope includes:

1. Interactive system layout and component placement
2. Editable parameters directly connected to the visual system
3. Deterministic calculations and system sizing
4. Feasibility states such as viable, fragile, and infeasible
5. Dynamic warnings and failure conditions
6. Visual representation of system behavior
7. Component relationships and dependencies
8. Blueprint-grade synchronized outputs
9. Component breakdowns and exploded-system views where appropriate
10. Best-practice guidance and explicit limitations
11. Cost awareness using realistic component-price assumptions where evidence is available
12. Clear distinction among assumptions, calculated outputs, and unknown information
13. Property and objective intake translated into structured constraints
14. Comparison and compilation of compatible system architectures
15. Compact, field-ready outputs derived from the current project state
16. GPT-5.6-supported explanation, interpretation, guidance, and documentation within deterministic boundaries

The supported product direction includes solar-powered water storage, gravity-based energy storage, twin-pond systems, wind-assisted water lifting, rain-catch gravity systems, irrigation pressure recovery, and hybrid property microgrids.

All listed capabilities remain in product scope. Their position in the ordered implementation priorities indicates dependency and delivery order, not removal or redefinition.

## 6. Explicit exclusions and forbidden reinterpretations

EnergyCircle must not be reinterpreted as:

- A single isolated calculator
- Only a micro-hydro tool
- A static illustration
- A form placed beside an image
- A collection of disconnected calculators
- A generic sidebar or admin dashboard
- A manual storage application
- A chat wrapper
- A fake engineering oracle
- An AI-generated recommendation system without deterministic support
- A broad, unrelated sustainability platform
- A new product direction invented for the hackathon

The synchronized visual system may not be removed or replaced with static diagrams. Interaction may not be simulated by controls that do not affect the actual system. Core capabilities may not be silently deferred; implementation ordering must continue to identify them.

The current Scope stage also explicitly excludes:

- Coding or implementation
- A PRD
- A technical specification
- An implementation checklist
- Final visual design decisions

Those artifacts or activities require explicit approval to advance beyond Scope.

## 7. Canonical system behavior

EnergyCircle must use one canonical project model as the source of truth for the property, objective, assets, constraints, system architecture, components, relationships, parameters, geometry, calculations, costs, failures, feasibility, guidance, and blueprint annotations.

All product representations must derive from that model. They must not maintain independent versions of the project.

The required propagation pattern is:

1. A user manipulates a component, connection, route, or parameter.
2. The canonical project state records the meaningful change.
3. Connected relationships and deterministic calculations are reevaluated.
4. System sizing, warnings, failure states, and feasibility are updated.
5. Visual behavior reflects the new state.
6. Technical illustrations, blueprints, exploded views, and exports reflect the same current state.

Examples include:

- Moving or replacing a component updates system relationships and relevant routing.
- Editing a parameter updates calculations and sizing.
- Calculation changes update warnings and feasibility.
- Failure conditions alter visual behavior and blueprint annotations.
- Blueprint outputs reflect the current system rather than a disconnected template.

One canonical state and one governed change path are non-negotiable.

## 8. Interaction requirements

The experience must feel spatial, visual, connected, and directly manipulable.

Required interaction characteristics include:

- The user begins with a complete compiled system rather than an empty canvas.
- Meaningful components can be moved, replaced, resized, rerouted, added, or removed where appropriate.
- Editable parameters are presented in direct relationship to the affected system element.
- Controls visibly affect the actual system, its relationships, or its behavior.
- Changes reveal their consequences through calculations, warnings, feasibility, flow, sizing, or annotations.
- Drag-and-drop or direct spatial manipulation is preferred where it communicates real system meaning.
- Excessive manual data entry is avoided.
- Component dependencies and active paths are visually understandable.
- Failure and recovery behavior can be inspected in context.
- The purpose and central interaction of EnergyCircle should be understandable within approximately 30 seconds.
- A generic left-sidebar application is not the default structure unless a sidebar is clearly subordinate to and justified by the interactive experience.

Interaction is a product function, not presentation layered over a static system.

## 9. Calculation and truthfulness requirements

Deterministic calculations are authoritative wherever physical results can be calculated. This includes, as applicable:

- Energy balance
- Water volume
- Elevation head
- Flow and pressure
- Efficiency and hydraulic losses
- Runtime
- Recharge requirements
- Component sizing
- Viability classification

The governing rule is:

> **No generated claim may exceed the deterministic energy balance.**

The product must visibly distinguish:

- User-provided measurements
- Assumptions
- Deterministically calculated outputs
- Evidence-backed price information
- Estimated ranges
- Missing or unknown information
- Contradictory or unsupported inputs

EnergyCircle must not fabricate certainty. When information is missing, contradictory, physically invalid, stale, or outside supported limits, the system must explain the condition and either request measurement, reduce confidence, mark the system fragile or infeasible, or refuse to produce an unsupported result.

Warnings and refusal conditions are product features. They must not be hidden as implementation errors.

## 10. Visual and blueprint requirements

The visual system is central to EnergyCircle. It must support synchronized representations including:

- Interactive system layout
- System-flow visualization
- Technical or architectural illustration
- Blueprint output
- Exploded or component view
- Field-oriented guidance

The long-term export direction includes:

- SVG
- Architectural illustration
- Hand-drawn blueprint style

These representations must be generated from the same canonical model and current system geometry, parameters, relationships, calculations, failures, and annotations.

A visual representation may emphasize different information, but it may not become a separate manually maintained graphic. A change to the governed project must propagate to every affected representation. Blueprint outputs must describe the current system, not a generic template.

## 11. AI role and limits

GPT-5.6 may support:

- Interpretation of property descriptions and goals
- Translation of language into structured constraints
- Interaction guidance
- Explanation of architecture options and tradeoffs
- Explanation of calculations already produced by the deterministic engine
- Interpretation of warnings and failure conditions
- Organization of pricing evidence
- Documentation and field-facing explanations

GPT-5.6 must not:

- Invent measurements, physical results, prices, sources, or certainty
- Override deterministic calculations
- Replace the canonical project model
- Select a system without exposing the supported reasoning and constraints
- Conceal missing information or unsupported conditions
- Present itself as a licensed professional or final engineering authority

GPT-5.6 is an intelligence and interaction layer. It is not the physics engine.

## 12. Acceptance conditions for the interactive milestone

The interactive milestone is accepted only when the product demonstrates all of the following as one connected experience:

1. A new user can identify EnergyCircle’s purpose and primary interaction within roughly 30 seconds.
2. A property scenario resolves into a complete, visible system rather than an empty canvas or isolated calculator.
3. The user can directly manipulate a meaningful component, relationship, route, or parameter.
4. That change updates the canonical project state.
5. Connected calculations and system sizing respond deterministically.
6. Warnings and feasibility respond with states such as viable, fragile, or infeasible.
7. Visual system behavior communicates the consequence of the change.
8. At least one failure condition and its containment, recovery, or fatal consequence can be inspected in context.
9. Blueprint or technical output reflects the current changed system rather than a disconnected template.
10. Assumptions, calculations, evidence, and unknowns are visibly distinguished.
11. Invalid or unsupported conditions produce transparent warnings or refusal instead of fabricated results.
12. The same model can represent accessible DIY and more advanced configurations without creating separate products.
13. The live behavior, repository documentation, Devpost description, and demonstration video make consistent claims.

These conditions lock the required behavior. The later PRD and technical specification may define detailed scenarios and measures but may not weaken them.

## 13. Dependencies and major risks

### Dependencies

- A canonical representation of properties, components, relationships, parameters, geometry, and outputs
- Defined physical units, calculation boundaries, assumptions, and feasibility thresholds
- Reference scenarios spanning accessible DIY and advanced configurations
- A visual interaction model capable of expressing system relationships and propagation
- A shared mapping from canonical state to interactive, architectural, blueprint, and exploded representations
- Traceable sources and freshness metadata for price evidence
- Explicit professional-review and safety boundaries
- Documented use of Codex and GPT-5.6 during the hackathon period

### Major risks

- **Superficial interaction:** Controls may appear interactive without changing the governed system.
- **State divergence:** Calculations, visuals, warnings, and blueprints may drift into separate project versions.
- **False precision:** Incomplete measurements or approximate prices may appear more certain than the evidence permits.
- **Scope-order confusion:** Later implementation priority may be misread as removal from product scope.
- **Visual complexity:** Rich spatial behavior may obscure rather than clarify system relationships.
- **Blueprint credibility:** Polished outputs may imply engineering approval that EnergyCircle does not provide.
- **AI authority drift:** Generated explanations may introduce unsupported physical or pricing claims.
- **Performance and synchronization:** Direct manipulation may cause delayed, partial, or inconsistent dependent updates.
- **Submission inconsistency:** The implemented behavior may fail to match the description, README, or demo.

Risk treatment must preserve the locked objective: risks are addressed through governed state, deterministic authority, transparent uncertainty, synchronized representations, and explicit limitations—not by turning EnergyCircle into a different product.

## 14. Ordered implementation priorities

This order reflects dependency and hackathon verification value. It does not reduce the product definition.

1. **Canonical project state and propagation behavior**  
   Establish the single governed system that every interaction and output must share.

2. **Interactive system layout and direct manipulation**  
   Make the actual system spatially manipulable, with visible component relationships.

3. **Editable parameters connected to the visual system**  
   Ensure user changes affect governed components rather than disconnected controls.

4. **Deterministic calculations and system sizing**  
   Connect physical changes to authoritative outputs, assumptions, and limits.

5. **Feasibility, warnings, and failure propagation**  
   Make viable, fragile, infeasible, warning, containment, recovery, and refusal states visible.

6. **Visual system behavior and flow**  
   Show active paths, dependencies, consequences, and system response in context.

7. **Synchronized blueprint and technical outputs**  
   Derive current annotations, routes, dimensions, warnings, and status from the same state.

8. **Component breakdowns and exploded-system views**  
   Reveal assemblies, connections, maintenance access, and repair implications where appropriate.

9. **Best-practice guidance and explicit limitations**  
   Connect guidance, safety boundaries, and professional-review needs to the active design.

10. **Cost awareness and price evidence**  
    Associate components and quantities with realistic, traceable, date-stamped assumptions where data exists.

11. **GPT-5.6 interpretation and explanation**  
    Add grounded language assistance without weakening deterministic authority.

12. **Additional synchronized visual and export representations**  
    Extend architectural illustration, SVG, hand-drawn blueprint style, and field-ready outputs from the canonical project.

13. **Full-system verification and submission alignment**  
    Verify propagation, truthfulness, interaction, visual consistency, documentation, and reproducibility.

## 15. Verification requirements

Verification must establish that:

- Meaningful user interactions alter canonical state.
- Every dependent output updates from that state rather than from duplicated local values.
- Deterministic calculations produce consistent results for reference scenarios.
- Units, assumptions, unknowns, and invalid inputs remain visible.
- Viable, fragile, and infeasible conditions are distinguishable and reproducible.
- Failure conditions propagate to calculations, visual behavior, status, and blueprint annotations.
- Blueprint and technical representations match the current interactive system.
- Direct manipulation works as an actual system operation, not a decorative gesture.
- Accessible DIY and advanced scenarios are both representable by the product model.
- Missing or contradictory information cannot create fabricated certainty.
- GPT-5.6 explanations remain grounded in canonical inputs and deterministic outputs.
- Price evidence includes source and freshness information when used.
- Professional-review boundaries remain explicit.
- The core experience is understandable quickly and does not collapse into a generic dashboard.
- Installation and operation are reproducible for judges.
- The product behaves as shown in the demo and described on Devpost.

Detailed test cases, technical mechanisms, and checklist ownership belong to later approved stages.

## 16. Stop condition for the Scope stage

The Scope stage stops with this document presented for review.

No PRD, technical specification, implementation checklist, visual redesign, or code work may begin until the user explicitly approves this Scope and directs the guided build to advance.

Approval must confirm that:

- The interactive EnergyCircle experience is the locked milestone.
- The existing EnergyCircle definition remains authoritative.
- All core capabilities remain in scope.
- The exclusions and truthfulness rules are correct.
- The implementation priorities change order only, not product identity.
- The acceptance conditions accurately describe the required interactive milestone.
