// src/components/ChangePasswordForm.jsx
import React, { useState } from 'react';

function ChangePasswordForm({ userId, onLogout }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newPassword || !confirmPassword) {
            setError('Por favor, completa ambos campos');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            const response = await fetch(`/users/${userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Error al actualizar contraseña');
                return;
            }

            setSuccess('Contraseña actualizada correctamente');
            setNewPassword('');
            setConfirmPassword('');

            // Opcional: forzar logout para que vuelva a loguearse con la nueva contraseña
            if (onLogout) {
                setTimeout(() => {
                    onLogout();
                }, 2000);
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 300 }}>
            <h3>Cambiar contraseña</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <div>
                <label>Nueva contraseña</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Confirmar nueva contraseña</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Actualizar contraseña</button>
        </form>
    );
}

export default ChangePasswordForm;
