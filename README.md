# 364 — ARCHIV OBLOH

Umělecká instalace zobrazující 364 obrázků oblohy v interaktivním 3D prostředí pomocí React Three Fiber.

## O projektu

Tato aplikace je uměleckou instalací, která zobrazuje 364 obrázků oblohy kreslených každý den v průběhu roku. Využívá React Three Fiber pro vytvoření imerzivního 3D prostředí, kde jsou obrázky prezentovány jako textura na sféře obklopující pozorovatele.

## Funkce

- Interaktivní 3D prostředí vytvořené pomocí React Three Fiber
- Časová osa pro navigaci mezi jednotlivými dny
- Automatické přehrávání pro postupné procházení všech obrázků
- Vlastní shadery pro umělecké efekty
- Částicový systém pro vytvoření atmosféry
- Plynulé animace přechodů mezi obrázky pomocí GSAP

## Technologie

- React
- React Three Fiber
- Three.js
- GSAP (GreenSock Animation Platform)
- Vite
- Custom Shaders

## Instalace a spuštění

1. Naklonujte repozitář
2. Nainstalujte závislosti:
   ```
   npm install
   ```
   nebo
   ```
   yarn
   ```
3. Spusťte vývojový server:
   ```
   npm run dev
   ```
   nebo
   ```
   yarn dev
   ```
4. Otevřete prohlížeč na adrese `http://localhost:5173`

## Ovládání

- Použijte časovou osu ve spodní části obrazovky pro navigaci mezi dny
- Klikněte na tlačítko "PŘEHRÁT" pro automatické procházení obrázků
- Použijte myš pro otáčení pohledu v 3D prostoru

## Struktura projektu

- `src/` - Zdrojový kód aplikace
  - `components/` - React komponenty
    - `SkyGallery.jsx` - Hlavní 3D komponenta pro zobrazení obrázků
    - `Timeline.jsx` - Komponenta časové osy
  - `App.jsx` - Hlavní aplikační komponenta
  - `main.jsx` - Vstupní bod aplikace
  - `styles.css` - Styly aplikace
- `public/` - Statické soubory
  - `images/` - Obrázky oblohy

## Licence

Tento projekt je licencován pod MIT licencí. 