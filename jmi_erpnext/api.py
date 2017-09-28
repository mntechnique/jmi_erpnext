import frappe
from frappe import _
from .item_data_export import export_item_sheets

@frappe.whitelist()
def item_on_insert(self, method):
	export_item_sheets()

def item_on_update(self, method):
	export_item_sheets()

def item_on_trash(self, method):
	export_item_sheets()