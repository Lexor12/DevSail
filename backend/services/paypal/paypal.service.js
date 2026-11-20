//El service solo se comunica con la API de PayPal, las reglas de la compra las decide el controller
const {env} = require('../../config/env.js')
const BASE_URL = env.PAYPAL_BASE_URL

async function obtainToken() {
    //Aqui declaramos las credenciales que usaremos, estas son del Sandbox
    const clientID=env.paypal.clientId
    const secret=env.paypal.clientSecret//Estas son las claves que nos identifican como clientes, nosotros nos identificamos como clientes con PayPal (o sea como el negocio)
    //Las respuestas debemos acomodarlas dentro del cuerpo de la peticion en un formato adecuado
    const credentials = btoa(`${clientID}:${secret}`)//btoa es una funcion que convierte un string a base64, esto es necesario para la autenticacion con PayPal
    const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    if(!response.ok) {
        throw new Error(`Error de autenticación con PayPal:}`);
    }
    return data.access_token;
}

//Funcion para enviar peticiones a Paypal, recibe el endpoint, el metodo, el body
async function sendRequestToPayPal(endpoint, method, body) {
    const token =await obtainToken();
    //Primero hacemos la petición a PayPal con nuestros datos, y luego retornamos la respuesta
    const response=await fetch(`${BASE_URL}${endpoint}`, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        ...(body && { body: JSON.stringify(body) })
        //Si existe informacion en el body enviamos la informacion adjunta al cuerpo, en caso de que no, pues no enviamos nada
            //Este operador es un ternario y un condicional, si no tenemos nada en el cuerpo pues no hacemos nada
            //El parametro body es opcional, algunas peticiones requieren enviar un cuerpo o no, nosotros comprobamos indefinido
            //Usamos unedefined, pq al usar null pues en teoria si tiene un tipo de dato, y con unedefined es cuando directamente no se considera (cuando ni siquiera al llamar a la funcion usamos null) 
            /*
            La principal diferencia es que undefined significa que una variable fue declarada pero no tiene un valor asignado (lo hace JavaScript de forma automática), 
            mientras que null es un valor vacío que tú asignas a propósito para indicar que algo no tiene valor.
            */
        }
    )
    //Ahora que ya tenemos la respuesta, simplemente verificamos que exista y la retornamos
    const data=await response.json();//Aquí ejecutamos la solicitud, y obtenemos la respuesta en formato JSON
    if(!response.ok) {
        throw new Error(`Error en la solicitud a PayPal:`);//No enviamos el data del error pq no queremos que se filtre informacion sensible, como las credenciales de PayPal
    }
    return data
}

//Ahora que ya tenemos el método para enviar cualquier tipo de petición a PayPal, podemos crear funciones específicas para cada tipo de operación que queramos realizar, como crear una orden, capturar un pago, etc.
function createOrder(orderData) {//Simplemente creamos la orden, y damos la respuesta que incluye la url la cual se envia de vuelta al front para que el usuario pueda aprobar la compra, y una vez que el usuario apruebe la compra, se hace la captura del pago
    return sendRequestToPayPal('/v2/checkout/orders', 'POST', orderData);
}
function capturePayment(orderId) {//Este permite efectuar la compra una vez que el usuario ha aprobado la compra, este metodo captura el pago y lo transfiere a nuestra cuenta de PayPal
    return sendRequestToPayPal(`/v2/checkout/orders/${orderId}/capture`, 'POST');
}
function getOrderDetails(orderId) {//Este nos muestra valores de la compra
    return sendRequestToPayPal(`/v2/checkout/orders/${orderId}`, 'GET');
}
//Esta función permite hacer el reembolso de un pago, recibe el ID del pago y los datos del reembolso (como el monto a reembolsar), para en caso de una falla
function refundPayment(captureId, refundData) {
    return sendRequestToPayPal(`/v2/payments/captures/${captureId}/refund`, 'POST', refundData);
}
module.exports = {
    createOrder, capturePayment, getOrderDetails, refundPayment}