import React, { Component } from "react";

class ErrorBoundary extends Component {
    state = {
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        copied: false,
    };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random()
            .toString(36)
            .slice(2, 7)
            .toUpperCase()}`;

        console.error("ErrorBoundary capturó:", error);
        console.error("Info:", errorInfo);

        this.setState({ errorInfo, errorId });
    }

    reset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            copied: false,
        });
    };

    copyDetails = async () => {
        const { error, errorInfo, errorId } = this.state;

        const details = [
            `ErrorId: ${errorId || "N/A"}`,
            `Message: ${error?.message || "N/A"}`,
            `Name: ${error?.name || "N/A"}`,
            `Stack:\n${error?.stack || "N/A"}`,
            `ComponentStack:\n${errorInfo?.componentStack || "N/A"}`,
            `URL: ${window.location.href}`,
            `UserAgent: ${navigator.userAgent}`,
            `Time: ${new Date().toISOString()}`,
        ].join("\n\n");

        try {
            await navigator.clipboard.writeText(details);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 1500);
        } catch (e) {
            console.warn("No se pudo copiar al portapapeles:", e);
        }
    };

    render() {
        const { hasError, error, errorInfo, errorId, copied } = this.state;

        if (!hasError) return this.props.children;

        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-3">
                <div className="w-full max-w-[760px] rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="p-4 md:p-5">
                        <div className="flex items-start gap-3">
                            <div
                                className="flex h-11 w-11 items-center justify-center rounded-full"
                                style={{ width: 44, height: 44, background: "rgba(220,53,69,0.12)" }}
                                aria-hidden="true"
                            >
                                <span style={{ fontSize: 22 }}>⚠️</span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h1 className="mb-0 text-xl font-bold text-slate-900">Algo salió mal</h1>
                                    <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                                        {errorId ? `ID: ${errorId}` : "Error"}
                                    </span>
                                </div>

                                <p className="mb-0 mt-2 text-sm text-slate-600">
                                    La aplicación encontró un error inesperado. Puedes recargar o copiar los detalles
                                    para depurarlo más rápido.
                                </p>

                                <div className="mb-0 mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800" role="alert">
                                    <div className="font-semibold">Mensaje:</div>
                                    <div className="mt-1 text-sm">{error?.message || "Error desconocido"}</div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                                        onClick={() => window.location.reload()}
                                    >
                                        Recargar
                                    </button>
                                    <button
                                        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                        onClick={() => window.history.back()}
                                    >
                                        Volver atrás
                                    </button>
                                    <button
                                        className="rounded-md border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                                        onClick={this.copyDetails}
                                    >
                                        {copied ? "Copiado ✅" : "Copiar detalles"}
                                    </button>
                                    <button
                                        className="ml-auto rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                        onClick={this.reset}
                                    >
                                        Intentar continuar
                                    </button>
                                </div>

                                <hr className="my-4 border-slate-200" />

                                <details>
                                    <summary className="cursor-pointer font-semibold text-slate-800">
                                        Ver detalles técnicos
                                    </summary>

                                    <div className="mt-3">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div>
                                                <div className="mb-1 text-xs text-slate-500">Tipo</div>
                                                <div className="font-mono text-sm text-slate-800">{error?.name || "N/A"}</div>
                                            </div>
                                            <div>
                                                <div className="mb-1 text-xs text-slate-500">Ruta</div>
                                                <div className="truncate font-mono text-sm text-slate-800">
                                                    {window.location.pathname}
                                                </div>
                                            </div>

                                            <div className="md:col-span-2">
                                                <div className="mb-1 text-xs text-slate-500">Stack</div>
                                                <pre
                                                    className="mb-0 w-full overflow-auto rounded border border-slate-200 bg-slate-100 p-3 text-xs text-slate-800"
                                                    style={{
                                                        maxHeight: 220,
                                                        whiteSpace: "pre-wrap",
                                                        wordBreak: "break-word",
                                                        overflowWrap: "anywhere",
                                                    }}
                                                >
                                                    {error?.stack || "N/A"}
                                                </pre>
                                            </div>

                                        </div>
                                    </div>
                                </details>

                                <div className="mt-4 text-xs text-slate-600">
                                    Tip rápido: si ves <span className="font-mono">.find is not a function</span>,
                                    revisa que el valor sea un <b>array</b> antes de llamar{" "}
                                    <span className="font-mono">find()</span>.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
