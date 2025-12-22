// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '@/app/providers/AuthContext';

export default function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
