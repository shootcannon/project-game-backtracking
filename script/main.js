import GameMap from './map.js';
import { Player } from './entity.js';
import { renderHUD, renderMinimap, renderStory, renderWin, renderPauseScreen, renderDeathScreen, renderMapSelectionScreen, renderSkillBar, renderSkillCollection, ParticleSystem, formatRunTime } from './ui.js';
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
let messageLog = ["--- LABIRIN DIMULAI ---", "3 skill siap — cari kunci lalu keluar!"];
const MAP_CONFIGS = [
    { name: "Easy Maze", width: 17, height: 17, obstacleDensity: 0.04, description: "Map kecil, rintangan jarang." },
    { name: "Medium Maze", width: 27, height: 27, obstacleDensity: 0.07, description: "Tantangan mulai terasa." },
    { name: "Hard Maze", width: 37, height: 37, obstacleDensity: 0.12, description: "Banyak ranjau dan area panah!" }
];
let currentMapSelectionIndex = 0;
let currentMapConfig = MAP_CONFIGS[0];

let statusText = 'AI mencari jalan keluar...';
let runElapsedMs = 0;
let finalRunTimeMs = null;

function isHardMap() {
    return (currentMapConfig?.obstacleDensity ?? 0) >= 0.1;
}

function findSafePath(sx, sy, ex, ey, gateBlocks) {
    return map.findPath(sx, sy, ex, ey, gateBlocks, true)
        || map.findPath(sx, sy, ex, ey, gateBlocks, false);
}

function planNextPath() {
    const prioritas = [
        {
            label: 'Mencari jalur ke Kunci...',
            isValid: () => !map.keyTaken,
            goal: () => [map.keyX, map.keyY],
            gateBlocks: true
        },
        {
            label: 'Menuju gerbang...',
            isValid: () => map.keyTaken && !map.gateOpen,
            goal: () => [map.gateX, map.gateY],
            gateBlocks: false
        },
        {
            label: 'Menuju keluar...',
            isValid: () => true,
            goal: () => [map.exitX, map.exitY],
            gateBlocks: true
        }
    ];

    for (let i = 0; i < prioritas.length; i++) {
        const step = prioritas[i];
        if (!step.isValid()) continue;

        const [ex, ey] = step.goal();
        const p = findSafePath(player.tileX, player.tileY, ex, ey, step.gateBlocks);
        if (p && p.length > 1) {
            statusText = step.label;
            player.setPath(p);
            return;
        }
    }
}

function hazardLookahead() {
    return isHardMap() ? 12 : 7;
}

function shieldTriggerRange() {
    return isHardMap() ? 6 : 4;
}

function shieldDuration() {
    return isHardMap() ? SKILLS.SHIELD.duration * 1.25 : SKILLS.SHIELD.duration;
}

function getNextHazardOnPath() {
    if (!player.path?.length) return null;
    const end = Math.min(player.pathIndex + hazardLookahead(), player.path.length);
    for (let i = player.pathIndex; i < end; i++) {
        const [tx, ty] = player.path[i];
        if (map.isLethal(tx, ty)) return { index: i, dist: i - player.pathIndex };
    }
    return null;
}

function findSafePathIndex(fromIndex) {
    for (let i = fromIndex; i < player.path.length; i++) {
        const [tx, ty] = player.path[i];
        if (!map.isLethal(tx, ty)) return i;
    }
    return null;
}

function activateShield(label = 'AUTO SHIELD!') {
    player.activeSkills.shield = shieldDuration();
    player.cooldowns.shield = SKILLS.SHIELD.cd;
    particles.addText(label, player.px + 32, player.py, '#f1c40f');
}

function performBlinkToIndex(targetIdx) {
    const [nx, ny] = player.path[targetIdx];
    player.px = nx * TILE_SIZE;
    player.py = ny * TILE_SIZE;
    player.tileX = nx;
    player.tileY = ny;
    player.pathIndex = targetIdx;
    player.activeSkills.blink = SKILLS.BLINK.duration;
    player.cooldowns.blink = SKILLS.BLINK.cd;
    particles.addText('AUTO BLINK!', player.px + 32, player.py, '#9b59b6');
}

function tryEmergencySkill() {
    if (player.isInvulnerable()) return true;
    if (player.cooldowns.shield <= 0) {
        activateShield('SHIELD DARURAT!');
        return true;
    }
    const safeIdx = findSafePathIndex(player.pathIndex + 1);
    if (safeIdx != null && safeIdx > player.pathIndex && player.cooldowns.blink <= 0) {
        performBlinkToIndex(safeIdx);
        return true;
    }
    if (player.cooldowns.jump <= 0) {
        player.activeSkills.jump = SKILLS.JUMP.duration;
        player.cooldowns.jump = SKILLS.JUMP.cd;
        particles.addText('JUMP DARURAT!', player.px + 32, player.py, '#2ecc71');
        return true;
    }
    return false;
}

function computeMoveSpeedMult() {
    if (player.isInvulnerable()) return 1;
    const target = player.currentTargetTile();
    if (target && map.isLethal(target[0], target[1])) {
        return isHardMap() ? 0.2 : 0.35;
    }
    const hazard = getNextHazardOnPath();
    if (!hazard) return 1;
    if (hazard.dist <= 1) return isHardMap() ? 0.25 : 0.4;
    if (hazard.dist <= 2 && player.cooldowns.shield > 0) return 0.5;
    return 1;
}

function autoActivateSkills() {
    if (gameState !== 'PLAYING' || !player.path?.length || player.pathIndex >= player.path.length) return;

    if (map.isLethal(player.tileX, player.tileY)) {
        tryEmergencySkill();
        return;
    }

    const hazard = getNextHazardOnPath();
    if (!hazard) return;

    const { index, dist } = hazard;

    if (dist <= shieldTriggerRange() && player.cooldowns.shield <= 0) {
        activateShield();
        return;
    }

    if (player.isInvulnerable()) return;

    if (dist <= 1) {
        if (player.cooldowns.shield <= 0) {
            activateShield();
            return;
        }
        const safeIdx = findSafePathIndex(player.pathIndex + 1);
        if (safeIdx != null && safeIdx > player.pathIndex && player.cooldowns.blink <= 0) {
            performBlinkToIndex(safeIdx);
            return;
        }
        if (player.cooldowns.jump <= 0) {
            player.activeSkills.jump = SKILLS.JUMP.duration;
            player.cooldowns.jump = SKILLS.JUMP.cd;
            particles.addText('AUTO JUMP!', player.px + 32, player.py, '#2ecc71');
        }
        return;
    }

    if (dist >= 2 && dist <= 8 && player.cooldowns.blink <= 0) {
        const safeIdx = findSafePathIndex(index);
        if (safeIdx != null && safeIdx > player.pathIndex + 1) {
            performBlinkToIndex(safeIdx);
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
    "3 skill siap: Jump, Blink, Shield — cari kunci lalu keluar!",
    "Mulai!"
];
let currentStoryIndex = 0;
let storyCharIndex = 0;
let spacePressed = false;

const keys = {};

function createNewGame(mapConfig) {
    currentMapConfig = mapConfig;
    map = new GameMap(mapConfig.width, mapConfig.height, mapConfig.obstacleDensity);
    player = new Player(map.startX, map.startY);
    player.speed = isHardMap() ? 130 : 180;
    messageLog = ["--- LABIRIN DIMULAI ---", "3 skill siap — cari kunci lalu keluar!"];
    statusText = 'AI mencari jalan keluar...';
    runElapsedMs = 0;
    finalRunTimeMs = null;
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
        const wasX = player.tileX, wasY = player.tileY;
        if (!tryEmergencySkill()) {
            gameState = 'DEAD';
            messageLog.push("Arthur terkena jebakan!");
            particles.addText("MATI!", player.px + TILE_SIZE / 2, player.py, '#e74c3c');
        } else if (player.tileX !== wasX || player.tileY !== wasY) {
            onTileEntered(player.tileX, player.tileY);
        }
        return;
    }

    if (map.pickUpKey(tx, ty)) {
        messageLog.push("Kunci didapat! Kembali ke gerbang.");
        particles.addText("KUNCI!", player.px + TILE_SIZE / 2, player.py, '#f1c40f');
        planNextPath();
    } else if (tx === map.gateX && ty === map.gateY && map.keyTaken && !map.gateOpen) {
        if (map.tryOpenGate(tx, ty, true)) {
            messageLog.push("Gerbang terbuka!");
            particles.addText("TERBUKA!", player.px + TILE_SIZE / 2, player.py, '#2ecc71');
            planNextPath();
        } else {
            messageLog.push(`Gerbang terkunci, butuh kunci!`);
            statusText = `Gerbang terkunci!`;
            planNextPath();
        }
    } else if (map.isExit(tx, ty)) {
        if (gameState === 'PLAYING') {
            finalRunTimeMs = runElapsedMs;
            gameState = 'WIN';
            winTimer = 0;
            messageLog.push(`Sampai di EXIT! (${formatRunTime(finalRunTimeMs)})`);
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

    if (gameState === 'PLAYING') {
        if (key === '1' && player.cooldowns.jump <= 0) {
            player.activeSkills.jump = SKILLS.JUMP.duration;
            player.cooldowns.jump = SKILLS.JUMP.cd;
            particles.addText("JUMP!", player.px + 32, player.py, '#2ecc71');
        }
        if (key === '2' && player.cooldowns.blink <= 0) {
            const safeIdx = findSafePathIndex(player.pathIndex + 1)
                ?? Math.min(player.pathIndex + 3, player.path.length - 1);
            if (player.path[safeIdx]) performBlinkToIndex(safeIdx);
        }
        if (key === '3' && player.cooldowns.shield <= 0) {
            player.activeSkills.shield = SKILLS.SHIELD.duration;
            player.cooldowns.shield = SKILLS.SHIELD.cd;
            particles.addText("SHIELD!", player.px + 32, player.py, '#f1c40f');
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
                    runElapsedMs = 0;
                    finalRunTimeMs = null;
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

    runElapsedMs += dt;
    const effectiveDt = dt;

    autoActivateSkills();
    player.moveSpeedMult = computeMoveSpeedMult();

    const prevTileX = player.tileX, prevTileY = player.tileY;
    player.update(effectiveDt);
    autoActivateSkills();
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

    if (gameState !== 'MAP_SELECT') {
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
    }

    if (gameState === 'STORY') {
        const typedText = storyLines[currentStoryIndex].substring(0, storyCharIndex);
        renderStory(ctx, canvas.width, canvas.height, typedText, time);
    } else if (gameState === 'WIN') {
        const alpha = Math.min(1, winTimer / 1000);
        renderWin(ctx, canvas.width, canvas.height, alpha, finalRunTimeMs ?? runElapsedMs);
    } else if (gameState === 'DEAD') {
        renderDeathScreen(ctx, canvas.width, canvas.height, runElapsedMs);
    } else if (gameState === 'MAP_SELECT') {
        renderMapSelectionScreen(ctx, canvas.width, canvas.height, MAP_CONFIGS, currentMapSelectionIndex);
    } else {
        renderHUD(ctx, player, map, canvas.width, canvas.height, messageLog, statusText, runElapsedMs);
        renderMinimap(ctx, map, player, canvas.width, canvas.height);
        renderSkillCollection(ctx, player, canvas.width, canvas.height);
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
