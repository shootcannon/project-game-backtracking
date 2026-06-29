




import java.awt.*;
import java.awt.geom.*;
import java.util.*;
import java.util.List;



public class GameMap {
    public int width;
    public int height;
    public int[][] data;
    public int startX = 1;
    public int startY = 1;
    public int exitX;
    public int exitY;
    public int keyX = 0;
    public int keyY = 0;
    public int gateX = 0;
    public int gateY = 0;
    public int gateApproachX = 1;
    public int gateApproachY = 1;
    public boolean gateOpen = false;
    public boolean keyTaken = false;
    public double obstacleDensity;

    
    public GameMap(int width, int height, double obstacleDensity) {
        
        if (width % 2 == 0) width++;
        if (height % 2 == 0) height++;
        this.width = width;
        this.height = height;
        this.data = new int[height][width];
        this.exitX = width - 2;
        this.exitY = height - 2;
        this.obstacleDensity = obstacleDensity;
        
        
        generateMap();
    }

    
    public void generateMap() {
        Random random = new Random();
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                data[y][x] = Constants.TILE_WALL;
            }
        }

        
        List<Point> stack = new ArrayList<>();
        stack.add(new Point(startX, startY));
        data[startY][startX] = Constants.TILE_FLOOR; 

        while (!stack.isEmpty()) {
            Point curr = stack.get(stack.size() - 1);
            List<Point[]> neighbors = new ArrayList<>();
            int[][] dirs = {{0, -2}, {2, 0}, {0, 2}, {-2, 0}}; 
            
            for (int[] d : dirs) {
                int nx = curr.x + d[0];
                int ny = curr.y + d[1];
                
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && data[ny][nx] == Constants.TILE_WALL) {
                    neighbors.add(new Point[]{new Point(nx, ny), new Point(d[0], d[1])});
                }
            }
            
            if (neighbors.isEmpty()) {
                
                stack.remove(stack.size() - 1);
                continue;
            }
            
            
            Point[] chosen = neighbors.get(random.nextInt(neighbors.size()));
            Point next = chosen[0];
            Point dir = chosen[1];
            
            
            data[curr.y + dir.y / 2][curr.x + dir.x / 2] = Constants.TILE_FLOOR;
            data[next.y][next.x] = Constants.TILE_FLOOR;
            
            stack.add(next); 
        }

        
        data[exitY][exitX] = Constants.TILE_EXIT;

        
        List<Point> path = findPath(startX, startY, exitX, exitY, true, false);
        if (path != null && path.size() >= 8) {
            int gateIdx = Math.max(2, (int) (path.size() * 0.55));
            Point gp = path.get(gateIdx);
            gateX = gp.x;
            gateY = gp.y;
            Point gap = path.get(gateIdx - 1);
            gateApproachX = gap.x;
            gateApproachY = gap.y;
            data[gateY][gateX] = Constants.TILE_GATE;

            
            boolean[][] reachable = floodFromStartAvoidingGate();
            Point bestKey = null;
            int bestDist = -1;
            
            for (int y = 1; y < height - 1; y++) {
                for (int x = 1; x < width - 1; x++) {
                    if (!reachable[y][x]) continue;
                    if (data[y][x] != Constants.TILE_FLOOR) continue;
                    if (x == startX && y == startY) continue;
                    final int fx = x;
                    final int fy = y;
                    boolean onSolution = false;
                    for (Point p : path) {
                        if (p.x == fx && p.y == fy) {
                            onSolution = true;
                            break;
                        }
                    }
                    if (onSolution) continue;
                    
                    int d = Math.abs(x - startX) + Math.abs(y - startY);
                    if (d > bestDist) {
                        bestDist = d;
                        bestKey = new Point(x, y);
                    }
                }
            }
            
            
            if (bestKey == null) {
                for (int y = 1; y < height - 1; y++) {
                    for (int x = 1; x < width - 1; x++) {
                        if (reachable[y][x] && data[y][x] == Constants.TILE_FLOOR && !(x == startX && y == startY)) {
                            bestKey = new Point(x, y);
                            break;
                        }
                    }
                    if (bestKey != null) break;
                }
            }
            
            if (bestKey != null) {
                keyX = bestKey.x;
                keyY = bestKey.y;
                data[keyY][keyX] = Constants.TILE_KEY;
            }
        }

        
        List<Point> floorTiles = new ArrayList<>();
        for (int y = 1; y < height - 1; y++) {
            for (int x = 1; x < width - 1; x++) {
                if (data[y][x] == Constants.TILE_FLOOR) {
                    floorTiles.add(new Point(x, y));
                }
            }
        }

        List<Point> nonCritical = new ArrayList<>();
        for (Point p : floorTiles) {
            
            if ((p.x == startX && p.y == startY) || (p.x == keyX && p.y == keyY) || (p.x == gateX && p.y == gateY) || (p.x == exitX && p.y == exitY)) {
                continue;
            }
            nonCritical.add(p);
        }

        int numObstacles = (int) (nonCritical.size() * obstacleDensity);
        for (int i = 0; i < numObstacles; i++) {
            if (nonCritical.isEmpty()) break;
            Point op = nonCritical.remove(random.nextInt(nonCritical.size()));
            double rand = random.nextDouble();
            if (rand < 0.33) {
                data[op.y][op.x] = Constants.TILE_FIRE;
            } else if (rand < 0.66) {
                data[op.y][op.x] = Constants.TILE_ARROW_TRAP;
            } else {
                data[op.y][op.x] = Constants.TILE_MINE;
            }
        }
    }

    
    
    public List<Point> findPath(int sx, int sy, int ex, int ey, boolean gateBlocks, boolean avoidLethal) {
        Set<String> visited = new HashSet<>();
        visited.add(sx + "," + sy);
        List<Point> path = new ArrayList<>();
        path.add(new Point(sx, sy));
        
        
        if (backtrack(sx, sy, ex, ey, gateBlocks, avoidLethal, visited, path)) {
            return path;
        }
        return null;
    }

    
    public boolean backtrack(int cx, int cy, int ex, int ey, boolean gateBlocks, boolean avoidLethal, Set<String> visited, List<Point> path) {
        
        if (cx == ex && cy == ey) {
            return true;
        }
        
        
        List<Point> dirs = buildPrioritas(cx, cy, ex, ey);
        for (Point d : dirs) {
            int nx = cx + d.x;
            int ny = cy + d.y;
            
            
            if (isValid(nx, ny, gateBlocks, avoidLethal, visited)) {
                
                visited.add(nx + "," + ny);
                path.add(new Point(nx, ny));
                
                
                if (backtrack(nx, ny, ex, ey, gateBlocks, avoidLethal, visited, path)) {
                    return true;
                }
                
                
                path.remove(path.size() - 1);
                visited.remove(nx + "," + ny);
            }
        }
        return false; 
    }

    
    public boolean isValid(int nx, int ny, boolean gateBlocks, boolean avoidLethal, Set<String> visited) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;
        if (data[ny][nx] == Constants.TILE_WALL) return false;
        if (gateBlocks && data[ny][nx] == Constants.TILE_GATE && !gateOpen) return false;
        if (avoidLethal && isLethal(nx, ny)) return false;
        return !visited.contains(nx + "," + ny);
    }

    
    public List<Point> buildPrioritas(int cx, int cy, int ex, int ey) {
        List<Point> dirs = new ArrayList<>();
        dirs.add(new Point(0, -1)); 
        dirs.add(new Point(1, 0));  
        dirs.add(new Point(0, 1));  
        dirs.add(new Point(-1, 0)); 
        
        
        dirs.sort((a, b) -> {
            int distA = Math.abs((cx + a.x) - ex) + Math.abs((cy + a.y) - ey);
            int distB = Math.abs((cx + b.x) - ex) + Math.abs((cy + b.y) - ey);
            return Integer.compare(distA, distB);
        });
        return dirs;
    }

    
    
    public boolean[][] floodFromStartAvoidingGate() {
        boolean[][] visited = new boolean[height][width];
        Queue<Point> queue = new LinkedList<>();
        queue.add(new Point(startX, startY));
        visited[startY][startX] = true;
        
        while (!queue.isEmpty()) {
            Point curr = queue.poll();
            int[][] dirs = {{0, -1}, {1, 0}, {0, 1}, {-1, 0}};
            for (int[] d : dirs) {
                int nx = curr.x + d[0];
                int ny = curr.y + d[1];
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                if (visited[ny][nx]) continue;
                if (data[ny][nx] == Constants.TILE_WALL || data[ny][nx] == Constants.TILE_GATE || isLethal(nx, ny)) continue;
                visited[ny][nx] = true;
                queue.add(new Point(nx, ny));
            }
        }
        return visited;
    }

    
    public boolean isLethal(int x, int y) {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        int t = data[y][x];
        return t == Constants.TILE_FIRE || t == Constants.TILE_ARROW_TRAP || t == Constants.TILE_MINE;
    }

    
    public boolean pickUpKey(int x, int y) {
        if (x == keyX && y == keyY && !keyTaken) {
            keyTaken = true;
            data[y][x] = Constants.TILE_FLOOR; 
            return true;
        }
        return false;
    }

    
    public boolean tryOpenGate(int x, int y, boolean allSkillsReady) {
        if (x == gateX && y == gateY && keyTaken && allSkillsReady && !gateOpen) {
            gateOpen = true;
            return true;
        }
        return false;
    }

    
    public boolean isExit(int x, int y) {
        return x == exitX && y == exitY;
    }

    
    public void draw(Graphics2D g, double camX, double camY, int screenW, int screenH, long time) {
        
        int startCol = Math.max(0, (int) Math.floor(camX / Constants.TILE_SIZE));
        int endCol = Math.min(width - 1, startCol + (int) Math.ceil(screenW / (double) Constants.TILE_SIZE) + 1);
        int startRow = Math.max(0, (int) Math.floor(camY / Constants.TILE_SIZE));
        int endRow = Math.min(height - 1, startRow + (int) Math.ceil(screenH / (double) Constants.TILE_SIZE) + 1);

        for (int y = startRow; y <= endRow; y++) {
            for (int x = startCol; x <= endCol; x++) {
                int px = x * Constants.TILE_SIZE;
                int py = y * Constants.TILE_SIZE;
                int t = data[y][x];

                if (t == Constants.TILE_WALL) {
                    
                    g.setColor(Constants.COLOR_WALL_BASE);
                    g.fillRect(px, py, Constants.TILE_SIZE, Constants.TILE_SIZE);
                    g.setColor(Constants.COLOR_WALL_TOP);
                    g.fillRect(px, py, Constants.TILE_SIZE, Constants.TILE_SIZE / 4);
                    g.setColor(Constants.COLOR_WALL_BRICK);
                    g.setStroke(new BasicStroke(2));
                    g.drawRect(px, py, Constants.TILE_SIZE, Constants.TILE_SIZE);
                    g.draw(new Line2D.Double(px, py + Constants.TILE_SIZE / 2.0, px + Constants.TILE_SIZE, py + Constants.TILE_SIZE / 2.0));
                } else {
                    
                    g.setColor(Constants.COLOR_FLOOR_BASE);
                    g.fillRect(px, py, Constants.TILE_SIZE, Constants.TILE_SIZE);
                    
                    if ((x * 13 + y * 7) % 5 == 0) {
                        g.setColor(Constants.COLOR_FLOOR_DETAIL);
                        g.fillRect(px + Constants.TILE_SIZE / 4, py + Constants.TILE_SIZE / 4, 6, 6);
                    }

                    
                    if (t == Constants.TILE_KEY && !keyTaken) {
                        double bob = Math.sin(time / 300.0) * 4;
                        double cx = px + Constants.TILE_SIZE / 2.0;
                        double cy = py + Constants.TILE_SIZE / 2.0 + bob;

                        
                        g.setColor(new Color(241, 196, 15, 64));
                        g.fillOval((int) cx - 18, (int) cy - 18, 36, 36);

                        
                        g.setColor(new Color(241, 196, 15));
                        g.fillOval((int) cx - 12, (int) (cy - 6), 12, 12);
                        g.setColor(Constants.COLOR_FLOOR_BASE);
                        g.fillOval((int) cx - 9, (int) (cy - 3), 6, 6);

                        g.setColor(new Color(241, 196, 15));
                        g.fillRect((int) cx - 2, (int) cy - 2, 14, 4);
                        g.fillRect((int) cx + 8, (int) cy + 2, 3, 4);
                        g.fillRect((int) cx + 4, (int) cy + 2, 3, 3);
                    }
                    
                    else if (t == Constants.TILE_GATE && !gateOpen) {
                        g.setColor(new Color(26, 17, 8));
                        g.fillRect(px, py, Constants.TILE_SIZE, Constants.TILE_SIZE);
                        g.setColor(new Color(62, 39, 37));
                        for (int i = 0; i < 4; i++) {
                            g.fillRect(px + 4 + i * 14, py + 4, 12, Constants.TILE_SIZE - 8);
                        }
                        g.setColor(new Color(127, 140, 141));
                        g.fillRect(px + 6, py + 16, Constants.TILE_SIZE - 12, 4);
                        g.fillRect(px + 6, py + Constants.TILE_SIZE - 20, Constants.TILE_SIZE - 12, 4);
                        
                        g.setColor(new Color(241, 196, 15));
                        g.fillOval(px + Constants.TILE_SIZE / 2 - 5, py + Constants.TILE_SIZE / 2 - 5, 10, 10);
                        g.setColor(Color.BLACK);
                        g.fillRect(px + Constants.TILE_SIZE / 2 - 1, py + Constants.TILE_SIZE / 2 - 1, 2, 4);
                    }
                    
                    else if (t == Constants.TILE_EXIT) {
                        double pulse = 0.4 + Math.sin(time / 200.0) * 0.2;
                        g.setColor(new Color(46, 204, 113, (int) (pulse * 255)));
                        g.fillRect(px, py, Constants.TILE_SIZE, Constants.TILE_SIZE);
                        g.setColor(new Color(46, 204, 113));
                        g.setStroke(new BasicStroke(3));
                        g.drawRect(px + 6, py + 6, Constants.TILE_SIZE - 12, Constants.TILE_SIZE - 12);
                        g.setColor(Color.WHITE);
                        g.setFont(new Font(Font.MONOSPACED, Font.BOLD, 22));
                        FontMetrics metrics = g.getFontMetrics(g.getFont());
                        int tx = px + (Constants.TILE_SIZE - metrics.stringWidth("EXIT")) / 2;
                        int ty = py + ((Constants.TILE_SIZE - metrics.getHeight()) / 2) + metrics.getAscent();
                        g.drawString("EXIT", tx, ty);
                    }
                    
                    else if (t == Constants.TILE_FIRE) {
                        double pulse = 0.5 + Math.sin(time / 150.0) * 0.5;
                        g.setColor(new Color(231, 76, 60, (int) (pulse * 255)));
                        g.fillRect(px, py, Constants.TILE_SIZE, Constants.TILE_SIZE);
                        g.setColor(new Color(241, 196, 15, (int) (pulse * 204)));
                        
                        Path2D.Double flame = new Path2D.Double();
                        flame.moveTo(px + Constants.TILE_SIZE / 2.0, py + Constants.TILE_SIZE / 4.0);
                        flame.lineTo(px + Constants.TILE_SIZE / 4.0, py + Constants.TILE_SIZE * 3.0 / 4.0);
                        flame.lineTo(px + Constants.TILE_SIZE * 3.0 / 4.0, py + Constants.TILE_SIZE * 3.0 / 4.0);
                        flame.closePath();
                        g.fill(flame);
                        
                        g.setColor(new Color(255, 165, 0, (int) (pulse * 153)));
                        g.fillOval(px + Constants.TILE_SIZE / 2 - Constants.TILE_SIZE / 8, (int) (py + Constants.TILE_SIZE * 0.7 - Constants.TILE_SIZE / 8), Constants.TILE_SIZE / 4, Constants.TILE_SIZE / 4);
                    }
                    
                    else if (t == Constants.TILE_ARROW_TRAP) {
                        g.setColor(new Color(52, 73, 94));
                        g.fillRect(px, py, Constants.TILE_SIZE, Constants.TILE_SIZE);
                        g.setColor(new Color(127, 140, 141));
                        g.setStroke(new BasicStroke(2));
                        
                        Path2D.Double arrow = new Path2D.Double();
                        arrow.moveTo(px + Constants.TILE_SIZE / 4.0, py + Constants.TILE_SIZE / 4.0);
                        arrow.lineTo(px + Constants.TILE_SIZE / 2.0, py + Constants.TILE_SIZE / 8.0);
                        arrow.lineTo(px + Constants.TILE_SIZE * 3.0 / 4.0, py + Constants.TILE_SIZE / 4.0);
                        arrow.moveTo(px + Constants.TILE_SIZE / 2.0, py + Constants.TILE_SIZE / 8.0);
                        arrow.lineTo(px + Constants.TILE_SIZE / 2.0, py + Constants.TILE_SIZE * 7.0 / 8.0);
                        arrow.moveTo(px + Constants.TILE_SIZE / 4.0, py + Constants.TILE_SIZE * 3.0 / 4.0);
                        arrow.lineTo(px + Constants.TILE_SIZE / 2.0, py + Constants.TILE_SIZE * 7.0 / 8.0);
                        arrow.lineTo(px + Constants.TILE_SIZE * 3.0 / 4.0, py + Constants.TILE_SIZE * 3.0 / 4.0);
                        g.draw(arrow);
                    }
                    
                    else if (t == Constants.TILE_MINE) {
                        g.setColor(new Color(44, 62, 80));
                        g.fillOval(px + Constants.TILE_SIZE / 2 - 12, py + Constants.TILE_SIZE / 2 - 12, 24, 24);
                        g.setColor(new Color(231, 76, 60));
                        g.fillOval(px + Constants.TILE_SIZE / 2 - 4, py + Constants.TILE_SIZE / 2 - 4, 8, 8);
                        
                        
                        if ((time / 400) % 2 == 0) {
                            g.setColor(new Color(231, 76, 60));
                            g.setStroke(new BasicStroke(2));
                            g.drawRect(px + 10, py + 10, Constants.TILE_SIZE - 20, Constants.TILE_SIZE - 20);
                        }
                    }
                }
            }
        }
    }
}
