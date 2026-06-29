const fs = require('fs');
const path = require('path');

function crearMarketingData(publicDir) {
    const dataDir = path.join(path.dirname(publicDir), 'data');
    const campanasDir = path.join(publicDir, 'campanas');
    const historialPath = path.join(dataDir, 'historial.json');
    const presetsPath = path.join(dataDir, 'presets.json');

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(campanasDir)) fs.mkdirSync(campanasDir, { recursive: true });

    function leerJson(ruta, valorDefault = []) {
        try {
            if (fs.existsSync(ruta)) {
                return JSON.parse(fs.readFileSync(ruta, 'utf8'));
            }
        } catch (e) {
            console.warn('Error leyendo JSON:', ruta, e.message);
        }
        return valorDefault;
    }

    function guardarJson(ruta, datos) {
        fs.mkdirSync(path.dirname(ruta), { recursive: true });
        fs.writeFileSync(ruta, JSON.stringify(datos, null, 2));
    }

    function agregarHistorial(entrada) {
        const historial = leerJson(historialPath, []);
        const item = {
            id: `camp_${Date.now()}`,
            fecha: new Date().toISOString(),
            ...entrada,
        };
        historial.unshift(item);
        if (historial.length > 100) historial.length = 100;
        guardarJson(historialPath, historial);
        return item;
    }

    function construirCopyTexto(productosRaw, titulo, tema) {
        let copy = '';
        if (tema === 'lanzamiento') {
            copy = `✨ ¡ATENCIÓN CAICEDONIA! Han llegado cosas increíbles a Surtitodo Ideal ✨\n\n🚨 ¡${titulo}! 🚨\n\nDescubre estas novedades:\n\n`;
        } else if (tema === 'sorpresa') {
            copy = `🔥 ¡${titulo} — LIQUIDACIÓN en Surtitodo Ideal! 🔥\n\n⚠️ Últimas unidades — no te quedes sin el tuyo:\n\n`;
        } else {
            copy = `🚨 ¡${titulo} en Surtitodo Ideal! 🚨\n\n`;
        }

        productosRaw.forEach((p) => {
            let nombreLimpio = p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase();
            let precioFinal = Number(p.precio_venta_final);
            if (p.en_promo == 1 && parseFloat(p.descuento_promo) > 0) {
                const desc = parseFloat(p.descuento_promo);
                precioFinal = desc <= 100 ? precioFinal * (1 - desc / 100) : Math.max(0, precioFinal - desc);
            }
            const regexKilos = /(?:x\s*)?[0-9.,]*\s*(kg|kl)\b/i;
            if (regexKilos.test(nombreLimpio)) {
                precioFinal = precioFinal / 2;
                nombreLimpio = nombreLimpio.replace(regexKilos, '').trim() + ' x Libra';
            }
            precioFinal = Math.round(precioFinal);
            const precioFormato = precioFinal.toLocaleString('es-CO');
            if (tema === 'lanzamiento') {
                copy += `🆕 ${nombreLimpio} ➡️ Precio de Estreno: $${precioFormato}\n`;
            } else if (tema === 'sorpresa') {
                copy += `💥 ${nombreLimpio} ➡️ solo $${precioFormato} — ¡corre!\n`;
            } else {
                copy += `✅ ${nombreLimpio} ➡️ por solo $${precioFormato}\n`;
            }
        });

        copy += `\n🛒 Pide sin salir de casa en:\n🌐 surtitodoideal.com\n\n📱 WhatsApp: 312 840 6312\n\n`;
        if (tema === 'lanzamiento') {
            copy += '#SurtitodoIdeal #Caicedonia #NuevosIngresos #Novedades';
        } else if (tema === 'sorpresa') {
            copy += '#SurtitodoIdeal #Caicedonia #Liquidacion #Remate #Ofertas';
        } else {
            copy += '#SurtitodoIdeal #Caicedonia #Ofertas #MercadoEnCasa';
        }
        return copy;
    }

    const EVENTOS_FIJOS = [
        { id: 'carnaval', nombre: 'Carnaval', mes: 2, dia: 15, tema: 'carnaval', titulo: 'Gran Carnaval', tagline: '¡Aprovecha hoy mismo!', plantillaVideo: 'ReelCarnaval' },
        { id: 'madre', nombre: 'Día de la Madre', mes: 5, dia: 11, tema: 'vip', titulo: 'Especial Día Mamá', tagline: 'Exclusivo Web', plantillaVideo: 'ReelElegante' },
        { id: 'cyber', nombre: 'Cyber Surtitodo', mes: 11, dia: 11, tema: 'ecommerce', titulo: 'Cyber Surtitodo', tagline: 'Exclusivo Web', plantillaVideo: 'ReelLanzamiento' },
        { id: 'navidad', nombre: 'Temporada Navideña', mes: 12, dia: 15, tema: 'vip', titulo: 'Especial Navidad', tagline: 'Precios imbatibles', plantillaVideo: 'ReelTemporada' },
    ];

    const EVENTOS_MENSUALES = [
        { id: 'madrugon', nombre: 'Gran Madrugón (día 5)', dia: 5, tema: 'clasico', titulo: 'Gran Madrugón', tagline: 'Solo por tiempo limitado', plantillaVideo: 'PromoReel' },
        { id: 'quincena_15', nombre: 'Quincena de Ofertas (día 15)', dia: 15, tema: 'clasico', titulo: 'Quincena de Ofertas', tagline: 'Precios imbatibles', plantillaVideo: 'PromoReel' },
        { id: 'quincena_30', nombre: 'Fin de Mes (día 30)', dia: 30, tema: 'sorpresa', titulo: 'Precios de Locura', tagline: '¡Aprovecha hoy mismo!', plantillaVideo: 'ReelBrutalismo' },
    ];

    function proximaFechaFija(mes, dia) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        let fecha = new Date(hoy.getFullYear(), mes - 1, dia);
        if (fecha < hoy) fecha = new Date(hoy.getFullYear() + 1, mes - 1, dia);
        return fecha;
    }

    function proximaFechaMensual(dia) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        let fecha = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
        if (fecha < hoy) fecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1, dia);
        return fecha;
    }

    function obtenerEventosCalendario(diasVentana = 45) {
        const eventos = [];

        EVENTOS_FIJOS.forEach((ev) => {
            const fecha = proximaFechaFija(ev.mes, ev.dia);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const diasRestantes = Math.round((fecha - hoy) / 86400000);
            eventos.push({
                ...ev,
                diasRestantes,
                fechaTexto: fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }),
            });
        });

        EVENTOS_MENSUALES.forEach((ev) => {
            const fecha = proximaFechaMensual(ev.dia);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const diasRestantes = Math.round((fecha - hoy) / 86400000);
            eventos.push({
                ...ev,
                diasRestantes,
                fechaTexto: fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }),
            });
        });

        return eventos
            .filter((ev) => ev.diasRestantes <= diasVentana)
            .sort((a, b) => a.diasRestantes - b.diasRestantes);
    }

    function validarSeleccion({ idsSeleccionados, productos, plantillaVolante, plantillaVideo, modo }) {
        const errores = [];
        const advertencias = [];

        if (!idsSeleccionados || idsSeleccionados.length === 0) {
            errores.push('Selecciona al menos un producto.');
            return { valido: false, errores, advertencias };
        }

        const limiteVolante = parseInt(plantillaVolante, 10) || 4;
        const generaVolante = modo === 'volante' || modo === 'campana' || modo === 'ambos';
        const generaVideo = modo === 'video' || modo === 'campana' || modo === 'ambos';

        if (generaVolante && idsSeleccionados.length > limiteVolante) {
            errores.push(
                `Seleccionaste ${idsSeleccionados.length} productos pero la plantilla de volante admite máximo ${limiteVolante}.`
            );
        }

        if (generaVideo && plantillaVideo === 'ReelAraStyle' && idsSeleccionados.length > 1) {
            errores.push('Reel Impacto (1 Producto) solo admite un producto.');
        }

        if (generaVideo && plantillaVideo === 'ReelTemporada' && idsSeleccionados.length !== 4) {
            advertencias.push('Reel Especial de Temporada funciona mejor con exactamente 4 productos.');
        }

        const regexKilos = /(?:x\s*)?[0-9.,]*\s*(kg|kl)\b/i;

        idsSeleccionados.forEach((id) => {
            const p = productos.find((x) => x.id_producto.toString().trim() === id.toString().trim());
            if (!p) {
                advertencias.push(`Producto ID ${id} no encontrado en inventario.`);
                return;
            }
            const nombre = p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase();

            if (!p.proimagenurl) {
                errores.push(`"${nombre}" no tiene imagen — no se puede generar contenido.`);
            }
            if (p.en_promo == 1 && parseFloat(p.descuento_promo || 0) <= 0) {
                advertencias.push(`"${nombre}" está marcado en promo pero sin descuento.`);
            }
            if (regexKilos.test(p.nombre)) {
                advertencias.push(`"${nombre}" se mostrará por libra (precio del kilo ÷ 2).`);
            }
        });

        return { valido: errores.length === 0, errores, advertencias };
    }

    return {
        dataDir,
        campanasDir,
        historialPath,
        presetsPath,
        leerJson,
        guardarJson,
        agregarHistorial,
        construirCopyTexto,
        validarSeleccion,
        obtenerEventosCalendario,
    };
}

module.exports = { crearMarketingData };
