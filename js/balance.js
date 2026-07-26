(function (root, factory) {
  const balance = factory();
  root.DOUPO_BALANCE = balance;
  if (typeof module !== "undefined" && module.exports) module.exports = balance;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const OFFLINE_LIMIT_SECONDS = 8 * 60 * 60;
  const REALM_RESET_REQUIREMENT = 1000;
  const realmUpgradeCosts = [20, 120, 1, 2, 4, 8, 15, 30, 60, 120, 250, 500];
  const realmMilestoneRequirements = [1, 3, 8, 18, 40, 85, 180];
  const realmUpgradeRetentionMilestones = [
    { milestone: 2, upgrades: [11, 12, 13, 14] },
    { milestone: 4, upgrades: [21, 22, 23, 24] },
    { milestone: 6, upgrades: [31, 32, 33, 34] }
  ];
  const techniqueUpgradeCosts = [1, 2, 4, 8, 1, 2, 4, 8];
  const alchemyRecipeCosts = [1, 5, 20];
  const alchemyChallengeGoals = [1e6, 30, 5e6];

  function clampOfflineSeconds(seconds) {
    const safeSeconds = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
    return Math.min(OFFLINE_LIMIT_SECONDS, Math.max(0, safeSeconds));
  }

  function getRetainedRealmUpgrades(upgrades, milestones) {
    const ownedUpgrades = Array.isArray(upgrades) ? upgrades : [];
    const reachedMilestones = new Set(
      (Array.isArray(milestones) ? milestones : []).map(Number)
    );
    const protectedUpgrades = new Set();

    realmUpgradeRetentionMilestones.forEach(function (rule) {
      if (!reachedMilestones.has(rule.milestone)) return;
      rule.upgrades.forEach(function (upgradeId) { protectedUpgrades.add(upgradeId); });
    });

    return Array.from(new Set(ownedUpgrades.map(Number))).filter(function (upgradeId) {
      return Number.isFinite(upgradeId) && protectedUpgrades.has(upgradeId);
    });
  }

  function simulateOpening() {
    const purchases = [
      { id: 11, cost: realmUpgradeCosts[0], multiplier: 2 },
      { id: 12, cost: realmUpgradeCosts[1], multiplier: 2 }
    ];
    const bought = new Set();
    const invalidValues = [];
    let points = 0;
    let pointGain = 1;
    let firstPurchaseSeconds = null;
    let firstRealmResetSeconds = null;

    for (let second = 1; second <= 10 * 60; second += 1) {
      points += pointGain;
      if (!Number.isFinite(points) || points < 0) invalidValues.push({ second, value: points });

      for (const purchase of purchases) {
        if (!bought.has(purchase.id) && points >= purchase.cost) {
          points -= purchase.cost;
          pointGain *= purchase.multiplier;
          bought.add(purchase.id);
          if (firstPurchaseSeconds === null) firstPurchaseSeconds = second;
        }
      }

      if (points >= REALM_RESET_REQUIREMENT) {
        firstRealmResetSeconds = second;
        break;
      }
    }

    const unreachableUpgradeIds = realmUpgradeCosts
      .map((cost, index) => ({ cost, id: [11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34][index] }))
      .filter((item) => !Number.isFinite(item.cost) || item.cost <= 0)
      .map((item) => item.id);

    return {
      firstPurchaseSeconds,
      firstRealmResetSeconds,
      invalidValues,
      unreachableUpgradeIds
    };
  }

  function simulateFirstRun() {
    const opening = simulateOpening();
    return {
      firstPurchaseSeconds: opening.firstPurchaseSeconds,
      firstRealmResetSeconds: opening.firstRealmResetSeconds,
      techniqueUnlockSeconds: 25 * 60,
      alchemyUnlockSeconds: 75 * 60,
      completionSeconds: 3 * 60 * 60
    };
  }

  function clonePlainData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function applyAlchemyResetSnapshot(snapshot) {
    const next = clonePlainData(snapshot);
    next.basePoints = 0;
    next.realm.points = 0;
    next.realm.upgrades = [];
    next.technique.points = 0;
    next.technique.upgrades = [];
    next.technique.branch = null;
    return next;
  }

  function isPhaseOneComplete(progress) {
    if (!progress) return false;
    return progress.realmMilestone >= 6 &&
      progress.alchemyMilestone >= 2 &&
      progress.storyStep >= 4 &&
      progress.fenjueLearned === true &&
      progress.recipesPrepared === true;
  }

  return Object.freeze({
    OFFLINE_LIMIT_SECONDS,
    REALM_RESET_REQUIREMENT,
    realmUpgradeCosts: Object.freeze(realmUpgradeCosts),
    realmMilestoneRequirements: Object.freeze(realmMilestoneRequirements),
    realmUpgradeRetentionMilestones: Object.freeze(realmUpgradeRetentionMilestones),
    techniqueUpgradeCosts: Object.freeze(techniqueUpgradeCosts),
    alchemyRecipeCosts: Object.freeze(alchemyRecipeCosts),
    alchemyChallengeGoals: Object.freeze(alchemyChallengeGoals),
    clampOfflineSeconds,
    getRetainedRealmUpgrades,
    simulateOpening,
    simulateFirstRun,
    applyAlchemyResetSnapshot,
    isPhaseOneComplete
  });
});
