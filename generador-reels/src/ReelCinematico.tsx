import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  Easing,
} from 'remotion';
import React from 'react';

export type CinematicProps = {
  marca: string;
  nombreProducto: string;
  precio: string;
  imagenProducto: string;
};

export const ReelCinematico: React.FC<CinematicProps> = ({
  marca,
  nombreProducto,
  precio,
  imagenProducto,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- CURVAS DE ACELERACIÓN PROFESIONALES (BEZIER) ---
  const smoothOut = Easing.bezier(0.16, 1, 0.3, 1);

  // --- ANIMACIONES DEL PRODUCTO (Falso 3D + Zoom Continuo) ---
  // El producto entra suavemente desde abajo
  const productoY = interpolate(frame, [10, 45], [800, 0], {
    easing: smoothOut,
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  
  // Parallax continuo a lo largo de todo el video (5 segundos = 150 frames)
  const productScale = interpolate(frame, [0, 150], [1, 1.15]);
  const rotateX = interpolate(frame, [0, 150], [10, -5]); // Rota en perspectiva
  const rotateY = interpolate(frame, [0, 150], [-15, 10]);

  // --- ANIMACIONES DE TEXTO CON MÁSCARAS (REVEAL) ---
  // La marca aparece primero desde una línea invisible
  const marcaY = interpolate(frame, [5, 25], [100, 0], { easing: smoothOut, extrapolateRight: 'clamp' });
  
  // El nombre del producto aparece justo después
  const nombreY = interpolate(frame, [15, 40], [150, 0], { easing: smoothOut, extrapolateRight: 'clamp' });

  // --- EFECTO SHIMMER (DESTELLO) PARA EL PRECIO ---
  const shimmerPosition = interpolate(frame, [70, 110], [-100, 200], { extrapolateRight: 'clamp' });
  const precioOpacity = interpolate(frame, [65, 80], [0, 1], { easing: smoothOut, extrapolateRight: 'clamp' });
  const precioY = interpolate(frame, [65, 85], [50, 0], { easing: smoothOut, extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* FONDO: Viñeta cinemática para dar profundidad */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at center, #27272a 0%, #000000 100%)',
          opacity: 0.8,
        }}
      />

      <Audio src={staticFile("audio/beat.mp3")} volume={0.3} />
      <Audio src={staticFile("smooth-whoosh.mp3")} volume={0.6} />

      {/* TITULARES (Kinetic Typography con Reveal) */}
      <AbsoluteFill style={{ top: '150px', alignItems: 'center' }}>
        
        {/* Contenedor con overflow hidden para enmascarar el texto */}
        <div style={{ overflow: 'hidden', paddingBottom: '10px' }}>
          <p style={{
            fontSize: '40px',
            color: '#a1a1aa', // Gris sutil
            letterSpacing: '8px',
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: 0,
            transform: `translateY(${marcaY}px)`,
          }}>
            {marca}
          </p>
        </div>

        <div style={{ overflow: 'hidden', marginTop: '-10px', paddingBottom: '20px' }}>
          <h1 style={{
            fontSize: '100px',
            color: '#ffffff',
            fontWeight: 900,
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1.1,
            textShadow: '0px 10px 30px rgba(0,0,0,0.8)',
            transform: `translateY(${nombreY}px)`,
          }}>
            {nombreProducto}
          </h1>
        </div>
      </AbsoluteFill>

      {/* PRODUCTO (Perspectiva 3D) */}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', top: '50px' }}>
        <Img
          src={imagenProducto}
          style={{
            width: '850px',
            height: '850px',
            objectFit: 'contain',
            transform: `translateY(${productoY}px) scale(${productScale}) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            filter: 'drop-shadow(0px 50px 40px rgba(0,0,0,0.7))',
          }}
        />
      </AbsoluteFill>

      {/* PRECIO Y LLAMADO A LA ACCIÓN (Con efecto Shimmer) */}
      <Sequence from={65}>
        <Audio src={staticFile("glimmer.mp3")} volume={0.8} /> {/* Sonido de destello o brillo */}
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '150px' }}>
          
          <div style={{
            position: 'relative',
            overflow: 'hidden', // Importante para el destello
            backgroundColor: '#ffffff',
            padding: '20px 70px',
            borderRadius: '15px',
            opacity: precioOpacity,
            transform: `translateY(${precioY}px)`,
            boxShadow: '0px 20px 40px rgba(255,255,255,0.1)',
          }}>
            
            {/* Texto del precio */}
            <span style={{ fontSize: '90px', fontWeight: 900, color: '#000' }}>
              {precio}
            </span>

            {/* Efecto de destello de luz cruzando el precio */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
              transform: `skewX(-20deg) translateX(${shimmerPosition}%)`,
              pointerEvents: 'none', // Para que no interfiera
            }} />
            
          </div>
        </AbsoluteFill>
      </Sequence>

    </AbsoluteFill>
  );
};