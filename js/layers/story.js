var storyMilestoneDefinitions = {};

function recordStoryEvent(index) {
  const event = DOUPO_CONTENT.story.events[index];
  player.storyStep = Math.max(player.storyStep, index);
  if (!player.storySeen.includes(event.id)) player.storySeen.push(event.id);
  player.story.points = new Decimal(index + 1);
  player.story.best = player.story.best.max(player.story.points);
  player.story.total = player.story.total.max(player.story.points);
  if (event.completesPhase) player.phaseOneComplete = true;
}

DOUPO_CONTENT.story.events.forEach(function (event, index) {
  const conditions = [
    function () { return true; },
    function () { return hasMilestone("realm", 1); },
    function () { return hasMilestone("realm", 3); },
    function () { return hasMilestone("realm", 5); },
    function () {
      const recipesPrepared = [11, 12, 13].every(function (id) {
        return getBuyableAmount("alchemy", id).gte(1);
      });
      return hasMilestone("realm", 6) &&
        hasUpgrade("technique", 24) &&
        recipesPrepared &&
        hasMilestone("alchemy", 2);
    }
  ];
  const requirements = [
    "开始新的修炼",
    "达到斗之气五段",
    "达到斗之气七段",
    "达到斗之气九段",
    "晋入斗者、修炼焚诀、完成三种药方与全部炼药挑战"
  ];

  storyMilestoneDefinitions[index] = {
    requirementDescription: `${event.title} · ${requirements[index]}`,
    effectDescription: event.description,
    done: conditions[index],
    onComplete: function () { recordStoryEvent(index); }
  };
});

addLayer("story", {
  name: "纪事",
  symbol: "纪",
  row: "side",
  color: "#c8b078",
  resource: "已阅纪事",
  type: "none",
  startData: function () {
    return {
      unlocked: true,
      points: new Decimal(0),
      best: new Decimal(0),
      total: new Decimal(0)
    };
  },
  milestones: storyMilestoneDefinitions,
  milestonePopups: true,
  layerShown: function () { return true; },
  tooltip: function () {
    return `${Math.max(0, player.storyStep + 1)} / ${DOUPO_CONTENT.story.events.length} 篇纪事`;
  },
  doReset: function () {},
  tabFormat: [
    ["display-text", "修炼不是一条脱离生活的数字曲线。纪事只在条件达成时推进，不会因任何重置倒退。", { "max-width": "680px", "margin": "0 auto", "color": "var(--text-muted)" }],
    "blank",
    "milestones",
    "blank",
    ["display-text", function () {
      if (!player.phaseOneComplete) return "阶段目标：晋入斗者，修炼焚诀并完成三项炼药试炼，然后启程魔兽山脉。";
      return "第一阶段已完成。继续游玩不会覆盖或清除当前存档。";
    }, { "font-size": "16px", "color": "#f1d28a" }]
  ]
});
