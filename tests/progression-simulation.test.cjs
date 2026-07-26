const test = require("node:test");
const assert = require("node:assert/strict");

const balance = require("../js/balance.js");

const REALM_IDS = [11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34];
const TECHNIQUE_IDS = [21, 22, 23, 24];
const TECHNIQUE_COSTS = new Map(TECHNIQUE_IDS.map((id, index) => [id, balance.techniqueUpgradeCosts[index + 4]]));

function simulateActiveFirstRun(maxSeconds = 4 * 60 * 60) {
  const step = 0.1;
  const state = {
    time: 0,
    base: 0,
    realmPoints: 0,
    realmTotal: 0,
    realmUpgrades: new Set(),
    realmMilestones: new Set(),
    techniquePoints: 0,
    techniqueUpgrades: new Set(),
    alchemyPoints: 0,
    alchemyTotal: 0,
    recipes: [0, 0, 0],
    challenges: new Set(),
    activeChallenge: 0
  };
  const checkpoints = { firstPurchase: null, firstReset: null, completion: null };
  const invalidValues = [];

  const hasRealmUpgrade = (id) => state.realmUpgrades.has(id);
  const hasRealmMilestone = (id) => state.realmMilestones.has(id);
  const hasTechniqueUpgrade = (id) => state.techniqueUpgrades.has(id);

  function updateMilestones() {
    balance.realmMilestoneRequirements.forEach((requirement, id) => {
      if (state.realmTotal >= requirement) state.realmMilestones.add(id);
    });
  }

  function pointGain() {
    let gain = 1;
    if (hasRealmUpgrade(11)) gain *= 2;
    if (hasRealmUpgrade(12)) gain *= 2;
    if (hasRealmUpgrade(13)) gain *= 3;
    if (hasRealmUpgrade(14)) gain *= 2;
    if (hasRealmUpgrade(22)) gain *= Math.pow(state.realmPoints + 1, 0.35);
    if (hasRealmUpgrade(31)) gain *= Math.pow(state.realmTotal + 1, 0.18);
    if (hasRealmUpgrade(33)) gain *= 5;
    if (hasRealmUpgrade(34)) gain *= 10;
    if (hasRealmMilestone(0)) gain *= 1.5;
    if (hasRealmMilestone(3)) gain *= 2;
    if (state.recipes[0]) gain *= 2;
    if (state.challenges.has(11)) gain *= 3;
    if (state.challenges.has(13)) gain *= 2;
    if (state.activeChallenge === 11 || state.activeChallenge === 13) gain = Math.sqrt(gain);
    return gain;
  }

  function realmGain() {
    if (state.base < balance.REALM_RESET_REQUIREMENT) return 0;
    let multiplier = 1;
    if (hasRealmUpgrade(14)) multiplier *= 1.5;
    if (hasRealmUpgrade(21)) multiplier *= 2;
    if (hasRealmUpgrade(24)) multiplier *= 3;
    if (hasRealmUpgrade(32)) multiplier *= Math.pow(state.techniquePoints + 1, 0.65);
    if (hasRealmMilestone(4)) multiplier *= 2;
    if (hasTechniqueUpgrade(21)) multiplier *= 2;
    if (hasTechniqueUpgrade(22)) multiplier *= 3;
    if (hasTechniqueUpgrade(23)) multiplier *= Math.pow(state.techniquePoints + 1, 0.8);
    if (state.recipes[1]) multiplier *= 1.75;
    if (state.challenges.has(12)) multiplier *= 3;
    if (state.challenges.has(13)) multiplier *= 2;
    if (state.activeChallenge === 12 || state.activeChallenge === 13) multiplier /= 10;
    const exponent = hasTechniqueUpgrade(24) ? 1.08 : 1;
    return Math.floor(Math.pow(Math.sqrt(state.base / balance.REALM_RESET_REQUIREMENT) * multiplier, exponent));
  }

  function buyNextRealmUpgrade() {
    for (let index = 0; index < REALM_IDS.length; index += 1) {
      const id = REALM_IDS[index];
      if (state.realmUpgrades.has(id)) continue;
      if (index > 0 && !state.realmUpgrades.has(REALM_IDS[index - 1])) return;
      const usesBase = index < 2;
      const balanceAvailable = usesBase ? state.base : state.realmPoints;
      const cost = balance.realmUpgradeCosts[index];
      if (balanceAvailable >= cost) {
        if (usesBase) state.base -= cost;
        else state.realmPoints -= cost;
        state.realmUpgrades.add(id);
        if (checkpoints.firstPurchase === null) checkpoints.firstPurchase = state.time;
      }
      return;
    }
  }

  function trainTechnique() {
    if (!hasRealmMilestone(1)) return;
    const missing = TECHNIQUE_IDS.find((id) => !hasTechniqueUpgrade(id));
    if (!missing || (missing === 24 && !hasRealmMilestone(6))) return;
    const upgradeCost = TECHNIQUE_COSTS.get(missing);
    if (state.techniquePoints >= upgradeCost) {
      state.techniquePoints -= upgradeCost;
      state.techniqueUpgrades.add(missing);
      return;
    }
    const nextPointCost = Math.ceil(10 * Math.pow(2.5, Math.pow(state.techniquePoints, 1.15)));
    if (state.realmPoints >= nextPointCost) {
      state.realmPoints -= nextPointCost;
      state.techniquePoints += 1;
    }
  }

  function resetRealm() {
    const gain = realmGain();
    if (gain < 1) return;
    state.realmPoints += gain;
    state.realmTotal += gain;
    state.base = 0;
    if (checkpoints.firstReset === null) checkpoints.firstReset = state.time;
    updateMilestones();
    state.realmUpgrades = new Set(balance.getRetainedRealmUpgrades(
      Array.from(state.realmUpgrades),
      Array.from(state.realmMilestones)
    ));
  }

  function resetLowerLayers() {
    state.base = 0;
    state.realmPoints = 0;
    state.realmTotal = 0;
    state.realmUpgrades = new Set();
    state.techniquePoints = 0;
    state.techniqueUpgrades = new Set();
  }

  function prepareRecipes() {
    for (let index = 0; index < state.recipes.length; index += 1) {
      if (!state.recipes[index] && state.alchemyPoints >= balance.alchemyRecipeCosts[index]) {
        state.alchemyPoints -= balance.alchemyRecipeCosts[index];
        state.recipes[index] = 1;
      }
    }
  }

  function nextRecipeDeficit() {
    for (let index = 0; index < state.recipes.length; index += 1) {
      if (!state.recipes[index]) return Math.max(0, balance.alchemyRecipeCosts[index] - state.alchemyPoints);
    }
    return 0;
  }

  function resetAlchemy() {
    const gain = Math.floor(Math.sqrt(state.realmTotal / 180));
    state.alchemyPoints += gain;
    state.alchemyTotal += gain;
    resetLowerLayers();
    prepareRecipes();
  }

  function advanceChallenges() {
    if (!state.recipes.every(Boolean)) return;
    const [fireGoal, soulGoal, combinedGoal] = balance.alchemyChallengeGoals;
    if (!state.challenges.has(11)) {
      if (state.activeChallenge !== 11) {
        state.activeChallenge = 11;
        resetLowerLayers();
      } else if (state.base >= fireGoal) {
        state.challenges.add(11);
        state.activeChallenge = 0;
        resetLowerLayers();
      }
      return;
    }
    if (!state.challenges.has(12)) {
      if (state.activeChallenge !== 12) {
        state.activeChallenge = 12;
        resetLowerLayers();
      } else if (state.realmPoints >= soulGoal) {
        state.challenges.add(12);
        state.activeChallenge = 0;
        resetLowerLayers();
      }
      return;
    }
    if (!state.challenges.has(13)) {
      if (state.activeChallenge !== 13) {
        state.activeChallenge = 13;
        resetLowerLayers();
      } else if (state.base >= combinedGoal && state.realmPoints >= 10) {
        state.challenges.add(13);
        state.activeChallenge = 0;
        resetLowerLayers();
      }
    }
  }

  for (let tick = 0; tick < maxSeconds / step; tick += 1) {
    state.time += step;
    state.base += pointGain() * step;
    buyNextRealmUpgrade();
    trainTechnique();
    updateMilestones();

    if (!state.recipes.every(Boolean) && hasRealmMilestone(6) && hasTechniqueUpgrade(24)) {
      const deficit = nextRecipeDeficit();
      const gain = Math.floor(Math.sqrt(state.realmTotal / 180));
      if (deficit > 0 && gain >= deficit) {
        resetAlchemy();
        continue;
      }
    }

    advanceChallenges();
    const lowerLayersBuilt = REALM_IDS.every(hasRealmUpgrade) && hasTechniqueUpgrade(24);
    const shouldResetRealm = state.activeChallenge === 12 ||
      ((state.activeChallenge === 11 || state.activeChallenge === 13)
        ? !lowerLayersBuilt || (state.activeChallenge === 13 && state.realmPoints < 10)
        : true);
    if (shouldResetRealm) resetRealm();

    const complete = state.challenges.size === 3 &&
      state.recipes.every(Boolean) &&
      hasRealmMilestone(6) &&
      hasTechniqueUpgrade(24);
    if (complete) {
      checkpoints.completion = state.time;
      break;
    }

    for (const [name, value] of Object.entries({ base: state.base, realmPoints: state.realmPoints, realmTotal: state.realmTotal })) {
      if (!Number.isFinite(value) || value < 0) invalidValues.push({ name, value, time: state.time });
    }
  }

  return { checkpoints, invalidValues, state };
}

test("an active first run reaches the phase ending in two to four hours", () => {
  const result = simulateActiveFirstRun();
  assert.deepEqual(result.invalidValues, []);
  assert.ok(result.checkpoints.completion !== null, "the simulated run did not complete");
  assert.ok(result.checkpoints.completion >= 2 * 60 * 60);
  assert.ok(result.checkpoints.completion <= 4 * 60 * 60);
  assert.equal(result.state.recipes.every(Boolean), true);
  assert.equal(result.state.challenges.size, 3);
  assert.equal(result.state.techniqueUpgrades.has(24), true);
});
