import java.awt.Color;

public class Constants {
    public static final int TILE_SIZE = 64;
    public static final int TARGET_FPS = 120;
    
    public static final Color COLOR_FLOOR_BASE = new Color(44, 44, 44);
    public static final Color COLOR_FLOOR_DETAIL = new Color(34, 34, 34);
    public static final Color COLOR_WALL_BASE = new Color(58, 63, 71);
    public static final Color COLOR_WALL_TOP = new Color(77, 84, 94);
    public static final Color COLOR_WALL_BRICK = new Color(42, 46, 53);
    public static final Color COLOR_UI_BG = new Color(15, 15, 20, 217);
    public static final Color COLOR_UI_TEXT = new Color(224, 224, 224);
    public static final Color COLOR_SKILL_READY = new Color(46, 204, 113);
    public static final Color COLOR_SKILL_COOLDOWN = new Color(231, 76, 60);

    public static final int TILE_FLOOR = 0;
    public static final int TILE_WALL = 1;
    public static final int TILE_KEY = 2;
    public static final int TILE_GATE = 3;
    public static final int TILE_EXIT = 4;
    public static final int TILE_FIRE = 5;
    public static final int TILE_ARROW_TRAP = 6;
    public static final int TILE_MINE = 11;
}
