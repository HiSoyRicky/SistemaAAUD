// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
    const currentYear = new Date().getFullYear(); // Para que el año se actualice automáticamente

    return (
        <footer className="bg-gray-800 text-white p-6 mt-2">
            <div className="container mx-auto text-center">
                <p className="text-sm">
                    &copy; {currentYear} AAUD. Todos los derechos reservados.
                </p>
                <div className="mt-4 flex justify-center space-x-6">
                    <Link to="https://www.aaud.gob.pa/" className="text-gray-400 hover:text-white transition-colors duration-200">
                        Página Oficial
                    </Link>
                    <span className="text-gray-500">|</span>
                    <Link to="/" className="text-gray-400 hover:text-white transition-colors duration-200"
                        title="Ricardo Vargas - Desarrollador"
                    >
                        Términos de Servicio
                    </Link>
                    <span className="text-gray-500">|</span>
                    <Link to="https://www.aaud.gob.pa/index.asp?id=agencias" className="text-gray-400 hover:text-white transition-colors duration-200">
                        Contacto
                    </Link>
                </div>
            </div>
        </footer>
    );
}

export default Footer;