// src/utils/getWindowsUser.js
export const getWindowsUser = async () => {
    try {
        const res = await fetch(`${API_URL}/api/whoami`, {
            credentials: 'include'
        });
        const data = await res.json();
        return data.username || '';
    } catch (err) {
        console.error('Error al obtener usuario de red:', err);
        return '';
    }
};
