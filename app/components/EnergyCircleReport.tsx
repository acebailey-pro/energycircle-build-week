import type { EngineeringPackage } from "../lib/engineering-package";
import type { ProjectModel, TruthValue } from "../lib/energy-engine";

const money = (amount: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(amount);

const metric = (item: TruthValue) => item.value === null ? "Unknown" : `${item.value} ${item.unit}`;

function PageFooter({ document }: { document: EngineeringPackage }) {
  return <footer className="report-page__footer"><span>EnergyCircle pre-build field package</span><span>{document.fingerprint} Â· Revision {document.revision}</span></footer>;
}

export function EnergyCircleReport({ project, document }: { project: ProjectModel; document: EngineeringPackage }) {
  const { result, scenario } = document.record;
  const controls = Object.entries(project.parameters).filter(([, value]) => typeof value === "number");
  return <article className="print-report" aria-hidden="true">
    <section className="report-page report-cover">
      <div className="report-kicker">EnergyCircle / Pre-build field package</div>
      <div className="report-cover__body">
        <span className="report-family">{scenario.title}</span>
        <h1>{project.name}</h1>
        <p>A governed property-energy planning record for measurement, comparison, procurement conversations, staged implementation, commissioning, and maintenance.</p>
        <div className="report-cover__verdict"><span>Current system verdict</span><strong>{result.feasibility}</strong><p>{result.limitingFactor}</p></div>
      </div>
      <dl className="report-identity">
        <div><dt>Project ID</dt><dd>{document.projectId}</dd></div>
        <div><dt>Revision</dt><dd>{document.revision}</dd></div>
        <div><dt>Record fingerprint</dt><dd>{document.fingerprint}</dd></div>
        <div><dt>Model status</dt><dd>Reference planning model</dd></div>
      </dl>
      <div className="report-boundary"><strong>Use boundary</strong><p>This package supports field discovery and design coordination. It is not a stamped construction drawing, permit set, equipment approval, or substitute for qualified site review.</p></div>
      <PageFooter document={document} />
    </section>

    <section className="report-page">
      <header className="report-heading"><span>01 / Decision summary</span><h2>What the current revision says</h2><p>All values below derive from the same canonical project revision.</p></header>
      <div className="report-metrics">{result.headlineMetrics.map((item) => <div key={item.label}><span>{item.label}</span><strong>{metric(item)}</strong><small>{item.truth}</small></div>)}</div>
      <div className="report-two-column">
        <section><h3>Decision trace</h3><dl className="report-definition"><div><dt>Verdict</dt><dd>{result.feasibility}</dd></div><div><dt>Limiting factor</dt><dd>{result.limitingFactor}</dd></div><div><dt>Next measurement</dt><dd>{result.nextMeasurement}</dd></div><div><dt>Invariant of execution</dt><dd>{document.invariant}</dd></div></dl></section>
        <section><h3>Planning cost envelope</h3><div className="report-cost"><span>Accessible / owner-directed</span><strong>{money(result.cost.accessible.low)}â€“{money(result.cost.accessible.high)}</strong></div><div className="report-cost"><span>Professionally installed</span><strong>{money(result.cost.installed.low)}â€“{money(result.cost.installed.high)}</strong></div><p className="report-note">{result.cost.basis} Source: {result.cost.sourceLabel}, {result.cost.sourceYear}. Incentives excluded.</p></section>
      </div>
      <section className="report-warning-list"><h3>Active warnings</h3>{result.warnings.length ? result.warnings.map((warning) => <div key={warning.id}><strong>{warning.severity}: {warning.title}</strong><p>{warning.detail}</p></div>) : <p>No engine warning is active under the defined thresholds.</p>}</section>
      <PageFooter document={document} />
    </section>

    <section className="report-page">
      <header className="report-heading"><span>02 / Access path</span><h2>Start with available resources, then grow without waste.</h2><p>Cash ranges are planning allowances. Existing assets, assistance, local pricing, and required safety work determine actual out-of-pocket cost.</p></header>
      <div className="report-access">{document.accessPath.slice(0, 3).map((tier, index) => <section key={tier.id}>
        <div className="report-access__number">{String(index + 1).padStart(2, "0")}</div><div><div className="report-access__title"><h3>{tier.label}</h3><strong>{tier.costLabel}</strong></div><p>{tier.service}</p><dl><div><dt>Governed output</dt><dd>{tier.modeledOutput} <em>{tier.outputTruth}</em></dd></div><div><dt>Requires</dt><dd>{tier.requires.join("; ")}</dd></div><div><dt>Boundary</dt><dd>{tier.limitation}</dd></div><div><dt>Carries forward</dt><dd>{tier.carriesForward}</dd></div></dl></div>
      </section>)}</div>
      <PageFooter document={document} />
    </section>

    <section className="report-page">
      <header className="report-heading"><span>02B / Staged growth</span><h2>Preserve each investment on the way to a complete system.</h2><p>Expansion succeeds only when ratings, routes, controls, protection, and permits anticipate the next stage.</p></header>
      <div className="report-access">{document.accessPath.slice(3).map((tier, index) => <section key={tier.id}>
        <div className="report-access__number">{String(index + 4).padStart(2, "0")}</div><div><div className="report-access__title"><h3>{tier.label}</h3><strong>{tier.costLabel}</strong></div><p>{tier.service}</p><dl><div><dt>Governed output</dt><dd>{tier.modeledOutput} <em>{tier.outputTruth}</em></dd></div><div><dt>Requires</dt><dd>{tier.requires.join("; ")}</dd></div><div><dt>Boundary</dt><dd>{tier.limitation}</dd></div><div><dt>Carries forward</dt><dd>{tier.carriesForward}</dd></div></dl></div>
      </section>)}</div>
      <section className="report-checklist"><h3>Affordability rules</h3><ul><li>Assistance and donated equipment can reduce out-of-pocket cost; they do not remove engineering requirements.</li><li>Never remove protection, containment, isolation, inspection, or maintenance to meet a lower cash target.</li><li>Document reused equipment condition, ratings, remaining life, and replacement value.</li><li>Start with one useful service and preserve measurements and compatible infrastructure for the next stage.</li></ul></section>
      <PageFooter document={document} />
    </section>

    <section className="report-page">
      <header className="report-heading"><span>03 / Inputs and truth</span><h2>Replace assumptions before procurement.</h2><p>Calculated outputs are only as field-ready as their measured inputs.</p></header>
      <table className="report-table"><thead><tr><th>Project parameter</th><th>Current value</th><th>Truth state</th><th>Field action</th></tr></thead><tbody>{controls.map(([key, value]) => <tr key={key}><td>{key}</td><td>{value}</td><td>assumed</td><td>Measure or verify against selected equipment</td></tr>)}</tbody></table>
      <div className="report-two-column report-truth-columns">
        <section><h3>Declared assumptions</h3><ul>{result.assumptions.map((item) => <li key={item.label}><strong>{item.label}</strong><span>{item.value}</span><small>{item.truth}</small></li>)}</ul></section>
        <section><h3>Unresolved unknowns</h3><ul>{result.unknowns.map((item) => <li key={item.label}><strong>{item.label}</strong><span>Resolve before field commitment</span><small>{item.truth}</small></li>)}</ul></section>
      </div>
      <PageFooter document={document} />
    </section>

    <section className="report-page">
      <header className="report-heading"><span>04 / Architecture</span><h2>Component and connection schedule</h2><p>The schedule is a design-coordination inventory, not a manufacturer-specific bill of materials.</p></header>
      <table className="report-table report-table--components"><thead><tr><th>ID / component</th><th>Role</th><th>Connects to</th><th>Failure and checkpoint</th></tr></thead><tbody>{document.componentSchedule.map((item) => <tr key={item.id}><td><strong>{item.id}</strong><br />{item.label}<br /><small>{item.quantity} {item.unit}</small></td><td>{item.role}</td><td>{item.connectedTo.join(", ") || "None modeled"}</td><td><strong>{item.failureMode}</strong><br />{item.checkpoint}</td></tr>)}</tbody></table>
      <h3 className="report-subheading">Governed connection schedule</h3>
      <table className="report-table"><thead><tr><th>From</th><th>To</th><th>Carrier</th><th>Field verification</th></tr></thead><tbody>{scenario.routes.map((route, index) => <tr key={`${route.from}-${route.to}-${index}`}><td>{project.components[route.from]?.label ?? route.from}</td><td>{project.components[route.to]?.label ?? route.to}</td><td>{route.kind}</td><td>Confirm route, length, rating, isolation, protection, and access</td></tr>)}</tbody></table>
      <PageFooter document={document} />
    </section>

    <section className="report-page">
      <header className="report-heading"><span>05 / Budget and procurement</span><h2>Planning allowance by assembly</h2><p>Obtain current local quotes using selected equipment ratings and verified site quantities. Do not procure from this allocation alone.</p></header>
      <table className="report-table report-table--budget"><thead><tr><th>Assembly</th><th>Qty.</th><th>Accessible</th><th>Installed</th></tr></thead><tbody>{document.budget.map((line) => <tr key={line.id}><td><strong>{line.item}</strong><br /><small>{line.basis}</small></td><td>{line.quantity} {line.unit}</td><td>{money(line.accessible.low)}â€“{money(line.accessible.high)}</td><td>{money(line.installed.low)}â€“{money(line.installed.high)}</td></tr>)}</tbody><tfoot><tr><th>Current planning envelope</th><td /><th>{money(result.cost.accessible.low)}â€“{money(result.cost.accessible.high)}</th><th>{money(result.cost.installed.low)}â€“{money(result.cost.installed.high)}</th></tr></tfoot></table>
      <section className="report-checklist"><h3>Quote and procurement checklist</h3><ul><li>Replace every generic assembly with a manufacturer, model, rating, quantity, warranty, and lead time.</li><li>Separate equipment, consumables, delivery, rentals, excavation or foundations, permits, inspections, commissioning, tax, and contingency.</li><li>Verify that every connected component shares compatible voltage, pressure, temperature, flow, load, chemistry, controls, and environmental ratings.</li><li>Document donated or reused equipment condition; replacement value may be nonzero even when out-of-pocket cost is zero.</li><li>Keep safety, protection, containment, and inspection items in scope when reducing cost.</li></ul></section>
      <PageFooter document={document} />
    </section>

    <section className="report-page">
      <header className="report-heading"><span>06 / Resilience</span><h2>Stress conditions and consequences</h2><p>Each condition is evaluated as a temporary governed scenario. The canonical project revision is not changed.</p></header>
      <table className="report-table report-table--resilience"><thead><tr><th>Condition</th><th>Status</th><th>Useful output</th><th>Consequence</th></tr></thead><tbody>{document.resilience.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><br /><small>{item.condition}</small></td><td>{item.status}</td><td>{item.usefulOutput}</td><td>{item.consequence}</td></tr>)}</tbody></table>
      <section className="report-checklist"><h3>Commissioning evidence to collect</h3><ul><li>Installed component identifiers and ratings</li><li>Measured resource, route loss, useful output, storage state, and load</li><li>Safe isolation and shutdown results</li><li>Behavior under the modeled failure condition</li><li>Operating baseline for future maintenance comparison</li></ul></section>
      <PageFooter document={document} />
    </section>

    <section className="report-page report-page--field">
      <header className="report-heading"><span>07 / Field sequence</span><h2>Measure, verify, build, test, and maintain.</h2><p>This sequence defines evidence gates. It does not authorize unsafe or regulated work.</p></header>
      <ol className="report-field">{document.fieldSequence.map((phase) => <li key={phase.number}><span>{phase.number}</span><div><h3>{phase.title}</h3><p>{phase.purpose}</p><ul>{phase.checks.map((check) => <li key={check}>{check}</li>)}</ul>{phase.boundary && <aside><strong>Professional boundary</strong><p>{phase.boundary}</p></aside>}</div></li>)}</ol>
      <PageFooter document={document} />
    </section>

    <section className="report-page">
      <header className="report-heading"><span>08 / Release gate</span><h2>Conditions that prevent a field-ready claim</h2><p>Resolve each applicable item and issue a new governed revision before construction or procurement decisions.</p></header>
      <ol className="report-exclusions">{document.exclusionCriteria.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>
      <div className="report-two-column">
        <section><h3>Required project records</h3><ul className="report-bullets"><li>Site survey and dated measurements</li><li>Selected equipment schedule and data sheets</li><li>Permit and inspection requirements</li><li>Builder, electrician, engineer, plumber, environmental, or other qualified reviews</li><li>As-built deviations and photographs</li><li>Commissioning results and maintenance schedule</li></ul></section>
        <section><h3>Revision control</h3><dl className="report-definition"><div><dt>Current fingerprint</dt><dd>{document.fingerprint}</dd></div><div><dt>Canonical revision</dt><dd>{document.revision}</dd></div><div><dt>Components</dt><dd>{document.componentSchedule.length}</dd></div><div><dt>Connections</dt><dd>{scenario.routes.length}</dd></div><div><dt>Truth rule</dt><dd>Exports derive from canonical project truth; view state cannot change physical data.</dd></div></dl></section>
      </div>
      <div className="report-signoff"><div><span>Owner / project lead</span></div><div><span>Qualified reviewer</span></div><div><span>Revision accepted for</span></div><div><span>Date</span></div></div>
      <PageFooter document={document} />
    </section>
  </article>;
}
