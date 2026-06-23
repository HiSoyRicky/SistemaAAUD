import React, { forwardRef } from "react";
import LogoIzquierda from "@/assets/images/LogoIzquierda.png";
import FranjaInferior from "@/assets/images/FranjaInferior.png";
import LogoDerecha from "@/assets/images/LogoDerecha.png";
import MarcaAgua from "@/assets/images/marca-agua.png";

const TransferPrint = forwardRef(function TransferPrint({ device = {}, fecha, setDevice, departments = [] }, ref) {

    const transfiere = device.role === 'transfiere' ? device.userName : device.userTransfiere;
    const recibe = device.role === 'recibe' ? device.userName : device.userRecibe;

    return (
        <div
            ref={ref}
            className="relative bg-white"
            style={{
                width: "210mm",
                height: "290mm",
                fontFamily: "Arial, sans-serif",
            }}
        >

            {/*FONDOS*/}

            <img
                src={MarcaAgua}
                alt="Marca Agua"
                style={{
                    position: "absolute",
                    top: "90mm",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "140mm",
                    opacity: 1,
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
                    width: "150mm",
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
                            <td className="w-1/4 px-2 font-semibold border border-black">Usuario asignado:</td>
                            <td colSpan="5" className="px-2 py-1 border border-black">{device.userRecibe || "N/A"}</td>
                        </tr>

                        <tr>
                            <td className="w-1/4 px-2 font-semibold border border-black">Observación:</td>
                            <td colSpan="5" className="px-2 py-1 border border-black">{device.observation}</td>
                        </tr>

                        {/* Firmas superiores */}
                        <tr>
                            <td colSpan="3" style={{ paddingTop: "10mm", textAlign: "center" }}>
                                <div style={{ marginBottom: "3mm" }}>__________________________</div>
                                <div style={{ fontWeight: 600, fontSize: "10pt" }}>
                                    Firma del Jefe de Informática
                                </div>
                            </td>

                            <td colSpan="3" style={{ paddingTop: "10mm", textAlign: "center" }}>
                                <div style={{ marginBottom: "3mm" }}>__________________________</div>
                                <div style={{ fontWeight: 600, fontSize: "10pt" }}>
                                    Firma de Jefa de Bienes
                                </div>
                            </td>
                        </tr>

                        {/* Firmas Emisor / Receptor */}
                        <tr>
                            <td colSpan="3" style={{ paddingTop: "8mm", textAlign: "center" }}>
                                <div style={{ marginBottom: "3mm" }}>__________________________</div>
                                <div style={{ fontWeight: 600, fontSize: "10pt" }}>
                                    Firma del Emisor
                                </div>
                            </td>

                            <td colSpan="3" style={{ paddingTop: "8mm", textAlign: "center" }}>
                                <div style={{ marginBottom: "3mm" }}>__________________________</div>
                                <div style={{ fontWeight: 600, fontSize: "10pt" }}>
                                    Firma del Receptor
                                </div>
                            </td>
                        </tr>

                        {/* Nombres */}
                        <tr>
                            <td colSpan="3" style={{ paddingTop: "6mm", textAlign: "center" }}>
                                <div style={{ marginBottom: "2mm" }}>{transfiere || ""}</div>
                                <div>__________________________</div>
                                <div style={{ fontWeight: 600, marginTop: "2mm", fontSize: "10pt" }}>
                                    Nombre del Emisor
                                </div>
                            </td>

                            <td colSpan="3" style={{ paddingTop: "6mm", textAlign: "center" }}>
                                <div style={{ marginBottom: "2mm" }}>{recibe || ""}</div>
                                <div>__________________________</div>
                                <div style={{ fontWeight: 600, marginTop: "2mm", fontSize: "10pt" }}>
                                    Nombre del Receptor
                                </div>
                            </td>
                        </tr>

                        {/* Nota legal */}
                        <tr>
                            <td colSpan="6" className="pt-5 text-xs text-justify">
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
        </div>
    );
});

export default TransferPrint;