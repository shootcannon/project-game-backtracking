# Arthur — Labirin Kuno / Ancient Maze

```
 █████╗  █████╗ ██████╗
██╔══██╗██╔══██╗██╔══██╗
███████║███████║██████╔╝
██╔══██║██╔══██║██╔══██╗
██║  ██║██║  ██║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
  Arthur's Ancient Ruins
```

> **Sebuah game labirin 2D berbasis browser** — navigasi labirin yang dihasilkan secara prosedural, kumpulkan skill, hindari jebakan, dan temukan jalan keluar.
>
> **A procedurally-generated 2D browser maze game** — navigate the labyrinth, collect skills, dodge traps, and find the exit.

![Platform](https://img.shields.io/badge/Platform-Browser-blue)
![Language](https://img.shields.io/badge/Language-Vanilla%20JS-yellow)
![No Build](https://img.shields.io/badge/Build-None%20Required-green)

---

## Daftar Isi / Table of Contents

- [Instalasi](#instalasi--installation)
- [Cara Memainkan](#cara-memainkan--how-to-play)
- [Peta & Mode](#peta--map-modes)
- [Jenis Tile](#jenis-tile--tile-types)
- [Rintangan & Bahaya](#rintangan--hazards)
- [Skill](#skill)
- [Sistem Backtracking](#sistem-backtracking--maze-generation)
- [HUD & UI](#hud--ui)

---

## Instalasi / Installation

### Indonesia

Game ini berjalan langsung di browser — tidak ada dependency, tidak ada build step. Karena menggunakan **ES Modules**, kamu perlu menjalankannya melalui **local server** (bukan buka file langsung).

**Cara 1 — Node.js `serve`** *(direkomendasikan)*
```bash
# Install sekali saja
npm install -g serve

# Jalankan dari folder game
serve .
# Buka http://localhost:3000
```

**Cara 2 — Python**
```bash
python3 -m http.server 8000
# Buka http://localhost:8000
```

**Cara 3 — VS Code**
Install ekstensi **Live Server**, klik kanan `index.html` → *Open with Live Server*.

---

### English

This game runs directly in the browser — no dependencies, no build step. Because it uses **ES Modules**, you must serve it through a **local server** (not opened as a raw file).

**Option 1 — Node.js `serve`** *(recommended)*
```bash
# Install once
npm install -g serve

# Run from the game folder
serve .
# Open http://localhost:3000
```

**Option 2 — Python**
```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

**Option 3 — VS Code**
Install the **Live Server** extension, right-click `index.html` → *Open with Live Server*.

---

## Cara Memainkan / How to Play

### Indonesia

#### Tujuan
Bantu **Arthur** keluar dari labirin kuno! Jalur keluar diblokir oleh **Gerbang Besi** yang hanya bisa dibuka jika kamu telah:

1. Mengumpulkan **4 Skill Gem** (tersebar di labirin)
2. Menemukan **Kunci** (tile kuning beranimasi)
3. Mendatangi **Gerbang** dengan kunci + semua skill
4. Berlari menuju **EXIT** (tile hijau berdenyut)

#### Kontrol

| Tombol | Fungsi |
|--------|--------|
| `Arrow` / `↑↓` | Navigasi pilihan map |
| `Space` / `Enter` | Mulai game / Lanjut dialog |
| `ESC` | Pause / Resume |
| `R` | Restart (dari layar mati/menang/pause) |
| `1` | Aktifkan skill **Jump** (jika sudah dikumpulkan) |
| `2` | Aktifkan skill **Dash** |
| `3` | Aktifkan skill **Shield** |
| `4` | Aktifkan skill **Blink** |
| `5` | Aktifkan skill **Slow** |

#### AI Auto-Navigate
Arthur bergerak **otomatis** mengikuti pathfinding BFS. AI secara cerdas:
- Mencari rute teraman menghindari jebakan
- Mengaktifkan skill **secara otomatis** saat mendekati bahaya
- Memprioritaskan: Skill Gem → Kunci → Gerbang → EXIT

Kamu tetap bisa **override** skill secara manual kapan saja!

#### Urutan Prioritas AI
```
[1] Kumpulkan Skill Gem yang belum diambil
[2] Ambil Kunci
[3] Buka Gerbang (butuh semua skill + kunci)
[4] Lari ke EXIT
```

---

### English

#### Objective
Help **Arthur** escape the ancient maze! The exit is blocked by an **Iron Gate** that only opens when you have:

1. Collected all **4 Skill Gems** (scattered across the maze)
2. Found the **Key** (animated yellow tile)
3. Reached the **Gate** with the key + all skills
4. Ran to the **EXIT** (pulsing green tile)

#### Controls

| Key | Action |
|-----|--------|
| `Arrow` / `↑↓` | Navigate map selection |
| `Space` / `Enter` | Start game / Advance dialogue |
| `ESC` | Pause / Resume |
| `R` | Restart (from death/win/pause screen) |
| `1` | Activate **Jump** skill (if collected) |
| `2` | Activate **Dash** skill |
| `3` | Activate **Shield** skill |
| `4` | Activate **Blink** skill |
| `5` | Activate **Slow** skill |

#### AI Auto-Navigate
Arthur moves **automatically** using BFS pathfinding. The AI intelligently:
- Finds the safest route avoiding traps
- **Auto-activates skills** when approaching hazards
- Prioritizes: Skill Gems → Key → Gate → EXIT

You can still **manually override** skills at any time!

#### AI Priority Order
```
[1] Collect uncollected Skill Gems
[2] Pick up the Key
[3] Unlock the Gate (needs all skills + key)
[4] Sprint to EXIT
```

---

## Peta / Map Modes

### Indonesia

Tersedia **5 mode labirin** dengan ukuran dan tingkat kesulitan berbeda. Pilih saat layar seleksi di awal game.

| # | Nama | Ukuran Grid | Kepadatan Jebakan | Deskripsi |
|---|------|-------------|-------------------|-----------|
| 1 | **Labirin Pemula** | 21 × 21 | 2% | Labirin kecil, sedikit jebakan. Cocok untuk pemula. |
| 2 | **Labirin Klasik** | 31 × 31 | 5% | Ukuran standar, jebakan moderat. |
| 3 | **Labirin Sulit** | 41 × 41 | 8% | Lebih besar, banyak jebakan! |
| 4 | **Labirin Ekstrem** | 51 × 51 | 10% | Sangat besar, jebakan di mana-mana! |
| 5 | **Labirin Tanpa Jebakan** | 31 × 31 | 0% | Fokus pada navigasi murni, tanpa risiko mati. |

> Setiap kali game dimulai, labirin **dihasilkan ulang secara acak** — jadi tidak ada dua labirin yang sama!

---

### English

There are **5 map modes** with different sizes and difficulty levels. Select at the map selection screen.

| # | Name | Grid Size | Trap Density | Description |
|---|------|-----------|--------------|-------------|
| 1 | **Beginner Maze** | 21 × 21 | 2% | Small maze, few traps. Great for newcomers. |
| 2 | **Classic Maze** | 31 × 31 | 5% | Standard size, moderate traps. |
| 3 | **Hard Maze** | 41 × 41 | 8% | Bigger, lots of traps! |
| 4 | **Extreme Maze** | 51 × 51 | 10% | Massive, traps everywhere! |
| 5 | **Trapless Maze** | 31 × 31 | 0% | Pure navigation, no death risk. |

> Each time a game starts, the maze is **randomly regenerated** — no two mazes are the same!

---

## Jenis Tile / Tile Types

### Indonesia

Game ini memiliki **11 jenis tile** yang membentuk seluruh dunia labirin:

| ID | Nama | Warna | Fungsi |
|----|------|-------|--------|
| `0` | **Floor** | Abu-abu gelap | Lantai biasa, bebas dilewati |
| `1` | **Wall** | Abu bata | Dinding kokoh, tidak bisa dilewati |
| `2` | **Key** | Kuning (animasi bobbing) | Kunci yang harus diambil sebelum membuka gerbang |
| `3` | **Gate** | Coklat tua / oranye di minimap | Gerbang besi — memblokir jalan sampai dibuka |
| `4` | **Exit** | Hijau berdenyut | Tujuan akhir! Injak ini untuk menang |
| `5` | **Fire** | Merah berdenyut | Jebakan api — mematikan tanpa skill yang tepat |
| `6` | **Arrow Trap** | Abu gelap + ikon panah | Jebakan panah — mematikan tanpa skill yang tepat |
| `7` | **Skill: Jump** | Gem hijau | Skill gem yang memberikan kemampuan lompat |
| `8` | **Skill: Dash** | Gem biru | Skill gem yang memberikan kemampuan dash |
| `9` | **Skill: Shield** | Gem kuning | Skill gem yang memberikan perisai |
| `10` | **Skill: Blink** | Gem ungu | Skill gem yang memberikan kemampuan teleport |

---

### English

The game has **11 tile types** that form the entire maze world:

| ID | Name | Color | Function |
|----|------|-------|----------|
| `0` | **Floor** | Dark grey | Walkable floor |
| `1` | **Wall** | Stone grey | Solid wall, impassable |
| `2` | **Key** | Yellow (bobbing) | Must collect before the gate can open |
| `3` | **Gate** | Dark brown / orange on minimap | Iron gate — blocks path until unlocked |
| `4` | **Exit** | Pulsing green | Final goal! Step here to win |
| `5` | **Fire** | Pulsing red | Fire trap — lethal without the right skill |
| `6` | **Arrow Trap** | Dark grey + arrow icon | Arrow trap — lethal without the right skill |
| `7` | **Skill: Jump** | Green gem | Grants the Jump ability |
| `8` | **Skill: Dash** | Blue gem | Grants the Dash ability |
| `9` | **Skill: Shield** | Yellow gem | Grants the Shield ability |
| `10` | **Skill: Blink** | Purple gem | Grants the Blink/Teleport ability |

---

## Rintangan / Hazards

### Indonesia

Ada **5 jenis bahaya** yang bisa membunuh Arthur. Setiap jenis memiliki pola dan timing berbeda.

---

#### 1. Api (Fire Jet)
```
[ api ]  ON selama 1.0 detik
         OFF selama 1.4 detik
         Total siklus: 2.4 detik
```
Semburan api dari ventilasi lantai. Menyala dan mati secara periodik.
- **Tile map:** `TILE_FIRE`
- **Kontra:** Skill **Jump** atau **Shield**

---

#### 2. Jebakan Panah (Arrow Trap)
```
[ ---> ]  Panah terbang selama 600ms
          Jeda: setiap 2.2 detik
```
Tengkorak di dinding menembakkan panah horizontal melintasi koridor.
- **Tile map:** `TILE_ARROW_TRAP`
- **Kontra:** Skill **Dash** atau **Shield**

---

#### 3. Duri Naik (Spike Trap)
```
[ /\/\ ]  Naik selama 700ms
          Total siklus: 1.8 detik
```
Duri-duri yang muncul dari lantai secara berkala — ada efek darah di ujung duri!
- **Kelas:** `SpikeHazard`
- **Kontra:** Lewat saat duri turun

---

#### 4. Gergaji Berputar (Saw Blade)
```
[ <--O--> ]  Mondar-mandir
             Total siklus: 3.2 detik
```
Gergaji berputar yang meluncur di atas rel, bergerak bolak-balik di sepanjang jalur.
- **Kelas:** `SawHazard`
- **Kontra:** Tunggu timing yang tepat

---

#### 5. Gas Racun (Poison Gas)
```
[ ~~~~ ]  Gas padat: 1.9 detik
          Hilang: sekitar 0.6 detik
          Total siklus: 3.2 detik
```
Awan gas hijau yang mengepul dari ventilasi. Berbahaya saat padat.
- **Kelas:** `PoisonHazard`
- **Kontra:** Lewat saat gas menipis

---

> **Catatan:** Di mode map saat ini, `TILE_FIRE` dan `TILE_ARROW_TRAP` tersebar langsung di grid. Kelas hazard lainnya (`SpikeHazard`, `SawHazard`, `PoisonHazard`) tersedia untuk pengembangan lebih lanjut.

---

### English

There are **5 hazard types** that can kill Arthur, each with unique patterns and timing.

---

#### 1. Fire Jet
```
[ fire ]  ON for 1.0 second
          OFF for 1.4 seconds
          Cycle: 2.4 seconds total
```
Floor vents that shoot flames periodically.
- **Map tile:** `TILE_FIRE`
- **Counter:** **Jump** or **Shield** skill

---

#### 2. Arrow Trap
```
[ ---> ]  Arrow flies for 600ms
          Fires every 2.2 seconds
```
Skull shooters embedded in walls that fire horizontal arrows across corridors.
- **Map tile:** `TILE_ARROW_TRAP`
- **Counter:** **Dash** or **Shield** skill

---

#### 3. Spike Trap
```
[ /\/\ ]  Up for 700ms
          Cycle: 1.8 seconds total
```
Spikes that pop from the floor on a timer — complete with blood-tipped tips!
- **Class:** `SpikeHazard`
- **Counter:** Pass when spikes are retracted

---

#### 4. Saw Blade
```
[ <--O--> ]  Slides back and forth
             Cycle: 3.2 seconds total
```
A spinning saw that rides a rail, moving back and forth along its track.
- **Class:** `SawHazard`
- **Counter:** Time your crossing

---

#### 5. Poison Gas
```
[ ~~~~ ]  Dense gas: 1.9 seconds
          Disperses: ~0.6 seconds
          Cycle: 3.2 seconds total
```
Green gas clouds that billow from floor vents.
- **Class:** `PoisonHazard`
- **Counter:** Cross when gas is thin

---

> **Note:** In the current map system, `TILE_FIRE` and `TILE_ARROW_TRAP` are placed directly in the grid. The other hazard classes (`SpikeHazard`, `SawHazard`, `PoisonHazard`) are available for future expansion.

---

## Skill

### Indonesia

Arthur bisa mengumpulkan **4 skill gem** dari labirin, plus 1 skill bawaan. Semua skill memiliki **cooldown** setelah digunakan.

| Skill | Tombol | Cooldown | Durasi | Efek |
|-------|--------|----------|--------|------|
| **Jump** | `1` | 2 detik | 600ms | Lompat melewati api, invulnerable selama aktif. Animasi: Arthur memantul ke atas. |
| **Dash** | `2` | 4 detik | 400ms | Kecepatan 2.5× (dari 180 → 450 px/s), invulnerable, menembus panah. Efek ghost biru. |
| **Shield** | `3` | 8 detik | 2 detik | Perisai pelindung yang memblokir semua jebakan selama aktif. Efek glow biru di sekitar Arthur. |
| **Blink** | `4` | 5 detik | — | Teleport langsung 2 tile ke depan di sepanjang rute saat ini. |
| **Slow** | `5` | 12 detik | 3 detik | Perlambat waktu game menjadi 40% kecepatan normal (built-in, tidak perlu dikumpulkan). |

**Cara mendapatkan skill:** Injak tile gem berwarna (Jump=hijau, Dash=biru, Shield=kuning, Blink=ungu) yang tersebar di labirin.

**Auto-activation:** AI akan otomatis mengaktifkan skill yang paling sesuai sebelum melintasi bahaya — kamu tidak perlu melakukan apa-apa!

---

### English

Arthur can collect **4 skill gems** from the maze, plus 1 built-in skill. All skills have a **cooldown** after use.

| Skill | Key | Cooldown | Duration | Effect |
|-------|-----|----------|----------|--------|
| **Jump** | `1` | 2 seconds | 600ms | Leap over fire, invulnerable while active. Arthur bounces visually. |
| **Dash** | `2` | 4 seconds | 400ms | Speed ×2.5 (180 → 450 px/s), invulnerable, phasing through arrows. Blue ghost trail. |
| **Shield** | `3` | 8 seconds | 2 seconds | Protective barrier that blocks all hazards while active. Blue glow aura around Arthur. |
| **Blink** | `4` | 5 seconds | — | Instantly teleport 2 tiles forward along the current path. |
| **Slow** | `5` | 12 seconds | 3 seconds | Slows game time to 40% normal speed (built-in, no collection needed). |

**How to get skills:** Walk over a colored gem tile (Jump=green, Dash=blue, Shield=yellow, Blink=purple) scattered across the maze.

**Auto-activation:** The AI automatically activates the best-matching skill before crossing a hazard — no input needed!

---

## Sistem Backtracking / Maze Generation

### Indonesia

Labirin dibuat menggunakan algoritma **Recursive Backtracking** (DFS berbasis stack). Ini menghasilkan labirin sempurna — setiap dua titik terhubung oleh **tepat satu jalur**, tanpa loop, tanpa jalan buntu yang terisolasi.

#### Proses Generasi

```
1. Isi seluruh grid dengan WALL
2. Mulai dari titik (1, 1) — pojok kiri atas
3. Tandai sebagai FLOOR, push ke stack
4. Selama stack tidak kosong:
     a. Lihat sel paling atas (tanpa pop)
     b. Cari tetangga yang belum dikunjungi (jarak 2 tile)
     c. Jika ada → pilih acak, hancurkan dinding di antaranya,
        tandai tetangga sebagai FLOOR, push ke stack
     d. Jika tidak ada → pop dari stack (BACKTRACK)
5. Pasang EXIT di pojok kanan bawah
6. Temukan jalur solusi (BFS) dari START → EXIT
7. Pasang GATE di 55% jalan menuju EXIT
8. Temukan titik KUNCI sejauh mungkin dari START
   (di sisi sebelum gerbang)
9. Sebarkan JEBAKAN secara acak di tile floor
10. Tempatkan 4 SKILL GEM di kuadran berbeda
    (terdistribusi merata di seluruh labirin)
```

#### Kenapa Backtracking?

Algoritma ini menghasilkan labirin dengan koridor panjang dan berliku-liku, membuat navigasi terasa menantang. Karena berbasis DFS, labirin cenderung memiliki jalur panjang tanpa percabangan — sempurna untuk game puzzle.

---

### English

The maze is generated using a **Recursive Backtracking** algorithm (stack-based DFS). This produces a **perfect maze** — every two points are connected by exactly one path, no loops, no isolated dead ends.

#### Generation Process

```
1. Fill entire grid with WALL
2. Start at cell (1, 1) — top-left corner
3. Mark as FLOOR, push to stack
4. While stack is not empty:
     a. Peek at top cell (don't pop)
     b. Find unvisited neighbors (2 tiles away)
     c. If found → pick random, carve wall between them,
        mark neighbor as FLOOR, push to stack
     d. If none → pop from stack (BACKTRACK)
5. Place EXIT at bottom-right corner
6. Find solution path (BFS) from START → EXIT
7. Place GATE at ~55% along the solution path
8. Find KEY position as far from START as possible
   (on the pre-gate side of the maze)
9. Scatter TRAPS randomly on floor tiles
10. Place 4 SKILL GEMS across different distance bands
    (evenly distributed throughout the maze)
```

#### Why Backtracking?

This algorithm produces mazes with long, winding corridors, making navigation feel challenging. Because it's DFS-based, mazes tend to have long stretches without branching — perfect for a puzzle game.

---

## HUD & UI

### Indonesia

Saat bermain, layar menampilkan beberapa elemen informasi:

```
┌─────────────────────────────────────────────────────────────┐
│  [Status Panel]              [Skill Collection]    [FPS]   │
│  Status: ...                 JUMP  DASH  SHIELD  BLINK      │
│  Kunci: BELUM | Gerbang: TERKUNCI    0/4 SKILL              │
│                                                             │
│                    [ AREA GAME ]                            │
│                                                             │
│  [Minimap]                          [Message Log]           │
│  PETA                               > Labirin dimulai       │
│  ┌──┐                               > Skill JUMP didapat!   │
│  │  │                               > Kunci didapat!        │
│  └──┘     [Skill Bar: 1 2 3 4 5]   > Gerbang terbuka!      │
└─────────────────────────────────────────────────────────────┘
```

| Elemen | Posisi | Fungsi |
|--------|--------|--------|
| **Status Panel** | Kiri atas | Status AI + kondisi kunci & gerbang |
| **Skill Collection** | Tengah atas | Pelacak 4 gem skill (dikumpulkan/belum) |
| **FPS Counter** | Kanan atas | Performa render real-time |
| **Minimap** | Kiri bawah | Peta mini seluruh labirin + posisi Arthur |
| **Message Log** | Kanan bawah | 4 pesan terbaru dari game |
| **Skill Bar** | Bawah tengah | Status cooldown semua skill (1–5) |

---

### English

During gameplay, the screen shows several information elements:

```
┌─────────────────────────────────────────────────────────────┐
│  [Status Panel]              [Skill Collection]    [FPS]   │
│  Status: ...                 JUMP  DASH  SHIELD  BLINK      │
│  Key: NONE | Gate: LOCKED        0/4 SKILL                  │
│                                                             │
│                    [ GAME AREA ]                            │
│                                                             │
│  [Minimap]                          [Message Log]           │
│  MAP                                > Maze started          │
│  ┌──┐                               > Skill JUMP acquired!  │
│  │  │                               > Key found!            │
│  └──┘     [Skill Bar: 1 2 3 4 5]   > Gate opened!          │
└─────────────────────────────────────────────────────────────┘
```

| Element | Position | Function |
|---------|----------|----------|
| **Status Panel** | Top-left | AI status + key & gate condition |
| **Skill Collection** | Top-center | 4 skill gem tracker (collected/empty) |
| **FPS Counter** | Top-right | Real-time render performance |
| **Minimap** | Bottom-left | Full maze map + Arthur's position |
| **Message Log** | Bottom-right | Last 4 game events |
| **Skill Bar** | Bottom-center | Cooldown status for all skills (1–5) |

---

## Struktur Proyek / Project Structure

```
AAR/
├── index.html          # Entry point, canvas & CSS
└── script/
    ├── main.js         # Game loop, AI pathfinding, input handling
    ├── map.js          # Map generation (backtracking DFS) & tile logic
    ├── entity.js       # Player class, movement, animation, skill states
    ├── hazards.js      # Hazard classes (Fire, Arrow, Spike, Saw, Poison)
    ├── ui.js           # HUD, minimap, screens, skill bar, particles
    └── constants.js    # Tile size, colors, skill definitions
```

---

## Teknologi / Tech Stack

- **Vanilla JavaScript** (ES Modules) — tanpa framework
- **HTML5 Canvas API** — rendering seluruh game
- **Font:** [VT323](https://fonts.google.com/specimen/VT323) — Google Fonts (retro pixel look)
- **Target FPS:** 120 fps

---

*Dibuat dengan JS murni — tanpa library, tanpa build tool. Just open and play.*
*Built with pure JS — no libraries, no build tools. Just open and play.*
