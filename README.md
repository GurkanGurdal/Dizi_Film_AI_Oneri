<div align="center">

# 🎬 AI Film & Dizi Öneri

**Ruh haline, zevkine ve aklındaki o "şuna benzer bir şey"e göre film ve dizi öneren yapay zekâ asistanı.**

<a href="https://gurkangurdal.github.io/Dizi_Film_AI_Oneri/"><img src="https://img.shields.io/badge/▶_Canlı_Demo-7c3aed?style=for-the-badge" alt="Canlı Demo"></a>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
<img src="https://img.shields.io/badge/TMDB-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white" alt="TMDB">

<br><br>

<img src="docs/screenshots/cover.webp" alt="AI Film & Dizi Öneri — masaüstü ve mobil görünüm" width="100%">

</div>

---

## ✨ Neler Yapabiliyor?

| | Özellik | Açıklama |
|:-:|---|---|
| 🤖 | **AI destekli öneri** | OpenRouter üzerinden ücretsiz LLM modelleri; biri yanıt vermezse sıradaki modele otomatik geçer |
| 💬 | **Doğal dil istekleri** | *"Geçen hafta The Office'i bitirdim, benzer bir komedi öner"* gibi serbest yazılar |
| 🎭 | **Ruh haline göre** | Mutlu, Üzgün, Heyecanlı, Rahat, Nostaljik |
| 🗂️ | **9 kategori** | Aksiyon, Komedi, Dram, Korku, Bilim Kurgu, Romantik, Animasyon, Belgesel, Gerilim |
| 🔥 | **Bu hafta trend** | TMDB'den haftanın popüler film ve dizileri; otomatik dönen vitrin + kaydırılabilir afiş şeridi |
| 🎞️ | **Detay penceresi** | Arka plan görseli, afiş, puan, oyuncu kadrosu, fragman ve *"neden önerildi?"* açıklaması |
| 🎭 | **Oyuncu profilleri** | Biyografi, doğum bilgisi ve tıklanabilir "Bilinen Yapımlar" listesi |
| 📚 | **Kütüphanem** | Beğendiğin içerikleri kaydet; Tümü / Filmler / Diziler sekmeleriyle filtrele |
| 🕘 | **Öneri geçmişi** | Önceki önerilerin tarayıcında saklanır |
| ☕ | **Cold start ekranı** | Render sunucusu uyurken sayaçlı, eğlenceli bilgiler gösteren bekleme ekranı |
| 📱 | **Responsive** | Glassmorphism arayüz, mobil ve masaüstüne uyumlu |

## 📸 Uygulama Turu

### 1 · Keşfet — Bu hafta trend olanlar

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/hero.webp" alt="Trend filmler vitrini"></td>
    <td width="50%"><img src="docs/screenshots/trend-tv.webp" alt="Trend diziler vitrini"></td>
  </tr>
  <tr>
    <td align="center"><sub>Haftanın filmleri: otomatik dönen vitrin ve afiş şeridi</sub></td>
    <td align="center"><sub>Tek tıkla dizilere geç</sub></td>
  </tr>
</table>

### 2 · İste — Ne izlemek istediğini anlat

<p align="center">
  <img src="docs/screenshots/form.webp" alt="Öneri formu: tür, kategori, ruh hali ve serbest istek" width="75%">
</p>
<p align="center"><sub>Film/Dizi seç, kategorileri ve ruh halini işaretle, aklındakini kendi cümlelerinle yaz</sub></p>

### 3 · Keşfet — AI'ın sana özel önerileri

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/results.webp" alt="AI öneri sonuçları"></td>
    <td width="50%"><img src="docs/screenshots/result-modal.webp" alt="Öneri detayı ve neden önerildiği"></td>
  </tr>
  <tr>
    <td align="center"><sub>Afiş, puan ve kısa gerekçeyle 6 öneri</sub></td>
    <td align="center"><sub>Her önerinin <b>"Neden Önerildi?"</b> açıklaması</sub></td>
  </tr>
</table>

### 4 · Derinleş — Film detayları ve oyuncular

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/modal.webp" alt="Film detay penceresi"></td>
    <td width="50%"><img src="docs/screenshots/actor.webp" alt="Oyuncu biyografisi"></td>
  </tr>
  <tr>
    <td align="center"><sub>Detay penceresi: özet, oyuncu kadrosu, fragman, kütüphaneye ekle</sub></td>
    <td align="center"><sub>Oyuncuya tıkla → biyografi ve doğum bilgileri</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/actor-known.webp" alt="Oyuncunun bilinen yapımları"></td>
    <td width="50%"><img src="docs/screenshots/library.webp" alt="Kütüphanem paneli"></td>
  </tr>
  <tr>
    <td align="center"><sub>"Bilinen Yapımlar": bir filme tıkla, onun detayına geç</sub></td>
    <td align="center"><sub>Kütüphanem: kaydettiklerin tek panelde</sub></td>
  </tr>
</table>

### 📱 Mobilde

<p align="center">
  <img src="docs/screenshots/m-hero.webp" alt="Mobil ana sayfa" width="30%">
  &nbsp;
  <img src="docs/screenshots/m-results.webp" alt="Mobil öneri sonuçları" width="30%">
  &nbsp;
  <img src="docs/screenshots/m-modal.webp" alt="Mobil detay penceresi" width="30%">
</p>

<details>
<summary><b>☕ Cold start ekranı</b> — sunucu uyurken ne görünüyor?</summary>
<br>
<p align="center"><img src="docs/screenshots/coldstart.webp" alt="Cold start bekleme ekranı" width="80%"></p>
<p align="center"><sub>Ücretsiz Render sunucusu uyku modundan uyanırken sayaç ve sinema bilgileriyle bekleme ekranı gösterilir.</sub></p>
</details>

## ⚙️ Nasıl Çalışır?

```mermaid
flowchart LR
    U([👤 Kullanıcı]) -->|tür · kategori · ruh hali · istek| F[Frontend<br/>HTML · CSS · JS]
    F -->|POST /api/recommend| B[Express Backend]
    B -->|prompt| AI[OpenRouter<br/>ücretsiz LLM'ler]
    B -->|/api/tmdb/*| T[(TMDB API)]
    AI --> B
    T --> B
    B -->|öneriler + afiş + detay| F
```

API anahtarları yalnızca backend'de durur; frontend hiçbir anahtarı görmez.

| Endpoint | Görev |
|---|---|
| `GET /api/health` | Sunucu durumu (Render uyku modundan uyanma kontrolü) |
| `POST /api/recommend` | AI'dan öneri alır |
| `POST /api/translate` | Açıklamaları Türkçeye çevirir |
| `GET /api/tmdb/*` | TMDB isteklerini güvenli şekilde aktarır |

## 🚀 Kurulum

**Gereksinimler:** Node.js 18+, [OpenRouter API anahtarı](https://openrouter.ai/keys), [TMDB API anahtarı](https://www.themoviedb.org/settings/api)

```bash
# 1. Repoyu klonla
git clone https://github.com/GurkanGurdal/Dizi_Film_AI_Oneri.git
cd Dizi_Film_AI_Oneri/server

# 2. Bağımlılıkları yükle
npm install

# 3. Ortam değişkenlerini ayarla
cp .env.example .env
```

`.env` dosyası:

```env
OPENROUTER_API_KEY=senin_openrouter_anahtarin
TMDB_API_KEY=senin_tmdb_anahtarin
PORT=5000
```

```bash
# 4. Sunucuyu başlat
npm start
```

Son olarak proje kökündeki `index.html` dosyasını tarayıcıda aç (veya VS Code Live Server ile çalıştır).

## 🗂️ Proje Yapısı

```
Dizi_Film_AI_Oneri/
├── index.html          # Arayüz
├── styles.css          # Glassmorphism tema ve animasyonlar
├── app.js              # Öneri akışı, trend vitrini, kütüphane, geçmiş
├── assets/             # Maskot ve görseller
└── server/
    ├── server.js       # Express API (OpenRouter + TMDB proxy)
    ├── package.json
    └── .env.example
```

## 🛣️ Yol Haritası

- [ ] Kullanıcı hesabı ile kütüphaneyi cihazlar arası senkronlama
- [ ] "Bunu izledim" geri bildirimiyle önerileri kişiselleştirme
- [ ] İzlenebileceği platformları gösterme (Netflix, Disney+ …)

## 👨‍💻 Geliştirici

**Gürkan Gürdal** · [@GurkanGurdal](https://github.com/GurkanGurdal)

<div align="center">

⭐ Projeyi beğendiysen yıldız vermeyi unutma!

</div>
