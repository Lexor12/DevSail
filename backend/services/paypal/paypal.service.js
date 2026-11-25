//El service solo habla con la API de PayPal, las reglas de la compra las decide el controller
const {env} = require('../../config/env.js')
const BASE_URL = env.paypal.baseUrl
async function obtainToken() {
    //Estas credenciales son las del Sandbox
    const clientID=env.paypal.clientId
    const secret=env.paypal.clientSecret//Estas claves nos identifican ante PayPal como el negocio
    //Hay que mandar las credenciales en el formato que pide PayPal
    const credentials = btoa(`${clientID}:${secret}`)//btoa convierte el texto a base64, PayPal lo pide para autenticar
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

//Manda peticiones a PayPal, recibe el endpoint, el metodo y el body
async function sendRequestToPayPal(endpoint, method, body) {
    const token =await obtainToken();
    //Hacemos la peticion con nuestros datos y regresamos la respuesta
    const response=await fetch(`${BASE_URL}${endpoint}`, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        ...(body && { body: JSON.stringify(body) })
        //Si hay body lo mandamos en la peticion y si no, no mandamos nada
            //El body es opcional porque no todas las peticiones lo necesitan
            //Usamos undefined porque null en teoria si es un valor, undefined es cuando ni siquiera se manda
        }
    )
    //Ya con la respuesta solo revisamos que este bien y la regresamos
    const data=await response.json();//Leemos la respuesta en JSON
    if(!response.ok) {
        throw new Error(`Error en la solicitud a PayPal:`);//No mandamos el detalle del error para que no se filtren credenciales de PayPal
    }
    return data
}

//Con ese metodo ya podemos hacer funciones para cada operacion, como crear una orden o cobrarla
function createOrder(orderData) {//Crea la orden y la respuesta trae el enlace para que el usuario apruebe la compra
    return sendRequestToPayPal('/v2/checkout/orders', 'POST', orderData);
}
function capturePayment(orderId) {//Cobra la orden ya aprobada y pasa el dinero a nuestra cuenta
    return sendRequestToPayPal(`/v2/checkout/orders/${orderId}/capture`, 'POST');
}
function getOrderDetails(orderId) {//Muestra los datos de la compra
    return sendRequestToPayPal(`/v2/checkout/orders/${orderId}`, 'GET');
}
//Reembolsa un pago en caso de que algo falle
function refundPayment(captureId, refundData) {
    return sendRequestToPayPal(`/v2/payments/captures/${captureId}/refund`, 'POST', refundData);
}
module.exports = {
    createOrder, capturePayment, getOrderDetails, refundPayment}