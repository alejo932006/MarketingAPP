const express = require('express');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderMedia } = require('@remotion/renderer');
const multer = require('multer');
const tier4 = require('./lib/tier4');

tier4.cargarEnv(__dirname);

const PORT = 4000;
const HOST = '0.0.0.0';

function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push(iface.address);
            }
        }
    }
    return ips;
}

function getBaseUrl(req) {
    const host = req.get('host') || `localhost:${PORT}`;
    return `${req.protocol}://${host}`;
}

function verificarVideoGenerado(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error('El archivo de video no se generó en el servidor');
    }
    const { size } = fs.statSync(filePath);
    if (size < 10000) {
        throw new Error(`El video generado es inválido (${size} bytes)`);
    }
    return size;
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

const REMOTION_ENTRY = path.resolve(__dirname, 'generador-reels/src/index.ts');
const REMOTION_PUBLIC = path.resolve(__dirname, 'generador-reels/public');

let cachedBundleLocation = null;
let bundleInFlight = null;
let renderProgress = { fase: 'idle', porcentaje: 0, mensaje: 'Listo' };
let renderEnCurso = false;

function getChromeExecutable() {
    const candidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

async function launchPuppeteer() {
    const chromePath = getChromeExecutable();
    const launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };

    if (chromePath) {
        launchOptions.executablePath = chromePath;
    }

    return puppeteer.launch(launchOptions);
}

function prepararHtmlVolante(html) {
    const fuenteSistema = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
    return html
        .replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\s*/gi, '')
        .replace(/<link[^>]*fonts\.gstatic\.com[^>]*>\s*/gi, '')
        .replace(/'Poppins', sans-serif/gi, fuenteSistema)
        .replace(/"Poppins", sans-serif/gi, fuenteSistema);
}

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capturarVolante(page, htmlTemplate, orientacion) {
    const alturaViewport = orientacion === 'historia' ? 1920 : 1350;
    await page.setViewport({ width: 1080, height: alturaViewport });

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const url = request.url();
        const tipo = request.resourceType();

        // Fuentes web suelen colgar el render; usamos fuentes del sistema
        if (
            tipo === 'font' ||
            url.includes('fonts.googleapis.com') ||
            url.includes('fonts.gstatic.com')
        ) {
            request.abort();
            return;
        }

        request.continue();
    });

    const htmlListo = prepararHtmlVolante(htmlTemplate);

    // domcontentloaded no espera todas las imágenes — evita timeouts por recursos lentos
    await page.setContent(htmlListo, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Esperar imágenes de productos (máx. 12 s en total)
    await Promise.race([
        page.evaluate(async () => {
            const images = Array.from(document.images);
            await Promise.all(images.map((img) => {
                if (img.complete && img.naturalHeight > 0) return Promise.resolve();
                return new Promise((resolve) => {
                    const done = () => resolve();
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', done, { once: true });
                });
            }));
        }),
        esperar(12000),
    ]);

    // Margen para fondos CSS decorativos (emojis, unsplash)
    await esperar(2000);

    return page.screenshot({ type: 'png' });
}

async function getRemotionBundle() {
    if (cachedBundleLocation) return cachedBundleLocation;
    if (bundleInFlight) return bundleInFlight;

    renderProgress = {
        fase: 'bundle',
        porcentaje: 5,
        mensaje: 'Compilando Remotion (solo la 1ª vez, ~1-2 min)...',
    };
    console.log('📦 Compilando bundle de Remotion (la primera vez tarda 1-2 min)...');

    bundleInFlight = bundle({
        entryPoint: REMOTION_ENTRY,
        publicDir: REMOTION_PUBLIC,
        webpackOverride: (config) => config,
    })
        .then((location) => {
            cachedBundleLocation = location;
            console.log('✅ Bundle de Remotion listo');
            return location;
        })
        .finally(() => {
            bundleInFlight = null;
        });

    return bundleInFlight;
}

async function renderizarReel({ compositionId, inputProps, outputLocation, frameRange }) {
    if (renderEnCurso) {
        throw new Error('Ya hay un video renderizándose. Espera a que termine.');
    }

    renderEnCurso = true;
    const chromePath = getChromeExecutable();

    try {
        const bundleLocation = await getRemotionBundle();

        renderProgress = {
            fase: 'composicion',
            porcentaje: 15,
            mensaje: 'Preparando Chrome y composición...',
        };
        console.log(`🎞️  Composición: ${compositionId}`);

        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: compositionId,
            inputProps,
            browserExecutable: chromePath || undefined,
        });

        const hilos = Math.min(Math.max(os.cpus().length - 1, 2), 6);
        const renderOptions = {
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            inputProps,
            concurrency: hilos,
            browserExecutable: chromePath || undefined,
            onProgress: ({ progress }) => {
                const pctRender = Math.round(progress * 100);
                const pctTotal = Math.round(20 + progress * 75);
                renderProgress = {
                    fase: 'render',
                    porcentaje: pctTotal,
                    mensaje: `Renderizando frames... ${pctRender}%`,
                };
            },
        };

        if (frameRange) {
            renderOptions.frameRange = frameRange;
        }

        renderProgress = {
            fase: 'render',
            porcentaje: 20,
            mensaje: `Renderizando con ${hilos} núcleos...`,
        };
        console.log(`🎬 Renderizando video (${hilos} hilos)...`);

        await renderMedia(renderOptions);

        renderProgress = {
            fase: 'finalizando',
            porcentaje: 98,
            mensaje: 'Guardando archivo MP4...',
        };
    } finally {
        renderEnCurso = false;
        renderProgress = { fase: 'idle', porcentaje: 0, mensaje: 'Listo' };
    }
}

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(publicDir));
app.use(express.static(path.join(__dirname, 'generador-reels', 'public')));

// 1. Ruta para mostrar el Panel de Control
app.get('/', (req, res) => {
    res.render('panel');
});

app.get('/videos/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    if (!/^[\w.-]+\.mp4$/.test(filename)) {
        return res.status(400).json({ error: 'Archivo no válido' });
    }
    const filePath = path.join(publicDir, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Video no encontrado' });
    }
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.sendFile(filePath);
});

app.get('/api/tier4/status', (req, res) => {
    res.json({
        iaConfigurada: tier4.iaConfigurada(),
        modoGratis: true,
        proveedorIA: 'Gemini (capa gratuita Google AI Studio)',
        proveedorVoz: 'Edge TTS (sin costo, sin API key)',
        qr: 'Gratis (generación local)',
    });
});

app.post('/api/ia/copy', async (req, res) => {
    try {
        const { idsSeleccionados, titulo, tema, tagline, usarIA } = req.body;
        if (!idsSeleccionados?.length) {
            return res.status(400).json({ error: 'Selecciona al menos un producto' });
        }

        const response = await fetch('https://api.surtitodoideal.com/api/products');
        const todos = await response.json();
        const lista = Array.isArray(todos) ? todos : todos.data;
        const productosRaw = lista.filter((p) =>
            idsSeleccionados.includes(String(p.id_producto).trim())
        );

        const tituloFinal = titulo || 'Ofertas Surtitodo';
        const temaFinal = tema || 'clasico';
        const taglineFinal = tagline || 'Solo por tiempo limitado';

        if (usarIA === false || !tier4.iaConfigurada()) {
            const procesados = tier4.procesarProductosParaTexto(productosRaw);
            return res.json({
                titulos: [tituloFinal],
                copyFeed: tier4.construirCopyLocal(procesados, tituloFinal, temaFinal),
                copyStories: `🔥 ${tituloFinal} en Surtitodo Ideal. surtitodoideal.com`,
                hashtags: '#SurtitodoIdeal #Caicedonia #Ofertas',
                guionVoz: tier4.construirGuionVoz(procesados, tituloFinal),
                fallback: true,
                aviso: usarIA === false
                    ? 'Copy generado localmente (IA desactivada)'
                    : 'Configura GEMINI_API_KEY para mejorar textos con IA',
            });
        }

        const resultado = await tier4.generarCopyConIA({
            productosRaw,
            titulo: tituloFinal,
            tema: temaFinal,
            tagline: taglineFinal,
        });
        res.json(resultado);
    } catch (error) {
        console.error('❌ Error IA copy:', error);
        res.status(500).json({ error: error.message || 'Error generando copy' });
    }
});

// 2. Ruta POST que recibe los IDs seleccionados y toma la foto
app.post('/generar-volante', async (req, res) => {
    try {
        const {
            idsSeleccionados,
            plantilla,
            tema,
            tituloPrincipal,
            textoTagline,
            orientacion,
            qrDestino,
            qrUrlPersonalizada,
        } = req.body;
        
        console.log(`⏳ Generando volante... Formato: ${orientacion}`);
        const response = await fetch('https://api.surtitodoideal.com/api/products');
        const todosLosProductos = await response.json();

        // Filtramos solo los productos que elegiste en el panel
        const seleccionados = todosLosProductos.filter(p => idsSeleccionados.includes(p.id_producto.trim()));

        // Aplicamos la misma lógica de Surtitodo Ideal (app.js) para las promociones
        const productosOferta = seleccionados.map(p => {
            let precioAntes = Number(p.precio_venta_final);
            let precioFinal = precioAntes;
            let porcentaje = 0;

            if (p.en_promo == 1 && parseFloat(p.descuento_promo) > 0) {
                let desc = parseFloat(p.descuento_promo);
                if (desc <= 100) {
                    precioFinal = precioAntes * (1 - (desc / 100));
                    porcentaje = desc;
                } else {
                    precioFinal = Math.max(0, precioAntes - desc);
                    porcentaje = Math.round((desc / precioAntes) * 100);
                }
            }

            // --- NUEVA LÓGICA: CONVERSIÓN DE KILOS A LIBRAS ---
            let nombreLimpio = p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase();
            const regexKilos = /(?:x\s*)?[0-9.,]*\s*(kg|kl)\b/i;

            if (regexKilos.test(nombreLimpio)) {
                // Dividimos los precios a la mitad
                precioFinal = precioFinal / 2;
                precioAntes = precioAntes / 2;
                // Limpiamos la mención de kilo y añadimos "x Libra"
                nombreLimpio = nombreLimpio.replace(regexKilos, '').trim() + ' x Libra';
            }
            // --------------------------------------------------

            // REDONDEAMOS PARA EVITAR DECIMALES EN LOS VOLANTES
            precioFinal = Math.round(precioFinal);
            precioAntes = Math.round(precioAntes);

            return {
                ...p,
                nombre_limpio: nombreLimpio,
                precio_final_fmt: precioFinal.toLocaleString('es-CO'),
                precio_antes_fmt: precioAntes.toLocaleString('es-CO'),
                porcentaje: Math.round(porcentaje)
            };
        });

        const urlQr = tier4.resolverUrlQr(qrDestino, qrUrlPersonalizada);
        let qrDataUrl = null;
        if (urlQr) {
            qrDataUrl = await tier4.generarQrDataUrl(urlQr);
        }

        // Renderizamos el diseño Premium
        const htmlTemplate = await ejs.renderFile(path.join(__dirname, 'views', 'volante.ejs'), {
            productos: productosOferta,
            baseUrl: 'https://api.surtitodoideal.com',
            plantilla: plantilla || '4',
            tema: tema || 'clasico',
            tituloPrincipal: tituloPrincipal || 'Finde de Ahorro',
            textoTagline: textoTagline || 'Solo por tiempo limitado',
            orientacion: orientacion || 'feed',
            qrDataUrl,
            urlQr,
        });

        const browser = await launchPuppeteer();
        try {
            const page = await browser.newPage();
            const imageBuffer = await capturarVolante(page, htmlTemplate, orientacion);
            res.set('Content-Type', 'image/png');
            res.send(imageBuffer);
        } finally {
            await browser.close();
        }

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error generando el volante' });
    }
});

// --- NUEVA RUTA PARA GENERAR VIDEOS CON REMOTION ---
app.post('/generar-video', async (req, res) => {
    const {
        idsSeleccionados,
        plantillaVideo,
        usarVoz,
        guionVozManual,
        tituloReel,
    } = req.body;

    if (!idsSeleccionados || idsSeleccionados.length === 0) {
        return res.status(400).send('No se seleccionaron productos');
    }

    // --- 🕒 AJUSTE DE TIEMPO DINÁMICO SEGÚN LA PLANTILLA ---
    let framesPorProducto = 180; 
    let framesFinales = 150;
    let framesTotales = 0; // ✅ NUEVO: DECLÁRALA AQUÍ ARRIBA

    // Ajustamos la matemática dependiendo de la plantilla elegida en el select
    if (plantillaVideo === 'ReelBrutalismo') {
        framesPorProducto = 90;
        framesFinales = 90;
    } else if (plantillaVideo === 'ReelAraStyle') {
        // La plantilla estilo Ara dura 180 frames en TOTAL (fijo, no se multiplica)
        framesPorProducto = 0; 
        framesFinales = 180;
    } else if (plantillaVideo === 'ReelLanzamiento') {
        // El de lanzamiento tiene la misma duración que el clásico
        framesPorProducto = 180;
        framesFinales = 150;
    } else if (plantillaVideo === 'ReelTemporada') {
        // 🔥 FIJO PARA 4 PRODUCTOS: 900 frames exactos (15 segundos a 60fps)
        framesTotales = 900; 
    } else if (plantillaVideo === 'ReelCarnaval') { // <-- AGREGA ESTO
        // 120 intro + (150 x cant. productos) + 180 outro
        framesPorProducto = 150;
        framesFinales = 120 + 180; // Intro + Outro
    }
    
    console.log(`🎬 Iniciando renderizado de video (${plantillaVideo}) para ${idsSeleccionados.length} productos...`);

    try {
        const response = await fetch('https://api.surtitodoideal.com/api/products');
        const data = await response.json();
        const listaInventario = Array.isArray(data) ? data : data.data;
        
        const productosVideo = listaInventario
        .filter(p => idsSeleccionados.includes(p.id_producto.toString().trim()))
        .map(p => {
            let nombreLimpio = p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase();
            let urlImagen = p.proimagenurl;
            if (!urlImagen.startsWith('http')) urlImagen = `https://api.surtitodoideal.com${urlImagen}`;

            let precioAntes = Number(p.precio_venta_final);
            let precioFinal = precioAntes;
            let porcentaje = 0;

            if (p.en_promo == 1 && parseFloat(p.descuento_promo) > 0) {
                let desc = parseFloat(p.descuento_promo);
                if (desc <= 100) {
                    precioFinal = precioAntes * (1 - (desc / 100));
                    porcentaje = desc;
                } else {
                    precioFinal = Math.max(0, precioAntes - desc);
                    porcentaje = Math.round((desc / precioAntes) * 100);
                }
            }

            // --- NUEVA LÓGICA: CONVERSIÓN DE KILOS A LIBRAS ---
            const regexKilos = /(?:x\s*)?[0-9.,]*\s*(kg|kl)\b/i;
            if (regexKilos.test(nombreLimpio)) {
                precioFinal = precioFinal / 2;
                precioAntes = precioAntes / 2;
                nombreLimpio = nombreLimpio.replace(regexKilos, '').trim() + ' x Libra';
            }
            // --------------------------------------------------

            return {
                productName: nombreLimpio, // <-- Ya viene procesado
                imageUrl: urlImagen,
                precio: Math.round(precioFinal).toLocaleString('es-CO'),
                precioAntes: Math.round(precioAntes).toLocaleString('es-CO'),
                porcentaje: Math.round(porcentaje)
            };
        });

        // Calculamos la duración total del video con las variables dinámicas
        // Si no tiene un valor fijo asignado arriba, calculamos el dinámico:
        if (framesTotales === 0) {
            framesTotales = (productosVideo.length * framesPorProducto) + framesFinales;
        }

        let voiceoverUrl = null;
        if (usarVoz) {
            const productosRaw = listaInventario.filter((p) =>
                idsSeleccionados.includes(p.id_producto.toString().trim())
            );
            let guion = (guionVozManual || '').trim();
            if (!guion) {
                const procesados = tier4.procesarProductosParaTexto(productosRaw);
                guion = tier4.construirGuionVoz(procesados, tituloReel || 'Ofertas imperdibles');
            }
            const voz = await tier4.generarVozGratis(guion, REMOTION_PUBLIC);
            voiceoverUrl = `voiceovers/${voz.nombreArchivo}`;
            const framesVoz = Math.ceil(voz.duracionSeg * 60) + 60;
            if (framesVoz > framesTotales) {
                framesTotales = framesVoz;
            }
            console.log(`🎙️ Voz generada (${voz.duracionSeg.toFixed(1)}s) — ${voz.proveedor}`);
        }

        const videoProps = { 
            productos: productosVideo,
            companyUrl: "surtitodoideal.com",
            ...(voiceoverUrl && { voiceoverUrl }),
            ...(tituloReel && { reelTitle: tituloReel }),
        };

        const idComposicion = plantillaVideo || 'PromoReel';
        const nombreVideo = `reel_${idComposicion}_${Date.now()}.mp4`;
        const outputLocation = path.join(publicDir, nombreVideo);

        await renderizarReel({
            compositionId: idComposicion,
            inputProps: videoProps,
            outputLocation,
            frameRange: [0, framesTotales - 1],
        });

        const tamano = verificarVideoGenerado(outputLocation);
        console.log(`✅ Video de ${framesTotales} frames generado (${(tamano / 1024 / 1024).toFixed(1)} MB) — ${nombreVideo}`);
        res.json({ urlVideo: `/videos/${nombreVideo}`, nombreArchivo: nombreVideo });

    } catch (error) {
        console.error('❌ Error renderizando video:', error);
        res.status(500).json({ error: error.message || 'Error al generar el video' });
    }
});

// Agrega esto en tu index.js (Servidor Node.js)
app.post('/render-tutorial', async (req, res) => {
    try {
        console.log("🎬 Iniciando renderizado del Tutorial...");

        // 1. Apuntamos al ID exacto que pusiste en Root.tsx
        const compositionId = 'TutorialReel'; 

        // 2. Definimos las propiedades (Puedes recibirlas del req.body si quieres)
        const inputProps = {
            companyUrl: 'surtitodoideal.com',
            videoFileName: 'tutorial.mp4' // Debe coincidir con el archivo en tu carpeta public
        };

        const nombreVideo = `tutorial_${Date.now()}.mp4`;
        const outputLocation = path.join(publicDir, nombreVideo);

        await renderizarReel({
            compositionId,
            inputProps,
            outputLocation,
        });

        verificarVideoGenerado(outputLocation);
        console.log("✅ ¡Video Tutorial renderizado con éxito!");
        res.json({ success: true, message: 'Video creado', url: `/videos/${nombreVideo}` });

    } catch (error) {
        console.error("❌ Error renderizando el tutorial:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// --- CONFIGURACIÓN DE MULTER A PRUEBA DE BALAS ---
const uploadDir = path.join(__dirname, 'generador-reels', 'public', 'uploads');

// 1. SOLUCIÓN AL ERROR HTML: Creamos la carpeta a la fuerza si no existe
if (!fs.existsSync(uploadDir)) {
    console.log("🛠️ Creando carpeta uploads automáticamente...");
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- RUTA PARA GENERAR EL REEL DEL CLIENTE ---
app.post('/generar-reel-cliente', upload.single('clientFoto'), async (req, res) => {
    try {
        console.log("⏳ Generando Reel de Cliente...");
        
        const { clientName, propertyAddress } = req.body;
        const fotoRuta = `/uploads/${req.file.filename}`; 
        
        const baseUrl = getBaseUrl(req);
        const inputProps = {
            clientName: clientName || "CLIENTE FELIZ",
            propertyAddress: propertyAddress || "Surtitodo",
            clientImageUrl: `${baseUrl}${fotoRuta}`,
            logoImageUrl: 'https://api.surtitodoideal.com/static/icon.png'
        };

        const nombreVideo = `reel_cliente_${Date.now()}.mp4`;
        const outputLocation = path.join(publicDir, nombreVideo);

        await renderizarReel({
            compositionId: 'OfferWonReel1',
            inputProps,
            outputLocation,
        });

        verificarVideoGenerado(outputLocation);
        console.log("✅ ¡Reel de cliente renderizado con éxito!");
        res.json({ success: true, message: 'Video creado', url: `/videos/${nombreVideo}` });

    } catch (error) {
        console.error("❌ Error renderizando el Reel del cliente:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/render-progress', (req, res) => {
    res.json(renderProgress);
});

app.get('/api/server-info', (req, res) => {
    res.json({
        baseUrl: getBaseUrl(req),
        localIPs: getLocalIPs(),
        port: PORT
    });
});

// --- NUEVO PUENTE (PROXY) PARA EVITAR CORS ---
app.get('/api/local-products', async (req, res) => {
    try {
        // Tu servidor local (Node) hace la petición, a Node no le afecta el CORS
        const response = await fetch('https://api.surtitodoideal.com/api/products');
        const data = await response.json();
        res.json(data); // Se lo devuelve a tu panel
    } catch (error) {
        console.error('Error en el puente:', error);
        res.status(500).json({ error: 'Error trayendo productos' });
    }
});

// NUEVO PUENTE (PROXY) PARA ESTANCADOS
app.get('/api/local-estancados', async (req, res) => {
    try {
        // CORRECCIÓN CLAVE: Apuntar a la ruta de compras
        const response = await fetch('https://api.surtitodoideal.com/api/compras/estancados');
        
        console.log(`Estado de respuesta API Surtitodo: ${response.status}`); // <-- Esto nos dirá si la encuentra o no
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error en el puente de estancados:', error);
        // Enviar un array vacío en caso de error para que el frontend no colapse
        res.json([]); 
    }
});

app.listen(PORT, HOST, () => {
    const ips = getLocalIPs();
    console.log('🚀 Panel de Marketing listo!');
    console.log(`   💻 Mac:  http://localhost:${PORT}`);
    ips.forEach((ip) => console.log(`   📱 iPad: http://${ip}:${PORT}`));
    if (ips.length === 0) {
        console.log('   ⚠️  No se detectó IP de red local. Verifica tu conexión WiFi.');
    }

    const chrome = getChromeExecutable();
    if (chrome) {
        console.log('   🌐 Chrome detectado — renders más rápidos');
    } else {
        console.log('   ⚠️  Instala Google Chrome para acelerar los renders');
    }

    console.log('   ⏳ Pre-cargando Remotion en segundo plano...');
    getRemotionBundle()
        .then(() => console.log('   ✅ Remotion pre-cargado — el primer reel será más rápido'))
        .catch((err) => console.error('   ❌ Error pre-cargando Remotion:', err.message));
});