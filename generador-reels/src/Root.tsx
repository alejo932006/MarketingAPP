import { CalculateMetadataFunction, Composition } from 'remotion';
import { z } from 'zod';
import { PromoReel, promoSchema } from './Composition';
import { ReelElegante } from './Composition2';
import { TutorialReel } from './Tutorial';
import { ReelBrutalismo } from './Composition3';
import { OfferWonReel } from './OfferWonReel';
import { ReelLanzamiento } from './ReelLanzamiento';
import { ReelAra } from './ReelAra';
import { PodcastUniversidadCompleto } from './PodcastUniversidad';
import { ReelTemporada } from './ReelTemporada';
import { ReelCinematico } from './ReelCinematico';
import { ReelCarnaval } from './ReelCarnaval';
import { ElectoralReel, electoralReelSchema } from './ElectoralReel';

type PromoProps = z.infer<typeof promoSchema>;

function duracionConVoz(base: number, props: PromoProps): number {
	if (props.durationOverrideFrames && props.durationOverrideFrames > base) {
		return props.durationOverrideFrames;
	}
	return base;
}

const duracionPromoReel: CalculateMetadataFunction<PromoProps> = ({ props }) => ({
	durationInFrames: duracionConVoz((props.productos.length * 180) + 150, props),
});

const duracionReelBrutalismo: CalculateMetadataFunction<PromoProps> = ({ props }) => ({
	durationInFrames: duracionConVoz((props.productos.length * 90) + 90, props),
});

const duracionReelCarnaval: CalculateMetadataFunction<PromoProps> = ({ props }) => ({
	durationInFrames: duracionConVoz(120 + (props.productos.length * 150) + 180, props),
});

const duracionReelAra: CalculateMetadataFunction<PromoProps> = ({ props }) => ({
	durationInFrames: duracionConVoz(180, props),
});

const duracionReelTemporada: CalculateMetadataFunction<PromoProps> = ({ props }) => ({
	durationInFrames: duracionConVoz(900, props),
});

export const RemotionRoot: React.FC = () => {
	
	const datosSimulados = {
		companyUrl: 'surtitodoideal.com', 
		productos: [
			{
				productName: 'Pan Tajado Bimbo 400g',
				imageUrl: 'https://api.surtitodoideal.com/imagenes/productos/7702532630207.jpg',
				precio: '4.500',        // <-- El precio final de oferta
				precioAntes: '5.200',   // <-- El precio tachado
				porcentaje: 13,         // <-- El porcentaje de descuento
			},
			{
				productName: 'Arepas de Maíz Ricampo x 10',
				imageUrl: 'https://api.surtitodoideal.com/imagenes/productos/6cc7bedc-471b-439a-86eb-5171c6bba71d.jpg',
				precio: '3.500',
				precioAntes: '3.868',
				porcentaje: 10,
			},
			{
				productName: 'Leche Deslactosada Alquería',
				imageUrl: 'https://api.surtitodoideal.com/imagenes/productos/7702191164594.jpg',
				precio: '4.500',
				precioAntes: '4.500',
				porcentaje: 0,          // <-- Simula un producto SIN descuento (Destacado)
			},
			{
				productName: 'Huevos Tipo A x 30',
				imageUrl: 'https://api.surtitodoideal.com/imagenes/productos/7702004110701.jpg',
				precio: '17.000',
				precioAntes: '18.900',
				porcentaje: 10,
			}
		]
	};

	const duracionTotalVideo = (datosSimulados.productos.length * 180) + 150;
	const duracionTotalFrames = 7050;
	
	return (
		<>
            {/* PLANTILLA 1: La Explosiva */}
			<Composition
				id="PromoReel"
				component={PromoReel}
				durationInFrames={(datosSimulados.productos.length * 180) + 150}
				fps={60}
				width={1080}
				height={1920}
				schema={promoSchema}
				defaultProps={datosSimulados}
				calculateMetadata={duracionPromoReel}
			/>

            {/* PLANTILLA 2: La Nueva Elegante */}
            <Composition
				id="ReelElegante"
				component={ReelElegante}
				durationInFrames={duracionTotalVideo}
				fps={60}
				width={1080}
				height={1920}
				schema={promoSchema}
				defaultProps={datosSimulados}
				calculateMetadata={duracionPromoReel}
			/>

			{/* PLANTILLA 3: El Reel Brutalista (Impacto) */}
			<Composition
				id="ReelBrutalismo"
				component={ReelBrutalismo}
				durationInFrames={(datosSimulados.productos.length * 90) + 90}
				fps={60}
				width={1080}
				height={1920}
				schema={promoSchema}
				defaultProps={datosSimulados}
				calculateMetadata={duracionReelBrutalismo}
			/>

			{/* PLANTILLA 4: Lanzamiento / Estreno (Cyberpunk) */}
			<Composition
				id="ReelLanzamiento"
				component={ReelLanzamiento}
				durationInFrames={(datosSimulados.productos.length * 180) + 150}
				fps={60}
				width={1080}
				height={1920}
				schema={promoSchema}
				defaultProps={datosSimulados}
				calculateMetadata={duracionPromoReel}
			/>

			<Composition
			id="TutorialReel"
				component={TutorialReel}
				durationInFrames={1260} // Los 1110 de tu video + 150 del final VIP
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					companyUrl: 'surtitodoideal.com',
					videoFileName: 'tutorial.mp4' // Asegúrate de tener este video en la carpeta public
				}}
			/>

			<Composition
				id="OfferWonReel1" // Un ID único
				component={OfferWonReel}
				durationInFrames={300} // Duración: 10 segundos (a 30 fps)
				fps={30}
				width={1080} // Reel Vertical
				height={1920}
				defaultProps={{
					// Props por defecto para que puedas ver una previsualización
					clientName: 'JUAN PÉREZ (Ejemplo)',
					propertyAddress: 'Calle Principal 123, Caicedonia',
					clientImageUrl: 'https://remotion.dev/img/logo-small.png',
					logoImageUrl: 'https://surtitodoideal.com/Sin%20t%C3%ADtulo-1.png', // Usando tu archivo subido
				}}
			/>

			{/* PLANTILLA 5: Estilo Ara (1 Solo Producto, Súper Impacto) */}
			<Composition
				id="ReelAraStyle"
				component={ReelAra}
				durationInFrames={180} // 6 segundos a 30fps
				fps={30}
				width={1080}
				height={1920}
				schema={promoSchema}
				defaultProps={datosSimulados}
				calculateMetadata={duracionReelAra}
			/>

			<Composition
                id="AudiogramaConstitucionFinal"
                component={PodcastUniversidadCompleto}
                durationInFrames={duracionTotalFrames}
                fps={30}
                width={1920}
                height={1080}
            />

			{/* PLANTILLA: Especial de Temporada */}
			<Composition
				id="ReelTemporada"
				component={ReelTemporada}
				durationInFrames={900}
				fps={60}
				width={1080}
				height={1920}
				schema={promoSchema}
				defaultProps={datosSimulados}
				calculateMetadata={duracionReelTemporada}
			/>

			<Composition
				id="ReelCinematico"
				component={ReelCinematico}
				durationInFrames={150}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
				marca: "EDICIÓN ESPECIAL",
				nombreProducto: "YAMAHA NMAX",
				precio: "$15.000.000",
				// Una imagen en PNG sin fondo se verá espectacular con la rotación 3D
				imagenProducto: "url_de_la_moto_en_png.png", 
				}}
			/>

			<Composition
				id="ReelCarnaval"
				component={ReelCarnaval}
				durationInFrames={900} // 120 + (4 * 150) + 180 + margen
				fps={60}
				width={1080}
				height={1920}
				schema={promoSchema}
				defaultProps={{
					companyUrl: "surtitodoideal.com",
					productos: [
						{ productName: "Mango Tomy", imageUrl: "https://api.surtitodoideal.com/static/icon.png", precio: "3.200", precioAntes: "4.500", porcentaje: 28 },
						{ productName: "Piña Oro Miel", imageUrl: "https://api.surtitodoideal.com/static/icon.png", precio: "2.900", precioAntes: "3.800", porcentaje: 23 },
						{ productName: "Aguacate Hass", imageUrl: "https://api.surtitodoideal.com/static/icon.png", precio: "4.800", precioAntes: "6.000", porcentaje: 20 },
						{ productName: "Manzana Roja", imageUrl: "https://api.surtitodoideal.com/static/icon.png", precio: "1.900", precioAntes: "2.500", porcentaje: 24 }
					]
				}}
				calculateMetadata={duracionReelCarnaval}
			/>

			<Composition
				id="ElectoralReel"
				component={ElectoralReel}
				durationInFrames={600}
				fps={30}
				width={1080}
				height={1920}
				schema={electoralReelSchema}
				defaultProps={{
					discountPercent: 2,
					validDateText: 'Válido mañana lunes 1 de junio',
					logoFileName: 'icon.png',
					backgroundImageUrl:
						'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1080&q=80',
					companyUrl: 'surtitodoideal.com',
				}}
			/>
		</>
	);
};