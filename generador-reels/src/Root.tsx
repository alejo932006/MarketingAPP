import { Composition } from 'remotion';
import { PromoReel, promoSchema } from './Composition';
import { ReelElegante } from './Composition2';
import { TutorialReel } from './Tutorial';

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
		</>
	);
};