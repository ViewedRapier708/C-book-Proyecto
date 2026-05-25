const assert = require('node:assert/strict');
const path = require('node:path');

async function testCorreoConfirmadoEnSupabaseCreaUsuarioAunqueTengaFlagNodemailer() {
  const controllerPath = path.resolve(__dirname, '../controllers/ControladorUsuario.js');
  const modeloUsuarioPath = path.resolve(__dirname, '../models/ModeloUsuario.js');
  const modeloSoportePath = path.resolve(__dirname, '../models/ModeloSoporte.js');

  let createPayload = null;

  delete require.cache[controllerPath];
  require.cache[modeloUsuarioPath] = {
    id: modeloUsuarioPath,
    filename: modeloUsuarioPath,
    loaded: true,
    exports: {
      validarBoletaEnTabla: async () => ({ respuesta: false }),
      validarCorreoEnTabla: async () => false,
      registrarEnAuth: async () => ({ success: true }),
      crearUsuarioEnTabla: async (boleta, correo) => {
        createPayload = { boleta, correo };
        return { success: true };
      },
      verificarConfirmacionPorBoleta: async () => ({
        confirmado: true,
        correo: 'alumno@alumno.ipn.mx',
        usuario: {
          user_metadata: {
            boleta: '2023630001',
            pending_nodemailer_confirmation: true
          }
        }
      }),
      confirmarRegistroConToken: async () => ({ success: false }),
      confirmarRegistroConAccessToken: async () => ({ success: false }),
      buscarCorreoPorBoleta: async () => ({ success: false }),
      loginConAuth: async () => ({ success: false }),
      traerUsuarioInfo: async () => ({ success: false }),
      revocarSesionesSupabase: async () => ({ success: true }),
      cambiarContrasenaRecovery: async () => ({ success: true }),
      CambioCorreo: async () => ({ success: true }),
      actualizarContrasenaConToken: async () => ({ success: true }),
      actualizarContrasenaPropia: async () => ({ success: true })
    }
  };
  require.cache[modeloSoportePath] = {
    id: modeloSoportePath,
    filename: modeloSoportePath,
    loaded: true,
    exports: {
      revocarSesionSoporte: async () => ({ success: true }),
      loginSoporte: async () => {
        throw new Error('no soporte');
      }
    }
  };

  const { verificarCorreo } = require(controllerPath);
  let statusCode = null;
  let jsonPayload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  await verificarCorreo({
    body: {
      boleta: '2023630001',
      correo: 'Alumno@alumno.ipn.mx'
    }
  }, res);

  assert.equal(statusCode, 200);
  assert.equal(jsonPayload.confirmado, true);
  assert.deepEqual(createPayload, {
    boleta: '2023630001',
    correo: 'alumno@alumno.ipn.mx'
  });
}

testCorreoConfirmadoEnSupabaseCreaUsuarioAunqueTengaFlagNodemailer()
  .then(() => {
    console.log('verificarLegacySupabasePendingFlag.test.js OK');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
