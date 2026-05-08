import React from 'react';
import { AbsoluteFill, Audio, staticFile, interpolate, useCurrentFrame, useVideoConfig, spring, Img, Sequence } from 'remotion';

// --- 1. CONFIGURACIÓN GENERAL ---

// Tiempos en segundos (Ajusta la duración de tu audio)
const INTRO_DURACION_SECS = 5; // Cuánto durará la animación de entrada
const OUTRO_DURACION_SECS = 6; // Cuánto durará la animación de despedida
const AUDIO_PODCAST_DURACION_SECS = 224; // <-- CAMBIA ESTO por los segundos exactos de tu grabación (Audio podcast.mp3)

// Configuración de Secciones DENTRO del audio (Igual que antes, pero relativas a tu grabación)
const SECCIONES = [
    { inicioSeg: 0, finSeg: 45, titulo: "INTRODUCCIÓN", subtitulo: "¿Todos somos ciudadanos?" },
    { inicioSeg: 45, finSeg: 100, titulo: "IGUALDAD FORMAL", subtitulo: "Lo que dice el código fuente (Art. 13)" },
    { inicioSeg: 100, finSeg: 150, titulo: "IGUALDAD MATERIAL", subtitulo: "Cerrando las brechas en la realidad" },
    { inicioSeg: 150, finSeg: 224, titulo: "CONCLUSIÓN", subtitulo: "Una ciudadanía en construcción" },
];

const COLORES = {
    fondo: '#0a0f1a', // Azul ultra oscuro (tecnológico)
    azulUni: '#003399', 
    amarilloUni: '#FFC300', 
    blanco: '#ffffff',
};

// --- COMPONENTE DE INTRO ANIMADA (5 seg) ---
const AnimacionEntrada = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Animaciones spring para el logo central
    const entranceSpring = spring({ frame, fps, config: { damping: 10, mass: 0.9 } });
    const scaleLogo = interpolate(entranceSpring, [0, 1], [0, 1]);
    const opacityTextoIntro = interpolate(frame, [50, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const translateYTextoIntro = interpolate(frame, [50, 80], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{ backgroundColor: COLORES.azulUni, fontFamily: 'system-ui, sans-serif', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Sonido de Intro */}
            <Audio src={staticFile('intro_sfx.mp3')} volume={0.6} startFrom={0} />

            {/* Logo Central (Disco) */}
            <div style={{
                width: '350px', height: '350px', borderRadius: '50%',
                background: 'white',
                border: `8px solid ${COLORES.amarilloUni}`,
                boxShadow: `0 20px 70px rgba(0,0,0,0.5)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: `scale(${scaleLogo})`
            }}>
                <Img src={staticFile('logo_uniminuto.png')} style={{ height: '140px' }} />
            </div>
            
            {/* Títulos de Introducción con fade in */}
            <div style={{ opacity: opacityTextoIntro, transform: `translateY(${translateYTextoIntro}px)`, textAlign: 'center', marginTop: '60px' }}>
                <h1 style={{ fontSize: '80px', fontWeight: '900', margin: 0, textShadow: '0 5px 20px rgba(0,0,0,0.4)' }}>TRABAJO SEMANA #2</h1>
                <p style={{ fontSize: '35px', color: COLORES.amarilloUni, fontWeight: 'bold', margin: '15px 0 0 0', textTransform: 'uppercase', letterSpacing: '4px' }}>
                    CONSTITUCIÓN POLÍTICA
                </p>
                <div style={{ marginTop: '50px', fontSize: '28px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px 40px', borderRadius: '15px' }}>
                    Producido por: <strong style={{color: COLORES.amarilloUni}}>Alejandro Marmolejo</strong>
                </div>
            </div>
        </AbsoluteFill>
    );
};

// --- COMPONENTE DE DESPEDIDA ANIMADA (6 seg) ---
const AnimacionDespedida = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Animaciones spring para el agradecimiento central
    const agradecimientoEntrance = spring({ frame, fps, config: { damping: 14 } });
    const scaleAgradecimiento = interpolate(agradecimientoEntrance, [0, 1], [0.8, 1]);
    
    // Animación de salida (fade out al final de todo)
    const opacityOutFinal = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{ backgroundColor: COLORES.fondo, fontFamily: 'system-ui, sans-serif', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: opacityOutFinal }}>
            
            {/* Sonido de Outro */}
            <Audio src={staticFile('outro_sfx.mp3')} volume={0.8} startFrom={0} />

            {/* Círculo de agradecimiento central */}
            <div style={{
                width: '300px', height: '300px', borderRadius: '50%',
                border: `8px solid ${COLORES.amarilloUni}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 60px ${COLORES.amarilloUni}`,
                transform: `scale(${scaleAgradecimiento})`
            }}>
                <h1 style={{ fontSize: '65px', fontWeight: '900', margin: 0 }}>¡GRACIAS!</h1>
            </div>

            {/* Texto final y créditos de música con fade in progresivo */}
            <div style={{ marginTop: '90px', textAlign: 'center', opacity: agradecimientoEntrance }}>
                <p style={{ fontSize: '32px', margin: 0, color: 'rgba(255,255,255,0.8)' }}>Espero que este análisis haya sido enriquecedor.</p>
                
                {/* Créditos de la música exigidos por la guía */}
                <div style={{ marginTop: '50px', fontSize: '20px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 30px', borderRadius: '10px', color: 'rgba(255,255,255,0.6)' }}>
                    Música de fondo y efectos de sonido obtenidos de: <strong style={{color: 'rgba(255,255,255,0.8)'}}>Biblioteca de audio de YouTube Studio</strong>
                </div>

                <div style={{ marginTop: '50px' }}>
                    <Img src={staticFile('logo_uniminuto.png')} style={{ height: '200px', background: 'white', padding: '10px', borderRadius: '10px' }} />
                </div>
            </div>
        </AbsoluteFill>
    );
};

// Componente para crear una onda de audio animada (Simulado)
const VisualizadorAudio: React.FC = () => {
    const frame = useCurrentFrame();
    const numBarras = 45; // Cantidad de barras en la onda

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '150px' }}>
            {[...Array(numBarras)].map((_, i) => {
                // Matemática para simular una onda de voz fluida
                const offset = i * 0.2;
                const alturaBase = 20;
                // Combinamos senos a diferentes velocidades para que parezca voz real
                const pulso = Math.sin((frame / 5) + offset) * Math.cos((frame / 12) - offset);
                const alturaVariada = interpolate(pulso, [-1, 1], [alturaBase, 120]);
                
                // Hacemos que las barras del centro sean más altas que las de los bordes
                const distanciaAlCentro = Math.abs((numBarras / 2) - i);
                const multiplicadorCentro = interpolate(distanciaAlCentro, [0, numBarras / 2], [1.2, 0.3]);
                
                const alturaFinal = alturaVariada * multiplicadorCentro;

                return (
                    <div key={i} style={{
                        width: '8px',
                        height: `${alturaFinal}px`,
                        backgroundColor: COLORES.amarilloUni,
                        borderRadius: '10px',
                        boxShadow: `0 0 15px ${COLORES.amarilloUni}`,
                        opacity: interpolate(alturaFinal, [alturaBase, 100], [0.4, 1])
                    }} />
                );
            })}
        </div>
    );
};


// --- COMPONENTE DE ENSAMBLAJE MAESTRO ---
export const PodcastUniversidadCompleto: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Calculamos frames exactos para transiciones
    const introFrames = INTRO_DURACION_SECS * fps;
    const audioPodcastFrames = AUDIO_PODCAST_DURACION_SECS * fps;
    const outroFrames = OUTRO_DURACION_SECS * fps;

    // --- LÓGICA DE VOLUMEN AUTOMÁTICO DE FONDO (El truco pro) ---
    // La música de fondo sonará alta en Intro y Outro (0.8), y bajará mucho cuando tú hables (0.05)
    const volumenMusicaFondo = interpolate(
        frame,
        [introFrames - 15, introFrames, introFrames + 30, (durationInFrames - outroFrames) - 30, (durationInFrames - outroFrames), (durationInFrames - outroFrames) + 15],
        [0.8, 0.8, 0.05, 0.05, 0.8, 0.8], // Control de volumen dinámico
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // --- LÓGICA PARA DETECTAR EL TEMA ACTUAL DENTRO DEL VIDEO BASE ---
    // Ajustamos el frame relativo para que coincida con el inicio del video base
    const frameRelativoPodcast = frame - introFrames;
    const seccionActual = SECCIONES.find(sec => 
        frameRelativoPodcast >= sec.inicioSeg * fps && frameRelativoPodcast < sec.finSeg * fps
    ) || SECCIONES[SECCIONES.length - 1]; // Fallback a la última si se pasa

    // Animación de texto dinámica al cambiar de sección
    const frameInicioSeccion = seccionActual.inicioSeg * fps;
    const framesDesdeCambio = frameRelativoPodcast - frameInicioSeccion;
    const animTextoSpring = spring({ frame: framesDesdeCambio, fps, config: { damping: 12 } });
    const translateYTexto = interpolate(animTextoSpring, [0, 1], [20, 0]);
    const opacityTexto = interpolate(animTextoSpring, [0, 1], [0, 1]);

    // Línea de progreso global de todo el proyecto (Intro + Podcast + Outro)
    const progresoTotalWidth = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' });

    // Efecto de rotación lenta para el disco/logo central
    const rotacionLogo = frameRelativoPodcast * 0.1;

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            
            {/* 1. MÚSICA DE FONDO (Suena durante TODO el video) */}
            <Audio src={staticFile('fondo.mp3')} volume={volumenMusicaFondo} loop startFrom={0} />

            {/* A) SECUENCIA DE INTRODUCCIÓN (0 - 5 seg) */}
            <Sequence from={0} durationInFrames={introFrames}>
                <AnimacionEntrada />
            </Sequence>

            {/* B) SECUENCIA DEL AUDIO DEL PODCAST (5 seg - Fin del Audio) */}
            <Sequence from={introFrames} durationInFrames={audioPodcastFrames}>
                <AbsoluteFill style={{ backgroundColor: COLORES.fondo, fontFamily: 'system-ui, sans-serif', color: 'white' }}>
                    
                    {/* El audio de tu voz */}
                    <Audio src={staticFile('Audio podcast.mp3')} volume={1} startFrom={0} />

                    {/* FONDO DE REJILLA TECNOLÓGICA (El Código Ciudadano) */}
                    <AbsoluteFill style={{
                        backgroundImage: `linear-gradient(rgba(0, 51, 153, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 51, 153, 0.1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                        opacity: 0.5,
                        zIndex: 0
                    }} />

                    {/* LOGO UNIMINUTO FIJO (Esquina) */}
                    <div style={{ position: 'absolute', top: '40px', right: '40px', zIndex: 10 }}>
                        <Img src={staticFile('logo_uniminuto.png')} style={{ height: '70px', background: 'white', padding: '10px', borderRadius: '15px' }} />
                    </div>

                    {/* CONTENIDO CENTRAL */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', zIndex: 5 }}>
                        
                        {/* Título del Programa */}
                        <div style={{ backgroundColor: 'rgba(255,195,0,0.1)', padding: '10px 30px', borderRadius: '50px', border: `1px solid ${COLORES.amarilloUni}`, marginBottom: '50px' }}>
                            <h2 style={{ margin: 0, color: COLORES.amarilloUni, letterSpacing: '3px', fontWeight: 'bold' }}>
                                🎙️ EL CÓDIGO CIUDADANO
                            </h2>
                        </div>

                        {/* Disco Central (Arte del Podcast) */}
                        <div style={{
                            width: '350px', height: '350px', borderRadius: '50%',
                            background: `linear-gradient(135deg, ${COLORES.azulUni}, #001133)`,
                            border: `4px solid rgba(255,255,255,0.1)`,
                            boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(0,51,153,0.4)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '60px', overflow: 'hidden', position: 'relative'
                        }}>
                            {/* Anillos giratorios */}
                            <div style={{
                                position: 'absolute', width: '100%', height: '100%',
                                border: `2px dashed rgba(255,195,0,0.3)`, borderRadius: '50%',
                                transform: `rotate(${rotacionLogo}deg)`
                            }} />
                            
                            <h1 style={{ fontSize: '80px', margin: 0, transform: `scale(${interpolate(Math.sin(frameRelativoPodcast/10), [-1,1], [0.95, 1.05])})` }}>
                                ⚖️
                            </h1>
                        </div>

                        {/* Títulos Dinámicos de la Sección (Con animación de entrada en cada cambio) */}
                        <div style={{ textAlign: 'center', height: '120px', transform: `translateY(${translateYTexto}px)`, opacity: opacityTexto }}>
                            <h1 style={{ fontSize: '55px', margin: '0 0 10px 0', fontWeight: '900', textShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
                                {seccionActual.titulo}
                            </h1>
                            <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.7)', margin: 0, letterSpacing: '1px' }}>
                                {seccionActual.subtitulo}
                            </p>
                        </div>

                        {/* Visualizador de Audio Simulado */}
                        <div style={{ marginTop: '30px' }}>
                            <VisualizadorAudio />
                        </div>
                    </div>
                </AbsoluteFill>
            </Sequence>

            {/* C) SECUENCIA DE DESPEDIDA (Al terminar el podcast crudo) */}
            <Sequence from={introFrames + audioPodcastFrames} durationInFrames={outroFrames}>
                <AnimacionDespedida />
            </Sequence>

            {/* D) BARRA DE PROGRESO GLOBAL INFERIOR (Suena durante TODO el video) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 30 }}>
                <div style={{ width: `${progresoTotalWidth}%`, height: '100%', backgroundColor: COLORES.amarilloUni, boxShadow: `0 0 15px ${COLORES.amarilloUni}` }} />
            </div>

        </AbsoluteFill>
    );
};