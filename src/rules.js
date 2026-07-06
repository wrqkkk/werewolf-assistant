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
    name: "唯一预言家冲突规则（Unique Seer Conflict Rule）",
    description: "两个不同玩家都声明唯一身份 Seer 时，形成预言家对跳。",
    when: (facts) => {
      const claims = facts.filter((fact) => fact.type === "claim" && fact.role === "Seer");
      const matches = [];
      for (let i = 0; i < claims.length; i += 1) {
        for (let j = i + 1; j < claims.length; j += 1) {
          const [player1, player2] = window.WF.canonicalPair(claims[i].player, claims[j].player);
          matches.push({ player1, player2, matchedFacts: [claims[i], claims[j]] });
        }
      }
      return matches;
    },
    then: (match) => ({ type: "role_conflict", player1: match.player1, player2: match.player2, role: "Seer" }),
    explain: (match) => `${match.player1} 和 ${match.player2} 都声明自己是预言家，因此形成预言家对跳。`
  },

  {
    id: "R2",
    type: "hard",
    name: "至少一人伪预言家规则（At Least One Fake Seer Rule）",
    description: "预言家对跳意味着两个声明者至少一人不是真预言家。",
    when: (facts, inferred) => inferred
      .filter((fact) => fact.type === "role_conflict")
      .map((fact) => ({ ...fact, matchedFacts: [fact] })),
    then: (match) => ({ type: "at_least_one_fake", player1: match.player1, player2: match.player2, role: match.role }),
    explain: (match) => `${match.player1} 和 ${match.player2} 对同一唯一身份产生冲突，因此至少一人不是真预言家。`
  },

  {
    id: "R3",
    type: "hard",
    name: "查验结果矛盾规则（Contradictory Check Rule）",
    description: "两个玩家对同一目标给出 Good 与 Wolf 的相反查验结果时，形成查验矛盾。",
    when: (facts) => {
      const checks = facts.filter((fact) => fact.type === "check");
      const matches = [];
      for (let i = 0; i < checks.length; i += 1) {
        for (let j = i + 1; j < checks.length; j += 1) {
          const a = checks[i];
          const b = checks[j];
          if (a.target === b.target && a.result !== b.result && a.seer !== b.seer) {
            matches.push({
              goodClaimer: a.result === "Good" ? a.seer : b.seer,
              wolfClaimer: a.result === "Wolf" ? a.seer : b.seer,
              target: a.target,
              matchedFacts: [a, b]
            });
          }
        }
      }
      return matches;
    },
    then: (match) => ({ type: "check_contradiction", goodClaimer: match.goodClaimer, wolfClaimer: match.wolfClaimer, target: match.target }),
    explain: (match) => `${match.goodClaimer} 声称 ${match.target} 是好人，${match.wolfClaimer} 声称 ${match.target} 是狼人，二者查验结果相互矛盾。`
  },

  {
    id: "R4",
    type: "hard",
    name: "核心预言家对跳规则（Core Seer Pair Conflict Rule）",
    description: "同一组玩家同时出现预言家身份冲突和查验冲突时，构成核心对跳冲突。",
    when: (facts, inferred) => {
      const conflicts = inferred.filter((fact) => fact.type === "role_conflict");
      const contradictions = inferred.filter((fact) => fact.type === "check_contradiction");
      const matches = [];
      for (const conflict of conflicts) {
        for (const contradiction of contradictions) {
          if (pairEquals(conflict.player1, conflict.player2, contradiction.goodClaimer, contradiction.wolfClaimer)) {
            matches.push({ player1: conflict.player1, player2: conflict.player2, target: contradiction.target, matchedFacts: [conflict, contradiction] });
          }
        }
      }
      return matches;
    },
    then: (match) => ({ type: "seer_pair_conflict", player1: match.player1, player2: match.player2, target: match.target }),
    explain: (match) => `${match.player1} 和 ${match.player2} 同时存在预言家身份冲突和对 ${match.target} 的查验冲突，因此构成核心对跳冲突。`
  },

  {
    id: "R5",
    type: "hard",
    name: "死亡后事件无效规则（Invalid Event after Death Rule）",
    description: "玩家死亡后产生的声明、查验或投票被标记为无效事件。",
    when: (facts) => {
      const deaths = facts.filter((fact) => fact.type === "dead");
      const events = facts.filter((fact) => ["claim", "check", "vote"].includes(fact.type));
      const matches = [];
      for (const death of deaths) {
        for (const event of events) {
          const actor = eventActor(event);
          if (actor === death.player && window.WF.isLaterPhase(event.phase, death.phase)) {
            matches.push({ deadPlayer: death.player, deathPhase: death.phase, invalidFactId: event.id, eventPhase: event.phase, matchedFacts: [death, event] });
          }
        }
      }
      return matches;
    },
    then: (match) => ({ type: "invalid_event", invalidFactId: match.invalidFactId, player: match.deadPlayer, deathPhase: match.deathPhase, eventPhase: match.eventPhase, reason: "player already dead" }),
    explain: (match) => `${match.deadPlayer} 已在 ${match.deathPhase} 死亡，因此其在 ${match.eventPhase} 产生的事件 ${match.invalidFactId} 被标记为无效。`
  },

  {
    id: "R6",
    type: "dependent",
    name: "被声称为好人规则（Claimed Good Rule）",
    description: "声明预言家的玩家给出 Good 查验结果时，记录目标被该玩家声称为好人。",
    when: (facts) => {
      const seerClaimants = facts.filter((fact) => fact.type === "claim" && fact.role === "Seer").map((fact) => fact.player);
      return facts
        .filter((fact) => fact.type === "check" && fact.result === "Good" && seerClaimants.includes(fact.seer))
        .map((fact) => ({ claimant: fact.seer, target: fact.target, matchedFacts: [fact] }));
    },
    then: (match) => ({ type: "claimed_good_by", target: match.target, claimant: match.claimant }),
    explain: (match) => `${match.claimant} 声明自己是预言家，并声称 ${match.target} 是好人。系统将该信息记录为依赖型声明。`
  },

  {
    id: "R7",
    type: "dependent",
    name: "被声称为狼人规则（Claimed Wolf Rule）",
    description: "声明预言家的玩家给出 Wolf 查验结果时，记录目标被该玩家声称为狼人。",
    when: (facts) => {
      const seerClaimants = facts.filter((fact) => fact.type === "claim" && fact.role === "Seer").map((fact) => fact.player);
      return facts
        .filter((fact) => fact.type === "check" && fact.result === "Wolf" && seerClaimants.includes(fact.seer))
        .map((fact) => ({ claimant: fact.seer, target: fact.target, matchedFacts: [fact] }));
    },
    then: (match) => ({ type: "claimed_wolf_by", target: match.target, claimant: match.claimant }),
    explain: (match) => `${match.claimant} 声明自己是预言家，并声称 ${match.target} 是狼人。系统将该信息记录为依赖型声明。`
  },

  {
    id: "R8",
    type: "dependent",
    name: "同一目标相反声明规则（Conflicting Claims on Same Target Rule）",
    description: "同一目标同时被声称为好人和狼人时，该目标进入相反声明状态。",
    when: (facts, inferred) => {
      const current = window.WF.allFacts(facts, inferred);
      const goodClaims = current.filter((fact) => fact.type === "claimed_good_by");
      const wolfClaims = current.filter((fact) => fact.type === "claimed_wolf_by");
      const matches = [];
      for (const good of goodClaims) {
        for (const wolf of wolfClaims) {
          if (good.target === wolf.target && good.claimant !== wolf.claimant) {
            matches.push({ target: good.target, goodClaimer: good.claimant, wolfClaimer: wolf.claimant, matchedFacts: [good, wolf] });
          }
        }
      }
      return matches;
    },
    then: (match) => ({ type: "target_under_conflicting_claims", target: match.target, goodClaimer: match.goodClaimer, wolfClaimer: match.wolfClaimer }),
    explain: (match) => `${match.target} 同时被 ${match.goodClaimer} 声称为好人、被 ${match.wolfClaimer} 声称为狼人，因此其身份判断依赖于 ${match.goodClaimer}/${match.wolfClaimer} 谁更可信。`
  },

  {
    id: "R9",
    type: "soft",
    name: "投票卷入核心冲突规则（Vote Related to Core Conflict Rule）",
    description: "玩家投票给核心对跳玩家时，该投票被记录为冲突相关投票。",
    when: (facts, inferred) => {
      const conflicts = inferred.filter((fact) => fact.type === "seer_pair_conflict");
      const votes = facts.filter((fact) => fact.type === "vote");
      const matches = [];
      for (const vote of votes) {
        for (const conflict of conflicts) {
          if ([conflict.player1, conflict.player2].includes(vote.target)) {
            const other = vote.target === conflict.player1 ? conflict.player2 : conflict.player1;
            matches.push({ voter: vote.voter, target: vote.target, other, phase: vote.phase, matchedFacts: [vote, conflict] });
          }
        }
      }
      return matches;
    },
    then: (match) => ({ type: "vote_related_to_conflict", voter: match.voter, target: match.target, other: match.other, phase: match.phase }),
    explain: (match) => `${match.voter} 在 ${match.phase} 投票给核心对跳玩家 ${match.target}，该投票可以作为站边线索记录。`
  },

  {
    id: "R10",
    type: "soft",
    name: "对跳双方投票分裂规则（Voting Split on Seer Pair Rule）",
    description: "同一轮次中，不同玩家分别投向对跳双方时，记录投票分裂。",
    when: (facts, inferred) => {
      const conflicts = inferred.filter((fact) => fact.type === "seer_pair_conflict");
      const votes = facts.filter((fact) => fact.type === "vote");
      const matches = [];
      for (const conflict of conflicts) {
        const leftVotes = votes.filter((vote) => vote.target === conflict.player1);
        const rightVotes = votes.filter((vote) => vote.target === conflict.player2);
        for (const left of leftVotes) {
          for (const right of rightVotes) {
            if (left.phase === right.phase && left.voter !== right.voter) {
              matches.push({ voter1: left.voter, voter2: right.voter, player1: conflict.player1, player2: conflict.player2, phase: left.phase, matchedFacts: [left, right, conflict] });
            }
          }
        }
      }
      return matches;
    },
    then: (match) => ({ type: "voting_split_on_seer_pair", voter1: match.voter1, voter2: match.voter2, player1: match.player1, player2: match.player2, phase: match.phase }),
    explain: (match) => `${match.voter1} 和 ${match.voter2} 在 ${match.phase} 分别投向对跳双方 ${match.player1}/${match.player2}，说明投票围绕核心冲突产生分裂。`
  },

  {
    id: "R11",
    type: "soft",
    name: "同一玩家多人投票规则（Multiple Votes on Same Player Rule）",
    description: "同一轮次中同一玩家被至少两名玩家投票时，记录投票焦点。",
    when: (facts) => {
      const votes = facts.filter((fact) => fact.type === "vote");
      const byTargetAndPhase = new Map();
      for (const vote of votes) {
        const key = `${vote.target}:${vote.phase}`;
        if (!byTargetAndPhase.has(key)) byTargetAndPhase.set(key, []);
        byTargetAndPhase.get(key).push(vote);
      }
      const matches = [];
      for (const voteGroup of byTargetAndPhase.values()) {
        const uniqueVoters = [...new Set(voteGroup.map((vote) => vote.voter))];
        if (uniqueVoters.length >= 2) {
          matches.push({ target: voteGroup[0].target, phase: voteGroup[0].phase, voters: uniqueVoters, matchedFacts: voteGroup });
        }
      }
      return matches;
    },
    then: (match) => ({ type: "multiple_votes_on", target: match.target, phase: match.phase, voters: match.voters }),
    explain: (match) => `${match.target} 在 ${match.phase} 被 ${match.voters.join("、")} 多人投票，因此成为该轮次投票焦点。`
  },

  {
    id: "R12",
    type: "soft",
    name: "冲突玩家承压规则（Conflict Player under Voting Pressure Rule）",
    description: "核心冲突玩家同时被多人投票时，记录其投票压力。",
    when: (facts, inferred) => {
      const conflicts = inferred.filter((fact) => fact.type === "seer_pair_conflict");
      const multipleVotes = inferred.filter((fact) => fact.type === "multiple_votes_on");
      const matches = [];
      for (const conflict of conflicts) {
        for (const vote of multipleVotes) {
          if ([conflict.player1, conflict.player2].includes(vote.target)) {
            matches.push({ player: vote.target, phase: vote.phase, voters: vote.voters, matchedFacts: [conflict, vote] });
          }
        }
      }
      return matches;
    },
    then: (match) => ({ type: "conflict_player_under_pressure", player: match.player, phase: match.phase, voters: match.voters }),
    explain: (match) => `${match.player} 既是预言家对跳玩家，又在 ${match.phase} 被多人投票，因此处于投票压力之下。`
  }
];
