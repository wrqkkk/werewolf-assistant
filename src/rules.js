window.WF = window.WF || {};

window.WF.allFacts = function allFacts(initialFacts, inferredFacts) {
  return [...initialFacts, ...inferredFacts];
};

function pairEquals(a1, a2, b1, b2) {
  const a = window.WF.canonicalPair(a1, a2);
  const b = window.WF.canonicalPair(b1, b2);
  return a[0] === b[0] && a[1] === b[1];
}

function eventActor(fact) {
  if (fact.type === "claim") return fact.player;
  if (fact.type === "check") return fact.seer;
  if (fact.type === "vote") return fact.voter;
  return null;
}

window.WF.RULES = [
  {
    id: "R1",
    type: "hard",
    name: "唯一预言家冲突规则（Seer Conflict）",
    description: "两人声称Seer形成对跳",
    when: (facts) => {
      const claims = facts.filter(f => f.type === "claim" && f.role === "Seer");
      const results = [];
      for (let i = 0; i < claims.length; i++) {
        for (let j = i + 1; j < claims.length; j++) {
          const [p1, p2] = window.WF.canonicalPair(claims[i].player, claims[j].player);
          results.push({ player1: p1, player2: p2, matchedFacts: [claims[i], claims[j]] });
        }
      }
      return results;
    },
    then: (m) => ({ type: "role_conflict", player1: m.player1, player2: m.player2, role: "Seer", matchedFacts: m.matchedFacts }),
    explain: (m) => `${m.player1} 与 ${m.player2} 对跳预言家`
  },

  {
    id: "R2",
    type: "hard",
    name: "至少一假预言家",
    when: (facts, inferred) => inferred
      .filter(f => f.type === "role_conflict")
      .map(f => ({ ...f, matchedFacts: [f] })),
    then: (m) => ({ type: "at_least_one_fake", player1: m.player1, player2: m.player2, role: m.role, matchedFacts: m.matchedFacts }),
    explain: (m) => `${m.player1}/${m.player2} 至少一假`
  },

  {
    id: "R3",
    type: "hard",
    name: "查验冲突",
    when: (facts) => {
      const checks = facts.filter(f => f.type === "check");
      const res = [];
      for (let i = 0; i < checks.length; i++) {
        for (let j = i + 1; j < checks.length; j++) {
          const a = checks[i], b = checks[j];
          if (a.target === b.target && a.result !== b.result && a.seer !== b.seer) {
            res.push({ goodClaimer: a.result === "Good" ? a.seer : b.seer,
                       wolfClaimer: a.result === "Wolf" ? a.seer : b.seer,
                       target: a.target,
                       matchedFacts: [a,b] });
          }
        }
      }
      return res;
    },
    then: (m) => ({ type: "check_contradiction", goodClaimer: m.goodClaimer, wolfClaimer: m.wolfClaimer, target: m.target, matchedFacts: m.matchedFacts }),
    explain: (m) => `${m.goodClaimer} vs ${m.wolfClaimer} 查验冲突`
  },

  {
    id: "R4",
    type: "hard",
    name: "核心对跳",
    when: (facts, inferred) => {
      const c = inferred.filter(f => f.type === "role_conflict");
      const d = inferred.filter(f => f.type === "check_contradiction");
      const res = [];
      for (const a of c) {
        for (const b of d) {
          if (pairEquals(a.player1, a.player2, b.goodClaimer, b.wolfClaimer)) {
            res.push({ player1: a.player1, player2: a.player2, target: b.target, matchedFacts: [a,b] });
          }
        }
      }
      return res;
    },
    then: (m) => ({ type: "seer_pair_conflict", player1: m.player1, player2: m.player2, target: m.target, matchedFacts: m.matchedFacts }),
    explain: (m) => `核心对跳`
  },

  {
    id: "R5",
    type: "hard",
    name: "死亡无效",
    when: (facts) => {
      const deaths = facts.filter(f => f.type === "dead");
      const events = facts.filter(f => ["claim","check","vote"].includes(f.type));
      const res = [];
      for (const d of deaths) {
        for (const e of events) {
          const actor = eventActor(e);
          if (actor === d.player) {
            res.push({ invalidFactId: e.id, reason: "dead", matchedFacts: [d,e] });
          }
        }
      }
      return res;
    },
    then: (m) => ({ type: "invalid_event", invalidFactId: m.invalidFactId, reason: m.reason, matchedFacts: m.matchedFacts }),
    explain: (m) => `死亡后无效`
  },

  {
    id: "R6",
    type: "dependent",
    name: "好人声明",
    when: (facts) => facts.filter(f => f.type === "check" && f.result === "Good"),
    then: (m) => ({ type: "claimed_good_by", target: m.target, claimant: m.seer, matchedFacts: [m] }),
    explain: (m) => `好人声明`
  },

  {
    id: "R7",
    type: "dependent",
    name: "狼人声明",
    when: (facts) => facts.filter(f => f.type === "check" && f.result === "Wolf"),
    then: (m) => ({ type: "claimed_wolf_by", target: m.target, claimant: m.seer, matchedFacts: [m] }),
    explain: (m) => `狼人声明`
  },

  {
    id: "R8",
    type: "dependent",
    name: "冲突声明",
    when: (facts, inferred) => {
      const g = inferred.filter(f => f.type === "claimed_good_by");
      const w = inferred.filter(f => f.type === "claimed_wolf_by");
      const res = [];
      for (const a of g) {
        for (const b of w) {
          if (a.target === b.target && a.claimant !== b.claimant) {
            res.push({ target: a.target, goodClaimer: a.claimant, wolfClaimer: b.claimant, matchedFacts: [a,b] });
          }
        }
      }
      return res;
    },
    then: (m) => ({ type: "target_under_conflicting_claims", target: m.target, goodClaimer: m.goodClaimer, wolfClaimer: m.wolfClaimer, matchedFacts: m.matchedFacts }),
    explain: (m) => `冲突声明`
  },

  {
    id: "R9",
    type: "soft",
    name: "投票冲突",
    when: (facts, inferred) => {
      const c = inferred.filter(f => f.type === "seer_pair_conflict");
      const votes = facts.filter(f => f.type === "vote");
      const res = [];
      for (const v of votes) {
        for (const x of c) {
          if ([x.player1, x.player2].includes(v.target)) {
            res.push({ voter: v.voter, target: v.target, phase: v.phase, matchedFacts: [v,x] });
          }
        }
      }
      return res;
    },
    then: (m) => ({ type: "vote_related_to_conflict", voter: m.voter, target: m.target, phase: m.phase, matchedFacts: m.matchedFacts }),
    explain: (m) => `投票冲突`
  },

  {
    id: "R10",
    type: "soft",
    name: "投票分裂",
    when: (facts, inferred) => {
      const votes = facts.filter(f => f.type === "vote");
      const c = inferred.filter(f => f.type === "seer_pair_conflict");
      const res = [];
      for (const x of c) {
        const a = votes.filter(v => v.target === x.player1);
        const b = votes.filter(v => v.target === x.player2);
        for (const va of a) {
          for (const vb of b) {
            if (va.phase === vb.phase) {
              res.push({ voter1: va.voter, voter2: vb.voter, player1: x.player1, player2: x.player2, phase: va.phase, matchedFacts: [va,vb,x] });
            }
          }
        }
      }
      return res;
    },
    then: (m) => ({ type: "voting_split_on_seer_pair", voter1: m.voter1, voter2: m.voter2, player1: m.player1, player2: m.player2, phase: m.phase, matchedFacts: m.matchedFacts }),
    explain: (m) => `投票分裂`
  },

  {
    id: "R11",
    type: "soft",
    name: "多人投票",
    when: (facts) => {
      const votes = facts.filter(f => f.type === "vote");
      const map = new Map();
      for (const v of votes) {
        const key = v.target + v.phase;
        map.set(key, (map.get(key)||[]).concat(v));
      }
      const res = [];
      for (const arr of map.values()) {
        if (arr.length >= 2) res.push({ target: arr[0].target, phase: arr[0].phase, voters: arr.map(v=>v.voter), matchedFacts: arr });
      }
      return res;
    },
    then: (m) => ({ type: "multiple_votes_on", target: m.target, phase: m.phase, voters: m.voters, matchedFacts: m.matchedFacts }),
    explain: (m) => `多人投票`
  },

  {
    id: "R12",
    type: "soft",
    name: "投票压力",
    when: (facts, inferred) => {
      const c = inferred.filter(f => f.type === "seer_pair_conflict");
      const mv = inferred.filter(f => f.type === "multiple_votes_on");
      const res = [];
      for (const x of c) {
        for (const y of mv) {
          if ([x.player1, x.player2].includes(y.target)) {
            res.push({ player: y.target, phase: y.phase, voters: y.voters, matchedFacts: [x,y] });
          }
        }
      }
      return res;
    },
    then: (m) => ({ type: "conflict_player_under_pressure", player: m.player, phase: m.phase, voters: m.voters, matchedFacts: m.matchedFacts }),
    explain: (m) => `压力`
  }
];