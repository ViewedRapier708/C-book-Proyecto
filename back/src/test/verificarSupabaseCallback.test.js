const assert = require('node:assert/strict');
const path = require('node:path');

async function testCreaUsuarioDesdeAccessTokenConfirmado() {
  const modeloPath = path.resolve(__dirname, '../models/ModeloUsuario.js');
  const dbPath = path.resolve(__dirname, '../config/db.js');

  let insertedRows = null;

  const supabaseMock = {
    auth: {
      getUser: async (accessToken) => {
        assert.equal(accessToken, 'supabase-access-token');
        return {
          data: {
            user: {
              id: 'auth-user-id',
              email: 'Alumno@alumno.ipn.mx',
              email_confirmed_at: '2026-05-25T18:00:00.000Z',
              user_metadata: {
                boleta: '2023630001',
                rol: 'alumno'
              }
            }
          },
          error: null
        };
      }
    },
    from(table) {
      if (table === 'boletas') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { boleta: 2023630001 }, error: null })
            })
          })
        };
      }

      if (table === 'usuarios_web_movil') {
        return {
          select: () => ({
            eq: (_column, value) => ({
              maybeSingle: async () => {
                assert.ok(['2023630001', 'alumno@alumno.ipn.mx'].includes(String(value).toLowerCase()));
                return { data: null, error: null };
              }
            })
          }),
          insert: (rows) => {
            insertedRows = rows;
            return {
              select: async () => ({ data: rows, error: null })
            };
          }
        };
      }

      throw new Error(`Tabla inesperada: ${table}`);
    }
  };

  delete require.cache[modeloPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { getClient: () => supabaseMock }
  };

  const { confirmarRegistroConAccessToken } = require(modeloPath);
  const resultado = await confirmarRegistroConAccessToken('supabase-access-token');

  assert.equal(resultado.success, true);
  assert.deepEqual(insertedRows, [{
    boleta: 2023630001,
    correo: 'alumno@alumno.ipn.mx',
    tiene_documentos: false
  }]);
}

testCreaUsuarioDesdeAccessTokenConfirmado()
  .then(() => {
    console.log('verificarSupabaseCallback.test.js OK');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
