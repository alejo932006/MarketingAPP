const fs = require('fs');
const path = require('path');

const ARCHIVOS_FIJOS_REMOTION = new Set([
    'background-music.mp3',
    'background-music2.mp3',
    'impacto-bg.mp3',
    'tutorial.mp4',
    'video_final.mp4',
    'Audio podcast.mp3',
    'Voz_Video_Final.wav',
    'Voz_Video_Final2.wav',
    'icon.png',
]);

function formatearBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function listarArchivosEnDir(directorio, filtroNombre) {
    if (!fs.existsSync(directorio)) return [];

    return fs.readdirSync(directorio)
        .filter((nombre) => {
            const ruta = path.join(directorio, nombre);
            try {
                return fs.statSync(ruta).isFile() && filtroNombre(nombre);
            } catch {
                return false;
            }
        })
        .map((nombre) => {
            const ruta = path.join(directorio, nombre);
            const { size } = fs.statSync(ruta);
            return { nombre, ruta, bytes: size };
        });
}

function esReelGenerado(nombre) {
    return (
        /^reel_[A-Za-z0-9_]+\.mp4$/.test(nombre) ||
        /^tutorial_\d+\.mp4$/.test(nombre) ||
        /^reel_cliente_\d+\.mp4$/.test(nombre) ||
        nombre === 'oferta.mp4'
    );
}

function esVozGenerada(nombre) {
    return /^voz_\d+\.mp3$/.test(nombre);
}

function esUploadTemporal(nombre) {
    return /\.(png|jpe?g|webp|gif)$/i.test(nombre);
}

function crearResumenCategoria(id, nombre, descripcion, archivos) {
    const bytes = archivos.reduce((sum, a) => sum + a.bytes, 0);
    return {
        id,
        nombre,
        descripcion,
        cantidad: archivos.length,
        bytes,
        tamano: formatearBytes(bytes),
        archivos: archivos.map((a) => ({ nombre: a.nombre, tamano: formatearBytes(a.bytes) })),
    };
}

function escanearArchivosGenerados(raizProyecto) {
    const publicDir = path.join(raizProyecto, 'public');
    const remotionPublic = path.join(raizProyecto, 'generador-reels', 'public');
    const voiceoversDir = path.join(remotionPublic, 'voiceovers');
    const uploadsDir = path.join(remotionPublic, 'uploads');
    const outDir = path.join(raizProyecto, 'generador-reels', 'out');

    const reels = listarArchivosEnDir(publicDir, esReelGenerado);
    const voces = listarArchivosEnDir(voiceoversDir, esVozGenerada);
    const uploads = listarArchivosEnDir(uploadsDir, esUploadTemporal);
    const rendersOut = listarArchivosEnDir(outDir, (nombre) => /\.(mp4|mov|webm)$/i.test(nombre));

    const categorias = [
        crearResumenCategoria(
            'reels',
            'Reels renderizados',
            'Videos MP4 creados desde el panel',
            reels
        ),
        crearResumenCategoria(
            'voces',
            'Voces en off',
            'Audios TTS generados para narración',
            voces
        ),
        crearResumenCategoria(
            'uploads',
            'Fotos de clientes (temporal)',
            'Imágenes subidas para reels de cliente',
            uploads
        ),
        crearResumenCategoria(
            'out',
            'Exports temporales Remotion',
            'Archivos en carpeta out/ si existen',
            rendersOut
        ),
    ];

    const totalBytes = categorias.reduce((sum, c) => sum + c.bytes, 0);
    const totalArchivos = categorias.reduce((sum, c) => sum + c.cantidad, 0);

    return {
        categorias,
        totalArchivos,
        totalBytes,
        totalTamano: formatearBytes(totalBytes),
        archivosProtegidos: [...ARCHIVOS_FIJOS_REMOTION],
    };
}

function eliminarLista(archivos) {
    let eliminados = 0;
    let bytesLiberados = 0;
    const errores = [];

    archivos.forEach(({ ruta, bytes, nombre }) => {
        try {
            if (!fs.existsSync(ruta)) return;
            fs.unlinkSync(ruta);
            eliminados += 1;
            bytesLiberados += bytes;
        } catch (err) {
            errores.push({ nombre, error: err.message });
        }
    });

    return { eliminados, bytesLiberados, errores };
}

function eliminarArchivosGenerados(raizProyecto) {
    const resumen = escanearArchivosGenerados(raizProyecto);
    const mapaDirs = {
        reels: path.join(raizProyecto, 'public'),
        voces: path.join(raizProyecto, 'generador-reels', 'public', 'voiceovers'),
        uploads: path.join(raizProyecto, 'generador-reels', 'public', 'uploads'),
        out: path.join(raizProyecto, 'generador-reels', 'out'),
    };
    const filtros = {
        reels: esReelGenerado,
        voces: esVozGenerada,
        uploads: esUploadTemporal,
        out: (nombre) => /\.(mp4|mov|webm)$/i.test(nombre),
    };

    const archivosReales = [];
    resumen.categorias.forEach((cat) => {
        if (cat.cantidad === 0) return;
        archivosReales.push(...listarArchivosEnDir(mapaDirs[cat.id], filtros[cat.id]));
    });

    const resultado = eliminarLista(archivosReales);

    return {
        ...resultado,
        bytesLiberadosFmt: formatearBytes(resultado.bytesLiberados),
        resumenAntes: resumen,
    };
}

module.exports = {
    escanearArchivosGenerados,
    eliminarArchivosGenerados,
    formatearBytes,
    ARCHIVOS_FIJOS_REMOTION,
};
