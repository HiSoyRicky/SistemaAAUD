// departments.dto.js

export const mapDepartment = (dept) => {
  return {
    id: dept.id,
    name: dept.name,
    id_ubication: dept.id_ubication,
    ubication_name: dept.ubications?.name || null,
  };
};

export const mapCreateDepartmentResponse = (created) => {
  return {
    message: 'Departamento creado',
    created,
  };
};

export const mapUpdateDepartmentResponse = (updated) => {
  return {
    message: 'Departamento actualizado',
    updated,
  };
};

export const mapDeleteDepartmentResponse = (data) => {
  return {
    success: true,
    message: 'Departamento eliminado',
    data,
  };
};
