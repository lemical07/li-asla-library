export default class LibroObtenerDTO {
    #id;
    #isbn;
    #titulo;
    #categoriaId;
    #categoria;
    #fechaPublicacion;
    #precio;
    #autores;
    #stockVenta;
    #ejemplaresDisponibles;
    #creadoEn;
    #actualizadoEn;

    constructor(datos) {
        this.#id = datos.id;
        this.#isbn = datos.isbn;
        this.#titulo = datos.titulo;
        this.#categoriaId = datos.categoria_id;
        this.#categoria = datos.categoria;
        this.#fechaPublicacion = datos.fecha_publicacion || null;
        this.#precio = datos.precio;
        this.#autores = datos.autores || [];
        this.#stockVenta = datos.stock_venta ?? 0;
        this.#ejemplaresDisponibles = datos.ejemplares_disponibles ?? 0;
        this.#creadoEn = datos.creado_en;
        this.#actualizadoEn = datos.actualizado_en;
    }

    get data() {
        return {
            id: this.#id,
            isbn: this.#isbn,
            titulo: this.#titulo,
            categoria_id: this.#categoriaId,
            categoria: this.#categoria,
            fecha_publicacion: this.#fechaPublicacion,
            precio: this.#precio,
            autores: this.#autores,
            stock_venta: this.#stockVenta,
            ejemplares_disponibles: this.#ejemplaresDisponibles,
            creado_en: this.#creadoEn,
            actualizado_en: this.#actualizadoEn
        };
    }
}
