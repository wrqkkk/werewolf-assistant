window.WF = window.WF || {};

window.WF.PLAYERS = ["P1", "P2", "P3", "P4", "P5", "P6"];

window.WF.ROLES = [
  { id: "Seer", label: "预言家（Seer）", camp: "the Villagers" },
  { id: "Werewolf", label: "狼人（Werewolf）", camp: "the Werewolves" },
  { id: "Villager", label: "平民（Villager）", camp: "the Villagers" }
];

window.WF.CAMPS = [
  { id: "the Werewolves", label: "狼人阵营（the Werewolves）" },
  { id: "the Villagers", label: "村民阵营（the Villagers）" }
];

window.WF.PHASES = ["Night1", "Day1", "Night2", "Day2", "Night3", "Day3"];

window.WF.DEFAULT_FACTS = [
  { id: "F001", type: "claim", player: "P1", role: "Seer", phase: "Day1", origin: "initial" },
  { id: "F002", type: "claim", player: "P2", role: "Seer", phase: "Day1", origin: "initial" },
  { id: "F003", type: "check", seer: "P1", target: "P3", result: "Good", phase: "Day1", origin: "initial" },
  { id: "F004", type: "check", seer: "P2", target: "P3", result: "Wolf", phase: "Day1", origin: "initial" },
  { id: "F005", type: "vote", voter: "P4", target: "P1", phase: "Day1", origin: "initial" },
  { id: "F006", type: "vote", voter: "P5", target: "P2", phase: "Day1", origin: "initial" },
  { id: "F007", type: "dead", player: "P6", phase: "Night1", origin: "initial" }
];

let nextFactNumber = 100;

window.WF.makeFact = function(type, payload) {
  nextFactNumber += 1;
  return {
    id: `F${nextFactNumber}`,
    type,
    origin: payload.origin ?? "initial",
    ...payload
  };
};

window.WF.canonicalPair = function(a, b) {
  return [a, b].sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
};

window.WF.phaseIndex = function(phase) {
  const index = window.WF.PHASES.indexOf(phase);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

window.WF.isLaterPhase = function(a, b) {
  return window.WF.phaseIndex(a) > window.WF.phaseIndex(b);
};

window.WF.factKey = function(fact) {
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
    case "invalid_event":
      return `invalid_event:${fact.eventId}:${fact.reason}`;
    default:
      return JSON.stringify(fact);
  }
};

window.WF.describeFact = function(fact) {
  return JSON.stringify(fact);
};

window.WF.describeFactInChinese = function(fact) {
  switch (fact.type) {
    case "claim":
      return `${fact.player} 声明自己是 ${fact.role}。`;
    case "check":
      return `${fact.seer} 查验 ${fact.target} 为 ${fact.result}。`;
    case "vote":
      return `${fact.voter} 投票给 ${fact.target}。`;
    case "dead":
      return `${fact.player} 死亡。`;
    default:
      return JSON.stringify(fact);
  }
};