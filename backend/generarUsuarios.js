// Archivo: generarUsuarios.js
// Ejecutar en consola con: node generarUsuarios.js
import fs from 'fs';


async function poblarUsuariosJMeter() {
    const totalUsuarios = 300;
    // Iniciamos la primera línea del CSV con los encabezados
    const lineasCsv = ["id_usuario, token"];
    const lineasCredencialesCsv = ["correo, contraseña"]; // Nuevo CSV para el frontend

    console.log(`Iniciando generación de ${totalUsuarios} usuarios...`);
    for (let i = 1; i <= totalUsuarios; i++) {
        // 1. Datos falsos de cada usuario
        const nombre = `test_comprador_${i}`;
        const correo = `test_comprador_${i}@correo.com`;
        const clave = `12345`; // tu contraseña por defecto

        try {
            // PASO 1: Registrar al usuario (Ajusta la ruta de tu registro)
            // Descomenta y ajusta si los usuarios no existen todavía

            await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, contraseña: clave, userType: 'buyer' }) // Asumiendo que "buyer" es Comprador
            });

            // PASO 2: Hacer Login para obtener su token y su id (Ajusta tu ruta de login)
            const respuestaLogin = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: correo, contraseña: clave })
            });


            const dataLogin = await respuestaLogin.json();

            if (!respuestaLogin.ok) {
                console.error(`Login fallido para usuario ${i}:`, dataLogin);
                continue;
            }

            // PASO 3: Extraer la data (Ajusta aquí según la estructura de tu JSON de respuesta)
            // La API devuelve: { token: "...", user: { id: 45, ... } }
            const token = dataLogin.token;
            const id_usuario = dataLogin.user.id; // Modificado para coincidir con el controlador de login
            // PASO 4: Guardarlo en la fila del CSV
            lineasCsv.push(`${id_usuario},${token}`);
            lineasCredencialesCsv.push(`${correo},${clave}`); // Guardar credenciales
            console.log(`Usuario ${i}/${totalUsuarios} generado exitosamente.`);

        } catch (error) {
            console.error(`Error en usuario ${i}:`, error.message);
        }
    }

    // Al terminar, guardamos todo en un archivo CSV en el mismo directorio
    fs.writeFileSync('usuarios_jmeter.csv', lineasCsv.join('\n'));
    fs.writeFileSync('credenciales_usuarios.csv', lineasCredencialesCsv.join('\n'));
    console.log('¡Listo! Archivos "usuarios_jmeter.csv" y "credenciales_usuarios.csv" creados exitosamente.');
}
poblarUsuariosJMeter();