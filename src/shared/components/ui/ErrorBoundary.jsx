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
            <div className="p-3 min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="border-0 shadow-lg card" style={{ maxWidth: 760, width: "100%" }}>
                    <div className="p-4 card-body p-md-5">
                        <div className="gap-3 d-flex align-items-start">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: 44, height: 44, background: "rgba(220,53,69,0.12)" }}
                                aria-hidden="true"
                            >
                                <span style={{ fontSize: 22 }}>⚠️</span>
                            </div>

                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <div className="flex-wrap gap-2 d-flex align-items-center justify-content-between">
                                    <h1 className="mb-0 h4">Algo salió mal</h1>
                                    <span className="badge text-bg-danger">
                                        {errorId ? `ID: ${errorId}` : "Error"}
                                    </span>
                                </div>

                                <p className="mt-2 mb-0 text-secondary">
                                    La aplicación encontró un error inesperado. Puedes recargar o copiar los detalles
                                    para depurarlo más rápido.
                                </p>

                                <div className="mt-3 mb-0 alert alert-danger" role="alert">
                                    <div className="fw-semibold">Mensaje:</div>
                                    <div className="mt-1">{error?.message || "Error desconocido"}</div>
                                </div>

                                <div className="flex-wrap gap-2 mt-4 d-flex">
                                    <button className="btn btn-danger" onClick={() => window.location.reload()}>
                                        Recargar
                                    </button>
                                    <button className="btn btn-outline-secondary" onClick={() => window.history.back()}>
                                        Volver atrás
                                    </button>
                                    <button className="btn btn-outline-primary" onClick={this.copyDetails}>
                                        {copied ? "Copiado ✅" : "Copiar detalles"}
                                    </button>
                                    <button className="btn btn-link ms-auto" onClick={this.reset}>
                                        Intentar continuar
                                    </button>
                                </div>

                                <hr className="my-4" />

                                <details>
                                    <summary className="fw-semibold" style={{ cursor: "pointer" }}>
                                        Ver detalles técnicos
                                    </summary>

                                    <div className="mt-3">
                                        <div className="row g-3">
                                            <div className="col-12 col-md-6">
                                                <div className="mb-1 small text-secondary">Tipo</div>
                                                <div className="font-monospace">{error?.name || "N/A"}</div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="mb-1 small text-secondary">Ruta</div>
                                                <div className="font-monospace text-truncate">
                                                    {window.location.pathname}
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="mb-1 small text-secondary">Stack</div>
                                                <pre
                                                    className="p-3 mb-0 border rounded bg-body-tertiary w-100"
                                                    style={{
                                                        maxHeight: 220,
                                                        overflow: "auto",
                                                        whiteSpace: "pre-wrap",      // ✅ envuelve líneas
                                                        wordBreak: "break-word",     // ✅ corta palabras largas
                                                        overflowWrap: "anywhere",    // ✅ corta URLs sin espacios
                                                    }}
                                                >
                                                    {error?.stack || "N/A"}
                                                </pre>
                                            </div>

                                            <div className="col-12">
                                                <div className="mb-1 small text-secondary">Component stack (React)</div>
                                                <pre
                                                    className="p-3 mb-0 border rounded bg-body-tertiary w-100"
                                                    style={{
                                                        maxHeight: 220,
                                                        overflow: "auto",
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

                                <div className="mt-4 text-secondary small">
                                    Tip rápido: si ves <span className="font-monospace">.find is not a function</span>,
                                    revisa que el valor sea un <b>array</b> antes de llamar{" "}
                                    <span className="font-monospace">find()</span>.
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
