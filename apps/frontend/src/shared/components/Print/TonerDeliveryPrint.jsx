import React, { forwardRef } from "react";
import LogoIzquierda from "@/assets/images/LogoIzquierda.png";
import FranjaInferior from "@/assets/images/FranjaInferior.png";
import LogoDerecha from "@/assets/images/LogoDerecha.png";
import MarcaAgua from "@/assets/images/marca-agua.png";
import { formatDateToDDMMYYYY } from '../../utils/formatDate';

const colorMap = {
    BLACK: "NEGRO",
    CYAN: "CIAN",
    MAGENTA: "MAGENTA",
    YELLOW: "AMARILLO",
};

const TonerDeliveryPrint = forwardRef(function TonerDeliveryPrint(
    { movement = {}, fecha },
    ref
) {
    const printerBrand = movement?.toner?.models?.brands?.name || "N/A";
    const printerModel = movement?.toner?.models?.name || "N/A";
    const receiverName = movement?.receiver_name || "N/A";
    const technicianName = movement?.user?.nombre_completo || "N/A";
    const tonerColor = colorMap[movement?.toner?.color] || movement?.toner?.color || "N/A";
    const printDate =
        fecha ||
        (movement?.created_at
            ? formatDateToDDMMYYYY(movement.created_at, "-")
            : formatDateToDDMMYYYY(new Date(), "-"));

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
                                <h2 className="mt-2 text-lg font-bold">
                                    AUTORIDAD DE ASEO URBANO Y DOMICILIARIO
                                </h2>
                                <h3 className="mt-1 text-sm font-semibold leading-tight">
                                    UNIDAD DE INFORMÁTICA
                                </h3>
                                <h3 className="mt-1 text-sm font-semibold leading-tight">
                                    ENTREGA DE TÓNER
                                </h3>
                            </td>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td colSpan="5" />
                            <td className="pl-2 text-right">Fecha: {printDate}</td>
                        </tr>

                        <tr>
                            <td className="w-1/4 px-2 font-semibold border border-black">
                                Ubicación:
                            </td>
                            <td colSpan="5" className="px-2 py-1 border border-black">
                                {movement?.ubication?.name || "N/A"}
                            </td>
                        </tr>

                        <tr>
                            <td className="w-1/4 px-2 font-semibold border border-black">
                                Departamento:
                            </td>
                            <td colSpan="5" className="px-2 py-1 border border-black">
                                {movement?.department?.name || "N/A"}
                            </td>
                        </tr>

                        <tr>
                            <td className="w-1/4 px-2 font-semibold border border-black">
                                Impresora:
                            </td>
                            <td colSpan="5" className="px-2 py-1 border border-black">
                                {`${printerBrand} / ${printerModel}`}
                            </td>
                        </tr>

                        <tr>
                            <td className="w-1/4 px-2 font-semibold border border-black">
                                Modelo del tóner:
                            </td>
                            <td colSpan="5" className="px-2 py-1 border border-black">
                                {movement?.toner?.toner_model || "N/A"}
                            </td>
                        </tr>

                        <tr>
                            <td className="w-1/4 px-2 font-semibold border border-black">Color:</td>
                            <td colSpan="5" className="px-2 py-1 border border-black">
                                {tonerColor}
                            </td>
                        </tr>

                        <tr>
                            <td className="w-1/4 px-2 font-semibold border border-black">Cantidad:</td>
                            <td colSpan="5" className="px-2 py-1 border border-black">
                                {movement?.quantity ?? "N/A"}
                            </td>
                        </tr>

                        <tr>
                            <td className="w-1/4 px-2 font-semibold border border-black">
                                Observación:
                            </td>
                            <td colSpan="5" className="px-2 py-1 border border-black">
                                {movement?.reference || "N/A"}
                            </td>
                        </tr>

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
                                Firma de la persona que retira
                            </td>
                            <td colSpan="3" className="font-semibold text-center">
                                Firma del técnico
                            </td>
                        </tr>

                        <tr>
                            <td colSpan="3" className="pt-8 text-center">
                                <div>{receiverName}</div>
                                <div>_________________________</div>
                            </td>
                            <td colSpan="3" className="pt-8 text-center">
                                <div>{technicianName}</div>
                                <div>_________________________</div>
                            </td>
                        </tr>

                        <tr>
                            <td colSpan="3" className="font-semibold text-center">
                                Nombre de la persona que retira
                            </td>
                            <td colSpan="3" className="font-semibold text-center">
                                Nombre del técnico
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default TonerDeliveryPrint;
