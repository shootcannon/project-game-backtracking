export const TILE_SIZE = 64;
export const TARGET_FPS = 120;

export const COLORS = {
    FLOOR_BASE: '#2c2c2c',
    FLOOR_DETAIL: '#222222',
    WALL_BASE: '#3a3f47',
    WALL_TOP: '#4d545e',
    WALL_BRICK: '#2a2e35',
    UI_BG: 'rgba(15, 15, 20, 0.85)',
    UI_TEXT: '#e0e0e0',
    HP_FULL: '#e74c3c',
    HP_EMPTY: '#4a2323',
    XP_FULL: '#2ecc71',
    XP_EMPTY: '#1d4a2d',
    GOLD: '#f1c40f',
    POTION: '#9b59b6',
    DAMAGE_TEXT: '#ff5252',
    SKILL_READY: '#2ecc71',
    SKILL_COOLDOWN: '#e74c3c'
};

export const SKILLS = {
    JUMP: { id: 'jump', key: '1', cd: 2000, duration: 450 },
    BLINK: { id: 'blink', key: '2', cd: 4000, duration: 350 },
    SHIELD: { id: 'shield', key: '3', cd: 6000, duration: 2800 },
};

export const SKILL_COUNT = Object.keys(SKILLS).length;