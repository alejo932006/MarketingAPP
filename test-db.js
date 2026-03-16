// test-api.js
async function probarApi() {
    try {
        console.log('⏳ Conectando a la API de Surtitodo...');
        
        // Hacemos una petición directa a tu servidor web
        const response = await fetch('https://api.surtitodoideal.com/api/products');
        const productos = await response.json();
        
        console.log(`✅ ¡Conexión exitosa! Se descargaron ${productos.length} productos.`);
        
        // Vamos a mostrar solo los primeros 3 para comprobar
        const muestra = productos.slice(0, 3).map(p => ({
            id: p.id_producto,
            nombre: p.nombre,
            precio: p.precio_venta_final,
            imagen: p.proimagenurl
        }));

        console.table(muestra);
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

probarApi();