window.WF = window.WF || {};

window.WF.facts = [...window.WF.DEFAULT_FACTS];

function extractSummary(inferred) {
  const lines = [];

  const conflicts = inferred.filter(f => f.type === "seer_pair_conflict");
  const contradictions = inferred.filter(f => f.type === "check_contradiction");
  const votes = inferred.filter(f => f.type === "vote_related_to_conflict");
  const pressure = inferred.filter(f => f.type === "conflict_player_under_pressure");
  const split = inferred.filter(f => f.type === "voting_split_on_seer_pair");

  for (const c of conflicts) {
    lines.push(`${c.player1} 与 ${c.player2} 形成预言家对跳，因此存在身份冲突。`);
  }

  for (const c of contradictions) {
    lines.push(`${c.goodClaimer} 与 ${c.wolfClaimer} 对同一目标查验结果冲突。`);
  }

  for (const v of votes) {
    lines.push(`${v.voter} 的投票卷入核心冲突，当前已进入站边信息阶段。`);
  }

  for (const s of split) {
    lines.push(`${s.player1} 与 ${s.player2} 在投票上出现分裂。`);
  }

  for (const p of pressure) {
    lines.push(`${p.player} 在 ${p.phase} 处于投票压力之下。`);
  }

  return lines;
}

window.WF.refresh = function refresh() {
  const result = window.WF.runInference(window.WF.facts);

  const kb = document.getElementById("knowledge-base");
  const trace = document.getElementById("reasoning-trace");
  const summary = document.getElementById("summary");

  window.WF.renderFacts(kb, result.facts);
  window.WF.renderInferred(kb, result.inferred);
  window.WF.renderTrace(trace, result.trace);

  const lines = extractSummary(result.inferred);
  summary.innerHTML = lines.length ? lines.join("<br/>") : "暂无结论";
};

window.WF.setupForm = function setupForm() {
  const form = document.getElementById("fact-form");
  const typeSelect = document.getElementById("event-type");
  const dynamic = document.getElementById("dynamic-fields");

  function renderFields(type) {
    dynamic.innerHTML = "";

    if (type === "claim") {
      dynamic.innerHTML = `
        <label>玩家<input id="p" /></label>
        <label>身份<input id="r" /></label>
        <label>阶段<input id="ph" /></label>
      `;
    }

    if (type === "check") {
      dynamic.innerHTML = `
        <label>预言家<input id="s" /></label>
        <label>目标<input id="t" /></label>
        <label>结果<input id="res" /></label>
        <label>阶段<input id="ph" /></label>
      `;
    }

    if (type === "vote") {
      dynamic.innerHTML = `
        <label>投票者<input id="v" /></label>
        <label>目标<input id="t" /></label>
        <label>阶段<input id="ph" /></label>
      `;
    }

    if (type === "dead") {
      dynamic.innerHTML = `
        <label>死亡玩家<input id="p" /></label>
        <label>阶段<input id="ph" /></label>
      `;
    }
  }

  typeSelect.onchange = (e) => renderFields(e.target.value);
  renderFields(typeSelect.value);

  form.onsubmit = (e) => {
    e.preventDefault();

    const type = typeSelect.value;

    let fact = null;

    if (type === "claim") {
      fact = window.WF.makeFact("claim", {
        player: p.value,
        role: r.value,
        phase: ph.value
      });
    }

    if (type === "check") {
      fact = window.WF.makeFact("check", {
        seer: s.value,
        target: t.value,
        result: res.value,
        phase: ph.value
      });
    }

    if (type === "vote") {
      fact = window.WF.makeFact("vote", {
        voter: v.value,
        target: t.value,
        phase: ph.value
      });
    }

    if (type === "dead") {
      fact = window.WF.makeFact("dead", {
        player: p.value,
        phase: ph.value
      });
    }

    window.WF.facts.push(fact);
    window.WF.refresh();
  };
};

window.WF.bindButtons = function bindButtons() {
  document.getElementById("load-default").onclick = () => {
    window.WF.facts = [...window.WF.DEFAULT_FACTS];
    window.WF.refresh();
  };

  document.getElementById("clear-facts").onclick = () => {
    window.WF.facts = [];
    window.WF.refresh();
  };

  document.getElementById("run-inference").onclick = () => {
    window.WF.refresh();
  };
};

window.addEventListener("DOMContentLoaded", () => {
  window.WF.setupForm();
  window.WF.bindButtons();
  window.WF.refresh();
  window.WF.renderRules(document.getElementById("rule-base"));
});