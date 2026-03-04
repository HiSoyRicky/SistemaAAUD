import React, { forwardRef } from "react";
import LogoIzquierda from "@/assets/images/LogoIzquierda.png";
import FranjaInferior from "@/assets/images/FranjaInferior.png";
import LogoDerecha from "@/assets/images/LogoDerecha.png";
import MarcaAgua from "@/assets/images/marca-agua.png";

const DeletePrint = forwardRef(function DeletePrint({ device = {}, fecha, setDevice, departments = [] }, ref) {

    return (
        <div
            ref={ref}
            className="relative bg-white"
            style={{
                width: "210mm",
                height: "297mm",
                fontFamily: "Arial, sans-serif",
            }}
        >

            {/* ==== FONDOS ==== */}

            <img
                src={MarcaAgua}
                alt="Marca Agua"
                style={{
                    position: "absolute",
                    top: "90mm",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "140mm",
                    opacity: 100,
                    zIndex: 0
                }}
            />

            <img
                src={LogoIzquierda}
                alt="Logo Izquierda"
                style={{
                    position: "absolute",
                    top: "15mm",
                    left: "20mm",
                    width: "80mm",
                    zIndex: 5
                }}
            />

            <img
                src={LogoDerecha}
                alt="Logo Derecha"
                style={{
                    position: "absolute",
                    top: "15mm",
                    right: "20mm",
                    width: "25mm",
                    zIndex: 5
                }}
            />

            <img
                src={FranjaInferior}
                alt="Franja"
                style={{
                    position: "absolute",
                    top: "270mm",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "180mm",
                    zIndex: 5
                }}
            />

            {/* ==== CONTENIDO ==== */}
            <div
                style={{
                    position: "relative",
                    zIndex: 10,
                    paddingTop: "35mm",
                    paddingLeft: "15mm",
                    paddingRight: "15mm",
                    paddingBottom: "30mm",
                }}
            >

                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <td colSpan="6" className="text-center">
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
                                style={{ height: "200px" }}
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
        </div>
    );
});

export default DeletePrint;