




import java.awt.*;
import java.awt.geom.*;
import java.util.*;
import java.util.List;



public class Player extends ObjekGame {
    
    
    public double px, py;
    public int tileX, tileY;
    
    public double speed = 180.0;
    public double moveSpeedMult = 1.0;
    
    
    public List<Point> path;
    public int pathIndex = 0;
    
    
    public double activeJump = 0;
    public double activeShield = 0;
    public double activeBlink = 0;
    
    
    public double cdJump = 0;
    public double cdShield = 0;
    public double cdBlink = 0;
    
    
    
    public Set<String> collectedSkills = new HashSet<>();
    
    
    public Player(int startTileX, int startTileY) {
        
        super(startTileX * Constants.TILE_SIZE, startTileY * Constants.TILE_SIZE);
        
        this.tileX = startTileX;
        this.tileY = startTileY;
        this.px = startTileX * Constants.TILE_SIZE;
        this.py = startTileY * Constants.TILE_SIZE;
        
        
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

    
    
    @Override
    public void update(double dt) {
        
        if (cdJump > 0) cdJump -= dt;
        if (cdShield > 0) cdShield -= dt;
        if (cdBlink > 0) cdBlink -= dt;
        
        
        if (activeJump > 0) activeJump -= dt;
        if (activeShield > 0) activeShield -= dt;
        if (activeBlink > 0) activeBlink -= dt;

        
        if (path != null && pathIndex < path.size()) {
            Point target = path.get(pathIndex);
            double targetX = target.x * Constants.TILE_SIZE;
            double targetY = target.y * Constants.TILE_SIZE;
            
            double dx = targetX - px;
            double dy = targetY - py;
            
            
            double dist = Math.sqrt(dx * dx + dy * dy);
            
            double step = speed * moveSpeedMult * (dt / 1000.0);
            
            if (dist <= step) {
                
                px = targetX;
                py = targetY;
                tileX = target.x;
                tileY = target.y;
                pathIndex++;
            } else {
                
                px += (dx / dist) * step;
                py += (dy / dist) * step;
                tileX = (int) Math.round(px / Constants.TILE_SIZE);
                tileY = (int) Math.round(py / Constants.TILE_SIZE);
            }
        }
        
        
        this.x = px;
        this.y = py;
    }

    
    
    @Override
    public void gambar(Graphics2D g2) {
        
        gambar(g2, System.currentTimeMillis());
    }

    
    public void draw(Graphics2D g2, long time) {
        gambar(g2, time);
    }

    
    
    public void gambar(Graphics2D g2, long time) {
        int ts = Constants.TILE_SIZE;
        double drawX = px;
        double drawY = py;
        
        
        double jumpOffset = 0;
        double scale = 1.0;
        if (activeJump > 0) {
            
            jumpOffset = Math.sin(Math.PI * (activeJump / 450.0)) * 15;
            scale = 1.2;
            drawY -= jumpOffset;
            
            
            g2.setColor(new Color(0, 0, 0, 100));
            g2.fillOval((int)px + 8, (int)py + ts - 10, ts - 16, 8);
        }

        
        if (activeShield > 0) {
            float alpha = (float) (0.3 + 0.2 * Math.sin(time / 100.0));
            g2.setColor(new Color(241, 196, 15, (int)(alpha * 255)));
            g2.fillOval((int)px - 5, (int)drawY - 5, ts + 10, ts + 10);
            g2.setStroke(new BasicStroke(2));
            g2.setColor(new Color(241, 196, 15));
            g2.drawOval((int)px - 5, (int)drawY - 5, ts + 10, ts + 10);
        }

        
        if (activeBlink > 0) {
            g2.setColor(new Color(155, 89, 182, 150));
            g2.fillRect((int)px + 5, (int)drawY + 5, ts - 10, ts - 10);
        }

        
        Path2D.Double body = new Path2D.Double();
        body.moveTo(drawX + ts / 2.0, drawY + 4); 
        body.lineTo(drawX + ts - 4, drawY + ts / 2.0); 
        body.lineTo(drawX + ts / 2.0, drawY + ts - 4); 
        body.lineTo(drawX + 4, drawY + ts / 2.0); 
        body.closePath();

        
        g2.setColor(new Color(52, 152, 219));
        g2.fill(body);
        
        
        g2.setStroke(new BasicStroke(2));
        g2.setColor(Color.WHITE);
        g2.draw(body);

        
        g2.setColor(Color.WHITE);
        int eyeSize = (int)(4 * scale);
        g2.fillOval((int)(drawX + ts/2.0 - eyeSize/2.0), (int)(drawY + ts/2.0 - eyeSize/2.0), eyeSize, eyeSize);

        
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