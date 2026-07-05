import { DEFAULT_FACTS, makeFact } from "./facts.js";
import { runInference } from "./inferenceEngine.js";
import { renderFacts, renderInferred, renderTrace, renderRules } from "./renderer.js";
import { RULES } from "./rules.js";

let facts = [...DEFAULT_FACTS];

function refresh() {
  const result = runInference(facts);

  renderFacts(document.getElementById("knowledge-base"), result.facts);
  renderInferred(document.getElementById("knowledge-base"), result.inferred);
  renderTrace(document.getElementById("reasoning-trace"), result.trace);
  renderRules(document.getElementById("rule-base"));
}

function setupForm() {
  const form = document.getElementById("fact-form");
  const typeSelect = document.getElementById("event-type");
  const dynamic = document.getElementById("dynamic-fields");

  function renderFields(type) {
    dynamic.innerHTML = "";

    if (type === "claim") {
      dynamic.innerHTML = `
        <label>玩家（Player）<input id="p" placeholder="P1" /></label>
        <label>身份（Role）<input id="r" placeholder="Seer" /></label>
        <label>阶段（Phase）<input id="ph" placeholder="Day1" /></label>
      `;
    }

    if (type === "check") {
      dynamic.innerHTML = `
        <label>预言家（Seer）<input id="s" placeholder="P1" /></label>
        <label>目标（Target）<input id="t" placeholder="P3" /></label>
        <label>结果（Result）<input id="res" placeholder="Good/Wolf" /></label>
      `;
    }

    if (type === "vote") {
      dynamic.innerHTML = `
        <label>投票者（Voter）<input id="v" placeholder="P4" /></label>
        <label>目标（Target）<input id="t" placeholder="P1" /></label>
        <label>阶段（Phase）<input id="ph" placeholder="Day1" /></label>
      `;
    }

    if (type === "dead") {
      dynamic.innerHTML = `
        <label>死亡玩家（Player）<input id="p" placeholder="P6" /></label>
        <label>阶段（Phase）<input id="ph" placeholder="Night1" /></label>
      `;
    }
  }

  typeSelect.addEventListener("change", e => renderFields(e.target.value));
  renderFields(typeSelect.value);

  form.addEventListener("submit", e => {
    e.preventDefault();

    const type = typeSelect.value;

    let fact;

    if (type === "claim") {
      fact = makeFact("claim", {
        player: p.value,
        role: r.value,
        phase: ph.value
      });
    }

    if (type === "check") {
      fact = makeFact("check", {
        seer: s.value,
        target: t.value,
        result: res.value,
        phase: "Day1"
      });
    }

    if (type === "vote") {
      fact = makeFact("vote", {
        voter: v.value,
        target: t.value,
        phase: ph.value
      });
    }

    if (type === "dead") {
      fact = makeFact("dead", {
        player: p.value,
        phase: ph.value
      });
    }

    facts.push(fact);
    refresh();
  });
}

function bindButtons() {
  document.getElementById("load-default").onclick = () => {
    facts = [...DEFAULT_FACTS];
    refresh();
  };

  document.getElementById("clear-facts").onclick = () => {
    facts = [];
    refresh();
  };

  document.getElementById("run-inference").onclick = () => {
    refresh();
  };
}

window.addEventListener("DOMContentLoaded", () => {
  setupForm();
  bindButtons();
  refresh();
  renderRules(document.getElementById("rule-base"));
});
