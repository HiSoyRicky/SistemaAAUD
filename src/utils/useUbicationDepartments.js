// src/hooks/useUbicactionDepartments.js
import { useEffect, useState } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export const useUbicationDepartments = () => {
    const [ubications, setUbications] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);
    const [selectedUbication, setSelectedUbication] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Cargar ubicaciones
    useEffect(() => {
        axios.get(`${API_URL}/api/ubications`)
            .then(res => setUbications(res.data))
            .catch(err => console.error('Error cargando ubicaciones:', err));
    }, []);

    // Cargar todos los departamentos
    useEffect(() => {
        axios.get(`${API_URL}/api/departments`)
            .then(res => setAllDepartments(res.data))
            .catch(err => console.error('Error cargando departamentos:', err));
    }, []);

    // Filtrar departamentos según la ubicación seleccionada
    useEffect(() => {
        if (selectedUbication) {
            const filtered = allDepartments.filter(
                dep => dep.id_ubication === parseInt(selectedUbication)
            );
            setDepartments(filtered);
            // Si la ubicación cambia, resetear departamento seleccionado
            setSelectedDepartment(null);
        } else {
            setDepartments([]);
            setSelectedDepartment(null);
        }
    }, [selectedUbication, allDepartments]);

    return {
        ubications,
        departments,
        selectedUbication,
        selectedDepartment,
        setSelectedUbication,
        setSelectedDepartment
    };
};
