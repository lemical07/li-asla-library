export default class UsuarioObtenerDTO {
    #id;
    #identificacion;
    #nombre;
    #apellido;
    #telefono;
    #direccion;
    #email;
    #rol;
    #activo;
    #creado_en;
    #actualizado_en;

    constructor(data) {
        this.#id = data.id;
        this.#identificacion = data.identificacion;
        this.#nombre = data.nombre;
        this.#apellido = data.apellido;
        this.#telefono = data.telefono || null;
        this.#direccion = data.direccion || null;
        this.#email = data.email;
        this.#rol = data.rol;
        this.#activo = Boolean(data.activo);
        this.#creado_en = data.creado_en;
        this.#actualizado_en = data.actualizado_en;
    }

    get data() {
        return {
            id: this.#id,
            identificacion: this.#identificacion,
            nombre: this.#nombre,
            apellido: this.#apellido,
            telefono: this.#telefono,
            direccion: this.#direccion,
            email: this.#email,
            rol: this.#rol,
            activo: this.#activo,
            creado_en: this.#creado_en,
            actualizado_en: this.#actualizado_en
        };
    }
}