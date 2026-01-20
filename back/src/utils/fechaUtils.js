const TIME_ZONE_MEXICO = 'America/Mexico_City';
const ZONA_MEXICO_LABEL = 'Hora de México (CDT/CST)';

function obtenerFechaMexico(fecha = new Date()) {
    if (!fecha) return new Date();
    const base = fecha instanceof Date ? fecha : new Date(fecha);
    return new Date(base.toLocaleString('en-US', { timeZone: TIME_ZONE_MEXICO }));
}

function agregarDiasHabiles(fecha, dias = 1) {
    const resultado = obtenerFechaMexico(fecha);
    let restantes = Math.max(Number(dias) || 0, 0);

    while (restantes > 0) {
        resultado.setDate(resultado.getDate() + 1);
        const diaSemana = resultado.getDay();
        const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
        if (!esFinDeSemana) {
            restantes -= 1;
        }
    }

    return resultado;
}

function formatearFechaMexico(fecha) {
    if (!fecha) return '-';
    const base = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(base.getTime())) return '-';

    const texto = base.toLocaleString('es-MX', {
        timeZone: TIME_ZONE_MEXICO,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return `${texto} ${ZONA_MEXICO_LABEL}`;
}

module.exports = {
    TIME_ZONE_MEXICO,
    ZONA_MEXICO_LABEL,
    obtenerFechaMexico,
    agregarDiasHabiles,
    formatearFechaMexico
};