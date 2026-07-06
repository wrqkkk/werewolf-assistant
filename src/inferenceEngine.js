window.WF = window.WF || {};

window.WF.runInference = function runInference(initialFacts) {
  const facts = window.WF.cloneFacts(initialFacts);
  const inferred = [];
  const trace = [];
  let step = 0;
  let changed = true;

  while (changed) {
    changed = false;

    for (const rule of window.WF.RULES) {
      const matches = rule.when(facts, inferred);

      for (const match of matches) {
        const newFact = rule.then(match);
        const newFactKey = window.WF.factKey(newFact);
        const exists = [...facts, ...inferred].some((fact) => window.WF.factKey(fact) === newFactKey);

        if (!exists) {
          inferred.push(newFact);
          step += 1;
          trace.push({
            step,
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.type,
            matchedFacts: (match.matchedFacts || []).map(window.WF.describeFact),
            inferredFact: window.WF.describeFact(newFact),
            explanation: rule.explain ? rule.explain(match) : ""
          });
          changed = true;
        }
      }
    }
  }

  return { facts, inferred, trace };
};
