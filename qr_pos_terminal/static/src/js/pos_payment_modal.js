/** @odoo-module */

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup"
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

patch(PaymentScreen.prototype, {
    async setup() {        
        super.setup(...arguments);
        const insert_listener = false;
        const qr_painted = false;
        const order = this.pos.get_order()
        // Verifica si hay una línea de pago seleccionada
        if (order.selected_paymentline) {
        // Elimina la línea de pago seleccionada
            if(order.selected_paymentline.name == "QR by APPEX"){
                order.remove_paymentline(order.selected_paymentline)
            }
        }
        this.observer_for_insert_listener();
    },

    observer_for_insert_listener(){
        const observer = new MutationObserver(() => {
            if(this.insert_listener != true){
                const paymentMethodDisplayElements = document.querySelectorAll('.payment-method-display');
                paymentMethodDisplayElements.forEach(element => {
                    const paymentNameSpan = element.querySelector('.payment-name');
                    if (paymentNameSpan && paymentNameSpan.textContent.trim() === "QR by APPEX") {
                        element.addEventListener('click', async () => {
                            if(this.pos.get_order().selected_paymentline === undefined) {
                                this.qr_painted = false;
                                //llamar y mostrar el modal
                                await this._show_modal();
                                //adicionar el qr dentro del modal
                                this.observer_for_insert_qr_in_modal();
                            }
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
    
    observer_for_insert_qr_in_modal(){
        const observer = new MutationObserver(() => {
            if(this.qr_painted != true){
                this.checkForElement();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    _show_modal() {
        this.env.services.popup.add(ConfirmPopup, {
            title: 'Escanea el código QR para pagar',
            body: "",
            confirmText: 'Sí, ya he realizado el pago',
            cancelText: 'No, prefiero regresar'
        }).then( ({confirmed}) => {
            if (confirmed) {
                this.validateOrder(true);
            }else{
                const order = this.pos.get_order()
                order.remove_paymentline(order.selected_paymentline)
            }
        });
    },

    checkForElement() {
        this.qr_painted = true;
        const html_qr = `<div style="width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; border: 1px solid #ccc;">
            <img src="/qr_pos_terminal/static/description/qr_code_bank.png" alt="Imagen de ejemplo" style="width: 100%; height: auto;">
        </div>`;
        const element = document.querySelector('h4.modal-title.title.drag-handle');
        if (element && element.textContent.includes("Escanea el código QR para pagar")) {
            const padre = element.parentNode;
            const padre_del_padre = padre.parentNode;

            const modalBody = padre_del_padre.querySelector('main.modal-body');
            //aca debo insertar el html qr que tengo iniciado arriba
            if (modalBody) {
                // Agregar el html_qr al modal-body
                modalBody.insertAdjacentHTML('beforeend', html_qr);
                //console.log("HTML QR agregado al modal-body.");
            } else {
                console.log("No se encontró el modal-body.");
            }
        }
    }
});