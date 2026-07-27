var realmUpgradeDefinitions = {};

DOUPO_CONTENT.realm.upgrades.forEach(function (item, index, allItems) {
  const previous = index > 0 ? allItems[index - 1].id : null;
  const definition = {
    title: item.title,
    description: item.description,
    cost: new Decimal(item.cost),
    unlocked: function () {
      return previous === null || hasUpgrade("realm", previous) || hasMilestone("realm", Math.max(0, index - 2));
    }
  };
  if (item.currency === "base") {
    definition.currencyDisplayName = "斗气";
    definition.currencyInternalName = "points";
  }
  realmUpgradeDefinitions[item.id] = definition;
});

var realmMilestoneDefinitions = {};

DOUPO_CONTENT.realm.milestones.forEach(function (item) {
  realmMilestoneDefinitions[item.id] = {
    requirementDescription: `${item.title} · 累计 ${item.requirement} 修为`,
    effectDescription: item.description,
    done: function () {
      return player.realm.total.gte(item.requirement);
    }
  };
});

realmMilestoneDefinitions[6].toggles = [["realm", "auto"]];

addLayer("realm", {
  name: "境界",
  symbol: "境",
  position: 0,
  row: 0,
  color: "#d9783d",
  resource: "修为",
  baseResource: "斗气",
  baseAmount: function () { return player.points; },
  requires: new Decimal(DOUPO_BALANCE.REALM_RESET_REQUIREMENT),
  type: "normal",
  exponent: 0.5,
  resetDescription: "凝练斗气，可得：",
  showBest: false,
  showTotal: false,
  startData: function () {
    return {
      unlocked: true,
      points: new Decimal(0),
      best: new Decimal(0),
      total: new Decimal(0),
      auto: false
    };
  },
  gainMult: function () {
    let mult = new Decimal(1);
    if (hasUpgrade("realm", 14)) mult = mult.times(1.5);
    if (hasUpgrade("realm", 21)) mult = mult.times(2);
    if (hasUpgrade("realm", 24)) mult = mult.times(3);
    if (hasUpgrade("realm", 32)) mult = mult.times(player.technique.points.add(1).pow(0.65));
    if (hasMilestone("realm", 4)) mult = mult.times(2);
    if (hasUpgrade("technique", 21)) mult = mult.times(2);
    if (hasUpgrade("technique", 22)) mult = mult.times(3);
    if (hasUpgrade("technique", 23)) mult = mult.times(player.technique.points.add(1).pow(0.8));
    if (player.alchemy && player.alchemy.buyables) {
      mult = mult.times(Decimal.pow(1.75, getBuyableAmount("alchemy", 12)));
    }
    if (hasChallenge("alchemy", 12)) mult = mult.times(3);
    if (hasChallenge("alchemy", 13)) mult = mult.times(2);
    if (inChallenge("alchemy", 12) || inChallenge("alchemy", 13)) mult = mult.div(10);
    return mult;
  },
  gainExp: function () {
    let exponent = new Decimal(1);
    if (hasUpgrade("technique", 24)) exponent = exponent.add(0.08);
    return exponent;
  },
  upgrades: realmUpgradeDefinitions,
  milestones: realmMilestoneDefinitions,
  milestonePopups: true,
  hotkeys: [
    { key: "r", description: "R：凝练斗气，获取修为", onPress: function () { if (canReset("realm")) doReset("realm"); } }
  ],
  autoPrestige: function () {
    return hasUpgrade("technique", 14) && player.realm.auto;
  },
  autoUpgrade: function () {
    return hasMilestone("realm", 6) && player.realm.auto;
  },
  doReset: function (resettingLayer) {
    if (resettingLayer === this.layer) {
      player.realm.upgrades = DOUPO_BALANCE.getRetainedRealmUpgrades(
        player.realm.upgrades,
        player.realm.milestones
      );
      return;
    }
    if (layers[resettingLayer] && layers[resettingLayer].row > this.row) {
      layerDataReset(this.layer, ["milestones", "auto"]);
    }
  },
  layerShown: function () { return true; },
  tooltip: function () {
    return `${formatWhole(player.realm.points)} 修为<br>累计 ${formatWhole(player.realm.total)}`;
  },
  tabFormat: {
    "境界升级": {
      content: [
        ["display-text", function () { return "将散乱斗气凝成可反复利用的修为。每次凝练都会清空当前斗气与未受里程碑保护的境界升级。"; }, { "max-width": "680px", "margin": "0 auto", "color": "var(--text-muted)" }],
        "main-display",
        "prestige-button",
        "blank",
        "upgrades"
      ]
    },
    "修炼里程碑": {
      content: [
        ["display-text", function () { return "累计修为会留下永久进境。里程碑不会因后续重置而失去，并会逐步保护境界升级。"; }, { "max-width": "680px", "margin": "0 auto", "color": "var(--text-muted)" }],
        ["display-text", function () { return `累计修为：<b>${formatWhole(player.realm.total)}</b>`; }, { "margin": "14px auto 4px", "font-size": "15px", "color": "var(--ember-bright)" }],
        "blank",
        "milestones"
      ]
    }
  },
  nodeStyle: function () {
    return { "box-shadow": "0 0 24px rgba(217, 120, 61, .25)" };
  }
});
