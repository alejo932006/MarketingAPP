import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Img,
	Sequence,
	interpolate,
	interpolateColors,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Montserrat';
import { z } from 'zod';

const { fontFamily } = loadFont('normal', {
	weights: ['400', '700', '800', '900'],
	subsets: ['latin'],
});

// --- Paleta Colombia + Surtitodo ---
const COLORS = {
	yellow: '#FFCD00',
	blue: '#003087',
	red: '#C8102E',
	dark: '#111111',
	white: '#FFFFFF',
} as const;

const smoothOut = Easing.bezier(0.16, 1, 0.3, 1);

export const electoralReelSchema = z.object({
	discountPercent: z.number(),
	validDateText: z.string(),
	logoFileName: z.string(),
	backgroundImageUrl: z.string(),
	companyUrl: z.string(),
});

export type ElectoralReelProps = z.infer<typeof electoralReelSchema>;

const MAIN_DURATION_SEC = 14;
const OUTRO_DURATION_SEC = 6;

// --- Fondo con Ken Burns + overlay patriótico animado ---
const ElectoralBackground: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	const kenBurnsScale = interpolate(frame, [0, durationInFrames], [1.08, 1.22]);
	const kenBurnsX = interpolate(frame, [0, durationInFrames], [0, -30]);
	const kenBurnsY = interpolate(frame, [0, durationInFrames], [0, -20]);
	const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
		easing: smoothOut,
		extrapolateRight: 'clamp',
	});

	const gradientShift = interpolateColors(
		frame,
		[0, durationInFrames / 2, durationInFrames],
		[
			`rgba(255, 205, 0, 0.82)`,
			`rgba(0, 48, 135, 0.78)`,
			`rgba(200, 16, 46, 0.82)`,
		],
	);

	return (
		<AbsoluteFill style={{ opacity: bgOpacity, overflow: 'hidden' }}>
			<Img
				src={imageUrl}
				style={{
					position: 'absolute',
					width: '120%',
					height: '120%',
					left: '50%',
					top: '50%',
					objectFit: 'cover',
					transform: `translate(calc(-50% + ${kenBurnsX}px), calc(-50% + ${kenBurnsY}px)) scale(${kenBurnsScale})`,
				}}
			/>
			<AbsoluteFill
				style={{
					background: `linear-gradient(145deg, ${gradientShift} 0%, rgba(0, 0, 0, 0.55) 100%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

// --- Franjas tricolores superiores e inferiores ---
const FlagStripes: React.FC = () => {
	const frame = useCurrentFrame();
	const slideIn = interpolate(frame, [0, 20], [-100, 0], {
		easing: smoothOut,
		extrapolateRight: 'clamp',
	});

	const stripeStyle = (color: string, height: number): React.CSSProperties => ({
		height,
		backgroundColor: color,
		transform: `translateY(${slideIn}px)`,
	});

	return (
		<>
			<div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
				<div style={stripeStyle(COLORS.yellow, 8)} />
				<div style={stripeStyle(COLORS.blue, 8)} />
				<div style={stripeStyle(COLORS.red, 8)} />
			</div>
			<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3 }}>
				<div style={stripeStyle(COLORS.red, 6)} />
				<div style={stripeStyle(COLORS.blue, 6)} />
				<div style={stripeStyle(COLORS.yellow, 6)} />
			</div>
		</>
	);
};

// --- Partículas flotantes (papeles de votación estilizados) ---
const FloatingBallots: React.FC = () => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	return (
		<AbsoluteFill style={{ zIndex: 1, pointerEvents: 'none' }}>
			{Array.from({ length: 12 }).map((_, i) => {
				const size = 18 + (i % 4) * 8;
				const startX = 5 + (i * 8.5);
				const drift = Math.sin((frame + i * 25) / 18) * 12;
				const yPos =
					interpolate(frame, [0, durationInFrames], [105, -15]) -
					i * 4 +
					Math.sin(frame / 20 + i) * 6;
				const rotation = frame * (i % 2 === 0 ? 0.8 : -0.6) + i * 30;
				const opacity = interpolate(
					frame,
					[5, 25, durationInFrames - 30, durationInFrames],
					[0, 0.35, 0.35, 0],
					{ extrapolateRight: 'clamp' },
				);

				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: `${startX + drift * 0.15}%`,
							top: `${yPos}%`,
							width: size,
							height: size * 1.3,
							backgroundColor: i % 3 === 0 ? COLORS.yellow : 'rgba(255,255,255,0.85)',
							borderRadius: 3,
							border: `1px solid rgba(0,0,0,0.08)`,
							transform: `rotate(${rotation}deg)`,
							opacity,
							boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// --- Logo con halo pulsante ---
const BrandLogo: React.FC<{ logoFileName: string }> = ({ logoFileName }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const entry = spring({
		frame,
		fps,
		config: { damping: 12, stiffness: 110, mass: 0.7 },
		delay: Math.round(0.15 * fps),
	});

	const scale = interpolate(entry, [0, 1], [0, 1]);
	const haloPulse = 1 + Math.sin(frame / 10) * 0.06;
	const haloOpacity = interpolate(entry, [0, 1], [0, 0.5]) * (0.7 + Math.sin(frame / 12) * 0.3);

	return (
		<div
			style={{
				position: 'relative',
				marginBottom: 40,
				transform: `scale(${scale})`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: -20,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${COLORS.yellow}88 0%, transparent 70%)`,
					transform: `scale(${haloPulse})`,
					opacity: haloOpacity,
				}}
			/>
			<div
				style={{
					backgroundColor: 'rgba(255, 255, 255, 0.97)',
					borderRadius: '50%',
					padding: 22,
					width: 260,
					height: 260,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 0 0 4px rgba(255,205,0,0.3)',
				}}
			>
				<Img
					src={staticFile(logoFileName)}
					style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
				/>
			</div>
		</div>
	);
};

// --- Texto con reveal enmascarado ---
const MaskedReveal: React.FC<{
	children: React.ReactNode;
	delayFrames: number;
	style?: React.CSSProperties;
}> = ({ children, delayFrames, style }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const progress = spring({
		frame: frame - delayFrames,
		fps,
		config: { damping: 14, stiffness: 120 },
	});

	const translateY = interpolate(progress, [0, 1], [80, 0]);
	const opacity = interpolate(progress, [0, 1], [0, 1]);

	return (
		<div style={{ overflow: 'hidden', ...style }}>
			<div style={{ transform: `translateY(${translateY}px)`, opacity }}>{children}</div>
		</div>
	);
};

// --- Titular letra por letra ---
const KineticHeadline: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const lines = ['¡TU VOTO TIENE', 'RECOMPENSA!'];

	return (
		<div style={{ marginBottom: 8 }}>
			{lines.map((line, lineIndex) => (
				<div
					key={lineIndex}
					style={{
						display: 'flex',
						justifyContent: 'center',
						flexWrap: 'wrap',
						overflow: 'hidden',
						lineHeight: 1.05,
					}}
				>
					{line.split('').map((char, i) => {
						const delay = Math.round(0.5 * fps) + lineIndex * 8 + i * 2;
						const letterSpring = spring({
							frame: frame - delay,
							fps,
							config: { damping: 11, stiffness: 140, mass: 0.6 },
						});

						return (
							<span
								key={`${lineIndex}-${i}`}
								style={{
									fontFamily,
									fontSize: lineIndex === 0 ? 88 : 96,
									fontWeight: 900,
									textTransform: 'uppercase',
									color: COLORS.white,
									display: 'inline-block',
									opacity: letterSpring,
									transform: `translateY(${interpolate(letterSpring, [0, 1], [60, 0])}px) scale(${interpolate(letterSpring, [0, 1], [0.6, 1])})`,
									textShadow: '3px 5px 24px rgba(0,0,0,0.55)',
									letterSpacing: char === ' ' ? '0.3em' : '-1px',
								}}
							>
								{char === ' ' ? '\u00A0' : char}
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};

// --- Badge de descuento con shimmer ---
const DiscountBadge: React.FC<{ percent: number }> = ({ percent }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const delayFrames = Math.round(1.2 * fps);
	const entry = spring({
		frame: frame - delayFrames,
		fps,
		config: { damping: 9, stiffness: 130 },
	});

	const scale = interpolate(entry, [0, 1], [0, 1]);
	const pulseActive = frame > delayFrames + 18;
	const pulse = pulseActive ? 1 + Math.sin(frame / 7) * 0.04 : 1;

	const shimmerPos = interpolate(frame, [delayFrames + 20, delayFrames + 55], [-120, 220], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'relative',
				backgroundColor: COLORS.white,
				color: COLORS.red,
				padding: '28px 80px',
				borderRadius: 80,
				boxShadow: '0 24px 60px rgba(0,0,0,0.38)',
				margin: '16px 0 36px',
				transform: `scale(${scale * pulse})`,
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: `linear-gradient(105deg, transparent ${shimmerPos - 30}%, rgba(255,205,0,0.45) ${shimmerPos}%, transparent ${shimmerPos + 30}%)`,
					pointerEvents: 'none',
				}}
			/>
			<div
				style={{
					fontFamily,
					fontSize: 140,
					fontWeight: 900,
					lineHeight: 1,
					margin: 0,
					letterSpacing: -4,
					position: 'relative',
				}}
			>
				{percent}%
			</div>
			<div
				style={{
					fontFamily,
					fontSize: 34,
					fontWeight: 800,
					letterSpacing: 5,
					marginTop: -4,
					position: 'relative',
				}}
			>
				DE DESCUENTO
			</div>
		</div>
	);
};

// --- Banner de validez ---
const ValidityBanner: React.FC<{ text: string }> = ({ text }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const delayFrames = Math.round(1.6 * fps);
	const entry = spring({
		frame: frame - delayFrames,
		fps,
		config: { damping: 14, stiffness: 100 },
	});

	return (
		<div
			style={{
				fontFamily,
				fontSize: 28,
				fontWeight: 800,
				backgroundColor: COLORS.yellow,
				color: COLORS.dark,
				padding: '18px 48px',
				borderRadius: 14,
				textTransform: 'uppercase',
				letterSpacing: 1.2,
				boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
				transform: `translateY(${interpolate(entry, [0, 1], [40, 0])}px) scale(${interpolate(entry, [0, 1], [0.85, 1])})`,
				opacity: entry,
				maxWidth: '92%',
				textAlign: 'center',
				lineHeight: 1.3,
			}}
		>
			{text}
		</div>
	);
};

// --- Pie de marca (solo escena principal) ---
const BrandFooter: React.FC<{ companyUrl: string }> = ({ companyUrl }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const delayFrames = Math.round(2 * fps);
	const opacity = interpolate(frame, [delayFrames, delayFrames + 15], [0, 1], {
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'absolute',
				bottom: 36,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				opacity,
				zIndex: 4,
			}}
		>
			<div
				style={{
					fontFamily,
					fontSize: 22,
					fontWeight: 700,
					color: COLORS.white,
					backgroundColor: 'rgba(0,0,0,0.45)',
					padding: '10px 28px',
					borderRadius: 30,
					letterSpacing: 1,
					backdropFilter: 'blur(6px)',
					border: '1px solid rgba(255,255,255,0.15)',
				}}
			>
				🗳️ {companyUrl}
			</div>
		</div>
	);
};

// --- Fondo del cierre ---
const OutroBackground: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const outroFrames = Math.round(OUTRO_DURATION_SEC * fps);

	const colorA = interpolateColors(
		frame,
		[0, outroFrames / 2, outroFrames],
		[COLORS.blue, COLORS.red, COLORS.yellow],
	);
	const colorB = interpolateColors(
		frame,
		[0, outroFrames / 2, outroFrames],
		[COLORS.red, COLORS.yellow, COLORS.blue],
	);
	const sweep = interpolate(frame, [0, outroFrames], [0, 360]);

	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.dark }}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at 50% 40%, ${colorA}55 0%, ${COLORS.dark} 65%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background: `conic-gradient(from ${sweep}deg at 50% 50%, transparent 0deg, ${colorB}33 60deg, transparent 120deg, ${COLORS.yellow}22 180deg, transparent 240deg)`,
					opacity: 0.7,
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

// --- Partículas del cierre ---
const OutroConfetti: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	return (
		<AbsoluteFill style={{ pointerEvents: 'none' }}>
			{Array.from({ length: 20 }).map((_, i) => {
				const colors = [COLORS.yellow, COLORS.red, COLORS.white, COLORS.blue];
				const delay = i * 3;
				const progress = spring({
					frame: frame - delay,
					fps,
					config: { damping: 14, stiffness: 80 },
				});
				const x = 10 + (i * 4.5) + Math.sin(frame / 12 + i) * 3;
				const y = interpolate(progress, [0, 1], [60, 15 + (i % 5) * 8]);
				const rotation = frame * (i % 2 === 0 ? 2 : -1.5) + i * 20;

				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: `${x}%`,
							top: `${y}%`,
							width: 10 + (i % 3) * 6,
							height: 10 + (i % 3) * 6,
							backgroundColor: colors[i % colors.length],
							borderRadius: i % 2 === 0 ? '50%' : 2,
							transform: `rotate(${rotation}deg) scale(${progress})`,
							opacity: progress * 0.85,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// --- Cierre premium ---
const ElectoralOutro: React.FC<{ companyUrl: string }> = ({ companyUrl }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const logoSpring = spring({
		frame,
		fps,
		config: { damping: 10, stiffness: 120, mass: 0.9 },
		delay: 5,
	});
	const logoScale = interpolate(logoSpring, [0, 1], [0.25, 1]);
	const logoRotate = interpolate(logoSpring, [0, 1], [-18, 0]);
	const auraRotation = frame * 2.5;
	const glowPulse = 1 + Math.sin(frame / 8) * 0.08;

	const text1Spring = spring({
		frame: frame - 18,
		fps,
		config: { damping: 12, stiffness: 110 },
	});
	const text2Spring = spring({
		frame: frame - 28,
		fps,
		config: { damping: 12, stiffness: 110 },
	});
	const ctaSpring = spring({
		frame: frame - 40,
		fps,
		config: { damping: 11, stiffness: 130 },
	});

	const glowSize = 25 + Math.sin(frame / 10) * 15;

	const textShadow = `
		drop-shadow(0 4px 8px rgba(0,0,0,0.6))
		drop-shadow(0 0 12px rgba(255,205,0,0.25))
	`;

	return (
		<AbsoluteFill style={{ zIndex: 5 }}>
			<OutroBackground />
			<OutroConfetti />
			<FlagStripes />

			<AbsoluteFill
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '0 48px',
				}}
			>
				{/* Logo con aura dorada */}
				<div
					style={{
						position: 'relative',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						marginBottom: 48,
					}}
				>
					<div
						style={{
							position: 'absolute',
							width: 420,
							height: 420,
							borderRadius: '50%',
							background: `radial-gradient(circle, ${COLORS.yellow}99 0%, transparent 68%)`,
							transform: `scale(${logoSpring * glowPulse}) rotate(${auraRotation}deg)`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							width: 340,
							height: 340,
							borderRadius: '50%',
							border: `3px solid ${COLORS.yellow}55`,
							transform: `scale(${logoSpring}) rotate(${-auraRotation * 0.5}deg)`,
						}}
					/>
					<Img
						src={staticFile('logo2.png')}
						style={{
							height: 280,
							position: 'relative',
							zIndex: 2,
							transform: `scale(${logoScale}) rotate(${logoRotate}deg)`,
							filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.55))',
						}}
					/>
				</div>

				{/* Mensaje de cierre */}
				<p
					style={{
						fontFamily,
						fontSize: 44,
						fontWeight: 700,
						color: COLORS.white,
						margin: 0,
						textAlign: 'center',
						opacity: text1Spring,
						transform: `translateY(${interpolate(text1Spring, [0, 1], [40, 0])}px)`,
						filter: textShadow,
					}}
				>
					¡Gracias por ejercer
				</p>
				<p
					style={{
						fontFamily,
						fontSize: 56,
						fontWeight: 900,
						color: COLORS.yellow,
						margin: '8px 0 36px',
						textAlign: 'center',
						textTransform: 'uppercase',
						opacity: text2Spring,
						transform: `translateY(${interpolate(text2Spring, [0, 1], [50, 0])}px) scale(${interpolate(text2Spring, [0, 1], [0.9, 1])})`,
						filter: textShadow,
						letterSpacing: 1,
					}}
				>
					tu derecho al voto!
				</p>

				{/* CTA */}
				<div
					style={{
						opacity: ctaSpring,
						transform: `scale(${interpolate(ctaSpring, [0, 1], [0.7, 1])}) translateY(${interpolate(ctaSpring, [0, 1], [30, 0])}px)`,
					}}
				>
					<div
						style={{
							backgroundColor: COLORS.red,
							padding: '28px 64px',
							borderRadius: 100,
							border: '3px solid rgba(255,255,255,0.25)',
							boxShadow: `0 20px 50px rgba(200,16,46,0.55), 0 0 ${glowSize}px rgba(255,205,0,0.35)`,
							transform: `scale(${1 + Math.sin(frame / 12) * 0.02})`,
						}}
					>
						<span
							style={{
								fontFamily,
								fontSize: 42,
								fontWeight: 900,
								color: COLORS.white,
								letterSpacing: 1,
							}}
						>
							🗳️ {companyUrl}
						</span>
					</div>
					<p
						style={{
							fontFamily,
							fontSize: 24,
							fontWeight: 600,
							color: 'rgba(255,255,255,0.75)',
							margin: '20px 0 0',
							textAlign: 'center',
						}}
					>
						Te esperamos en nuestras tiendas
					</p>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// --- Escena principal con fade-out ---
const MainScene: React.FC<ElectoralReelProps> = ({
	discountPercent,
	validDateText,
	logoFileName,
	backgroundImageUrl,
	companyUrl,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const mainDuration = Math.round(MAIN_DURATION_SEC * fps);
	const subtitleDelay = Math.round(0.85 * fps);

	const sceneOpacity = interpolate(
		frame,
		[mainDuration - 25, mainDuration - 1],
		[1, 0],
		{ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
	);
	const sceneScale = interpolate(
		frame,
		[mainDuration - 25, mainDuration - 1],
		[1, 0.94],
		{ extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
	);

	return (
		<AbsoluteFill
			style={{
				opacity: sceneOpacity,
				transform: `scale(${sceneScale})`,
			}}
		>
			<ElectoralBackground imageUrl={backgroundImageUrl} />
			<FloatingBallots />
			<FlagStripes />

			<AbsoluteFill
				style={{
					zIndex: 2,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					textAlign: 'center',
					color: COLORS.white,
					padding: '80px 48px 100px',
				}}
			>
				<BrandLogo logoFileName={logoFileName} />
				<KineticHeadline />

				<MaskedReveal delayFrames={subtitleDelay} style={{ maxWidth: '92%', marginTop: 28 }}>
					<p
						style={{
							fontFamily,
							fontSize: 38,
							fontWeight: 400,
							margin: 0,
							lineHeight: 1.45,
							textShadow: '2px 4px 14px rgba(0,0,0,0.55)',
						}}
					>
						Si ejerciste el derecho al voto, presenta tu{' '}
						<strong style={{ color: COLORS.yellow, fontWeight: 800 }}>
							certificado electoral
						</strong>{' '}
						en caja y obtendrás:
					</p>
				</MaskedReveal>

				<DiscountBadge percent={discountPercent} />
				<ValidityBanner text={validDateText} />
			</AbsoluteFill>

			<BrandFooter companyUrl={companyUrl} />
		</AbsoluteFill>
	);
};

// --- Composición principal ---
export const ElectoralReel: React.FC<ElectoralReelProps> = (props) => {
	const { fps } = useVideoConfig();

	const mainDuration = Math.round(MAIN_DURATION_SEC * fps);
	const outroDuration = Math.round(OUTRO_DURATION_SEC * fps);
	const outroStart = mainDuration;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.dark,
				fontFamily,
				overflow: 'hidden',
			}}
		>
			<Sequence durationInFrames={mainDuration}>
				<MainScene {...props} />
			</Sequence>

			<Sequence from={outroStart} durationInFrames={outroDuration}>
				<ElectoralOutro companyUrl={props.companyUrl} />
			</Sequence>

			{/* Himno de Colombia — 2.24 s en bucle durante los 20 s del reel */}
			<Audio
				src={staticFile('himno.mp4')}
				volume={(f) =>
					interpolate(f, [0, fps * 0.4], [0, 0.42], { extrapolateRight: 'clamp' })
				}
				loop
			/>
		</AbsoluteFill>
	);
};
