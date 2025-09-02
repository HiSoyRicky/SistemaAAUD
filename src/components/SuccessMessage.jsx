// src/components/SuccessMessage.jsx
import React from 'react';

function SuccessMessage({ message, type }) {
    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
    const textColor = type === 'success' ? 'text-green-700' : 'text-red-700';

    return (
        <div className={`${bgColor} ${textColor} p-4 rounded mb-4`}>
            {message}
        </div>
    );
}

export default SuccessMessage;