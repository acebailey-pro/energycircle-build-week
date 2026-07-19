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

type ViewMode = "property" | "system" | "blueprint";

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
  const surfaceRef = useRef<HTMLDivElement>(null);
  const scenarioRef = useRef<HTMLElement>(null);
  const transactionRef = useRef<PreviewTransaction | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });

  const renderedProject = preview?.draft ?? project;
  const result = useMemo(() => evaluateProject(renderedProject), [renderedProject]);
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

      <section className="truth-strip" aria-label="Model truth states">
        <div><span className="eyebrow">Model boundary</span><h2>What this result knows</h2></div>
        <div className="truth-strip__items">{result.assumptions.slice(0, 3).map((assumption) => <span key={assumption.label}><i className="dot dot--assumed" />{assumption.label}: <strong>{assumption.value}</strong></span>)}{result.unknowns.slice(0, 2).map((unknown) => <span key={unknown.label}><i className="dot dot--unknown" />{unknown.label}: <strong>unknown</strong></span>)}</div>
      </section>

      <footer><span>EnergyCircle · Property energy systems, made legible.</span><span>Reference models · Not construction recommendations</span></footer>
    </main>
  );
}
