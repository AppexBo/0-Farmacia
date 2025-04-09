{
    'name': 'Qhantuy by AppexBo',
    'version': '17.0.0.0',
    'description': '',
    'summary': 'Conecta con el servicio de Qpos que proporsiona Qhantuy',
    'author': 'Erick Denis Mercado Oudalova',
    'maintainer': 'AppexBo',
    'company': 'AppexBo',
    'website': 'https://www.appexbo.com/',
    'category': 'Point of Sale',
    'depends': [
        'point_of_sale',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/qhantuy_device_views.xml',
        'views/res_config_settings_views.xml',
        'views/pos_payment_method_views.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'qhantuy_by_appex/static/**/*',
        ],
    },
    'license': 'AGPL-3',
}
