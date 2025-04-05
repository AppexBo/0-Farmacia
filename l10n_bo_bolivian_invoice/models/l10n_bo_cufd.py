from odoo import api, models, fields
from odoo.exceptions import UserError

import logging
_logger = logging.getLogger(__name__)



class l10nBoCufd(models.Model):
    _name = "l10n.bo.cufd"
    _description = "Codigo unico de facturacion diaria"


    name = fields.Char(
        string='Cufd',
        default='000',
        readonly=False,
        copy=False
    )

    
    codigoControl = fields.Char(
        string='Codigo control',
        copy=False,
        readonly=True 
    )
    
    
    direccion = fields.Char(
        string='Dirección',
        copy=False,
        readonly=True 
    )
    
    
    fechaSolicitud = fields.Datetime(
        string='Fecha solicitud',
        readonly=True,
        copy=False
    )
    
    
    fechaVigencia = fields.Datetime(
        string='Fecha vigencia',
        copy=False,
        readonly=True 
    )

    
    messagesList = fields.Many2many(
        string='Lista de mensajes',
        comodel_name='l10n.bo.message.service',
        readonly=True ,
        copy=False
    )
    
    def setMessageList(self, _lists):
        _message_ids = []
        for _list in _lists:
            _message_id = self.env['l10n.bo.message.service'].search(
                [
                    (
                        'codigoClasificador','=', _list.codigo
                    )
                ],
                limit=1
            )
            if _message_id:
                _message_ids.append(_message_id.id)

        self.write(
            {
                'messagesList': [
                    (
                        6,0,_message_ids
                    )
                ]
            }
        )   
    
    
    success = fields.Boolean(
        string='Realizado',
        copy=False,
        readonly=True 
    )
    
    
    transaccion = fields.Boolean(
        string='Transacción',
        default=False,
        copy=False,
        readonly=True 
    )

    
    pos_id = fields.Many2one(
        string='Punto de venta',
        comodel_name='l10n.bo.pos',
        readonly=True 
        
    )
    
    
    service_type = fields.Char(
        string='Tipo servicio',
        default='FacturacionCodigos',
        readonly=True 
    )

    def getCode(self):
        if self.name:
            return self.name
        raise UserError('No se encontro un CUFD valido')
    
    
    error = fields.Char(
        string='error',
        copy=False, 
        readonly=True 
    )
    
    def getControlCode(self):
        if self.codigoControl:
            return self.codigoControl
        raise UserError(f'El {self.name} no tiene un codigo de control')
    

    def soap_service(self, METHOD):
        #raise UserError(self.pos_id.company_id.getL10nBoCodeEnvironment())
        PARAMS = [
            ('name','=',METHOD),
            ('environment_type','=', self.pos_id.company_id.getL10nBoCodeEnvironment())
        ]
        _logger.info(f"{PARAMS}")
        WSDL_SERVICE = self.env['l10n.bo.operacion.service'].search(PARAMS,limit=1)
        if WSDL_SERVICE:
            WSDL_RESPONSE = getattr(self, METHOD)(WSDL_SERVICE)
            return WSDL_RESPONSE
        raise UserError(f'Servicio: {METHOD} no encontrado')
    

    def verificarComunicacion(self, WSDL_SERVICE):
        WSDL = WSDL_SERVICE.getWsdl()
        TOKEN = self.pos_id.company_id.l10n_bo_delegate_token
        response = WSDL_SERVICE.process_soap_siat(WSDL, TOKEN, {},  'verificarComunicacion')
        _logger.info(f"{response}")
        if response.get('success', False):
            res_data = response.get('data')
            if res_data.transaccion:
                for obs in res_data.mensajesList:
                    if obs.codigo == 926:
                        return True
            return False
        else:
                return False
    
    def cufd(self, WSDL_SERVICE):
        PARAMS = {
            'codigoAmbiente'    : self.pos_id.company_id.getL10nBoCodeEnvironment(),
            'codigoSistema'     : self.pos_id.company_id.getL10nBoCodeSystem(),
            'nit'               : self.pos_id.company_id.getNit(),
            'codigoModalidad'   : self.pos_id.company_id.getL10nBoCodeModality(),
            'cuis'              : self.pos_id.getCuis(),
            'codigoSucursal'    : self.pos_id.branch_office_id.getCode(),
            'codigoPuntoVenta'  : self.pos_id.getCode()
        }
        OBJECT = {'SolicitudCufd' : PARAMS}
        WSDL =  WSDL_SERVICE.getWsdl()
        TOKEN = self.pos_id.company_id.getDelegateToken()
        WSDL_RESPONSE = WSDL_SERVICE.process_soap_siat(WSDL, TOKEN, OBJECT, 'cufd')
        self.prepare_wsdl_reponse(WSDL_RESPONSE)
    


    
    def prepare_wsdl_reponse(self, response):
        _logger.info(f"{response}")
        if response.get('success'):
            res_data = response.get('data', {})
            if res_data.codigo:
                _vals = {
                        'name'        : res_data.codigo,
                        'codigoControl' : res_data.codigoControl,
                        'direccion'     : res_data.direccion,
                        'fechaVigencia' : res_data.fechaVigencia.strftime('%Y-%m-%d %H:%M:%S'),
                        'transaccion'    : res_data.transaccion,
                        'success'       : response.get('success'),                    
                        'fechaSolicitud' : fields.datetime.now()
                }
                self.write(_vals)
            try:
                self.setMessageList(res_data.mensajesList if res_data.mensajesList else []) 
            except:
                self.setMessageList(res_data.mensajeServicioList if res_data.mensajeServicioList else [])

        else:
            self.write({'error':response.get('error')})