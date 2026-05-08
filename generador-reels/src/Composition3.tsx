import React from 'react';
import { AbsoluteFill, useCurrentFrame, Img, Series, random, Audio, staticFile } from 'remotion';
import { z } from 'zod';
import { promoSchema, productoSchema } from './Composition';


// -----------------------------------------------------------------
// ⚡ FONDO PARPADEANTE (Colores crudos y cambios bruscos)
// -----------------------------------------------------------------
const FondoBrutal: React.FC = () => {
	const frame = useCurrentFrame();
	// Cambia de color de fondo cada 15 frames para un efecto estroboscópico suave
	const colores = ['#E60000', '#FFC300', '#111111', '#E60000'];
	const indiceColor = Math.floor((frame / 15) % colores.length);
	const bg = colores[indiceColor];

	return (
		<AbsoluteFill style={{ backgroundColor: bg }}>
			{/* Textura de puntos estilo cómic/urbano */}
			<div style={{
				position: 'absolute', width: '100%', height: '100%',
				backgroundImage: 'radial-gradient(circle, #000 3px, transparent 4px)',
				backgroundSize: '40px 40px',
				opacity: 0.15
			}} />
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🔠 TIPOGRAFÍA CINÉTICA (Letras gigantes que se mueven rápido)
// -----------------------------------------------------------------
const TextoCinetico: React.FC<{ texto: string, top: string, direccion: number }> = ({ texto, top, direccion }) => {
	const frame = useCurrentFrame();
	// Movimiento lineal muy rápido y constante
	const moverX = (frame * 25 * direccion) % 3000; 

	return (
		<div style={{
			position: 'absolute', top: top, whiteSpace: 'nowrap',
			fontSize: '300px', fontWeight: '900', color: 'rgba(255,255,255,0.15)',
			textTransform: 'uppercase', 
			transform: `translateX(${moverX}px) skewX(-15deg)`,
			lineHeight: 0.8, letterSpacing: '-5px'
		}}>
			{texto} • {texto} • {texto} • {texto} • {texto}
		</div>
	);
};

// -----------------------------------------------------------------
// 🛒 LOGO BRUTALISTA (Surtitodo Express)
// -----------------------------------------------------------------
const LogoBrutal: React.FC = () => {
	const frame = useCurrentFrame();

	// Efecto de "Glitch" y latido brusco
	const glitchX = frame % 6 === 0 ? (Math.random() * 10 - 5) : 0;
	const glitchY = frame % 5 === 0 ? (Math.random() * 6 - 3) : 0;
	const scale = frame % 15 < 4 ? 1.1 : 1; // Crece bruscamente al ritmo del video
	
	return (
		<div style={{
			position: 'absolute',
			top: '40px',
			left: '40px',
			zIndex: 50,
			background: '#111',
			padding: '10px 20px',
			border: '6px solid #FFF',
			boxShadow: '12px 12px 0px #FFC300',
			transform: `scale(${scale}) translate(${glitchX}px, ${glitchY}px) rotate(-3deg)`,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
            justifyContent: 'center'
		}}>
            {/* Logo oficial de Surtitodo */}
			<Img 
				src={staticFile('icon.png')}
				style={{ height: '320px', marginBottom: '5px' }} 
			/>
            {/* Etiqueta Express Urbana */}
			<div style={{
				background: '#E60000',
				color: '#FFF',
				padding: '2px 15px',
				fontSize: '22px',
				fontWeight: '900',
				letterSpacing: '3px',
				textTransform: 'uppercase',
                fontStyle: 'italic',
                boxShadow: '4px 4px 0px #111'
			}}>
				Express
			</div>
		</div>
	);
};

// -----------------------------------------------------------------
// 💥 PRODUCTO (Cortes secos, temblor y sombra dura)
// -----------------------------------------------------------------
const ProductoBrutal: React.FC<z.infer<typeof productoSchema>> = ({ productName, imageUrl, precio, porcentaje }) => {
	const frame = useCurrentFrame();

	// Efecto Flash Blanco al inicio (dura solo 4 frames)
	const flash = frame < 4 ? 1 : 0;
	
	// Aparición brusca: En el frame 0 no está, en el 4 aparece de golpe
	const escala = frame < 4 ? 0 : (frame < 8 ? 1.1 : 1);
	
	// Glitch effect: Tiembla aleatoriamente en ciertos frames
	const glitchX = frame % 6 === 0 ? random(frame) * 30 - 15 : 0;
	const glitchY = frame % 8 === 0 ? random(frame + 1) * 30 - 15 : 0;
	
	// El precio late bruscamente
	const escalaPrecio = frame % 15 < 7 ? 1.1 : 1;

	return (
		<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
			<FondoBrutal />

            {/* 🔥 EFECTOS DE SONIDO DEL PRODUCTO 🔥 */}
			<Audio src={staticFile('audio/flash.mp3')} volume={0.8} />
			<Audio src={staticFile('audio/beep.mp3')} volume={0.4} />
			
            {/* 🔥 AQUÍ AGREGAMOS EL LOGO 🔥 */}
            <LogoBrutal />
			
			{/* Textos gigantes de fondo cruzándose */}
			<TextoCinetico texto={productName} top="15%" direccion={-1} />
			<TextoCinetico texto="OFERTA" top="65%" direccion={1} />
			
			{/* Textos gigantes de fondo cruzándose */}
			<TextoCinetico texto={productName} top="15%" direccion={-1} />
			<TextoCinetico texto="OFERTA" top="65%" direccion={1} />

			{/* Contenedor del producto */}
			<div style={{
				transform: `scale(${escala}) translate(${glitchX}px, ${glitchY}px)`,
				display: 'flex', flexDirection: 'column', alignItems: 'center',
				zIndex: 10, width: '90%'
			}}>
				
				{porcentaje > 0 && (
					<div style={{
						background: '#111', color: '#FFF', padding: '15px 40px',
						fontSize: '50px', fontWeight: '900', transform: 'rotate(-5deg) translateY(40px)',
						zIndex: 15, border: '6px solid #FFC300', boxShadow: '15px 15px 0px #E60000'
					}}>
						-{porcentaje}%
					</div>
				)}

				<Img 
					src={imageUrl} 
					style={{ 
						height: '750px', objectFit: 'contain', 
						// Sombra sólida "Brutalista" (sin difuminar)
						filter: 'drop-shadow(25px 25px 0px #111)', 
						marginBottom: '30px'
					}} 
				/>

				{/* Precio Agresivo */}
				<div style={{
					background: '#E60000', color: '#FFC300',
					padding: '10px 60px', border: '10px solid #111',
					transform: `scale(${escalaPrecio}) rotate(${frame % 10 < 5 ? -2 : 2}deg)`,
					boxShadow: '20px 20px 0px #111'
				}}>
					<h1 style={{ fontSize: '130px', fontWeight: '900', margin: 0, lineHeight: 1 }}>
						${precio}
					</h1>
				</div>
                {/* --- NUEVO: CÓDIGO DE BARRAS INDUSTRIAL (Estilo Recibo Express Limpio) --- */}
				<div style={{
					marginTop: '25px',
					background: '#FFF',
					padding: '20px 30px',
					border: '8px solid #111',
					boxShadow: '15px 15px 0px #111',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					// Tiembla sutilmente para mantener la energía brutalista
					transform: `rotate(${frame % 10 < 5 ? 2 : -2}deg) scale(${frame % 15 < 3 ? 1.05 : 1})` 
				}}>

					{/* Simulación visual de las líneas del código de barras con CSS */}
					<div style={{
						width: '320px',
						height: '70px',
						background: `repeating-linear-gradient(
							to right,
							#111 0, #111 6px,
							transparent 6px, transparent 10px,
							#111 10px, #111 14px,
							transparent 14px, transparent 20px,
							#111 20px, #111 32px,
							transparent 32px, transparent 36px
						)`,
						marginBottom: '10px'
					}} />

					{/* Números gruesos de código de barras (Tipo EAN-13 de Colombia) */}
					<div style={{
						fontSize: '35px',
						fontWeight: '900',
						color: '#111',
						letterSpacing: '8px',
						fontFamily: 'monospace',
						margin: 0,
						lineHeight: 1
					}}>
						{/* Usamos el precio para generar un número que parezca real pero cambie por producto */}
						770{precio.replace(/\./g, '')}09
					</div>
				</div>
			</div>

			{/* Pantallazo Blanco */}
			{flash === 1 && <AbsoluteFill style={{ backgroundColor: '#FFF', zIndex: 100 }} />}
		</AbsoluteFill>
	);
};

// -----------------------------------------------------------------
// 🎬 COMPOSICIÓN PRINCIPAL
// -----------------------------------------------------------------
export const ReelBrutalismo: React.FC<z.infer<typeof promoSchema>> = ({ productos, companyUrl }) => {
	const duracionPorProducto = 90; 

	return (
		<AbsoluteFill style={{ backgroundColor: '#111' }}>
			{/* 🎵 MÚSICA DE FONDO (Sonará durante todo el reel) 🎵 */}
			<Audio src={staticFile('audio/beat.mp3')} volume={0.3} />

			<Series>
				{productos.map((producto, index) => (
					<Series.Sequence key={index} durationInFrames={duracionPorProducto}>
						<ProductoBrutal {...producto} />
					</Series.Sequence>
				))}
				
				{/* Cierre Violento */}
				<Series.Sequence durationInFrames={90}>
					<AbsoluteFill style={{ backgroundColor: '#FFC300', justifyContent: 'center', alignItems: 'center' }}>
						
						{/* 💥 SONIDO DE GOLPE PARA EL FINAL 💥 */}
						<Audio src={staticFile('audio/slam.mp3')} volume={1} />

						<div style={{
							background: '#E60000', padding: '50px', border: '15px solid #111',
							transform: 'rotate(-5deg)', boxShadow: '30px 30px 0px #111'
						}}>
							<h1 style={{ color: '#FFF', fontSize: '120px', fontWeight: '900', margin: 0, lineHeight: '0.9', textAlign: 'center' }}>
								COMPRA<br/>AHORA
							</h1>
						</div>
						<div style={{
							background: '#111', padding: '20px 40px', marginTop: '60px',
							color: '#FFC300', fontSize: '60px', fontWeight: '900'
						}}>
							{companyUrl}
						</div>
					</AbsoluteFill>
				</Series.Sequence>
			</Series>
		</AbsoluteFill>
	);
};