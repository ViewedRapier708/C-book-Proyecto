const { getSupportClient } = require('./src/config/supportDb');
const supabase = getSupportClient();

const adminSoporte = {
  nombre: 'Administrador Soporte',
  email: 'administradordelsoportedecbook@gmail.com',
  password: 'SupportAdm',
  telefono: null,
  boleta: '9999999999',
  rol: 'support_admin',
};

async function buscarUspuarioAuthPorEmail(email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Error buscando usuario en Auth: ${error.message}`);
    }

    const usuario = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (usuario) {
      return usuario;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page++;
  }
}

async function crearAdminSoporte() {
  const email = adminSoporte.email;

  let usuarioAuth = await buscarUsuarioAuthPorEmail(email);
  let authCreadoPorScript = false;

  if (!usuarioAuth) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: adminSoporte.password,
      email_confirm: true,
      user_metadata: {
        full_name: adminSoporte.nombre,
        role: adminSoporte.rol,
        source: 'cbook_support',
      },
      app_metadata: {
        support_role: adminSoporte.rol,
      },
    });

    if (error) {
      throw new Error(`Error creando usuario en Auth: ${error.message}`);
    }

    usuarioAuth = data.user;
    authCreadoPorScript = true;
    console.log('Usuario creado en Supabase Auth');
  } else {
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(usuarioAuth.id, {
      user_metadata: {
        full_name: adminSoporte.nombre,
        role: adminSoporte.rol,
        source: 'cbook_support',
      },
      app_metadata: {
        support_role: adminSoporte.rol,
      },
    });

    if (updateAuthError) {
      throw new Error(`Error actualizando metadata del usuario Auth: ${updateAuthError.message}`);
    }

    console.log('El usuario ya existe en Supabase Auth (metadata actualizada)');
  }

  const { data: perfilExistente, error: perfilError } = await supabase
    .from('support_profiles')
    .select('user_id,email,role,status')
    .eq('user_id', usuarioAuth.id)
    .maybeSingle();

  if (perfilError) {
    throw new Error(`Error verificando support_profiles: ${perfilError.message}`);
  }

  if (perfilExistente) {
    const { data, error } = await supabase
      .from('support_profiles')
      .update({
        full_name: adminSoporte.nombre,
        email,
        phone: adminSoporte.telefono,
        boleta: adminSoporte.boleta,
        role: 'support_admin',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', usuarioAuth.id)
      .select('user_id,full_name,email,phone,boleta,role,status,created_at,updated_at')
      .single();

    if (error) {
      throw new Error(`Error actualizando perfil de soporte: ${error.message}`);
    }

    console.log('Administrador de soporte actualizado correctamente');
    console.log(data);
    return;
  }

  const { data, error } = await supabase
    .from('support_profiles')
    .insert({
      user_id: usuarioAuth.id,
      full_name: adminSoporte.nombre,
      email,
      phone: adminSoporte.telefono,
      boleta: adminSoporte.boleta,
      role: 'support_admin',
      status: 'active',
      created_by: usuarioAuth.id,
    })
    .select('user_id,full_name,email,phone,boleta,role,status,created_at,updated_at')
    .single();

  if (error) {
    if (authCreadoPorScript) {
      await supabase.auth.admin.deleteUser(usuarioAuth.id).catch(() => {});
    }

    throw new Error(`Error insertando en support_profiles: ${error.message}`);
  }

  console.log('Administrador de soporte creado correctamente');
  console.log(data);
}

crearAdminSoporte().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
