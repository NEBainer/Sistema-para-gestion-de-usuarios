const formulario = document.getElementById("formulario");

formulario.addEventListener("submit", (e)=>{
    e.preventDefault();

    const formData = new FormData(formulario);
    const datos = Object.fromEntries(formData);
    crearUsuario(datos);
})

async function crearUsuario(usuario) {
    try{
        const respuesta = await fetch("https://jsonplaceholder.typicode.com/userrrrs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(usuario),
        });
        if(!respuesta.ok){
            throw new Error(`Error HTTP: ${respuesta.status}` 
            );
        }

        const usuarios = await respuesta.json();
        console.log(usuarios);
        alert("Usuario creado, sos un crack!")

    }

    catch(error){
        console.error(error);
        alert(error.message);
    }
   

    
    
}