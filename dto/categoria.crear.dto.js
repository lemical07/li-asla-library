export default class CategoriaCrearDTO{
    #nombre;

    constructor(data){
        this.#nombre = data.nombre;
    }

    set nombre(nombre){this.#nombre = nombre};

    get nombre(){return this.#nombre};
}