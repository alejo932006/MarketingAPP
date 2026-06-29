const fs = require('fs');
const path = require('path');

const PLANTILLAS_REEL_LOTE = ['PromoReel', 'ReelElegante', 'ReelBrutalismo', 'ReelLanzamiento'];

function calcularPorcentajeDescuento(p) {
    const desc = parseFloat(p.descuento_promo || 0);
    if (desc <= 0) return 0;
    return desc <= 100 ? desc : Math.round((desc / p.precio_venta_final) * 100);
}

function crearColaLote(deps) {
    const {
        marketing,
        publicDir,
        obtenerProductosApi,
        capturarVolanteConBrowser,
        generarVideoInterno,
        validarSeleccion,
    } = deps;

    let progreso = {
        activo: false,
        loteId: null,
        tipo: null,
        tareaActual: 0,
        totalTareas: 0,
        porcentaje: 0,
        mensaje: 'Listo',
        resultados: [],
        error: null,
    };

    function obtenerProgreso() {
        return { ...progreso, resultados: [...progreso.resultados] };
    }

    function resetProgreso() {
        progreso = {
            activo: false,
            loteId: null,
            tipo: null,
            tareaActual: 0,
            totalTareas: 0,
            porcentaje: 0,
            mensaje: 'Listo',
            resultados: [],
            error: null,
        };
    }

    function topOfertasPorLinea(productos, linea, limite = 4) {
        return productos
            .filter(
                (p) =>
                    p.linea_nombre === linea &&
                    p.proimagenurl &&
                    p.precio_venta_final > 0 &&
                    !p.oculto &&
                    p.en_promo == 1 &&
                    parseFloat(p.descuento_promo || 0) > 0
            )
            .sort((a, b) => calcularPorcentajeDescuento(b) - calcularPorcentajeDescuento(a))
            .slice(0, limite);
    }

    async function construirTareas(tipo, body) {
        const productos = await obtenerProductosApi();
        const config = {
            plantilla: body.plantilla || '4',
            tema: body.tema || 'clasico',
            tituloPrincipal: body.tituloPrincipal || 'Dias De Ahorro',
            textoTagline: body.textoTagline || 'Solo por tiempo limitado',
            orientacion: body.orientacion || 'feed',
        };
        const tareas = [];

        if (tipo === 'volantes_por_linea') {
            const lineas = [...new Set(productos.map((p) => p.linea_nombre).filter(Boolean))].sort();
            for (const linea of lineas) {
                const seleccionados = topOfertasPorLinea(productos, linea, parseInt(config.plantilla, 10) || 4);
                if (seleccionados.length === 0) continue;
                const ids = seleccionados.map((p) => p.id_producto.toString().trim());
                const titulo = `${config.tituloPrincipal} — ${linea.charAt(0).toUpperCase() + linea.slice(1)}`;
                tareas.push({
                    tipo: 'volante',
                    etiqueta: `Volante: ${linea}`,
                    params: { ...config, idsSeleccionados: ids, tituloPrincipal: titulo, orientacion: 'feed' },
                });
            }
        } else if (tipo === 'remate_por_linea') {
            const res = await fetch('https://api.surtitodoideal.com/api/compras/estancados');
            const estancados = await res.json();
            const lista = Array.isArray(estancados) ? estancados : [];
            const lineas = [...new Set(lista.map((p) => p.linea_nombre).filter(Boolean))].sort();

            for (const linea of lineas) {
                const deLinea = lista
                    .filter((p) => p.linea_nombre === linea && p.proimagenurl)
                    .slice(0, parseInt(config.plantilla, 10) || 4);
                if (deLinea.length === 0) continue;
                const ids = deLinea.map((p) => p.id_producto.toString().trim());
                tareas.push({
                    tipo: 'volante',
                    etiqueta: `Remate: ${linea}`,
                    params: {
                        plantilla: config.plantilla,
                        tema: 'sorpresa',
                        tituloPrincipal: `Liquidación ${linea}`,
                        textoTagline: '¡Últimas unidades!',
                        orientacion: 'feed',
                        idsSeleccionados: ids,
                    },
                });
            }
        } else if (tipo === 'formatos_volante') {
            const { idsSeleccionados } = body;
            if (!idsSeleccionados?.length) throw new Error('Selecciona productos para el lote.');
            tareas.push(
                {
                    tipo: 'volante',
                    etiqueta: 'Volante Feed',
                    params: { ...config, idsSeleccionados, orientacion: 'feed' },
                },
                {
                    tipo: 'volante',
                    etiqueta: 'Volante Historia',
                    params: { ...config, idsSeleccionados, orientacion: 'historia' },
                }
            );
        } else if (tipo === 'reels_multi') {
            const { idsSeleccionados } = body;
            if (!idsSeleccionados?.length) throw new Error('Selecciona productos para el lote de reels.');

            for (const plantillaVideo of PLANTILLAS_REEL_LOTE) {
                const validacion = validarSeleccion({
                    idsSeleccionados,
                    productos,
                    plantillaVideo,
                    modo: 'video',
                });
                if (!validacion.valido) continue;
                tareas.push({
                    tipo: 'reel',
                    etiqueta: `Reel: ${plantillaVideo}`,
                    params: { idsSeleccionados, plantillaVideo },
                });
            }
        } else {
            throw new Error('Tipo de lote no reconocido');
        }

        if (tareas.length === 0) {
            throw new Error('No se encontraron tareas para generar. Revisa ofertas o líneas disponibles.');
        }

        return tareas;
    }

    async function ejecutarTarea(tarea, loteDir, indice) {
        if (tarea.tipo === 'volante') {
            const nombreArchivo = `volante_${indice}_${tarea.etiqueta.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            const ruta = path.join(loteDir, nombreArchivo);
            const buffer = await capturarVolanteConBrowser(tarea.params);
            fs.writeFileSync(ruta, buffer);
            const url = `/campanas/${path.basename(loteDir)}/${nombreArchivo}`;
            return {
                tipo: 'volante',
                etiqueta: tarea.etiqueta,
                url,
                nombreArchivo,
            };
        }

        if (tarea.tipo === 'reel') {
            const resultado = await generarVideoInterno(tarea.params);
            const nombreArchivo = `reel_${indice}_${tarea.params.plantillaVideo}.mp4`;
            const ruta = path.join(loteDir, nombreArchivo);
            fs.copyFileSync(path.join(publicDir, resultado.nombreArchivo), ruta);
            return {
                tipo: 'reel',
                etiqueta: tarea.etiqueta,
                url: `/campanas/${path.basename(loteDir)}/${nombreArchivo}`,
                nombreArchivo,
                plantillaVideo: tarea.params.plantillaVideo,
            };
        }

        throw new Error(`Tarea desconocida: ${tarea.tipo}`);
    }

    async function iniciar(tipo, body) {
        if (progreso.activo) {
            throw new Error('Ya hay un lote en proceso. Espera a que termine.');
        }

        const tareas = await construirTareas(tipo, body);
        const loteId = `lote_${Date.now()}`;
        const loteDir = path.join(marketing.campanasDir, loteId);
        fs.mkdirSync(loteDir, { recursive: true });

        progreso = {
            activo: true,
            loteId,
            tipo,
            tareaActual: 0,
            totalTareas: tareas.length,
            porcentaje: 0,
            mensaje: `Preparando ${tareas.length} tareas...`,
            resultados: [],
            error: null,
        };

        (async () => {
            try {
                for (let i = 0; i < tareas.length; i++) {
                    const tarea = tareas[i];
                    progreso.tareaActual = i + 1;
                    progreso.mensaje = `[${i + 1}/${tareas.length}] ${tarea.etiqueta}`;
                    progreso.porcentaje = Math.round((i / tareas.length) * 100);

                    const resultado = await ejecutarTarea(tarea, loteDir, i + 1);
                    progreso.resultados.push(resultado);
                }

                progreso.porcentaje = 100;
                progreso.mensaje = '¡Lote completado!';

                marketing.agregarHistorial({
                    tipo: 'lote',
                    subtipo: tipo,
                    loteId,
                    carpeta: `/campanas/${loteId}`,
                    cantidad: progreso.resultados.length,
                    resultados: progreso.resultados,
                    titulo: body.tituloPrincipal || tipo,
                });
            } catch (err) {
                progreso.error = err.message;
                progreso.mensaje = `Error: ${err.message}`;
            } finally {
                progreso.activo = false;
            }
        })();

        return { loteId, totalTareas: tareas.length };
    }

    return { iniciar, obtenerProgreso, resetProgreso, construirTareas };
}

module.exports = { crearColaLote };
