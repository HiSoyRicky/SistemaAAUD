// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
    const currentYear = new Date().getFullYear(); // Para que el año se actualice automáticamente

    return (
        <footer className="p-6 mt-2 text-white bg-gray-800">
            <div className="container mx-auto text-center">
                <p className="text-sm">
                    &copy; {currentYear} AAUD. Todos los derechos reservados.
                </p>
                <div className="flex justify-center mt-4 space-x-6">
                    <Link to="https://www.aaud.gob.pa/" className="text-gray-400 transition-colors duration-200 hover:text-white">
                        Página Oficial
                    </Link>
                    <span className="text-gray-500">|</span>
                    <Link to="/" className="text-gray-400 transition-colors duration-200 hover:text-white"
                        title="Ricardo Vargas - Desarrollador"
                    >
                        HOME
                    </Link>
                    <span className="text-gray-500">|</span>
                    <Link to="https://www.aaud.gob.pa/index.asp?id=agencias" className="text-gray-400 transition-colors duration-200 hover:text-white">
                        Contacto
                    </Link>
                </div>
            </div>
        </footer>
    );
}

export default Footer;