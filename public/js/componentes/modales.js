export const abrirModal = (contenido, alEnviar) => {
    const modal = document.getElementById('modal-principal');
    const cuerpo = document.getElementById('contenido-modal');
    if (!modal || !cuerpo) {
        return null;
    }
    cuerpo.innerHTML = `<div class="modal-contenido">${contenido}</div>`;
    modal.showModal();
    if (alEnviar) {
        cuerpo.querySelector('form')?.addEventListener('submit', alEnviar);
    }
    return modal;
};

export const cerrarModal = () => {
    document.getElementById('modal-principal')?.close();
};
