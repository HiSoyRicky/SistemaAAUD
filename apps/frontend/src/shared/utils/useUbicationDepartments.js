// useUbicationDepartments.js

import { useEffect, useState } from 'react';
import api from '../api/apiClient';

export const useUbicationDepartments = () => {
  const [ubications, setUbications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [selectedUbication, setSelectedUbication] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Cargar ubicaciones
  useEffect(() => {
    api
      .get('/api/ubications')
      .then((res) => {
        const data = res.data;

        if (Array.isArray(data)) {
          setUbications(data);
        } else if (Array.isArray(data?.ubications)) {
          setUbications(data.ubications);
        } else if (Array.isArray(data?.data)) {
          setUbications(data.data);
        } else {
          setUbications([]);
        }
      })
      .catch((err) => {
        console.error('Error cargando ubicaciones:', err);
        setUbications([]);
      });
  }, []);

  // Cargar todos los departamentos
  useEffect(() => {
    api
      .get('/api/departments')
      .then((res) => {
        const data = res.data;

        let list = [];

        if (Array.isArray(data)) {
          list = data;
        } else if (Array.isArray(data?.departments)) {
          list = data.departments;
        } else if (Array.isArray(data?.data)) {
          list = data.data;
        }

        setAllDepartments(list);
      })
      .catch((err) => {
        console.error('Error cargando departamentos:', err);
        setAllDepartments([]);
      });
  }, []);

  // Filtrar departamentos según la ubicación seleccionada
  useEffect(() => {
    if (!selectedUbication) {
      setDepartments([]);
      setSelectedDepartment(null);
      return;
    }

    if (!Array.isArray(allDepartments)) {
      console.error('allDepartments no es un array:', allDepartments);
      setDepartments([]);
      setSelectedDepartment(null);
      return;
    }

    const idUbi = Number(selectedUbication);

    const filtered = allDepartments.filter((dep) => {
      const departmentUbicationId =
        dep?.dep?.id_ubication ?? dep?.id_ubication ?? dep?.ubication?.id;

      return Number(departmentUbicationId) === idUbi;
    });

    setDepartments(filtered);
    setSelectedDepartment(null);
  }, [selectedUbication, allDepartments]);

  return {
    ubications,
    departments,
    selectedUbication,
    selectedDepartment,
    setSelectedUbication,
    setSelectedDepartment,
  };
};
