{
    'name': 'QR by AppexBo',
    'version': '17.0.0.2',
    'description': '',
    'summary': 'Inserta un Qr a la terminal del POS',
    
    'author': 'Erick Denis Mercado Oudalova',
    'maintainer': 'AppexBo',
    'company': 'AppexBo',
    'website': 'https://www.appexbo.com/',
    
    'category': 'Point of Sale',
    'depends': [
        'point_of_sale',
    ],
    'data': [
    #    'views/pos_template.xml',   
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'qr_pos_terminal/static/**/*',
        ],
    },
    'license': 'AGPL-3',
}
