import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, Series, Audio, staticFile, Sequence } from 'remotion';
import { z } from 'zod';
import { promoSchema, productoSchema } from './Composition'; // Reutilizamos tus schemas

// -----------------------------------------------------------------
// 🌌 FONDO TECH / NEÓN
// -----------------------------------------------------------------
const BackgroundNeon = () => {
	const frame = useCurrentFrame();
	const giro = interpolate(frame, [0, 300], [0, 360]);

	return (
		<AbsoluteFill style={{ 
            background: 'linear-gradient(135deg, #09090e 0%, #16102b 50%, #0a1128 100%)',
            overflow: 'hidden' 
        }}>
			{/* Orbe Cyan */}
			<div style={{
				position: 'absolute', top: '-100px', left: '-150px',
				width: '700px', height: '700px', borderRadius: '50%',
				background: 'radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%)',
				transform: `rotate(${giro}deg)`,
			}} />
			{/* Orbe Morado */}
			<div style={{
				position: 'absolute', bottom: '-200px', right: '-150px',
				width: '800px', height: '800px', borderRadius: '50%',
				background: 'radial-gradient(circle, rgba(138, 43, 226, 0.15) 0%, transparent 70%)',
				transform: `rotate(${giro * -1}deg)`,
			}} />
            {/* Cuadrícula sutil tipo matriz */}
            <div style={{
                position: 'absolute', width: '100%', height: '100%',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px', zIndex: 0
            }} />
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 📱 ESCENA INDIVIDUAL DEL PRODUCTO NUEVO
// -----------------------------------------------------------------
const ProductoLanzamiento: React.FC<z.infer<typeof productoSchema>> = ({ productName, imageUrl, precio, precioAntes, porcentaje }) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	const animTarjeta = spring({ frame, fps, config: { mass: 0.8, damping: 14, stiffness: 100 } });
	const moverTarjetaY = interpolate(animTarjeta, [0, 1], [1000, 0]);
    const opacidadTarjeta = interpolate(animTarjeta, [0, 1], [0, 1]);
	
	const delayContenido = 15;
	const animContenido = spring({ frame: Math.max(0, frame - delayContenido), fps, config: { damping: 12 } });
	const opacidadContenido = interpolate(animContenido, [0, 1], [0, 1]);
	const escalaImagen = interpolate(animContenido, [0, 1], [0.9, 1]);

	const delayPrecio = 30;
	const animPrecio = spring({ frame: Math.max(0, frame - delayPrecio), fps, config: { damping: 10 } });
	const moverPrecioX = interpolate(animPrecio, [0, 1], [-50, 0]);

	const anchoProgreso = interpolate(frame, [0, durationInFrames], [0, 100]);

    const esOferta = porcentaje > 0;

	return (
		<div style={{
			position: 'absolute', top: 380, left: 0, width: '100%',
			transform: `translateY(${moverTarjetaY}px)`, opacity: opacidadTarjeta,
			display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
		}}>
			<div style={{
				background: 'rgba(20, 20, 35, 0.7)', backdropFilter: 'blur(20px)',
                padding: '60px 50px 70px 50px', borderRadius: '30px',
				boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 2px rgba(0, 255, 255, 0.3)',
				border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', 
				alignItems: 'center', width: '850px', position: 'relative', overflow: 'hidden'
			}}>
				
				{/* 🚀 LÓGICA: ETIQUETA NUEVO VS OFERTA ESTRENO */}
				<div style={{
					position: 'absolute', top: '30px', left: '30px',
					background: esOferta ? 'linear-gradient(90deg, #ff0055 0%, #ff0099 100%)' : 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
					color: esOferta ? 'white' : '#000',
					padding: '12px 25px', borderRadius: '15px', fontWeight: '900', fontSize: '32px',
					boxShadow: `0 10px 20px ${esOferta ? 'rgba(255,0,85,0.4)' : 'rgba(0,242,254,0.4)'}`,
					transform: `scale(${escalaImagen})`, opacity: opacidadContenido, zIndex: 10,
                    letterSpacing: '2px'
				}}>
					{esOferta ? `ESTRENO -${porcentaje}%` : '✨ NUEVO INGRESO'}
				</div>

				{/* BARRA DE PROGRESO NEÓN */}
				<div style={{
					position: 'absolute', bottom: 0, left: 0, height: '8px', width: `${anchoProgreso}%`, 
					background: 'linear-gradient(90deg, #00f2fe 0%, #8a2be2 100%)', 
                    boxShadow: '0 0 10px #00f2fe'
				}} />

				<Img src={imageUrl} style={{ 
					width: '100%', height: '450px', objectFit: 'contain', 
					filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))',
					transform: `scale(${escalaImagen})`, opacity: opacidadContenido, zIndex: 1,
                    marginTop: '20px'
				}} />
				
				<h2 style={{ 
					fontSize: '55px', color: '#ffffff', marginTop: '40px', marginBottom: '15px', 
					fontWeight: '800', textAlign: 'center', lineHeight: '1.2',
					opacity: opacidadContenido
				}}>
					{productName}
				</h2>
				
				<div style={{ width: '60%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,242,254,0.5), transparent)', marginBottom: '30px' }} />
				
				{/* LÓGICA DEL PRECIO */}
				<div style={{ 
					display: 'flex', flexDirection: 'column', alignItems: 'center', 
					transform: `translateX(${moverPrecioX}px)`, opacity: animPrecio,
				}}>
                    <span style={{ color: '#00f2fe', fontSize: '24px', fontWeight: '600', letterSpacing: '4px', marginBottom: '5px' }}>
                        {esOferta ? 'PRECIO ESPECIAL' : 'PRECIO DE LANZAMIENTO'}
                    </span>

					{esOferta && (
						<span style={{ color: '#6b7280', fontSize: '38px', fontWeight: '600', textDecoration: 'line-through', marginBottom: '-15px' }}>
							$ {precioAntes}
						</span>
					)}

					<div style={{ fontSize: '150px', color: '#ffffff', fontWeight: '900', letterSpacing: '-5px', display: 'flex', alignItems: 'flex-start', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>
						<span style={{ fontSize: '60px', marginTop: '25px', marginRight: '10px', color: '#00f2fe' }}>$</span>{precio}
					</div>
				</div>
			</div>
		</div>
	);
};

// -----------------------------------------------------------------
// 🎬 COMPONENTE PRINCIPAL: REEL LANZAMIENTO
// -----------------------------------------------------------------
export const ReelLanzamiento: React.FC<z.infer<typeof promoSchema>> = ({ companyUrl, productos }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const animTitulo = spring({ frame, fps, config: { damping: 14 } });
	const opacidadTitulo = interpolate(animTitulo, [0, 1], [0, 1]);
    const escalaTitulo = interpolate(animTitulo, [0, 1], [0.8, 1]);
	const duracionPorProducto = 180; 

	return (
		<AbsoluteFill style={{ backgroundColor: '#050505', fontFamily: 'sans-serif' }}>
			{/* MÚSICA DE LANZAMIENTO */}
			<Audio src={staticFile('background-music2.mp3')} volume={0.4} />
			
			<BackgroundNeon />

			{/* CABECERA */}
			<div style={{
				position: 'absolute', top: 120, left: 0, width: '100%',
				transform: `scale(${escalaTitulo})`, opacity: opacidadTitulo,
				textAlign: 'center', color: 'white', zIndex: 10
			}}>
				<h1 style={{ 
                    fontSize: '90px', fontWeight: '900', margin: 0, 
                    textTransform: 'uppercase', letterSpacing: '2px', lineHeight: '1',
                    background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))'
                }}>
					RECIÉN LLEGADOS
				</h1>
                <p style={{ margin: '10px 0 0 0', fontSize: '35px', color: '#00f2fe', fontWeight: '600', letterSpacing: '5px'}}>
                    A SURTITODO IDEAL
                </p>
			</div>

			{/* SECUENCIA DE PRODUCTOS */}
			<Series>
				{productos.map((producto, index) => (
					<Series.Sequence key={index} durationInFrames={duracionPorProducto}>
						<ProductoLanzamiento {...producto} />
					</Series.Sequence>
				))}
				
				<Series.Sequence durationInFrames={150}>
					<EscenaFinalLanzamiento />
				</Series.Sequence>
			</Series>

			{/* FOOTER FLOTANTE TECH */}
			<div style={{
				position: 'absolute', bottom: '80px', left: 0, width: '100%',
				display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20
			}}>
				<div style={{
					background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)',
					padding: '20px 50px', borderRadius: '50px',
					border: '1px solid rgba(0, 242, 254, 0.3)',
					boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0, 242, 254, 0.2)`
				}}>
					<span style={{ color: '#00f2fe', fontSize: '40px', fontWeight: '800', letterSpacing: '4px' }}>
						{companyUrl}
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🎬 ESCENA FINAL: DESPEDIDA CYBER
// -----------------------------------------------------------------
const EscenaFinalLanzamiento: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const animLogo = spring({ frame, fps, config: { damping: 12 } }); 
	const opacidadLogo = interpolate(animLogo, [0, 1], [0, 1]);
	const subirLogo = interpolate(animLogo, [0, 1], [50, 0]);

    // Animación para el clic (NUEVO)
    const delayMano = 20; 
	const animMano = spring({ frame: Math.max(0, frame - delayMano), fps, config: { damping: 12 } });
	const opacidadMano = interpolate(animMano, [0, 1], [0, 1]);
	const moverManoY = interpolate(
		animMano, 
		[0, 0.6, 0.8, 1], 
		[100, 0, -10, 0],
		{ extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
	); 

	return (
		<AbsoluteFill style={{ 
			justifyContent: 'center', alignItems: 'center', padding: '50px',
            background: 'radial-gradient(circle at 50% 50%, #16102b 0%, #050505 100%)'
		}}>
			<Img 
				src={staticFile('logo2.png')} 
				style={{ 
					height: '280px', objectFit: 'contain',
					transform: `translateY(${subirLogo}px)`, opacity: opacidadLogo,
					filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.2))',
					marginBottom: '40px', zIndex: 6
				}} 
			/>
			<h2 style={{
				fontSize: '65px', fontWeight: '800', color: '#FFFFFF', textAlign: 'center', 
                lineHeight: '1.2', opacity: opacidadLogo, marginBottom: '20px'
			}}>
				Sé el primero en <br/>
				<span style={{ color: '#00f2fe' }}>probar lo nuevo</span>
			</h2>
			<div style={{
				background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)', color: '#000',
				padding: '20px 40px', borderRadius: '50px', fontSize: '30px', fontWeight: '900',
				boxShadow: '0 10px 30px rgba(0,242,254,0.4)', opacity: opacidadLogo,
                marginTop: '30px'
			}}>
				Pide ahora en nuestra web
			</div>

            {/* 👇 NUEVO: MANITO Y SONIDO DE CLIC 👇 */}
            <div style={{
				position: 'absolute',
				bottom: '220px', right: '300px', zIndex: 999,
				transform: `translateY(${moverManoY}px)`,
				opacity: opacidadMano,
			}}>
				<Img src={staticFile('click-hand.png')} style={{ height: '90px', width: 'auto', filter: 'drop-shadow(0 0 15px rgba(0, 242, 254, 0.6))' }} />
			</div>

			<Sequence from={delayMano + 10}>
				<Audio src={staticFile('lanzamiento-bg.mp3')} volume={0.7} />
			</Sequence>

		</AbsoluteFill>
	);
};