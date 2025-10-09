// openrouteservice-js exports the client as the default export. Import it directly.
import Openrouteservice from 'openrouteservice-js';

// Leer la API key desde variables de entorno (recomendado). Si no existe, usar el valor embebido.
const ORS_API_KEY = process.env.ORS_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ5ZTI3YTE4YjdhNzRlZDM5YTk4MWRhOTA5NWJiMjI5IiwiaCI6Im11cm11cjY0In0=';

// openrouteservice-js exports an object with classes. Instanciar las clases necesarias.
const Directions = Openrouteservice.Directions;
const Optimization = Openrouteservice.Optimization;

const directionsClient = new Directions({ api_key: ORS_API_KEY });
const optimizationClient = new Optimization({ api_key: ORS_API_KEY });

// Calcular ruta entre vendedor y cliente
export const calcularRuta = async (origenLat, origenLng, destinoLat, destinoLng) => {
  try {
    const response = await directionsClient.calculate({
      coordinates: [
        [origenLng, origenLat],
        [destinoLng, destinoLat]
      ],
      profile: 'driving-car',
      format: 'json'
    });

    return {
      distancia: response.routes[0].summary.distance, // metros
      duracion: response.routes[0].summary.duration, // segundos
      geometria: response.routes[0].geometry
    };
  } catch (error) {
    console.error('Error calculando ruta:', error);
    throw error;
  }
};

// Optimizar ruta para múltiples entregas (repartidor)
export const optimizarRutaMultiple = async (puntos) => {
  try {
    const response = await optimizationClient.optimize({
      jobs: puntos.map((p, i) => ({
        id: p.id_pedido,
        location: [p.longitud, p.latitud],
        service: 300 // 5 minutos por entrega
      })),
      vehicles: [{
        id: 1,
        start: [puntos[0].longitud, puntos[0].latitud],
        end: [puntos[0].longitud, puntos[0].latitud]
      }]
    });

    // La respuesta de optimization puede variar; devolver las rutas si existen
    return response.routes?.[0]?.steps || response; 
  } catch (error) {
    console.error('Error optimizando ruta:', error);
    throw error;
  }
};