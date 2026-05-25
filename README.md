# Arthur — Labirin Kuno | Backtracking Algoritma

```
 █████╗  █████╗ ██████╗
██╔══██╗██╔══██╗██╔══██╗
███████║███████║██████╔╝
██╔══██║██╔══██║██╔══██╗
██║  ██║██║  ██║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
  Arthur's Ancient Ruins
```

> **Game labirin 2D berbasis browser** untuk demonstrasi algoritma **backtracking**. Arthur berjalan otomatis (AI), menggunakan 3 skill untuk melewati jebakan, mengambil kunci, membuka gerbang, dan mencapai keluar — dengan **timer** yang mencatat berapa lama AI menyelesaikan labirin.

![Platform](https://img.shields.io/badge/Platform-Browser-blue)
![Language](https://img.shields.io/badge/Language-Vanilla%20JS-yellow)
![No Build](https://img.shields.io/badge/Build-None%20Required-green)
![Algoritma](https://img.shields.io/badge/Algoritma-Backtracking-orange)

---

## Daftar Isi

- [Tentang Game](#tentang-game)
- [Instalasi](#instalasi)
- [Alur Permainan](#alur-permainan)
- [Cara Memainkan](#cara-memainkan)
- [Mode Labirin](#mode-labirin)
- [Jenis Tile](#jenis-tile)
- [Jebakan](#jebakan)
- [Skill](#skill)
- [Sistem Backtracking](#sistem-backtracking)
- [AI & Auto-Skill](#ai--auto-skill)
- [HUD & UI](#hud--ui)
- [Struktur Proyek](#struktur-proyek)
- [Teknologi](#teknologi)
- [Riwayat Perubahan](#riwayat-perubahan)

---

## Tentang Game

**Arthur — Labirin Kuno** adalah proyek game edukatif yang menggabungkan:

1. **Generasi labirin** dengan recursive backtracking (stack-based carving).
2. **Pencarian jalur** dengan pola Choose → Explore → Unchoose + prioritas arah.
3. **Perencanaan AI** berurutan: Kunci → Gerbang → Exit (prioritas = urutan prioritas).
4. **Auto-skill** agar Arthur selamat melewati jebakan, terutama di mode Hard.

Game **tidak** menggunakan kerangka **SSSS** (State–Space–Solution–Search). Yang dipakai adalah **backtracking klasik**: coba pilihan, rekursi, batalkan jika gagal.

| Aspek | Keterangan |
|--------|------------|
| Genre | Dungeon crawler / maze puzzle 2D |
| Kontrol pemain | Pilih map, skip dialog, pause, override skill (opsional) |
| Pergerakan Arthur | Otomatis mengikuti jalur hasil backtracking |
| Kemenangan | Sampai tile **EXIT** setelah kunci + gerbang |
| Kekalahan | Injak jebakan tanpa perlindungan skill |

---

## Instalasi

Game memakai **ES Modules** — wajib dijalankan lewat **local server**, bukan `file://` langsung.

**Python (paling sederhana)**
```bash
cd project-game-backtracking
python3 -m http.server 8000
# Buka http://localhost:8000
```

**Node.js `serve`**
```bash
npm install -g serve
serve .
# Buka http://localhost:3000
```

**VS Code** — ekstensi **Live Server**, buka `index.html` dengan Live Server.

---

## Alur Permainan

```
[PILIH LABIRIN]  →  [CERITA INTRO]  →  [AI BERMAIN]  →  [MENANG / MATI]
     ↑                    Space              otomatis           R = map baru
  Arrow + Enter
```

| State | Layar | Input utama |
|-------|--------|-------------|
| `MAP_SELECT` | Daftar 3 mode labirin | `↑↓` / `←→` pilih, `Space` / `Enter` mulai |
| `STORY` | Dialog Arthur (typing) | `Space` lanjut / skip |
| `PLAYING` | Gameplay + HUD + timer | `ESC` pause, `1` `2` `3` skill manual |
| `PAUSED` | Overlay pause | `ESC` lanjut, `R` restart |
| `WIN` | Layar menang + **waktu final** | `R` pilih labirin baru |
| `DEAD` | Layar mati + waktu saat mati | `R` pilih labirin baru |

Timer **Waktu AI** mulai saat state `PLAYING` dimulai (setelah intro), berhenti saat pause/mati, dan dibekukan saat menang.

---

## Cara Memainkan

### Tujuan

Bantu **Arthur** keluar dari labirin:

1. Ambil **Kunci** (tile kuning).
2. Buka **Gerbang** (tile coklat/oranye) — cukup dengan kunci (skill sudah tersedia dari awal).
3. Capai **EXIT** (tile hijau berdenyut).

### Kontrol

| Tombol | Fungsi |
|--------|--------|
| `↑` `↓` / `←` `→` | Pilih mode labirin (menu awal) |
| `Space` / `Enter` | Mulai game / lanjut dialog |
| `ESC` | Pause / resume |
| `R` | Kembali ke menu (dari mati / menang / pause) |
| `1` | Skill **Jump** (manual) |
| `2` | Skill **Blink** (manual, loncat ke tile aman di jalur) |
| `3` | Skill **Shield** (manual) |

Arthur bergerak **sendiri**; kamu mengawasi dan bisa menimpa skill jika perlu.

### Urutan prioritas AI

```
Prioritas 1 → Ambil KUNCI
Prioritas 2 → Buka GERBANG (butuh kunci)
Prioritas 3 → Menuju EXIT
```

Setiap langkah memanggil `findPath` backtracking. Jalur mencoba **menghindari jebakan** dulu; jika tidak ada, AI lewat jebakan dengan auto-skill.

---

## Mode Labirin

Tersedia **3 mode** (labirin di-generate ulang setiap permainan):

| Mode | Ukuran | Kepadatan jebakan | Deskripsi |
|------|--------|-------------------|-----------|
| **Easy Maze** | 17 × 17 | 4% | Map kecil, rintangan jarang |
| **Medium Maze** | 27 × 27 | 7% | Tantangan sedang |
| **Hard Maze** | 37 × 37 | 12% | Banyak api, panah, dan ranjau; AI lebih lambat & skill lebih agresif |

---

## Jenis Tile

| ID | Konstanta | Fungsi |
|----|-----------|--------|
| `0` | `TILE_FLOOR` | Lantai, bisa dilewati |
| `1` | `TILE_WALL` | Dinding |
| `2` | `TILE_KEY` | Kunci (hilang setelah diambil) |
| `3` | `TILE_GATE` | Gerbang (terbuka setelah kunci + injak tile) |
| `4` | `TILE_EXIT` | Keluar — menang jika diinjak saat bermain |
| `5` | `TILE_FIRE` | Jebakan api (mematikan) |
| `6` | `TILE_ARROW_TRAP` | Jebakan panah (mematikan) |
| `11` | `TILE_MINE` | Ranjau (mematikan) |

> Tile skill gem (`7`–`10`) masih didefinisikan untuk kompatibilitas UI, tetapi **tidak lagi dipakai** di map — ketiga skill aktif sejak awal.

---

## Jebakan

Jebakan ditempatkan acak di tile lantai (kecuali start, kunci, gerbang, exit). Semua dianggap **lethal** oleh `map.isLethal()`.

| Jebakan | Tile | Tampilan |
|---------|------|----------|
| Api | `TILE_FIRE` | Merah berdenyut |
| Panah | `TILE_ARROW_TRAP` | Abu + ikon panah |
| Ranjau | `TILE_MINE` | Abu gelap + titik merah |

**Melawan jebakan:** AI memakai **Shield** (prioritas), **Blink** (loncat ke tile aman di jalur), atau **Jump** (laju + imunitas singkat). Di Hard, deteksi jebakan lebih jauh, shield lebih awal, dan kecepatan Arthur diturunkan mendekati bahaya.

File `script/hazards.js` berisi kelas hazard animasi (spike, saw, gas, dll.) untuk pengembangan lanjut — **belum terhubung** ke gameplay saat ini.

---

## Skill

Arthur memiliki **3 skill** sejak awal (tidak perlu dikumpulkan di map):

| Skill | Tombol | Cooldown | Durasi | Efek |
|-------|--------|----------|--------|------|
| **Jump** | `1` | 2 detik | 450 ms | Laju meningkat, imunitas singkat |
| **Blink** | `2` | 4 detik | 350 ms | Teleport ke tile aman berikutnya di jalur |
| **Shield** | `3` | 6 detik | 2,8 detik (3,5 detik di Hard) | Imunitas penuh terhadap jebakan |

**Auto-activation:** Sebelum tile berbahaya, AI mengaktifkan skill secara otomatis. **Skill darurat** dipanggil saat Arthur hampir/tap jebakan dan skill tersedia.

---

## Sistem Backtracking

Proyek ini memakai backtracking di **dua lapisan**:

### 1. Generasi labirin (`generateMap`)

Stack-based carving dari titik start:

- **Choose** — pilih tetangga acak (jarak 2 tile).
- **Explore** — hancurkan dinding, push ke stack.
- **Unchoose** — `pop` stack jika tidak ada tetangga (backtrack).

Hasil: labirin sempurna (satu jalur antara dua titik, tanpa loop).

### 2. Pencarian jalur (`findPath`)

Pola sesuai catatan konsep (bukan SSSS):

```
BackTrack(data):
  IF base case (sampai tujuan) → return solusi
  FOR i = 0 .. N-1:                    // Prioritas = urutan arah
    IF isValid(prioritas[i]):
      Clone(data) → data baru
      result = BackTrack(data baru)     // Explore rekursif
      IF result → return result
  return null                           // Unchoose implisit
```

- **Prioritas arah:** diurutkan Manhattan distance ke target (dekat dulu).
- **isValid:** dalam batas map, bukan tembok, gerbang tertutup (opsional), hindari lethal (opsional), belum dikunjungi.
- **Clone:** `path` dan `visited` disalin per cabang (tidak memutasi state induk).

### 3. Perencanaan AI (`planNextPath`)

```javascript
prioritas = [ Kunci, Gerbang, Exit ]
for (i = 0; i < prioritas.length; i++)
  if (isValid(prioritas[i]))
    jalur = findSafePath(...)  // hindari lethal dulu, fallback jika perlu
    if (jalur) setPath & return
```

---

## AI & Auto-Skill

| Fitur | Perilaku |
|-------|----------|
| Pathfinding | `findSafePath`: coba `avoidLethal=true`, lalu `false` |
| Lookahead jebakan | 7 tile (Easy/Medium), 12 tile (Hard) |
| Shield proaktif | Aktif 4–6 tile sebelum jebakan |
| Kecepatan Hard | Base 130 px/s (bukan 180); melambat mendekati bahaya |
| Darurat | Shield → Blink ke tile aman → Jump; mati hanya jika semua cooldown |

---

## HUD & UI

```
┌──────────────────────────────────────────────────────────────┐
│ [Status + Kunci + Gerbang + Waktu AI]   [3 SKILL]    [FPS]  │
│                                                              │
│                      [ AREA GAME ]                           │
│                                                              │
│ [Minimap PETA]                         [Log pesan × 4]        │
│              [Skill Bar: 1  2  3]                            │
└──────────────────────────────────────────────────────────────┘
```

| Elemen | Fungsi |
|--------|--------|
| Status panel | Status AI, kunci, gerbang, **Waktu AI** (live) |
| Skill collection | Indikator 3 skill (JUMP, SHIELD, BLINK) |
| FPS | Performa render |
| Minimap | Peta + posisi Arthur + legenda tile |
| Message log | 4 event terakhir |
| Skill bar | Cooldown tombol 1–3 |
| Layar menang/mati | Menampilkan **waktu final** |

Efek visual: vignette, scanlines, font **VT323**.

---

## Struktur Proyek

```
project-game-backtracking/
├── index.html              # Canvas, CSS, entry HTML
├── README.md
└── script/
    ├── main.js             # Game loop, AI, input, timer, auto-skill
    ├── map.js              # Generasi labirin, findPath backtracking, tile
    ├── entity.js           # Player, movement, animasi, skill state
    ├── ui.js               # HUD, layar menu/menang/mati, format waktu
    ├── constants.js        # TILE_SIZE, SKILLS, warna
    ├── hazards.js          # (Opsional) Kelas hazard animasi — belum dipakai
    ├── items.js            # Item helpers
    ├── maps_presets.js     # Preset map (jika dipakai)
    └── server.js           # Server dev opsional
```

---

## Teknologi

- **Vanilla JavaScript** (ES Modules)
- **HTML5 Canvas** — rendering 2D
- **Font:** [VT323](https://fonts.google.com/specimen/VT323)
- **Target FPS:** 120

---

## Riwayat Perubahan

Ringkasan perbaikan dan fitur yang telah dilakukan pada versi saat ini:

### Perbaikan bug & stabilitas

| Perubahan | Keterangan |
|-----------|------------|
| **Layar hitam menu awal** | `map.js` error sintaks (kode mati di-comment sebagian) — modul gagal load; diperbaiki dengan restore `floodFromStartAvoidingGate()` dan hapus blok rusak |
| **Menu map select** | Saat `MAP_SELECT`, dunia game tidak di-render di belakang (hanya UI menu) |

### Gameplay & konten

| Perubahan | Keterangan |
|-----------|------------|
| **3 mode labirin** | Easy 17×17, Medium 27×27, Hard 37×37 (menggantikan 5 mode lama) |
| **3 skill default** | Jump, Blink, Shield — tidak perlu kumpulkan gem di map |
| **Gerbang** | Hanya butuh kunci (bukan 4 skill) |
| **Tile ranjau** | `TILE_MINE` sebagai jebakan ketiga |
| **Timer Waktu AI** | Mulai saat gameplay, tampil di HUD, layar menang/mati, dan log saat exit |
| **AI Hard lebih aman** | Path hindari lethal, shield lebih awal, blink ke tile aman, skill darurat, kecepatan disesuaikan |

### Algoritma backtracking (sesuai konsep tugas)

| Perubahan | Keterangan |
|-----------|------------|
| **`findPath` refactor** | Choose → Explore → Unchoose dengan `prioritas[]`, `isValid()`, clone `path`/`visited` |
| **`planNextPath` refactor** | Array prioritas: Kunci → Gerbang → Exit dengan `isValid()` per langkah |
| **Bukan SSSS** | Tidak memakai State–Space–Solution–Search; dokumentasi di README |

### Skill & balance

| Perubahan | Keterangan |
|-----------|------------|
| Hapus Dash & Slow | Hanya Jump, Blink, Shield |
| Blink | Teleport ke tile aman pertama di jalur (bukan fixed +3) |
| Imunitas | Jump, Blink, dan Shield memberi perlindungan sementara |
| Shield | CD 6s, durasi 2,8s (+ bonus di Hard) |

### Kode & dokumentasi

| Perubahan | Keterangan |
|-----------|------------|
| **Hapus komentar tidak perlu** | Blok kode mati, penjelasan berulang, header section di `map.js`, `main.js`, `entity.js`, `ui.js` |
| **README** | Diperbarui penuh agar sesuai game saat ini + riwayat perubahan |
| **Teks UI** | Semua referensi "4 skill" diganti ke "3 skill" |

### Yang dihapus / tidak dipakai lagi

- Pengumpulan skill gem di labirin  
- Skill Dash, Slow  
- Pathfinding BFS (`findPath_OLD` di-comment — sudah dihapus)  
- 5 preset map lama (Pemula, Klasik, Sulit, Ekstrem, Tanpa Jebakan)  

---

## English Summary

**Arthur — Ancient Maze** is a browser-based 2D maze game demonstrating **backtracking** (Choose → Explore → Unchoose) for maze generation, pathfinding, and AI goal ordering (Key → Gate → Exit). Arthur auto-navigates with **3 skills** (Jump, Blink, Shield), avoids traps via smart pathing and auto-skills, and finishes with a recorded **AI completion time**. The project does **not** use SSSS (State–Space–Solution–Search).

---

*Dibuat dengan JavaScript murni — tanpa framework, tanpa build tool. Jalankan local server lalu buka di browser.*
