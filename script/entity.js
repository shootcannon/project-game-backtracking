import { TILE_SIZE, SKILLS } from './constants.js';

export class Player {
    constructor(x, y) {
        this.tileX = x;
        this.tileY = y;
        this.px = x * TILE_SIZE;
        this.py = y * TILE_SIZE;
        this.facingRight = true;
        this.speed = 180;
        this.path = [];
        this.pathIndex = 0;
        this.isMoving = false;

        // Skill States
        this.activeSkills = { jump: 0, dash: 0, shield: 0, slow: 0 };
        this.cooldowns = { jump: 0, dash: 0, shield: 0, blink: 0, slow: 0 };
        this.jumpHeight = 0;
        this.collectedSkills = new Set();
    }

    isInvulnerable() {
        return this.activeSkills.jump > 0 || this.activeSkills.dash > 0 || this.activeSkills.shield > 0;
    }

    hasSkill(id) { return this.collectedSkills.has(id); }
    collectSkill(id) { this.collectedSkills.add(id); }

    setPath(path) {
        if (!path || path.length === 0) {
            this.path = [];
            this.pathIndex = 0;
            return;
        }
        this.path = path;
        this.pathIndex = 0;
        const [fx, fy] = path[0];
        if (fx === this.tileX && fy === this.tileY) {
            this.pathIndex = 1;
        }
    }

    currentTargetTile() {
        if (this.pathIndex >= this.path.length) return null;
        return this.path[this.pathIndex];
    }

    update(dt) {
        // Update Skill Timers
        Object.keys(this.activeSkills).forEach(k => {
            if (this.activeSkills[k] > 0) this.activeSkills[k] -= dt;
        });
        Object.keys(this.cooldowns).forEach(k => {
            if (this.cooldowns[k] > 0) this.cooldowns[k] -= dt;
        });

        // Jump Animation Logic
        if (this.activeSkills.jump > 0) {
            const progress = 1 - (this.activeSkills.jump / SKILLS.JUMP.duration);
            this.jumpHeight = Math.sin(progress * Math.PI) * 40;
        } else {
            this.jumpHeight = 0;
        }

        const currentSpeed = this.activeSkills.dash > 0 ? this.speed * 2.5 : this.speed;

        const target = this.currentTargetTile();
        if (!target) {
            this.isMoving = false;
            return;
        }
        const targetPx = target[0] * TILE_SIZE;
        const targetPy = target[1] * TILE_SIZE;
        const dx = targetPx - this.px;
        const dy = targetPy - this.py;
        const dist = Math.hypot(dx, dy);
        const step = currentSpeed * (dt / 1000);

        if (dist <= step) {
            this.px = targetPx;
            this.py = targetPy;
            this.tileX = target[0];
            this.tileY = target[1];
            this.pathIndex++;
            this.isMoving = this.pathIndex < this.path.length;
        } else {
            const nx = dx / dist;
            const ny = dy / dist;
            this.px += nx * step;
            this.py += ny * step;
            if (nx > 0.05) this.facingRight = true;
            else if (nx < -0.05) this.facingRight = false;
            this.isMoving = true;
        }
    }

    draw(ctx, time) {
        const isWalking = this.isMoving;
        const SKIN = '#f5cba7';
        const SKIN_SHADOW = '#d8a07a';
        const HAIR = '#3e2723';
        const HAIR_HL = '#5d4037';
        const TUNIC = '#2c5282';
        const TUNIC_DARK = '#1f3a5f';
        const PANTS = '#3b3025';
        const BOOT = '#2c1d10';
        const BELT = '#5d4037';
        const CAPE = '#8e1c1c';
        const CAPE_DARK = '#5b1010';

        const walkPhase = isWalking ? Math.sin(time / 110) : 0;
        const walkPhase2 = isWalking ? Math.sin(time / 110 + Math.PI / 2) : 0;
        const bob = isWalking ? Math.abs(Math.sin(time / 110)) * 2.5 : Math.sin(time / 700) * 1.2;
        const breath = Math.sin(time / 800) * 0.6;
        
        // Apply Jump Height
        const jumpOff = this.jumpHeight;

        const cx = this.px + TILE_SIZE / 2;
        const cy = this.py + TILE_SIZE / 2 - bob - jumpOff;

        // Dash Ghosting Effect
        if (this.activeSkills.dash > 0) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#3498db';
            ctx.fillRect(this.px + 10, this.py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
            ctx.globalAlpha = 1.0;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(this.px + TILE_SIZE / 2, this.py + TILE_SIZE / 2 + 22, 13 - bob * 0.3, 4.5 - bob * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(cx, cy);
        if (!this.facingRight) ctx.scale(-1, 1);

        // Shield Effect
        if (this.activeSkills.shield > 0) {
            ctx.beginPath();
            ctx.arc(0, -10, 35, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(0, -10, 25, 0, -10, 35);
            grad.addColorStop(0, 'rgba(52, 152, 219, 0)');
            grad.addColorStop(1, 'rgba(52, 152, 219, 0.6)');
            ctx.fillStyle = grad; ctx.fill();
        }

        const capeWave = isWalking ? Math.sin(time / 90) * 5 : Math.sin(time / 500) * 1.8;
        const capeGrad = ctx.createLinearGradient(-4, -10, -16, 22);
        capeGrad.addColorStop(0, CAPE);
        capeGrad.addColorStop(1, CAPE_DARK);
        ctx.fillStyle = capeGrad;
        ctx.beginPath();
        ctx.moveTo(-7, -10);
        ctx.quadraticCurveTo(-16 - capeWave, capeWave + 4, -13 - capeWave, 22);
        ctx.lineTo(-3, 19);
        ctx.lineTo(-3, -8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-7, -10, 4, 2);

        const legSwing = walkPhase * 0.5;
        ctx.save();
        ctx.translate(-3, 9);
        ctx.rotate(legSwing);
        ctx.fillStyle = PANTS;
        ctx.beginPath(); ctx.roundRect(-2.8, 0, 5.6, 12, 1.5); ctx.fill();
        ctx.fillStyle = BOOT;
        ctx.beginPath(); ctx.roundRect(-3.5, 10, 7, 5, 1.5); ctx.fill();
        ctx.fillStyle = '#1a1108';
        ctx.fillRect(-3.5, 14, 7, 1);
        ctx.restore();

        ctx.save();
        ctx.translate(3, 9);
        ctx.rotate(-legSwing);
        ctx.fillStyle = PANTS;
        ctx.beginPath(); ctx.roundRect(-2.8, 0, 5.6, 12, 1.5); ctx.fill();
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(-2.8, 0, 1, 12);
        ctx.fillStyle = BOOT;
        ctx.beginPath(); ctx.roundRect(-3.5, 10, 7, 5, 1.5); ctx.fill();
        ctx.fillStyle = '#1a1108';
        ctx.fillRect(-3.5, 14, 7, 1);
        ctx.restore();

        const torsoLean = walkPhase * 0.04;
        ctx.save();
        ctx.rotate(torsoLean);
        const tunicGrad = ctx.createLinearGradient(0, -10, 0, 10);
        tunicGrad.addColorStop(0, TUNIC);
        tunicGrad.addColorStop(1, TUNIC_DARK);
        ctx.fillStyle = tunicGrad;
        ctx.beginPath();
        ctx.moveTo(-8, -9 + breath);
        ctx.lineTo(8, -9 + breath);
        ctx.lineTo(10, 9);
        ctx.lineTo(-10, 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0f1f33';
        ctx.beginPath();
        ctx.moveTo(-3, -9 + breath);
        ctx.lineTo(0, -3);
        ctx.lineTo(3, -9 + breath);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f1f33';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -5); ctx.lineTo(0, 7);
        ctx.stroke();
        ctx.fillStyle = BELT;
        ctx.fillRect(-10, 7, 20, 4);
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(-10, 10, 20, 1);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-2.5, 7, 5, 4);
        ctx.fillStyle = '#b9770e';
        ctx.fillRect(-1.5, 8, 3, 2);
        ctx.restore();

        ctx.save();
        ctx.translate(-8, -6);
        ctx.rotate(-walkPhase * 0.45);
        ctx.fillStyle = TUNIC;
        ctx.beginPath(); ctx.roundRect(-2.5, 0, 5, 8, 1.5); ctx.fill();
        ctx.fillStyle = TUNIC_DARK;
        ctx.fillRect(-2.5, 7, 5, 1);
        ctx.fillStyle = SKIN;
        ctx.beginPath(); ctx.roundRect(-2, 7, 4, 6, 1.5); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 14, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = SKIN_SHADOW;
        ctx.beginPath(); ctx.arc(1, 14.5, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(8, -6);
        ctx.rotate(walkPhase2 * 0.3 - 0.15);
        ctx.fillStyle = TUNIC;
        ctx.beginPath(); ctx.roundRect(-2.5, 0, 5, 8, 1.5); ctx.fill();
        ctx.fillStyle = SKIN;
        ctx.beginPath(); ctx.roundRect(-2, 7, 4, 6, 1.5); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 14, 2.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.fillStyle = SKIN_SHADOW;
        ctx.fillRect(-2, -11, 4, 3);
        ctx.fillStyle = SKIN;
        ctx.fillRect(-2, -12, 4, 2);

        const headTilt = walkPhase * 0.025;
        ctx.save();
        ctx.rotate(headTilt);

        ctx.fillStyle = SKIN;
        ctx.beginPath();
        ctx.ellipse(0, -19, 7.5, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = SKIN_SHADOW;
        ctx.beginPath();
        ctx.ellipse(0, -14, 5.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = HAIR;
        ctx.beginPath();
        ctx.moveTo(-7.5, -19);
        ctx.quadraticCurveTo(-9, -28, 0, -28.5);
        ctx.quadraticCurveTo(9, -28, 7.5, -19);
        ctx.lineTo(7.5, -16);
        ctx.lineTo(4, -17);
        ctx.lineTo(2, -22);
        ctx.lineTo(-2, -22);
        ctx.lineTo(-5, -18);
        ctx.lineTo(-7.5, -16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = HAIR_HL;
        ctx.beginPath();
        ctx.ellipse(-2.5, -25, 3, 1.4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = HAIR;
        ctx.fillRect(-7.5, -19, 1.8, 4);

        ctx.fillStyle = SKIN;
        ctx.beginPath(); ctx.ellipse(-7.5, -18, 1.2, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = SKIN_SHADOW;
        ctx.beginPath(); ctx.ellipse(-7.5, -17.5, 0.5, 1, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = HAIR;
        ctx.fillRect(-5, -21.5, 3, 1.2);
        ctx.fillRect(1.5, -21.5, 3.5, 1.2);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(-3, -19, 1.4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(2.8, -19, 1.4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1f5f8b';
        ctx.beginPath(); ctx.arc(-2.7, -18.8, 0.95, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.1, -18.8, 0.95, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-2.5, -18.8, 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.3, -18.8, 0.45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-2.2, -19.2, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.6, -19.2, 0.3, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = SKIN_SHADOW;
        ctx.beginPath();
        ctx.moveTo(0, -17);
        ctx.lineTo(1.2, -14.5);
        ctx.lineTo(-1, -14.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#6e2c00';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-1.8, -12.5);
        ctx.quadraticCurveTo(0, -11.8, 1.8, -12.5);
        ctx.stroke();
        ctx.fillStyle = '#c0664c';
        ctx.fillRect(-1.5, -12.3, 3, 0.5);

        ctx.fillStyle = 'rgba(231, 76, 60, 0.22)';
        ctx.beginPath(); ctx.arc(-4.5, -16, 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4.5, -16, 1.4, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
        ctx.restore();
    }
}
