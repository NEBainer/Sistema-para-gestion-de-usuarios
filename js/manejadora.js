let usuarios = [];
//Bandera para cuando estoy editando usuarios
let idUsuarioEditando = null;

//Creacion de constantes para la manipulacion del html
const botonAgregar = document.getElementById("botonAgregar");

const tbodyUsuarios = document.getElementById("tbodyUsuarios");

const formularioUsuarios = document.getElementById("formUsuario");

const contenedorAlertas = document.getElementById("contenedorAlertas");

const spinner = document.getElementById("spinner");

const btnExportarCSV = document.getElementById("btnExportarCSV");

//CARGAMOS LISTA DE USUARIOS
obtenerUsuarios();

async function obtenerUsuarios() {

    //INTENTAMOS CARGARLA DESDE EL LOCALSTORAGE
    try {

        mostrarSpinner();
        const usuariosGuardados =
            localStorage.getItem("usuarios");

        if (usuariosGuardados !== null) {

            usuarios = JSON.parse(usuariosGuardados);
        
        //SI NO HAY NADA, TRAEMOS LA LISTA DESDE LA API
        } else {

            const respuesta = await fetch(
                "https://jsonplaceholder.typicode.com/users"
            );

            if (!respuesta.ok) {
                throw new Error(
                    `Error HTTP: ${respuesta.status}`
                );
            }

            usuarios = await respuesta.json();

            localStorage.setItem(
                "usuarios",
                JSON.stringify(usuarios)
            );

        }
        //RENDERIZAMOS LOS USUARIOS EN LA PANTALLA
        renderizarUsuarios(usuarios);

    }

    catch(error) {
        console.error(error);
        alert(error.message);
    }

    finally{
        ocultarSpinner();
    }

}

//FUNCION PARA LAS ALERTAS
function mostrarAlerta(mensaje,tipo){

    contenedorAlertas.innerHTML = `
        <div class="alert alert-${tipo}">
            ${mensaje}
        </div>
    `;

    setTimeout(() => {

        contenedorAlertas.innerHTML = "";

    }, 3000);

}

//FUNCION QUE RENDERIZA LOS USUARIOS EN LA PAGINA
function renderizarUsuarios(usuarios){
    tbodyUsuarios.innerHTML = "";

    usuarios.forEach(usuario => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.name}</td>
            <td>${usuario.username}</td>
            <td>${usuario.email}</td>
            <td>${usuario.phone}</td>
            <td>${usuario.address.city}</td>
            <td>${usuario.company.name}</td>
            <td>
                <button class="btn btn-warning btn-editar" data-id="${usuario.id}">
                    Editar
                </button>

                <button class="btn btn-danger btn-eliminar"  data-id="${usuario.id}">
                    Eliminar
                </button>
            </td>
            `;

        tbodyUsuarios.appendChild(fila);
    })
}

//BLOQUE PARA AGREGAR UN NUEVO USUARIO
formularioUsuarios.addEventListener("submit", manejarSubmit);

async function manejarSubmit(evento){
    evento.preventDefault();
    const formData = new FormData(formularioUsuarios);
    const datos = Object.fromEntries(formData);
    if(!validarCampos(datos)){
        return;
    }
    
    if(idUsuarioEditando === null){
        try{
            mostrarSpinner();
            const usuarioCreado = await crearUsuario(datos);
            //Para que no tenga el mismo ID
            const nuevoId = Math.max(...usuarios.map(u => u.id)) + 1; 
            usuarioCreado.id = nuevoId;

            //PARA QUE NO EXPLOTE CUANDO CREAMOS UN USUARIO
            usuarioCreado.address = {
                city: "-"
            };
            usuarioCreado.company = {
                name: "-"
            };

            usuarios.push(usuarioCreado);

            localStorage.setItem("usuarios", JSON.stringify(usuarios));

            renderizarUsuarios(usuarios);

            mostrarAlerta("Usuario agregado correctamente", "success");

            formularioUsuarios.reset();

            console.log(usuarioCreado);
            }

        catch(error){
            console.error(error);
            alert(error.message);
        }

        finally{
        ocultarSpinner();
        }

    } else {
        try{
            mostrarSpinner();
            console.log("ID:", idUsuarioEditando);
            console.log("Datos:", datos);
            // JSONPlaceholder devuelve error con IDs creados localmente
            if(idUsuarioEditando <= 10){
                const usuarioActualizado = await actualizarUsuario(idUsuarioEditando,datos);
                console.log(usuarioActualizado);
            }
        
            const indice = usuarios.findIndex( usuario => usuario.id === idUsuarioEditando);

            if(indice !== -1){
                usuarios[indice] = {
                    ...usuarios[indice],
                    ...datos
                };
            }
            

            localStorage.setItem("usuarios",JSON.stringify(usuarios));

            renderizarUsuarios(usuarios);

            mostrarAlerta("Usuario actualizado correctamente", "warning");

            idUsuarioEditando = null;

            botonAgregar.textContent = "Agregar Usuario";

            formularioUsuarios.reset();

        }

        catch(error){
            console.error(error);
            alert(error.message);
        }

        finally{
        ocultarSpinner();
        }

    }
    
}

//FUNCION PARA VALIDAR CAMPOS

function validarCampos(datos){
    if(!datos.name.trim() || !datos.username.trim() || !datos.email.trim() || !datos.phone.trim()){
        mostrarAlerta("Todos los campos son obligatorios", "danger");
        return false;
    } return true;
};

//FUNCION ASINCRONA PARA CREAR EL USUARIO EN LA API
async function crearUsuario(usuario){

    const respuesta = await fetch(
        "https://jsonplaceholder.typicode.com/users",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(usuario)
        }
    );

    if(!respuesta.ok){
        throw new Error(
            `Error HTTP: ${respuesta.status}`
        );
    }

    return await respuesta.json();
}

//BLOQUE DE ELIMINACION Y MODIFICACION
tbodyUsuarios.addEventListener("click", manejarClickTabla);

function manejarClickTabla(event){

    if(event.target.classList.contains("btn-eliminar")){
        eliminarUsuario(event);
    }

    if(event.target.classList.contains("btn-editar")){
        editarUsuario(event);
    }

}

//FUNCIONES PARA ELIMINAR USUARIOS
async function eliminarUsuario(event){

    const id = Number(event.target.dataset.id);

    if(confirmarEliminacion(id)){

        try{

            mostrarSpinner();

            if(id <= 10){

                await fetch(
                    `https://jsonplaceholder.typicode.com/users/${id}`,
                    {
                        method: "DELETE"
                    }
                );

            }

            usuarios = usuarios.filter(
                usuario => usuario.id !== id
            );

            localStorage.setItem(
                "usuarios",
                JSON.stringify(usuarios)
            );

            renderizarUsuarios(usuarios);

            mostrarAlerta(
                "Usuario eliminado correctamente",
                "danger"
            );

        }
        catch(error){

            console.error(error);

        }
        finally{

            ocultarSpinner();

        }

    }

}

function confirmarEliminacion(idAEliminar){
    
    return confirm(`Seguro que desea eliminar al usuario ${idAEliminar}?`)
}

//FUNCIONES PARA EDITAR USUARIOS
function editarUsuario(event){
    const id = Number(event.target.dataset.id);
    const usuario = usuarios.find(usuario => usuario.id === id);
    document.getElementById("name").value = usuario.name;

    document.getElementById("username").value = usuario.username;

    document.getElementById("email").value = usuario.email;

    document.getElementById("phone").value = usuario.phone;

    idUsuarioEditando = id;

    botonAgregar.textContent = "Actualizar Usuario";

    console.log(usuario);
}

async function actualizarUsuario(id, usuario){

    console.log(id);
    console.log(usuario);

    const respuesta = await fetch(
        `https://jsonplaceholder.typicode.com/users/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(usuario)
        }
    );

    if(!respuesta.ok){
        throw new Error(
            `Error HTTP: ${respuesta.status}`
        );
    }

    return await respuesta.json();
}

//FUNCIONES PARA SPINNER
function mostrarSpinner(){
    spinner.classList.remove("d-none");
}

function ocultarSpinner(){
    spinner.classList.add("d-none");
}

//EVENTO PARA EXPORTAR CSV
btnExportarCSV.addEventListener("click",exportarCSV);

function exportarCSV(){

    let csv ="ID;Nombre;Usuario;Email;Telefono;Ciudad;Empresa\n";

    usuarios.forEach(usuario => {

        csv +=
            `"${usuario.id}";` +
            `"${usuario.name}";` +
            `"${usuario.username}";` +
            `"${usuario.email}";` +
            `"${usuario.phone}";` +
            `"${usuario.address.city}";` +
            `"${usuario.company.name}"\n`;

    });

    const blob =
        new Blob(
            [csv],
            { type: "text/csv" }
        );

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = url;

    enlace.download = "usuarios.csv";

    enlace.click();

    URL.revokeObjectURL(url);

}
