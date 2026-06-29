const express = require('express');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderMedia } = require('@remotion/renderer');
const multer = require('multer');
const { crearMarketingData } = require('./lib/marketing-data');
const { crearColaLote } = require('./lib/cola-lote');

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

const marketing = crearMarketingData(publicDir);

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

async function renderizarReel({ compositionId, inputProps, outputLocation, durationInFrames }) {
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

        const duracionRender = durationInFrames || composition.durationInFrames;
        console.log(`   📐 Duración del render: ${duracionRender} frames`);

        const hilos = Math.min(Math.max(os.cpus().length - 1, 2), 6);
        console.log(`🎬 Renderizando video (${hilos} hilos, ${duracionRender} frames)...`);

        await renderMedia({
            composition: {
                ...composition,
                durationInFrames: duracionRender,
            },
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
        });

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

async function obtenerProductosApi() {
    const response = await fetch('https://api.surtitodoideal.com/api/products');
    const data = await response.json();
    return Array.isArray(data) ? data : data.data;
}

function procesarProductosVolante(seleccionados) {
    return seleccionados.map((p) => {
        let precioAntes = Number(p.precio_venta_final);
        let precioFinal = precioAntes;
        let porcentaje = 0;

        if (p.en_promo == 1 && parseFloat(p.descuento_promo) > 0) {
            const desc = parseFloat(p.descuento_promo);
            if (desc <= 100) {
                precioFinal = precioAntes * (1 - desc / 100);
                porcentaje = desc;
            } else {
                precioFinal = Math.max(0, precioAntes - desc);
                porcentaje = Math.round((desc / precioAntes) * 100);
            }
        }

        let nombreLimpio = p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase();
        const regexKilos = /(?:x\s*)?[0-9.,]*\s*(kg|kl)\b/i;
        if (regexKilos.test(nombreLimpio)) {
            precioFinal = precioFinal / 2;
            precioAntes = precioAntes / 2;
            nombreLimpio = nombreLimpio.replace(regexKilos, '').trim() + ' x Libra';
        }

        precioFinal = Math.round(precioFinal);
        precioAntes = Math.round(precioAntes);

        return {
            ...p,
            nombre_limpio: nombreLimpio,
            precio_final_fmt: precioFinal.toLocaleString('es-CO'),
            precio_antes_fmt: precioAntes.toLocaleString('es-CO'),
            porcentaje: Math.round(porcentaje),
        };
    });
}

async function generarVolanteBuffer({ idsSeleccionados, plantilla, tema, tituloPrincipal, textoTagline, orientacion }) {
    const todosLosProductos = await obtenerProductosApi();
    const seleccionados = todosLosProductos.filter((p) =>
        idsSeleccionados.includes(p.id_producto.toString().trim())
    );
    const productosOferta = procesarProductosVolante(seleccionados);

    const htmlTemplate = await ejs.renderFile(path.join(__dirname, 'views', 'volante.ejs'), {
        productos: productosOferta,
        baseUrl: 'https://api.surtitodoideal.com',
        plantilla: plantilla || '4',
        tema: tema || 'clasico',
        tituloPrincipal: tituloPrincipal || 'Finde de Ahorro',
        textoTagline: textoTagline || 'Solo por tiempo limitado',
        orientacion: orientacion || 'feed',
    });

    const browser = await launchPuppeteer();
    try {
        const page = await browser.newPage();
        return await capturarVolante(page, htmlTemplate, orientacion);
    } finally {
        await browser.close();
    }
}

function calcularFramesVideo(plantillaVideo, cantidadProductos) {
    let framesPorProducto = 180;
    let framesFinales = 150;
    let framesTotales = 0;

    if (plantillaVideo === 'ReelBrutalismo') {
        framesPorProducto = 90;
        framesFinales = 90;
    } else if (plantillaVideo === 'ReelAraStyle') {
        framesPorProducto = 0;
        framesFinales = 180;
    } else if (plantillaVideo === 'ReelLanzamiento') {
        framesPorProducto = 180;
        framesFinales = 150;
    } else if (plantillaVideo === 'ReelTemporada') {
        framesTotales = 900;
    } else if (plantillaVideo === 'ReelCarnaval') {
        framesPorProducto = 150;
        framesFinales = 300;
    }

    if (framesTotales === 0) {
        framesTotales = cantidadProductos * framesPorProducto + framesFinales;
    }
    return framesTotales;
}

function prepararProductosVideo(listaInventario, idsSeleccionados) {
    return listaInventario
        .filter((p) => idsSeleccionados.includes(p.id_producto.toString().trim()))
        .map((p) => {
            let nombreLimpio = p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase();
            let urlImagen = p.proimagenurl;
            if (!urlImagen.startsWith('http')) urlImagen = `https://api.surtitodoideal.com${urlImagen}`;

            let precioAntes = Number(p.precio_venta_final);
            let precioFinal = precioAntes;
            let porcentaje = 0;

            if (p.en_promo == 1 && parseFloat(p.descuento_promo) > 0) {
                const desc = parseFloat(p.descuento_promo);
                if (desc <= 100) {
                    precioFinal = precioAntes * (1 - desc / 100);
                    porcentaje = desc;
                } else {
                    precioFinal = Math.max(0, precioAntes - desc);
                    porcentaje = Math.round((desc / precioAntes) * 100);
                }
            }

            const regexKilos = /(?:x\s*)?[0-9.,]*\s*(kg|kl)\b/i;
            if (regexKilos.test(nombreLimpio)) {
                precioFinal = precioFinal / 2;
                precioAntes = precioAntes / 2;
                nombreLimpio = nombreLimpio.replace(regexKilos, '').trim() + ' x Libra';
            }

            return {
                productName: nombreLimpio,
                imageUrl: urlImagen,
                precio: Math.round(precioFinal).toLocaleString('es-CO'),
                precioAntes: Math.round(precioAntes).toLocaleString('es-CO'),
                porcentaje: Math.round(porcentaje),
            };
        });
}

async function generarVideoInterno({ idsSeleccionados, plantillaVideo }) {
    const listaInventario = await obtenerProductosApi();
    const productosVideo = prepararProductosVideo(listaInventario, idsSeleccionados);
    const framesTotales = calcularFramesVideo(plantillaVideo, productosVideo.length);
    const idComposicion = plantillaVideo || 'PromoReel';
    const nombreVideo = `reel_${idComposicion}_${Date.now()}.mp4`;
    const outputLocation = path.join(publicDir, nombreVideo);

    await renderizarReel({
        compositionId: idComposicion,
        inputProps: { productos: productosVideo, companyUrl: 'surtitodoideal.com' },
        outputLocation,
        durationInFrames: framesTotales,
    });

    verificarVideoGenerado(outputLocation);
    return { urlVideo: `/videos/${nombreVideo}`, nombreArchivo: nombreVideo, framesTotales };
}

const colaLote = crearColaLote({
    marketing,
    publicDir,
    obtenerProductosApi,
    capturarVolanteConBrowser: generarVolanteBuffer,
    generarVideoInterno,
    validarSeleccion: (opts) => marketing.validarSeleccion(opts),
});

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

// 2. Ruta POST que recibe los IDs seleccionados y toma la foto
app.post('/generar-volante', async (req, res) => {
    try {
        const { idsSeleccionados, plantilla, tema, tituloPrincipal, textoTagline, orientacion } = req.body;

        const productos = await obtenerProductosApi();
        const validacion = marketing.validarSeleccion({
            idsSeleccionados,
            productos,
            plantillaVolante: plantilla,
            modo: 'volante',
        });
        if (!validacion.valido) {
            return res.status(400).json({ error: validacion.errores.join(' '), validacion });
        }

        console.log(`⏳ Generando volante... Formato: ${orientacion}`);
        const imageBuffer = await generarVolanteBuffer({
            idsSeleccionados,
            plantilla,
            tema,
            tituloPrincipal,
            textoTagline,
            orientacion,
        });

        const campId = `vol_${Date.now()}`;
        const campDir = path.join(marketing.campanasDir, campId);
        fs.mkdirSync(campDir, { recursive: true });
        const nombreArchivo = orientacion === 'historia' ? 'historia.png' : 'feed.png';
        fs.writeFileSync(path.join(campDir, nombreArchivo), imageBuffer);

        const seleccionados = productos.filter((p) =>
            idsSeleccionados.includes(p.id_producto.toString().trim())
        );
        marketing.agregarHistorial({
            tipo: 'volante',
            titulo: tituloPrincipal || 'Finde de Ahorro',
            tema: tema || 'clasico',
            plantilla: plantilla || '4',
            textoTagline: textoTagline || 'Solo por tiempo limitado',
            orientacion: orientacion || 'feed',
            idsSeleccionados,
            nombresProductos: seleccionados.map((p) => p.nombre),
            volante: `/campanas/${campId}/${nombreArchivo}`,
        });

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error generando el volante' });
    }
});

// --- RUTA PARA GENERAR VIDEOS CON REMOTION ---
app.post('/generar-video', async (req, res) => {
    const { idsSeleccionados, plantillaVideo } = req.body;

    try {
        const productos = await obtenerProductosApi();
        const validacion = marketing.validarSeleccion({
            idsSeleccionados,
            productos,
            plantillaVideo: plantillaVideo || 'PromoReel',
            modo: 'video',
        });
        if (!validacion.valido) {
            return res.status(400).json({ error: validacion.errores.join(' '), validacion });
        }

        console.log(`🎬 Iniciando renderizado de video (${plantillaVideo}) para ${idsSeleccionados.length} productos...`);
        const resultado = await generarVideoInterno({ idsSeleccionados, plantillaVideo });

        const seleccionados = productos.filter((p) =>
            idsSeleccionados.includes(p.id_producto.toString().trim())
        );
        marketing.agregarHistorial({
            tipo: 'reel',
            plantillaVideo: plantillaVideo || 'PromoReel',
            idsSeleccionados,
            nombresProductos: seleccionados.map((p) => p.nombre),
            reel: resultado.urlVideo,
        });

        const tamano = fs.statSync(path.join(publicDir, resultado.nombreArchivo)).size;
        console.log(`✅ Video generado (${(tamano / 1024 / 1024).toFixed(1)} MB) — ${resultado.nombreArchivo}`);
        res.json({ urlVideo: resultado.urlVideo, nombreArchivo: resultado.nombreArchivo, validacion });
    } catch (error) {
        console.error('❌ Error renderizando video:', error);
        res.status(500).json({ error: error.message || 'Error al generar el video' });
    }
});

// --- VALIDACIÓN PRE-GENERACIÓN ---
app.post('/api/validar', async (req, res) => {
    try {
        const { idsSeleccionados, plantilla, plantillaVideo, modo } = req.body;
        const productos = await obtenerProductosApi();
        const validacion = marketing.validarSeleccion({
            idsSeleccionados,
            productos,
            plantillaVolante: plantilla,
            plantillaVideo,
            modo: modo || 'ambos',
        });
        res.json(validacion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- PRESETS ---
app.get('/api/presets', (req, res) => {
    res.json(marketing.leerJson(marketing.presetsPath, []));
});

app.post('/api/presets', (req, res) => {
    const { nombre, config } = req.body;
    if (!nombre || !config) {
        return res.status(400).json({ error: 'Faltan nombre o configuración' });
    }
    const presets = marketing.leerJson(marketing.presetsPath, []);
    const preset = {
        id: `preset_${Date.now()}`,
        nombre,
        config,
        fecha: new Date().toISOString(),
    };
    presets.unshift(preset);
    marketing.guardarJson(marketing.presetsPath, presets);
    res.json(preset);
});

app.delete('/api/presets/:id', (req, res) => {
    const presets = marketing.leerJson(marketing.presetsPath, []);
    const filtrados = presets.filter((p) => p.id !== req.params.id);
    marketing.guardarJson(marketing.presetsPath, filtrados);
    res.json({ ok: true });
});

// --- HISTORIAL ---
app.get('/api/historial', (req, res) => {
    res.json(marketing.leerJson(marketing.historialPath, []));
});

app.delete('/api/historial/:id', (req, res) => {
    const historial = marketing.leerJson(marketing.historialPath, []);
    marketing.guardarJson(
        marketing.historialPath,
        historial.filter((h) => h.id !== req.params.id)
    );
    res.json({ ok: true });
});

// --- CAMPAÑA COMPLETA ---
let campanaProgress = { fase: 'idle', porcentaje: 0, mensaje: 'Listo' };

app.get('/api/campana-progress', (req, res) => {
    res.json(campanaProgress);
});

app.post('/api/campana-completa', async (req, res) => {
    const {
        idsSeleccionados,
        plantilla,
        tema,
        tituloPrincipal,
        textoTagline,
        plantillaVideo,
    } = req.body;

    try {
        const productos = await obtenerProductosApi();
        const validacion = marketing.validarSeleccion({
            idsSeleccionados,
            productos,
            plantillaVolante: plantilla,
            plantillaVideo: plantillaVideo || 'PromoReel',
            modo: 'campana',
        });
        if (!validacion.valido) {
            return res.status(400).json({ error: validacion.errores.join(' '), validacion });
        }

        const campId = `camp_${Date.now()}`;
        const campDir = path.join(marketing.campanasDir, campId);
        fs.mkdirSync(campDir, { recursive: true });

        const titulo = tituloPrincipal || 'Finde de Ahorro';
        const configVolante = { idsSeleccionados, plantilla, tema, tituloPrincipal: titulo, textoTagline, orientacion: 'feed' };

        campanaProgress = { fase: 'volante_feed', porcentaje: 10, mensaje: 'Generando volante feed...' };
        const feedBuffer = await generarVolanteBuffer({ ...configVolante, orientacion: 'feed' });
        fs.writeFileSync(path.join(campDir, 'feed.png'), feedBuffer);

        campanaProgress = { fase: 'volante_historia', porcentaje: 30, mensaje: 'Generando volante historia...' };
        const historiaBuffer = await generarVolanteBuffer({ ...configVolante, orientacion: 'historia' });
        fs.writeFileSync(path.join(campDir, 'historia.png'), historiaBuffer);

        campanaProgress = { fase: 'reel', porcentaje: 45, mensaje: 'Renderizando reel (puede tardar varios minutos)...' };
        const resultadoVideo = await generarVideoInterno({
            idsSeleccionados,
            plantillaVideo: plantillaVideo || 'PromoReel',
        });

        const videoDestino = path.join(campDir, 'reel.mp4');
        fs.copyFileSync(path.join(publicDir, resultadoVideo.nombreArchivo), videoDestino);

        const seleccionados = productos.filter((p) =>
            idsSeleccionados.includes(p.id_producto.toString().trim())
        );
        const copy = marketing.construirCopyTexto(seleccionados, titulo, tema || 'clasico');
        fs.writeFileSync(path.join(campDir, 'copy.txt'), copy, 'utf8');

        campanaProgress = { fase: 'done', porcentaje: 100, mensaje: '¡Campaña lista!' };

        const entrada = marketing.agregarHistorial({
            tipo: 'campana',
            titulo,
            tema: tema || 'clasico',
            plantilla: plantilla || '4',
            plantillaVideo: plantillaVideo || 'PromoReel',
            textoTagline: textoTagline || 'Solo por tiempo limitado',
            idsSeleccionados,
            nombresProductos: seleccionados.map((p) => p.nombre),
            volanteFeed: `/campanas/${campId}/feed.png`,
            volanteHistoria: `/campanas/${campId}/historia.png`,
            reel: `/campanas/${campId}/reel.mp4`,
            copy,
            campId,
        });

        res.json({
            ok: true,
            campId,
            historialId: entrada.id,
            volanteFeed: `/campanas/${campId}/feed.png`,
            volanteHistoria: `/campanas/${campId}/historia.png`,
            reel: `/campanas/${campId}/reel.mp4`,
            copy,
            validacion,
        });
    } catch (error) {
        console.error('❌ Error campaña completa:', error);
        campanaProgress = { fase: 'error', porcentaje: 0, mensaje: error.message };
        res.status(500).json({ error: error.message || 'Error generando la campaña' });
    } finally {
        setTimeout(() => {
            campanaProgress = { fase: 'idle', porcentaje: 0, mensaje: 'Listo' };
        }, 3000);
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

const bibliotecaDir = path.join(publicDir, 'biblioteca');
if (!fs.existsSync(bibliotecaDir)) {
    fs.mkdirSync(bibliotecaDir, { recursive: true });
}

const storageBiblioteca = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, bibliotecaDir),
    filename: (_req, file, cb) => {
        const base = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}_${base}`);
    },
});
const uploadBiblioteca = multer({
    storage: storageBiblioteca,
    limits: { fileSize: 10 * 1024 * 1024 },
});

app.get('/api/calendario', (req, res) => {
    res.json(marketing.obtenerEventosCalendario());
});

app.get('/api/biblioteca', (req, res) => {
    try {
        const archivos = fs.readdirSync(bibliotecaDir)
            .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f))
            .map((f) => ({ nombre: f, url: `/biblioteca/${f}` }));
        res.json(archivos);
    } catch (e) {
        res.json([]);
    }
});

app.post('/api/biblioteca/upload', uploadBiblioteca.array('archivos', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se recibieron archivos' });
    }
    res.json({
        ok: true,
        archivos: req.files.map((f) => ({ nombre: f.filename, url: `/biblioteca/${f.filename}` })),
    });
});

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

app.get('/api/lote/progreso', (req, res) => {
    res.json(colaLote.obtenerProgreso());
});

app.post('/api/lote/preview', async (req, res) => {
    try {
        const { tipo, ...body } = req.body;
        const tareas = await colaLote.construirTareas(tipo, body);
        res.json({
            total: tareas.length,
            tareas: tareas.map((t) => ({ tipo: t.tipo, etiqueta: t.etiqueta })),
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/lote/iniciar', async (req, res) => {
    try {
        const { tipo, ...body } = req.body;
        if (!tipo) {
            return res.status(400).json({ error: 'Falta el tipo de lote' });
        }
        const resultado = await colaLote.iniciar(tipo, body);
        res.json({ ok: true, ...resultado });
    } catch (error) {
        res.status(400).json({ error: error.message });
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