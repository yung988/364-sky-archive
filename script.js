// script.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM nahrán, začínám inicializaci aplikace");
    
    // Přidání globálního handleru pro zachycení neošetřených chyb
    window.onerror = function(message, source, lineno, colno, error) {
        console.error("Neošetřená chyba:", message, error);
        hideLoaderAndInit();
        return true;
    };

    // Vytvoření loaderu
    const loader = document.createElement("div");
    loader.classList.add("loader");
    
    const loaderSpinner = document.createElement("div");
    loaderSpinner.classList.add("loader-spinner");
    loader.appendChild(loaderSpinner);
    
    const loaderText = document.createElement("div");
    loaderText.classList.add("loader-text");
    loaderText.textContent = "NAČÍTÁNÍ VOLUMETRICKÝCH OBLOH";
    loader.appendChild(loaderText);
    
    document.body.appendChild(loader);

    // Celkový počet dnů
    const totalDays = 364;
    
    // Vytvoření počítadla
    const counter = document.createElement("div");
    counter.classList.add("counter");
    document.body.appendChild(counter);
    
    // Vytvoření časové osy
    const timeline = document.createElement("div");
    timeline.classList.add("timeline");
    
    const timelineProgress = document.createElement("div");
    timelineProgress.classList.add("timeline-progress");
    timeline.appendChild(timelineProgress);
    
    document.body.appendChild(timeline);
    
    // Vytvoření kontejneru pro galerii
    const gallery = document.createElement("div");
    gallery.classList.add("gallery");
    document.body.appendChild(gallery);

    // Vytvoření kontejneru pro obrázky
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("image-container");
    gallery.appendChild(imageContainer);
    
    // Vytvoření ovládacích prvků
    const controls = document.createElement("div");
    controls.classList.add("controls");
    
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "⟨";
    prevBtn.classList.add("control-btn", "prev-btn");
    controls.appendChild(prevBtn);
    
    const playBtn = document.createElement("button");
    playBtn.textContent = "▶";
    playBtn.classList.add("control-btn", "play-btn");
    controls.appendChild(playBtn);
    
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "⟩";
    nextBtn.classList.add("control-btn", "next-btn");
    controls.appendChild(nextBtn);
    
    document.body.appendChild(controls);
    
    let currentImageIndex = 0;
    let isAutoplay = false;
    let autoplayInterval = null;
    let isDraggingTimeline = false;
    let isPlaying = false;
    
    // Three.js komponenty - pouze jedna instance
    let renderer, scene, camera;
    let clock, skyMaterial;
    let uniforms;
    
    // Vertex shader pro oblohu
    const vertexShader = `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `;
    
    // Fragment shader - upravený kód od Inigo Quilez (Shadertoy) s vylepšeními inspirovanými článkem Maxime Heckela
    const fragmentShader = `
    uniform float u_time;
    uniform float u_day;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform sampler2D u_noiseTexture;
    uniform sampler2D u_randomTexture;
    uniform float u_intensity; // Přidaný parametr pro interaktivitu
    
    varying vec2 vUv;
    
    // Copyright Inigo Quilez, 2013 - https://iquilezles.org/
    // Upraveno pro použití v Three.js a rozšířeno o techniky z článku Maxime Heckela
    
    // Utility funkce
    #define PI 3.14159265359
    #define saturate(x) clamp(x, 0.0, 1.0)
    
    // FBM - Fractal Brownian Motion pro organičtější vzhled mraků
    float fbm(vec3 p, int octaves) {
        float sum = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        
        for(int i = 0; i < octaves; i++) {
            float n = texture2D(u_noiseTexture, (p.xy * freq) / 256.0).r * 2.0 - 1.0;
            sum += n * amp;
            amp *= 0.5;
            freq *= 2.0;
            p = p * 2.0 + vec3(43.0, 17.0, 0.0);
        }
        
        return sum;
    }
    
    mat3 setCamera(in vec3 ro, in vec3 ta, float cr) {
        vec3 cw = normalize(ta-ro);
        vec3 cp = vec3(sin(cr), cos(cr), 0.0);
        vec3 cu = normalize(cross(cw,cp));
        vec3 cv = normalize(cross(cu,cw));
        return mat3(cu, cv, cw);
    }
    
    float noise(in vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        
        vec2 uv = (p.xy+vec2(37.0,239.0)*p.z) + f.xy;
        vec2 rg = texture2D(u_noiseTexture, (uv+0.5)/256.0).yx;
        return mix(rg.x, rg.y, f.z) * 2.0 - 1.0;
    }
    
    // Vylepšená funkce pro hustotu mraků - kombinuje více oktáv šumu pro detailnější mraky
    float map(in vec3 p, int oct) {
        // Variace na základě dne v roce
        float dayFactor = u_day / 364.0;
        
        // Pohyb mraků v čase a interaktivita podle pohybu myši
        vec3 q = p - vec3(0.0, 0.1, 1.0) * u_time * 0.1;
        
        // Interaktivita s myší - pohyb mraků reaguje na pozici kurzoru
        float mouseInfluence = u_intensity * 0.3; // Síla vlivu myši
        q.x += (u_mouse.x - 0.5) * mouseInfluence;
        q.y += (u_mouse.y - 0.5) * mouseInfluence;
        
        // Variace v závislosti na dni (různé druhy mraků pro různé dny)
        q.x += sin(dayFactor * 6.28) * 2.0;
        q.z += cos(dayFactor * 6.28) * 2.0;
        
        // Základní tvar mraků - používá FBM pro organičtější vzhled
        float f = fbm(q * 0.3, 3) * 0.5 + 0.5;
        
        // Detaily mraků - víc oktáv pro vyšší detaily podle LOD
        if (oct >= 2) f += fbm(q * 0.7, min(oct, 5)) * 0.25;
        
        // Sezónní variace - změny výšky a hustoty mraků
        float seasonFactor = abs(dayFactor - 0.5) * 2.0; // 0 = léto, 1 = zima
        float heightOffset = mix(-0.4, -0.8, seasonFactor);
        
        // Víc zaoblené mraky v létě, ostřejší v zimě
        float seasonShape = mix(1.0, 1.5, seasonFactor);
        f = pow(saturate(f), seasonShape);
        
        return 1.5 * f - 0.5 - p.y + heightOffset;
    }
    
    vec3 sunDirection(float day) {
        // Dynamické slunce v závislosti na dni v roce (sezóna) a denním cyklu
        float angle = (day / 364.0) * 6.28; // Roční cyklus
        float timeOfDay = fract(u_time * 0.05) * 6.28; // Denní cyklus
        
        float sunHeight = sin(timeOfDay) * (0.4 + 0.2 * sin(angle));
        float sunX = cos(timeOfDay);
        float sunZ = sin(timeOfDay + 3.14) * cos(angle * 0.5);
        
        return normalize(vec3(sunX, sunHeight, sunZ));
    }
    
    // Realizuje Henyey-Greenstein fázovou funkci pro realistický rozptyl světla v mracích
    float henyeyGreenstein(float g, float cosTheta) {
        float g2 = g * g;
        return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5) / (4.0 * PI);
    }
    
    vec4 raymarch(in vec3 ro, in vec3 rd, in vec3 bgcol) {
        // Boundary planes
        const float yb = -3.0;
        const float yt = 0.6;
        float tb = (yb - ro.y) / rd.y;
        float tt = (yt - ro.y) / rd.y;
        
        // Find tightest possible raymarching segment
        float tmin, tmax;
        if (ro.y > yt) {
            // Above top plane
            if (tt < 0.0) return vec4(0.0); // Early exit
            tmin = tt;
            tmax = tb;
        } else {
            // Inside clouds slab
            tmin = 0.0;
            tmax = 60.0;
            if (tt > 0.0) tmax = min(tmax, tt);
            if (tb > 0.0) tmax = min(tmax, tb);
        }
        
        // Dithered near distance for smoother transition
        float t = tmin + 0.1 * texture2D(u_randomTexture, gl_FragCoord.xy / 1024.0).x;
        
        // Směr slunce
        vec3 sundir = sunDirection(u_day);
        
        // Raymarch loop
        vec4 sum = vec4(0.0);
        
        // Kvalita raymarchingu podle vzdálenosti od kamery - optimalizace výkonu
        int steps = 100;
        
        for (int i = 0; i < 100; i++) {
            if (i >= steps) break;
            
            // Step size
            float dt = max(0.05, 0.02 * t);
            
            // LOD - snížení kvality se vzdáleností
            int oct = 5 - int(log2(1.0 + t * 0.5));
            
            // Sample cloud
            vec3 pos = ro + t * rd;
            float den = map(pos, oct);
            if (den > 0.01) { // If inside cloud
                // Do lighting
                float dif = clamp((den - map(pos + 0.3 * sundir, oct)) / 0.25, 0.0, 1.0);
                
                // Různé barvy podle denní doby a ročního období
                float dayFactor = u_day / 364.0;
                float timeOfDay = fract(u_time * 0.05);
                
                // Základní "bílá" barva mraku
                vec3 cloudColor = mix(vec3(1.0, 0.95, 0.8), vec3(0.25, 0.3, 0.35), den);
                
                // Osvětlení podle denní doby
                vec3 sunlightColor;
                if (timeOfDay < 0.25) { // Úsvit
                    sunlightColor = mix(vec3(1.0, 0.6, 0.3), vec3(1.0, 0.8, 0.4), timeOfDay * 4.0);
                } else if (timeOfDay < 0.75) { // Den
                    sunlightColor = vec3(1.0, 0.95, 0.8);
                } else { // Západ slunce
                    sunlightColor = mix(vec3(1.0, 0.4, 0.2), vec3(0.8, 0.3, 0.2), (timeOfDay - 0.75) * 4.0);
                }
                
                // Vylepšené rozptylování světla pomocí Henyey-Greenstein fázové funkce
                float cosTheta = dot(rd, sundir);
                float phaseFunc = henyeyGreenstein(-0.3, cosTheta); // -0.3 pro lehké rozptýlení dozadu
                
                vec3 lin = vec3(0.65, 0.65, 0.75) * 1.1 + 0.8 * sunlightColor * dif * phaseFunc * 2.0;
                vec4 col = vec4(cloudColor, den);
                col.xyz *= lin;
                
                // Atmosférický rozptyl - Fog
                col.xyz = mix(col.xyz, bgcol, 1.0 - exp2(-0.1 * t));
                
                // Front to back composite
                col.w = min(col.w * 8.0 * dt, 1.0);
                col.rgb *= col.a;
                sum += col * (1.0 - sum.a);
            }
            
            // Advance ray
            t += dt;
            
            // Until far clip or full opacity
            if (t > tmax || sum.a > 0.99) break;
        }
        
        return clamp(sum, 0.0, 1.0);
    }
    
    vec4 render(in vec3 ro, in vec3 rd) {
        // Směr slunce
        vec3 sundir = sunDirection(u_day);
        float sun = clamp(dot(sundir, rd), 0.0, 1.0);
        
        // Pozadí oblohy
        float timeOfDay = fract(u_time * 0.05);
        float dayFactor = u_day / 364.0; // Sezónní faktor
        vec3 col;
        
        if (timeOfDay < 0.25) { // Úsvit
            col = mix(vec3(0.05, 0.05, 0.1), vec3(0.5, 0.5, 0.6), timeOfDay * 4.0);
        } else if (timeOfDay < 0.75) { // Den
            vec3 summerSky = vec3(0.5, 0.7, 1.0);
            vec3 winterSky = vec3(0.6, 0.8, 0.9);
            vec3 daySky = mix(summerSky, winterSky, abs(dayFactor - 0.5) * 2.0);
            col = daySky - rd.y * 0.2 * vec3(1.0, 0.5, 1.0) + 0.15 * 0.5;
        } else { // Západ slunce
            vec3 sunsetSummer = vec3(0.8, 0.3, 0.1);
            vec3 sunsetWinter = vec3(0.6, 0.2, 0.1);
            vec3 sunsetColor = mix(sunsetSummer, sunsetWinter, abs(dayFactor - 0.5) * 2.0);
            col = mix(vec3(0.5, 0.5, 0.6), sunsetColor, (timeOfDay - 0.75) * 4.0);
        }
        
        // Přidání hvězd v noci
        if (timeOfDay < 0.2 || timeOfDay > 0.8) {
            // Seed pro generování hvězd
            vec3 starPos = floor(rd * 500.0);
            float starSeed = fract(sin(dot(starPos, vec3(13.5345, 41.2345, 73.2345))) * 29342.2346);
            
            if (starSeed > 0.995 && rd.y > 0.0) {
                float starIntensity = smoothstep(0.995, 0.999, starSeed);
                float starTwinkle = sin(u_time * (starSeed * 5.0) + starSeed * 20.0) * 0.5 + 0.5;
                col += vec3(1.0, 1.0, 1.0) * starIntensity * starTwinkle * (1.0 - smoothstep(0.2, 0.5, timeOfDay) * smoothstep(0.8, 0.5, timeOfDay));
            }
        }
        
        // Slunce - vylepšení s realistickým odleskem
        float sunMask = pow(sun, 300.0 / (1.01 - pow(timeOfDay * 2.0 - 1.0, 2.0)));
        col += 0.25 * vec3(1.0, 0.7, 0.4) * pow(sun, 5.0);
        col += sunMask * vec3(1.0, 0.8, 0.6) * 0.8;
        
        // Atmosférické rozptýlení kolem slunce
        col += 0.5 * vec3(1.0, 0.5, 0.3) * pow(sun, 2.0);
        
        // Mraky
        vec4 res = raymarch(ro, rd, col);
        col = col * (1.0 - res.w) + res.xyz;
        
        // Světlo slunce
        col += 0.2 * vec3(1.0, 0.4, 0.2) * pow(sun, 3.0);
        
        // Vylepšené tonování
        col = saturate(col);
        
        // Film grain efekt - lehký šum pro větší realismus
        float noise = texture2D(u_randomTexture, gl_FragCoord.xy / u_resolution.xy + fract(u_time)).r;
        col = mix(col, col * (0.9 + 0.1 * noise), 0.03);
        
        // Tonemap
        col = pow(col, vec3(0.8)); // Gamma korekce
        col = col / (1.0 + col); // Komprese HDR
        col = pow(col, vec3(1.0 / 0.8)); // Inverzní gamma
        
        return vec4(col, 1.0);
    }
    
    void main() {
        vec2 p = (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;
        
        // Přesun kamery v závislosti na myši - interaktivnější pohyb
        vec2 m = u_mouse.xy / u_resolution.xy;
        
        // Dynamická pozice kamery reagující na myš
        float cameraAngle = 3.0 * m.x + u_time * 0.05;
        float cameraHeight = 0.4 * m.y;
        
        // Pozice kamery
        vec3 ro = 4.0 * normalize(vec3(sin(cameraAngle), cameraHeight, cos(cameraAngle))) - vec3(0.0, 0.1, 0.0);
        vec3 ta = vec3(0.0, -1.0, 0.0);
        mat3 ca = setCamera(ro, ta, 0.07 * cos(0.25 * u_time));
        
        // Paprsek
        vec3 rd = ca * normalize(vec3(p.xy, 1.5));
        
        // Renderování
        gl_FragColor = render(ro, rd);
    }
    `;

    // Inicializace Three.js
    const initThreeJS = () => {
        console.log("Inicializace Three.js");
        
        // Vytvoření procedurálních textur pro shader
        const createNoiseTexture = () => {
            const size = 256;
            const data = new Uint8Array(size * size * 4);
            
            for (let i = 0; i < size * size * 4; i += 4) {
                // Náhodná hodnota pro R, G, B kanály (alpha kanál = 255)
                data[i] = Math.floor(Math.random() * 256);
                data[i + 1] = Math.floor(Math.random() * 256);
                data[i + 2] = Math.floor(Math.random() * 256);
                data[i + 3] = 255;
            }
            
            const noiseTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
            noiseTexture.wrapS = THREE.RepeatWrapping;
            noiseTexture.wrapT = THREE.RepeatWrapping;
            noiseTexture.needsUpdate = true;
            
            return noiseTexture;
        };
        
        const createRandomTexture = () => {
            const size = 256;
            const data = new Uint8Array(size * size * 4);
            
            for (let i = 0; i < size * size * 4; i += 4) {
                const val = Math.floor(Math.random() * 256);
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
                data[i + 3] = 255;
            }
            
            const randomTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
            randomTexture.wrapS = THREE.RepeatWrapping;
            randomTexture.wrapT = THREE.RepeatWrapping;
            randomTexture.needsUpdate = true;
            
            return randomTexture;
        };
        
        try {
            // Vytvoření jedné hlavní scény a rendereru
            scene = new THREE.Scene();
            
            // Vytvoření kamery - použijeme OrthographicCamera pro zobrazení plochy na celé obrazovce
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
            camera.position.z = 1;
            
            // Vytvoření WebGL rendereru
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio);
            
            // Vložení rendereru do dokumentu jako pozadí
            renderer.domElement.style.position = 'fixed';
            renderer.domElement.style.top = '0';
            renderer.domElement.style.left = '0';
            renderer.domElement.style.width = '100%';
            renderer.domElement.style.height = '100%';
            renderer.domElement.style.zIndex = '-1'; // Pod vše ostatní
            document.body.appendChild(renderer.domElement);
            
            // Inicializace hodin pro animace
            clock = new THREE.Clock();
            
            // Vytvoření procedurálních textur
            const noiseTexture = createNoiseTexture();
            const randomTexture = createRandomTexture();
            
            // Vytvoření uniforms pro shader
            uniforms = {
                u_time: { value: 0 },
                u_day: { value: 0 },
                u_resolution: { value: new THREE.Vector2(width, height) },
                u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
                u_noiseTexture: { value: noiseTexture },
                u_randomTexture: { value: randomTexture },
                u_intensity: { value: 1.0 } // Nový uniform pro interaktivitu
            };
            
            // Vytvoření materiálu pro oblohu
            skyMaterial = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader
            });
            
            // Vytvoření plochy, která pokryje celou obrazovku
            const skyGeometry = new THREE.PlaneGeometry(2, 2);
            const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
            scene.add(skyMesh);
            
            // Nastavení událostí pro sledování myši - rozšířená interaktivita
            document.addEventListener('mousemove', (event) => {
                // Plynulá interpolace pohybu myši pro hladší efekt
                const targetX = event.clientX / window.innerWidth;
                const targetY = 1.0 - (event.clientY / window.innerHeight);
                
                // Smooth lerp pro plynulý pohyb
                uniforms.u_mouse.value.x += (targetX - uniforms.u_mouse.value.x) * 0.05;
                uniforms.u_mouse.value.y += (targetY - uniforms.u_mouse.value.y) * 0.05;
            });
            
            // Přidání interaktivity kliknutím - zvýšení intenzity při kliknutí
            document.addEventListener('mousedown', () => {
                // Zvýšení intenzity při kliknutí
                uniforms.u_intensity.value = 2.0;
            });
            
            document.addEventListener('mouseup', () => {
                // Návrat k normální intenzitě
                uniforms.u_intensity.value = 1.0;
            });
            
            // Nastavení změny velikosti okna
            window.addEventListener('resize', onWindowResize);
            
            // Inicializace obrázků dnů
            initImageGallery();
            
            // Zobrazení prvního obrázku
            showImage(currentImageIndex);
            
            // Spuštění animace
            animate();
            
        } catch (error) {
            console.error("Chyba při inicializaci Three.js:", error);
            hideLoaderAndInit();
        }
    };
    
    // Inicializace galerie obrázků
    const initImageGallery = () => {
        // Vyčistit kontejner
        imageContainer.innerHTML = '';
        
        // Dostupné obrázky - máme pouze 8 skutečných obrázků
        const availableImages = [1, 2, 3, 4, 5, 6, 7, 8];
        const totalAvailableImages = availableImages.length;
        
        // Vytvoření různých sekvencí pro různé části roku
        const generateImagePattern = (dayIndex) => {
            // Rozdělíme rok na 4 sezóny, každá má jiný vzor
            const season = Math.floor(dayIndex / 91); // 0=jaro, 1=léto, 2=podzim, 3=zima
            
            // Základní index obrázku - cyklické opakování
            let baseIndex = dayIndex % totalAvailableImages;
            
            // Různé vzory podle sezóny
            switch(season) {
                case 0: // Jaro - standartní sekvence
                    return availableImages[baseIndex];
                case 1: // Léto - obrácená sekvence 
                    return availableImages[totalAvailableImages - 1 - baseIndex];
                case 2: // Podzim - sudé dny od začátku, liché od konce
                    if (dayIndex % 2 === 0) {
                        return availableImages[baseIndex];
                    } else {
                        return availableImages[totalAvailableImages - 1 - baseIndex];
                    }
                case 3: // Zima - střídání jasných/tmavých obrázků
                    // Pro zimu používáme jinou sekvenci založenou na dni v týdnu
                    let weekday = dayIndex % 7;
                    if (weekday < 3) { // První 3 dny v týdnu
                        return availableImages[weekday % totalAvailableImages]; 
                    } else { // Poslední 4 dny v týdnu
                        return availableImages[3 + (weekday - 3) % (totalAvailableImages - 3)];
                    }
                default:
                    return availableImages[baseIndex];
            }
        };
        
        // Vytvoření obrázků pro všechny dny
        for (let i = 0; i < totalDays; i++) {
            const imgIndex = generateImagePattern(i);
            
            const imgElement = document.createElement("img");
            imgElement.classList.add("day-image");
            imgElement.src = `images/day_${imgIndex}.JPG`;
            imgElement.alt = `Den ${i + 1}`;
            imgElement.style.display = "none"; // Skrýt všechny obrázky
            
            // Přidání dne v rohu obrázku
            imgElement.setAttribute('data-day', `DEN ${i + 1}`);
            
            // Pokud obrázek nelze načíst, použít fallback
            imgElement.onerror = function() {
                console.warn(`Obrázek pro den ${i + 1} není k dispozici`);
                this.onerror = null;
                this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='150' viewBox='0 0 300 150'%3E%3Crect width='300' height='150' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='14' fill='%23fff'%3ENení k dispozici%3C/text%3E%3C/svg%3E";
            };
            
            // Přidání obrázku do kontejneru
            imageContainer.appendChild(imgElement);
        }
    };
    
    // Aktualizace velikosti okna
    const onWindowResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Aktualizace uniforms pro shader
        uniforms.u_resolution.value.x = width;
        uniforms.u_resolution.value.y = height;
        
        // Aktualizace rendereru
        renderer.setSize(width, height);
    };
    
    // Animační smyčka
    function animate() {
        requestAnimationFrame(animate);
        
        // Aktualizace času pro shader
        const elapsedTime = clock.getElapsedTime();
        uniforms.u_time.value = elapsedTime;
        
        // Plynulý návrat intenzity k normálu, pokud byla zvýšena
        if (uniforms.u_intensity.value > 1.0) {
            uniforms.u_intensity.value -= 0.01;
            if (uniforms.u_intensity.value < 1.0) uniforms.u_intensity.value = 1.0;
        }
        
        // Renderování scény
        renderer.render(scene, camera);
    }
    
    // Aktualizace časové osy
    const updateTimeline = (index) => {
        const progress = ((index + 1) / totalDays) * 100;
        timelineProgress.style.width = `${progress}%`;
        counter.textContent = `DEN ${index + 1}`;
        
        // Aktualizace parametru dne pro shader
        uniforms.u_day.value = index;
    };
    
    // Skrytí loaderu a inicializace
    const hideLoaderAndInit = () => {
        console.log("Skrývám loader a inicializuji aplikaci");
        
        // Odstranění loaderu
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
        
        // Vytvoření vlastního kurzoru podle článku
        const customCursor = document.createElement("div");
        customCursor.classList.add("custom-cursor");
        document.body.appendChild(customCursor);
        
        // Přidání sledování pohybu myši pro vlastní kurzor
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
        });
        
        // Přidání efektu při kliknutí
        document.addEventListener('mousedown', () => {
            customCursor.classList.add('active');
        });
        
        document.addEventListener('mouseup', () => {
            customCursor.classList.remove('active');
        });
        
        // Přidání viněty pro lepší vizuální efekt
        const vignetteOverlay = document.createElement("div");
        vignetteOverlay.classList.add("vignette-overlay");
        document.body.appendChild(vignetteOverlay);
        
        // Nastavení událostí pro ovládací prvky
        setupEvents();
    };
    
    // Přepínání automatického procházení
    const toggleAutoplay = () => {
        if (isAutoplay) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    };
    
    // Spuštění automatického procházení
    const startAutoplay = () => {
        isAutoplay = true;
        isPlaying = true;
        playBtn.textContent = "❚❚";
        
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
        }
        
        autoplayInterval = setInterval(() => {
            if (currentImageIndex < totalDays - 1) {
                currentImageIndex++;
            } else {
                currentImageIndex = 0;
            }
            
            showImage(currentImageIndex);
        }, 2000);
    };
    
    // Zastavení automatického procházení
    const stopAutoplay = () => {
        isAutoplay = false;
        isPlaying = false;
        playBtn.textContent = "▶";
        
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    };
    
    // Zobrazení konkrétního obrázku
    const showImage = (index) => {
        // Omezení indexu
        if (index < 0) {
            index = 0;
        } else if (index >= totalDays) {
            index = totalDays - 1;
        }
        
        // Skrytí všech obrázků
        const images = imageContainer.querySelectorAll('.day-image');
        images.forEach(img => {
            img.style.display = "none";
        });
        
        // Zobrazení vybraného obrázku
        if (images[index]) {
            images[index].style.display = "block";
        }
        
        // Aktualizace čísla dne pro zobrazení
        imageContainer.setAttribute('data-day', `DEN ${index + 1}`);
        
        // Aktualizace indexu aktuálního obrázku
        currentImageIndex = index;
        
        // Aktualizace časové osy
        updateTimeline(index);
    };

    // Nastavení událostí pro ovládací prvky
    const setupEvents = () => {
        prevBtn.addEventListener("click", () => {
            if (currentImageIndex > 0) {
                currentImageIndex--;
                showImage(currentImageIndex);
            }
        });
        
        nextBtn.addEventListener("click", () => {
            if (currentImageIndex < totalDays - 1) {
                currentImageIndex++;
                showImage(currentImageIndex);
            }
        });
        
        playBtn.addEventListener("click", toggleAutoplay);
        
        const onTimelineClick = (e) => {
            if (!isDraggingTimeline) {
                const rect = timeline.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                const index = Math.floor(percentage * totalDays);
                showImage(index);
            }
        };
        
        const onTimelineMouseDown = (e) => {
            isDraggingTimeline = true;
            const rect = timeline.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const index = Math.floor(percentage * totalDays);
            showImage(index);
        };
        
        const onTimelineMouseMove = (e) => {
            if (isDraggingTimeline) {
                const rect = timeline.getBoundingClientRect();
                const x = e.clientX - rect.left;
                
                // Omezení x na velikost časové osy
                const clampedX = Math.max(0, Math.min(x, rect.width));
                
                const percentage = clampedX / rect.width;
                const index = Math.floor(percentage * totalDays);
                showImage(index);
            }
        };
        
        const onTimelineMouseUp = (e) => {
            isDraggingTimeline = false;
        };
        
        timeline.addEventListener("click", onTimelineClick);
        timeline.addEventListener("mousedown", onTimelineMouseDown);
        document.addEventListener("mousemove", onTimelineMouseMove);
        document.addEventListener("mouseup", onTimelineMouseUp);
        
        // Obsluha kláves
        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "ArrowLeft":
                    if (currentImageIndex > 0) {
                        currentImageIndex--;
                        showImage(currentImageIndex);
                    }
                    break;
                case "ArrowRight":
                    if (currentImageIndex < totalDays - 1) {
                        currentImageIndex++;
                        showImage(currentImageIndex);
                    }
                    break;
                case " ":
                    toggleAutoplay();
                    break;
            }
        });
        
        // Obsluha swipe gest na mobilních zařízeních
        let touchStartX = 0;
        
        gallery.addEventListener("touchstart", (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        gallery.addEventListener("touchend", (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchEndX - touchStartX;
            
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    // Swipe doprava - předchozí obrázek
                    if (currentImageIndex > 0) {
                        currentImageIndex--;
                        showImage(currentImageIndex);
                    }
                } else {
                    // Swipe doleva - další obrázek
                    if (currentImageIndex < totalDays - 1) {
                        currentImageIndex++;
                        showImage(currentImageIndex);
                    }
                }
            }
        });
    };
    
    // Kontrola závislostí
    const checkDependencies = () => {
        try {
            if (typeof THREE === 'undefined') {
                console.error("Three.js není načtený. Přidávám CDN link.");
                
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/three@0.156.1/build/three.min.js';
                script.onload = () => {
                    console.log("Three.js úspěšně načten, inicializuji aplikaci");
                    initThreeJS();
                };
                script.onerror = () => {
                    console.error("Nepodařilo se načíst Three.js, aplikace nebude fungovat správně");
                    hideLoaderAndInit();
                };
                
                document.head.appendChild(script);
            } else {
                // Three.js je již načten
                console.log("Three.js je již načtený, inicializuji aplikaci");
                initThreeJS();
            }
        } catch (e) {
            console.error("Chyba při kontrole závislostí:", e);
            hideLoaderAndInit();
        }
    };
    
    // Kontrola a načtení závislostí
    checkDependencies();
});