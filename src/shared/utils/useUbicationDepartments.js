// src/hooks/useUbicactionDepartments.js
import { useEffect, useState } from 'react';
import axios from 'axios';


export const useUbicationDepartments = () => {
    const [ubications, setUbications] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);
    const [selectedUbication, setSelectedUbication] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Cargar ubicaciones
    useEffect(() => {
        axios.get(`/api/ubications`)
            .then(res => setUbications(res.data))
            .catch(err => console.error('Error cargando ubicaciones:', err));
    }, []);

    // Cargar todos los departamentos
    useEffect(() => {
        axios.get(`/api/departments`)
            .then(res => {
                const data = res.data;

                // Ajusta esto según cómo responda tu backend
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data.departments)
                        ? data.departments
                        : Array.isArray(data.data)
                            ? data.data
                            : [];

                setAllDepartments(list);
            })
            .catch(err => {
                console.error('Error cargando departamentos:', err);
                setAllDepartments([]); // evitar que quede undefined o algo raro
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

        const idUbi = parseInt(selectedUbication);

        const filtered = allDepartments
            .filter(dep => dep && dep.id_ubication === idUbi);

        setDepartments(filtered);
        setSelectedDepartment(null);
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
