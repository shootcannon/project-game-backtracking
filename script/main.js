import GameMap from './map.js';
import { Player } from './entity.js';
import { renderHUD, renderMinimap, renderStory, renderWin, renderPauseScreen, renderDeathScreen, renderMapSelectionScreen, renderSkillBar, renderSkillCollection, ParticleSystem } from './ui.js';
import { TILE_SIZE, COLORS, TARGET_FPS, SKILLS } from './constants.js';
import { TILE_FIRE, TILE_ARROW_TRAP } from './map.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const MAP_W = 31, MAP_H = 31;
let map = new GameMap(MAP_W, MAP_H);
let player = new Player(map.startX, map.startY);
const particles = new ParticleSystem();
let messageLog = ["--- LABIRIN DIMULAI ---", "Kumpulkan 4 skill dulu sebelum buka gerbang!"];

const MAP_CONFIGS = [
    { name: "Labirin Pemula", width: 21, height: 21, obstacleDensity: 0.02, description: "Labirin kecil, sedikit jebakan." },
    { name: "Labirin Klasik", width: 31, height: 31, obstacleDensity: 0.05, description: "Ukuran standar, jebakan moderat." },
    { name: "Labirin Sulit", width: 41, height: 41, obstacleDensity: 0.08, description: "Lebih besar, banyak jebakan!" },
    { name: "Labirin Ekstrem", width: 51, height: 51, obstacleDensity: 0.10, description: "Sangat besar, jebakan di mana-mana!" },
    { name: "Labirin Tanpa Jebakan", width: 31, height: 31, obstacleDensity: 0, description: "Fokus pada navigasi, tanpa jebakan." }
];
let currentMapSelectionIndex = 0;

let statusText = 'Mengumpulkan skill...';

// --- AI PATH PLANNING ---
function planNextPath() {
    const cs = player.collectedSkills;
    const totalSkills = map.skillPickups.length;
    const allSkills = cs.size >= totalSkills;

    // Priority 1: collect remaining skill gems
    const uncollected = map.skillPickups.filter(sp => !sp.collected);
    if (uncollected.length > 0) {
        let bestPath = null, bestSp = null, bestLen = Infinity;
        for (const sp of uncollected) {
            let p = map.findPath(player.tileX, player.tileY, sp.x, sp.y, true, true, cs);
            if (!p || p.length <= 1) p = map.findPath(player.tileX, player.tileY, sp.x, sp.y, true, false, cs);
            if (p && p.length > 1 && p.length < bestLen) {
                bestLen = p.length; bestPath = p; bestSp = sp;
            }
        }
        if (bestPath) {
            statusText = `Ambil SKILL ${bestSp.skillId.toUpperCase()}... (${uncollected.length} tersisa)`;
            player.setPath(bestPath);
            return;
        }
    }

    // Priority 2: get key
    if (!map.keyTaken) {
        let p = map.findPath(player.tileX, player.tileY, map.keyX, map.keyY, true, true, cs);
        if (!p || p.length <= 1) p = map.findPath(player.tileX, player.tileY, map.keyX, map.keyY, true, false, cs);
        if (p && p.length > 1) {
            statusText = 'Mencari kunci...';
            player.setPath(p);
            return;
        }
    }

    // Priority 3: open gate (requires all skills + key)
    if (map.keyTaken && !map.gateOpen) {
        if (!allSkills) {
            // Still need skills — replanning will re-enter priority 1
            const needed = totalSkills - cs.size;
            statusText = `Butuh ${needed} skill lagi untuk buka gerbang!`;
            return;
        }
        let p = map.findPath(player.tileX, player.tileY, map.gateX, map.gateY, false, true, cs);
        if (!p || p.length <= 1) p = map.findPath(player.tileX, player.tileY, map.gateX, map.gateY, false, false, cs);
        if (p && p.length > 1) {
            statusText = 'Menuju gerbang...';
            player.setPath(p);
            return;
        }
    }

    // Priority 4: exit
    let p = map.findPath(player.tileX, player.tileY, map.exitX, map.exitY, true, true, cs);
    if (!p || p.length <= 1) p = map.findPath(player.tileX, player.tileY, map.exitX, map.exitY, true, false, cs);
    if (p && p.length > 1) {
        statusText = 'Menuju keluar...';
        player.setPath(p);
    }
}

// --- AI AUTO-SKILL ACTIVATION ---
function autoActivateSkills() {
    if (gameState !== 'PLAYING' || !player.path || player.pathIndex >= player.path.length) return;

    for (let i = player.pathIndex; i < Math.min(player.pathIndex + 3, player.path.length); i++) {
        const [tx, ty] = player.path[i];
        const tile = map.data[ty]?.[tx];
        if (tile === undefined) continue;

        if (tile === TILE_FIRE) {
            if (player.hasSkill('jump') && player.cooldowns.jump <= 0) {
                player.activeSkills.jump = SKILLS.JUMP.duration;
                player.cooldowns.jump = SKILLS.JUMP.cd;
                particles.addText("AUTO JUMP!", player.px + 32, player.py, '#2ecc71');
                break;
            }
            if (player.hasSkill('shield') && player.cooldowns.shield <= 0) {
                player.activeSkills.shield = SKILLS.SHIELD.duration;
                player.cooldowns.shield = SKILLS.SHIELD.cd;
                particles.addText("AUTO SHIELD!", player.px + 32, player.py, '#f1c40f');
                break;
            }
            if (player.hasSkill('dash') && player.cooldowns.dash <= 0) {
                player.activeSkills.dash = SKILLS.DASH.duration;
                player.cooldowns.dash = SKILLS.DASH.cd;
                particles.addText("AUTO DASH!", player.px + 32, player.py, '#3498db');
                break;
            }
        }

        if (tile === TILE_ARROW_TRAP) {
            if (player.hasSkill('dash') && player.cooldowns.dash <= 0) {
                player.activeSkills.dash = SKILLS.DASH.duration;
                player.cooldowns.dash = SKILLS.DASH.cd;
                particles.addText("AUTO DASH!", player.px + 32, player.py, '#3498db');
                break;
            }
            if (player.hasSkill('shield') && player.cooldowns.shield <= 0) {
                player.activeSkills.shield = SKILLS.SHIELD.duration;
                player.cooldowns.shield = SKILLS.SHIELD.cd;
                particles.addText("AUTO SHIELD!", player.px + 32, player.py, '#f1c40f');
                break;
            }
            if (player.hasSkill('jump') && player.cooldowns.jump <= 0) {
                player.activeSkills.jump = SKILLS.JUMP.duration;
                player.cooldowns.jump = SKILLS.JUMP.cd;
                particles.addText("AUTO JUMP!", player.px + 32, player.py, '#2ecc71');
                break;
            }
        }
    }
}

let camX = player.px - canvas.width / 2;
let camY = player.py - canvas.height / 2;

let gameState = 'MAP_SELECT';
const storyLines = [
    "Labirin kuno ini menelan banyak penjelajah...",
    "Aku akan berjalan sendiri — kakiku tahu jalannya.",
    "Tapi gerbang besi di tengah menutup jalan keluar.",
    "Cari 4 skill dulu, baru bisa buka gerbang!",
    "Mulai!"
];
let currentStoryIndex = 0;
let storyCharIndex = 0;
let spacePressed = false;

const keys = {};

function createNewGame(mapConfig) {
    map = new GameMap(mapConfig.width, mapConfig.height, mapConfig.obstacleDensity);
    player = new Player(map.startX, map.startY);
    messageLog = ["--- LABIRIN DIMULAI ---", `Kumpulkan ${map.skillPickups.length} skill untuk buka gerbang!`];
    statusText = 'Mengumpulkan skill...';
    planNextPath();
    camX = player.px - canvas.width / 2;
    camY = player.py - canvas.height / 2;
    currentStoryIndex = 0;
    storyCharIndex = 0;
    spacePressed = false;
}

function resetGame() {
    createNewGame(MAP_CONFIGS[currentMapSelectionIndex]);
}

function onTileEntered(tx, ty) {
    if (map.isLethal(tx, ty) && !player.isInvulnerable()) {
        gameState = 'DEAD';
        messageLog.push("Arthur terkena jebakan!");
        particles.addText("MATI!", player.px + TILE_SIZE / 2, player.py, '#e74c3c');
        return;
    }

    // Skill pickup
    const skillId = map.pickupSkill(tx, ty);
    if (skillId) {
        player.collectSkill(skillId);
        const SKILL_COLORS = { jump: '#2ecc71', dash: '#3498db', shield: '#f1c40f', blink: '#9b59b6' };
        const remaining = map.skillPickups.filter(s => !s.collected).length;
        messageLog.push(`Skill ${skillId.toUpperCase()} didapat! (${remaining} tersisa)`);
        particles.addText(`${skillId.toUpperCase()}!`, player.px + TILE_SIZE / 2, player.py - 20, SKILL_COLORS[skillId] || '#fff');
        planNextPath();
        return;
    }

    if (map.pickUpKey(tx, ty)) {
        messageLog.push("Kunci didapat! Kembali ke gerbang.");
        particles.addText("KUNCI!", player.px + TILE_SIZE / 2, player.py, '#f1c40f');
        planNextPath();
    } else if (tx === map.gateX && ty === map.gateY && map.keyTaken && !map.gateOpen) {
        const allReady = player.collectedSkills.size >= map.skillPickups.length;
        if (map.tryOpenGate(tx, ty, allReady)) {
            messageLog.push("Gerbang terbuka!");
            particles.addText("TERBUKA!", player.px + TILE_SIZE / 2, player.py, '#2ecc71');
            planNextPath();
        } else {
            const needed = map.skillPickups.length - player.collectedSkills.size;
            messageLog.push(`Gerbang butuh ${needed} skill lagi!`);
            statusText = `Skill kurang ${needed}!`;
            planNextPath();
        }
    } else if (map.isExit(tx, ty)) {
        if (gameState === 'PLAYING') {
            gameState = 'WIN';
            winTimer = 0;
            messageLog.push("Sampai di EXIT!");
        }
    }
}

function handleKeyDown(key) {
    keys[key.toLowerCase()] = true;
    if (key === 'Escape') {
        if (gameState === 'PLAYING') gameState = 'PAUSED';
        else if (gameState === 'PAUSED') gameState = 'PLAYING';
    }
    if (gameState === 'MAP_SELECT') {
        if (key === 'ArrowLeft' || key === 'ArrowUp') {
            currentMapSelectionIndex = Math.max(0, currentMapSelectionIndex - 1);
        } else if (key === 'ArrowRight' || key === 'ArrowDown') {
            currentMapSelectionIndex = Math.min(MAP_CONFIGS.length - 1, currentMapSelectionIndex + 1);
        } else if (key === 'Enter' || key === ' ') {
            if (!spacePressed) {
                spacePressed = true;
                createNewGame(MAP_CONFIGS[currentMapSelectionIndex]);
                gameState = 'STORY';
            }
        }
        return;
    }
    if (gameState === 'DEAD' && key.toLowerCase() === 'r') {
        resetGame();
        gameState = 'MAP_SELECT';
        return;
    }

    // Manual skill override (only if collected)
    if (gameState === 'PLAYING') {
        if (key === '1' && player.hasSkill('jump') && player.cooldowns.jump <= 0) {
            player.activeSkills.jump = SKILLS.JUMP.duration;
            player.cooldowns.jump = SKILLS.JUMP.cd;
            particles.addText("JUMP!", player.px + 32, player.py, '#2ecc71');
        }
        if (key === '2' && player.hasSkill('dash') && player.cooldowns.dash <= 0) {
            player.activeSkills.dash = SKILLS.DASH.duration;
            player.cooldowns.dash = SKILLS.DASH.cd;
            particles.addText("DASH!", player.px + 32, player.py, '#3498db');
        }
        if (key === '3' && player.hasSkill('shield') && player.cooldowns.shield <= 0) {
            player.activeSkills.shield = SKILLS.SHIELD.duration;
            player.cooldowns.shield = SKILLS.SHIELD.cd;
            particles.addText("SHIELD!", player.px + 32, player.py, '#f1c40f');
        }
        if (key === '4' && player.hasSkill('blink') && player.cooldowns.blink <= 0) {
            const targetIdx = Math.min(player.pathIndex + 2, player.path.length - 1);
            if (player.path[targetIdx]) {
                const [tx, ty] = player.path[targetIdx];
                player.px = tx * TILE_SIZE;
                player.py = ty * TILE_SIZE;
                player.tileX = tx;
                player.tileY = ty;
                player.pathIndex = targetIdx;
                player.cooldowns.blink = SKILLS.BLINK.cd;
                particles.addText("BLINK!", player.px + 32, player.py, '#9b59b6');
            }
        }
        if (key === '5' && player.cooldowns.slow <= 0) {
            player.activeSkills.slow = SKILLS.SLOW.duration;
            player.cooldowns.slow = SKILLS.SLOW.cd;
            particles.addText("SLOW!", player.px + 32, player.py, '#2ecc71');
        }
    }

    if (key === ' ' || key === 'Space') {
        if (gameState === 'STORY' && !spacePressed) {
            spacePressed = true;
            const line = storyLines[currentStoryIndex];
            if (storyCharIndex < line.length) storyCharIndex = line.length;
            else {
                currentStoryIndex++; storyCharIndex = 0;
                if (currentStoryIndex >= storyLines.length) {
                    gameState = 'PLAYING';
                    planNextPath();
                }
            }
        }
    }
    if ((gameState === 'WIN' || gameState === 'PAUSED') && key.toLowerCase() === 'r') {
        resetGame();
        gameState = 'MAP_SELECT';
    }
}

function handleKeyUp(key) {
    keys[key.toLowerCase()] = false;
    if (key === ' ' || key === 'Space' || key === 'Enter') spacePressed = false;
}

window.addEventListener('keydown', (e) => handleKeyDown(e.key));
window.addEventListener('keyup', (e) => handleKeyUp(e.key));
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let lastTime = performance.now();
let storyTimer = 0;
const FRAME_TARGET_MS = 1000 / TARGET_FPS;
let fpsFrames = 0;
let fpsLastUpdate = performance.now();
let fpsCurrent = 0;
let winTimer = 0;
let deathTimer = 0;

function update(dt) {
    if (gameState !== 'PLAYING') return;

    const effectiveDt = player.activeSkills.slow > 0 ? dt * 0.4 : dt;

    autoActivateSkills();

    const prevTileX = player.tileX, prevTileY = player.tileY;
    player.update(effectiveDt);
    if (player.tileX !== prevTileX || player.tileY !== prevTileY) {
        onTileEntered(player.tileX, player.tileY);
    }

    if (player.pathIndex >= player.path.length && gameState === 'PLAYING') {
        if (!map.isExit(player.tileX, player.tileY)) {
            planNextPath();
        }
    }
}

function gameLoop() {
    const time = performance.now();
    let dt = time - lastTime; lastTime = time;
    if (dt > 100) dt = 100;

    fpsFrames++;
    if (time - fpsLastUpdate >= 500) {
        fpsCurrent = Math.round((fpsFrames * 1000) / (time - fpsLastUpdate));
        fpsFrames = 0;
        fpsLastUpdate = time;
    }

    if (gameState === 'PLAYING') {
        update(dt);
    } else if (gameState === 'STORY') {
        storyTimer += dt;
        if (storyTimer > 40) {
            if (storyCharIndex < storyLines[currentStoryIndex].length) storyCharIndex++;
            storyTimer = 0;
        }
    } else if (gameState === 'WIN') {
        winTimer += dt;
    } else if (gameState === 'DEAD') {
        deathTimer += dt;
    }

    camX += (player.px - canvas.width / 2 - camX) * 0.1;
    camY += (player.py - canvas.height / 2 - camY) * 0.1;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-Math.floor(camX), -Math.floor(camY));
    map.draw(ctx, camX, camY, canvas.width, canvas.height, time);
    player.draw(ctx, time);
    particles.updateAndDraw(ctx, dt);

    ctx.globalCompositeOperation = 'multiply';
    const grad = ctx.createRadialGradient(
        player.px + TILE_SIZE / 2, player.py + TILE_SIZE / 2, 60,
        player.px + TILE_SIZE / 2, player.py + TILE_SIZE / 2, 420
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = grad;
    ctx.fillRect(camX, camY, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    if (gameState === 'STORY') {
        const typedText = storyLines[currentStoryIndex].substring(0, storyCharIndex);
        renderStory(ctx, canvas.width, canvas.height, typedText, time);
    } else if (gameState === 'WIN') {
        const alpha = Math.min(1, winTimer / 1000);
        renderWin(ctx, canvas.width, canvas.height, alpha);
    } else if (gameState === 'DEAD') {
        renderDeathScreen(ctx, canvas.width, canvas.height);
    } else if (gameState === 'MAP_SELECT') {
        renderMapSelectionScreen(ctx, canvas.width, canvas.height, MAP_CONFIGS, currentMapSelectionIndex);
    } else {
        renderHUD(ctx, player, map, canvas.width, canvas.height, messageLog, statusText);
        renderMinimap(ctx, map, player, canvas.width, canvas.height);
        renderSkillCollection(ctx, player, canvas.width, canvas.height, map.skillPickups.length);
        renderSkillBar(ctx, player, canvas.width, canvas.height);
        if (gameState === 'PAUSED') renderPauseScreen(ctx, canvas.width, canvas.height);
    }

    ctx.font = '18px "VT323", monospace';
    const fpsLabel = `FPS: ${fpsCurrent} / target ${TARGET_FPS}`;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(canvas.width - 170, 8, 160, 24);
    ctx.fillStyle = fpsCurrent >= TARGET_FPS * 0.9 ? '#2ecc71'
                   : fpsCurrent >= TARGET_FPS * 0.6 ? '#f1c40f' : '#e74c3c';
    ctx.fillText(fpsLabel, canvas.width - 162, 26);

    const elapsed = performance.now() - time;
    const delay = Math.max(0, FRAME_TARGET_MS - elapsed);
    setTimeout(gameLoop, delay);
}

gameLoop();
