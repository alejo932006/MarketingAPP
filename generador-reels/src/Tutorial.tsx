import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Video, Audio, staticFile, Sequence } from 'remotion';
import { z } from 'zod';
import { EscenaFinalVIP } from './Composition2';

export const tutorialSchema = z.object({
	companyUrl: z.string(),
	videoFileName: z.string(),
});

// -----------------------------------------------------------------
// 🪄 NUEVO: FONDO MULTICOLOR BRILLANTE PREMIUM (Reemplaza los anillos)
// -----------------------------------------------------------------
const BackgroundDecorations: React.FC = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();


	// Paleta Premium Surtitodo: Oro, Rubí, Zafiro
	const colores = ['#FFC300', '#FFD700', '#E60000', '#B22222', '#00C4CC', '#FFFFFF'];

	return (
		<AbsoluteFill style={{ zIndex: 0, overflow: 'hidden' }}>
			
			{/* Generamos 60 partículas multicolores flotantes */}
			{[...Array(60)].map((_, i) => {
				
				// Variables únicas para cada partícula basadas en su índice
				const color = colores[i % colores.length];
				const delay = (i * 1.5) % 150; // Retraso de aparición
				const durationParticle = 150 + (i % 5) * 20; // Cuánto tarda en subir
				const size = 10 + (i % 15) + Math.sin(frame / (20 + (i % 10))) * 5; // Tamaño dinámico que "pulsa"
				
				// Matemáticas para que floten hacia arriba y se dispersen
				const frameCiclo = (frame + delay) % durationParticle;
				const xBase = (i * 17) % width; // Dispersión horizontal
				const driftX = Math.sin(frame / (40 + (i % 20))) * 30; // Movimiento lateral suave
				const x = xBase + driftX;
				
				const y = interpolate(frameCiclo, [0, durationParticle], [height + 50, -100]);
				
				// Animación de parpadeo (brillo)
				const brightness = interpolate(Math.sin(frame / (10 + (i % 10))), [-1, 1], [0.3, 1]);
				// Opacidad sutil para que no sature
				const opacidad = interpolate(frameCiclo, [0, 20, durationParticle - 20, durationParticle], [0, 0.4, 0.4, 0], { extrapolateRight: 'clamp' }) * brightness;

				return (
					<div key={i} style={{
						position: 'absolute',
						width: `${size}px`,
						height: `${size}px`,
						backgroundColor: color,
						borderRadius: '50%',
						left: `${x}px`,
						top: `${y}px`,
						opacity: opacidad,
						// Efecto de brillo (glow) multicolor
						boxShadow: `0 0 15px ${color}, 0 0 30px ${color}`,
						// Mezcla de desenfoque para dar profundidad 3D
						filter: `blur(${(i % 3) * 2}px)`, 
						zIndex: 0,
					}} />
				);
			})}

		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🎉 EXPLOSIÓN DE ÉXITO (Confeti en el Paso 5)
// -----------------------------------------------------------------
const ExplosionExito: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	
	// Animación explosiva (rápida al inicio, luego se frena)
	const explosion = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
	const opacity = interpolate(frame, [0, 40, 80], [1, 1, 0]); // Se desvanece suavemente

	return (
		<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 6, pointerEvents: 'none' }}>
			{[...Array(40)].map((_, i) => {
				// Matemáticas para disparar en círculo
				const angle = (i / 40) * Math.PI * 2;
				const velocity = 250 + (i % 5) * 80; 
				const translateX = Math.cos(angle) * velocity * explosion;
				const translateY = Math.sin(angle) * velocity * explosion;
				const rotation = frame * (4 + (i % 3)); // Rotación del confeti

				return (
					<div key={i} style={{
						position: 'absolute',
						width: `${10 + (i % 12)}px`,
						height: `${10 + (i % 12)}px`,
						backgroundColor: i % 2 === 0 ? '#FFC300' : '#FFFFFF', // Oro y Blanco
						borderRadius: i % 3 === 0 ? '50%' : '2px', // Mezcla de círculos y cuadrados
						transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
						opacity: opacity,
						boxShadow: '0 0 10px rgba(255,195,0,0.5)'
					}} />
				);
			})}
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 👆 NUEVO: COMPONENTE DE CLIC PREMIUM (Mano + Ripple + Rebote)
// -----------------------------------------------------------------
const EfectoClicPremium: React.FC<{ x: number; y: number }> = ({ x, y }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Duración total de la animación (1 segundo o 30 frames)
	// Frames 0-10: Entra la mano volando
	// Frames 10-15: Presiona (Rebote) y estalla el ripple
	// Frames 15-30: Desaparece la mano y se expande el ripple

	// 1️⃣ ANIMACIONES DE LA MANO PUNTERO 👇
	const entradaMano = spring({ frame, fps, config: { damping: 10 }, durationInFrames: 10 });
	
	// Opacidad de la mano (Aparece rápido, se queda, y desaparece al final)
	const opacidadMano = interpolate(frame, [0, 5, 20, 30], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
	
	// Movimiento de entrada (Viene desde 50px abajo y a la derecha hacia el punto exacto)
	const moverManoX = interpolate(entradaMano, [0, 1], [50, 0]);
	const moverManoY = interpolate(entradaMano, [0, 1], [50, 0]);
	
	// Rebote de presión (En el frame 10, la mano se achica un poco simulando fuerza)
	const escalaMano = interpolate(frame, [10, 13, 18], [1, 0.8, 1], { extrapolateRight: 'clamp' });

	// 2️⃣ ANIMACIONES DEL RIPPLE DORADO (Empieza a estallar en el frame 10) 👇
	// Retrasamos el cálculo del ripple 10 frames
	const frameRipple = Math.max(0, frame - 10);
	
	const escalaRipple = interpolate(frameRipple, [0, 15], [0, 2.5], { extrapolateRight: 'clamp' });
	const opacidadRipple = interpolate(frameRipple, [0, 15], [1, 0], { extrapolateRight: 'clamp' });

	return (
		<div style={{
			position: 'absolute',
			left: `${x}%`, top: `${y}%`,
			width: '1px', height: '1px', // Contenedor invisible en el punto exacto
			zIndex: 15, pointerEvents: 'none'
		}}>
			{/* Sonido de "tap" sincronizado con la presión (frame 10) */}
			<Audio src={staticFile('click-sound.mp3')} volume={0.8} startFrom={10} />

			{/* 🟡 EL RIPPLE DORADO (Hijo del contenedor, centrado con translate -50%) */}
			<div style={{
				position: 'absolute',
				width: '50px', height: '50px',
				backgroundColor: 'rgba(255, 195, 0, 0.4)',
				border: '4px solid #FFC300',
				borderRadius: '50%',
				transform: `translate(-50%, -50%) scale(${escalaRipple})`,
				opacity: opacidadRipple,
			}} />

			{/* 👆 LA MANO PUNTERO (Entra volando y rebota) */}
			<div style={{
				position: 'absolute',
				fontSize: '80px', // Tamaño de la mano
				transform: `translate(-20%, -20%) translate(${moverManoX}px, ${moverManoY}px) scale(${escalaMano}) rotate(-15deg)`,
				opacity: opacidadMano,
				filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))', // Sombra para dar profundidad
			}}>
				👇
			</div>
		</div>
	);
};

// -----------------------------------------------------------------
// ✨ COMPONENTE PARA LOS TÍTULOS DINÁMICOS
// -----------------------------------------------------------------
const TituloAnimado: React.FC<{ texto: string }> = ({ texto }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const entrada = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
	const moverY = interpolate(entrada, [0, 1], [150, 0]);
	const opacidad = interpolate(entrada, [0, 1], [0, 1]);

	return (
		<div style={{
			position: 'absolute', bottom: '8%', left: 0, width: '100%', display: 'flex', justifyContent: 'center',
			transform: `translateY(${moverY}px)`, opacity: opacidad, zIndex: 20
		}}>
			<Audio src={staticFile('click-sound.mp3')} volume={0.6} />
			<div style={{
				background: 'linear-gradient(90deg, #FFC300 0%, #FF8C00 100%)', color: '#111', padding: '18px 45px', 
				borderRadius: '50px', fontSize: '42px', fontWeight: '900', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', 
				border: '5px solid #FFF', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center'
			}}>
				{texto}
			</div>
		</div>
	);
};

// -----------------------------------------------------------------
// 💡 NUEVO: COMPONENTE DE CENTRO MULTICOLOR BRILLANTE (PULSANTE)
// -----------------------------------------------------------------
const CentroMulticolor: React.FC = () => {
    const frame = useCurrentFrame();

    // Pulso suave para el resplandor
    const pulsoMulticolor = interpolate(Math.sin(frame / 20), [-1, 1], [1, 1.1]);

    return (
        <AbsoluteFill style={{
            justifyContent: 'center', alignItems: 'center', zIndex: 0,
        }}>
            <div style={{
                width: '70%', height: '80%',
                // Gradiente Multicolor Surtitodo: Oro -> Rubí -> Zafiro
                background: 'radial-gradient(ellipse at center, #FFC300 0%, #E60000 40%, #00C4CC 70%, transparent 100%)',
                filter: 'blur(100px)', // Muy difuminado para que parezca luz
                opacity: 0.1, // Sutil para que no tape
                transform: `scale(${pulsoMulticolor})`, // Pulso suave
                zIndex: 1,
            }} />
        </AbsoluteFill>
    );
};

export const TutorialReel: React.FC<z.infer<typeof tutorialSchema>> = ({ companyUrl, videoFileName }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const duracionVideo = 1110; 

	const intro = spring({ frame, fps, config: { damping: 15 } });
	const scale = interpolate(intro, [0, 1], [0.8, 1]);
	const fadeOutCelular = interpolate(frame, [duracionVideo - 15, duracionVideo], [1, 0], { extrapolateRight: 'clamp' });
	
    // 💡 NUEVO: Pulso multicolor centrado (Reemplaza la sutil aura dorada)
	// const pulsoAura = interpolate(Math.sin(frame / 10), [-1, 1], [0.1, 0.35]); // ELIMINADA

	const progreso = interpolate(frame, [0, duracionVideo], [0, 100], { extrapolateRight: 'clamp' });

	// 💎 MEJORA 1: REFLEJO DE CRISTAL (Glass Glare) -- ELIMINADO
	// Pasa de izquierda a derecha en 30 frames, y descansa 120 frames (ciclo de 150 frames = 5 segundos)
	// const glareX = interpolate(frame % 150, [0, 30, 150], [-100, 200, 200], { extrapolateRight: 'clamp' }); // ELIMINADA

	return (
		<AbsoluteFill style={{ 
			// Fondo base oscuro sofisticado
			background: `radial-gradient(circle at center, #2a1b0a 0%, #050505 100%)`, 
			fontFamily: 'Poppins, sans-serif' 
		}}>
			
			<Audio src={staticFile('vip-music.mp3')} volume={0.08} loop />
			
			{/* 🪄 ANIMACIONES DE FONDO MULTICOLOR BRILLANTE (Mejora final) */}
			<BackgroundDecorations />

            {/* 💡 LUZ DE CENTRO MULTICOLOR BRillante (NUEVA: Recuperando el efecto 'bonito') */}
            <CentroMulticolor />

			<Sequence durationInFrames={duracionVideo}>
				<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fadeOutCelular }}>
					
					{/* ✨ Aura central suave - REEMPLAZADA por CentroMulticolor para más brillo y color */}
					{/* <div style={{
						position: 'absolute', width: '70%', height: '80%', background: 'radial-gradient(ellipse at center, #FFC300 0%, transparent 60%)',
						filter: 'blur(70px)', opacity: pulsoAura, zIndex: 1,
					}} /> */}

					<div style={{
						position: 'absolute', top: '7%', backgroundColor: 'rgba(255,195,0,0.1)', border: '1px solid rgba(255,195,0,0.3)',
						color: '#FFC300', padding: '10px 30px', borderRadius: '50px', fontSize: '45px', fontWeight: '700', letterSpacing: '2px',
						transform: `scale(${scale})`, zIndex: 10
					}}>
						📱 APRENDE A COMPRAR FÁCIL
					</div>

					{/* MARCO DEL CELULAR */}
					<div style={{
						height: '70%', aspectRatio: '9/16', backgroundColor: '#111', borderRadius: '45px', border: '12px solid #222', 
						boxShadow: '0 0 50px rgba(255,195,0,0.15), 0 30px 60px rgba(0,0,0,0.8)', overflow: 'hidden',
						transform: `scale(${scale})`, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center',
						zIndex: 5
					}}>
						{/* Video original MUTEADO al 50% */}
						<Video src={staticFile(videoFileName)} style={{ height: '100%', width: '100%', objectFit: 'cover' }} volume={0.5} />
						
						{/* 💎 ELIMINADO: Efecto de Cristal (Glass Glare) para máxima nitidez */}
						{/* <div style={{
							position: 'absolute', top: 0, left: 0, width: '200%', height: '100%',
							background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.25) 30%, transparent 35%)',
							transform: `translateX(${glareX}%)`,
							pointerEvents: 'none', zIndex: 10 // Pasa por encima de todo dentro del celular
						}} /> */}

						{/* 👆 INDICADORES DE CLIC EN PANTALLA 👆 */}
						{/* Tus tiempos y coordenadas exactas e intocables 👇 */}

						{/* Ejemplo: Clic en la barra de búsqueda en el Paso 1 */}
						<Sequence from={259} durationInFrames={30}>
							<EfectoClicPremium x={50} y={60} /> 
						</Sequence>

						{/* Ejemplo: Clic en el botón de agregar al carrito */}
						<Sequence from={374} durationInFrames={30}>
							<EfectoClicPremium x={50} y={20} /> 
						</Sequence>

						<Sequence from={548} durationInFrames={120}>
							<EfectoClicPremium x={60} y={45} /> 
						</Sequence>

						<Sequence from={548} durationInFrames={120}>
							<EfectoClicPremium x={30} y={45} /> 
						</Sequence>

						<Sequence from={804} durationInFrames={120}>
							<EfectoClicPremium x={50} y={70} /> 
						</Sequence>

						<Sequence from={950} durationInFrames={180}>
							<EfectoClicPremium x={50} y={75} /> 
						</Sequence>

						<Sequence from={643} durationInFrames={30}>
							<EfectoClicPremium x={85} y={90} /> 
						</Sequence>

					</div>
				</AbsoluteFill>

				{/* BARRA DE PROGRESO */}
				<div style={{
					position: 'absolute', bottom: 0, left: 0, height: '8px', width: `${progreso}%`, 
					backgroundColor: '#FFC300', boxShadow: '0 0 15px #FFC300', zIndex: 50, opacity: fadeOutCelular
				}} />

				{/* TÍTULOS DINÁMICOS */}
				<Sequence from={150} durationInFrames={160}>
					<TituloAnimado texto="Paso 1: surtitodoideal.com 🛒" />
				</Sequence>
				<Sequence from={360} durationInFrames={120}>
					<TituloAnimado texto="Paso 2: Busca tu producto 🔎" />
				</Sequence>
				{/* Decimal corregido aquí 👇 */}
				<Sequence from={487} durationInFrames={100}>
					<TituloAnimado texto="Paso 3: Agrega los productos 🛵" />
				</Sequence>
				<Sequence from={600} durationInFrames={100}>
					<TituloAnimado texto="Paso 4: Da click en el carrito" />
				</Sequence>
				<Sequence from={840} durationInFrames={100}>
					<TituloAnimado texto="Paso 5: Llena el formulario" />
				</Sequence>

				{/* 🎉 EXPLOSIÓN DE ÉXITO EN EL PASO 5 */}
				{/* Justo cuando entra el Paso 5 (Frame 840), estalla el confeti detrás y alrededor del celular */}
				<Sequence from={810} durationInFrames={100}>
					<ExplosionExito />
				</Sequence>

			</Sequence>

			{/* FINAL EXPLOSIVO VIP */}
			<Sequence from={duracionVideo} durationInFrames={150}>
				<EscenaFinalVIP companyUrl={companyUrl} />
			</Sequence>

		</AbsoluteFill>
	);
};