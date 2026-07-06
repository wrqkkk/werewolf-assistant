window.WF = window.WF || {};

window.WF.runInference = function runInference(initialFacts) {
  const facts = [...initialFacts];
  const inferred = [];
  const trace = [];

  let changed = true;

  while (changed) {
    changed = false;

    for (const rule of window.WF.RULES) {
      const matches = rule.when(facts, inferred);

      for (const m of matches) {
        const newFact = rule.then(m);
        const key = window.WF.factKey(newFact);

        const exists = [...facts, ...inferred].some(f => window.WF.factKey(f) === key);

        if (!exists) {
          inferred.push(newFact);

          trace.push({
            ruleId: rule.id,
            ruleName: rule.name,
            input: m,
            output: newFact,
            explanation: rule.explain ? rule.explain(m) : ""
          });

          changed = true;
        }
      }
    }
  }

  return { facts, inferred, trace };
};