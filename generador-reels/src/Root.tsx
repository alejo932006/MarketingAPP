import { Composition } from 'remotion';
import { PromoReel, promoSchema } from './Composition';

export const RemotionRoot: React.FC = () => {
	
	const datosSimulados = {
		companyUrl: 'surtitodoideal.com', 
		productos: [
			{
				productName: 'Pan Tajado Bimbo 400g',
				imageUrl: 'https://api.surtitodoideal.com/static/icon.png',
				precio: '5.200',
			},
			{
				productName: 'Arepas de Maíz Ricampo x 10',
				imageUrl: 'https://surtitodoideal.com/7f498de1-fb56-4ce2-b2dc-404a582d6427.png',
				precio: '3.868',
			},
			{
				productName: 'Leche Deslactosada Alquería',
				imageUrl: 'https://api.surtitodoideal.com/static/icon.png',
				precio: '4.500',
			},
			{
				productName: 'Huevos Tipo A x 30',
				imageUrl: 'https://surtitodoideal.com/7f498de1-fb56-4ce2-b2dc-404a582d6427.png',
				precio: '18.900',
			}
		]
	};

	const duracionPorProducto = 120; // 2 segundos
	const duracionTotalVideo = datosSimulados.productos.length * duracionPorProducto;

	return (
		<>
			<Composition
				id="PromoReel"
				component={PromoReel}
				durationInFrames={duracionTotalVideo} 
				fps={60}
				width={1080}
				height={1920}
				schema={promoSchema}
				defaultProps={datosSimulados} 
			/>
		</>
	);
};