import React from 'react';
import {
	AbsoluteFill,
	Audio,
	interpolate,
	interpolateColors,
	spring,
	useCurrentFrame,
	useVideoConfig,
	Img,
	Sequence,
} from 'remotion';

// Importamos la fuente Poppins
import { loadFont } from '@remotion/google-fonts/Poppins';
const { fontFamily: fontPoppins } = loadFont();

// Paleta de colores de Surtitodo
const colors = {
	red: '#ED1C24',
	yellow: '#FFF200',
	orange: '#F7941D',
};

// --- Componentes de Detalles y Fondo ---
const Background: React.FC = () => {
	const frame = useCurrentFrame();

	const stop1Color = interpolateColors(frame, [0, 150, 300], [colors.red, colors.yellow, colors.red]);
	const stop2Color = interpolateColors(frame, [0, 150, 300], [colors.orange, colors.red, colors.orange]);

	return (
		<AbsoluteFill>
			<svg width="100%" height="100%">
				<defs>
					<linearGradient id="surtitodoGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={stop1Color} />
						<stop offset="100%" stopColor={stop2Color} />
					</linearGradient>
				</defs>
				<rect width="100%" height="100%" fill="url(#surtitodoGradient)" />
			</svg>
		</AbsoluteFill>
	);
};

const FloatingElements: React.FC = () => {
	const frame = useCurrentFrame();
	
	return (
		<AbsoluteFill style={{ opacity: 0.6 }}>
			{Array.from({ length: 15 }).map((_, i) => {
				const size = 20 + (i % 3) * 15;
				const startX = (i * 7) % 100;
				const yPos = interpolate(frame, [0, 300], [110, -20]) - (i * 5);
				const xPos = startX + Math.sin((frame + i * 20) / 15) * 3;

				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							width: size,
							height: size,
							left: `${xPos}%`,
							top: `${yPos}%`,
							backgroundColor: i % 2 === 0 ? colors.yellow : 'white',
							borderRadius: i % 3 === 0 ? '50%' : '10%',
							transform: `rotate(${frame * (i % 2 === 0 ? 1 : -1)}deg)`,
							opacity: interpolate(frame, [0, 30, 270, 300], [0, 0.8, 0.8, 0]),
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// --- Título Profesional Premium ---
const ProfessionalWinnerTitle: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const text = "¡GANADOR!";

	const containerStyle: React.CSSProperties = {
		position: 'relative',
		display: 'flex',
		justifyContent: 'center',
		marginBottom: -25, 
		zIndex: 10,
	};

	return (
		<div style={containerStyle}>
			{text.split('').map((letter, i) => {
				const delay = i * 2; 
				const letterSpring = spring({
					fps,
					frame: frame - delay,
					config: { damping: 10, mass: 0.8, stiffness: 150 },
				});

				const letterBaseStyle: React.CSSProperties = {
					fontFamily: fontPoppins,
					fontWeight: 900, 
					fontSize: 100, 
					letterSpacing: '2px', 
					textTransform: 'uppercase',
					display: 'inline-block',
					position: 'relative',
					opacity: letterSpring,
					transform: `scale(${interpolate(letterSpring, [0, 1], [0.5, 1])}) translateY(${interpolate(letterSpring, [0, 1], [50, 0])}px)`,
					background: `linear-gradient(to bottom, #FFFFFF 0%, #FFF200 45%, #F7941D 100%)`,
					WebkitBackgroundClip: 'text', 
					color: 'transparent', 
					filter: `
						drop-shadow(0px 2px 0px rgba(0,0,0,1))
						drop-shadow(0px 4px 0px rgba(0,0,0,1))
						drop-shadow(0px 7px 0px rgba(0,0,0,0.8))
						drop-shadow(0px 10px 15px rgba(0,0,0,0.6))
						drop-shadow(0px 0px 15px rgba(255,242,0,0.5)) 
					`,
				};

				return (
					<span key={i} style={letterBaseStyle}>
						{letter === ' ' ? '\u00A0' : letter}
					</span>
				);
			})}
		</div>
	);
};

// --- Tarjeta del Cliente ---
const ClientCard: React.FC<{ name: string; address: string; imageUrl: string; prizeText: string }> = ({ name, address, imageUrl, prizeText }) => {
	const frame = useCurrentFrame();
	
	const floatY = Math.sin(frame / 15) * 15;

	const borderPulse = interpolateColors(
		frame % 40,
		[0, 20, 40],
		['rgba(255, 242, 0, 0.4)', 'rgba(255, 242, 0, 1)', 'rgba(255, 242, 0, 0.4)']
	);

	const fadeOutOpacity = interpolate(frame, [230, 250], [1, 0], { extrapolateRight: 'clamp' });
	const scaleOut = interpolate(frame, [230, 250], [1, 0.9], { extrapolateRight: 'clamp' });

	return (
		<AbsoluteFill
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				opacity: fadeOutOpacity,
				transform: `scale(${scaleOut}) translateY(${floatY}px)`,
			}}
		>
			<ProfessionalWinnerTitle />

			<div
				style={{
					width: 500, // Ajusté apenitas el tamaño para que quepa bien la nueva etiqueta del premio
					height: 500,
					borderRadius: '50%',
					border: `18px solid ${colors.yellow}`,
					boxShadow: `0 20px 50px rgba(0,0,0,0.4), 0 0 80px ${borderPulse}`,
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: 'white',
					margin: '25px 0',
					zIndex: 5,
				}}
			>
				<Img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
			</div>

			<div style={{ textAlign: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', padding: '15px 40px', borderRadius: '25px', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				
				{/* NOMBRE DEL CLIENTE */}
				<p style={{ fontFamily: fontPoppins, fontWeight: 'bold', fontSize: 45, color: 'white', margin: 0 }}>
					{name}
				</p>
				
				{/* NUEVA ETIQUETA: PREMIO GANADO */}
				<div style={{
					backgroundColor: colors.yellow,
					padding: '6px 20px',
					borderRadius: '30px',
					marginTop: '10px',
					marginBottom: '10px',
					boxShadow: '0 5px 15px rgba(255, 242, 0, 0.3)'
				}}>
					<p style={{ 
						fontFamily: fontPoppins, 
						fontWeight: 900, // Black
						fontSize: 24, 
						color: '#111', // Casi negro para que contraste con el amarillo
						margin: 0,
						textTransform: 'uppercase',
						letterSpacing: '1px'
					}}>
						🛒 PREMIO: {prizeText}
					</p>
				</div>

				{/* DIRECCIÓN / UBICACIÓN */}
				<p style={{ fontFamily: fontPoppins, fontWeight: 500, fontSize: 24, color: '#f0f0f0', margin: '5px 0 5px' }}>
					📍 {address}
				</p>
			</div>
		</AbsoluteFill>
	);
};

// --- Cierre Final Surtitodo ---
const LogoCrossover: React.FC<{ logoUrl: string }> = ({ logoUrl }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const entryFrame = 235; 
	
	const entrySpring = spring({
		frame: frame - entryFrame,
		fps,
		config: { damping: 10, mass: 1, stiffness: 120 },
	});

	const rotate = interpolate(entrySpring, [0, 1], [-20, 0]);
	const scale = interpolate(entrySpring, [0, 1], [0.3, 1]);
	const opacity = interpolate(frame, [entryFrame, entryFrame + 15], [0, 1], { extrapolateRight: 'clamp' });
	const auraRotation = frame * 2;

	const finalTextLine1 = "¡Surtitodo Ideal";
	const finalTextLine2 = "te acompaña en tu celebración! ✨";

	const textEntrySpring1 = spring({
		frame: frame - (entryFrame + 15),
		fps,
		config: { damping: 12, stiffness: 100 },
	});
	const textEntrySpring2 = spring({
		frame: frame - (entryFrame + 25), 
		fps,
		config: { damping: 12, stiffness: 100 },
	});

	const professionalTextStyle: React.CSSProperties = {
		fontFamily: fontPoppins,
		fontWeight: 700, 
		color: 'white',
		textAlign: 'center',
		margin: 0,
		filter: `
			drop-shadow(0px 4px 6px rgba(0,0,0,0.5))
			drop-shadow(0px 0px 8px rgba(255,242,0,0.3))
		`,
	};

	return (
		<AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity }}>
			
			<div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<div 
					style={{ 
						position: 'absolute', width: 400, height: 400, borderRadius: '50%', 
						background: `radial-gradient(circle, rgba(255,242,0,0.8) 0%, rgba(255,242,0,0) 70%)`,
						transform: `scale(${entrySpring}) rotate(${auraRotation}deg)`,
						zIndex: 1
					}} 
				/>
				
				<Img
					src={logoUrl}
					style={{
						height: 320, 
						marginBottom: 40,
						transform: `scale(${scale}) rotate(${rotate}deg)`,
						zIndex: 2,
						filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))'
					}}
				/>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', maxWidth: 700, zIndex: 10 }}>
				<p
					style={{
						...professionalTextStyle,
						fontSize: 42,
						opacity: textEntrySpring1,
						transform: `translateY(${interpolate(textEntrySpring1, [0, 1], [30, 0])}px)`,
					}}
				>
					{finalTextLine1}
				</p>
				<p
					style={{
						...professionalTextStyle,
						fontSize: 36, 
						fontWeight: 600, 
						color: '#FFD700', 
						opacity: textEntrySpring2,
						transform: `translateY(${interpolate(textEntrySpring2, [0, 1], [30, 0])}px)`,
					}}
				>
					{finalTextLine2}
				</p>
			</div>

		</AbsoluteFill>
	);
};

// --- Ondas de Audio Visuales ---
const AudioWaveform: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<div style={{ position: 'absolute', bottom: 40, left: 100, right: 100, height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', opacity: 0.5 }}>
			{Array.from({ length: 30 }).map((_, i) => (
				<div
					key={i}
					style={{
						width: 12,
						backgroundColor: 'white',
						borderRadius: 6,
						height: interpolate(
							(frame + i * 3) % 40,
							[0, 20, 40],
							[15, Math.random() * 60 + 20, 15],
							{ extrapolateRight: 'clamp' }
						),
					}}
				/>
			))}
		</div>
	);
};

// --- Composición Principal ---
export const OfferWonReel: React.FC<{ 
	clientName: string; 
	propertyAddress: string; 
	clientImageUrl: string; 
	logoImageUrl: string;
	prizeText?: string; // <-- NUEVA PROPIEDAD
}> = ({ 
	clientName, 
	propertyAddress, 
	clientImageUrl, 
	logoImageUrl,
	prizeText = "MERCADO DE VERDURAS" // <-- VALOR POR DEFECTO
}) => {

	const celebrationAudioUrl = 'http://localhost:4000/celebration_track.mp3'; 
	const whooshSfxUrl = 'http://localhost:4000/whoosh.mp3'; 
	const tadaSfxUrl = 'http://localhost:4000/tada.mp3'; 

	return (
		<AbsoluteFill style={{ backgroundColor: 'black' }}>
			<Background />
			<FloatingElements />

			{/* Pasamos la nueva propiedad a la tarjeta del cliente */}
			<ClientCard 
				name={clientName} 
				address={propertyAddress} 
				imageUrl={clientImageUrl} 
				prizeText={prizeText}
			/>
			
			<LogoCrossover logoUrl={logoImageUrl} />
			<AudioWaveform />

			<Audio src={celebrationAudioUrl} volume={0.5} />
			<Sequence from={0}>
				<Audio src={whooshSfxUrl} volume={0.8} />
			</Sequence>
			<Sequence from={235}>
				<Audio src={tadaSfxUrl} volume={1} />
			</Sequence>
		</AbsoluteFill>
	);
};