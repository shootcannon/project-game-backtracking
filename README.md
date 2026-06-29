# Arthur — Labirin Kuno | Backtracking Algoritma (Java Swing)

```
 █████╗  █████╗ ██████╗
██╔══██╗██╔══██╗██╔══██╗
███████║███████║██████╔╝
██╔══██║██╔══██║██╔══██╗
██║  ██║██║  ██║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
  Arthur's Ancient Ruins
```

> **Game labirin 2D berbasis desktop Java Swing** untuk demonstrasi algoritma **backtracking**. Arthur berjalan otomatis (AI), menggunakan 3 skill untuk melewati jebakan, mengambil kunci, membuka gerbang, dan mencapai keluar — dengan **timer** yang mencatat berapa lama AI menyelesaikan labirin.

![Platform](https://img.shields.io/badge/Platform-Desktop-blue)
![Language](https://img.shields.io/badge/Language-Java-orange)
![Build](https://img.shields.io/badge/Build-JDK--Required-green)
![Algoritma](https://img.shields.io/badge/Algoritma-Backtracking-red)

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

---

## Tentang Game

**Arthur — Labirin Kuno** adalah proyek game edukatif yang menggabungkan:

1. **Generasi labirin** dengan recursive backtracking (stack-based carving).
2. **Pencarian jalur** dengan pola Choose → Explore → Unchoose + prioritas arah.
3. **Perencanaan AI** berurutan: Kunci → Gerbang → Exit.
4. **Auto-skill** agar Arthur selamat melewati jebakan, terutama di mode Hard.

| Aspek | Keterangan |
|--------|------------|
| Genre | Dungeon crawler / maze puzzle 2D |
| Kontrol pemain | Pilih map, skip dialog, pause, override skill (opsional) |
| Pergerakan Arthur | Otomatis mengikuti jalur hasil backtracking |
| Kemenangan | Sampai tile **EXIT** setelah kunci + gerbang |
| Kekalahan | Injak jebakan tanpa perlindungan skill |

---

## Instalasi

Game ini ditulis menggunakan **Java SE** murni dan UI berbasis **Swing**. Anda membutuhkan Java Development Kit (JDK 8 atau lebih baru) untuk menjalankannya.

**Langkah Kompilasi & Menjalankan**
```bash
# 1. Masuk ke direktori proyek
cd project-game-backtracking

# 2. Kompilasi kelas utama (otomatis mengompilasi dependensi)
javac ArthurGame.java

# 3. Jalankan aplikasi desktop game
java ArthurGame
```

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
| `STORY` | Dialog Arthur (typing) | `Space` / `Enter` lanjut / skip |
| `PLAYING` | Gameplay + HUD + timer | `ESC` pause, `1` `2` `3` skill manual |
| `PAUSED` | Overlay pause | `ESC` lanjut, `R` restart |
| `WIN` | Layar menang + **waktu final** | `R` kembali ke menu |
| `DEAD` | Layar mati + waktu saat mati | `R` kembali ke menu |

---

## Cara Memainkan

### Tujuan

Bantu **Arthur** keluar dari labirin:

1. Ambil **Kunci** (tile kuning).
2. Buka **Gerbang** (tile coklat/oranye) — cukup dengan kunci.
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

Arthur bergerak **sendiri**; kamu mengawasi dan bisa mengaktifkan skill manual jika diperlukan.

---

## Mode Labirin

Tersedia **3 mode** (labirin di-generate ulang setiap permainan):

| Mode | Ukuran | Kepadatan jebakan | Deskripsi |
|------|--------|-------------------|-----------|
| **Easy Maze** | 17 × 17 | 4% | Map kecil, rintangan jarang |
| **Medium Maze** | 27 × 27 | 7% | Tantangan sedang |
| **Hard Maze** | 37 × 37 | 12% | Banyak api, panah, dan ranjau; AI berjalan lebih lambat |

---

## Jenis Tile

| ID | Konstanta | Fungsi |
|----|-----------|--------|
| `0` | `TILE_FLOOR` | Lantai, bisa dilewati |
| `1` | `TILE_WALL` | Dinding |
| `2` | `TILE_KEY` | Kunci (hilang setelah diambil) |
| `3` | `TILE_GATE` | Gerbang (terbuka setelah kunci + diinjak) |
| `4` | `TILE_EXIT` | Keluar — menang jika diinjak |
| `5` | `TILE_FIRE` | Jebakan api |
| `6` | `TILE_ARROW_TRAP` | Jebakan panah |
| `11` | `TILE_MINE` | Ranjau |

---

## Jebakan

Jebakan ditempatkan acak di tile lantai (kecuali start, kunci, gerbang, exit).

| Jebakan | Tile | Tampilan |
|---------|------|----------|
| Api | `TILE_FIRE` | Merah berdenyut |
| Panah | `TILE_ARROW_TRAP` | Abu + gambar panah |
| Ranjau | `TILE_MINE` | Abu gelap + titik merah |

---

## Skill

Arthur memiliki **3 skill** sejak awal:

| Skill | Tombol | Cooldown | Durasi | Efek |
|-------|--------|----------|--------|------|
| **Jump** | `1` | 2 detik | 450 ms | Melompat (visual membesar), imunitas singkat |
| **Blink** | `2` | 4 detik | 350 ms | Teleport ke tile aman berikutnya di jalur |
| **Shield** | `3` | 6 detik | 2,8 detik (3,5 detik di Hard) | Imunitas penuh terhadap jebakan |

---

## Sistem Backtracking

### 1. Generasi labirin (`generateMap`)
Stack-based carving dari titik start:
- **Choose** — pilih tetangga acak (jarak 2 tile).
- **Explore** — hancurkan dinding, push ke stack.
- **Unchoose** — `pop` stack jika tidak ada tetangga (backtrack).

### 2. Pencarian jalur (`findPath`)
Pola backtracking klasik:
- **Choose** — tandai tile saat ini sebagai telah dikunjungi, tambahkan ke list rute.
- **Explore** — lakukan pemanggilan rekursif ke arah tetangga terdekat.
- **Unchoose** — hapus penanda kunjungan dan keluarkan dari list rute jika arah buntu.

---

## AI & Auto-Skill

- **Pathfinding**: Memprioritaskan jalur yang aman (`avoidLethal=true`), fallback ke jalur umum jika terpaksa.
- **Lookahead**: Mengecek rintangan di depan rute (7 tile di Easy/Medium, 12 tile di Hard).
- **Auto-skill**: Mengaktifkan Shield atau melompati area bahaya dengan Blink/Jump secara otomatis saat mendeteksi jebakan.

---

## HUD & UI

- **Status Panel**: Menampilkan target AI, indikator kunci, status gerbang, dan live timer.
- **Minimap**: Peta mini di pojok kiri bawah yang memperlihatkan posisi real-time player dan sebaran tile.
- **Message Log**: Menampilkan riwayat aksi terakhir yang dilakukan AI.
- **Skill Bar**: Menampilkan tombol pintas skill dan cooldown-nya.

---

## Struktur Proyek

```
project-game-backtracking/
├── README.md
├── ArthurGame.java      # Frame utama Swing, game loop thread, render GUI utama, input handling
├── ObjekGame.java       # Kelas induk abstrak untuk semua entitas game yang bergerak/bergeser
├── Player.java          # Kelas pemain (Arthur), update koordinat, status kebal, visualisasi
├── GameMap.java         # Konstruksi peta labirin, backtracking generator, backtracking pathfinding
├── Constants.java       # Definisi konstan warna, tipe ubin, target FPS, dan ukuran ubin
├── MapConfig.java       # Kelas utilitas konfigurasi tingkat kesulitan labirin
├── Particle.java        # Kelas model teks partikel melayang (floating text)
└── ParticleSystem.java  # Pengendali daur hidup partikel melayang (update, remove, draw)
```

---

## Teknologi

- **Java Standard Edition (Java SE)**
- **Java Swing & AWT** — Pembuatan window desktop dan rendering 2D Graphics
- **Thread Java** — Menggerakkan loop game secara independen

---

## English Summary

**Arthur — Ancient Maze** is a Java Swing-based 2D desktop game showcasing **backtracking** algorithms (Choose → Explore → Unchoose) for both maze generation and pathfinding. The AI automatically plans its path (Key → Gate → Exit), utilizes **3 unique skills** (Jump, Blink, Shield) to survive hazardous traps, and records its final completion time. No third-party frameworks or engines are used.
