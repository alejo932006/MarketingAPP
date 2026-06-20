import React from 'react';
import { 
    AbsoluteFill, 
    interpolate, 
    spring, 
    useCurrentFrame, 
    useVideoConfig, 
    Img, 
    Sequence, 
    Audio, 
    staticFile 
} from 'remotion';
import { z } from 'zod';
import { promoSchema } from './Composition';

export const ReelCarnaval: React.FC<z.infer<typeof promoSchema>> = ({ companyUrl, productos }) => {
    const introDuration = 120;
    const duracionPorProducto = 150;
    const outroDuration = 180; 

    const productosAMostrar = productos.slice(0, 4);

    return (
        <AbsoluteFill style={{ backgroundColor: '#FFF9E6', overflow: 'hidden', fontFamily: 'sans-serif' }}>
            <Audio src={staticFile('carnaval-audio.mp3')} volume={0.6} />

            <FondoTropicalPro />

            {/* 🕒 CORRECCIÓN: La intro dura exactamente 120 frames */}
            <Sequence from={0} durationInFrames={introDuration}>
                <IntroCarnavalPro />
            </Sequence>

            {/* 🕒 CORRECCIÓN: Cada producto dura exactamente 150 frames, sin encimarse */}
            {productosAMostrar.map((producto, index) => {
                const startFrame = introDuration + (index * duracionPorProducto);
                return (
                    <Sequence key={index} from={startFrame} durationInFrames={duracionPorProducto}>
                        <EscenaProductoPro producto={producto} />
                    </Sequence>
                );
            })}

            <Sequence from={introDuration + (productosAMostrar.length * duracionPorProducto)} durationInFrames={outroDuration}>
                <OutroCarnavalPro companyUrl={companyUrl} />
            </Sequence>
        </AbsoluteFill>
    );
};

// --- 1. FONDO TROPICAL CON EFECTO PARALLAX ---
const FondoTropicalPro: React.FC = () => {
    const frame = useCurrentFrame();
    const rotacion = frame * 0.15;

    return (
        <AbsoluteFill>
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, #FFEB3B 0%, #FF9800 100%)' }} />
            <div style={{
                position: 'absolute', width: '250%', height: '250%', top: '-75%', left: '-75%',
                background: `repeating-conic-gradient(from 0deg, transparent 0deg 15deg, rgba(255,255,255,0.1) 15deg 30deg)`,
                transform: `rotate(${rotacion}deg)`,
                filter: 'blur(2px)'
            }} />
            
            {[...Array(12)].map((_, i) => {
                const yPos = (frame * (i % 3 + 1)) % 2200 - 200;
                return (
                    <div key={i} style={{
                        position: 'absolute', left: `${10 + i * 8}%`, top: `${yPos}px`,
                        width: `${20 + (i % 4) * 15}px`, height: `${20 + (i % 4) * 15}px`,
                        borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)',
                        filter: 'blur(8px)', zIndex: 0
                    }} />
                );
            })}
        </AbsoluteFill>
    );
};

// --- 2. INTRODUCCIÓN ---
const IntroCarnavalPro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    const logoSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
    const titleSpring = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 12, stiffness: 100 } });
    const subSpring = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 12, stiffness: 100 } });
    
    // El fade out se completa exactamente en el frame 120
    const opacityOut = interpolate(frame, [100, 120], [1, 0]);

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: opacityOut, padding: '40px' }}>
            <div style={{ transform: `scale(${logoSpring}) translateY(${interpolate(logoSpring, [0, 1], [50, 0])}px)`, marginBottom: '40px' }}>
                <Img src={staticFile('logo2.png')} style={{ height: '250px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }} />
            </div>

            <div style={{ textAlign: 'center' }}>
                <h1 style={{ 
                    fontSize: '150px', color: '#4CAF50', fontWeight: '900', textTransform: 'uppercase', 
                    textShadow: '0 20px 40px rgba(0,0,0,0.3), 6px 6px 0px #FFF, 12px 12px 0px #1B5E20', lineHeight: '1',
                    transform: `scale(${titleSpring})`, opacity: titleSpring
                }}>
                    Carnaval
                </h1>
                
                <div style={{
                    transform: `translateY(${interpolate(subSpring, [0, 1], [50, 0])}px)`, opacity: subSpring,
                    background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    padding: '15px 50px', borderRadius: '50px', border: '2px solid rgba(255,255,255,0.5)',
                    marginTop: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ fontSize: '45px', color: 'white', fontWeight: '900', margin: 0, letterSpacing: '4px' }}>
                        FRUTAS Y VERDURAS
                    </h2>
                </div>
            </div>
        </AbsoluteFill>
    );
};

// --- 3. ESCENA DE PRODUCTO ---
const EscenaProductoPro: React.FC<{ producto: any }> = ({ producto }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const cardAnim = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
    const imgAnim = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 12, stiffness: 150 } });
    const textAnim = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 14, stiffness: 110 } });
    const priceAnim = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 10, stiffness: 160 } }); 
    
    // 🕒 CORRECCIÓN 1: Arrancamos la salida en el frame 115 (le damos 35 frames de tiempo para volar)
    const animOut = spring({ frame: Math.max(0, frame - 115), fps, config: { damping: 12, stiffness: 120 } });

    const floatY = Math.sin(frame / 15) * 15;
    const rotateX = Math.cos(frame / 20) * 4;
    const rotateY = Math.sin(frame / 20) * 4;

    const scale = interpolate(cardAnim, [0, 1], [0.8, 1]) - interpolate(animOut, [0, 1], [0, 0.2]);
    
    // 🚀 CORRECCIÓN 2: Cambiamos el -800 a -1800. ¡Ahora sí saldrá completamente de la pantalla!
    const yOffset = interpolate(cardAnim, [0, 1], [300, 0]) + interpolate(animOut, [0, 1], [0, -1800]); 

    const glintPos = interpolate(frame, [20, 50], [-1000, 1000]);

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: '1500px' }}>
            <div style={{
                width: '850px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '60px', padding: '50px',
                border: '4px solid #fff', boxShadow: '0 40px 80px rgba(0,0,0,0.25), inset 0 0 0 10px #4CAF50',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                transform: `translateY(${yOffset + floatY}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`, 
                position: 'relative', overflow: 'hidden'
            }}>
                
                <div style={{
                    position: 'absolute', top: 0, left: `${glintPos}px`, width: '300px', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                    transform: 'skewX(-45deg)', zIndex: 20, pointerEvents: 'none'
                }} />

                {producto.porcentaje > 0 && (
                    <div style={{
                        position: 'absolute', top: '-20px', left: '-20px', zIndex: 30,
                        background: 'linear-gradient(135deg, #FF3366 0%, #E60000 100%)', color: 'white',
                        width: '180px', height: '180px', borderRadius: '50%', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900',
                        border: '8px solid white', boxShadow: '0 20px 40px rgba(230,0,0,0.5)',
                        transform: `scale(${spring({ frame: Math.max(0, frame - 15), fps })}) rotate(-15deg)`
                    }}>
                        <span style={{ fontSize: '55px', lineHeight: '1' }}>-{producto.porcentaje}%</span>
                    </div>
                )}

                <div style={{ 
                    height: '420px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
                    marginBottom: '30px', transform: `scale(${imgAnim})`
                }}>
                    <Img src={producto.imageUrl} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.3))' }} />
                </div>

                <h2 style={{
                    fontSize: '60px', color: '#111', fontWeight: '900', textTransform: 'uppercase', 
                    textAlign: 'center', transform: `translateY(${interpolate(textAnim, [0, 1], [30, 0])}px)`, opacity: textAnim,
                    margin: '0 0 20px 0'
                }}>
                    {producto.productName}
                </h2>

                <div style={{ 
                    background: 'linear-gradient(to bottom, #ffffff, #f0fdf4)', width: '100%', padding: '25px', 
                    borderRadius: '40px', textAlign: 'center', border: '3px solid #bbf7d0',
                    transform: `scale(${priceAnim})`, opacity: priceAnim,
                    boxShadow: '0 15px 30px rgba(76, 175, 80, 0.15)'
                }}>
                    {producto.porcentaje > 0 && (
                        <div style={{ color: '#94a3b8', fontSize: '35px', textDecoration: 'line-through', fontWeight: '700', marginBottom: '-10px' }}>
                            Antes: $ {producto.precioAntes}
                        </div>
                    )}
                    <div style={{ color: '#16a34a', fontSize: '120px', fontWeight: '900', lineHeight: '1', letterSpacing: '-3px', textShadow: '0 10px 20px rgba(22, 163, 74, 0.2)' }}>
                        <span style={{ fontSize: '60px', verticalAlign: 'top', color: '#4ade80' }}>$</span>{producto.precio}
                    </div>
                </div>

            </div>
        </AbsoluteFill>
    );
};

// --- 4. CIERRE ELEGANTE ---
const OutroCarnavalPro: React.FC<{ companyUrl: string }> = ({ companyUrl }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    const bgScale = spring({ frame, fps, config: { damping: 14 } });
    const contentSpring = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 12 } });
    const pulse = Math.sin(frame / 8) * 0.05;

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)',
                padding: '80px 100px', borderRadius: '60px',
                boxShadow: '0 40px 100px rgba(0,0,0,0.2)', border: '6px solid #FF9800',
                transform: `scale(${bgScale})`, textAlign: 'center'
            }}>
                <Img src={staticFile('logo2.png')} style={{ 
                    height: '220px', marginBottom: '50px', transform: `translateY(${interpolate(contentSpring, [0, 1], [30, 0])}px)`, opacity: contentSpring
                }} />
                
                <h2 style={{ 
                    fontSize: '65px', color: '#1B5E20', fontWeight: '900', margin: '0 0 40px 0',
                    transform: `translateY(${interpolate(contentSpring, [0, 1], [20, 0])}px)`, opacity: contentSpring
                }}>
                    ¡LLEVA LA FRESCURA A CASA!
                </h2>
                
                <div style={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', 
                    padding: '30px 70px', borderRadius: '100px',
                    color: 'white', fontSize: '55px', fontWeight: '900',
                    boxShadow: '0 20px 40px rgba(76, 175, 80, 0.4)',
                    transform: `scale(${contentSpring + pulse})`,
                    border: '4px solid #81C784'
                }}>
                    {companyUrl}
                </div>
            </div>
        </AbsoluteFill>
    );
};