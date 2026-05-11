import { TILE_SIZE, COLORS } from './constants.js';

export const TILE_FLOOR = 0;
export const TILE_WALL = 1;
export const TILE_KEY = 2;
export const TILE_GATE = 3;
export const TILE_EXIT = 4;
export const TILE_FIRE = 5;
export const TILE_ARROW_TRAP = 6;
export const TILE_SKILL_JUMP = 7;
export const TILE_SKILL_DASH = 8;
export const TILE_SKILL_SHIELD = 9;
export const TILE_SKILL_BLINK = 10;

const SKILL_TILE_MAP = { 7: 'jump', 8: 'dash', 9: 'shield', 10: 'blink' };

export default class GameMap {
    constructor(width, height, obstacleDensity = 0.05) {
        if (width % 2 === 0) width++;
        if (height % 2 === 0) height++;
        this.width = width;
        this.height = height;
        this.data = [];
        this.startX = 1;
        this.startY = 1;
        this.exitX = width - 2;
        this.exitY = height - 2;
        this.keyX = 0; this.keyY = 0;
        this.gateX = 0; this.gateY = 0;
        this.gateApproachX = this.startX;
        this.gateApproachY = this.startY;
        this.gateOpen = false;
        this.keyTaken = false;
        this.obstacleDensity = obstacleDensity;
        this.skillPickups = [];
        this.generateMap();
    }

    generateMap() {
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) row.push(TILE_WALL);
            this.data.push(row);
        }

        const stack = [[this.startX, this.startY]];
        this.data[this.startY][this.startX] = TILE_FLOOR;
        while (stack.length > 0) {
            const [cx, cy] = stack[stack.length - 1];
            const neighbors = [];
            const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
            for (const [dx, dy] of dirs) {
                const nx = cx + dx, ny = cy + dy;
                if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1
                    && this.data[ny][nx] === TILE_WALL) {
                    neighbors.push([nx, ny, dx, dy]);
                }
            }
            if (neighbors.length === 0) { stack.pop(); continue; }
            const [nx, ny, dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.data[cy + dy / 2][cx + dx / 2] = TILE_FLOOR;
            this.data[ny][nx] = TILE_FLOOR;
            stack.push([nx, ny]);
        }

        this.data[this.exitY][this.exitX] = TILE_EXIT;

        const path = this.findPath(this.startX, this.startY, this.exitX, this.exitY, true);
        if (path && path.length >= 8) {
            const gateIdx = Math.max(2, Math.floor(path.length * 0.55));
            const [gx, gy] = path[gateIdx];
            this.gateX = gx; this.gateY = gy;
            const [agx, agy] = path[gateIdx - 1];
            this.gateApproachX = agx; this.gateApproachY = agy;
            this.data[gy][gx] = TILE_GATE;

            const reachable = this.floodFromStartAvoidingGate();
            let bestKey = null, bestDist = -1;
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (!reachable[y][x]) continue;
                    if (this.data[y][x] !== TILE_FLOOR) continue;
                    if (x === this.startX && y === this.startY) continue;
                    const onSolution = path.some(([px, py]) => px === x && py === y);
                    if (onSolution) continue;
                    const d = Math.abs(x - this.startX) + Math.abs(y - this.startY);
                    if (d > bestDist) { bestDist = d; bestKey = [x, y]; }
                }
            }
            if (!bestKey) {
                for (let y = 1; y < this.height - 1; y++) {
                    for (let x = 1; x < this.width - 1; x++) {
                        if (reachable[y][x] && this.data[y][x] === TILE_FLOOR
                            && !(x === this.startX && y === this.startY)) {
                            bestKey = [x, y]; break;
                        }
                    }
                    if (bestKey) break;
                }
            }
            if (bestKey) {
                this.keyX = bestKey[0]; this.keyY = bestKey[1];
                this.data[this.keyY][this.keyX] = TILE_KEY;
            }
        }

        // Place obstacles
        const floorTiles = [];
        for (let y = 1; y < this.height - 1; y++)
            for (let x = 1; x < this.width - 1; x++)
                if (this.data[y][x] === TILE_FLOOR) floorTiles.push([x, y]);

        const criticalTiles = [
            [this.startX, this.startY], [this.keyX, this.keyY],
            [this.gateX, this.gateY], [this.exitX, this.exitY]
        ];
        const nonCritical = floorTiles.filter(([x, y]) =>
            !criticalTiles.some(ct => ct[0] === x && ct[1] === y));

        const numObstacles = Math.floor(nonCritical.length * this.obstacleDensity);
        for (let i = 0; i < numObstacles; i++) {
            if (nonCritical.length === 0) break;
            const idx = Math.floor(Math.random() * nonCritical.length);
            const [ox, oy] = nonCritical.splice(idx, 1)[0];
            this.data[oy][ox] = Math.random() < 0.5 ? TILE_FIRE : TILE_ARROW_TRAP;
        }

        // Place 4 skill pickups in different quadrants (after obstacles)
        this._placeSkillPickups();
    }

    floodReachableFromStart() {
        // BFS from start avoiding only walls and gate (allows lethal tiles)
        const visited = [];
        for (let y = 0; y < this.height; y++) visited.push(new Array(this.width).fill(false));
        const queue = [[this.startX, this.startY]];
        visited[this.startY][this.startX] = true;
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                if (visited[ny][nx]) continue;
                const t = this.data[ny][nx];
                if (t === TILE_WALL || t === TILE_GATE) continue;
                visited[ny][nx] = true;
                queue.push([nx, ny]);
            }
        }
        return visited;
    }

    _placeSkillPickups() {
        this.skillPickups = [];
        const safeReachable = this.floodFromStartAvoidingGate();
        const anyReachable = this.floodReachableFromStart();

        const critSet = new Set([
            `${this.startX},${this.startY}`,
            `${this.keyX},${this.keyY}`,
            `${this.gateX},${this.gateY}`,
            `${this.exitX},${this.exitY}`,
            `${this.gateApproachX},${this.gateApproachY}`
        ]);

        const safeTiles = [], allTiles = [];
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (!anyReachable[y] || !anyReachable[y][x]) continue;
                if (this.data[y][x] !== TILE_FLOOR) continue;
                if (critSet.has(`${x},${y}`)) continue;
                const dist = Math.abs(x - this.startX) + Math.abs(y - this.startY);
                const entry = [x, y, dist];
                allTiles.push(entry);
                if (safeReachable[y] && safeReachable[y][x]) safeTiles.push(entry);
            }
        }

        if (allTiles.length === 0) return;

        allTiles.sort((a, b) => a[2] - b[2]);
        safeTiles.sort((a, b) => a[2] - b[2]);

        const n = 4;
        const band = Math.max(1, Math.floor(allTiles.length / n));

        const skillDefs = [
            { id: 'jump', tile: TILE_SKILL_JUMP },
            { id: 'dash', tile: TILE_SKILL_DASH },
            { id: 'shield', tile: TILE_SKILL_SHIELD },
            { id: 'blink', tile: TILE_SKILL_BLINK }
        ].sort(() => Math.random() - 0.5);

        const usedKeys = new Set();
        for (let i = 0; i < n; i++) {
            const start = i * band;
            const end = i === n - 1 ? allTiles.length : (i + 1) * band;
            // First skill: prefer safe tiles so player can always reach it
            const pool = i === 0 ? safeTiles : allTiles;
            let group = pool.slice(start, end).filter(([x, y]) => !usedKeys.has(`${x},${y}`));
            if (group.length === 0) group = pool.filter(([x, y]) => !usedKeys.has(`${x},${y}`));
            if (group.length === 0) group = allTiles.filter(([x, y]) => !usedKeys.has(`${x},${y}`));
            if (group.length === 0) continue;
            const [sx, sy] = group[Math.floor(Math.random() * group.length)];
            const skill = skillDefs[i];
            this.data[sy][sx] = skill.tile;
            this.skillPickups.push({ x: sx, y: sy, skillId: skill.id, tileType: skill.tile, collected: false });
            usedKeys.add(`${sx},${sy}`);
        }
    }

    pickupSkill(x, y) {
        for (const sp of this.skillPickups) {
            if (sp.x === x && sp.y === y && !sp.collected) {
                sp.collected = true;
                this.data[y][x] = TILE_FLOOR;
                return sp.skillId;
            }
        }
        return null;
    }

    floodFromStartAvoidingGate() {
        const visited = [];
        for (let y = 0; y < this.height; y++)
            visited.push(new Array(this.width).fill(false));
        const queue = [[this.startX, this.startY]];
        visited[this.startY][this.startX] = true;
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                if (visited[ny][nx]) continue;
                if (this.data[ny][nx] === TILE_WALL || this.data[ny][nx] === TILE_GATE || this.isLethal(nx, ny)) continue;
                visited[ny][nx] = true;
                queue.push([nx, ny]);
            }
        }
        return visited;
    }

    isLethal(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const t = this.data[y][x];
        return t === TILE_FIRE || t === TILE_ARROW_TRAP;
    }

    isLethalForPlayer(x, y, collectedSkills) {
        if (!this.isLethal(x, y)) return false;
        const t = this.data[y][x];
        if (t === TILE_FIRE && collectedSkills && collectedSkills.has('jump')) return false;
        if (t === TILE_ARROW_TRAP && collectedSkills && collectedSkills.has('dash')) return false;
        return true;
    }

    findPath(sx, sy, ex, ey, gateBlocks, avoidLethal = false, collectedSkills = null) {
        const visited = [];
        for (let y = 0; y < this.height; y++)
            visited.push(new Array(this.width).fill(null));
        const queue = [[sx, sy]];
        visited[sy][sx] = [sx, sy];
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            if (x === ex && y === ey) {
                const path = [];
                let cx = x, cy = y;
                while (!(cx === sx && cy === sy)) {
                    path.unshift([cx, cy]);
                    [cx, cy] = visited[cy][cx];
                }
                path.unshift([sx, sy]);
                return path;
            }
            for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                if (visited[ny][nx]) continue;
                const t = this.data[ny][nx];
                if (t === TILE_WALL) continue;
                if (avoidLethal && this.isLethalForPlayer(nx, ny, collectedSkills)) continue;
                if (gateBlocks && t === TILE_GATE && !this.gateOpen) continue;
                visited[ny][nx] = [x, y];
                queue.push([nx, ny]);
            }
        }
        return null;
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const t = this.data[y][x];
        if (t === TILE_WALL) return false;
        if (t === TILE_GATE && !this.gateOpen) return false;
        return true;
    }

    pickUpKey(x, y) {
        if (x === this.keyX && y === this.keyY && !this.keyTaken) {
            this.keyTaken = true;
            this.data[y][x] = TILE_FLOOR;
            return true;
        }
        return false;
    }

    tryOpenGate(x, y, allSkillsReady = true) {
        if (x === this.gateX && y === this.gateY && this.keyTaken && allSkillsReady && !this.gateOpen) {
            this.gateOpen = true;
            return true;
        }
        return false;
    }

    isExit(x, y) { return x === this.exitX && y === this.exitY; }

    draw(ctx, camX, camY, canvasWidth, canvasHeight, time) {
        const startCol = Math.floor(camX / TILE_SIZE);
        const endCol = startCol + Math.ceil(canvasWidth / TILE_SIZE) + 1;
        const startRow = Math.floor(camY / TILE_SIZE);
        const endRow = startRow + Math.ceil(canvasHeight / TILE_SIZE) + 1;

        for (let y = Math.max(0, startRow); y < Math.min(this.height, endRow); y++) {
            for (let x = Math.max(0, startCol); x < Math.min(this.width, endCol); x++) {
                const px = x * TILE_SIZE, py = y * TILE_SIZE;
                const t = this.data[y][x];

                if (t === TILE_WALL) {
                    ctx.fillStyle = COLORS.WALL_BASE; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = COLORS.WALL_TOP; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE / 4);
                    ctx.strokeStyle = COLORS.WALL_BRICK; ctx.lineWidth = 2;
                    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.beginPath(); ctx.moveTo(px, py + TILE_SIZE / 2); ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2); ctx.stroke();
                } else {
                    ctx.fillStyle = COLORS.FLOOR_BASE; ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    if ((x * 13 + y * 7) % 5 === 0) {
                        ctx.fillStyle = COLORS.FLOOR_DETAIL;
                        ctx.fillRect(px + TILE_SIZE / 4, py + TILE_SIZE / 4, 6, 6);
                    }

                    if (t === TILE_KEY && !this.keyTaken) {
                        const bob = Math.sin((time || 0) / 300) * 4;
                        const cx = px + TILE_SIZE / 2, cy = py + TILE_SIZE / 2 + bob;
                        ctx.fillStyle = 'rgba(241, 196, 15, 0.25)';
                        ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#f1c40f';
                        ctx.beginPath(); ctx.arc(cx - 6, cy, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = COLORS.FLOOR_BASE;
                        ctx.beginPath(); ctx.arc(cx - 6, cy, 2.5, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#f1c40f';
                        ctx.fillRect(cx - 2, cy - 2, 14, 4);
                        ctx.fillRect(cx + 8, cy + 2, 3, 4);
                        ctx.fillRect(cx + 4, cy + 2, 3, 3);
                    } else if (t === TILE_GATE && !this.gateOpen) {
                        ctx.fillStyle = '#1a1108';
                        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = '#3e2723';
                        for (let i = 0; i < 4; i++)
                            ctx.fillRect(px + 4 + i * 14, py + 4, 12, TILE_SIZE - 8);
                        ctx.fillStyle = '#7f8c8d';
                        ctx.fillRect(px + 6, py + 16, TILE_SIZE - 12, 4);
                        ctx.fillRect(px + 6, py + TILE_SIZE - 20, TILE_SIZE - 12, 4);
                        ctx.fillStyle = '#f1c40f';
                        ctx.beginPath(); ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 5, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#000';
                        ctx.fillRect(px + TILE_SIZE / 2 - 1, py + TILE_SIZE / 2 - 1, 2, 4);
                    } else if (t === TILE_EXIT) {
                        const pulse = 0.4 + Math.sin((time || 0) / 200) * 0.2;
                        ctx.fillStyle = `rgba(46, 204, 113, ${pulse})`;
                        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3;
                        ctx.strokeRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                        ctx.fillStyle = '#fff';
                        ctx.font = '24px "VT323", monospace';
                        ctx.textAlign = 'center';
                        ctx.fillText('EXIT', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 8);
                        ctx.textAlign = 'start';
                    } else if (t === TILE_FIRE) {
                        const pulse = 0.5 + Math.sin((time || 0) / 150) * 0.5;
                        ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`;
                        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = `rgba(241, 196, 15, ${pulse * 0.8})`;
                        ctx.beginPath();
                        ctx.moveTo(px + TILE_SIZE / 2, py + TILE_SIZE / 4);
                        ctx.lineTo(px + TILE_SIZE / 4, py + TILE_SIZE * 3 / 4);
                        ctx.lineTo(px + TILE_SIZE * 3 / 4, py + TILE_SIZE * 3 / 4);
                        ctx.closePath(); ctx.fill();
                        ctx.fillStyle = `rgba(255, 165, 0, ${pulse * 0.6})`;
                        ctx.beginPath(); ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE * 0.7, TILE_SIZE / 4, 0, Math.PI * 2); ctx.fill();
                    } else if (t === TILE_ARROW_TRAP) {
                        ctx.fillStyle = '#34495e';
                        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                        ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(px + TILE_SIZE / 4, py + TILE_SIZE / 4);
                        ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE / 8);
                        ctx.lineTo(px + TILE_SIZE * 3 / 4, py + TILE_SIZE / 4);
                        ctx.moveTo(px + TILE_SIZE / 2, py + TILE_SIZE / 8);
                        ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE * 7 / 8);
                        ctx.moveTo(px + TILE_SIZE / 4, py + TILE_SIZE * 3 / 4);
                        ctx.lineTo(px + TILE_SIZE / 2, py + TILE_SIZE * 7 / 8);
                        ctx.lineTo(px + TILE_SIZE * 3 / 4, py + TILE_SIZE * 3 / 4);
                        ctx.stroke();
                    } else if (t >= TILE_SKILL_JUMP && t <= TILE_SKILL_BLINK) {
                        this._drawSkillTile(ctx, px, py, SKILL_TILE_MAP[t], time || 0);
                    }
                }
            }
        }
    }

    _drawSkillTile(ctx, px, py, skillId, time) {
        const cx = px + TILE_SIZE / 2;
        const cy = py + TILE_SIZE / 2;
        const SKILL_STYLE = {
            jump:   { r: 46,  g: 204, b: 113 },
            dash:   { r: 52,  g: 152, b: 219 },
            shield: { r: 241, g: 196, b: 15  },
            blink:  { r: 155, g: 89,  b: 182 }
        };
        const c = SKILL_STYLE[skillId] || SKILL_STYLE.jump;
        const bob = Math.sin(time / 500 + px * 0.003 + py * 0.003) * 5;
        const pulse = 0.5 + Math.abs(Math.sin(time / 700)) * 0.5;
        const gemY = cy + bob;

        // Pulsing glow aura
        const grd = ctx.createRadialGradient(cx, gemY, 3, cx, gemY, 27);
        grd.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${0.5 * pulse})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 22, 10 - pulse, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(cx, gemY);

        // Diamond gem body
        const gs = 15 + pulse * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -gs);
        ctx.lineTo(gs * 0.75, 0);
        ctx.lineTo(0, gs);
        ctx.lineTo(-gs * 0.75, 0);
        ctx.closePath();
        ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Gem inner highlight facet
        ctx.beginPath();
        ctx.moveTo(0, -gs * 0.72);
        ctx.lineTo(gs * 0.42, -gs * 0.06);
        ctx.lineTo(0, gs * 0.18);
        ctx.lineTo(-gs * 0.42, -gs * 0.06);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();

        // Skill icon inside gem
        this._drawSkillIcon(ctx, skillId, gs * 0.48);

        // Orbiting sparkle particles
        for (let i = 0; i < 3; i++) {
            const angle = time / 1100 + (i * Math.PI * 2 / 3);
            const r = gs + 6;
            const sx = Math.cos(angle) * r;
            const sy = Math.sin(angle) * r * 0.55;
            const sa = 0.25 + Math.abs(Math.sin(time / 280 + i * 2)) * 0.5;
            ctx.fillStyle = `rgba(255,255,255,${sa})`;
            ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
        }

        ctx.restore();

        // Skill name label
        ctx.font = 'bold 10px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.strokeText(skillId.toUpperCase(), cx, py + TILE_SIZE - 4);
        ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
        ctx.fillText(skillId.toUpperCase(), cx, py + TILE_SIZE - 4);
        ctx.textAlign = 'start';
    }

    _drawSkillIcon(ctx, skillId, s) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        if (skillId === 'jump') {
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.55, -s * 0.08);
            ctx.lineTo(s * 0.22, -s * 0.08);
            ctx.lineTo(s * 0.22, s * 0.65);
            ctx.lineTo(-s * 0.22, s * 0.65);
            ctx.lineTo(-s * 0.22, -s * 0.08);
            ctx.lineTo(-s * 0.55, -s * 0.08);
            ctx.closePath();
            ctx.fill();
        } else if (skillId === 'dash') {
            ctx.beginPath();
            ctx.moveTo(s * 0.22, -s);
            ctx.lineTo(-s * 0.28, -s * 0.05);
            ctx.lineTo(s * 0.08, -s * 0.05);
            ctx.lineTo(-s * 0.22, s);
            ctx.lineTo(s * 0.28, s * 0.05);
            ctx.lineTo(-s * 0.08, s * 0.05);
            ctx.closePath();
            ctx.fill();
        } else if (skillId === 'shield') {
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.88);
            ctx.lineTo(s * 0.65, -s * 0.28);
            ctx.lineTo(s * 0.65, s * 0.12);
            ctx.quadraticCurveTo(s * 0.32, s * 0.82, 0, s);
            ctx.quadraticCurveTo(-s * 0.32, s * 0.82, -s * 0.65, s * 0.12);
            ctx.lineTo(-s * 0.65, -s * 0.28);
            ctx.closePath();
            ctx.fill();
        } else {
            // blink: 4-pointed star
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const outerA = (i / 4) * Math.PI * 2 - Math.PI / 2;
                const innerA = outerA + Math.PI / 4;
                if (i === 0) ctx.moveTo(Math.cos(outerA) * s, Math.sin(outerA) * s);
                else ctx.lineTo(Math.cos(outerA) * s, Math.sin(outerA) * s);
                ctx.lineTo(Math.cos(innerA) * s * 0.28, Math.sin(innerA) * s * 0.28);
            }
            ctx.closePath();
            ctx.fill();
        }
    }
}
