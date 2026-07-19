"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import {
  answerFamilyQuestion,
  beginPreview,
  commitMutation,
  commitPreview,
  createReferenceProject,
  deriveCausalInsight,
  evaluateProject,
  FAMILY_SCENARIOS,
  referenceProject,
  updatePreview,
  type ComponentId,
  type DomainMutation,
  type EnergyComponent,
  type LiveFamilyId,
  type Point,
  type PreviewTransaction,
  type ProjectModel,
  type RouteKind,
  type TruthValue,
} from "../lib/energy-engine";
import { DEFAULT_FAMILY, ENERGY_FAMILIES } from "../lib/architecture-catalog";
import { deriveEngineeringPackage } from "../lib/engineering-package";
import { EnergyCircleReport } from "./EnergyCircleReport";

type ViewMode = "property" | "system" | "blueprint";
type PackageView = "access" | "components" | "budget" | "resilience" | "field" | "record";

const formatValue = (metric: TruthValue) =>
  metric.value === null ? "Unknown" : `${String(metric.value)} ${metric.unit}`;

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

function Metric({ metric, emphasis = false }: { metric: TruthValue; emphasis?: boolean }) {
  return (
    <div className={"metric" + (emphasis ? " metric--emphasis" : "")}>
      <div className="metric__topline">
        <span>{metric.label}</span>
        <span className={"truth truth--" + metric.truth}>{metric.truth}</span>
      </div>
      <strong>{formatValue(metric)}</strong>
    </div>
  );
}

function RouteLine({ from, to, kind, blocked }: { from: Point; to: Point; kind: RouteKind; blocked: boolean }) {
  const scaledY = (to.y - from.y) * 0.625;
  const length = Math.hypot(to.x - from.x, scaledY);
  const angle = Math.atan2(scaledY, to.x - from.x) * (180 / Math.PI);
  const style: CSSProperties = {
    left: `${from.x.toFixed(4)}%`,
    top: `${from.y.toFixed(4)}%`,
    width: `${length.toFixed(4)}%`,
    transform: `rotate(${angle.toFixed(4)}deg)`,
  };
  return (
    <div className={`route route--${kind}${blocked ? " route--blocked" : ""}`} style={style} aria-hidden="true">
      <span />
    </div>
  );
}

function PropertyObject({ component }: { component: EnergyComponent }) {
  const { id } = component;
  if (id === "solar") {
    return <span className="physical-object physical-object--solar" aria-hidden="true"><i /><i /><i /><i /><b /></span>;
  }
  if (id === "collector") {
    return <span className="physical-object physical-object--collector" aria-hidden="true"><i /><i /><i /><b /></span>;
  }
  if (id === "upperReservoir" || id === "liftTank") {
    return (
      <span className="physical-object physical-object--tank" aria-hidden="true">
        <i className="tank__rim" /><i className="tank__water" /><i className="tank__body" /><i className="tank__legs" />
      </span>
    );
  }
  if (id === "lowerReservoir") {
    return <span className="physical-object physical-object--pond" aria-hidden="true"><i /><i /><b /></span>;
  }
  if (id === "home" || id === "heatLoad" || id === "essentialLoad") {
    return (
      <span className="physical-object physical-object--home" aria-hidden="true">
        <i className="home__roof" /><i className="home__wall" /><i className="home__window" /><i className="home__door" /><b />
      </span>
    );
  }
  if (id === "inverter" || id === "windController" || id === "flowController" || id === "hybridController") {
    return <span className="physical-object physical-object--inverter" aria-hidden="true"><i /><b>{component.mark}</b></span>;
  }
  if (id === "battery") {
    return (
      <span className="physical-object physical-object--battery" aria-hidden="true">
        <i className="battery__charge" /><i className="battery__terminal" /><i className="battery__terminal" /><b>BATTERY</b>
      </span>
    );
  }
  if (id === "windTurbine") {
    return <span className="physical-object physical-object--wind" aria-hidden="true"><i className="wind__mast" /><i className="wind__rotor" /><i className="wind__hub" /></span>;
  }
  if (["digester", "gasStorage", "hotWaterTank", "thermalBuffer"].includes(id)) {
    return <span className={`physical-object physical-object--vessel physical-object--${id}`} aria-hidden="true"><i /><b>{component.mark}</b></span>;
  }
  if (id === "pedalDrive") {
    return <span className="physical-object physical-object--pedal" aria-hidden="true"><i /><b /></span>;
  }
  if (id === "feedstock") {
    return <span className="physical-object physical-object--feedstock" aria-hidden="true"><i /><b>BIO</b></span>;
  }
  return (
    <span className={`physical-object physical-object--machine physical-object--${id} physical-object--kind-${component.kind}`} aria-hidden="true">
      <i className="machine__house" /><i className="machine__rotor" /><i className="machine__hub" /><b>{component.mark}</b>
    </span>
  );
}

export function EnergyCircleExperience() {
  const [project, setProject] = useState<ProjectModel>(referenceProject);
  const [preview, setPreview] = useState<PreviewTransaction | null>(null);
  const [selected, setSelected] = useState<ComponentId>("upperReservoir");
  const [viewMode, setViewMode] = useState<ViewMode>("property");
  const [insight, setInsight] = useState(FAMILY_SCENARIOS["gravity-storage"].initialInsight);
  const [lastChanged, setLastChanged] = useState<ComponentId>("upperReservoir");
  const [promptFamily, setPromptFamily] = useState<LiveFamilyId | null>("gravity-storage");
  const [activeQuestion, setActiveQuestion] = useState(FAMILY_SCENARIOS["gravity-storage"].questions[0]);
  const [packageView, setPackageView] = useState<PackageView>("access");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const scenarioRef = useRef<HTMLElement>(null);
  const transactionRef = useRef<PreviewTransaction | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });

  const renderedProject = preview?.draft ?? project;
  const result = useMemo(() => evaluateProject(renderedProject), [renderedProject]);
  const engineeringPackage = useMemo(() => deriveEngineeringPackage(renderedProject, result), [renderedProject, result]);
  const scenario = FAMILY_SCENARIOS[project.familyId];
  const selectedComponent = renderedProject.components[selected] ?? Object.values(renderedProject.components)[0];
  const focusedFamily = ENERGY_FAMILIES.find((family) => family.id === project.familyId) ?? DEFAULT_FAMILY;
  const failureActive =
    renderedProject.failures.activeFailure ||
    renderedProject.failures.intakeBlocked ||
    renderedProject.failures.inverterOffline;

  const commit = useCallback((mutation: DomainMutation, changed?: ComponentId) => {
    setProject((current) => {
      const before = evaluateProject(current);
      const next = commitMutation(current, mutation);
      setInsight(deriveCausalInsight(before, evaluateProject(next)));
      return next;
    });
    if (changed) setLastChanged(changed);
  }, []);

  const activateFamily = (familyId: LiveFamilyId) => {
    if (familyId === project.familyId) {
      scenarioRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    const nextScenario = FAMILY_SCENARIOS[familyId];
    setProject(createReferenceProject(familyId, project.revision + 1));
    setSelected(nextScenario.initialComponent);
    setLastChanged(nextScenario.initialComponent);
    setPromptFamily(familyId);
    setInsight(nextScenario.initialInsight);
    setActiveQuestion(nextScenario.questions[0]);
    setPreview(null);
    transactionRef.current = null;
    setViewMode("property");
    requestAnimationFrame(() => scenarioRef.current?.scrollIntoView({ behavior: "auto", block: "start" }));
  };

  const pointFromPointer = (event: PointerEvent<HTMLButtonElement>): Point => {
    const bounds = surfaceRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    };
  };

  const startDrag = (event: PointerEvent<HTMLButtonElement>, id: ComponentId) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(id);
    const pointer = pointFromPointer(event);
    const current = project.components[id]?.position;
    if (!current) return;
    dragOffsetRef.current = { x: current.x - pointer.x, y: current.y - pointer.y };
    const transaction = beginPreview(project, { type: "move-component", id, position: current });
    transactionRef.current = transaction;
    setPreview(transaction);
  };

  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!transactionRef.current) return;
    const active = transactionRef.current;
    const pointer = pointFromPointer(event);
    const mutation: DomainMutation = {
      type: "move-component",
      id: active.mutation.type === "move-component" ? active.mutation.id : selected,
      position: { x: pointer.x + dragOffsetRef.current.x, y: pointer.y + dragOffsetRef.current.y },
    };
    const transaction = updatePreview(active, mutation);
    transactionRef.current = transaction;
    setPreview(transaction);
  };

  const finishTransaction = () => {
    const transaction = transactionRef.current;
    if (!transaction) return;
    if (JSON.stringify(transaction.base) === JSON.stringify(transaction.draft)) {
      transactionRef.current = null;
      setPreview(null);
      return;
    }
    const committed = commitPreview(transaction);
    setProject(committed);
    setInsight(deriveCausalInsight(evaluateProject(transaction.base), evaluateProject(committed)));
    if (transaction.mutation.type === "move-component") {
      setLastChanged(transaction.mutation.id);
      if (transaction.mutation.id === FAMILY_SCENARIOS[transaction.base.familyId].initialComponent) setPromptFamily(null);
    }
    transactionRef.current = null;
    setPreview(null);
  };

  const cancelTransaction = () => {
    transactionRef.current = null;
    setPreview(null);
  };

  const startControlPreview = (event: PointerEvent<HTMLInputElement>, mutation: DomainMutation) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const transaction = beginPreview(project, mutation);
    transactionRef.current = transaction;
    setPreview(transaction);
  };

  const updateControlPreview = (mutation: DomainMutation) => {
    if (!transactionRef.current) {
      commit(mutation);
      return;
    }
    const transaction = updatePreview(transactionRef.current, mutation);
    transactionRef.current = transaction;
    setPreview(transaction);
  };

  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, id: ComponentId) => {
    const directions: Record<string, Point> = {
      ArrowUp: { x: 0, y: -2 }, ArrowDown: { x: 0, y: 2 },
      ArrowLeft: { x: -2, y: 0 }, ArrowRight: { x: 2, y: 0 },
    };
    const delta = directions[event.key];
    if (!delta) return;
    event.preventDefault();
    const current = project.components[id]?.position;
    if (!current) return;
    commit({ type: "move-component", id, position: { x: current.x + delta.x, y: current.y + delta.y } }, id);
    if (id === scenario.initialComponent) setPromptFamily(null);
  };

  const statusDescription = result.feasibility === "VIABLE"
    ? "The reference inputs meet the defined output and autonomy thresholds."
    : result.feasibility === "FRAGILE"
      ? "The path operates, but at least one defined threshold is not met."
      : "A modeled constraint prevents the path from serving its defined load.";
  const questionAnswer = answerFamilyQuestion(activeQuestion, result);
  const downloadRecord = () => {
    const blob = new Blob([JSON.stringify(engineeringPackage.record, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project.familyId}-revision-${project.revision}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={`experience experience--${viewMode} family--${project.familyId}`}>
      <header className="topbar">
        <a className="brand" href="#families" aria-label="EnergyCircle home"><span className="brand__orbit" aria-hidden="true"><i /></span><span>EnergyCircle</span></a>
        <div className="topbar__context"><span>Nine governed families</span><i aria-hidden="true" /><span>Revision {project.revision}</span></div>
        <button className="quiet-button" type="button" onClick={() => {
          setProject((current) => createReferenceProject(current.familyId, current.revision + 1));
          setSelected(scenario.initialComponent);
          setLastChanged(scenario.initialComponent);
          setPromptFamily(project.familyId);
          setPreview(null);
          transactionRef.current = null;
          setInsight(scenario.initialInsight);
          setActiveQuestion(scenario.questions[0]);
        }}>Reset system</button>
      </header>

      <section className="hero" id="families">
        <div className="hero__copy">
          <span className="eyebrow">Property-scale energy systems</span>
          <h1>Start with what your property already has.</h1>
          <p>Explore, manipulate, calculate, price, and combine nine complete energy pathways—from sunlight and wind to water, heat, biomass, motion, elevation, and coordinated hybrids.</p>
        </div>
        <div className="family-focus" aria-live="polite">
          <div className="family-focus__topline"><span>{focusedFamily.glyph}</span><small>Active governed system</small></div>
          <strong>{focusedFamily.name}</strong><p>{focusedFamily.pathway}</p>
          <div className="family-focus__facts"><span><b>Source</b>{focusedFamily.source}</span><span><b>Role</b>{focusedFamily.purpose}</span></div>
        </div>
      </section>

      <section className="family-atlas" aria-labelledby="family-atlas-title">
        <div className="family-atlas__heading">
          <div><span className="eyebrow">Energy family atlas</span><h2 id="family-atlas-title">Nine systems. One property truth.</h2></div>
          <p>Select any family to open its components, property interaction, deterministic balance, constraints, failures, costs, questions, and synchronized views.</p>
        </div>
        <div className="family-atlas__grid">
          {ENERGY_FAMILIES.map((family) => (
            <button type="button" key={family.id} className={`family-card is-live${project.familyId === family.id ? " is-focused is-active-model" : ""}`} aria-pressed={project.familyId === family.id} onClick={() => activateFamily(family.id)}>
              <span className="family-card__glyph" aria-hidden="true">{family.glyph}</span>
              <span className="family-card__copy"><strong>{family.shortName}</strong><small>{family.source}</small></span>
              <span className="family-card__state">{project.familyId === family.id ? "Active system" : "Open system"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="scenario-intro" id="scenario" ref={scenarioRef}>
        <div><span className="eyebrow">Interactive system {scenario.number} of 09</span><h2>{scenario.title}</h2><p>{scenario.description}</p></div>
        <div className={`verdict verdict--${result.feasibility.toLowerCase()}`} aria-live="polite"><span>System verdict</span><strong>{result.feasibility}</strong><p>{statusDescription}</p></div>
      </section>

      <section className="workspace" aria-label={`Interactive ${scenario.title} workspace`}>
        <div className="workspace__main">
          <div className="viewbar" aria-label="System representation">
            <div className="segmented">{(["property", "system", "blueprint"] as ViewMode[]).map((mode) => <button type="button" key={mode} className={viewMode === mode ? "is-active" : ""} aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)}>{mode}</button>)}</div>
            <span className="viewbar__hint"><i aria-hidden="true" />{viewMode === "property" ? "Move any component" : "Every view shares this revision"}</span>
          </div>

          <div className="property" ref={surfaceRef} data-view={viewMode} data-family={project.familyId}>
            <div className="property__sky" aria-hidden="true" /><div className="property__contours" aria-hidden="true" />
            <div className="property__ridge property__ridge--back" aria-hidden="true" /><div className="property__ridge property__ridge--front" aria-hidden="true" />
            <div className="property__sun" aria-hidden="true" /><div className="property__road" aria-hidden="true" />
            <div className="property__resource-zone" aria-hidden="true">Modeled resource zone</div>
            <div className="property__grove" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <div className="property__labels" aria-hidden="true"><span className="elevation elevation--high">{scenario.sceneLabelA}</span><span className="elevation elevation--low">{scenario.sceneLabelB}</span></div>

            {scenario.routes.map((route) => {
              const from = renderedProject.components[route.from];
              const to = renderedProject.components[route.to];
              if (!from || !to) return null;
              return <RouteLine key={`${route.kind}-${route.from}-${route.to}`} from={from.position} to={to.position} kind={route.kind} blocked={failureActive} />;
            })}

            {Object.values(renderedProject.components).map((component) => {
              const style: CSSProperties = { left: `${component.position.x}%`, top: `${component.position.y}%` };
              return (
                <button type="button" key={component.id} className={`component component--${component.kind}${selected === component.id ? " is-selected" : ""}${lastChanged === component.id ? " is-changed" : ""}`} style={style}
                  aria-label={`${component.label}. Drag to reposition, or use arrow keys. Current position ${Math.round(component.position.x)}, ${Math.round(component.position.y)}.`}
                  onClick={() => setSelected(component.id)} onPointerDown={(event) => startDrag(event, component.id)} onPointerMove={moveDrag} onPointerUp={finishTransaction} onPointerCancel={cancelTransaction} onKeyDown={(event) => moveWithKeyboard(event, component.id)}>
                  <span className="component__halo" aria-hidden="true" /><PropertyObject component={component} />
                  <span className="component__mark">{component.mark}</span><span className="component__label">{component.label}</span>
                  {component.id === scenario.initialComponent && promptFamily === project.familyId && viewMode === "property" && <span className="component__start" aria-hidden="true"><small>Start here</small><strong>{scenario.startPrompt}</strong><i>↑</i></span>}
                </button>
              );
            })}

            <div className="flow-key" aria-hidden="true">{scenario.flowKinds.map((item) => <span key={item.kind}><i className={`${item.kind}-key`} />{item.label}</span>)}</div>
            <div className="scale-key" aria-hidden="true"><i /><span>20 m</span></div>
          </div>

          <div className="insight" aria-live="polite"><span className="insight__signal" aria-hidden="true">↳</span><div><span className="eyebrow">What changed</span><p>{insight}</p></div></div>
        </div>

        <aside className="analysis-panel" aria-label="System analysis">
          <div className="analysis-panel__section analysis-panel__section--metrics">
            <div className="section-heading"><div><span className="eyebrow">Governed balance</span><h2>{viewMode === "property" ? "What this system can do" : "Energy and resource balance"}</h2></div>{preview && <span className="preview-badge">Preview</span>}</div>
            <div className="metrics-grid">{result.headlineMetrics.map((metric, index) => <Metric key={metric.label} metric={metric} emphasis={index === 0 || index === 2} />)}</div>
            <div className="target-line"><span>{result.targetMetric.label}</span><strong>{formatValue(result.targetMetric)}</strong></div>
          </div>

          <div className="analysis-panel__section">
            <div className="section-heading"><div><span className="eyebrow">System variables</span><h2>{selectedComponent?.label}</h2></div><span className="component-type">{selectedComponent?.kind}</span></div>
            {scenario.controls.map((control) => {
              const amount = renderedProject.parameters[control.key] ?? control.min;
              return (
                <label className="control" key={control.key}>
                  <span>{control.label} <small>assumed</small></span><strong>{amount} {control.unit}</strong>
                  <input type="range" min={control.min} max={control.max} step={control.step} value={amount}
                    onPointerDown={(event) => startControlPreview(event, { type: "set-parameter", key: control.key, value: amount })}
                    onPointerUp={finishTransaction} onPointerCancel={cancelTransaction}
                    onChange={(event) => updateControlPreview({ type: "set-parameter", key: control.key, value: Number(event.target.value) })}
                    aria-label={`${control.label} in ${control.unit}`} />
                </label>
              );
            })}
          </div>

          <div className="analysis-panel__section">
            <div className="section-heading"><div><span className="eyebrow">Constraint trace</span><h2>{result.warnings.length === 0 ? "No active warnings" : `${result.warnings.length} active`}</h2></div></div>
            <div className="warnings">{result.warnings.length === 0 ? <div className="warning warning--clear"><i aria-hidden="true">✓</i><div><strong>Defined thresholds met</strong><p>No current engine warning is active.</p></div></div> : result.warnings.map((warning) => <div className={`warning warning--${warning.severity}`} key={warning.id}><i aria-hidden="true">!</i><div><strong>{warning.title}</strong><p>{warning.detail}</p></div></div>)}</div>
          </div>

          <div className="analysis-panel__section analysis-panel__section--failure">
            <div><span className="eyebrow">Failure trace</span><strong>{scenario.failureLabel}</strong><p>{scenario.failureDetail}</p></div>
            <button className={`toggle ${failureActive ? "is-on" : ""}`} type="button" role="switch" aria-checked={failureActive} aria-label={`Simulate ${scenario.failureLabel}`} onClick={() => commit({ type: "set-active-failure", active: !failureActive })}><span /></button>
          </div>
        </aside>
      </section>

      <section className="decision-layer" aria-labelledby="decision-title">
        <div className="decision-layer__questions">
          <span className="eyebrow">Plain-language system guide</span><h2 id="decision-title">Ask the questions that matter on real land.</h2>
          <div className="question-chips">{scenario.questions.map((question) => <button type="button" key={question} className={activeQuestion === question ? "is-active" : ""} aria-pressed={activeQuestion === question} onClick={() => setActiveQuestion(question)}>{question}</button>)}</div>
          <div className="question-answer" aria-live="polite"><span>{result.feasibility}</span><p>{questionAnswer}</p></div>
        </div>
        <div className="cost-card">
          <div className="cost-card__heading"><span className="eyebrow">Cost awareness</span><span className="truth truth--estimated">estimated</span></div>
          <h2>Planning envelopes—not quotes.</h2>
          <div className="cost-ranges"><div><span>Accessible / owner-built</span><strong>{formatMoney(result.cost.accessible.low)}–{formatMoney(result.cost.accessible.high)}</strong></div><div><span>Professionally installed</span><strong>{formatMoney(result.cost.installed.low)}–{formatMoney(result.cost.installed.high)}</strong></div></div>
          <p>{result.cost.basis}</p>
          <small>{result.cost.sourceUrl ? <a href={result.cost.sourceUrl} target="_blank" rel="noreferrer">{result.cost.sourceLabel}</a> : result.cost.sourceLabel} · {result.cost.sourceYear} · incentives excluded</small>
        </div>
      </section>

      <section className="system-chain" aria-label="Complete system architecture">
        <div><span className="eyebrow">Complete system</span><h2>Nothing exists as an isolated calculator.</h2></div>
        <div className="system-chain__path"><span>Source</span><i>→</i><span>Conversion</span><i>→</i><span>Storage</span><i>→</i><span>Distribution</span><i>→</i><span>Load</span><i>→</i><span>Recharge</span><i>→</i><span>Protection</span></div>
      </section>

      <section className="engineering-package" aria-labelledby="package-title">
        <div className="engineering-package__heading">
          <div><span className="eyebrow">From model to field</span><h2 id="package-title">The complete engineering package follows every change.</h2></div>
          <div className="package-actions"><button type="button" className="print-package" onClick={() => window.print()}><span>Detailed field package</span><strong>Print / save PDF</strong></button><div className="revision-seal"><span>Current record</span><strong>{engineeringPackage.fingerprint}</strong><small>Revision {engineeringPackage.revision}</small></div></div>
        </div>
        <p className="engineering-package__intro">The interactive property is the front door. This package carries the same governed revision into equipment, budget, resilience, execution, and a portable project record.</p>

        <div className="package-tabs" role="tablist" aria-label="Engineering package views">
          {([
            ["access", "$0 to complete"],
            ["components", "Component schedule"],
            ["budget", "Budget"],
            ["resilience", "Resilience"],
            ["field", "Field sequence"],
            ["record", "Revision record"],
          ] as Array<[PackageView, string]>).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={packageView === id} className={packageView === id ? "is-active" : ""} onClick={() => setPackageView(id)}>{label}</button>)}
        </div>

        <div className="package-panel" role="tabpanel">
          {packageView === "access" && <>
            <div className="package-panel__topline"><div><span className="eyebrow">Access path</span><h3>Start with what is already available.</h3></div><p>A free entry may provide direct service or reduce demand. It is not mislabeled as a free whole-property power system.</p></div>
            <div className="access-path">{engineeringPackage.accessPath.map((tier, index) => <article key={tier.id} className={`access-tier access-tier--${tier.id}`}>
              <div className="access-tier__rail"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
              <div className="access-tier__body"><div className="access-tier__title"><div><span>{tier.id === "existing" ? "Begin here" : "Build stage"}</span><h4>{tier.label}</h4></div><strong>{tier.costLabel}</strong></div>
                <p className="access-tier__service">{tier.service}</p>
                <div className="access-tier__output"><span>Real-world output</span><p>{tier.modeledOutput}</p><small className={`truth truth--${tier.outputTruth}`}>{tier.outputTruth}</small></div>
                <div className="access-tier__details"><div><strong>Requires</strong><ul>{tier.requires.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>Honest boundary</strong><p>{tier.limitation}</p></div><div><strong>Investment preserved</strong><p>{tier.carriesForward}</p></div></div>
              </div>
            </article>)}</div>
            <aside className="access-disclosure"><strong>Assistance changes out-of-pocket cost, not engineering truth.</strong><p>Donated equipment, local programs, rebates, and weatherization assistance may reduce what an owner pays. Ratings, compatibility, containment, protection, inspection, and maintenance still have to be resolved.</p></aside>
          </>}

          {packageView === "components" && <>
            <div className="package-panel__topline"><div><span className="eyebrow">Component schedule</span><h3>{engineeringPackage.componentSchedule.length} connected assemblies</h3></div><p>Roles, dependencies, failure modes, and maintenance checkpoints are derived from the active system graph.</p></div>
            <div className="component-schedule">{engineeringPackage.componentSchedule.map((item) => <article key={item.id}>
              <div><span className="schedule-mark">{renderedProject.components[item.id]?.mark}</span><span className="truth truth--assumed">{item.truth}</span></div>
              <h4>{item.label}</h4><p>{item.role}</p>
              <dl><div><dt>Connects to</dt><dd>{item.connectedTo.join(", ") || "No modeled connection"}</dd></div><div><dt>Failure trace</dt><dd>{item.failureMode}</dd></div><div><dt>Checkpoint</dt><dd>{item.checkpoint}</dd></div></dl>
            </article>)}</div>
          </>}

          {packageView === "budget" && <>
            <div className="package-panel__topline"><div><span className="eyebrow">Itemized planning budget</span><h3>See what the envelope contains.</h3></div><p>These are deterministic allocations of the current planning range, not vendor prices or quotes.</p></div>
            <div className="budget-table" role="table" aria-label="System budget schedule">
              <div className="budget-row budget-row--head" role="row"><span>Item</span><span>Qty.</span><span>Accessible</span><span>Installed</span></div>
              {engineeringPackage.budget.map((line) => <div className="budget-row" role="row" key={line.id}><span><strong>{line.item}</strong><small>{line.basis}</small></span><span>{line.quantity} {line.unit}</span><span>{formatMoney(line.accessible.low)}â€“{formatMoney(line.accessible.high)}</span><span>{formatMoney(line.installed.low)}â€“{formatMoney(line.installed.high)}</span></div>)}
              <div className="budget-row budget-row--total" role="row"><span><strong>Current planning envelope</strong><small>{result.cost.sourceLabel} Â· {result.cost.sourceYear}</small></span><span /><span>{formatMoney(result.cost.accessible.low)}â€“{formatMoney(result.cost.accessible.high)}</span><span>{formatMoney(result.cost.installed.low)}â€“{formatMoney(result.cost.installed.high)}</span></div>
            </div>
          </>}

          {packageView === "resilience" && <>
            <div className="package-panel__topline"><div><span className="eyebrow">Deterministic resilience matrix</span><h3>Five conditions. One governed evaluator.</h3></div><p>Each row temporarily changes one defined input, evaluates the result, and leaves the project revision untouched.</p></div>
            <div className="resilience-matrix">{engineeringPackage.resilience.map((item) => <article key={item.id} className={`resilience-case resilience-case--${item.status.toLowerCase()}`}>
              <div><span>{item.name}</span><strong>{item.status}</strong></div><p>{item.condition}</p><dl><div><dt>Useful output</dt><dd>{item.usefulOutput}</dd></div><div><dt>Consequence</dt><dd>{item.consequence}</dd></div></dl>
            </article>)}</div>
          </>}

          {packageView === "field" && <>
            <div className="package-panel__topline"><div><span className="eyebrow">Field sequence</span><h3>A decision path, not construction instructions.</h3></div><p>The sequence shows what must be learned, verified, tested, and maintained before this model can inform real work.</p></div>
            <ol className="field-sequence">{engineeringPackage.fieldSequence.map((phase) => <li key={phase.number}><span>{phase.number}</span><div><h4>{phase.title}</h4><p>{phase.purpose}</p><ul>{phase.checks.map((check) => <li key={check}>{check}</li>)}</ul>{phase.boundary && <aside><strong>Professional boundary</strong>{phase.boundary}</aside>}</div></li>)}</ol>
          </>}

          {packageView === "record" && <>
            <div className="package-panel__topline"><div><span className="eyebrow">Portable revision record</span><h3>{engineeringPackage.fingerprint}</h3></div><button className="record-download" type="button" onClick={downloadRecord}>Download current JSON</button></div>
            <div className="record-grid"><article><span>Project truth</span><strong>{project.name}</strong><p>{engineeringPackage.generatedFrom}; {Object.keys(project.components).length} components and {scenario.routes.length} governed connections.</p></article><article><span>Invariant of execution</span><strong>{result.feasibility}</strong><p>{engineeringPackage.invariant}</p></article></div>
            <div className="exclusions"><h4>Do not treat this revision as field-ready while:</h4><ul>{engineeringPackage.exclusionCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul></div>
            <details className="record-preview"><summary>Inspect machine-readable record</summary><pre>{JSON.stringify(engineeringPackage.record, null, 2)}</pre></details>
          </>}
        </div>
      </section>

      <section className="truth-strip" aria-label="Model truth states">
        <div><span className="eyebrow">Model boundary</span><h2>What this result knows</h2></div>
        <div className="truth-strip__items">{result.assumptions.slice(0, 3).map((assumption) => <span key={assumption.label}><i className="dot dot--assumed" />{assumption.label}: <strong>{assumption.value}</strong></span>)}{result.unknowns.slice(0, 2).map((unknown) => <span key={unknown.label}><i className="dot dot--unknown" />{unknown.label}: <strong>unknown</strong></span>)}</div>
      </section>

      <EnergyCircleReport project={renderedProject} document={engineeringPackage} />

      <footer><span>EnergyCircle · Property energy systems, made legible.</span><span>Reference models · Not construction recommendations</span></footer>
    </main>
  );
}
