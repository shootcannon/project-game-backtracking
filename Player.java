import java.awt.*;
import java.awt.geom.*;
import java.util.*;
import java.util.List;

public class Player {
    // Posisi dalam pixel
    public double px, py;
    // Posisi dalam koordinat tile
    public int tileX, tileY;
    
    public double speed = 180.0;
    public double moveSpeedMult = 1.0;
    
    // Pathfinding
    public List<Point> path;
    public int pathIndex = 0;
    
    // Skill state (durasi aktif dalam ms)
    public double activeJump = 0;
    public double activeShield = 0;
    public double activeBlink = 0;
    
    // Cooldown skill (sisa waktu dalam ms)
    public double cdJump = 0;
    public double cdShield = 0;
    public double cdBlink = 0;
    
    // Koleksi skill yang dimiliki
    public Set<String> collectedSkills = new HashSet<>();
    
    public Player(int startTileX, int startTileY) {
        this.tileX = startTileX;
        this.tileY = startTileY;
        this.px = startTileX * Constants.TILE_SIZE;
        this.py = startTileY * Constants.TILE_SIZE;
        
        // Arthur memulai dengan semua skill di game ini
        collectedSkills.add("jump");
        collectedSkills.add("shield");
        collectedSkills.add("blink");
    }

    public void setPath(List<Point> newPath) {
        this.path = newPath;
        this.pathIndex = 0;
    }

    public boolean isInvulnerable() {
        return activeShield > 0 || activeJump > 0;
    }

    public Point currentTargetTile() {
        if (path == null || pathIndex >= path.size()) return null;
        return path.get(pathIndex);
    }

    public void update(double dt) {
        // Update Cooldowns
        if (cdJump > 0) cdJump -= dt;
        if (cdShield > 0) cdShield -= dt;
        if (cdBlink > 0) cdBlink -= dt;
        
        // Update Active States
        if (activeJump > 0) activeJump -= dt;
        if (activeShield > 0) activeShield -= dt;
        if (activeBlink > 0) activeBlink -= dt;

        // Logika Pergerakan AI mengikuti Path
        if (path != null && pathIndex < path.size()) {
            Point target = path.get(pathIndex);
            double targetX = target.x * Constants.TILE_SIZE;
            double targetY = target.y * Constants.TILE_SIZE;
            
            double dx = targetX - px;
            double dy = targetY - py;
            double dist = Math.sqrt(dx * dx + dy * dy);
            
            double step = speed * moveSpeedMult * (dt / 1000.0);
            
            if (dist <= step) {
                // Sampai di tile target
                px = targetX;
                py = targetY;
                tileX = target.x;
                tileY = target.y;
                pathIndex++;
            } else {
                // Bergerak menuju tile target
                px += (dx / dist) * step;
                py += (dy / dist) * step;
                tileX = (int) Math.round(px / Constants.TILE_SIZE);
                tileY = (int) Math.round(py / Constants.TILE_SIZE);
            }
        }
    }

    public void draw(Graphics2D g2, long time) {
        int ts = Constants.TILE_SIZE;
        double drawX = px;
        double drawY = py;
        
        // Visual Efek: Jump (Membuat karakter terlihat melompat/membesar)
        double jumpOffset = 0;
        double scale = 1.0;
        if (activeJump > 0) {
            // Parabola sederhana untuk tinggi lompatan
            jumpOffset = Math.sin(Math.PI * (activeJump / 450.0)) * 15;
            scale = 1.2;
            drawY -= jumpOffset;
            
            // Gambar bayangan saat melompat
            g2.setColor(new Color(0, 0, 0, 100));
            g2.fillOval((int)px + 8, (int)py + ts - 10, ts - 16, 8);
        }

        // Efek Visual: Shield (Lingkaran pelindung)
        if (activeShield > 0) {
            float alpha = (float) (0.3 + 0.2 * Math.sin(time / 100.0));
            g2.setColor(new Color(241, 196, 15, (int)(alpha * 255)));
            g2.fillOval((int)px - 5, (int)drawY - 5, ts + 10, ts + 10);
            g2.setStroke(new BasicStroke(2));
            g2.setColor(new Color(241, 196, 15));
            g2.drawOval((int)px - 5, (int)drawY - 5, ts + 10, ts + 10);
        }

        // Efek Visual: Blink (Bayangan trail)
        if (activeBlink > 0) {
            g2.setColor(new Color(155, 89, 182, 150));
            g2.fillRect((int)px + 5, (int)drawY + 5, ts - 10, ts - 10);
        }

        // Body Karakter Arthur (Bentuk Diamond/Berlian)
        Path2D.Double body = new Path2D.Double();
        body.moveTo(drawX + ts / 2.0, drawY + 4); // Atas
        body.lineTo(drawX + ts - 4, drawY + ts / 2.0); // Kanan
        body.lineTo(drawX + ts / 2.0, drawY + ts - 4); // Bawah
        body.lineTo(drawX + 4, drawY + ts / 2.0); // Kiri
        body.closePath();

        // Warna dasar Arthur
        g2.setColor(new Color(52, 152, 219)); // Biru cerah
        g2.fill(body);
        
        // Outline
        g2.setStroke(new BasicStroke(2));
        g2.setColor(Color.WHITE);
        g2.draw(body);

        // Ornamen Mata/Inti Arthur
        g2.setColor(Color.WHITE);
        int eyeSize = (int)(4 * scale);
        g2.fillOval((int)(drawX + ts/2.0 - eyeSize/2.0), (int)(drawY + ts/2.0 - eyeSize/2.0), eyeSize, eyeSize);

        // Gambar path yang sedang diikuti (Opsional untuk Debug/Visual AI)
        if (path != null && pathIndex < path.size()) {
            g2.setStroke(new BasicStroke(1f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_BEVEL, 0, new float[]{5}, 0));
            g2.setColor(new Color(255, 255, 255, 100));
            for (int i = pathIndex; i < path.size() - 1; i++) {
                Point p1 = path.get(i);
                Point p2 = path.get(i + 1);
                g2.drawLine(p1.x * ts + ts/2, p1.y * ts + ts/2, p2.x * ts + ts/2, p2.y * ts + ts/2);
            }
        }
    }
}