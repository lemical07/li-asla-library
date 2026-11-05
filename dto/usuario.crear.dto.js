export default class UsuarioCrearDTO{
    #identificacion;
    #nombre;
    #apellido;
    #telefono;
    #direccion;
    #email;
    #contrasena;

    constructor (data){
        this.#identificacion = data.identificacion;
        this.#nombre = data.nombre;
        this.#apellido = data.apellido;
        this.#telefono = data.telefono || null;
        this.#direccion = data.direccion || null;
        this.#email = data.email;
        this.#contrasena = data.contrasena;
    }

    set identificacion(id){this.#identificacion = id};
    set nombre(nombre){this.#nombre = nombre};
    set apellido(apellido){this.#apellido = apellido};
    set telefono(telefono){this.#telefono = telefono};
    set direccion(direccion){this.#direccion = direccion};
    set email(email){this.#email = email};
    set contrasena(contrasena){this.#contrasena = contrasena};

    get identificacion(){return this.#identificacion};
    get nombre(){return this.#nombre};
    get apellido(){return this.#apellido};
    get telefono(){return this.#telefono};
    get direccion(){return this.#direccion};
    get email(){return this.#email};
    get contrasena(){return this.#contrasena};
}