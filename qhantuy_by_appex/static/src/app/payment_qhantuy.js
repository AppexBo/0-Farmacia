/** @odoo-module */

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup"
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup"
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

patch(PaymentScreen.prototype, {
    async setup() {   
        console.log("inserted data");     
        super.setup(...arguments);
        const insert_listener = false;
        const qr_painted = false;
        const transaction_id = null;
        const payment_method_detected = false;
        const order = this.pos.get_order()
        // Verifica si hay una línea de pago seleccionada
        if (order.selected_paymentline) {
            // Elimina la línea de pago seleccionada
            if(order.selected_paymentline.name == "QR"){
                order.remove_paymentline(order.selected_paymentline)
            }
        }
        
        this.observer_for_insert_listener();
        //detecta si es el unico meto de pago entonces mostrar
        if(this.pos.config.payment_method_ids.length == 1){
            this.payment_method_detected = false;
            this.qr_painted = false;
            this.payment_device_paint();
        }
    },

    observer_for_insert_listener(){
        const observer = new MutationObserver(() => {
            if(this.insert_listener != true){
                const paymentMethodDisplayElements = document.querySelectorAll('.payment-method-display');
                paymentMethodDisplayElements.forEach(element => {
                    const paymentNameSpan = element.querySelector('.payment-name');
                    if (paymentNameSpan && paymentNameSpan.textContent.trim() === "QR") {
                        element.addEventListener('click', async() => {
                            this.payment_method_detected = false;
                            this.qr_painted = false;
                            this.payment_device_paint();
                        });
                    }
                });
                this.insert_listener = true;
            } 
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    payment_device_paint(){
        const observer = new MutationObserver(async() => {
            const payment_method = this.pos.get_order().selected_paymentline;
            
            if(payment_method && payment_method.payment_method.name == "QR" && this.payment_method_detected != true){
                if(this.pos.get_order().paymentlines.length<2){
                    this.payment_method_detected = true;
                    //llamar y mostrar el modal
                    const result = await this._generate_data_for_show_modal();
                    if(result){
                        //adicionar el qr dentro del modal
                        this.observer_for_insert_qr_in_modal(result);
                    }
                }else{
                    //mostrar error que no se puede este metodo de pago
                    this.generate_error_modal("Error", "No se puede si ya elegiste otro metodo de pago");
                    //eliminar lo que inserte
                    this.pos.get_order().remove_paymentline(this.pos.get_order().selected_paymentline)
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },
    
    observer_for_insert_qr_in_modal(result){
        const observer = new MutationObserver(() => {
            // Verifica si el elemento específico ha sido añadido al DOM
            const modal_qr_qhantuy = document.querySelector('h4.modal-title.title.drag-handle');
            if(modal_qr_qhantuy && this.qr_painted != true){
                // Si el elemento existe y no ha sido pintado, ejecuta tu lógica
                this.checkForElement(result, modal_qr_qhantuy);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    //////////////////////////////////////////////////////////////////////aqui debo cambiar el codigo uwu
    async _generate_data_for_show_modal() {
        //indico que no importa si la cuenta esta dividida todo el monto de pago estara en el QR
        const data = this.pos.get_order().get_total_with_tax();
        //colocar una pantalla de carga
        this.insert_generate_load_view();
        //solicitar el qr
        const result = await this.generate_and_get_qr_qhantuy(data);
        if(result.result.error){ 
            this.generate_error_modal("Error", "Problema de connexion pruebe mas tarde o comuniquese con un administrador.");
            // quitar el cargando
            this.remove_generate_load_view();
            //quitar de la lista el pago seleccionado
            this.pos.get_order().remove_paymentline(this.pos.get_order().selected_paymentline)
            return null
        }else{
            //mostrar el modal
            this._show_modal(result);
            // quitar el cargando
            this.remove_generate_load_view();
            return result
        }
    },

    _show_modal(result) {
        this.env.services.popup.add(ConfirmPopup, {
            title: 'Escanea el código QR para pagar',
            body: "",
            confirmText: 'Sí, ya he realizado el pago',
            cancelText: 'No, prefiero regresar'
        }).then( async ({confirmed}) => {
            if (confirmed) {
                //colocar una pantalla de carga
                this.insert_generate_load_view();
                //envio un ajax a {{enviroment_url}}/check-payments para ver el estado de mi pago para ello envio el codigo del pago
                const result_state = await this.get_state_qr_qhantuy();
                //respuesta del ajax pregunto su estado de un parametro
                if(result_state.result.error){
                    //caso que no sea exitoso
                    // quitar el cargando
                    this.remove_generate_load_view();
                    //volver a visualizar el modal
                    this._show_modal(result);
                    //reiniciar el pintado del qr
                    this.qr_painted = false;
                    //mostrar un modal que indique que trate nuevamente
                    this.generate_error_modal("Error", "Problema de connexion pruebe mas tarde o comuniquese con un administrador.");
                }else{
                    if(result_state.result.items[0]["payment_status "] == "success"){
                        //es estado exitoso
                        //enviar directo a la siguiente vista
                        this.validateOrder(true);
                        // quitar el cargando
                        this.remove_generate_load_view();
                    }
                    else{
                        //caso que no sea exitoso
                        // quitar el cargando
                        this.remove_generate_load_view();
                        //volver a visualizar el modal
                        this._show_modal(result);
                        //reiniciar el pintado del qr
                        this.qr_painted = false;
                        //mostrar un modal que indique que trate nuevamente
                        this.generate_error_modal(
                            "Error",
                            "Lamentamos informarte que el pago no fue confirmado. Te invitamos a que intentes nuevamente. Si el problema persiste, no dudes en ponerte en contacto con nuestro equipo de soporte."
                        )
                    }
                }
            }else{
                //elimina el metodo de pago en el listado porque lo cancela
                const order = this.pos.get_order()
                order.remove_paymentline(order.selected_paymentline)
            }
        });
    },

    generate_and_get_qr_qhantuy(data){
        return new Promise((resolve, reject) => {
            $.ajax({
                url: '/generate_qr_qhantuy',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    "params": {
                        "id_terminal": this.pos.get_order().selected_paymentline.payment_method.id,
                        "price": data
                    }
                }),
                success: function(response) {
                    // Puedes hacer algo con la respuesta si es necesario
                    console.log(response);
                    resolve(response); // Devuelve la respuesta exitosa
                },
                error: function(xhr, status, error) {
                    console.error('Error en la solicitud:', status, error);
                    resolve(null); // Devuelve la respuesta de error
                }
            });
        });
    },

    get_state_qr_qhantuy(){
        return new Promise((resolve, reject) => {
            $.ajax({
                url: '/get_state_qr_qhantuy',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    "params": {
                        "id_terminal": this.pos.get_order().selected_paymentline.payment_method.id,
                        "payment_ids": [
                            `${this.transaction_id}`
                        ]
                    }
                }),
                success: function(response) {
                    // Puedes hacer algo con la respuesta si es necesario
                    console.log(response);
                    resolve(response); // Devuelve 100 en caso de éxito
                },
                error: function(xhr, status, error) {
                    console.error('Error en la solicitud:', status, error);
                    resolve(null); // Devuelve null en caso de error
                }
            });
        });
    },

    checkForElement(result, modal_qr_qhantuy) {
        this.transaction_id = result.result.transaction_id;
        
        const image_url = result.result.image_data;
        
        const html_qr = `<div style="width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; border: 1px solid #ccc;">
            <img src="${image_url}" alt="Imagen de ejemplo" style="width: 80%; height: auto;">
        </div>`;
        const element = modal_qr_qhantuy;
        if (element && element.textContent.includes("Escanea el código QR para pagar")) {
            const padre = element.parentNode;
            const padre_del_padre = padre.parentNode;

            const modalBody = padre_del_padre.querySelector('main.modal-body');
            //aca debo insertar el html qr que tengo iniciado arriba
            if (modalBody) {
                // Agregar el html_qr al modal-body
                modalBody.insertAdjacentHTML('beforeend', html_qr);
                console.log("HTML QR agregado al modal-body.");
            } else {
                console.log("No se encontró el modal-body.");
            }
        }

        //cambiar el estado de pintado
        this.qr_painted = true;
    },

    insert_generate_load_view(){
        // Crear un div para el spinner
        var spinner = document.createElement('div');
        spinner.id = 'loader_qhuantuy';
        spinner.style.position = 'fixed';
        spinner.style.top = '0';
        spinner.style.left = '0';
        spinner.style.width = '100%';
        spinner.style.height = '100%';
        spinner.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        spinner.style.zIndex = '9999';
        spinner.style.display = 'flex';
        spinner.style.justifyContent = 'center';
        spinner.style.alignItems = 'center';

        // Añadir texto o un spinner de carga
        spinner.innerHTML = '<div class="loader" style="border: 16px solid #f3f3f3; border-top: 16px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 2s linear infinite;"></div>';

        // Estilos de la animación
        var style = document.createElement('style');
        style.innerHTML = `
        @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
        }
        `;
        document.head.appendChild(style);
        // Añadir el spinner al cuerpo
        document.body.appendChild(spinner);
    },

    remove_generate_load_view(){
        //buscar el loader
        var spinner = document.getElementById('loader_qhuantuy');
        // Eliminar el spinner
        document.body.removeChild(spinner);
    },

    generate_error_modal(title, boddy){
        this.env.services.popup.add(ErrorPopup, {
            title: _t(title),
            body: _t(boddy),
        });
    }
    
});
