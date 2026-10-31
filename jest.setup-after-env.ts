/* Configuración que necesita el entorno de Jest (afterAll, timeouts). */
import { configure } from '@testing-library/react-native';
import { flushStorage } from '@/store/throttledStorage';

// Margen para pruebas asíncronas en máquinas de CI lentas (evita pruebas intermitentes).
configure({ asyncUtilTimeout: 5000 });
jest.setTimeout(20000);

// Completa la escritura agrupada pendiente para que Jest termine limpio.
afterAll(async () => {
  await flushStorage();
});
