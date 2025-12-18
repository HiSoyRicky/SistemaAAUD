import React, { forwardRef } from "react";
import LogoGobienoNacional from "@/assets/images/LogoGobNacAAUD.png";

const DeletePrint = forwardRef(function DeletePrint({ device = {}, fecha, setDevice, departments = [] }, ref) {

    return (
        <div ref={ref} className="p-16 text-sm leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
            <table className="w-full border-collapse">
                <thead>
                    {/* Logos y encabezado */}
                    <tr>
                        <td colSpan="6" className="text-center">
                            <img
                                src={LogoGobienoNacional}
                                alt="Logo AAUDCPS"
                                className="mx-auto mb-2"
                                style={{ width: '450px', height: 'auto' }} />
                            <h2 className="mt-2 text-lg font-bold">AUTORIDAD DE ASEO URBANO Y DOMICILIARIO</h2>
                            <h3 className="mt-1 text-sm font-semibold leading-tight">UNIDAD DE INFORMÁTICA</h3>
                            <h3 className="mt-1 text-sm font-semibold leading-tight">INFORME TÉCNICO PARA DESCARTE DE EQUIPO INFORMÁTICO</h3>

                        </td>
                    </tr>
                </thead>
                <tbody>
                    {/* Fila de la fecha */}
                    <tr>
                        <td colSpan="5"></td>
                        <td className="pl-2">
                            <div className="flex justify-end">Fecha:</div>
                        </td>
                    </tr>

                    {/* Datos del traslado */}
                    <tr>
                        <td className="w-1/4 px-2 font-semibold border border-black">Dispositivo:</td>
                        <td colSpan="5" className="px-2 py-1 border border-black">{device.device_name || "N/A"}</td>
                    </tr>

                    <tr>
                        <td className="w-1/4 px-2 font-semibold border border-black">Marca:</td>
                        <td colSpan="5" className="px-2 py-1 border border-black">{device.brand_name || "N/A"}</td>
                    </tr>

                    <tr>
                        <td className="w-1/4 px-2 font-semibold border border-black">Modelo:</td>
                        <td colSpan="5" className="px-2 py-1 border border-black">{device.model_name || "N/A"}</td>
                    </tr>

                    <tr>
                        <td className="w-1/4 px-2 font-semibold border border-black">Serie:</td>
                        <td colSpan="5" className="px-2 py-1 border border-black">{device.serie || "N/A"}</td>
                    </tr>

                    <tr>
                        <td className="w-1/4 px-2 font-semibold border border-black">Marbete:</td>
                        <td colSpan="5" className="px-2 py-1 border border-black">{device.tag || "N/A"}</td>
                    </tr>

                    <tr>
                        <td 
                            colSpan="6"
                            className="p-2 font-semibold text-left align-top border border-black"
                            style={{ height: "250px" }}
                        >
                            Razón de descarte:
                        </td>
                    </tr>

                    {/* Espacio para firmas */}
                    <tr>
                        <td colSpan="3" className="pt-20 text-center">
                            _________________________
                        </td>
                        <td colSpan="3" className="pt-20 text-center">
                            _________________________
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="3" className="font-semibold text-center">
                            Firma del Jefe de Informática
                        </td>
                        <td colSpan="3" className="font-semibold text-center">
                            Firma de Jefa de Bienes
                        </td>
                    </tr>

                    {/* Firmas de Emisor y Receptor */}
                    <tr>
                        <td colSpan="3" className="pt-10 text-center">
                            _________________________
                        </td>
                    </tr>

                    <td colSpan="3" className="font-semibold text-center">
                        Firma del Técnico que Descarta
                    </td>

                </tbody>
            </table>
        </div>
    );
});

export default DeletePrint;