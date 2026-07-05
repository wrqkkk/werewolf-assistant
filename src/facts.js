export const PLAYERS = ["P1", "P2", "P3", "P4", "P5", "P6"];

export const ROLES = [
  { id: "Seer", label: "预言家（Seer）", camp: "the Villagers" },
  { id: "Werewolf", label: "狼人（Werewolf）", camp: "the Werewolves" },
  { id: "Villager", label: "平民（Villager）", camp: "the Villagers" }
];

export const CAMPS = [
  { id: "the Werewolves", label: "狼人阵营（the Werewolves）" },
  { id: "the Villagers", label: "村民阵营（the Villagers）" }
];

export const PHASES = ["Night1", "Day1", "Night2", "Day2", "Night3", "Day3"];

export const DEFAULT_FACTS = [
  { id: "F001", type: "claim", player: "P1", role: "Seer", phase: "Day1", origin: "initial" },
  { id: "F002", type: "claim", player: "P2", role: "Seer", phase: "Day1", origin: "initial" },
  { id: "F003", type: "check", seer: "P1", target: "P3", result: "Good", phase: "Day1", origin: "initial" },
  { id: "F004", type: "check", seer: "P2", target: "P3", result: "Wolf", phase: "Day1", origin: "initial" },
  { id: "F005", type: "vote", voter: "P4", target: "P1", phase: "Day1", origin: "initial" },
  { id: "F006", type: "vote", voter: "P5", target: "P2", phase: "Day1", origin: "initial" },
  { id: "F007", type: "dead", player: "P6", phase: "Night1", origin: "initial" }
];

let nextFactNumber = 100;

export function makeFact(type, payload) {
  nextFactNumber += 1;
  return {
    id: `F${nextFactNumber}`,
    type,
    origin: payload.origin ?? "initial",
    ...payload
  };
}

export function canonicalPair(a, b) {
  return [a, b].sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
}

export function phaseIndex(phase) {
  const index = PHASES.indexOf(phase);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function isLaterPhase(phaseA, phaseB) {
  return phaseIndex(phaseA) > phaseIndex(phaseB);
}

export function factKey(fact) {
  switch (fact.type) {
    case "claim":
      return `claim:${fact.player}:${fact.role}:${fact.phase ?? ""}`;
    case "check":
      return `check:${fact.seer}:${fact.target}:${fact.result}:${fact.phase ?? ""}`;
    case "vote":
      return `vote:${fact.voter}:${fact.target}:${fact.phase ?? ""}`;
    case "dead":
      return `dead:${fact.player}:${fact.phase}`;
    case "role_conflict":
      return `role_conflict:${fact.player1}:${fact.player2}:${fact.role}`;
    case "at_least_one_fake":
      return `at_least_one_fake:${fact.player1}:${fact.player2}:${fact.role}`;
    case "check_contradiction":
      return `check_contradiction:${fact.goodClaimer}:${fact.wolfClaimer}:${fact.target}`;
    case "seer_pair_conflict":
      return `seer_pair_conflict:${fact.player1}:${fact.player2}`;
    case "claimed_good_by":
      return `claimed_good_by:${fact.target}:${fact.claimant}`;
    case "claimed_wolf_by":
      return `claimed_wolf_by:${fact.target}:${fact.claimant}`;
    case "target_under_conflicting_claims":
      return `target_under_conflicting_claims:${fact.target}:${fact.goodClaimer}:${fact.wolfClaimer}`;
    case "vote_related_to_conflict":
      return `vote_related_to_conflict:${fact.voter}:${fact.target}:${fact.phase}`;
    case "voting_split_on_seer_pair":
      return `voting_split_on_seer_pair:${fact.voter1}:${fact.voter2}:${fact.player1}:${fact.player2}:${fact.phase}`;
    case "multiple_votes_on":
      return `multiple_votes_on:${fact.target}:${fact.phase}`;
    case "conflict_player_under_pressure":
      return `conflict_player_under_pressure:${fact.player}:${fact.phase}`;
    case "invalid_event":
      return `invalid_event:${fact.eventId}:${fact.reason}`;
    default:
      return JSON.stringify(fact);
  }
}

export function describeFact(fact) {
  switch (fact.type) {
    case "claim":
      return `claim(${fact.player}, ${fact.role})`;
    case "check":
      return `check(${fact.seer}, ${fact.target}, ${fact.result})`;
    case "vote":
      return `vote(${fact.voter}, ${fact.target}, ${fact.phase})`;
    case "dead":
      return `dead(${fact.player}, ${fact.phase})`;
    case "role_conflict":
      return `role_conflict(${fact.player1}, ${fact.player2}, ${fact.role})`;
    case "at_least_one_fake":
      return `at_least_one_fake(${fact.player1}, ${fact.player2}, ${fact.role})`;
    case "check_contradiction":
      return `check_contradiction(${fact.goodClaimer}, ${fact.wolfClaimer}, ${fact.target})`;
    case "seer_pair_conflict":
      return `seer_pair_conflict(${fact.player1}, ${fact.player2})`;
    case "claimed_good_by":
      return `claimed_good_by(${fact.target}, ${fact.claimant})`;
    case "claimed_wolf_by":
      return `claimed_wolf_by(${fact.target}, ${fact.claimant})`;
    case "target_under_conflicting_claims":
      return `target_under_conflicting_claims(${fact.target}, ${fact.goodClaimer}, ${fact.wolfClaimer})`;
    case "vote_related_to_conflict":
      return `vote_related_to_conflict(${fact.voter}, ${fact.target})`;
    case "voting_split_on_seer_pair":
      return `voting_split_on_seer_pair(${fact.voter1}, ${fact.voter2}, ${fact.player1}, ${fact.player2})`;
    case "multiple_votes_on":
      return `multiple_votes_on(${fact.target}, ${fact.phase})`;
    case "conflict_player_under_pressure":
      return `conflict_player_under_pressure(${fact.player}, ${fact.phase})`;
    case "invalid_event":
      return `invalid_event(${fact.eventId}, ${fact.reason})`;
    default:
      return JSON.stringify(fact);
  }
}

export function describeFactInChinese(fact) {
  switch (fact.type) {
    case "claim":
      return `${fact.player} 声明自己是 ${fact.role}。`;
    case "check":
      return `${fact.seer} 声称查验 ${fact.target} 为 ${fact.result === "Good" ? "好人" : "狼人"}。`;
    case "vote":
      return `${fact.voter} 在 ${fact.phase} 投票给 ${fact.target}。`;
    case "dead":
      return `${fact.player} 在 ${fact.phase} 死亡。`;
    case "role_conflict":
      return `${fact.player1} 和 ${fact.player2} 都声明唯一身份 ${fact.role}，形成身份冲突。`;
    case "at_least_one_fake":
      return `${fact.player1} 和 ${fact.player2} 至少一人不是真预言家。`;
    case "check_contradiction":
      return `${fact.goodClaimer} 与 ${fact.wolfClaimer} 对 ${fact.target} 给出相反查验结果。`;
    case "seer_pair_conflict":
      return `${fact.player1} 和 ${fact.player2} 构成预言家对跳核心冲突。`;
    case "claimed_good_by":
      return `${fact.target} 被 ${fact.claimant} 声称为好人。`;
    case "claimed_wolf_by":
      return `${fact.target} 被 ${fact.claimant} 声称为狼人。`;
    case "target_under_conflicting_claims":
      return `${fact.target} 同时处在 ${fact.goodClaimer} 的好人声明和 ${fact.wolfClaimer} 的狼人声明之下。`;
    case "vote_related_to_conflict":
      return `${fact.voter} 的投票卷入核心冲突，目标是 ${fact.target}。`;
    case "voting_split_on_seer_pair":
      return `${fact.voter1} 和 ${fact.voter2} 分别投向对跳双方 ${fact.player1}/${fact.player2}。`;
    case "multiple_votes_on":
      return `${fact.target} 在 ${fact.phase} 被多人投票。`;
    case "conflict_player_under_pressure":
      return `${fact.player} 既是核心冲突玩家，又在 ${fact.phase} 承受投票压力。`;
    case "invalid_event":
      return `发现无效事件：${fact.reason}。`;
    default:
      return describeFact(fact);
  }
}
