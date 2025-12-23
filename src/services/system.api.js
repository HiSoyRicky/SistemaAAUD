import axios from 'axios';
import { API_BASE_URL } from '@/shared/config/apiBaseUrl';

export const getSystemVersion = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/system/version`);
    return res.data;
};
