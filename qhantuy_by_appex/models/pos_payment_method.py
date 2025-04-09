import logging
import base64

from odoo import fields, models, api
from odoo.tools import file_open

_logger = logging.getLogger(__name__)

class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'

    qhantuy_device_id = fields.Many2one('qhantuy.device', string='Qhantuy device', domain="[('status', '=', 'active')]")
    qhantuy_device_default_partner = fields.Many2one('res.partner')

    def _get_payment_terminal_selection(self):
        return super(PosPaymentMethod, self)._get_payment_terminal_selection() + [('qhantuy', 'qhantuy')]

    @api.model_create_multi
    def create(self, vals_list):
        for val in vals_list:
            if not val.get('image') and val.get('use_payment_terminal') == 'qhantuy':
                qhantuy_image = file_open('qhantuy_by_appex/static/src/img/logo.png', mode='rb').read()
                if qhantuy_image:
                    val['image'] = base64.b64encode(qhantuy_image)
        return super().create(vals_list)

    def _api_generate_qr(self, price):
        qhantuy_device = self.qhantuy_device_id
        return qhantuy_device.sudo()._api_generate_qr(price)

    def _api_get_state_qr(self, payment_ids):
        qhantuy_device = self.qhantuy_device_id
        return qhantuy_device.sudo()._api_get_state_qr(payment_ids)
        