




import java.awt.Color;
import java.awt.Graphics2D;




public class Particle extends ObjekGame {
    public String text;
    public Color color;
    public double life;
    public double dy;

    
    public Particle(String text, double x, double y, Color color) {
        super(x, y); 
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.dy = -1.0;
    }

    
    
    public Particle() {
        super(0, 0);
        this.text = "";
        this.color = Color.WHITE;
        this.life = 1.0;
        this.dy = -1.0;
    }

    
    @Override
    public void update(double dt) {
        
        this.life -= dt / 1000.0;
        
        this.y += this.dy * (dt / 16.0);
    }

    
    @Override
    public void gambar(Graphics2D g2) {
        
        
    }
}
