




import java.awt.*;
import java.util.ArrayList;
import java.util.List;



public class ParticleSystem {
    
    private final List<Particle> particles = new ArrayList<>();

    
    public void addText(String text, double x, double y, Color color) {
        
        Particle p = new Particle();
        p.text = text;
        p.x = x;
        p.y = y;
        p.color = color;
        p.life = 1.0; 
        p.dy = -1.0;  
        
        
        particles.add(p);
    }

    
    public void updateAndDraw(Graphics2D g, double dt) {
        
        
        
        for (int i = particles.size() - 1; i >= 0; i--) {
            Particle p = particles.get(i);
            
            
            p.update(dt);

            
            if (p.life <= 0) {
                particles.remove(i); 
                continue; 
            }

            
            Composite oldComp = g.getComposite();
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) Math.max(0.0, p.life)));

            
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 24));
            g.setColor(Color.BLACK);
            g.drawString(p.text, (int) p.x - 1, (int) p.y - 1);
            g.drawString(p.text, (int) p.x + 1, (int) p.y - 1);
            g.drawString(p.text, (int) p.x - 1, (int) p.y + 1);
            g.drawString(p.text, (int) p.x + 1, (int) p.y + 1);

            
            g.setColor(p.color);
            g.drawString(p.text, (int) p.x, (int) p.y);

            
            g.setComposite(oldComp);
        }
    }
}
