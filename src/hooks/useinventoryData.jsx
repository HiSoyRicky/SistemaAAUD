// src/hooks/useInventoryData.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useInventoryData() {
    const [departments, setDepartments] = useState([]);
    const [ubications, setUbications] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [depRes, ubiRes, brandsRes, modelsRes, statusesRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/departments`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/ubications`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/brands`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/models`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/statuses`),
                ]);
                setDepartments(depRes.data);
                setUbications(ubiRes.data);
                setBrands(brandsRes.data);
                setModels(modelsRes.data);
                setStatuses(statusesRes.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return { departments, ubications, brands, models, statuses, loading };
}
