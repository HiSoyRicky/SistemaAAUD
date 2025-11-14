import React, { forwardRef } from "react";
import logoAAUD from '@/assets/images/AAUDCPS.png';

const TransferPrint = forwardRef(function TransferPrint({ device = {}, fecha, setDevice, departments = [] }, ref) {

    const transfiere = device.role === 'transfiere' ? device.userName : device.userTransfiere;
    const recibe = device.role === 'recibe' ? device.userName : device.userRecibe;

    return (
        <div ref={ref} className="p-16 text-sm leading-relaxed" style={{ fontFamily: 'Arial, sans-serif' }}>
            <table className="w-full border-collapse">
                <thead>

                    {/* Logos y encabezado */}
                    <tr>
                        <td colSpan="6" className="text-center">
                            {/* Agrega tus logos aquí. Asegúrate de tener las imágenes en tu carpeta 'public' o 'src' */}
                            <img
                                src={logoAAUD}
                                alt="Logo AAUDCPS"
                                className="mx-auto mb-2"
                                style={{ width: '450px', height: 'auto' }} />
                            <h2 className="mt-2 text-lg font-bold">AUTORIDAD DE ASEO URBANO Y DOMICILIARIO</h2>
                            <h3 className="mt-1 text-sm font-semibold leading-tight">UNIDAD DE INFORMÁTICA Y BIENES PATRIMONIALES</h3>
                            <h3 className="mt-1 text-sm font-semibold leading-tight">TRASLADO DE EQUIPO INFORMÁTICO</h3>

                        </td>
                    </tr>
                </thead>
                <tbody>

                    {/* Fila de la fecha */}
                    <tr>
                        <td colSpan="5"></td>
                        <td className="pl-2">
                            <div className="flex justify-end">Fecha: {fecha}</div>
                        </td>
                    </tr>

                    {/* Datos del traslado */}
                    <tr>
                        <td className="w-1/4 px-2 font-semibold border border-black">Unidad que transfiere:</td>
                        <td colSpan="5" className="px-2 py-1 border border-black">
                            {device.ubication_name ? `${device.ubication_name} / ${device.department_name}` : "N/A"}
                        </td>
                    </tr>

                    <tr>
                        <td className="w-1/4 px-2 font-semibold border border-black">
                            Unidad que recibe:
                        </td>
                        <td colSpan="5" className="px-2 py-1 border border-black">
                            {device.ubication_destino_name || "N/A"} / {device.department_destino_name || "N/A"}
                        </td>
                    </tr>


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
                        <td className="w-1/4 px-2 font-semibold border border-black">Condición del artículo:</td>
                        <td colSpan="5" className="px-2 py-1 border border-black">{device.status_name || "N/A"}</td>
                    </tr>

                    <tr>
                        <td className="w-1/4 px-2 font-semibold border border-black">Observación:</td>
                        <td colSpan="5" className="px-2 py-1 border border-black">{device.observation || "N/A"}</td>
                    </tr>

                    {/* Espacio para firmas */}
                    <tr>
                        <td colSpan="3" className="pt-16 text-center">
                            _________________________
                        </td>
                        <td colSpan="3" className="pt-16 text-center">
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
                        <td colSpan="3" className="pt-10 text-center">
                            _________________________
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="3" className="font-semibold text-center">
                            Firma del Emisor
                        </td>
                        <td colSpan="3" className="font-semibold text-center">
                            Firma del Receptor
                        </td>
                    </tr>

                    <tr>
                        <td colSpan="3" className="pt-10 text-center">
                            <div>{transfiere}</div>
                            <div>_________________________</div>
                        </td>
                        <td colSpan="3" className="pt-10 text-center">
                            <div>{recibe}</div>
                            <div>_________________________</div>
                        </td>
                    </tr>

                    <tr>
                        <td colSpan="3" className="font-semibold text-center">
                            {"Nombre del Emisor"}
                        </td>
                        <td colSpan="3" className="font-semibold text-center">
                            {"Nombre del Receptor"}
                        </td>
                    </tr>

                    {/* Nota legal */}
                    <tr>
                        <td colSpan="6" className="pt-10 text-xs text-justify">
                            <p>
                                <em>
                                    En cumplimiento a lo dispuesto en el Artículo 19 de nuestro Reglamento Interno, se recuerda lo siguiente:<br /><br />
                                    "El servidor público deberá tomar las precauciones necesarias a fin de evitar el deterioro,
                                    inutilización o destrucción del mobiliario y/o equipo que le sea asignado.
                                    El pago de los daños que sufra el mobiliario y/o equipo correrá por cuenta del servidor público,
                                    una vez se compruebe plenamente su responsabilidad por culpa o negligencia."
                                </em>
                            </p>
                        </td>
                    </tr>

                </tbody>
            </table>
        </div>
    );
});

export default TransferPrint;