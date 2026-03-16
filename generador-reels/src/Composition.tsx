import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, Series } from 'remotion';
import { z } from 'zod';

export const productoSchema = z.object({
	productName: z.string(),
	imageUrl: z.string().url(),
	precio: z.string(),
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
const ProductoIndividual: React.FC<z.infer<typeof productoSchema>> = ({ productName, imageUrl, precio }) => {
	const frame = useCurrentFrame();
	const { fps, width, durationInFrames } = useVideoConfig();

	// Animación de Entrada
	const animacionImagen = spring({ frame, fps, config: { mass: 0.8, damping: 10, stiffness: 100 } });
	const moverImagenX = interpolate(animacionImagen, [0, 1], [width, 0]);
	const opacidadImagen = interpolate(animacionImagen, [0, 0.5, 1], [0, 1, 1]);
	const escalaImagen = interpolate(animacionImagen, [0, 1], [0.5, 1]);

	// Animación del Latido (Precio)
	const pulsoPrecio = 1 + Math.sin(frame / 6) * 0.05; 
	
	// Cálculos de Precios
	const precioNumerico = parseFloat(precio.replace(/\./g, ''));
	const precioAntes = (precioNumerico * 1.25).toLocaleString('es-CO');

	// 🚀 NUEVO DETALLE: Barra de Progreso de la Oferta
	// Mapeamos el progreso del frame actual al ancho (0% a 100%)
	const anchoProgreso = interpolate(frame, [0, durationInFrames], [0, 100]);

	return (
		<div style={{
			position: 'absolute', top: 400, left: 0, width: '100%',
			transform: `translateX(${moverImagenX}px) scale(${escalaImagen})`,
			opacity: opacidadImagen, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
		}}>
			<div style={{
				background: '#ffffff', padding: '60px 50px 70px 50px', borderRadius: '50px',
				boxShadow: '0 40px 80px rgba(0,0,0,0.1), 0 15px 35px rgba(0,0,0,0.05)',
				border: '1px solid rgba(0,0,0,0.03)',
				display: 'flex', flexDirection: 'column', alignItems: 'center', width: '800px',
				position: 'relative', overflow: 'hidden' // Importante para la barra
			}}>
				
				{/* 🚀 LA BARRA DE PROGRESO INYECTADA */}
				<div style={{
					position: 'absolute', bottom: 0, left: 0, 
					height: '10px', width: `${anchoProgreso}%`, // Ancho dinámico matemático
					background: 'linear-gradient(90deg, #FFC300 0%, #FFD700 100%)', // Degradado dorado
					boxShadow: '0 -5px 15px rgba(255, 195, 0, 0.3)'
				}} />

				<Img src={imageUrl} style={{ width: '100%', height: '480px', objectFit: 'contain', filter: 'drop-shadow(0 25px 30px rgba(0,0,0,0.15))' }} />
				
				<h2 style={{ fontSize: '60px', color: '#1e293b', marginTop: '50px', marginBottom: '25px', fontWeight: '900', textAlign: 'center', lineHeight: '1.1', letterSpacing: '-1px' }}>
					{productName}
				</h2>
				
				<div style={{ width: '80%', height: '2px', background: 'rgba(0,0,0,0.05)', marginBottom: '35px' }} />
				
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${pulsoPrecio})` }}>
					<span style={{ color: '#94a3b8', fontSize: '38px', fontWeight: '600', textDecoration: 'line-through', marginBottom: '-18px', letterSpacing: '1px' }}>
						$ {precioAntes}
					</span>
					<div style={{ fontSize: '160px', color: '#E60000', fontWeight: '900', letterSpacing: '-6px', display: 'flex', alignItems: 'flex-start' }}>
						<span style={{ fontSize: '70px', marginTop: '25px', marginRight: '10px', letterSpacing: '0' }}>$</span>{precio}
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
	const duracionPorProducto = 120; 

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
						<ProductoIndividual productName={producto.productName} imageUrl={producto.imageUrl} precio={producto.precio} />
					</Series.Sequence>
				))}
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