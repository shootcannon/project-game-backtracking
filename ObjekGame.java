





import java.awt.Graphics2D;



public abstract class ObjekGame {
    
    
    public double x;
    public double y;

    
    
    public ObjekGame(double x, double y) {
        this.x = x;
        this.y = y;
    }

    
    
    public abstract void update(double dt);
    public abstract void gambar(Graphics2D g2);

    
    public double getX() {
        return this.x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return this.y;
    }

    public void setY(double y) {
        this.y = y;
    }
}
