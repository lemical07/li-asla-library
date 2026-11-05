export default class LibroCrearDTO {
    #isbn;
    #titulo;
    #categoria_id;
    #fecha_publicacion;
    #precio;
    #autores_ids;

    constructor(data) {
        this.#isbn = data.isbn;
        this.#titulo = data.titulo;
        this.#categoria_id = data.categoria_id;
        this.#fecha_publicacion = data.fecha_publicacion || null;
        this.#precio = data.precio;
        this.#autores_ids = data.autores_ids || [];
    }

    get isbn() {
        return this.#isbn;
    }

    get titulo() {
        return this.#titulo;
    }

    get categoria_id() {
        return this.#categoria_id;
    }

    get fecha_publicacion() {
        return this.#fecha_publicacion;
    }

    get precio() {
        return this.#precio;
    }

    get autores_ids() {
        return this.#autores_ids;
    }
}