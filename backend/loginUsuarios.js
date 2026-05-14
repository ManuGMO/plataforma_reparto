// Archivo: loginUsuarios.js
// Ejecutar en consola con: node loginUsuarios.js
import fs from 'fs';

async function renovarTokensJMeter() {
    const totalUsuarios = 300;
    // Iniciamos la primera línea del CSV con los encabezados
    const lineasCsv = ["id_usuario, token"];

    console.log(`Iniciando login de ${totalUsuarios} usuarios para renovar tokens...`);
    for (let i = 1; i <= totalUsuarios; i++) {
        const correo = `test_comprador_${i}@correo.com`;
        const clave = `12345`; // Contraseña por defecto

        try {
            // Hacer Login para obtener su token y su id
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

            // Extraer la data
            const token = dataLogin.token;
            const id_usuario = dataLogin.user.id;

            // Guardarlo en la fila del CSV
            lineasCsv.push(`${id_usuario},${token}`);
            console.log(`Usuario ${i}/${totalUsuarios} logueado exitosamente.`);

        } catch (error) {
            console.error(`Error en el login del usuario ${i}:`, error.message);
        }
    }

    // Al terminar, guardamos todo en el archivo CSV sobreescribiéndolo
    fs.writeFileSync('usuarios_jmeter.csv', lineasCsv.join('\n'));
    console.log('¡Listo! Archivo "usuarios_jmeter.csv" actualizado exitosamente con los nuevos tokens.');
}

renovarTokensJMeter();
