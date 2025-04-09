# coding: utf-8
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class QhantuyController(http.Controller):

    @http.route('/generate_qr_qhantuy', type='json', auth='public', methods=['POST'])
    def register_qhantuy_payment(self, **post):
        terminal_id = post.get('id_terminal')
        price = post.get('price')
        pos_payment_method_model = request.env['pos.payment.method'].sudo().browse(terminal_id)
        result = pos_payment_method_model._api_generate_qr(price)
        return result

    @http.route('/get_state_qr_qhantuy', type='json', auth='public', methods=['POST'])
    def get_state_qhantuy_payment(self, **post):
        terminal_id = post.get('id_terminal')
        payment_ids = post.get('payment_ids')
        pos_payment_method_model = request.env['pos.payment.method'].sudo().browse(terminal_id)
        result = pos_payment_method_model._api_get_state_qr(payment_ids)
        return result