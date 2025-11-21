function VizualizarPsw(checkboxId, inputs) {
    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;

    let elems = [];

    if (typeof inputs === 'string') {
        // si se pasa "id" sin # lo tratamos como id único
        if (/^[A-Za-z0-9_-]+$/.test(inputs)) {
            const el = document.getElementById(inputs);
            if (el) elems.push(el);
        } else {
            elems = Array.from(document.querySelectorAll(inputs));
        }
    } else if (Array.isArray(inputs)) {
        elems = inputs.map(id => document.getElementById(id)).filter(Boolean);
    }

    const tipo = checkbox.checked ? 'text' : 'password';
    elems.forEach(el => el.type = tipo);
}
