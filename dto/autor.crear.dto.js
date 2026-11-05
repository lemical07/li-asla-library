export default class AutorCrearDTO{
    #nombre;

    constructor(data){
        this.#nombre = data.nombre;
    }

    set nombre(nombre){this.#nombre = nombre};

    get nombre(){return this.#nombre};
}