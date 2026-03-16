// src/hooks/useInventoryData.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useInventoryData() {
    const [departments, setDepartments] = useState([]);
    const [ubications, setUbications] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [depRes, ubiRes, devicesRes, brandsRes, modelsRes, statusesRes] = await Promise.all([
                    axios.get(`/api/departments`),
                    axios.get(`/api/ubications`),
                    axios.get(`/api/devices`),
                    axios.get(`/api/brands`),
                    axios.get(`/api/models`),
                    axios.get(`/api/status`),
                ]);
                setDepartments(depRes.data);
                setUbications(ubiRes.data);
                setDevices(devicesRes.data);
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

    return { departments, ubications, devices,brands, models, statuses, loading };
}
