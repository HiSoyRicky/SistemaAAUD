// src/hooks/useInventoryData.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl.js';

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
                    axios.get(`${API_BASE_URL}/api/departments`),
                    axios.get(`${API_BASE_URL}/api/ubications`),
                    axios.get(`${API_BASE_URL}/api/devices`),
                    axios.get(`${API_BASE_URL}/api/brands`),
                    axios.get(`${API_BASE_URL}/api/models`),
                    axios.get(`${API_BASE_URL}/api/statuses`),
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
