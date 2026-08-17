// users.dto.js

function mapCreateUserResponse(user) {
  return {
    id: user.id,
    message: 'Usuario creado correctamente',
  };
}

function mapUpdateUserResponse(user) {
  return {
    id: user.id,
    message: 'Usuario actualizado correctamente',
  };
}

function mapUpdatePasswordResponse() {
  return {
    message: 'Contraseña actualizada correctamente',
  };
}

function mapDeleteUserResponse(user) {
  return {
    message: 'Usuario eliminado correctamente',
    user,
  };
}

export {
  mapCreateUserResponse,
  mapDeleteUserResponse,
  mapUpdatePasswordResponse,
  mapUpdateUserResponse,
};
