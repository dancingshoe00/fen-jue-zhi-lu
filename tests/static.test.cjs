const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("the game has no external runtime dependencies", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.doesNotMatch(index, /https?:\/\//i);
  assert.match(index, /vendor\/vue\.min\.js/);
});

test("the save id, version and offline cap are stable", () => {
  const mod = fs.readFileSync(path.join(root, "js", "mod.js"), "utf8");
  assert.match(mod, /id:\s*["']doupo-fenjue-road["']/);
  assert.match(mod, /num:\s*["']0\.1\.0["']/);
  assert.match(mod, /offlineLimit:\s*8/);
});

test("the working copy keeps required third-party notices", () => {
  for (const file of ["LICENSE", "Prestige-tree-license", "THIRD_PARTY_NOTICES.md", "FAN_NOTICE.md"]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} must exist`);
  }
});

test("offline ticks generate resources without running automatic actions", () => {
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  assert.match(game, /function gameLoop\(diff, automaticActions = true\)/);
  assert.match(game, /if \(automaticActions\) \{/);
  assert.match(game, /gameLoop\(offlineDiff, false\)/);
});

test("tree drawing tolerates layers that are still initializing", () => {
  const canvas = fs.readFileSync(path.join(root, "js", "technical", "canvas.js"), "utf8");

  assert.match(canvas, /if \(!tmp\[layer\]\) continue/);
});

test("the realm automation toggle controls both resetting and upgrade buying", () => {
  const realm = fs.readFileSync(path.join(root, "js", "layers", "realm.js"), "utf8");
  assert.match(realm, /autoPrestige:\s*function/);
  assert.match(realm, /hasUpgrade\("technique", 14\)/);
  assert.match(realm, /autoUpgrade:\s*function/);
});

test("realm prestige clears upgrades except milestone-protected rows", () => {
  const realm = fs.readFileSync(path.join(root, "js", "layers", "realm.js"), "utf8");

  assert.match(realm, /resettingLayer === this\.layer/);
  assert.match(realm, /getRetainedRealmUpgrades/);
  assert.match(realm, /layers\[resettingLayer\]\.row > this\.row/);
});

test("realm upgrades and milestones use separate tabs", () => {
  const realm = fs.readFileSync(path.join(root, "js", "layers", "realm.js"), "utf8");
  const tabFormat = realm.slice(realm.indexOf("tabFormat:"));
  const upgradesTabStart = tabFormat.indexOf('"境界升级"');
  const milestonesTabStart = tabFormat.indexOf('"修炼里程碑"');
  const upgradesTab = tabFormat.slice(upgradesTabStart, milestonesTabStart);
  const milestonesTab = tabFormat.slice(milestonesTabStart);

  assert.match(tabFormat, /^tabFormat:\s*\{/);
  assert.ok(upgradesTabStart >= 0 && upgradesTabStart < milestonesTabStart);
  assert.match(upgradesTab, /"upgrades"/);
  assert.doesNotMatch(upgradesTab, /"milestones"/);
  assert.match(milestonesTab, /"milestones"/);
  assert.doesNotMatch(milestonesTab, /"upgrades"/);
});

test("realm panels avoid duplicate resource summaries", () => {
  const realm = fs.readFileSync(path.join(root, "js", "layers", "realm.js"), "utf8");
  const tabFormat = realm.slice(realm.indexOf("tabFormat:"));
  const milestonesTab = tabFormat.slice(tabFormat.indexOf('"修炼里程碑"'));

  assert.match(realm, /showBest:\s*false/);
  assert.match(realm, /showTotal:\s*false/);
  assert.doesNotMatch(tabFormat, /"resource-display"/);
  assert.doesNotMatch(milestonesTab, /"main-display"/);
  assert.doesNotMatch(milestonesTab, /"prestige-button"/);
  assert.match(milestonesTab, /累计修为：/);
  assert.match(milestonesTab, /player\.realm\.total/);
});

test("player-facing runtime copy is fully localized", () => {
  const runtimeFiles = [
    path.join("js", "components.js"),
    path.join("js", "game.js"),
    path.join("js", "utils.js"),
    path.join("js", "utils", "save.js"),
    path.join("js", "technical", "displays.js"),
    path.join("js", "technical", "systemComponents.js")
  ];
  const runtime = runtimeFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
  const englishPhrases = [
    "Reach ", " to unlock", "I am a button", "Offline Time", "Dev Speed",
    "Goal:", "Reward:", "Currently:", "Disable respec confirmation", "Blah",
    "Sell One", "Sell All", "Click me!", "Milestone Gotten!", "Achievement Gotten!",
    "Challenge Complete", "Paste your save here", "This save appears", "Invalid value found",
    "You need prestige button text", "Congratulations!", "Are you sure"
  ];

  for (const phrase of englishPhrases) {
    assert.doesNotMatch(runtime, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("destructive controls are separated from primary progression", () => {
  const technique = fs.readFileSync(path.join(root, "js", "layers", "technique.js"), "utf8");
  const realm = fs.readFileSync(path.join(root, "js", "layers", "realm.js"), "utf8");
  const alchemy = fs.readFileSync(path.join(root, "js", "layers", "alchemy.js"), "utf8");
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const save = fs.readFileSync(path.join(root, "js", "utils", "save.js"), "utf8");
  const systemComponents = fs.readFileSync(path.join(root, "js", "technical", "systemComponents.js"), "utf8");
  const tabFormat = technique.slice(technique.indexOf("tabFormat:"));
  const respecTabStart = tabFormat.indexOf('"散功重修"');
  const practiceTab = tabFormat.slice(0, respecTabStart);
  const respecTab = tabFormat.slice(respecTabStart);

  assert.match(tabFormat, /^tabFormat:\s*\{/);
  assert.match(practiceTab, /\["clickable",\s*11/);
  assert.match(practiceTab, /\["clickable",\s*12/);
  assert.doesNotMatch(practiceTab, /\["clickable",\s*21/);
  assert.match(respecTab, /\["clickable",\s*21/);
  assert.match(respecTab, /不可撤销/);
  assert.match(realm, /resetDescription:\s*"凝练斗气/);
  assert.match(technique, /resetDescription:\s*"参悟功法/);
  assert.match(alchemy, /resetDescription:\s*"总结炼药（会重置低层）/);
  assert.match(systemComponents, /class="opt dangerOpt"[^>]*onclick="hardReset\(\)"/);
  assert.match(game, /开始试炼会重置当前层及低层临时进度/);
  assert.match(save, /导入后将覆盖当前存档/);
});

test("upgrade buttons expose clear purchase states", () => {
  const theme = fs.readFileSync(path.join(root, "css", "doupo-theme.css"), "utf8");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(theme, /\.upg\[id\^="upgrade-"\]\.can:not\(\.bought\)::after[\s\S]*content:\s*"可修炼"/);
  assert.match(theme, /\.upg\[id\^="upgrade-"\]\.locked:not\(\.bought\)::after[\s\S]*content:\s*"资源不足"/);
  assert.match(theme, /\.upg\[id\^="upgrade-"\]\.bought::after[\s\S]*content:\s*"已掌握"/);
  assert.match(theme, /\.upg\[id\^="upgrade-"\]\s*\{[\s\S]*padding:\s*38px/);
  assert.match(theme, /\.upg\.can:hover\s*\{[\s\S]*transform:\s*none/);
  assert.match(index, /css\/doupo-theme\.css\?v=[^"']+/);
  assert.doesNotMatch(theme, /@keyframes\s+upgrade-acquired/);
  assert.doesNotMatch(theme, /\.upg\.bought\s*\{[\s\S]*animation:/);
});

test("side story nodes center their symbols", () => {
  const theme = fs.readFileSync(path.join(root, "css", "doupo-theme.css"), "utf8");

  assert.match(theme, /\.sideLayers \.treeNode\s*\{[\s\S]*display:\s*inline-flex/);
  assert.match(theme, /\.sideLayers \.treeNode\s*\{[\s\S]*align-items:\s*center/);
  assert.match(theme, /\.sideLayers \.treeNode\s*\{[\s\S]*justify-content:\s*center/);
});

test("custom mod files are parser loaded in their declared order", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scriptSources = [
    "js/balance.js",
    "js/content.js",
    "js/layers/realm.js",
    "js/layers/technique.js",
    "js/layers/alchemy.js",
    "js/layers/story.js",
    "js/tree.js"
  ];
  let previousIndex = -1;

  for (const source of scriptSources) {
    const sourceIndex = index.indexOf(`src="${source}`);
    assert.ok(sourceIndex > previousIndex, `${source} must load after the previous mod file`);
    previousIndex = sourceIndex;
  }
  assert.doesNotMatch(index, /src="js\/technical\/loader\.js"/);
});

test("content data only uses require inside Node", () => {
  const content = fs.readFileSync(path.join(root, "js", "content.js"), "utf8");

  assert.match(content, /typeof require === ["']function["']/);
  assert.doesNotMatch(content, /DOUPO_BALANCE\s*\|\|\s*require/);
});
