let modInfo = {
  name: "斗破苍穹：焚诀之路",
  id: "doupo-fenjue-road",
  author: "本地同人实验",
  pointsName: "斗气",
  modFiles: [
    "balance.js",
    "content.js",
    "layers/realm.js",
    "layers/technique.js",
    "layers/alchemy.js",
    "layers/story.js",
    "tree.js"
  ],
  discordName: "",
  discordLink: "",
  initialStartPoints: new Decimal(0),
  offlineLimit: 8
};

let VERSION = {
  num: "0.1.0",
  name: "乌坦城起步"
};

let changelog = `<h1>更新记录</h1><br>
  <h3>v0.1.0 - 乌坦城起步</h3><br>
  - 完成境界、功法、炼药与纪事四个层级。<br>
  - 加入三项炼药挑战和三种可重复炼制配方。<br>
  - 第一阶段推进至启程魔兽山脉。`;

let winText = `你已完成第一阶段：启程魔兽山脉。<br><br>
  城门已经落在身后，新的历练仍在前方。你可以继续积累当前存档。`;

var doNotCallTheseFunctionsEveryTick = ["applyAlchemyResetSnapshot"];

function getStartPoints() {
  return new Decimal(modInfo.initialStartPoints);
}

function canGenPoints() {
  return true;
}

function getPointGen() {
  if (!canGenPoints()) return new Decimal(0);

  let gain = new Decimal(1);
  if (hasUpgrade("realm", 11)) gain = gain.times(2);
  if (hasUpgrade("realm", 12)) gain = gain.times(2);
  if (hasUpgrade("realm", 13)) gain = gain.times(3);
  if (hasUpgrade("realm", 14)) gain = gain.times(2);
  if (hasUpgrade("realm", 22)) gain = gain.times(player.realm.points.add(1).pow(0.35));
  if (hasUpgrade("realm", 31)) gain = gain.times(player.realm.total.add(1).pow(0.18));
  if (hasUpgrade("realm", 33)) gain = gain.times(5);
  if (hasUpgrade("realm", 34)) gain = gain.times(10);

  if (hasMilestone("realm", 0)) gain = gain.times(1.5);
  if (hasMilestone("realm", 3)) gain = gain.times(2);

  if (hasUpgrade("technique", 11)) gain = gain.times(3);
  if (hasUpgrade("technique", 12)) gain = gain.times(5);
  if (hasUpgrade("technique", 13)) gain = gain.times(player.technique.points.add(1).pow(0.8));

  if (player.alchemy && player.alchemy.buyables) {
    gain = gain.times(Decimal.pow(2, getBuyableAmount("alchemy", 11)));
  }
  if (hasChallenge("alchemy", 11)) gain = gain.times(3);
  if (hasChallenge("alchemy", 13)) gain = gain.times(2);

  if (inChallenge("alchemy", 11) || inChallenge("alchemy", 13)) gain = gain.sqrt();
  return gain.max(0);
}

function addedPlayerData() {
  return {
    storyStep: -1,
    storySeen: [],
    phaseOneComplete: false
  };
}

var displayThings = [
  function () {
    if (!player || player.storyStep < 0) return "萧家后山 · 从一次完整吐纳开始";
    const event = DOUPO_CONTENT.story.events[Math.min(player.storyStep, DOUPO_CONTENT.story.events.length - 1)];
    return `<span class="journey-label">当前纪事</span> ${event.title}`;
  },
  function () {
    if (!player || !player.realm) return "";
    const nextMilestone = DOUPO_CONTENT.realm.milestones.find(function (item) {
      return !hasMilestone("realm", item.id);
    });
    if (!nextMilestone) return "境界根基已稳，前往炼药层完成三项试炼。";
    return `下一境：${nextMilestone.title} · 需要累计 ${formatWhole(nextMilestone.requirement)} 修为`;
  }
];

function isEndgame() {
  if (!player || !player.realm || !player.alchemy) return false;
  const progress = {
    realmMilestone: player.realm.milestones.length - 1,
    alchemyMilestone: player.alchemy.milestones.length - 1,
    storyStep: player.storyStep,
    fenjueLearned: hasUpgrade("technique", 24),
    recipesPrepared: [11, 12, 13].every(function (id) {
      return getBuyableAmount("alchemy", id).gte(1);
    })
  };
  return DOUPO_BALANCE.isPhaseOneComplete(progress);
}

var backgroundStyle = {};

function maxTickLength() {
  return 3600;
}

function fixOldSave(oldVersion) {
  if (player.storyStep === undefined) player.storyStep = -1;
  if (!Array.isArray(player.storySeen)) player.storySeen = [];
  if (player.phaseOneComplete === undefined) player.phaseOneComplete = false;
}
