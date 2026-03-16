const express = require('express');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
app.set('view engine', 'ejs');
// Middleware para poder recibir JSON desde el panel
app.use(express.json());

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
    const { idsSeleccionados } = req.body;

    if (!idsSeleccionados || idsSeleccionados.length === 0) {
        return res.status(400).send('No se seleccionaron productos');
    }

    console.log(`🎬 Iniciando renderizado de video para ${idsSeleccionados.length} productos...`);

    try {
        // 1. Traemos los datos de tu API (Igual que con los volantes)
        const response = await fetch('https://api.surtitodoideal.com/api/products');
        const data = await response.json();
        
        // 2. Filtramos y formateamos los productos al formato que Remotion espera
        // 2. BLINDAJE: Verificamos si los productos vienen directos en el array o dentro de .data
        const listaInventario = Array.isArray(data) ? data : data.data;

        // Filtramos y formateamos los productos
        const productosVideo = listaInventario
            .filter(p => idsSeleccionados.includes(p.id_producto.toString().trim()))
            .map(p => {
                // Limpiamos el nombre
                let nombreLimpio = p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase();
                
                // BLINDAJE PARA LA IMAGEN: Revisamos si ya trae el https:// o si hay que ponérselo
                let urlImagen = p.proimagenurl;
                if (!urlImagen.startsWith('http')) {
                    urlImagen = `https://api.surtitodoideal.com${urlImagen}`;
                }

                return {
                    productName: nombreLimpio,
                    imageUrl: urlImagen,
                    precio: Number(p.precio_venta_final).toLocaleString('es-CO')
                };
            });

        const videoProps = { productos: productosVideo };

        // 3. Guardamos estos datos en un archivo JSON temporal dentro de la carpeta de Remotion
        const remotionFolder = path.join(__dirname, 'generador-reels');
        const propsPath = path.join(remotionFolder, 'datos-video.json');
        fs.writeFileSync(propsPath, JSON.stringify(videoProps));

        // 4. Ejecutamos el motor de Remotion por consola
        // Le decimos que exporte a "public/oferta.mp4" (asegúrate de tener la carpeta public en tu proyecto principal)
        const videoSalida = path.join(__dirname, 'public', 'oferta.mp4'); 
        
        // El comando mágico que compila el video
        const comando = `npx remotion render src/index.ts PromoReel "${videoSalida}" --props=./datos-video.json`;

        exec(comando, { cwd: remotionFolder }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error renderizando video: ${error.message}`);
                return res.status(500).send('Error al generar el video');
            }
            
            console.log('✅ Video generado con éxito!');
            // Le enviamos la URL del video generado al navegador
            res.json({ urlVideo: '/oferta.mp4' }); 
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
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

app.listen(4000, () => {
    console.log('🚀 Panel de Marketing listo! Entra a: http://localhost:4000');
});