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
  beginPreview,
  commitMutation,
  commitPreview,
  deriveCausalInsight,
  evaluateProject,
  referenceProject,
  updatePreview,
  type ComponentId,
  type DomainMutation,
  type Point,
  type PreviewTransaction,
  type ProjectModel,
  type TruthValue,
} from "../lib/energy-engine";

type ViewMode = "property" | "system" | "blueprint";

const WATER_ROUTE: Array<[ComponentId, ComponentId]> = [
  ["lowerReservoir", "pump"],
  ["pump", "upperReservoir"],
  ["upperReservoir", "turbine"],
  ["turbine", "lowerReservoir"],
];

const POWER_ROUTE: Array<[ComponentId, ComponentId]> = [
  ["solar", "pump"],
  ["turbine", "inverter"],
  ["inverter", "home"],
];

const MARKS: Record<ComponentId, string> = {
  solar: "SUN",
  pump: "P",
  upperReservoir: "H₂O",
  turbine: "T",
  inverter: "INV",
  home: "LOAD",
  lowerReservoir: "H₂O",
};

const formatValue = (metric: TruthValue) =>
  metric.value === null ? "Unknown" : String(metric.value) + " " + metric.unit;

function Metric({
  metric,
  emphasis = false,
}: {
  metric: TruthValue;
  emphasis?: boolean;
}) {
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

function RouteLine({
  from,
  to,
  kind,
  blocked,
}: {
  from: Point;
  to: Point;
  kind: "water" | "power";
  blocked?: boolean;
}) {
  const scaledY = (to.y - from.y) * 0.625;
  const length = Math.hypot(to.x - from.x, scaledY);
  const angle = Math.atan2(scaledY, to.x - from.x) * (180 / Math.PI);
  const style: CSSProperties = {
    left: String(from.x) + "%",
    top: String(from.y) + "%",
    width: String(length) + "%",
    transform: "rotate(" + String(angle) + "deg)",
  };
  return (
    <div
      className={
        "route route--" +
        kind +
        (blocked && kind === "water" ? " route--blocked" : "")
      }
      style={style}
      aria-hidden="true"
    >
      <span />
    </div>
  );
}

function PropertyObject({ id }: { id: ComponentId }) {
  if (id === "solar") {
    return (
      <span className="physical-object physical-object--solar" aria-hidden="true">
        <i /><i /><i /><i />
        <b />
      </span>
    );
  }
  if (id === "upperReservoir") {
    return (
      <span className="physical-object physical-object--tank" aria-hidden="true">
        <i className="tank__rim" />
        <i className="tank__water" />
        <i className="tank__body" />
        <i className="tank__legs" />
      </span>
    );
  }
  if (id === "lowerReservoir") {
    return (
      <span className="physical-object physical-object--pond" aria-hidden="true">
        <i /><i /><b />
      </span>
    );
  }
  if (id === "home") {
    return (
      <span className="physical-object physical-object--home" aria-hidden="true">
        <i className="home__roof" />
        <i className="home__wall" />
        <i className="home__window" />
        <i className="home__door" />
        <b />
      </span>
    );
  }
  if (id === "inverter") {
    return (
      <span className="physical-object physical-object--inverter" aria-hidden="true">
        <i />
        <b>INV</b>
      </span>
    );
  }
  return (
    <span
      className={
        "physical-object physical-object--machine physical-object--" + id
      }
      aria-hidden="true"
    >
      <i className="machine__house" />
      <i className="machine__rotor" />
      <i className="machine__hub" />
      <b>{id === "pump" ? "PUMP" : "TURBINE"}</b>
    </span>
  );
}

export function EnergyCircleExperience() {
  const [project, setProject] = useState<ProjectModel>(referenceProject);
  const [preview, setPreview] = useState<PreviewTransaction | null>(null);
  const [selected, setSelected] =
    useState<ComponentId>("upperReservoir");
  const [viewMode, setViewMode] = useState<ViewMode>("property");
  const [insight, setInsight] = useState(
    "The 50 mm pipe consumes part of the available head. Move the upper reservoir to reveal how geometry changes the whole system.",
  );
  const [lastChanged, setLastChanged] =
    useState<ComponentId>("upperReservoir");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const transactionRef = useRef<PreviewTransaction | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });

  const renderedProject = preview?.draft ?? project;
  const result = useMemo(
    () => evaluateProject(renderedProject),
    [renderedProject],
  );

  const commit = useCallback(
    (mutation: DomainMutation, changed?: ComponentId) => {
      setProject((current) => {
        const before = evaluateProject(current);
        const next = commitMutation(current, mutation);
        setInsight(deriveCausalInsight(before, evaluateProject(next)));
        return next;
      });
      if (changed) setLastChanged(changed);
    },
    [],
  );

  const pointFromPointer = (event: PointerEvent<HTMLButtonElement>): Point => {
    const bounds = surfaceRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    };
  };

  const startDrag = (
    event: PointerEvent<HTMLButtonElement>,
    id: ComponentId,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(id);
    const pointer = pointFromPointer(event);
    const current = project.components[id].position;
    dragOffsetRef.current = {
      x: current.x - pointer.x,
      y: current.y - pointer.y,
    };
    const mutation: DomainMutation = {
      type: "move-component",
      id,
      position: current,
    };
    const transaction = beginPreview(project, mutation);
    transactionRef.current = transaction;
    setPreview(transaction);
  };

  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!transactionRef.current) return;
    const active = transactionRef.current;
    const pointer = pointFromPointer(event);
    const mutation: DomainMutation = {
      type: "move-component",
      id: active.mutation.type === "move-component"
        ? active.mutation.id
        : selected,
      position: {
        x: pointer.x + dragOffsetRef.current.x,
        y: pointer.y + dragOffsetRef.current.y,
      },
    };
    const transaction = updatePreview(active, mutation);
    transactionRef.current = transaction;
    setPreview(transaction);
  };

  const finishDrag = () => {
    const transaction = transactionRef.current;
    if (!transaction) return;
    if (JSON.stringify(transaction.base) === JSON.stringify(transaction.draft)) {
      transactionRef.current = null;
      setPreview(null);
      return;
    }
    const committed = commitPreview(transaction);
    setProject(committed);
    setInsight(
      deriveCausalInsight(
        evaluateProject(transaction.base),
        evaluateProject(committed),
      ),
    );
    if (transaction.mutation.type === "move-component") {
      setLastChanged(transaction.mutation.id);
    }
    transactionRef.current = null;
    setPreview(null);
  };

  const cancelDrag = () => {
    transactionRef.current = null;
    setPreview(null);
  };

  const startControlPreview = (
    event: PointerEvent<HTMLInputElement>,
    mutation: DomainMutation,
  ) => {
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

  const moveWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    id: ComponentId,
  ) => {
    const directions: Record<string, Point> = {
      ArrowUp: { x: 0, y: -2 },
      ArrowDown: { x: 0, y: 2 },
      ArrowLeft: { x: -2, y: 0 },
      ArrowRight: { x: 2, y: 0 },
    };
    const delta = directions[event.key];
    if (!delta) return;
    event.preventDefault();
    const current = project.components[id].position;
    commit(
      {
        type: "move-component",
        id,
        position: { x: current.x + delta.x, y: current.y + delta.y },
      },
      id,
    );
  };

  const statusDescription =
    result.feasibility === "VIABLE"
      ? "The modeled system meets the defined load and autonomy thresholds."
      : result.feasibility === "FRAGILE"
        ? "The system operates, but at least one defined threshold is not met."
        : "A modeled constraint prevents the system from serving its critical load.";

  return (
    <main className={"experience experience--" + viewMode}>
      <header className="topbar">
        <a className="brand" href="#scenario" aria-label="EnergyCircle home">
          <span className="brand__orbit" aria-hidden="true"><i /></span>
          <span>EnergyCircle</span>
        </a>
        <div className="topbar__context">
          <span>Reference scenario 01</span>
          <i aria-hidden="true" />
          <span>Revision {project.revision}</span>
        </div>
        <button
          className="quiet-button"
          type="button"
          onClick={() => {
            setProject((current) => ({
              ...referenceProject,
              revision: current.revision + 1,
            }));
            setPreview(null);
            transactionRef.current = null;
            setInsight(
              "Reference geometry restored. Move the upper reservoir to reveal how the system responds.",
            );
          }}
        >
          Reset scenario
        </button>
      </header>

      <section className="hero" id="scenario">
        <div className="hero__copy">
          <span className="eyebrow">A worked example. Your property comes next.</span>
          <h1>Hillside Water Storage</h1>
          <p>
            Explore one connected property model. Move a component and every
            calculation, warning, and drawing responds from the same project truth.
          </p>
        </div>
        <div
          className={"verdict verdict--" + result.feasibility.toLowerCase()}
          aria-live="polite"
        >
          <span>System verdict</span>
          <strong>{result.feasibility}</strong>
          <p>{statusDescription}</p>
        </div>
      </section>

      <section className="workspace" aria-label="Interactive property workspace">
        <div className="workspace__main">
          <div className="viewbar" aria-label="Property representation">
            <div className="segmented">
              {(["property", "system", "blueprint"] as ViewMode[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  className={viewMode === mode ? "is-active" : ""}
                  aria-pressed={viewMode === mode}
                  onClick={() => setViewMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
            <span className="viewbar__hint">
              <i aria-hidden="true" />
              {viewMode === "property"
                ? "Move anything you recognize"
                : "Every view shares one project truth"}
            </span>
          </div>

          <div className="property" ref={surfaceRef} data-view={viewMode}>
            <div className="property__sky" aria-hidden="true" />
            <div className="property__contours" aria-hidden="true" />
            <div className="property__ridge property__ridge--back" aria-hidden="true" />
            <div className="property__ridge property__ridge--front" aria-hidden="true" />
            <div className="property__sun" aria-hidden="true" />
            <div className="property__road" aria-hidden="true" />
            <div className="property__grove" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>
            <div className="property__labels" aria-hidden="true">
              <span className="elevation elevation--high">≈ 51 m datum</span>
              <span className="elevation elevation--low">≈ 14 m datum</span>
            </div>

            {WATER_ROUTE.map(([from, to]) => (
              <RouteLine
                key={from + to}
                from={renderedProject.components[from].position}
                to={renderedProject.components[to].position}
                kind="water"
                blocked={renderedProject.failures.intakeBlocked}
              />
            ))}
            {POWER_ROUTE.map(([from, to]) => (
              <RouteLine
                key={from + to}
                from={renderedProject.components[from].position}
                to={renderedProject.components[to].position}
                kind="power"
              />
            ))}

            {Object.values(renderedProject.components).map((component) => {
              const positionStyle: CSSProperties = {
                left: String(component.position.x) + "%",
                top: String(component.position.y) + "%",
              };
              const isSelected = selected === component.id;
              return (
                <button
                  type="button"
                  key={component.id}
                  className={
                    "component component--" +
                    component.kind +
                    (isSelected ? " is-selected" : "") +
                    (lastChanged === component.id ? " is-changed" : "")
                  }
                  style={positionStyle}
                  aria-label={
                    component.label +
                    ". Drag to reposition, or use arrow keys. Current position " +
                    String(Math.round(component.position.x)) +
                    ", " +
                    String(Math.round(component.position.y)) +
                    "."
                  }
                  onClick={() => setSelected(component.id)}
                  onPointerDown={(event) => startDrag(event, component.id)}
                  onPointerMove={moveDrag}
                  onPointerUp={finishDrag}
                  onPointerCancel={cancelDrag}
                  onKeyDown={(event) => moveWithKeyboard(event, component.id)}
                >
                  <span className="component__halo" aria-hidden="true" />
                  <PropertyObject id={component.id} />
                  <span className="component__mark">{MARKS[component.id]}</span>
                  <span className="component__label">{component.label}</span>
                  {component.id === "upperReservoir" &&
                    project.revision === 1 &&
                    viewMode === "property" && (
                      <span className="component__start" aria-hidden="true">
                        <small>Start here</small>
                        <strong>Drag the tank uphill</strong>
                        <i>↑</i>
                      </span>
                    )}
                </button>
              );
            })}

            <div className="flow-key" aria-hidden="true">
              <span><i className="water-key" /> Water path</span>
              <span><i className="power-key" /> Electrical path</span>
            </div>
            <div className="scale-key" aria-hidden="true">
              <i />
              <span>20 m</span>
            </div>
          </div>

          <div className="insight" aria-live="polite">
            <span className="insight__signal" aria-hidden="true">↳</span>
            <div>
              <span className="eyebrow">What changed</span>
              <p>{insight}</p>
            </div>
          </div>
        </div>

        <aside className="analysis-panel" aria-label="System analysis">
          <div className="analysis-panel__section analysis-panel__section--metrics">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Live model</span>
                <h2>
                  {viewMode === "property"
                    ? "What this system can do"
                    : "Energy balance"}
                </h2>
              </div>
              {preview && <span className="preview-badge">Preview</span>}
            </div>
            <div className="metrics-grid">
              <Metric metric={result.netHead} emphasis />
              <Metric metric={result.headLossPercent} />
              <Metric metric={result.storedEnergy} emphasis />
              <Metric metric={result.runtime} />
            </div>
            <div className="target-line">
              <span>Defined autonomy target</span>
              <strong>{formatValue(result.requiredEnergy)}</strong>
            </div>
          </div>

          <div className="analysis-panel__section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Selected component</span>
                <h2>{renderedProject.components[selected].label}</h2>
              </div>
              <span className="component-type">
                {renderedProject.components[selected].kind}
              </span>
            </div>

            <label className="control">
              <span>Pipe diameter <small>assumed</small></span>
              <strong>
                {Math.round(renderedProject.parameters.pipeDiameterM * 1000)} mm
              </strong>
              <input
                type="range"
                min="32"
                max="110"
                step="1"
                value={Math.round(renderedProject.parameters.pipeDiameterM * 1000)}
                onPointerDown={(event) =>
                  startControlPreview(event, {
                    type: "set-pipe-diameter",
                    valueM: renderedProject.parameters.pipeDiameterM,
                  })
                }
                onPointerUp={finishDrag}
                onPointerCancel={cancelDrag}
                onChange={(event) =>
                  updateControlPreview({
                    type: "set-pipe-diameter",
                    valueM: Number(event.target.value) / 1000,
                  })
                }
                aria-label="Pipe diameter in millimeters"
              />
            </label>

            <label className="control">
              <span>Upper storage <small>assumed</small></span>
              <strong>{renderedProject.parameters.reservoirVolumeM3} m³</strong>
              <input
                type="range"
                min="20"
                max="300"
                step="5"
                value={renderedProject.parameters.reservoirVolumeM3}
                onPointerDown={(event) =>
                  startControlPreview(event, {
                    type: "set-reservoir-volume",
                    valueM3: renderedProject.parameters.reservoirVolumeM3,
                  })
                }
                onPointerUp={finishDrag}
                onPointerCancel={cancelDrag}
                onChange={(event) =>
                  updateControlPreview({
                    type: "set-reservoir-volume",
                    valueM3: Number(event.target.value),
                  })
                }
                aria-label="Upper reservoir storage in cubic meters"
              />
            </label>
          </div>

          <div className="analysis-panel__section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Constraint trace</span>
                <h2>
                  {result.warnings.length === 0
                    ? "No active warnings"
                    : String(result.warnings.length) + " active"}
                </h2>
              </div>
            </div>
            <div className="warnings">
              {result.warnings.length === 0 ? (
                <div className="warning warning--clear">
                  <i aria-hidden="true">✓</i>
                  <div>
                    <strong>Defined thresholds met</strong>
                    <p>No current engine warning is active.</p>
                  </div>
                </div>
              ) : (
                result.warnings.map((warning) => (
                  <div
                    className={"warning warning--" + warning.severity}
                    key={warning.id}
                  >
                    <i aria-hidden="true">!</i>
                    <div>
                      <strong>{warning.title}</strong>
                      <p>{warning.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="analysis-panel__section analysis-panel__section--failure">
            <div>
              <span className="eyebrow">Failure trace</span>
              <strong>Intake obstruction</strong>
              <p>Simulates one deterministic interruption in the water path.</p>
            </div>
            <button
              className={
                "toggle " +
                (renderedProject.failures.intakeBlocked ? "is-on" : "")
              }
              type="button"
              role="switch"
              aria-checked={renderedProject.failures.intakeBlocked}
              aria-label="Simulate intake obstruction"
              onClick={() =>
                commit({
                  type: "set-intake-blocked",
                  blocked: !project.failures.intakeBlocked,
                })
              }
            >
              <span />
            </button>
          </div>
        </aside>
      </section>

      <section className="truth-strip" aria-label="Model truth states">
        <div>
          <span className="eyebrow">Model boundary</span>
          <h2>What this result knows</h2>
        </div>
        <div className="truth-strip__items">
          {result.assumptions.slice(0, 2).map((assumption) => (
            <span key={assumption.label}>
              <i className="dot dot--assumed" />
              {assumption.label}: <strong>{assumption.value}</strong>
            </span>
          ))}
          {result.unknowns.slice(0, 2).map((unknown) => (
            <span key={unknown.label}>
              <i className="dot dot--unknown" />
              {unknown.label}: <strong>unknown</strong>
            </span>
          ))}
        </div>
      </section>

      <footer>
        <span>EnergyCircle · Property energy systems, made legible.</span>
        <span>Reference model · Not a construction recommendation</span>
      </footer>
    </main>
  );
}
