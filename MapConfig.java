






public class MapConfig {
    
    public String name;
    public int width;
    public int height;
    public double obstacleDensity;
    public String description;

    
    public MapConfig(String name, int width, int height, double obstacleDensity, String description) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.obstacleDensity = obstacleDensity;
        this.description = description;
    }
}
