import logging
import requests

import pdb

from werkzeug import urls

from odoo import fields, models, _
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class QhantuyDevice(models.Model):
    _name = 'qhantuy.device'
    _description = 'Qhantuy Device'

    name = fields.Char(required=True)
    base_url = fields.Char(required=True)
    device_id = fields.Char()
    business_api_tocken = fields.Char(required=True)
    app_key = fields.Char(required=True)
    currency_id = fields.Many2one('res.currency', string='Currency')
    company_id = fields.Many2one('res.company', required=True, default=lambda self: self.env.company)
    status = fields.Selection([
        ('active', 'Active'),
        ('inactive', 'Inactive')
    ])
    
    # =================
    # API CALLS METHODS
    # =================

    def _api_generate_qr(self, data):
        payment_payload = self._prepare_payment_payload(data)
        result = self._qhantuy_api_generate_QR_call('/checkout', data=payment_payload, method='POST', silent=True)
        return result

    def _api_get_state_qr(self, data):
        payment_ids = self._structure_query_status(data)
        result = self._qhantuy_api_generate_QR_call('/check-payments', data=payment_ids, method='POST', silent=True)
        return result

    # =====================
    # GENERIC TOOLS METHODS
    # =====================

    def _qhantuy_api_generate_QR_call(self, endpoint, data=None, method='POST', silent=False):
        company = self.company_id or self.env.company

        headers = {
            'content-type': 'application/json',
        }

        base_url = self.base_url

        #base_url = "https://testingcheckout.qhantuy.com/external-api"
        url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"

        try:
            response = requests.request(method, url, json=data, headers=headers, timeout=60)
            response.raise_for_status()
        except requests.exceptions.HTTPError:
            error_details = response.json()
            _logger.exception("Qhantuy-ERROR \n %s", error_details)
            if silent:
                return error_details
            else:
                raise ValidationError("Qhantuy: \n %s" % error_details)
        except requests.exceptions.RequestException as e:
            _logger.exception("unable to communicate with Qhantuy: %s \n %s", url, e)
            if silent:
                return {'error': "Some thing went wrong"}
            else:
                raise ValidationError("Qhantuy: " + _("Some thing went wrong."))
        
        return response.json()

    def _qhantuy_api_get_state_QR_call(self, endpoint, data=None, method='POST', silent=False):
        company = self.company_id or self.env.company

        headers = {
            'content-type': 'application/json',
        }

        base_url = self.base_url
        #base_url = "https://testingcheckout.qhantuy.com/external-api"
        url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"

        try:
            response = requests.request(method, url, json=data, headers=headers, timeout=60)
            response.raise_for_status()
        except requests.exceptions.HTTPError:
            error_details = response.json()
            _logger.exception("Qhantuy-ERROR \n %s", error_details)
            if silent:
                return error_details
            else:
                raise ValidationError("Qhantuy: \n %s" % error_details)
        except requests.exceptions.RequestException as e:
            _logger.exception("unable to communicate with Qhantuy: %s \n %s", url, e)
            if silent:
                return {'error': "Some thing went wrong"}
            else:
                raise ValidationError("Qhantuy: " + _("Some thing went wrong."))
        
        return response.json()

    # =====================
    # Estructura de la consulta
    # =====================

    def _prepare_payment_payload(self, data):
        return {
            "appkey": self.app_key,
            #"appkey": "Vm0xMGFrMVhVWGxVYmtwT1ZtdHdVbFpyVWtKUFVUMDk=-QKTWF",
            "callback_url": "",
            "currency_code":"BOB",
            "internal_code": "ABC123",
            "detail":"S-Mart Micromercados",
            "items": [{
                "name": "Pago total",
                "price": data,
                "quantity": 1
            }],
            "payment_method":"QRSIMPLE",
            "payment_type":"EMBED",
            "image_method":"URL"
        }

    def _structure_query_status(self, data):
        return {
            "appkey": self.app_key,
            #"appkey": "Vm0xMGFrMVhVWGxVYmtwT1ZtdHdVbFpyVWtKUFVUMDk=-QKTWF",
            "payment_ids": data,
        }