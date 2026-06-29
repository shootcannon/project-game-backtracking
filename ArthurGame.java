import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.awt.geom.*;
import java.util.*;
import java.util.List;

public class ArthurGame extends JFrame {
    private static final List<MapConfig> MAP_CONFIGS = Arrays.asList(
        new MapConfig("Easy Maze", 17, 17, 0.04, "Map kecil, rintangan jarang."),
        new MapConfig("Medium Maze", 27, 27, 0.07, "Tantangan mulai terasa."),
        new MapConfig("Hard Maze", 37, 37, 0.12, "Banyak ranjau dan area panah!")
    );

    private int currentMapSelectionIndex = 0;
    private MapConfig currentMapConfig = MAP_CONFIGS.get(0);
    private GameMap map;
    private Player player;
    private final ParticleSystem particles = new ParticleSystem();
    private final List<String> messageLog = new ArrayList<>();
    private String statusText = "AI mencari jalan keluar...";
    private double runElapsedMs = 0;
    private Double finalRunTimeMs = null;
    private String gameState = "MAP_SELECT";

    private final List<String> storyLines = Arrays.asList(
        "Labirin kuno ini menelan banyak penjelajah...",
        "Aku akan berjalan sendiri - kakiku tahu jalannya.",
        "Tapi gerbang besi di tengah menutup jalan keluar.",
        "3 skill siap: Jump, Blink, Shield - cari kunci lalu keluar!",
        "Mulai!"
    );
    private int currentStoryIndex = 0;
    private int storyCharIndex = 0;
    private double storyTimer = 0;
    private boolean spacePressed = false;
    private double winTimer = 0;
    private double deathTimer = 0;

    private double camX = 0;
    private double camY = 0;
    private int fpsCurrent = 0;
    private int fpsFrames = 0;
    private long fpsLastUpdate = System.currentTimeMillis();

    private final GamePanel gamePanel;
    private boolean running = true;

    public ArthurGame() {
        setTitle("Arthur - Labirin Kuno");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1200, 800);
        setLocationRelativeTo(null);

        map = new GameMap(currentMapConfig.width, currentMapConfig.height, currentMapConfig.obstacleDensity);
        player = new Player(map.startX, map.startY);

        gamePanel = new GamePanel();
        add(gamePanel);

        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                handleKeyDown(e);
            }
            @Override
            public void keyReleased(KeyEvent e) {
                handleKeyUp(e);
            }
        });

        addComponentListener(new ComponentAdapter() {
            @Override
            public void componentResized(ComponentEvent e) {
                camX = player.px - getWidth() / 2.0;
                camY = player.py - getHeight() / 2.0;
            }
        });

        messageLog.add("--- LABIRIN DIMULAI ---");
        messageLog.add("3 skill siap - cari kunci lalu keluar!");

        runGameLoop();
    }

    private void runGameLoop() {
        Thread thread = new Thread(() -> {
            long lastTime = System.nanoTime();
            while (running) {
                long now = System.nanoTime();
                double dt = (now - lastTime) / 1000000.0;
                lastTime = now;
                if (dt > 100.0) dt = 100.0;

                long timeMs = System.currentTimeMillis();
                fpsFrames++;
                if (timeMs - fpsLastUpdate >= 500) {
                    fpsCurrent = (int) ((fpsFrames * 1000.0) / (timeMs - fpsLastUpdate));
                    fpsFrames = 0;
                    fpsLastUpdate = timeMs;
                }

                updateGame(dt);

                SwingUtilities.invokeLater(() -> gamePanel.repaint());

                try {
                    long elapsed = (System.nanoTime() - now) / 1000000;
                    long sleepTime = (1000 / Constants.TARGET_FPS) - elapsed;
                    if (sleepTime > 0) {
                        Thread.sleep(sleepTime);
                    } else {
                        Thread.sleep(1);
                    }
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        thread.start();
    }

    private boolean isHardMap() {
        return (currentMapConfig != null) && (currentMapConfig.obstacleDensity >= 0.1);
    }

    private List<Point> findSafePath(int sx, int sy, int ex, int ey, boolean gateBlocks) {
        List<Point> path = map.findPath(sx, sy, ex, ey, gateBlocks, true);
        if (path != null) return path;
        return map.findPath(sx, sy, ex, ey, gateBlocks, false);
    }

    private void planNextPath() {
        class Step {
            String label;
            boolean valid;
            Point goal;
            boolean gateBlocks;
            Step(String label, boolean valid, Point goal, boolean gateBlocks) {
                this.label = label;
                this.valid = valid;
                this.goal = goal;
                this.gateBlocks = gateBlocks;
            }
        }

        List<Step> prioritas = Arrays.asList(
            new Step("Mencari jalur ke Kunci...", !map.keyTaken, new Point(map.keyX, map.keyY), true),
            new Step("Menuju gerbang...", map.keyTaken && !map.gateOpen, new Point(map.gateX, map.gateY), false),
            new Step("Menuju keluar...", true, new Point(map.exitX, map.exitY), true)
        );

        for (Step step : prioritas) {
            if (!step.valid) continue;
            List<Point> p = findSafePath(player.tileX, player.tileY, step.goal.x, step.goal.y, step.gateBlocks);
            if (p != null && p.size() > 1) {
                statusText = step.label;
                player.setPath(p);
                return;
            }
        }
    }

    private int hazardLookahead() {
        return isHardMap() ? 12 : 7;
    }

    private int shieldTriggerRange() {
        return isHardMap() ? 6 : 4;
    }

    private double shieldDuration() {
        return isHardMap() ? 2800.0 * 1.25 : 2800.0;
    }

    private Point getNextHazardOnPath() {
        if (player.path == null || player.path.isEmpty()) return null;
        int end = Math.min(player.pathIndex + hazardLookahead(), player.path.size());
        for (int i = player.pathIndex; i < end; i++) {
            Point p = player.path.get(i);
            if (map.isLethal(p.x, p.y)) {
                return new Point(i, i - player.pathIndex);
            }
        }
        return null;
    }

    private Integer findSafePathIndex(int fromIndex) {
        if (player.path == null) return null;
        for (int i = fromIndex; i < player.path.size(); i++) {
            Point p = player.path.get(i);
            if (!map.isLethal(p.x, p.y)) {
                return i;
            }
        }
        return null;
    }

    private void activateShield(String label) {
        player.activeShield = shieldDuration();
        player.cdShield = 6000.0;
        particles.addText(label, player.px + 32, player.py, Color.YELLOW);
    }

    private void performBlinkToIndex(int targetIdx) {
        Point p = player.path.get(targetIdx);
        player.px = p.x * Constants.TILE_SIZE;
        player.py = p.y * Constants.TILE_SIZE;
        player.tileX = p.x;
        player.tileY = p.y;
        player.pathIndex = targetIdx;
        player.activeBlink = 350.0;
        player.cdBlink = 4000.0;
        particles.addText("AUTO BLINK!", player.px + 32, player.py, new Color(155, 89, 182));
    }

    private boolean tryEmergencySkill() {
        if (player.isInvulnerable()) return true;
        if (player.cdShield <= 0) {
            activateShield("SHIELD DARURAT!");
            return true;
        }
        Integer safeIdx = findSafePathIndex(player.pathIndex + 1);
        if (safeIdx != null && safeIdx > player.pathIndex && player.cdBlink <= 0) {
            performBlinkToIndex(safeIdx);
            return true;
        }
        if (player.cdJump <= 0) {
            player.activeJump = 450.0;
            player.cdJump = 2000.0;
            particles.addText("JUMP DARURAT!", player.px + 32, player.py, new Color(46, 204, 113));
            return true;
        }
        return false;
    }

    private double computeMoveSpeedMult() {
        if (player.isInvulnerable()) return 1.0;
        Point target = player.currentTargetTile();
        if (target != null && map.isLethal(target.x, target.y)) {
            return isHardMap() ? 0.2 : 0.35;
        }
        Point hazard = getNextHazardOnPath();
        if (hazard == null) return 1.0;
        int dist = hazard.y;
        if (dist <= 1) return isHardMap() ? 0.25 : 0.4;
        if (dist <= 2 && player.cdShield > 0) return 0.5;
        return 1.0;
    }

    private void autoActivateSkills() {
        if (!gameState.equals("PLAYING") || player.path == null || player.path.isEmpty() || player.pathIndex >= player.path.size()) return;

        if (map.isLethal(player.tileX, player.tileY)) {
            tryEmergencySkill();
            return;
        }

        Point hazard = getNextHazardOnPath();
        if (hazard == null) return;

        int index = hazard.x;
        int dist = hazard.y;

        if (dist <= shieldTriggerRange() && player.cdShield <= 0) {
            activateShield("AUTO SHIELD!");
            return;
        }

        if (player.isInvulnerable()) return;

        if (dist <= 1) {
            if (player.cdShield <= 0) {
                activateShield("AUTO SHIELD!");
                return;
            }
            Integer safeIdx = findSafePathIndex(player.pathIndex + 1);
            if (safeIdx != null && safeIdx > player.pathIndex && player.cdBlink <= 0) {
                performBlinkToIndex(safeIdx);
                return;
            }
            if (player.cdJump <= 0) {
                player.activeJump = 450.0;
                player.cdJump = 2000.0;
                particles.addText("AUTO JUMP!", player.px + 32, player.py, new Color(46, 204, 113));
            }
            return;
        }

        if (dist >= 2 && dist <= 8 && player.cdBlink <= 0) {
            Integer safeIdx = findSafePathIndex(index);
            if (safeIdx != null && safeIdx > player.pathIndex + 1) {
                performBlinkToIndex(safeIdx);
            }
        }
    }

    private void createNewGame(MapConfig config) {
        currentMapConfig = config;
        map = new GameMap(config.width, config.height, config.obstacleDensity);
        player = new Player(map.startX, map.startY);
        player.speed = isHardMap() ? 130.0 : 180.0;
        messageLog.clear();
        messageLog.add("--- LABIRIN DIMULAI ---");
        messageLog.add("3 skill siap - cari kunci lalu keluar!");
        statusText = "AI mencari jalan keluar...";
        runElapsedMs = 0;
        finalRunTimeMs = null;
        planNextPath();
        camX = player.px - getWidth() / 2.0;
        camY = player.py - getHeight() / 2.0;
        currentStoryIndex = 0;
        storyCharIndex = 0;
        spacePressed = false;
    }

    private void resetGame() {
        createNewGame(MAP_CONFIGS.get(currentMapSelectionIndex));
    }

    private void onTileEntered(int tx, int ty) {
        if (map.isLethal(tx, ty) && !player.isInvulnerable()) {
            int wasX = player.tileX;
            int wasY = player.tileY;
            if (!tryEmergencySkill()) {
                gameState = "DEAD";
                messageLog.add("Arthur terkena jebakan!");
                particles.addText("MATI!", player.px + Constants.TILE_SIZE / 2.0, player.py, new Color(231, 76, 60));
            } else if (player.tileX != wasX || player.tileY != wasY) {
                onTileEntered(player.tileX, player.tileY);
            }
            return;
        }

        if (map.pickUpKey(tx, ty)) {
            messageLog.add("Kunci didapat! Kembali ke gerbang.");
            particles.addText("KUNCI!", player.px + Constants.TILE_SIZE / 2.0, player.py, new Color(241, 196, 15));
            planNextPath();
        } else if (tx == map.gateX && ty == map.gateY && map.keyTaken && !map.gateOpen) {
            if (map.tryOpenGate(tx, ty, true)) {
                messageLog.add("Gerbang terbuka!");
                particles.addText("TERBUKA!", player.px + Constants.TILE_SIZE / 2.0, player.py, new Color(46, 204, 113));
                planNextPath();
            } else {
                messageLog.add("Gerbang terkunci, butuh kunci!");
                statusText = "Gerbang terkunci!";
                planNextPath();
            }
        } else if (map.isExit(tx, ty)) {
            if (gameState.equals("PLAYING")) {
                finalRunTimeMs = runElapsedMs;
                gameState = "WIN";
                winTimer = 0;
                messageLog.add("Sampai di EXIT! (" + formatRunTime(finalRunTimeMs) + ")");
            }
        }
    }

    private void handleKeyDown(KeyEvent e) {
        int key = e.getKeyCode();
        if (key == KeyEvent.VK_ESCAPE) {
            if (gameState.equals("PLAYING")) gameState = "PAUSED";
            else if (gameState.equals("PAUSED")) gameState = "PLAYING";
        }
        if (gameState.equals("MAP_SELECT")) {
            if (key == KeyEvent.VK_LEFT || key == KeyEvent.VK_UP) {
                currentMapSelectionIndex = Math.max(0, currentMapSelectionIndex - 1);
            } else if (key == KeyEvent.VK_RIGHT || key == KeyEvent.VK_DOWN) {
                currentMapSelectionIndex = Math.min(MAP_CONFIGS.size() - 1, currentMapSelectionIndex + 1);
            } else if (key == KeyEvent.VK_ENTER || key == KeyEvent.VK_SPACE) {
                if (!spacePressed) {
                    spacePressed = true;
                    createNewGame(MAP_CONFIGS.get(currentMapSelectionIndex));
                    gameState = "STORY";
                }
            }
            return;
        }
        if (gameState.equals("DEAD") && key == KeyEvent.VK_R) {
            resetGame();
            gameState = "MAP_SELECT";
            return;
        }

        if (gameState.equals("PLAYING")) {
            if (key == KeyEvent.VK_1 && player.cdJump <= 0) {
                player.activeJump = 450.0;
                player.cdJump = 2000.0;
                particles.addText("JUMP!", player.px + 32, player.py, new Color(46, 204, 113));
            }
            if (key == KeyEvent.VK_2 && player.cdBlink <= 0) {
                Integer safeIdx = findSafePathIndex(player.pathIndex + 1);
                if (safeIdx == null) {
                    safeIdx = Math.min(player.pathIndex + 3, player.path.size() - 1);
                }
                if (safeIdx >= 0 && safeIdx < player.path.size()) {
                    performBlinkToIndex(safeIdx);
                }
            }
            if (key == KeyEvent.VK_3 && player.cdShield <= 0) {
                player.activeShield = 2800.0;
                player.cdShield = 6000.0;
                particles.addText("SHIELD!", player.px + 32, player.py, new Color(241, 196, 15));
            }
        }

        if (key == KeyEvent.VK_SPACE || key == KeyEvent.VK_ENTER) {
            if (gameState.equals("STORY") && !spacePressed) {
                spacePressed = true;
                String line = storyLines.get(currentStoryIndex);
                if (storyCharIndex < line.length()) {
                    storyCharIndex = line.length();
                } else {
                    currentStoryIndex++;
                    storyCharIndex = 0;
                    if (currentStoryIndex >= storyLines.size()) {
                        gameState = "PLAYING";
                        runElapsedMs = 0;
                        finalRunTimeMs = null;
                        planNextPath();
                    }
                }
            }
        }
        if ((gameState.equals("WIN") || gameState.equals("PAUSED")) && key == KeyEvent.VK_R) {
            resetGame();
            gameState = "MAP_SELECT";
        }
    }

    private void handleKeyUp(KeyEvent e) {
        int key = e.getKeyCode();
        if (key == KeyEvent.VK_SPACE || key == KeyEvent.VK_ENTER) {
            spacePressed = false;
        }
    }

    private void updateGame(double dt) {
        if (!gameState.equals("PLAYING")) {
            if (gameState.equals("STORY")) {
                storyTimer += dt;
                if (storyTimer > 40.0) {
                    if (storyCharIndex < storyLines.get(currentStoryIndex).length()) {
                        storyCharIndex++;
                    }
                    storyTimer = 0;
                }
            } else if (gameState.equals("WIN")) {
                winTimer += dt;
            } else if (gameState.equals("DEAD")) {
                deathTimer += dt;
            }
            return;
        }

        runElapsedMs += dt;
        autoActivateSkills();
        player.moveSpeedMult = computeMoveSpeedMult();

        int prevTileX = player.tileX;
        int prevTileY = player.tileY;
        player.update(dt);
        autoActivateSkills();

        if (player.tileX != prevTileX || player.tileY != prevTileY) {
            onTileEntered(player.tileX, player.tileY);
        }

        if (player.pathIndex >= player.path.size() && gameState.equals("PLAYING")) {
            if (!map.isExit(player.tileX, player.tileY)) {
                planNextPath();
            }
        }

        camX += (player.px - getWidth() / 2.0 - camX) * 0.1;
        camY += (player.py - getHeight() / 2.0 - camY) * 0.1;
    }

    public static String formatRunTime(double ms) {
        double sec = ms / 1000.0;
        if (sec < 60.0) {
            return String.format(Locale.US, "%.2f detik", sec);
        }
        int m = (int) (sec / 60);
        double s = sec % 60;
        return String.format(Locale.US, "%d menit %.1f detik", m, s);
    }

    class GamePanel extends JPanel {
        GamePanel() {
            setBackground(Color.BLACK);
            setDoubleBuffered(true);
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g;
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            long time = System.currentTimeMillis();

            if (!gameState.equals("MAP_SELECT")) {
                g2.translate(-Math.floor(camX), -Math.floor(camY));
                map.draw(g2, camX, camY, getWidth(), getHeight(), time);
                player.draw(g2, time);
                particles.updateAndDraw(g2, 16.6);

                Composite oldComp = g2.getComposite();
                g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1.0f));

                double centerX = player.px + Constants.TILE_SIZE / 2.0;
                double centerY = player.py + Constants.TILE_SIZE / 2.0;
                float[] dist = {0.0f, 0.15f, 1.0f};
                Color[] colors = {new Color(0, 0, 0, 0), new Color(0, 0, 0, 0), new Color(0, 0, 0, 245)};
                
                try {
                    RadialGradientPaint p = new RadialGradientPaint(
                        (float) centerX, (float) centerY, 420.0f, dist, colors
                    );
                    g2.setPaint(p);
                    g2.fillRect((int) camX, (int) camY, getWidth(), getHeight());
                } catch (Exception ex) {
                }

                g2.setTransform(new AffineTransform());
            }

            if (gameState.equals("STORY")) {
                String typedText = storyLines.get(currentStoryIndex).substring(0, storyCharIndex);
                renderStory(g2, typedText, time);
            } else if (gameState.equals("WIN")) {
                double alpha = Math.min(1.0, winTimer / 1000.0);
                renderWin(g2, alpha, finalRunTimeMs != null ? finalRunTimeMs : runElapsedMs);
            } else if (gameState.equals("DEAD")) {
                renderDeathScreen(g2, runElapsedMs);
            } else if (gameState.equals("MAP_SELECT")) {
                renderMapSelectionScreen(g2);
            } else {
                renderHUD(g2);
                renderMinimap(g2);
                renderSkillCollection(g2);
                renderSkillBar(g2);
                if (gameState.equals("PAUSED")) {
                    renderPauseScreen(g2);
                }
            }

            g2.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 18));
            String fpsLabel = "FPS: " + fpsCurrent + " / target " + Constants.TARGET_FPS;
            g2.setColor(new Color(0, 0, 0, 140));
            g2.fillRect(getWidth() - 250, 8, 240, 24);
            g2.setColor(fpsCurrent >= Constants.TARGET_FPS * 0.9 ? new Color(46, 204, 113) :
                        fpsCurrent >= Constants.TARGET_FPS * 0.6 ? new Color(241, 196, 15) : new Color(231, 76, 60));
            g2.drawString(fpsLabel, getWidth() - 242, 26);
        }

        private void renderStory(Graphics2D g, String text, long time) {
            g.setColor(Color.BLACK);
            g.fillRect(0, 0, getWidth(), 100);
            g.fillRect(0, getHeight() - 200, getWidth(), 200);

            g.setColor(new Color(15, 15, 20, 230));
            g.fillRoundRect(80, getHeight() - 170, getWidth() - 160, 130, 8, 8);
            g.setColor(new Color(241, 196, 15));
            g.setStroke(new BasicStroke(3));
            g.drawRoundRect(80, getHeight() - 170, getWidth() - 160, 130, 8, 8);

            g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 28));
            g.setColor(new Color(241, 196, 15));
            g.drawString("Arthur - Penjelajah Labirin", 120, getHeight() - 135);

            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 24));
            g.setColor(Color.WHITE);
            g.drawString(text, 120, getHeight() - 95);

            if ((time / 500) % 2 == 0) {
                g.setColor(new Color(170, 170, 170));
                g.drawString("▼ Tekan [SPASI] ▼", getWidth() - 340, getHeight() - 60);
            }
        }

        private void renderWin(Graphics2D g, double alpha, double elapsedMs) {
            g.setColor(new Color(5, 20, 10, (int) (alpha * 216)));
            g.fillRect(0, 0, getWidth(), getHeight());

            AffineTransform old = g.getTransform();
            g.translate(getWidth() / 2.0, getHeight() / 2.0);
            double s = Math.min(1.0, alpha * 2.0);
            g.scale(s, s);

            g.setColor(new Color(10, 31, 18));
            g.fillRoundRect(-240, -115, 480, 230, 10, 10);
            g.setColor(new Color(46, 204, 113));
            g.setStroke(new BasicStroke(4));
            g.drawRoundRect(-240, -115, 480, 230, 10, 10);

            g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 36));
            g.setColor(new Color(46, 204, 113));
            drawCenteredString(g, "LABIRIN DITAKLUKKAN!", 0, -45);

            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 22));
            g.setColor(new Color(236, 240, 241));
            drawCenteredString(g, "Arthur menemukan jalan keluar.", 0, -5);

            g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 26));
            g.setColor(new Color(241, 196, 15));
            drawCenteredString(g, "Waktu: " + formatRunTime(elapsedMs), 0, 35);

            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 20));
            g.setColor(new Color(170, 170, 170));
            if ((System.currentTimeMillis() / 500) % 2 == 0) {
                drawCenteredString(g, "▼ Tekan [R] untuk Labirin Baru ▼", 0, 80);
            }

            g.setTransform(old);
        }

        private void renderDeathScreen(Graphics2D g, double elapsedMs) {
            g.setColor(new Color(50, 0, 0, 216));
            g.fillRect(0, 0, getWidth(), getHeight());

            AffineTransform old = g.getTransform();
            g.translate(getWidth() / 2.0, getHeight() / 2.0);

            g.setColor(new Color(31, 0, 0));
            g.fillRoundRect(-240, -115, 480, 230, 10, 10);
            g.setColor(new Color(231, 76, 60));
            g.setStroke(new BasicStroke(4));
            g.drawRoundRect(-240, -115, 480, 230, 10, 10);

            g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 36));
            g.setColor(new Color(231, 76, 60));
            drawCenteredString(g, "ANDA MATI!", 0, -45);

            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 22));
            g.setColor(new Color(236, 240, 241));
            drawCenteredString(g, "Arthur tidak menemukan jalan keluar.", 0, 0);

            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 22));
            g.setColor(new Color(241, 196, 15));
            drawCenteredString(g, "Waktu: " + formatRunTime(elapsedMs), 0, 32);

            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 20));
            g.setColor(new Color(170, 170, 170));
            if ((System.currentTimeMillis() / 500) % 2 == 0) {
                drawCenteredString(g, "▼ Tekan [R] untuk Pilih Labirin Baru ▼", 0, 72);
            }

            g.setTransform(old);
        }

        private void renderPauseScreen(Graphics2D g) {
            g.setColor(new Color(0, 0, 0, 150));
            g.fillRect(0, 0, getWidth(), getHeight());
            g.setColor(Color.WHITE);
            g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 60));
            drawCenteredString(g, "PAUSED", getWidth() / 2, getHeight() / 2);
            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 24));
            g.setColor(new Color(170, 170, 170));
            drawCenteredString(g, "Tekan [ESC] untuk Melanjutkan", getWidth() / 2, getHeight() / 2 + 40);
        }

        private void renderMapSelectionScreen(Graphics2D g) {
            g.setColor(new Color(0, 0, 0, 230));
            g.fillRect(0, 0, getWidth(), getHeight());

            g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 48));
            g.setColor(new Color(241, 196, 15));
            drawCenteredString(g, "PILIH LABIRIN", getWidth() / 2, getHeight() / 2 - 150);

            for (int i = 0; i < MAP_CONFIGS.size(); i++) {
                MapConfig config = MAP_CONFIGS.get(i);
                boolean isSelected = i == currentMapSelectionIndex;
                g.setColor(isSelected ? new Color(46, 204, 113) : new Color(236, 240, 241));
                g.setFont(new Font(Font.MONOSPACED, isSelected ? Font.BOLD : Font.PLAIN, isSelected ? 36 : 32));
                String nameText = (isSelected ? "> " : "") + config.name + (isSelected ? " <" : "");
                drawCenteredString(g, nameText, getWidth() / 2, getHeight() / 2 - 50 + (i * 60));

                g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 20));
                g.setColor(isSelected ? new Color(170, 255, 170) : new Color(170, 170, 170));
                drawCenteredString(g, config.description, getWidth() / 2, getHeight() / 2 - 20 + (i * 60));
            }

            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 24));
            g.setColor(new Color(241, 196, 15));
            if ((System.currentTimeMillis() / 500) % 2 == 0) {
                drawCenteredString(g, "Tekan [SPASI] atau [ENTER] untuk Mulai", getWidth() / 2, getHeight() - 100);
            }
        }

        private void renderHUD(Graphics2D g) {
            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 20));
            int padding = 20;

            g.setColor(new Color(20, 20, 25, 190));
            g.fillRoundRect(padding, padding, 340, 84, 8, 8);
            g.setColor(new Color(255, 255, 255, 51));
            g.setStroke(new BasicStroke(2));
            g.drawRoundRect(padding, padding, 340, 84, 8, 8);

            g.setColor(Constants.COLOR_UI_TEXT);
            g.drawString("Status: " + statusText, padding + 15, padding + 25);
            g.setColor(map.keyTaken ? new Color(46, 204, 113) : new Color(127, 141, 141));
            g.drawString("Kunci: " + (map.keyTaken ? "DIMILIKI" : "BELUM"), padding + 15, padding + 50);
            g.setColor(map.gateOpen ? new Color(46, 204, 113) : new Color(230, 126, 34));
            g.drawString("Gerbang: " + (map.gateOpen ? "TERBUKA" : "TERKUNCI"), padding + 160, padding + 50);
            g.setColor(new Color(241, 196, 15));
            g.drawString("Waktu AI: " + formatRunTime(runElapsedMs), padding + 15, padding + 74);

            int logCount = 4;
            int logHeight = logCount * 22 + 16;
            int logY = getHeight() - logHeight - padding;
            int logWidth = 360;
            g.setColor(new Color(20, 20, 25, 190));
            g.fillRoundRect(getWidth() - logWidth - padding, logY, logWidth, logHeight, 8, 8);
            g.setColor(new Color(255, 255, 255, 51));
            g.drawRoundRect(getWidth() - logWidth - padding, logY, logWidth, logHeight, 8, 8);

            g.setColor(new Color(224, 224, 224));
            int startX = getWidth() - logWidth - padding + 15;
            int startIdx = Math.max(0, messageLog.size() - logCount);
            for (int i = startIdx; i < messageLog.size(); i++) {
                int displayIdx = i - startIdx;
                g.drawString("> " + messageLog.get(i), startX, logY + 26 + (displayIdx * 22));
            }
        }

        private void renderMinimap(Graphics2D g) {
            int cell = 6;
            int w = map.width * cell;
            int h = map.height * cell;
            int padding = 20;
            int x0 = padding;
            int y0 = getHeight() - h - padding;

            g.setColor(new Color(10, 10, 15, 216));
            g.fillRoundRect(x0 - 6, y0 - 22, w + 12, h + 28, 6, 6);
            g.setColor(new Color(255, 255, 255, 64));
            g.setStroke(new BasicStroke(1));
            g.drawRoundRect(x0 - 6, y0 - 22, w + 12, h + 28, 6, 6);

            g.setColor(new Color(224, 224, 224));
            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 14));
            g.drawString("PETA", x0, y0 - 6);

            for (int y = 0; y < map.height; y++) {
                for (int x = 0; x < map.width; x++) {
                    int t = map.data[y][x];
                    int px = x0 + x * cell;
                    int py = y0 + y * cell;
                    if (t == Constants.TILE_WALL) {
                        g.setColor(new Color(58, 63, 71));
                        g.fillRect(px, py, cell, cell);
                    } else {
                        g.setColor(new Color(26, 26, 31));
                        g.fillRect(px, py, cell, cell);
                        if (t == Constants.TILE_KEY && !map.keyTaken) {
                            g.setColor(new Color(241, 196, 15));
                            g.fillRect(px + 1, py + 1, cell - 2, cell - 2);
                        } else if (t == Constants.TILE_GATE && !map.gateOpen) {
                            g.setColor(new Color(230, 126, 34));
                            g.fillRect(px, py, cell, cell);
                        } else if (t == Constants.TILE_EXIT) {
                            g.setColor(new Color(46, 204, 113));
                            g.fillRect(px, py, cell, cell);
                        } else if (t == Constants.TILE_FIRE) {
                            g.setColor(new Color(231, 76, 60));
                            g.fillRect(px + 1, py + 1, cell - 2, cell - 2);
                        } else if (t == Constants.TILE_ARROW_TRAP) {
                            g.setColor(new Color(52, 73, 94));
                            g.fillRect(px + 1, py + 1, cell - 2, cell - 2);
                        } else if (t == Constants.TILE_MINE) {
                            g.setColor(new Color(44, 62, 80));
                            g.fillRect(px + 1, py + 1, cell - 2, cell - 2);
                            g.setColor(new Color(231, 76, 60));
                            g.fillRect(px + 2, py + 2, cell - 4, cell - 4);
                        }
                    }
                }
            }

            int ppx = (int) (x0 + player.tileX * cell + cell / 2.0);
            int ppy = (int) (y0 + player.tileY * cell + cell / 2.0);
            g.setColor(new Color(52, 152, 219));
            g.fillOval(ppx - 3, ppy - 3, 6, 6);
            g.setColor(Color.WHITE);
            g.drawOval(ppx - 3, ppy - 3, 6, 6);
        }

        private void renderSkillCollection(Graphics2D g) {
            class SkillDef {
                String id;
                String label;
                Color col;
                SkillDef(String id, String label, Color col) {
                    this.id = id;
                    this.label = label;
                    this.col = col;
                }
            }
            List<SkillDef> skillDefs = Arrays.asList(
                new SkillDef("jump", "JUMP", new Color(46, 204, 113)),
                new SkillDef("shield", "SHIELD", new Color(241, 196, 15)),
                new SkillDef("blink", "BLINK", new Color(155, 89, 182))
            );

            int itemW = 52, itemH = 52, gap = 10;
            int panelW = skillDefs.size() * (itemW + gap) - gap + 24;
            int panelH = itemH + 36;
            int panelX = (getWidth() - panelW) / 2;
            int panelY = 16;

            g.setColor(new Color(8, 8, 14, 209));
            g.fillRoundRect(panelX - 4, panelY - 4, panelW + 8, panelH + 8, 8, 8);
            g.setColor(new Color(255, 255, 255, 30));
            g.drawRoundRect(panelX - 4, panelY - 4, panelW + 8, panelH + 8, 8, 8);

            for (int i = 0; i < skillDefs.size(); i++) {
                SkillDef sk = skillDefs.get(i);
                boolean has = player.collectedSkills.contains(sk.id);
                int x = panelX + 12 + i * (itemW + gap);
                int y = panelY + 4;

                if (has) {
                    g.setColor(new Color(sk.col.getRed(), sk.col.getGreen(), sk.col.getBlue(), 45));
                } else {
                    g.setColor(new Color(30, 30, 38, 230));
                }
                g.fillRoundRect(x, y, itemW, itemH, 6, 6);
                g.setColor(has ? sk.col : new Color(42, 42, 54));
                g.setStroke(new BasicStroke(has ? 2 : 1));
                g.drawRoundRect(x, y, itemW, itemH, 6, 6);

                int cx = x + itemW / 2;
                int cy = y + itemH / 2 - 4;
                int gs = 14;

                if (has) {
                    Path2D.Double path = new Path2D.Double();
                    path.moveTo(cx, cy - gs);
                    path.lineTo(cx + gs * 0.72, cy);
                    path.lineTo(cx, cy + gs);
                    path.lineTo(cx - gs * 0.72, cy);
                    path.closePath();
                    g.setColor(sk.col);
                    g.fill(path);
                    g.setColor(new Color(255, 255, 255, 150));
                    g.draw(path);

                    Path2D.Double inner = new Path2D.Double();
                    inner.moveTo(cx, cy - gs * 0.72);
                    inner.lineTo(cx + gs * 0.36, cy - gs * 0.05);
                    inner.lineTo(cx, cy + gs * 0.18);
                    inner.lineTo(cx - gs * 0.36, cy - gs * 0.05);
                    inner.closePath();
                    g.setColor(new Color(255, 255, 255, 71));
                    g.fill(inner);
                } else {
                    g.setColor(new Color(42, 42, 54));
                    g.setStroke(new BasicStroke(1.5f));
                    Path2D.Double path = new Path2D.Double();
                    path.moveTo(cx, cy - 12);
                    path.lineTo(cx + 10, cy);
                    path.lineTo(cx, cy + 12);
                    path.lineTo(cx - 10, cy);
                    path.closePath();
                    g.draw(path);
                }

                g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 11));
                g.setColor(has ? sk.col : new Color(51, 51, 51));
                drawCenteredString(g, sk.label, x + itemW / 2, y + itemH - 2);
            }

            g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 14));
            g.setColor(new Color(46, 204, 113));
            drawCenteredString(g, "3 SKILL SIAP", getWidth() / 2, panelY + panelH + 6);
        }

        private void renderSkillBar(Graphics2D g) {
            class SkillInfo {
                String id;
                String key;
                double cd;
                double maxCd;
                Color col;
                SkillInfo(String id, String key, double cd, double maxCd, Color col) {
                    this.id = id;
                    this.key = key;
                    this.cd = cd;
                    this.maxCd = maxCd;
                    this.col = col;
                }
            }

            List<SkillInfo> skills = Arrays.asList(
                new SkillInfo("jump", "1", player.cdJump, 2000.0, new Color(46, 204, 113)),
                new SkillInfo("blink", "2", player.cdBlink, 4000.0, new Color(155, 89, 182)),
                new SkillInfo("shield", "3", player.cdShield, 6000.0, new Color(241, 196, 15))
            );

            int w = 60, h = 60, gap = 15;
            int totalW = (w + gap) * skills.size() - gap;
            int startX = (getWidth() - totalW) / 2;
            int y = getHeight() - 90;

            for (SkillInfo sk : skills) {
                boolean collected = player.collectedSkills.contains(sk.id);
                double cd = sk.cd;
                double maxCd = sk.maxCd;
                double ratio = cd / maxCd;

                g.setColor(collected ? new Color(0, 0, 0, 180) : new Color(10, 10, 15, 216));
                g.fillRoundRect(startX, y, w, h, 8, 8);

                if (collected) {
                    g.setColor(cd > 0 ? Constants.COLOR_SKILL_COOLDOWN : Constants.COLOR_SKILL_READY);
                } else {
                    g.setColor(new Color(51, 51, 51));
                }
                g.setStroke(new BasicStroke(2));
                g.drawRoundRect(startX, y, w, h, 8, 8);

                if (collected && cd > 0) {
                    g.setColor(new Color(231, 76, 60, 76));
                    int fillH = (int) (h * ratio);
                    g.fillRect(startX, y + h - fillH, w, fillH);
                }

                if (!collected) {
                    g.setColor(new Color(51, 51, 51));
                    g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 22));
                    drawCenteredString(g, "LOCK", startX + w / 2, y + h / 2 + 8);
                } else {
                    g.setColor(sk.col);
                    g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 20));
                    drawCenteredString(g, sk.key, startX + w / 2, y + h / 2 + 7);
                }

                g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
                g.setColor(collected ? sk.col : new Color(51, 51, 51));
                drawCenteredString(g, sk.id.toUpperCase(), startX + w / 2, y + h + 15);

                startX += w + gap;
            }
        }

        private void drawCenteredString(Graphics2D g, String text, int x, int y) {
            FontMetrics metrics = g.getFontMetrics(g.getFont());
            int xx = x - metrics.stringWidth(text) / 2;
            int yy = y - metrics.getHeight() / 2 + metrics.getAscent();
            g.drawString(text, xx, yy);
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            ArthurGame game = new ArthurGame();
            game.setVisible(true);
        });
    }
}
