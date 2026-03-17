import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img, Series, Audio, staticFile, Sequence } from 'remotion';
import { z } from 'zod';
import { promoSchema, productoSchema } from './Composition'; 

// -----------------------------------------------------------------
// ✨ COMPONENTE A: ESCENA VIP (Ahora en Negro Absoluto y Sin Degradados)
// -----------------------------------------------------------------
const EscenaEleganteV2: React.FC<z.infer<typeof productoSchema>> = ({ productName, imageUrl, precio, precioAntes, porcentaje }) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	
	// Animaciones
	const entradaEscena = spring({ frame, fps, config: { damping: 20, mass: 1, stiffness: 80 } });
	const opacidadGlobal = interpolate(entradaEscena, [0, 1], [0, 1]);
	const zoomLento = interpolate(frame, [0, durationInFrames], [0.95, 1.15]);
	const pulsoPrecio = 1 + Math.sin(frame / 6) * 0.05; 
	const moverParticulas = interpolate(frame, [0, durationInFrames], [0, -200]);
	const moverFondoX = interpolate(frame, [0, durationInFrames], [0, -400]);

	const delayTextos = 15;
	const animTextos = spring({ frame: Math.max(0, frame - delayTextos), fps, config: { damping: 15 } });
	const moverYTextos = interpolate(animTextos, [0, 1], [50, 0]);
	const opacidadTextos = interpolate(animTextos, [0, 1], [0, 1]);

	return (
		// 🔥 AJUSTE 1: Fondo Global en Negro Puro (#000000)
		<AbsoluteFill style={{ backgroundColor: '#000000', opacity: opacidadGlobal }}>
			
			{/* MITAD SUPERIOR: Área de la Imagen */}
			<div style={{
				position: 'absolute', top: 0, left: 0, width: '100%', height: '58%',
				// 🔥 AJUSTE 2: Quitamos linear-gradient y ponemos Negro Puro sólido
				backgroundColor: '#000000', 
				display: 'flex', justifyContent: 'center', alignItems: 'center',
				overflow: 'hidden', borderBottom: '4px solid #FFC300'
			}}>
				{/* Texto Marquee sutil */}
				<div style={{
					position: 'absolute', top: '20%', left: 0, whiteSpace: 'nowrap',
					color: 'rgba(255, 255, 255, 0.05)', fontSize: '150px', fontWeight: '900',
					transform: `translateX(${moverFondoX}px)`, zIndex: 0
				}}>
					OFERTA VIP • SURTITODO • OFERTA VIP • SURTITODO • OFERTA VIP
				</div>

				{/* Reflector Dorado sutil detras */}
				<div style={{
					position: 'absolute', width: '700px', height: '700px',
					background: 'radial-gradient(circle, rgba(255,195,0,0.15) 0%, transparent 70%)',
					zIndex: 1
				}} />

				<Img 
					src={imageUrl} 
					style={{ 
						width: '85%', height: '85%', objectFit: 'contain', 
						transform: `scale(${zoomLento})`,
						filter: 'drop-shadow(0 25px 40px rgba(0,0,0,0.7))', zIndex: 2 
					}} 
				/>
				
				<div style={{
					position: 'absolute', bottom: '30px', left: '40px',
					background: '#FFC300', color: '#111', padding: '12px 25px',
					borderRadius: '4px', fontWeight: '900', fontSize: '32px',
					boxShadow: '0 10px 30px rgba(255,195,0,0.4)', zIndex: 3
				}}>
					{porcentaje > 0 ? `-${porcentaje}% OFF` : '🌟 DESTACADO'}
				</div>
			</div>

			{/* MITAD INFERIOR: Área de Textos y Precios */}
			<div style={{
				position: 'absolute', bottom: 0, left: 0, width: '100%', height: '42%',
				// 🔥 AJUSTE 3: Negro Puro también en la mitad inferior
				backgroundColor: '#000000', padding: '35px 50px 50px 50px', 
				display: 'flex', flexDirection: 'column', justifyContent: 'center',
				overflow: 'hidden'
			}}>
				
				{/* Partículas Doradas flotantes */}
				{[...Array(8)].map((_, i) => (
					<div key={i} style={{
						position: 'absolute',
						bottom: `${-20 + (i * 40)}px`,
						left: `${(i * 15) + 5}%`,
						width: '12px', height: '12px',
						borderRadius: '50%',
						background: '#FFC300',
						opacity: 0.15, 
						transform: `translateY(${moverParticulas * (0.3 + i * 0.2)}px)`,
						filter: 'blur(3px)',
					}} />
				))}

				{/* Contenido (Textos y Precios) */}
				<div style={{ position: 'relative', zIndex: 10 }}>
					<div style={{
						color: '#FFC300', backgroundColor: 'rgba(255,195,0,0.1)',
						border: '1px solid rgba(255,195,0,0.3)', padding: '6px 15px',
						borderRadius: '50px', fontSize: '18px', fontWeight: '700', 
						width: 'fit-content', marginBottom: '12px', letterSpacing: '2px',
						transform: `translateY(${moverYTextos}px)`, opacity: opacidadTextos
					}}>
						💎 CALIDAD PREMIUM
					</div>

					<h2 style={{ 
						fontSize: '55px', color: '#FFFFFF', fontWeight: '700', 
						lineHeight: '1.1', margin: '0 0 10px 0',
						transform: `translateY(${moverYTextos}px)`, opacity: opacidadTextos
					}}>
						{productName}
					</h2>

					<div style={{ 
						display: 'flex', alignItems: 'flex-end', gap: '25px',
						transform: `translateY(${moverYTextos}px)`, opacity: opacidadTextos,
						position: 'relative'
					}}>
						{/* Onda de Pulso detrás del precio */}
						<div style={{
							position: 'absolute', left: '0', bottom: '0',
							width: '400px', height: '200px',
							background: 'radial-gradient(ellipse, rgba(255,195,0,0.15) 0%, transparent 70%)',
							transform: `scale(${pulsoPrecio * 1.6})`,
							zIndex: -1
						}} />

						<div style={{ fontSize: '130px', color: '#FFC300', fontWeight: '900', letterSpacing: '-6px', lineHeight: '0.85' }}>
							<span style={{ fontSize: '50px', verticalAlign: 'top', marginRight: '5px', color: '#FFF' }}>$</span>
							{precio}
						</div>
						
						{porcentaje > 0 && (
							<div style={{ fontSize: '38px', color: '#6B7280', textDecoration: 'line-through', paddingBottom: '15px' }}>
								$ {precioAntes}
							</div>
						)}
					</div>

					<div style={{ display: 'flex', gap: '15px', marginTop: '25px', transform: `translateY(${moverYTextos}px)`, opacity: opacidadTextos }}>
						<div style={{ background: 'linear-gradient(90deg, #25D366 0%, #128C7E 100%)', color: 'white', padding: '12px 22px', borderRadius: '50px', fontSize: '22px', fontWeight: '700' }}>
							📱 312 840 6312
						</div>
						<div style={{ background: 'rgba(255,255,255,0.05)', color: '#D1D5DB', padding: '12px 22px', borderRadius: '50px', fontSize: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
							🛵 Domicilio
						</div>
					</div>
				</div>
			</div>

			{/* Barra de Tiempo Inferior */}
			<div style={{
				position: 'absolute', bottom: 0, left: 0, height: '8px',
				width: `${interpolate(frame, [0, durationInFrames], [0, 100])}%`,
				backgroundColor: '#FFC300', boxShadow: '0 0 20px #FFC300'
			}} />

			{/* Sonidos por producto */}
			<Audio src={staticFile('smooth-whoosh.mp3')} volume={0.4} />
			<Audio src={staticFile('glimmer.mp3')} volume={0.5} startFrom={30} />
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🎬 COMPONENTE C: ESCENA FINAL VIP (URL Gigante y Click Centrado)
// -----------------------------------------------------------------
export const EscenaFinalVIP: React.FC<{ companyUrl: string }> = ({ companyUrl }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Animaciones explosives
	const popLogo = spring({ frame, fps, config: { mass: 0.8, damping: 8, stiffness: 250 } }); 
	const escalaLogo = interpolate(popLogo, [0, 1], [0, 1.1]);
	const rotacionLogo = interpolate(popLogo, [0, 1], [-10, 0]);

	const onda = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
	const escalaOnda = interpolate(onda, [0, 1], [0, 4]);
	const opacidadOnda = interpolate(onda, [0, 1], [0.8, 0]);

	const delayTexto = 10;
	const animTexto = spring({ frame: Math.max(0, frame - delayTexto), fps, config: { damping: 12 } });
	const moverYTexto = interpolate(animTexto, [0, 1], [50, 0]);
	const opacidadTexto = interpolate(animTexto, [0, 1], [0, 1]);

	// Entrada y Pulso Brutal de la URL Gigante
	const delayUrl = 20;
	const popUrl = spring({ frame: Math.max(0, frame - delayUrl), fps, config: { mass: 1, damping: 10 } });
	const escalaUrlEntrance = interpolate(popUrl, [0, 1], [0, 1]);
	const sinPulso = Math.sin(frame / 6);
	const pulsoUrlBrutal = 1 + interpolate(sinPulso, [-1, 1], [0.03, -0.03]);

	// Animación Mano de Click Centrada
	const delayMano = 55; 
	const animMano = spring({ frame: Math.max(0, frame - delayMano), fps, config: { damping: 12 } });
	const opacidadMano = interpolate(animMano, [0, 1], [0, 1]);
	const moverManoY = interpolate(animMano, [0, 0.6, 0.8, 1], [100, 0, -20, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }); 

	const pulsoFondo = interpolate(Math.sin(frame / 10), [-1, 1], [0.95, 1.05]);
	const moverParticulasY = interpolate(frame, [0, 150], [0, -400]);

	return (
		// 🔥 AJUSTE 4: Negro Puro también en el fondo del final explosivo
		<AbsoluteFill style={{ backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: '50px', overflow: 'hidden' }}>
			
			{/* FONDO CON PULSO (Mantenemos un ligero brillo dorado central) */}
			<div style={{
				position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%',
				background: 'radial-gradient(circle at 50% 50%, rgba(255,195,0,0.15) 0%, transparent 50%)',
				transform: `scale(${pulsoFondo})`,
				opacity: interpolate(pulsoFondo, [0.95, 1.05], [0.7, 1]), zIndex: 0
			}} />

			{/* PARTÍCULAS DORADAS VIP */}
			<div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>
				{[...Array(25)].map((_, i) => (
					<div key={i} style={{
						position: 'absolute', top: `${(i * 23) % 100}%`, left: `${(i * 17) % 100}%`,
						width: `${12 + (i % 20)}px`, height: `${12 + (i % 20)}px`, borderRadius: '50%',
						backgroundColor: '#FFC300',
						opacity: interpolate(frame, [0, 30], [0, 0.3 + (i % 4) * 0.1], { extrapolateRight: 'clamp' }),
						transform: `translateY(${moverParticulasY * (1 + (i % 3))}px)`,
						filter: `blur(${i % 3 === 0 ? 3 : 0}px)`, boxShadow: '0 0 20px rgba(255, 195, 0, 0.6)' 
					}} />
				))}
			</div>

			{/* DESTELLO INICIAL DORADO */}
			<div style={{ position: 'absolute', width: '100%', height: '100%', background: '#FFC300', opacity: interpolate(frame, [0, 5], [0.5, 0], { extrapolateRight: 'clamp' }), zIndex: 5 }} />

			{/* Onda expansiva */}
			<div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', border: '10px solid #FFC300', transform: `scale(${escalaOnda})`, opacity: opacidadOnda, zIndex: 5 }} />

			{/* LOGO */}
			<Img src={staticFile('logo2.png')} style={{ height: '260px', objectFit: 'contain', transform: `scale(${escalaLogo}) rotate(${rotacionLogo}deg)`, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8)) drop-shadow(0 0 30px rgba(230,0,0,0.5))', marginBottom: '20px', zIndex: 6 }} />

			{/* Texto */}
			<h2 style={{ fontSize: '55px', fontWeight: '900', color: '#FFFFFF', textAlign: 'center', lineHeight: '1.1', letterSpacing: '-1px', transform: `translateY(${moverYTexto}px)`, opacity: opacidadTexto, marginBottom: '20px', zIndex: 6 }}>
				🛒 Hacemos tu compra<br/><span style={{ color: '#FFC300' }}>mucho más fácil</span>
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

			{/* URL GIGANTE CENTRADA */}
			<div style={{
				transform: `scale(${escalaUrlEntrance * pulsoUrlBrutal})`, 
				opacity: popUrl, zIndex: 6, textAlign: 'center', marginTop: '30px'
			}}>
				<span style={{ 
					color: '#FFC300', fontSize: '70px', fontWeight: '900', letterSpacing: '3px', textTransform: 'uppercase',
					filter: `drop-shadow(0 0 15px rgba(255,195,0,0.8)) drop-shadow(0 0 40px rgba(255,195,0,0.5))`,
					textShadow: '0 10px 30px rgba(0,0,0,0.8)'
				}}>
					{companyUrl}
				</span>
			</div>

			{/* Mano apuntando CENTRADA */}
			<div style={{ 
				position: 'absolute', top: '68%', left: 0, width: '100%', display: 'flex', justifyContent: 'center', 
				zIndex: 999, transform: `translateY(${moverManoY}px)`, opacity: opacidadMano 
			}}>
				<Img src={staticFile('click-hand.png')} style={{ height: '110px', width: 'auto', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.8))', marginLeft: '80px' }} />
			</div>

			{/* Sonidos del Final */}
			<Sequence from={0} durationInFrames={fps}><Audio src={staticFile('glimmer.mp3')} volume={0.8} /></Sequence>
			<Sequence from={delayMano + 15}><Audio src={staticFile('click-sound.mp3')} volume={0.6} /></Sequence>
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🎬 COMPONENTE B: EL DIRECTOR VIP (Sin Textura de Grano)
// -----------------------------------------------------------------
export const ReelElegante: React.FC<z.infer<typeof promoSchema>> = ({ companyUrl, productos }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	
	const duracionPorProducto = 180; 
	
	// Calcular cuándo empieza el final para desvanecer elementos
	const inicioEscenaFinal = productos.length * duracionPorProducto;
	const fadeOutElementos = interpolate(frame, [inicioEscenaFinal - 15, inicioEscenaFinal], [1, 0], { extrapolateRight: 'clamp' });

	const fadeIntro = spring({ frame, fps, config: { damping: 20 } });
	const moverIntro = interpolate(fadeIntro, [0, 1], [-50, 0]);

	return (
		// 🔥 AJUSTE 5: Fondo Global del Director en Negro Puro (#000000)
		<AbsoluteFill style={{ backgroundColor: '#000000', fontFamily: 'Poppins, sans-serif' }}>
			<Audio src={staticFile('vip-music.mp3')} volume={0.25} loop />

			{/* LOGO FIJO (Desaparece al final) */}
			<div style={{
				position: 'absolute', bottom: '27%', right: '60px', zIndex: 100,
				opacity: fadeIntro * fadeOutElementos, 
			}}>
				<Img src={staticFile('logo2.png')} style={{ height: '240px', width: 'auto', filter: 'drop-shadow(0 0 15px #E60000) drop-shadow(0 0 30px #E60000)' }} />
			</div>

			{/* Secuencia de productos + Final */}
			<Series>
				{productos.map((producto, index) => (
					<Series.Sequence key={index} durationInFrames={duracionPorProducto}>
						<EscenaEleganteV2 {...producto} />
					</Series.Sequence>
				))}
				<Series.Sequence durationInFrames={150}> 
					<EscenaFinalVIP companyUrl={companyUrl} />
				</Series.Sequence>
			</Series>

			{/* 🔥 AJUSTE 6: BORRAMOS EL BLOQUE DE LA TEXTURA DE RUIDO (Grain Effect) AQUÍ 🔥 */}

			{/* Header con Logo Principal (Desaparece al final) */}
			<div style={{
				position: 'absolute', top: '50px', left: '50px',
				transform: `translateY(${moverIntro}px)`, zIndex: 20, display: 'flex', alignItems: 'center', gap: '20px',
				opacity: fadeIntro * fadeOutElementos, 
			}}>
				<div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
					<Img src="https://surtitodoideal.com/7f498de1-fb56-4ce2-b2dc-404a582d6427.png" style={{ height: '70px' }} />
				</div>
				<div style={{ background: 'rgba(20,20,20,0.8)', padding: '15px 30px', borderRadius: '50px', border: '1px solid #FFC300', color: '#FFC300', fontWeight: '700', fontSize: '24px' }}>
					✨ SELECCIÓN VIP
				</div>
			</div>

			{/* Banner URL Fijo (Desaparece al final) */}
			<div style={{ position: 'absolute', bottom: '60px', right: '60px', opacity: fadeIntro * fadeOutElementos, zIndex: 20 }}>
				<div style={{ backgroundColor: '#FFC300', padding: '12px 35px', borderRadius: '100px', border: '2px solid rgba(255,255,255,0.2)' }}>
					<span style={{ color: '#111', fontWeight: '900', fontSize: '32px' }}>{companyUrl}</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};