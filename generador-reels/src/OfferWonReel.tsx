import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	interpolate,
	interpolateColors,
	spring,
	useCurrentFrame,
	useVideoConfig,
	Img,
	Sequence,
} from 'remotion';

import { loadFont } from '@remotion/google-fonts/Poppins';
const { fontFamily: fontPoppins } = loadFont();

const colors = {
	red: '#ED1C24',
	redDark: '#B01018',
	yellow: '#FFF200',
	gold: '#FFD700',
	orange: '#F7941D',
	white: '#FFFFFF',
};

const TOTAL_FRAMES = 300;
const smoothOut = Easing.bezier(0.16, 1, 0.3, 1);

// Alturas deterministas para el waveform (Remotion no permite Math.random en render)
const WAVE_HEIGHTS = Array.from({ length: 30 }, (_, i) => 22 + ((i * 17 + 7) % 48));

// --- Fondo cinematográfico multicapa ---
const Background: React.FC = () => {
	const frame = useCurrentFrame();

	const stop1 = interpolateColors(frame, [0, 150, 300], [colors.redDark, '#8B0000', colors.red]);
	const stop2 = interpolateColors(frame, [0, 150, 300], [colors.red, colors.orange, colors.redDark]);
	const stop3 = interpolateColors(frame, [0, 150, 300], [colors.orange, colors.red, '#6B0F1A']);

	const pulse = interpolate(Math.sin(frame / 25), [-1, 1], [0.85, 1.15]);

	return (
		<AbsoluteFill>
			<svg width="100%" height="100%">
				<defs>
					<linearGradient id="bgMain" x1="0" y1="0" x2="0.3" y2="1">
						<stop offset="0%" stopColor={stop1} />
						<stop offset="55%" stopColor={stop2} />
						<stop offset="100%" stopColor={stop3} />
					</linearGradient>
					<radialGradient id="bgGlow" cx="50%" cy="35%" r="55%">
						<stop offset="0%" stopColor="rgba(255,242,0,0.35)" />
						<stop offset="100%" stopColor="rgba(255,242,0,0)" />
					</radialGradient>
				</defs>
				<rect width="100%" height="100%" fill="url(#bgMain)" />
				<rect width="100%" height="100%" fill="url(#bgGlow)" style={{ transform: `scale(${pulse})`, transformOrigin: '50% 35%' }} />
			</svg>
		</AbsoluteFill>
	);
};

const LightRays: React.FC = () => {
	const frame = useCurrentFrame();
	const rotation = frame * 0.4;
	const opacity = interpolate(frame, [0, 40, 260, 300], [0, 0.25, 0.25, 0], { extrapolateRight: 'clamp' });

	return (
		<AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
			<div
				style={{
					position: 'absolute',
					top: '28%',
					left: '50%',
					width: 900,
					height: 900,
					transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
				}}
			>
				{Array.from({ length: 8 }).map((_, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							top: '50%',
							left: '50%',
							width: 4,
							height: 450,
							background: `linear-gradient(to bottom, rgba(255,242,0,0.5), transparent)`,
							transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
							transformOrigin: '50% 100%',
						}}
					/>
				))}
			</div>
		</AbsoluteFill>
	);
};

const Vignette: React.FC = () => (
	<AbsoluteFill
		style={{
			background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
			pointerEvents: 'none',
		}}
	/>
);

const Confetti: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 25, 270, 300], [0, 1, 1, 0], { extrapolateRight: 'clamp' });

	const pieces = Array.from({ length: 40 }).map((_, i) => {
		const seed = i * 137.508;
		const startX = (seed * 3.7) % 100;
		const size = 8 + (i % 5) * 6;
		const speed = 0.35 + (i % 7) * 0.08;
		const wobble = Math.sin((frame + i * 12) / 18) * 12;
		const yPos = interpolate(frame, [0, TOTAL_FRAMES], [105 + (i % 10) * 3, -15 - (i % 8) * 2]) * speed + (i % 5) * 8;
		const rotation = frame * (i % 2 === 0 ? 2.5 : -2) + i * 30;
		const palette = [colors.yellow, colors.gold, colors.white, colors.orange, '#FF6B6B'];
		const color = palette[i % palette.length];
		const shapes = ['50%', '4px', '0'];
		const radius = shapes[i % 3];

		return { startX, size, wobble, yPos, rotation, color, radius };
	});

	return (
		<AbsoluteFill style={{ opacity: opacity * 0.85, overflow: 'hidden' }}>
			{pieces.map((p, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						width: p.size,
						height: p.size * (i % 3 === 0 ? 1.6 : 1),
						left: `calc(${p.startX}% + ${p.wobble}px)`,
						top: `${p.yPos % 120}%`,
						backgroundColor: p.color,
						borderRadius: p.radius,
						transform: `rotate(${p.rotation}deg)`,
						boxShadow: i % 4 === 0 ? `0 0 8px ${p.color}` : undefined,
					}}
				/>
			))}
		</AbsoluteFill>
	);
};

const Sparkles: React.FC = () => {
	const frame = useCurrentFrame();
	const positions = [
		{ x: 12, y: 18 }, { x: 88, y: 22 }, { x: 8, y: 55 }, { x: 92, y: 48 },
		{ x: 18, y: 78 }, { x: 82, y: 72 }, { x: 50, y: 12 }, { x: 45, y: 88 },
	];

	return (
		<AbsoluteFill style={{ pointerEvents: 'none' }}>
			{positions.map((pos, i) => {
				const twinkle = interpolate(
					Math.sin((frame + i * 20) / 12),
					[-1, 1],
					[0.2, 1]
				);
				const scale = interpolate(
					Math.sin((frame + i * 15) / 10),
					[-1, 1],
					[0.6, 1.2]
				);

				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: `${pos.x}%`,
							top: `${pos.y}%`,
							width: 6,
							height: 6,
							backgroundColor: colors.gold,
							borderRadius: '50%',
							opacity: twinkle * interpolate(frame, [0, 30, 270, 300], [0, 1, 1, 0], { extrapolateRight: 'clamp' }),
							transform: `scale(${scale})`,
							boxShadow: `0 0 12px ${colors.yellow}, 0 0 24px rgba(255,242,0,0.4)`,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// --- Título con shimmer y entrada premium ---
const ProfessionalWinnerTitle: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const text = '¡GANADOR!';
	const shimmerPos = interpolate(frame, [30, 90], [-120, 220], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], { easing: smoothOut, extrapolateRight: 'clamp' });
	const subtitleY = interpolate(frame, [25, 45], [20, 0], { easing: smoothOut, extrapolateRight: 'clamp' });

	return (
		<div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: -15, zIndex: 10 }}>
			{/* Badge superior */}
			<div
				style={{
					opacity: subtitleOpacity,
					transform: `translateY(${subtitleY}px)`,
					background: 'linear-gradient(135deg, rgba(255,242,0,0.95), rgba(247,148,29,0.95))',
					padding: '8px 28px',
					borderRadius: 50,
					marginBottom: 12,
					boxShadow: '0 4px 20px rgba(255,242,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
					border: '2px solid rgba(255,255,255,0.3)',
				}}
			>
				<span style={{ fontFamily: fontPoppins, fontWeight: 800, fontSize: 18, color: colors.redDark, letterSpacing: 3, textTransform: 'uppercase' }}>
					🏆 Felicitaciones
				</span>
			</div>

			<div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
				{/* Resplandor detrás del texto */}
				<div
					style={{
						position: 'absolute',
						inset: -20,
						background: 'radial-gradient(ellipse, rgba(255,242,0,0.35) 0%, transparent 70%)',
						filter: 'blur(20px)',
						opacity: interpolate(frame, [15, 40], [0, 1], { extrapolateRight: 'clamp' }),
					}}
				/>

				{text.split('').map((letter, i) => {
					const delay = i * 2;
					const letterSpring = spring({
						fps,
						frame: frame - delay,
						config: { damping: 11, mass: 0.7, stiffness: 160 },
					});

					const letterStyle: React.CSSProperties = {
						fontFamily: fontPoppins,
						fontWeight: 900,
						fontSize: 96,
						letterSpacing: '3px',
						textTransform: 'uppercase',
						display: 'inline-block',
						position: 'relative',
						opacity: letterSpring,
						transform: `scale(${interpolate(letterSpring, [0, 1], [0.3, 1])}) translateY(${interpolate(letterSpring, [0, 1], [60, 0])}px)`,
						background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFACD 35%, #FFF200 60%, #F7941D 100%)',
						WebkitBackgroundClip: 'text',
						color: 'transparent',
						filter: `
							drop-shadow(0px 3px 0px rgba(0,0,0,0.9))
							drop-shadow(0px 6px 0px rgba(0,0,0,0.6))
							drop-shadow(0px 0px 20px rgba(255,242,0,0.6))
						`,
					};

					return (
						<span key={i} style={letterStyle}>
							{letter === ' ' ? '\u00A0' : letter}
						</span>
					);
				})}

				{/* Shimmer sweep */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: `${shimmerPos}%`,
						width: 80,
						height: '100%',
						background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
						transform: 'skewX(-20deg)',
						opacity: frame > 30 && frame < 90 ? 0.6 : 0,
						pointerEvents: 'none',
					}}
				/>
			</div>
		</div>
	);
};

// Anillo rotatorio alrededor de la foto
const PhotoRing: React.FC<{ frame: number }> = ({ frame }) => {
	const rotation = frame * 1.2;
	const pulse = interpolate(Math.sin(frame / 20), [-1, 1], [0.6, 1]);

	return (
		<div
			style={{
				position: 'absolute',
				inset: -14,
				borderRadius: '50%',
				border: `3px dashed rgba(255,242,0,${pulse})`,
				transform: `rotate(${rotation}deg)`,
				boxShadow: `0 0 30px rgba(255,242,0,${pulse * 0.5})`,
			}}
		/>
	);
};

// --- Tarjeta del cliente ---
const ClientCard: React.FC<{ name: string; address: string; imageUrl: string; prizeText: string }> = ({
	name,
	address,
	imageUrl,
	prizeText,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const cardSpring = spring({ fps, frame: frame - 5, config: { damping: 14, stiffness: 90 } });
	const floatY = Math.sin(frame / 18) * 8;
	const borderPulse = interpolateColors(frame % 50, [0, 25, 50], ['rgba(255,242,0,0.5)', 'rgba(255,215,0,1)', 'rgba(255,242,0,0.5)']);
	const fadeOutOpacity = interpolate(frame, [230, 250], [1, 0], { extrapolateRight: 'clamp' });
	const scaleOut = interpolate(frame, [230, 250], [1, 0.92], { extrapolateRight: 'clamp' });
	const prizeShimmer = interpolate(frame, [40, 100], [-100, 200], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<AbsoluteFill
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				opacity: fadeOutOpacity * cardSpring,
				transform: `scale(${scaleOut * interpolate(cardSpring, [0, 1], [0.85, 1])}) translateY(${floatY}px)`,
			}}
		>
			<ProfessionalWinnerTitle />

			{/* Foto con anillos */}
			<div style={{ position: 'relative', margin: '30px 0', zIndex: 5 }}>
				<PhotoRing frame={frame} />
				<div
					style={{
						position: 'absolute',
						inset: -8,
						borderRadius: '50%',
						background: `conic-gradient(from ${frame * 2}deg, ${colors.yellow}, ${colors.orange}, ${colors.red}, ${colors.yellow})`,
						opacity: 0.9,
					}}
				/>
				<div
					style={{
						position: 'relative',
						width: 480,
						height: 480,
						borderRadius: '50%',
						border: `6px solid ${colors.white}`,
						boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 80px ${borderPulse}, inset 0 0 30px rgba(255,242,0,0.15)`,
						overflow: 'hidden',
						backgroundColor: 'white',
					}}
				>
					<Img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
					<div
						style={{
							position: 'absolute',
							inset: 0,
							background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
							pointerEvents: 'none',
						}}
					/>
				</div>
			</div>

			{/* Panel glassmorphism */}
			<div
				style={{
					textAlign: 'center',
					zIndex: 10,
					background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(30,0,0,0.45) 100%)',
					padding: '22px 44px 26px',
					borderRadius: 28,
					backdropFilter: 'blur(12px)',
					border: '1px solid rgba(255,255,255,0.15)',
					boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					maxWidth: 900,
				}}
			>
				<p
					style={{
						fontFamily: fontPoppins,
						fontWeight: 800,
						fontSize: 48,
						margin: 0,
						background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 100%)',
						WebkitBackgroundClip: 'text',
						color: 'transparent',
						textShadow: 'none',
						filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
						letterSpacing: '0.5px',
					}}
				>
					{name}
				</p>

				<div
					style={{
						position: 'relative',
						overflow: 'hidden',
						background: `linear-gradient(135deg, ${colors.yellow} 0%, ${colors.gold} 50%, ${colors.orange} 100%)`,
						padding: '10px 28px',
						borderRadius: 40,
						marginTop: 14,
						marginBottom: 12,
						boxShadow: '0 8px 25px rgba(255,242,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
						border: '2px solid rgba(255,255,255,0.25)',
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: `${prizeShimmer}%`,
							width: 60,
							height: '100%',
							background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
							transform: 'skewX(-15deg)',
						}}
					/>
					<p
						style={{
							fontFamily: fontPoppins,
							fontWeight: 900,
							fontSize: 26,
							color: colors.redDark,
							margin: 0,
							textTransform: 'uppercase',
							letterSpacing: 1.5,
							position: 'relative',
						}}
					>
						🛒 {prizeText}
					</p>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
					<span style={{ fontSize: 22 }}>📍</span>
					<p
						style={{
							fontFamily: fontPoppins,
							fontWeight: 500,
							fontSize: 26,
							color: 'rgba(255,255,255,0.9)',
							margin: 0,
							letterSpacing: 0.3,
						}}
					>
						{address}
					</p>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// --- Cierre con logo ---
const LogoCrossover: React.FC<{ logoUrl: string }> = ({ logoUrl }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const entryFrame = 235;
	const entrySpring = spring({
		frame: frame - entryFrame,
		fps,
		config: { damping: 10, mass: 1, stiffness: 120 },
	});

	const rotate = interpolate(entrySpring, [0, 1], [-15, 0]);
	const scale = interpolate(entrySpring, [0, 1], [0.2, 1]);
	const opacity = interpolate(frame, [entryFrame, entryFrame + 15], [0, 1], { extrapolateRight: 'clamp' });
	const auraRotation = frame * 1.5;
	const glowPulse = interpolate(Math.sin(frame / 15), [-1, 1], [0.7, 1.1]);

	const textEntrySpring1 = spring({ frame: frame - (entryFrame + 15), fps, config: { damping: 12, stiffness: 100 } });
	const textEntrySpring2 = spring({ frame: frame - (entryFrame + 25), fps, config: { damping: 12, stiffness: 100 } });

	const professionalTextStyle: React.CSSProperties = {
		fontFamily: fontPoppins,
		fontWeight: 700,
		color: 'white',
		textAlign: 'center',
		margin: 0,
		filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6)) drop-shadow(0px 0px 12px rgba(255,242,0,0.25))',
	};

	return (
		<AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity }}>
			<div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				{/* Capas de aura */}
				{[420, 360, 300].map((size, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							width: size,
							height: size,
							borderRadius: '50%',
							background: `radial-gradient(circle, rgba(255,242,0,${0.35 - i * 0.08}) 0%, transparent 70%)`,
							transform: `scale(${entrySpring * glowPulse}) rotate(${auraRotation + i * 30}deg)`,
							zIndex: 1,
						}}
					/>
				))}

				<Img
					src={logoUrl}
					style={{
						height: 300,
						marginBottom: 40,
						transform: `scale(${scale}) rotate(${rotate}deg)`,
						zIndex: 2,
						filter: 'drop-shadow(0px 15px 30px rgba(0,0,0,0.6)) drop-shadow(0px 0px 40px rgba(255,242,0,0.3))',
					}}
				/>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 780, zIndex: 10 }}>
				<p
					style={{
						...professionalTextStyle,
						fontSize: 44,
						opacity: textEntrySpring1,
						transform: `translateY(${interpolate(textEntrySpring1, [0, 1], [35, 0])}px)`,
					}}
				>
					¡Surtitodo Ideal
				</p>
				<p
					style={{
						...professionalTextStyle,
						fontSize: 34,
						fontWeight: 600,
						background: `linear-gradient(90deg, ${colors.gold}, ${colors.yellow}, ${colors.orange})`,
						WebkitBackgroundClip: 'text',
						color: 'transparent',
						opacity: textEntrySpring2,
						transform: `translateY(${interpolate(textEntrySpring2, [0, 1], [35, 0])}px)`,
					}}
				>
					te acompaña en tu celebración! ✨
				</p>
			</div>
		</AbsoluteFill>
	);
};

// --- Visualizador de audio mejorado ---
const AudioWaveform: React.FC = () => {
	const frame = useCurrentFrame();
	const masterOpacity = interpolate(frame, [0, 20, 270, 300], [0, 0.55, 0.55, 0], { extrapolateRight: 'clamp' });

	return (
		<div
			style={{
				position: 'absolute',
				bottom: 50,
				left: 80,
				right: 80,
				height: 90,
				display: 'flex',
				alignItems: 'flex-end',
				justifyContent: 'center',
				gap: 6,
				opacity: masterOpacity,
			}}
		>
			{WAVE_HEIGHTS.map((baseHeight, i) => {
				const height = interpolate(
					(frame + i * 3) % 40,
					[0, 20, 40],
					[12, baseHeight, 12],
					{ extrapolateRight: 'clamp' }
				);
				const barOpacity = interpolate(height, [12, 60], [0.4, 1]);

				return (
					<div
						key={i}
						style={{
							width: 10,
							borderRadius: 5,
							height,
							background: `linear-gradient(to top, ${colors.orange}, ${colors.yellow})`,
							opacity: barOpacity,
							boxShadow: `0 0 8px rgba(255,242,0,${barOpacity * 0.4})`,
						}}
					/>
				);
			})}
		</div>
	);
};

// --- Composición principal ---
export const OfferWonReel: React.FC<{
	clientName: string;
	propertyAddress: string;
	clientImageUrl: string;
	logoImageUrl: string;
	prizeText?: string;
}> = ({
	clientName,
	propertyAddress,
	clientImageUrl,
	logoImageUrl,
	prizeText = 'Supermercado Surtitodo Ideal',
}) => {
	const celebrationAudioUrl = 'http://localhost:4000/celebration_track.mp3';
	const whooshSfxUrl = 'http://localhost:4000/whoosh.mp3';
	const tadaSfxUrl = 'http://localhost:4000/tada.mp3';

	return (
		<AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
			<Background />
			<LightRays />
			<Confetti />
			<Sparkles />
			<Vignette />

			<ClientCard name={clientName} address={propertyAddress} imageUrl={clientImageUrl} prizeText={prizeText} />

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
