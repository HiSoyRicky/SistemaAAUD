import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as repository from './auth.repository.js';
import * as validator from './auth.validator.js';
import * as dto from './auth.dto.js';
import AppError from '../../common/utils/AppError.js';

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está definido");
  }
  return process.env.JWT_SECRET;
}

export class AuthServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AuthServiceError';
    this.statusCode = statusCode;
  }
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

export const register = async (payload) => {
  try {
    const validated = await validator.validateRegisterPayload(payload);
    const usernameNormalized = normalizeUsername(validated.username);
    const roleId = Number(validated.id_rol);

    const roleExists = await repository.findRoleById(roleId);
    if (!roleExists) {
      throw new AuthServiceError('Rol inválido', 400);
    }

    const existingUser = await repository.findUserByUsername(usernameNormalized);
    if (existingUser) {
      throw new AuthServiceError('El usuario ya existe', 409);
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const createdUser = await repository.createUser({
      username: usernameNormalized,
      password: hashedPassword,
      nombre_completo: validated.nombre_completo.trim(),
      id_rol: roleId,
      active: true,
      must_change_password: true
    });

    return dto.mapRegisterResponse(createdUser);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    if (error instanceof AppError) {
      throw new AuthServiceError(error.message, error.statusCode || 400);
    }

    if (error?.code === '23505' || error?.code === 'P2002') {
      throw new AuthServiceError('El usuario ya existe', 409);
    }

    throw new AuthServiceError('Error al registrar', 500);
  }
};

export const login = async (payload) => {
  try {
    const validated = await validator.validateLoginPayload(payload);
    const usernameNormalized = normalizeUsername(validated.username);

    const user = await repository.findActiveUserWithRoleByUsername(
      usernameNormalized
    );

    if (!user) {
      throw new AuthServiceError('Credenciales inválidas', 401);
    }

    const isPasswordValid = await bcrypt.compare(validated.password, user.password);
    if (!isPasswordValid) {
      throw new AuthServiceError('Contraseña incorrecta', 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.roles.name,
        roleId: user.id_rol,
        mustChangePassword: Boolean(user.must_change_password)
      },
      getJwtSecret(),
      { expiresIn: '60m' }
    );

    return dto.mapLoginResponse(user, token);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    if (error instanceof AppError) {
      throw new AuthServiceError(error.message, error.statusCode || 400);
    }

    throw new AuthServiceError('Error del servidor', 500);
  }
};