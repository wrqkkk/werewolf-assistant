window.WF = window.WF || {};

window.WF.renderFacts = function renderFacts(container, facts) {
  container.innerHTML = "";
  for (const f of facts) {
    const div = document.createElement("div");
    div.className = "fact-card initial";
    div.innerHTML = `<code>${f.type}</code> ${window.WF.describeFactInChinese(f)}`;
    container.appendChild(div);
  }
};

window.WF.renderInferred = function renderInferred(container, inferred) {
  container.innerHTML = "";
  for (const f of inferred) {
    const div = document.createElement("div");
    div.className = "fact-card inferred";
    div.innerHTML = `<code>${f.type}</code> ${window.WF.describeFactInChinese(f)}`;
    container.appendChild(div);
  }
};

window.WF.renderTrace = function renderTrace(container, trace) {
  container.innerHTML = "";
  for (const t of trace) {
    const div = document.createElement("div");
    const rule = window.WF.RULES.find(r => r.id === t.ruleId);
    div.className = `trace-card ${rule?.type || "soft"}`;
    div.innerHTML = `<strong>${t.ruleId}</strong> ${t.ruleName}<div class="meta">输入: ${JSON.stringify(t.input)}<br/>输出: ${JSON.stringify(t.output)}<br/>解释: ${t.explanation || ""}</div>`;
    container.appendChild(div);
  }
};

window.WF.renderRules = function renderRules(container) {
  container.innerHTML = "";
  for (const r of window.WF.RULES) {
    const div = document.createElement("div");
    div.className = `rule-card ${r.type}`;
    div.innerHTML = `<strong>${r.id} ${r.name}</strong><p>${r.description}</p>`;
    container.appendChild(div);
  }
};