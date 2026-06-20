import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, Sequence, Audio, staticFile } from 'remotion';
import { z } from 'zod';
import { promoSchema } from './Composition';

export const ReelTemporada: React.FC<z.infer<typeof promoSchema>> = ({ companyUrl, productos }) => {
	const introDuration = 120;
	const duracionPorProducto = 150;
	const outroDuration = 180; 

	return (
		<AbsoluteFill style={{ backgroundColor: '#010410', overflow: 'hidden', fontFamily: 'sans-serif' }}>
			<Audio src={staticFile('background-music.mp3')} volume={0.4} />

			<FondoOceano />

			<Sequence from={0} durationInFrames={introDuration + 30}>
				<IntroCinematica />
			</Sequence>

			{productos.slice(0, 4).map((producto, index) => {
				const startFrame = introDuration + (index * duracionPorProducto);
				return (
					<Sequence key={index} from={startFrame} durationInFrames={duracionPorProducto + 30}>
						<EscenaProductoPremium3D producto={producto} index={index} />
					</Sequence>
				);
			})}

			<Sequence from={introDuration + (4 * duracionPorProducto)} durationInFrames={outroDuration}>
				<OutroPremium companyUrl={companyUrl} />
			</Sequence>
		</AbsoluteFill>
	);
};

// --- COMPONENTES DE ANIMACIÓN PREMIUM ---

const FondoOceano: React.FC = () => {
	const frame = useCurrentFrame();
	
	const luzOscilante = Math.sin(frame / 60) * 5; 
	const opacidadLuz = interpolate(Math.sin(frame / 45), [-1, 1], [0.1, 0.2]); 

	return (
		<AbsoluteFill style={{ filter: 'blur(5px)' }}>
			<div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle at 50% -10%, #0c2849 0%, #010410 80%)' }} />
			
			<div style={{
				position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%',
				background: `conic-gradient(from 180deg at 50% 0%, transparent 160deg, #10b981 180deg, transparent 200deg)`,
				transform: `rotate(${10 + luzOscilante}deg)`,
				filter: 'blur(100px)',
				opacity: opacidadLuz,
				mixBlendMode: 'screen'
			}} />

			{[...Array(15)].map((_, i) => {
				const startFrame = (i * 45) % 900;
				const currentBubbleFrame = (frame - startFrame) % 900;
				
				const bubbleOpacity = interpolate(currentBubbleFrame, [0, 60, 800, 900], [0, 0.3, 0.3, 0]);
				const bubbleY = interpolate(currentBubbleFrame, [0, 900], [1920 + 200, -200]);
				const bubbleX = 100 + (i * 60);

				return (
					<div key={i} style={{
						position: 'absolute', left: `${bubbleX}px`, top: `${bubbleY}px`,
						width: `${20 + i}px`, height: `${20 + i}px`, borderRadius: '50%',
						background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 70%)',
						border: '1px solid rgba(255,255,255,0.1)',
						opacity: bubbleOpacity, zIndex: i
					}} />
				);
			})}
		</AbsoluteFill>
	);
};

const IntroCinematica: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Animaciones en cascada (Staggered animations) para que no todo entre de golpe
	const enterSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
	const badgeTopAnim = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 12, stiffness: 140 } });
	const subTitleAnim = spring({ frame: Math.max(0, frame - 25), fps, config: { damping: 12, stiffness: 120 } });
	const bottomBadgeAnim = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 14, stiffness: 110 } });

	const globalOpacity = interpolate(frame, [0, 20, 100, 120], [0, 1, 1, 0]); 

	const logoY = interpolate(enterSpring, [0, 1], [-100, 0]);
	const logoOpacity = enterSpring;

	const textScale = interpolate(enterSpring, [0, 1], [0.8, 1]);
	const textRotate = interpolate(enterSpring, [0, 1], [8, 0]);
	const textOpacity = interpolate(frame, [15, 35], [0, 1]); 

	return (
		<AbsoluteFill style={{ 
			justifyContent: 'center', // Centrado vertical para equilibrar la nueva información
			alignItems: 'center', opacity: globalOpacity, zIndex: 100,
			padding: '40px 60px',
		}}>
			
			{/* --- NUEVO: Etiqueta de Ubicación (Entra primero) --- */}
			<div style={{
				transform: `translateY(${interpolate(badgeTopAnim, [0, 1], [-50, 0])}px) scale(${badgeTopAnim})`,
				opacity: badgeTopAnim,
				background: 'rgba(255, 255, 255, 0.1)',
				border: '2px solid rgba(255, 255, 255, 0.2)',
				backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
				padding: '15px 40px',
				borderRadius: '50px',
				color: 'white',
				fontSize: '28px',
				fontWeight: '900',
				letterSpacing: '4px',
				marginBottom: '50px',
				boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
				textTransform: 'uppercase'
			}}>
				📍 ¡Atención Caicedonia, Valle!
			</div>

			{/* --- SECCIÓN: El Logo --- */}
			<div style={{ transform: `translateY(${logoY}px)`, opacity: logoOpacity, marginBottom: '50px' }}>
				<Img 
					src={staticFile('logo2.png')} 
					style={{ height: '220px', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))' }} 
				/>
			</div>

			{/* --- SECCIÓN: Título Principal --- */}
			<div style={{ 
				textAlign: 'center', transform: `scale(${textScale}) rotate(${textRotate}deg)`,
				opacity: textOpacity, position: 'relative' 
			}}>
				{/* Destellos de luz programados detrás del texto */}
				{[...Array(12)].map((_, i) => {
					const randomX = (Math.random() - 0.5) * 800; 
					const randomY = (Math.random() - 0.5) * 300; 
					const delay = Math.random() * 40; 
					const size = 5 + Math.random() * 15; 
					const sparkOpac = interpolate(frame - 30 - delay, [0, 15, 30], [0, 0.7, 0], { extrapolateRight: 'clamp' });

					return (
						<div key={i} style={{
							position: 'absolute', left: `calc(50% + ${randomX}px)`, top: `calc(50% + ${randomY}px)`,
							width: `${size}px`, height: `${size}px`, borderRadius: '50%',
							background: Math.random() > 0.5 ? '#10b981' : '#FFC300', 
							opacity: sparkOpac, filter: 'blur(3px)', zIndex: -1 
						}} />
					);
				})}

				<div style={{
					color: '#10b981', fontSize: '50px', fontWeight: '900', letterSpacing: '12px',
					textShadow: '0 0 25px rgba(16,185,129,0.8)', textTransform: 'uppercase'
				}}>
					Especial de
				</div>
				<h1 style={{
					fontSize: '140px', color: 'white', margin: '-15px 0 0 0', fontWeight: '900',
					textTransform: 'uppercase', textShadow: '0 25px 60px rgba(0,0,0,1)', lineHeight: '1' 
				}}>
					Temporada
				</h1>
			</div>

			{/* --- NUEVO: Subtítulo de Impacto --- */}
			<div style={{
				transform: `translateY(${interpolate(subTitleAnim, [0, 1], [50, 0])}px)`,
				opacity: subTitleAnim,
				color: '#FFC300',
				fontSize: '48px',
				fontWeight: '900',
				textTransform: 'uppercase',
				marginTop: '30px',
				textShadow: '0 10px 20px rgba(0,0,0,0.8)',
				textAlign: 'center',
				lineHeight: '1.2'
			}}>
				¡Productos de Semana Santa<br/>en Surtitodo Ideal!
			</div>

			{/* --- NUEVO: Cinta de Urgencia (Entra de último) --- */}
			<div style={{
				transform: `scale(${bottomBadgeAnim})`,
				opacity: bottomBadgeAnim,
				background: 'linear-gradient(135deg, #E60000 0%, #990000 100%)',
				padding: '25px 60px',
				borderRadius: '25px',
				color: 'white',
				fontSize: '38px',
				fontWeight: '900',
				marginTop: '60px',
				boxShadow: '0 20px 40px rgba(230,0,0,0.6)',
				border: '3px solid #ff4d4d',
				letterSpacing: '1px'
			}}>
				⏳ ¡HASTA AGOTAR EXISTENCIAS!
			</div>

		</AbsoluteFill>
	);
};

const EscenaProductoPremium3D: React.FC<{ producto: any, index: number }> = ({ producto, index }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Mensajes de marketing dinámicos
	const mensajesMarketing = [
		"🔥 ¡OFERTA IMPERDIBLE!",
		"⭐ CALIDAD GARANTIZADA",
		"🛒 FAVORITO DEL MES",
		"⚡ ¡LLEVA MÁS POR MENOS!"
	];
	const mensajeActual = mensajesMarketing[index % mensajesMarketing.length];

	// ANIMACIONES EN CASCADA (Staggered Animations)
	const salidaAnim = spring({ frame: Math.max(0, frame - 135), fps, config: { damping: 10, stiffness: 150 } });
	
	// 1. Entrada de la tarjeta base
	const cardAnim = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
	// 2. Entrada de la imagen (con un ligero retraso)
	const imageAnim = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 12, stiffness: 140 } });
	// 3. Entrada de los textos de marketing y título
	const textAnim = spring({ frame: Math.max(0, frame - 20), fps, config: { damping: 12, stiffness: 130 } });
	// 4. Explosión del precio final
	const priceAnim = spring({ frame: Math.max(0, frame - 35), fps, config: { damping: 10, stiffness: 160 } });

	const scaleCard = interpolate(cardAnim, [0, 1], [0.8, 1]) + interpolate(salidaAnim, [0, 1], [0, -0.1]);
	const riseY = interpolate(cardAnim, [0, 1], [250, 0]) + interpolate(salidaAnim, [0, 1], [0, -300]);
	const rotacion3D = interpolate(cardAnim, [0, 1], [-15, 0]); 
	const rotacion3DX = interpolate(frame, [0, 150], [-5, 5]); 
	
	const opacidad = interpolate(frame, [0, 15, 140, 150], [0, 1, 1, 0]);

	const glintPosition = interpolate(frame, [25, 70], [-1000, 1000]); 

	return (
		<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 10, opacity: opacidad }}>
			<div style={{
				width: '900px', height: '1150px',
				transform: `translateY(${riseY}px) scale(${scaleCard}) rotateZ(${rotacion3D}deg) rotateX(${rotacion3DX}deg)`,
				perspective: '1200px', 
			}}>
				<div style={{
					width: '100%', height: '100%', background: 'rgba(255, 255, 255, 0.05)',
					backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
					border: '2px solid rgba(255, 255, 255, 0.15)',
					borderRadius: '60px', padding: '50px',
					display: 'flex', flexDirection: 'column', alignItems: 'center',
					boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 0 40px rgba(255,255,255,0.05)',
					position: 'relative', overflow: 'hidden' 
				}}>
					
					<div style={{
						position: 'absolute', top: 0, left: `${glintPosition}px`, width: '1000px', height: '100%',
						background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
						transform: 'skewX(-45deg)', pointerEvents: 'none', zIndex: 5
					}} />

					{producto.porcentaje > 0 && (
						<div style={{
							position: 'absolute', top: '20px', right: '20px', zIndex: 10,
							background: 'linear-gradient(135deg, #FF3366 0%, #E60000 100%)', color: 'white',
							padding: '20px 35px', borderRadius: '40px', fontSize: '55px', fontWeight: '900',
							boxShadow: '0 20px 50px rgba(230,0,0,0.6)', border: '3px solid rgba(255,255,255,0.3)',
							transform: `scale(${cardAnim}) rotate(12deg)`
						}}>
							-{producto.porcentaje}%
						</div>
					)}

					{/* Banner de Marketing Dinámico */}
					<div style={{
						transform: `scale(${textAnim}) translateY(${interpolate(textAnim, [0, 1], [-50, 0])}px)`,
						background: '#10b981', color: '#fff', padding: '10px 40px', borderRadius: '30px',
						fontSize: '30px', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase',
						marginBottom: '30px', boxShadow: '0 10px 30px rgba(16,185,129,0.5)', zIndex: 6
					}}>
						{mensajeActual}
					</div>

					<div style={{
						width: '100%', height: '520px', background: '#ffffff', borderRadius: '40px',
						display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px',
						boxShadow: 'inset 0 0 50px rgba(0,0,0,0.05), 0 30px 60px rgba(0,0,0,0.4)',
						marginBottom: '40px', position: 'relative',
						transform: `scale(${imageAnim})` // Animación independiente
					}}>
						<Img src={producto.imageUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 25px 45px rgba(0,0,0,0.3))' }} />
					</div>

					<h2 style={{
						fontSize: '60px', color: 'white', textAlign: 'center', lineHeight: '1.1',
						fontWeight: '900', margin: '0 0 30px 0', textShadow: '0 8px 15px rgba(0,0,0,0.6)',
						textTransform: 'uppercase', transform: `scale(${textAnim})`, opacity: textAnim
					}}>
						{producto.productName}
					</h2>

					<div style={{ 
						display: 'flex', flexDirection: 'column', alignItems: 'center',
						transform: `scale(${priceAnim})`, opacity: priceAnim 
					}}>
						{producto.porcentaje > 0 && (
							<span style={{ 
								color: '#94a3b8', fontSize: '40px', textDecoration: 'line-through', 
								fontWeight: '700', marginBottom: '-10px' 
							}}>
								$ {producto.precioAntes}
							</span>
						)}
						<div style={{
							color: '#FFC300', fontSize: '135px', fontWeight: '900',
							textShadow: `0 0 ${25 + Math.sin(frame / 8) * 10}px rgba(255,195,0,0.5)`,
							lineHeight: '1', letterSpacing: '-4px'
						}}>
							<span style={{ fontSize: '65px', verticalAlign: 'top', marginRight: '5px' }}>$</span>{producto.precio}
						</div>
					</div>

				</div>
			</div>
		</AbsoluteFill>
	);
};

const OutroPremium: React.FC<{ companyUrl: string }> = ({ companyUrl }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	
	const anim = spring({ frame, fps, config: { damping: 15 } });
	const glowPulse = Math.abs(Math.sin(frame / 20)) * 30;

	return (
		<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle, rgba(12,40,73,0.8) 0%, rgba(1,4,16,1) 100%)' }}>
			<div style={{ transform: `scale(${anim}) rotate(${interpolate(anim, [0, 1], [-5, 0])}deg)`, textAlign: 'center' }}>
				<Img src={staticFile('logo2.png')} style={{ height: '300px', marginBottom: '60px', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.8))' }} />
				<h2 style={{ fontSize: '70px', color: 'white', fontWeight: '900', margin: '0 0 60px 0', textShadow: '0 10px 20px rgba(0,0,0,1)' }}>
					¡Pide ahora sin salir de casa!
				</h2>
				<div style={{
					background: '#E60000', padding: '35px 90px', borderRadius: '100px',
					boxShadow: `0 25px 60px rgba(230,0,0,0.5), 0 0 ${30 + glowPulse}px rgba(230,0,0,0.6)`,
					border: '3px solid rgba(255,255,255,0.3)',
					transform: `scale(${1 + glowPulse / 300})`
				}}>
					<span style={{ color: 'white', fontSize: '60px', fontWeight: '900', letterSpacing: '1px' }}>{companyUrl}</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};