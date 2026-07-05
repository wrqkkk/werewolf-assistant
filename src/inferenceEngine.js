import { RULES } from "./rules.js";
import { factKey } from "./facts.js";

export function runInference(initialFacts) {
  const facts = [...initialFacts];
  const inferred = [];
  const trace = [];

  let changed = true;

  while (changed) {
    changed = false;

    for (const rule of RULES) {
      const matches = rule.when(facts, inferred);

      for (const m of matches) {
        const newFact = rule.then(m);
        const key = factKey(newFact);

        const exists = [...facts, ...inferred].some(f => factKey(f) === key);

        if (!exists) {
          inferred.push(newFact);
          trace.push({
            ruleId: rule.id,
            ruleName: rule.name,
            input: m,
            output: newFact
          });
          changed = true;
        }
      }
    }
  }

  return { facts, inferred, trace };
}
