import { canonicalPair } from "./facts.js";

export const RULES = [
  {
    id: "R1",
    type: "hard",
    name: "唯一预言家冲突规则（Unique Seer Conflict Rule）",
    when: (facts) => {
      const claims = facts.filter(f => f.type === "claim" && f.role === "Seer");
      const results = [];
      for (let i = 0; i < claims.length; i++) {
        for (let j = i + 1; j < claims.length; j++) {
          if (claims[i].player !== claims[j].player) {
            results.push({ player1: claims[i].player, player2: claims[j].player });
          }
        }
      }
      return results;
    },
    then: (pair) => ({
      type: "role_conflict",
      player1: pair.player1,
      player2: pair.player2,
      role: "Seer"
    })
  },

  {
    id: "R2",
    type: "hard",
    name: "至少一人伪预言家规则（At Least One Fake Seer Rule）",
    when: (facts, inferred) => inferred.filter(f => f.type === "role_conflict"),
    then: (fc) => ({
      type: "at_least_one_fake",
      player1: fc.player1,
      player2: fc.player2,
      role: fc.role
    })
  },

  {
    id: "R3",
    type: "hard",
    name: "查验结果矛盾规则（Contradictory Check Rule）",
    when: (facts) => {
      const checks = facts.filter(f => f.type === "check");
      const results = [];
      for (let i = 0; i < checks.length; i++) {
        for (let j = i + 1; j < checks.length; j++) {
          if (
            checks[i].target === checks[j].target &&
            checks[i].result !== checks[j].result &&
            checks[i].seer !== checks[j].seer
          ) {
            const pair = canonicalPair(checks[i].seer, checks[j].seer);
            results.push({ good: checks[i].result === "Good" ? checks[i].seer : checks[j].seer,
                           wolf: checks[i].result === "Wolf" ? checks[i].seer : checks[j].seer,
                           target: checks[i].target });
          }
        }
      }
      return results;
    },
    then: (c) => ({
      type: "check_contradiction",
      goodClaimer: c.good,
      wolfClaimer: c.wolf,
      target: c.target
    })
  },

  {
    id: "R4",
    type: "hard",
    name: "核心预言家对跳规则（Core Seer Pair Conflict Rule）",
    when: (facts, inferred) => {
      const conflicts = inferred.filter(f => f.type === "role_conflict");
      const checks = inferred.filter(f => f.type === "check_contradiction");
      const results = [];
      for (const c of conflicts) {
        for (const d of checks) {
          const pair1 = canonicalPair(c.player1, c.player2);
          const pair2 = canonicalPair(d.goodClaimer, d.wolfClaimer);
          if (pair1[0] === pair2[0] && pair1[1] === pair2[1]) {
            results.push({ player1: c.player1, player2: c.player2 });
          }
        }
      }
      return results;
    },
    then: (p) => ({
      type: "seer_pair_conflict",
      player1: p.player1,
      player2: p.player2
    })
  }
];
