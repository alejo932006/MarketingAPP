const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const execFileAsync = promisify(execFile);

const MODELO_GEMINI = 'gemini-2.0-flash';
const VOZ_EDGE = 'es-CO-SalomeNeural';

function cargarEnv(raizProyecto) {
    const envPath = path.join(raizProyecto, '.env');
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .forEach((linea) => {
            const limpia = linea.trim();
            if (!limpia || limpia.startsWith('#')) return;
            const idx = limpia.indexOf('=');
            if (idx === -1) return;
            const clave = limpia.slice(0, idx).trim();
            let valor = limpia.slice(idx + 1).trim();
            if (
                (valor.startsWith('"') && valor.endsWith('"')) ||
                (valor.startsWith("'") && valor.endsWith("'"))
            ) {
                valor = valor.slice(1, -1);
            }
            if (!process.env[clave]) process.env[clave] = valor;
        });
}

function obtenerGeminiKey() {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    const legacy = process.env.OPENAI_API_KEY || '';
    if (legacy.startsWith('AIza')) return legacy;
    return null;
}

function iaConfigurada() {
    return Boolean(obtenerGeminiKey());
}

const DESTINOS_QR = {
    ninguno: null,
    web: 'https://surtitodoideal.com',
    whatsapp: 'https://wa.me/573128406312',
};

function resolverUrlQr(destino, urlPersonalizada) {
    if (!destino || destino === 'ninguno') return null;
    if (destino === 'personalizado') {
        const url = (urlPersonalizada || '').trim();
        if (!url) return null;
        return url.startsWith('http') ? url : `https://${url}`;
    }
    return DESTINOS_QR[destino] || null;
}

async function generarQrDataUrl(urlDestino) {
    if (!urlDestino) return null;
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(urlDestino)}`;
    const res = await fetch(qrApi);
    if (!res.ok) throw new Error('No se pudo generar el código QR');
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

function procesarProductosParaTexto(productosRaw) {
    return productosRaw.map((p) => {
        let nombreLimpio = p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase();
        let precioFinal = Number(p.precio_venta_final);
        if (p.en_promo == 1 && parseFloat(p.descuento_promo || 0) > 0) {
            const desc = parseFloat(p.descuento_promo);
            precioFinal = desc <= 100 ? precioFinal * (1 - desc / 100) : Math.max(0, precioFinal - desc);
        }
        const regexKilos = /(?:x\s*)?[0-9.,]*\s*(kg|kl)\b/i;
        if (regexKilos.test(nombreLimpio)) {
            precioFinal = precioFinal / 2;
            nombreLimpio = nombreLimpio.replace(regexKilos, '').trim() + ' x Libra';
        }
        precioFinal = Math.round(precioFinal);
        return {
            nombre: nombreLimpio,
            precio: precioFinal,
            precioFmt: precioFinal.toLocaleString('es-CO'),
        };
    });
}

function construirGuionVoz(productosProcesados, titulo) {
    const intro = `¡Atención Caicedonia! ${titulo} en Surtitodo Ideal. `;
    const cuerpo = productosProcesados
        .map((p) => `${p.nombre}, a solo ${p.precioFmt} pesos`)
        .join('. ');
    const cierre =
        '. Pide en surtitodoideal.com o escríbenos al tres doce, ochocientos cuarenta, sesenta y tres, doce.';
    return (intro + cuerpo + cierre).replace(/\s+/g, ' ').trim();
}

function construirCopyLocal(productosProcesados, titulo, tema) {
    let copy = '';
    if (tema === 'lanzamiento') {
        copy = `✨ ¡ATENCIÓN CAICEDONIA! Novedades en Surtitodo Ideal ✨\n\n🚨 ¡${titulo}! 🚨\n\n`;
    } else {
        copy = `🚨 ¡${titulo} en Surtitodo Ideal! 🚨\n\n`;
    }
    productosProcesados.forEach((p) => {
        copy += tema === 'lanzamiento'
            ? `🆕 ${p.nombre} ➡️ $${p.precioFmt}\n`
            : `✅ ${p.nombre} ➡️ $${p.precioFmt}\n`;
    });
    copy += `\n🛒 surtitodoideal.com\n📱 WhatsApp: 312 840 6312\n\n#SurtitodoIdeal #Caicedonia #Ofertas`;
    return copy;
}

async function llamarGemini(prompt) {
    const apiKey = obtenerGeminiKey();
    if (!apiKey) {
        throw new Error('Configura GEMINI_API_KEY en tu archivo .env (Google AI Studio, capa gratuita)');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_GEMINI}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
            },
        }),
    });

    const data = await res.json();
    if (!res.ok) {
        const msg = data.error?.message || 'Error al consultar Gemini';
        if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('Cuota gratuita de Gemini agotada por hoy. Usa el copy local o espera mañana.');
        }
        throw new Error(msg);
    }

    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) throw new Error('Gemini no devolvió contenido');
    return JSON.parse(texto);
}

async function generarCopyConIA({ productosRaw, titulo, tema, tagline }) {
    const productos = procesarProductosParaTexto(productosRaw);
    const listaProductos = productos.map((p) => `- ${p.nombre}: $${p.precioFmt} COP`).join('\n');

    const prompt = `Eres copywriter de Surtitodo Ideal, supermercado en Caicedonia, Valle del Cauca, Colombia.
Genera textos de marketing en español colombiano, cercano y claro.

Datos:
- Título campaña: ${titulo}
- Tema visual: ${tema}
- Tagline: ${tagline || 'Solo por tiempo limitado'}
- Productos (usa EXACTAMENTE estos nombres y precios, no inventes otros):
${listaProductos}

Responde SOLO JSON válido con esta estructura:
{
  "titulos": ["título 1", "título 2", "título 3"],
  "copyFeed": "copy para Instagram/Facebook feed, con emojis moderados",
  "copyStories": "copy más corto para historias",
  "hashtags": "#SurtitodoIdeal #Caicedonia ...",
  "guionVoz": "guion hablado de 20-35 segundos para narración del reel, menciona productos y precios en pesos colombianos sin símbolo $, termina invitando a surtitodoideal.com"
}`;

    try {
        return await llamarGemini(prompt);
    } catch (err) {
        return {
            titulos: [titulo, `${titulo} — Caicedonia`, `Ofertas ${titulo}`],
            copyFeed: construirCopyLocal(productos, titulo, tema),
            copyStories: `🔥 ${titulo} en Surtitodo Ideal. ¡Corre antes de que se acaben! surtitodoideal.com`,
            hashtags: '#SurtitodoIdeal #Caicedonia #Ofertas #MercadoEnCasa',
            guionVoz: construirGuionVoz(productos, titulo),
            fallback: true,
            aviso: err.message,
        };
    }
}

async function obtenerDuracionAudioSegundos(rutaArchivo) {
    try {
        const { stdout } = await execFileAsync('ffprobe', [
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            rutaArchivo,
        ]);
        const seg = parseFloat(stdout.trim());
        if (Number.isFinite(seg) && seg > 0) return seg;
    } catch (e) {
        /* ffprobe no disponible */
    }
    const bytes = fs.statSync(rutaArchivo).size;
    return Math.max(3, bytes / 16000);
}

async function generarVozGratis(guion, remotionPublicDir) {
    const texto = (guion || '').trim();
    if (texto.length < 10) {
        throw new Error('El guion de voz es demasiado corto');
    }

    const voiceoversDir = path.join(remotionPublicDir, 'voiceovers');
    if (!fs.existsSync(voiceoversDir)) fs.mkdirSync(voiceoversDir, { recursive: true });

    const nombreArchivo = `voz_${Date.now()}.mp3`;
    const rutaSalida = path.join(voiceoversDir, nombreArchivo);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOZ_EDGE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = await tts.toStream(texto.slice(0, 3000));

    await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(rutaSalida);
        audioStream.pipe(ws);
        audioStream.on('error', reject);
        ws.on('finish', resolve);
        ws.on('error', reject);
    });

    if (!fs.existsSync(rutaSalida) || fs.statSync(rutaSalida).size < 500) {
        throw new Error('No se pudo generar el audio de voz');
    }

    const duracionSeg = await obtenerDuracionAudioSegundos(rutaSalida);
    return {
        ruta: rutaSalida,
        nombreArchivo,
        urlPublica: `/voiceovers/${nombreArchivo}`,
        duracionSeg,
        proveedor: 'edge-tts-gratis',
    };
}

module.exports = {
    cargarEnv,
    iaConfigurada,
    obtenerGeminiKey,
    resolverUrlQr,
    generarQrDataUrl,
    procesarProductosParaTexto,
    construirGuionVoz,
    construirCopyLocal,
    generarCopyConIA,
    generarVozGratis,
    obtenerDuracionAudioSegundos,
};
