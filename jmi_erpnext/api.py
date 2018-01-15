import frappe
from frappe import _
from .item_data_export import export_item_sheets

@frappe.whitelist()
def item_on_insert(self, method):
	export_item_sheets()

@frappe.whitelist()
def item_on_update(self, method):
	export_item_sheets()

@frappe.whitelist()
def item_on_trash(self, method):
	export_item_sheets()

@frappe.whitelist()
def jmi_get_customer_information(customer_name):
	customer = frappe.get_doc("Customer", customer_name)
	return customer.jmi_customer_id