export default class CategoriaObtenerDTO{
    #id;
    #nombre;

    constructor(data){
        this.#id = data.id;
        this.#nombre = data.nombre;
    }

    set nombre(nombre){this.#nombre = nombre};
    get nombre(){return this.#nombre};

    get data (){
        return{
            id: this.#id,
            nombre: this.#nombre
        }
    }
}