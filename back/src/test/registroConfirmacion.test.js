const assert = require('node:assert/strict');
const path = require('node:path');

async function testRegistroNoConfirmaAuthAntesDelClick() {
  const modeloPath = path.resolve(__dirname, '../models/ModeloUsuario.js');
  const dbPath = path.resolve(__dirname, '../config/db.js');
  const mailPath = path.resolve(__dirname, '../utils/servicioCorreo.js');

  let signUpPayload = null;
  const supabaseMock = {
    auth: {
      signUp: async (payload) => {
        signUpPayload = payload;
        return {
          data: {
            user: {
              id: 'auth-user-id',
              email: payload.email,
              user_metadata: payload.options.data
            }
          },
          error: null
        };
      }
    }
  };

  delete require.cache[modeloPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { getClient: () => supabaseMock }
  };
  require.cache[mailPath] = {
    id: mailPath,
    filename: mailPath,
    loaded: true,
    exports: { enviarCorreo: async () => ({ success: true }) }
  };

  const { registrarEnAuth } = require(modeloPath);
  const resultado = await registrarEnAuth('2023630001', 'Alumno@alumno.ipn.mx', 'Password!');

  assert.equal(resultado.success, true);
  assert.equal(signUpPayload.email, 'Alumno@alumno.ipn.mx');
  assert.equal(signUpPayload.options.emailRedirectTo, 'http://localhost:5173/verificar');
  assert.equal(
    Object.prototype.hasOwnProperty.call(signUpPayload, 'email_confirm'),
    false,
    'El registro inicial no debe confirmar automaticamente el correo en Auth'
  );
  assert.equal(signUpPayload.options.data.boleta, '2023630001');
  assert.equal(signUpPayload.options.data.rol, 'alumno');
}

testRegistroNoConfirmaAuthAntesDelClick()
  .then(() => {
    console.log('registroConfirmacion.test.js OK');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
