import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, Series, Audio, staticFile, Sequence } from 'remotion';
import { z } from 'zod';

export const productoSchema = z.object({
	productName: z.string(),
	imageUrl: z.string().url(),
	precio: z.string(),
	precioAntes: z.string(), // <-- NUEVO
	porcentaje: z.number(),  // <-- NUEVO
});

export const promoSchema = z.object({
	companyUrl: z.string(),
	productos: z.array(productoSchema),
});

// -----------------------------------------------------------------
// 💡 ELEMENTO EXTRA: FORMAS DE FONDO FLOTANTES (Parallax)
// -----------------------------------------------------------------
const BackgroundShapes = () => {
	const frame = useCurrentFrame();
	
	// Rotación lenta y continua (360 grados cada 300 frames)
	const giro = interpolate(frame, [0, 300], [0, 360]);

	return (
		<AbsoluteFill style={{ overflow: 'hidden' }}>
			{/* Círculo Grande Superior Derecho */}
			<div style={{
				position: 'absolute', top: '-200px', right: '-150px',
				width: '800px', height: '800px', borderRadius: '50%',
				background: 'rgba(255, 195, 0, 0.04)', // Dorado ultra-suave
				transform: `rotate(${giro}deg)`,
			}} />
			
			{/* Hexágono Inferior Izquierdo (simplificado como cuadrado rotado) */}
			<div style={{
				position: 'absolute', bottom: '150px', left: '-200px',
				width: '600px', height: '600px', borderRadius: '100px',
				background: 'rgba(255, 255, 255, 0.03)', // Blanco ultra-suave
				transform: `rotate(${giro * -1}deg)`, // Gira al revés
			}} />
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🎬 COMPONENTE A: ESCENA INDIVIDUAL (1 Producto con Barra de Tiempo)
// -----------------------------------------------------------------
const ProductoIndividual: React.FC<z.infer<typeof productoSchema>> = ({ productName, imageUrl, precio, precioAntes, porcentaje }) => {
	const frame = useCurrentFrame();
	const { fps, width, durationInFrames } = useVideoConfig();

	// 1. Animación Base: Entrada de la Tarjeta Blanca
	const animacionTarjeta = spring({ frame, fps, config: { mass: 0.8, damping: 12, stiffness: 100 } });
	const moverTarjetaX = interpolate(animacionTarjeta, [0, 1], [width, 0]);
	
	// 2. Animación en Cascada: La imagen y el texto
	const delayContenido = 15;
	const animacionContenido = spring({ frame: Math.max(0, frame - delayContenido), fps, config: { damping: 10 } });
	const opacidadContenido = interpolate(animacionContenido, [0, 1], [0, 1]);
	const subirTexto = interpolate(animacionContenido, [0, 1], [40, 0]);
	const escalaImagen = interpolate(animacionContenido, [0, 1], [0.8, 1]);

	// 3. Animación del Precio
	const delayPrecio = 30;
	const animacionEntradaPrecio = spring({ frame: Math.max(0, frame - delayPrecio), fps, config: { damping: 8 } });
	const escalaPrecio = interpolate(animacionEntradaPrecio, [0, 1], [0, 1]);
	const pulsoPrecio = 1 + Math.sin(frame / 6) * 0.03;

	// 4. Animación explosiva para los Emojis
	const animacionEmojis = spring({ frame: Math.max(0, frame - delayPrecio - 5), fps, config: { damping: 6, stiffness: 120 } });
	const escalaEmoji = interpolate(animacionEmojis, [0, 1], [0, 1]);

	// Barra de Progreso Matemática
	const anchoProgreso = interpolate(frame, [0, durationInFrames], [0, 100]);

	return (
		<div style={{
			position: 'absolute', top: 400, left: 0, width: '100%',
			transform: `translateX(${moverTarjetaX}px)`,
			display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
		}}>
			<div style={{
				background: '#ffffff', padding: '60px 50px 70px 50px', borderRadius: '40px',
				boxShadow: '0 40px 80px rgba(0,0,0,0.15), 0 15px 35px rgba(0,0,0,0.1)',
				border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', 
				alignItems: 'center', width: '850px', position: 'relative', overflow: 'hidden'
			}}>
				
				{/* 🚀 LÓGICA INTELIGENTE: ETIQUETA DE DESCUENTO O DESTACADO */}
				<div style={{
					position: 'absolute', top: '30px', left: '30px',
					background: porcentaje > 0 ? '#E60000' : '#FFC300', // Rojo si hay descuento, Amarillo si no
					color: porcentaje > 0 ? 'white' : '#111',
					padding: '15px 25px',
					borderRadius: '20px', fontWeight: '900', fontSize: '35px',
					boxShadow: `0 10px 20px ${porcentaje > 0 ? 'rgba(230,0,0,0.3)' : 'rgba(255,195,0,0.3)'}`,
					transform: `scale(${escalaImagen}) rotate(-5deg)`, opacity: opacidadContenido, zIndex: 10
				}}>
					{porcentaje > 0 ? `-${porcentaje}% OFF` : '⭐ TOP'}
				</div>

				{/* 🚀 LOGO SURTITODO EXPRESS PARA PLANTILLA 1 */}
				<div style={{
					position: 'absolute', 
					top: '30px', 
					right: '30px', // Ubicado en la esquina opuesta al descuento
					transform: `scale(${escalaImagen})`, // Sigue la misma animación de entrada
					opacity: opacidadContenido,
					zIndex: 10
				}}>
					<Img 
						src={staticFile('logo2.png')} 
						style={{ 
							height: '150px', // Tamaño equilibrado para esta tarjeta
							width: 'auto', 
							objectFit: 'contain',
							// 🔥 RESPLANDOR AMARILLO RELUCIENTE
							filter: `
								drop-shadow(0 0 8px #FFC300) 
								drop-shadow(0 0 20px #FFC300)
							`
						}} 
					/>
				</div>
				

				{/* BARRA DE PROGRESO */}
				<div style={{
					position: 'absolute', bottom: 0, left: 0, height: '12px', width: `${anchoProgreso}%`, 
					background: 'linear-gradient(90deg, #FFC300 0%, #FF8C00 100%)', 
				}} />
				

				{/* 🌟 EFECTO STARBURST GIRATORIO DETRÁS DEL PRODUCTO */}
				<div style={{
					position: 'absolute', top: '10%',
					width: '600px', height: '600px',
					background: 'repeating-conic-gradient(from 0deg, #FFC300 0deg 15deg, transparent 15deg 30deg)',
					borderRadius: '50%',
					transform: `scale(${escalaImagen}) rotate(${frame * 0.5}deg)`,
					opacity: opacidadContenido * 0.15, zIndex: 0, filter: 'blur(4px)'
				}} />

				<Img src={imageUrl} style={{ 
					width: '100%', height: '480px', objectFit: 'contain', 
					filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.2))',
					transform: `scale(${escalaImagen})`, opacity: opacidadContenido, zIndex: 1
				}} />
				
				<h2 style={{ 
					fontSize: '65px', color: '#111', marginTop: '40px', marginBottom: '20px', 
					fontWeight: '900', textAlign: 'center', lineHeight: '1.1', letterSpacing: '-1.5px',
					transform: `translateY(${subirTexto}px)`, opacity: opacidadContenido
				}}>
					{productName}
				</h2>
				
				<div style={{ width: '80%', height: '3px', background: 'rgba(0,0,0,0.05)', marginBottom: '30px' }} />
				
				{/* CONTENEDOR DEL PRECIO CON EMOJIS */}
				<div style={{ 
					display: 'flex', flexDirection: 'column', alignItems: 'center', 
					transform: `scale(${escalaPrecio * pulsoPrecio})`, opacity: animacionEntradaPrecio,
					position: 'relative' 
				}}>
					
					{/* Emoji Fuego Izquierda */}
					<div style={{
						position: 'absolute', top: '10px', left: '-80px', fontSize: '60px',
						transform: `scale(${escalaEmoji}) rotate(-15deg)`,
						filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))'
					}}>🔥</div>

					{/* Emoji Explosión Derecha */}
					<div style={{
						position: 'absolute', bottom: '20px', right: '-70px', fontSize: '65px',
						transform: `scale(${escalaEmoji}) rotate(10deg)`,
						filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))'
					}}>💥</div>

					{/* 🚀 LÓGICA INTELIGENTE: PRECIO ANTES (Solo si hay descuento) */}
					{porcentaje > 0 && (
						<span style={{ color: '#94a3b8', fontSize: '42px', fontWeight: '700', textDecoration: 'line-through', marginBottom: '-25px' }}>
							$ {precioAntes}
						</span>
					)}

					{/* Precio Final */}
					<div style={{ fontSize: '180px', color: '#E60000', fontWeight: '900', letterSpacing: '-8px', display: 'flex', alignItems: 'flex-start', textShadow: '0 10px 25px rgba(230,0,0,0.2)' }}>
						<span style={{ fontSize: '75px', marginTop: '30px', marginRight: '10px', letterSpacing: '0' }}>$</span>{precio}
					</div>
				</div>
			</div>
		</div>
	);
};


// -----------------------------------------------------------------
// 🎥 COMPONENTE B: EL DIRECTOR (Con capas de profundidad y footer gigante)
// -----------------------------------------------------------------
export const PromoReel: React.FC<z.infer<typeof promoSchema>> = ({ companyUrl, productos }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const entradaTitulo = spring({ frame, fps, config: { damping: 12 } });
	const moverTituloY = interpolate(entradaTitulo, [0, 1], [500, 0]);
	const duracionPorProducto = 180; 

	// Animaciones del Footer
	const entradaFooter = spring({ frame: frame - 60, fps, config: { damping: 15 } });
	const moverFooterY = interpolate(entradaFooter, [0, 1], [200, 0]); // Sube desde más abajo
	
	// Resplandor y Pulso
	const pulsoFooter = 1 + Math.sin(frame / 10) * 0.02;
	const resplandor = Math.abs(Math.sin(frame / 15)) * 20; // Resplandor más intenso

	return (
		<AbsoluteFill style={{ 
			background: 'radial-gradient(circle at 50% 35%, #FF0000 0%, #800000 100%)', // Rojo más vivo arriba
			fontFamily: 'sans-serif', overflow: 'hidden'
		}}>
			{/* 🎵 AQUÍ VA LA MÚSICA DE FONDO GLOBAl 🎵 */}
			{/* volume={0.3} es un 30% de volumen para que no sature */}
			<Audio src={staticFile('background-music.mp3')} volume={0.3} />
			
			{/* 🪄 DETALLE 1: CAPA DE FORMAS FLOTANTES EN EL FONDO */}
			<BackgroundShapes />

			{/* CABECERA */}
			<div style={{
				position: 'absolute', top: 150, left: 0, width: '100%',
				transform: `translateY(${moverTituloY}px)`, opacity: entradaTitulo,
				textAlign: 'center', color: 'white', zIndex: 10
			}}>
				<h1 style={{ fontSize: '110px', fontWeight: '900', margin: 0, textTransform: 'uppercase', textShadow: '0 15px 35px rgba(0,0,0,0.4)', letterSpacing: '-3px', lineHeight: '0.9' }}>
					¡OFERTA <span style={{ color: '#FFC300' }}>DESTACADA</span>!
				</h1>
			</div>

			{/* CUERPO (Secuencia con Barra de Progreso inyectada en ProductoIndividual) */}
			<Series>
				{productos.map((producto, index) => (
					<Series.Sequence key={index} durationInFrames={duracionPorProducto}>
						<ProductoIndividual productName={producto.productName} imageUrl={producto.imageUrl} precio={producto.precio} precioAntes={producto.precioAntes} porcentaje={producto.porcentaje} />
					</Series.Sequence>
				))}
				
				{/* 🚀 NUEVA ESCENA FINAL DE CIERRE */}
				<Series.Sequence durationInFrames={150}> {/* 150 frames = 5 segundos de cierre */}
					<EscenaFinal />
				</Series.Sequence>
			</Series>

			{/* --- 🚀 DETALLE 2 Y 3: FOOTER FLOTANTE, GIGANTE Y CON MÁS VIDA --- */}
			<div style={{
				position: 'absolute', 
				bottom: '120px', // 🛡️ ÁREA SEGURA: Subimos la píldora 120px desde el borde
				left: 0, width: '100%',
				transform: `translateY(${moverFooterY}px)`, opacity: entradaFooter,
				// Quitamos el degradado oscuro de fondo viejo para que la píldora flote libre
				display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20
			}}>
				{/* Contenedor tipo píldora de cristal (Más grande) */}
				<div style={{
					background: 'rgba(255, 255, 255, 0.12)',
					backdropFilter: 'blur(15px)',
					WebkitBackdropFilter: 'blur(15px)',
					padding: '25px 60px', // Más relleno
					borderRadius: '100px', // Bordes más redondos
					border: '1px solid rgba(255, 255, 255, 0.25)',
					transform: `scale(${pulsoFooter})`,
					// Sombra y resplandor más potentes
					boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 ${15 + resplandor}px rgba(255, 195, 0, 0.4)`
				}}>
					<span style={{ 
						color: '#FFC300', 
						fontSize: '55px', // 💥 MUCHO MÁS GRANDE
						fontWeight: '900', 
						letterSpacing: '3px',
						textShadow: `0 0 ${10 + resplandor}px rgba(255,195,0,0.7)`
					}}>
						{companyUrl}
					</span>
				</div>
			</div>

			{/* TEXTURA PREMIUM (Granulado) */}
			<AbsoluteFill style={{
				backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
				opacity: 0.12, mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 9999
			}} />

		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🎬 COMPONENTE C: ESCENA FINAL (Con Partículas 100% Visibles)
// -----------------------------------------------------------------
const EscenaFinal: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// 💥 Animación Explosiva del Logo
	const popLogo = spring({ frame, fps, config: { mass: 0.8, damping: 8, stiffness: 250 } }); 
	const escalaLogo = interpolate(popLogo, [0, 1], [0, 1.5]);
	const rotacionLogo = interpolate(popLogo, [0, 1], [-15, 0]);

	// 💥 Onda Expansiva Visual
	const onda = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
	const escalaOnda = interpolate(onda, [0, 1], [0, 4]);
	const opacidadOnda = interpolate(onda, [0, 1], [0.8, 0]);

	// Animación de los Textos
	const delayTexto = 10;
	const animTexto = spring({ frame: Math.max(0, frame - delayTexto), fps, config: { damping: 12 } });
	const moverYTexto = interpolate(animTexto, [0, 1], [50, 0]);
	const opacidadTexto = interpolate(animTexto, [0, 1], [0, 1]);

	// Animaciones para la Mano de Click
	const delayMano = 40; 
	const animMano = spring({ frame: Math.max(0, frame - delayMano), fps, config: { damping: 12 } });
	const opacidadMano = interpolate(animMano, [0, 1], [0, 1]);
	const moverManoY = interpolate(
		animMano, 
		[0, 0.6, 0.8, 1], 
		[100, 0, -20, 0],
		{ extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
	); 

	// Pulso lumínico del fondo rojo
	const pulsoFondo = interpolate(Math.sin(frame / 10), [-1, 1], [0.95, 1.05]);

	// 🪄 NUEVO: Movimiento global de partículas (hacia arriba como chispas)
	const moverParticulasY = interpolate(frame, [0, 150], [0, -400]);

	return (
		<AbsoluteFill style={{ 
			backgroundColor: '#800000', 
			justifyContent: 'center', 
			alignItems: 'center',
			padding: '50px',
			overflow: 'hidden'
		}}>
			
			{/* --- FONDO ROJO CON PULSO --- */}
			<div style={{
				position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%',
				background: 'radial-gradient(circle at 50% 50%, #E60000 0%, transparent 60%)',
				transform: `scale(${pulsoFondo})`,
				opacity: interpolate(pulsoFondo, [0.95, 1.05], [0.8, 1]),
				zIndex: 0
			}} />

			{/* --- 🪄 PARTÍCULAS DORADAS (AHORA SÍ SE VEN) --- */}
			<div style={{
				position: 'absolute', width: '100%', height: '100%', zIndex: 1
			}}>
				{[...Array(25)].map((_, i) => {
					// Distribuimos las partículas por toda la pantalla matemáticamente
					const posX = (i * 17) % 100; 
					const posY = (i * 23) % 100;
					const size = 12 + (i % 20); // Tamaños grandes: entre 12px y 32px
					const velY = 1 + (i % 3); // Unas suben más rápido que otras

					return (
						<div key={i} style={{
							position: 'absolute',
							top: `${posY}%`,
							left: `${posX}%`,
							width: `${size}px`, height: `${size}px`,
							borderRadius: '50%',
							backgroundColor: '#FFC300',
							// 🔥 Opacidad altísima (hasta 70%) y resplandor fuerte
							opacity: interpolate(frame, [0, 30], [0, 0.4 + (i % 4) * 0.1], { extrapolateRight: 'clamp' }),
							transform: `translateY(${moverParticulasY * velY}px)`,
							// Solo difuminamos algunas para dar efecto 3D
							filter: `blur(${i % 3 === 0 ? 3 : 0}px)`, 
							boxShadow: '0 0 15px rgba(255, 195, 0, 0.9)' // Luz propia brillante
						}} />
					);
				})}
			</div>

			{/* --- ELEMENTOS DE PRIMER PLANO --- */}
			<div style={{
				position: 'absolute', width: '100%', height: '100%', background: 'white',
				opacity: interpolate(frame, [0, 5], [1, 0], { extrapolateRight: 'clamp' }), zIndex: 5
			}} />

			<div style={{
				position: 'absolute', width: '300px', height: '300px',
				borderRadius: '50%', border: '15px solid #FFC300',
				transform: `scale(${escalaOnda})`, opacity: opacidadOnda, zIndex: 5
			}} />

			<Img 
				src={staticFile('logo2.png')} 
				style={{ 
					height: '320px', objectFit: 'contain',
					transform: `scale(${escalaLogo}) rotate(${rotacionLogo}deg)`,
					filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5)) drop-shadow(0 0 30px rgba(255,195,0,0.6))',
					marginBottom: '30px', zIndex: 6
				}} 
			/>

			<h2 style={{
				fontSize: '60px', fontWeight: '900', color: '#FFFFFF', 
				textAlign: 'center', lineHeight: '1.1', letterSpacing: '-1px',
				transform: `translateY(${moverYTexto}px)`, opacity: opacidadTexto,
				marginBottom: '30px', zIndex: 6, textShadow: '0 10px 20px rgba(0,0,0,0.4)'
			}}>
				🛒 Hacemos tu compra<br/>
				<span style={{ color: '#FFC300' }}>mucho más fácil</span>
			</h2>

			<div style={{
				backgroundColor: '#FFC300', color: '#111',
				padding: '20px 40px', borderRadius: '50px',
				fontSize: '32px', fontWeight: '800', textAlign: 'center',
				boxShadow: '0 15px 30px rgba(0,0,0,0.3)',
				transform: `translateY(${moverYTexto}px) scale(${animTexto})`,
				opacity: opacidadTexto, zIndex: 6,
				marginBottom: '180px' 
			}}>
				Ven y visítanos o compra por<br/>nuestra página web
			</div>

			<div style={{
				position: 'absolute',
				bottom: '170px', right: '280px', zIndex: 999,
				transform: `translateY(${moverManoY}px)`,
				opacity: opacidadMano,
			}}>
				<Img src={staticFile('click-hand.png')} style={{ height: '90px', width: 'auto', filter: 'drop-shadow(0 8px 15px rgba(0,0,0,0.4))' }} />
			</div>

			<Sequence from={delayMano + 15}>
				<Audio src={staticFile('click-sound.mp3')} volume={0.6} />
			</Sequence>

		</AbsoluteFill>
	);
};