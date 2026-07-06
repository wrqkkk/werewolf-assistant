window.WF = window.WF || {};

function clearAndPrepare(container, emptyText) {
  container.innerHTML = "";
  container.classList.remove("empty-state");
  if (emptyText) {
    const div = document.createElement("div");
    div.className = "empty-state";
    div.textContent = emptyText;
    container.appendChild(div);
  }
}

function sectionTitle(title) {
  const h3 = document.createElement("h3");
  h3.className = "subsection-title";
  h3.textContent = title;
  return h3;
}

function factCard(fact, className) {
  const div = document.createElement("div");
  div.className = `fact-card ${className}`;
  div.innerHTML = `<code>${window.WF.describeFact(fact)}</code><div>${window.WF.describeFactInChinese(fact)}</div>`;
  return div;
}

window.WF.renderSetup = function renderSetup(container) {
  container.innerHTML = "";
  const items = [
    ["玩家（Players）", window.WF.PLAYERS.join(", ")],
    ["身份（Roles）", "2 Werewolves，1 Seer，3 Villagers"],
    ["狼人阵营（the Werewolves）", "Werewolf"],
    ["村民阵营（the Villagers）", "Seer, Villager"]
  ];

  for (const [title, content] of items) {
    const div = document.createElement("div");
    div.className = "setup-card";
    div.innerHTML = `<strong>${title}</strong><div class="meta">${content}</div>`;
    container.appendChild(div);
  }
};

window.WF.renderKnowledgeBase = function renderKnowledgeBase(container, initialFacts, inferredFacts) {
  if (!initialFacts.length && !inferredFacts.length) {
    clearAndPrepare(container, "暂无事实。请添加事实或加载默认案例。");
    return;
  }

  container.innerHTML = "";
  container.classList.remove("empty-state");

  const groups = [
    ["初始事实（Initial Facts）", initialFacts, "initial"],
    ["硬逻辑结论（Hard Logic Conclusions）", inferredFacts.filter((f) => ["role_conflict", "at_least_one_fake", "check_contradiction", "seer_pair_conflict", "invalid_event"].includes(f.type)), "hard"],
    ["依赖型声明（Dependent Claims）", inferredFacts.filter((f) => ["claimed_good_by", "claimed_wolf_by", "target_under_conflicting_claims"].includes(f.type)), "dependent"],
    ["软性关注点（Soft Attention Points）", inferredFacts.filter((f) => ["vote_related_to_conflict", "voting_split_on_seer_pair", "multiple_votes_on", "conflict_player_under_pressure"].includes(f.type)), "soft"]
  ];

  for (const [title, facts, className] of groups) {
    if (!facts.length) continue;
    container.appendChild(sectionTitle(title));
    for (const fact of facts) {
      container.appendChild(factCard(fact, className));
    }
  }
};

window.WF.renderTrace = function renderTrace(container, trace) {
  if (!trace.length) {
    clearAndPrepare(container, "运行推理后，这里会显示每一步触发的规则。");
    return;
  }

  container.innerHTML = "";
  container.classList.remove("empty-state");

  for (const item of trace) {
    const div = document.createElement("div");
    div.className = `trace-card ${item.ruleType}`;
    div.innerHTML = `
      <strong>Step ${item.step}. ${item.ruleId} ${item.ruleName}</strong>
      <div class="meta">匹配事实（Matched Facts）</div>
      <div>${item.matchedFacts.map((fact) => `<code>${fact}</code>`).join(" ") || "无"}</div>
      <div class="meta">推出事实（Inferred Fact）</div>
      <div><code>${item.inferredFact}</code></div>
      <div class="meta">解释（Explanation）</div>
      <div>${item.explanation}</div>
    `;
    container.appendChild(div);
  }
};

window.WF.renderRules = function renderRules(container) {
  container.innerHTML = "";
  for (const rule of window.WF.RULES) {
    const div = document.createElement("div");
    div.className = `rule-card ${rule.type}`;
    div.innerHTML = `<strong>${rule.id}. ${rule.name}</strong><p>${rule.description || ""}</p><div class="meta">类别（Category）: ${rule.type}</div>`;
    container.appendChild(div);
  }
};

window.WF.renderSummary = function renderSummary(container, summaryItems) {
  if (!summaryItems.length) {
    clearAndPrepare(container, "运行推理后，这里会生成可解释的局势总结。");
    return;
  }

  container.innerHTML = "";
  container.classList.remove("empty-state");

  for (const item of summaryItems) {
    const div = document.createElement("div");
    div.className = `summary-card ${item.type}`;
    div.innerHTML = `<strong>${item.title}</strong><p>${item.text}</p>`;
    container.appendChild(div);
  }
};
