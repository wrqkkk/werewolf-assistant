import { describeFactInChinese } from "./facts.js";
import { RULES } from "./rules.js";

export function renderFacts(container, facts) {
  container.innerHTML = "";
  for (const f of facts) {
    const div = document.createElement("div");
    div.className = "fact-card initial";
    div.innerHTML = `<code>${f.type}</code> ${describeFactInChinese(f)}`;
    container.appendChild(div);
  }
}

export function renderInferred(container, inferred) {
  container.innerHTML = "";
  for (const f of inferred) {
    const div = document.createElement("div");
    div.className = "fact-card inferred";
    div.innerHTML = `<code>${f.type}</code> ${describeFactInChinese(f)}`;
    container.appendChild(div);
  }
}

export function renderTrace(container, trace) {
  container.innerHTML = "";
  for (const t of trace) {
    const div = document.createElement("div");
    div.className = `trace-card ${RULES.find(r => r.id === t.ruleId)?.type || "soft"}`;
    div.innerHTML = `<strong>${t.ruleId}</strong> ${t.ruleName}<div class="meta">输入: ${JSON.stringify(t.input)}<br/>输出: ${JSON.stringify(t.output)}</div>`;
    container.appendChild(div);
  }
}

export function renderRules(container) {
  container.innerHTML = "";
  for (const r of RULES) {
    const div = document.createElement("div");
    div.className = `rule-card ${r.type}`;
    div.innerHTML = `<strong>${r.id} ${r.name}</strong><p>${r.type}</p>`;
    container.appendChild(div);
  }
}
