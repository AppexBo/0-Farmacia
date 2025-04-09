/** @odoo-module */
import { useService } from "@web/core/utils/hooks";
import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
import { patch } from "@web/core/utils/patch";
import { usePos } from "@point_of_sale/app/store/pos_hook";
/**
 * Enhances the Orderline component with additional functionality.
 * @extends Orderline
 */
patch(Orderline.prototype, {
    setup() {
        super.setup();
        this.pos = usePos();
        this.numberBuffer = useService("number_buffer");
    },
    /**
     * Handle the clear button click event by sending Backspace key twice to the number buffer.
     * @param {Event} ev - The click event.
     */
    async clear_button_fun(ev) {
        this.numberBuffer.sendKey('Backspace');
        this.numberBuffer.sendKey('Backspace');
    },

    /*
    async increase_quantity(ev) {
        const order_selected = this.pos.get_order().get_selected_orderline()
        const cantidad = this.pos.get_order().get_selected_orderline().get_quantity();

        
        this.pos.get_order().get_selected_orderline().set_quantity(cantidad+1);
    },
    */
    
    async decrease_quantity(ev) {
        // Paso 1: pregunto si estoy seleccionando el orderline
        const targetElement = ev.currentTarget.parentNode.parentNode;
        const hasSelectedClass = targetElement.classList.contains('selected');
        // Paso 2: preguntar si es verdadero //caso verdadero actualizo la cantidad caso falso no actulizo nada
        if(hasSelectedClass){
            const order_selected = this.pos.get_order().get_selected_orderline();
            const cantidad = this.pos.get_order().get_selected_orderline().get_quantity();

            if(cantidad>0){
                this.pos.get_order().get_selected_orderline().set_quantity(cantidad-1);
            }
        }
    }
})