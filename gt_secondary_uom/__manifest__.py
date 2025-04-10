# -*- coding: utf-8 -*-

{
    'name': 'Secondary UOM',
    'summary': 'Manage a secondary unit of measure in sales, purchase, inventory and accounting.',
    'category': 'Inventory/Inventory',
    "version": '17.0.1.0',
    'description': """ It will help you to manage secondary UOM. Convert UOM to Secondary UOM in Sales, Purchase, Delivery and Invoice and print it on reports.""",
    "author": "Gritxi Technologies Pvt. Ltd.",
    "company": "Gritxi Technologies Pvt. Ltd.",
    "maintainer": "Gritxi Technologies Pvt. Ltd.",
    "images": ["static/description/banner.jpg"],
    "website": "https://www.gritxi-tech.com/",
    'depends': ['purchase', 'sale_management', 'stock', 'account'],
    'data': [
        'security/security.xml',
        'views/setting.xml',
        'views/product_tmpl.xml',
        'views/sale_order.xml',
        'views/stock.xml',
        'views/account.xml',
        'views/purchase_order.xml',
        'reports/account_report.xml',
        'reports/sale_report.xml',
        'reports/purchase_report.xml',
        'reports/delivery_report.xml',
        'views/stock_scrap.xml',
        'reports/account_invoice_report.xml',
        'reports/sale_report_analysis.xml',
        'reports/purchase_report_analysis.xml',
    ],
    "price": 40,
    "currency": "USD",
    "installable": True,
    "auto_install": False,
    "application": False,
    'license': 'OPL-1',
}
