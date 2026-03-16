export const mapLoginUser = (user) => ({
  id: user.id,
  username: user.username,
  nombre_completo: user.nombre_completo,
  id_rol: user.id_rol,
  role_name: user.roles?.name || null,
  must_change_password: Boolean(user.must_change_password)
});

export const mapRegisterUser = (user) => ({
  id: user.id,
  username: user.username,
  nombre_completo: user.nombre_completo,
  id_rol: user.id_rol,
  active: user.active
});

export const mapRegisterResponse = (user) => ({
  mensaje: 'Usuario registrado exitosamente',
  usuario: mapRegisterUser(user)
});

export const mapLoginResponse = (user, token) => ({
  mensaje: 'Login exitoso',
  usuario: mapLoginUser(user),
  token
});
