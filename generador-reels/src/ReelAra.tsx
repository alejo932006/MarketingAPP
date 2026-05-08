import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, Audio, staticFile, Sequence } from 'remotion';
import { z } from 'zod';
import { promoSchema } from './Composition';

// -----------------------------------------------------------------
// 🔵 FONDO DE IMPACTO (Azul Rey, Celeste y Amarillo)
// -----------------------------------------------------------------
const FondoImpacto = () => {
	const frame = useCurrentFrame();
	const mover1 = Math.sin(frame / 30) * 50;
	const mover2 = Math.cos(frame / 40) * 50;

	return (
		<AbsoluteFill style={{ backgroundColor: '#001F54', overflow: 'hidden' }}> {/* Azul Oscuro Profundo */}
			<div style={{
				position: 'absolute', top: '-10%', left: '-20%',
				width: '1200px', height: '1200px', borderRadius: '50%',
				backgroundColor: '#034078', // Azul más claro
				transform: `translate(${mover1}px, ${mover2}px)`,
			}} />
			<div style={{
				position: 'absolute', bottom: '-15%', right: '-20%',
				width: '1000px', height: '1000px', borderRadius: '50%',
				backgroundColor: '#FFC300', // Amarillo Surtitodo
				transform: `translate(${mover2}px, ${mover1}px)`,
				opacity: 0.8
			}} />
			{/* Textura de puntitos */}
			<div style={{
				position: 'absolute', width: '100%', height: '100%',
				backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 2px, transparent 2px)',
				backgroundSize: '30px 30px', zIndex: 0
			}} />
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🚀 ESCENA 1: INTRODUCCIÓN LLAMATIVA
// -----------------------------------------------------------------
const IntroEscena: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const animIntro = spring({ frame: frame - 5, fps, config: { damping: 10, mass: 1.2 } });
	const escalaIntro = interpolate(animIntro, [0, 1], [0, 1.2]);
	const rotacionIntro = interpolate(animIntro, [0, 1], [-15, 0]);

	const salida = spring({ frame: Math.max(0, frame - 45), fps, config: { damping: 12 } });
	const escalaSalida = interpolate(salida, [0, 1], [1, 6]); 
	const opacidadSalida = interpolate(salida, [0, 1], [1, 0]);

	return (
		<AbsoluteFill style={{ 
			justifyContent: 'center', alignItems: 'center', zIndex: 50,
			transform: `scale(${escalaSalida})`, opacity: opacidadSalida
		}}>
			<Img src={staticFile('icon.png')} style={{ 
				height: '400px', marginBottom: '30px', 
				transform: `scale(${escalaIntro})`, filter: 'drop-shadow(0 15px 20px rgba(0,0,0,0.4))'
			}} />
			<div style={{
				transform: `scale(${escalaIntro}) rotate(${rotacionIntro}deg)`,
				textAlign: 'center'
			}}>
				<div style={{
					fontSize: '150px', fontWeight: '900', color: '#FFFFFF', // Texto Blanco
					letterSpacing: '-5px', lineHeight: '0.9',
					WebkitTextStroke: '8px #E60000', textShadow: '10px 20px 0px rgba(0,0,0,0.6)' // Borde Rojo
				}}>
					¡OFERTA<br/>ESTRELLA!
				</div>
			</div>
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 💥 COMPONENTE ESTRELLA DESCUENTO
// -----------------------------------------------------------------
const EstrellaDescuento: React.FC<{ porcentaje: number, escala: number }> = ({ porcentaje, escala }) => {
	if (porcentaje <= 0) return null;
	const frame = useCurrentFrame();
	const rotacion = interpolate(frame, [0, 100], [0, 20]); 

	return (
		<div style={{
			position: 'absolute', top: '80px', right: '50px',
			transform: `scale(${escala}) rotate(${rotacion}deg)`, zIndex: 20,
			display: 'flex', justifyContent: 'center', alignItems: 'center'
		}}>
			<svg width="250" height="250" viewBox="0 0 100 100" style={{ position: 'absolute', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }}>
				{/* Estrella Roja con borde Blanco */}
				<path d="M50 0 L58 15 L74 11 L78 27 L94 28 L91 43 L100 56 L86 65 L90 81 L75 85 L71 100 L55 93 L40 100 L34 85 L18 81 L21 65 L6 56 L15 43 L10 28 L26 27 L30 11 L46 15 Z" fill="#E60000" stroke="#FFFFFF" strokeWidth="3"/>
			</svg>
			<div style={{ position: 'relative', textAlign: 'center', transform: `rotate(${-rotacion}deg)` }}>
				<div style={{ fontSize: '65px', fontWeight: '900', color: '#FFFFFF', lineHeight: '1', letterSpacing: '-2px' }}>
					-{porcentaje}%
				</div>
				<div style={{ fontSize: '25px', fontWeight: '900', color: '#FFC300', marginTop: '-5px' }}>
					DCTO.
				</div>
			</div>
		</div>
	);
};

// -----------------------------------------------------------------
// 🛒 ESCENA 2: EL PRODUCTO
// -----------------------------------------------------------------
const ProductoEscena: React.FC<{ producto: any, companyUrl: string }> = ({ producto, companyUrl }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const animImagen = spring({ frame: frame - 5, fps, config: { damping: 10, mass: 1.2 } });
	const escalaImagen = interpolate(animImagen, [0, 1], [0, 1.2]); 
	const moverImagenY = interpolate(animImagen, [0, 1], [500, 0]);

	const animEtiqueta = spring({ frame: frame - 10, fps, config: { damping: 12 } });
	const escalaEtiqueta = interpolate(animEtiqueta, [0, 1], [0, 1]);

	const animPrecio = spring({ frame: frame - 15, fps, config: { damping: 10, stiffness: 150 } });
	const escalaPrecio = interpolate(animPrecio, [0, 1], [0, 1]);
	const rotacionPrecio = interpolate(animPrecio, [0, 1], [-15, -5]); 

	const animEstrella = spring({ frame: frame - 25, fps, config: { damping: 8 } });

	return (
		<AbsoluteFill style={{ zIndex: 10 }}>
			<Img src={staticFile('icon.png')} style={{ 
				position: 'absolute', top: '40px', left: '40px', height: '400px', 
				objectFit: 'contain', zIndex: 10, filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.2))' 
			}} />

			<EstrellaDescuento porcentaje={producto.porcentaje} escala={animEstrella} />

			<div style={{
				display: 'flex', flexDirection: 'column', alignItems: 'center', 
				justifyContent: 'center', width: '100%', height: '100%', paddingTop: '80px'
			}}>
				<Img src={producto.imageUrl} style={{ 
					height: '600px', objectFit: 'contain', zIndex: 5,
					transform: `translateY(${moverImagenY}px) scale(${escalaImagen})`,
					filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.5))'
				}} />

				<div style={{
					backgroundColor: '#FFC300', // Etiqueta Amarilla
					color: '#111111', fontSize: '40px', fontWeight: '900',
					padding: '10px 40px', borderRadius: '50px', marginTop: '20px', zIndex: 6,
					transform: `scale(${escalaEtiqueta})`,
					boxShadow: '0 10px 20px rgba(0,0,0,0.4)', letterSpacing: '2px'
				}}>
					¡SÚPER PRECIO!
				</div>

				<div style={{
					marginTop: '-10px', zIndex: 7,
					transform: `scale(${escalaPrecio}) rotate(${rotacionPrecio}deg)`,
				}}>
					<div style={{
						fontSize: '220px', fontWeight: '900', color: '#FFFFFF', // Precio Blanco 
						letterSpacing: '-10px', lineHeight: '1',
						WebkitTextStroke: '8px #E60000', textShadow: '8px 15px 0px rgba(0,0,0,0.5)' // Borde Rojo
					}}>
						<span style={{ fontSize: '100px', WebkitTextStroke: '5px #E60000', marginRight: '10px' }}>$</span>
						{producto.precio}
					</div>
				</div>

				<div style={{
					backgroundColor: 'white', color: '#111', fontSize: '38px', fontWeight: '800',
					padding: '15px 50px', borderRadius: '15px', marginTop: '30px', zIndex: 6,
					transform: `scale(${escalaEtiqueta})`,
					boxShadow: '0 10px 20px rgba(0,0,0,0.3)', textAlign: 'center', maxWidth: '80%'
				}}>
					{producto.productName}
				</div>
			</div>

			<div style={{
				position: 'absolute', bottom: '0', left: '0', width: '100%',
				backgroundColor: '#E60000', padding: '25px 0', textAlign: 'center', zIndex: 10
			}}>
				<span style={{ color: 'white', fontSize: '35px', fontWeight: '800', letterSpacing: '3px' }}>
					COMPRA EN {companyUrl.toUpperCase()}
				</span>
			</div>
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🎬 COMPONENTE DIRECTOR
// -----------------------------------------------------------------
export const ReelAra: React.FC<z.infer<typeof promoSchema>> = ({ companyUrl, productos }) => {
	const producto = productos[0]; 
	if (!producto) return <AbsoluteFill style={{backgroundColor: 'red'}}>FALTA PRODUCTO</AbsoluteFill>;

	return (
		<AbsoluteFill style={{ fontFamily: 'sans-serif' }}>
			{/* 👇 AQUÍ LLAMAMOS A LA NUEVA PISTA DE IMPACTO 👇 */}
			<Audio src={staticFile('impacto-bg.mp3')} volume={0.6} />
			
			<FondoImpacto />
			
			<Sequence from={0} durationInFrames={60}>
				<IntroEscena />
			</Sequence>

			<Sequence from={50} durationInFrames={130}>
				<ProductoEscena producto={producto} companyUrl={companyUrl} />
			</Sequence>
		</AbsoluteFill>
	);
};