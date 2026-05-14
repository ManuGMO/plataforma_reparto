// Archivo: generarRepartidores.js
// Ejecutar en consola con: node generarRepartidores.js
import fs from 'fs';

async function generarRepartidoresJMeter() {
    const totalUsuarios = 50;
    const lineasCsv = ["id_repartidor,token"];
    const urlBase = 'http://localhost:3001/api';

    console.log(`🚀 Iniciando generación de ${totalUsuarios} repartidores...`);

    for (let i = 1; i <= totalUsuarios; i++) {
        const nombre = `test_repartidor_${i}`;
        const correo = `test_repartidor_${i}@correo.com`;
        const clave = `12345`;

        try {
            // PASO 1: Registrar al repartidor (userType = 'driver' basado en tu authController)
            await fetch(`${urlBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, contraseña: clave, userType: 'driver' })
            });

            // PASO 2: Hacer Login para obtener su token y su ID
            const respuestaLogin = await fetch(`${urlBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contraseña: clave })
            });

            const dataLogin = await respuestaLogin.json();
            if (!respuestaLogin.ok) {
                console.error(`❌ Login fallido para repartidor ${i}:`, dataLogin);
                continue;
            }

            const token = dataLogin.token;
            const id_repartidor = dataLogin.user.id;

            console.log(`token: ${token}`, `id_repartidor: ${id_repartidor}`);

            // PASO 3: Crear una ruta activa para el repartidor (¡Vital para el test GET!)
            // Usamos coordenadas genéricas, puedes ajustarlas si tus pedidos están en otra ciudad


            const respuestaRuta = await fetch(`${urlBase}/rutas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_usuario: id_repartidor,
                    nombre_ruta: "Ruta Testing General",
                    origen: "Punto A",
                    origen_lat: -33.0000, // Latitud (cambiar si tus pedidos están lejos)
                    origen_lng: -70.0000, // Longitud
                    destino: "Punto B",
                    destino_lat: -34.7000,
                    destino_lng: -58.5000,
                    hora_inicio: "00:00",
                    hora_fin: "23:59",
                    dia: 'jueves',
                    ruta_geojson: null
                })
            });

            if (!respuestaRuta.ok) {
                const errorRuta = await respuestaRuta.json();
                console.error(`⚠️ Advertencia: No se pudo crear ruta para repartidor ${i}:`, errorRuta);
            }

            // PASO 4: Guardarlo en el CSV para JMeter
            lineasCsv.push(`${id_repartidor},${token}`);
            console.log(`✅ Repartidor ${i}/${totalUsuarios} generado exitosamente con ruta activa.`);

        } catch (error) {
            console.error(`❌ Error inesperado en repartidor ${i}:`, error.message);
        }
    }

    // Guardar el CSV
    fs.writeFileSync('repartidores_get.csv', lineasCsv.join('\n'));
    console.log('\n--- PROCESO TERMINADO ---');
    console.log('📂 Archivo "repartidores_get.csv" creado exitosamente para cargar en JMeter.');

}

generarRepartidoresJMeter();
