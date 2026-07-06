window.WF = window.WF || {};

window.WF.facts = window.WF.cloneFacts(window.WF.DEFAULT_FACTS);

function optionList(values, selectedValue) {
  return values.map((value) => `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${value}</option>`).join("");
}

function roleOptions(selectedValue) {
  return window.WF.ROLES
    .map((role) => `<option value="${role.id}" ${role.id === selectedValue ? "selected" : ""}>${role.label}</option>`)
    .join("");
}

function fieldSelect(id, label, htmlOptions) {
  return `<label>${label}<select id="${id}">${htmlOptions}</select></label>`;
}

function buildSummary(inferredFacts) {
  const items = [];
  const byType = (type) => inferredFacts.filter((fact) => fact.type === type);

  for (const fact of byType("seer_pair_conflict")) {
    items.push({
      type: "hard",
      title: "核心身份冲突（Core Role Conflict）",
      text: `${fact.player1} 和 ${fact.player2} 都声明自己是预言家，并且围绕 ${fact.target} 出现查验冲突，因此当前局势的核心冲突是 ${fact.player1}/${fact.player2} 的预言家对跳。`
    });
  }

  for (const fact of byType("at_least_one_fake")) {
    items.push({
      type: "hard",
      title: "唯一身份约束（Unique Role Constraint）",
      text: `由于简化局中只有 1 名 Seer，${fact.player1} 和 ${fact.player2} 至少一人不是真预言家。`
    });
  }

  for (const fact of byType("target_under_conflicting_claims")) {
    items.push({
      type: "dependent",
      title: "目标身份处于相反声明下（Target under Conflicting Claims）",
      text: `${fact.target} 被 ${fact.goodClaimer} 声称为好人，同时被 ${fact.wolfClaimer} 声称为狼人。${fact.target} 的身份不能由单条查验直接确定，需要依赖 ${fact.goodClaimer}/${fact.wolfClaimer} 谁更可信。`
    });
  }

  for (const fact of byType("voting_split_on_seer_pair")) {
    items.push({
      type: "soft",
      title: "投票分裂（Voting Split）",
      text: `${fact.voter1} 和 ${fact.voter2} 在 ${fact.phase} 分别投向对跳双方 ${fact.player1}/${fact.player2}，说明投票已经围绕核心冲突产生分裂。`
    });
  }

  for (const fact of byType("vote_related_to_conflict")) {
    items.push({
      type: "soft",
      title: "冲突相关投票（Conflict-related Vote）",
      text: `${fact.voter} 在 ${fact.phase} 投票给 ${fact.target}。由于 ${fact.target} 是核心对跳玩家，这条投票可以作为后续站边分析的关注点。`
    });
  }

  for (const fact of byType("conflict_player_under_pressure")) {
    items.push({
      type: "soft",
      title: "冲突玩家承压（Conflict Player under Pressure）",
      text: `${fact.player} 在 ${fact.phase} 既是核心对跳玩家，又被多人投票，因此处于较高讨论压力中。`
    });
  }

  for (const fact of byType("invalid_event")) {
    items.push({
      type: "hard",
      title: "无效事件（Invalid Event）",
      text: `${fact.invalidFactId} 被标记为无效事件，原因是对应玩家已经死亡。`
    });
  }

  return items;
}

window.WF.refresh = function refresh() {
  const result = window.WF.runInference(window.WF.facts);
  window.WF.lastResult = result;

  window.WF.renderSetup(document.getElementById("game-setup"));
  window.WF.renderKnowledgeBase(document.getElementById("knowledge-base"), result.facts, result.inferred);
  window.WF.renderTrace(document.getElementById("reasoning-trace"), result.trace);
  window.WF.renderSummary(document.getElementById("summary"), buildSummary(result.inferred));
  window.WF.renderRules(document.getElementById("rule-base"));
};

window.WF.setupForm = function setupForm() {
  const form = document.getElementById("fact-form");
  const typeSelect = document.getElementById("event-type");
  const dynamic = document.getElementById("dynamic-fields");

  function renderFields(type) {
    const players = optionList(window.WF.PLAYERS, "P1");
    const phases = optionList(window.WF.PHASES, type === "dead" ? "Night1" : "Day1");
    const results = optionList(window.WF.CHECK_RESULTS, "Good");

    if (type === "claim") {
      dynamic.innerHTML = [
        fieldSelect("field-player", "玩家（Player）", players),
        fieldSelect("field-role", "身份（Role）", roleOptions("Seer")),
        fieldSelect("field-phase", "阶段（Phase）", phases)
      ].join("");
    }

    if (type === "check") {
      dynamic.innerHTML = [
        fieldSelect("field-seer", "预言家候选人（Seer Claimant）", players),
        fieldSelect("field-target", "目标（Target）", optionList(window.WF.PLAYERS, "P3")),
        fieldSelect("field-result", "查验结果（Result）", results),
        fieldSelect("field-phase", "阶段（Phase）", phases)
      ].join("");
    }

    if (type === "vote") {
      dynamic.innerHTML = [
        fieldSelect("field-voter", "投票者（Voter）", optionList(window.WF.PLAYERS, "P4")),
        fieldSelect("field-target", "目标（Target）", players),
        fieldSelect("field-phase", "阶段（Phase）", phases)
      ].join("");
    }

    if (type === "dead") {
      dynamic.innerHTML = [
        fieldSelect("field-player", "死亡玩家（Player）", optionList(window.WF.PLAYERS, "P6")),
        fieldSelect("field-phase", "阶段（Phase）", phases)
      ].join("");
    }
  }

  typeSelect.onchange = (event) => renderFields(event.target.value);
  renderFields(typeSelect.value);

  form.onsubmit = (event) => {
    event.preventDefault();
    const type = typeSelect.value;
    let fact = null;

    if (type === "claim") {
      fact = window.WF.makeFact("claim", {
        player: document.getElementById("field-player").value,
        role: document.getElementById("field-role").value,
        phase: document.getElementById("field-phase").value
      });
    }

    if (type === "check") {
      fact = window.WF.makeFact("check", {
        seer: document.getElementById("field-seer").value,
        target: document.getElementById("field-target").value,
        result: document.getElementById("field-result").value,
        phase: document.getElementById("field-phase").value
      });
    }

    if (type === "vote") {
      fact = window.WF.makeFact("vote", {
        voter: document.getElementById("field-voter").value,
        target: document.getElementById("field-target").value,
        phase: document.getElementById("field-phase").value
      });
    }

    if (type === "dead") {
      fact = window.WF.makeFact("dead", {
        player: document.getElementById("field-player").value,
        phase: document.getElementById("field-phase").value
      });
    }

    if (!fact) return;

    const exists = window.WF.facts.some((item) => window.WF.factKey(item) === window.WF.factKey(fact));
    if (!exists) {
      window.WF.facts.push(fact);
    }
    window.WF.refresh();
  };
};

window.WF.bindButtons = function bindButtons() {
  document.getElementById("load-default").onclick = () => {
    window.WF.facts = window.WF.cloneFacts(window.WF.DEFAULT_FACTS);
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
});
