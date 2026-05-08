const express = require('express');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const { bundle } = require('@remotion/bundler');
const { selectComposition, renderMedia } = require('@remotion/renderer');
const multer = require('multer');

const app = express();
app.set('view engine', 'ejs');
// Middleware para poder recibir JSON desde el panel
app.use(express.json());
app.use(express.static(path.join(__dirname, 'generador-reels', 'public')));

// 1. Ruta para mostrar el Panel de Control
app.get('/', (req, res) => {
    res.render('panel');
});

// 2. Ruta POST que recibe los IDs seleccionados y toma la foto
app.post('/generar-volante', async (req, res) => {
    try {
        const { idsSeleccionados, plantilla, tema, tituloPrincipal, textoTagline, orientacion } = req.body; 
        
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

            // REDONDEAMOS PARA EVITAR DECIMALES EN LOS VOLANTES
            precioFinal = Math.round(precioFinal);
            precioAntes = Math.round(precioAntes);

            return {
                ...p,
                nombre_limpio: p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase(),
                precio_final_fmt: precioFinal.toLocaleString('es-CO'),
                precio_antes_fmt: precioAntes.toLocaleString('es-CO'),
                porcentaje: Math.round(porcentaje)
            };
        });

        // Renderizamos el diseño Premium
        const htmlTemplate = await ejs.renderFile(path.join(__dirname, 'views', 'volante.ejs'), {
            productos: productosOferta,
            baseUrl: 'https://api.surtitodoideal.com',
            plantilla: plantilla || '4',
            tema: tema || 'clasico',
            tituloPrincipal: tituloPrincipal || 'Finde de Ahorro',
            textoTagline: textoTagline || 'Solo por tiempo limitado',
            orientacion: orientacion || 'feed' // <-- LO PASAMOS A LA PLANTILLA
        });

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        // 2. MAGIA: AJUSTAMOS EL TAMAÑO DE LA CÁMARA SEGÚN LA OPCIÓN
        const alturaViewport = orientacion === 'historia' ? 1920 : 1350;
        await page.setViewport({ width: 1080, height: alturaViewport });
        
        await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

        const imageBuffer = await page.screenshot({ type: 'png' });
        await browser.close();

        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error generando el volante' });
    }
});

// --- NUEVA RUTA PARA GENERAR VIDEOS CON REMOTION ---
app.post('/generar-video', async (req, res) => {
    const { idsSeleccionados, plantillaVideo } = req.body;

    if (!idsSeleccionados || idsSeleccionados.length === 0) {
        return res.status(400).send('No se seleccionaron productos');
    }

    // --- 🕒 AJUSTE DE TIEMPO DINÁMICO SEGÚN LA PLANTILLA ---
    let framesPorProducto = 180; 
    let framesFinales = 150;

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

            return {
                productName: nombreLimpio,
                imageUrl: urlImagen,
                precio: Math.round(precioFinal).toLocaleString('es-CO'),
                precioAntes: Math.round(precioAntes).toLocaleString('es-CO'),
                porcentaje: Math.round(porcentaje)
            };
        });

        // Calculamos la duración total del video con las variables dinámicas
        const framesTotales = (productosVideo.length * framesPorProducto) + framesFinales;

        const videoProps = { 
            productos: productosVideo,
            companyUrl: "surtitodoideal.com" 
        };

        const remotionFolder = path.join(__dirname, 'generador-reels');
        const propsPath = path.join(remotionFolder, 'datos-video.json');
        fs.writeFileSync(propsPath, JSON.stringify(videoProps));

        const videoSalida = path.join(__dirname, 'public', 'oferta.mp4'); 
        const idComposicion = plantillaVideo || 'PromoReel';

        // 🚀 MODIFICACIÓN DEL COMANDO:
        const comando = `npx remotion render src/index.ts ${idComposicion} "${videoSalida}" --props=./datos-video.json --frames=0-${framesTotales - 1}`;
        exec(comando, { cwd: remotionFolder }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error renderizando video: ${error.message}`);
                return res.status(500).send('Error al generar el video');
            }
            
            console.log(`✅ Video de ${framesTotales} frames generado con éxito! (${plantillaVideo})`);
            res.json({ urlVideo: '/oferta.mp4' }); 
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
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

        // 3. Empaquetamos el proyecto de Remotion
        const bundleLocation = await bundle({
            entryPoint: path.resolve('./generador-reels/src/index.ts'), // Ajusta la ruta a tu Root/index
            webpackOverride: (config) => config,
        });

        // 4. Obtenemos la composición para saber cuánto dura (1260 frames)
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: compositionId,
            inputProps,
        });

        // 5. Renderizamos y guardamos el MP4 final
        const outputLocation = path.resolve('./public/tutorial_final.mp4'); 
        
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            inputProps,
            concurrency: 1,
        });

        console.log("✅ ¡Video Tutorial renderizado con éxito!");
        res.json({ success: true, message: 'Video creado', url: '/tutorial_final.mp4' });

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
        
        const inputProps = {
            clientName: clientName || "CLIENTE FELIZ",
            propertyAddress: propertyAddress || "Surtitodo",
            clientImageUrl: `http://localhost:4000${fotoRuta}`,
            logoImageUrl: `http://localhost:4000/icon.png`
        };

        // 2. SOLUCIÓN A LA RUTA DE REMOTION: Ahora apunta a la carpeta generador-reels
        const bundleLocation = await bundle({
            entryPoint: path.resolve('./generador-reels/src/index.ts'),
            webpackOverride: (config) => config,
        });
        
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'OfferWonReel1', 
            inputProps,
        });

        const nombreVideo = `reel_cliente_${Date.now()}.mp4`;
        const outputLocation = path.resolve(`./public/${nombreVideo}`); 
        
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            inputProps,
            concurrency: 1,
        });

        console.log("✅ ¡Reel de cliente renderizado con éxito!");
        res.json({ success: true, message: 'Video creado', url: `/${nombreVideo}` });

    } catch (error) {
        console.error("❌ Error renderizando el Reel del cliente:", error);
        res.status(500).json({ success: false, error: error.message });
    }
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

app.listen(4000, () => {
    console.log('🚀 Panel de Marketing listo! Entra a: http://localhost:4000');
});