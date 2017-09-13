import frappe
import csv, json, os
from frappe import _

@frappe.whitelist()
def export_item_sheets():
	fieldnames = ["barcode","item_code","item_name","description","stock_uom"]

	items = frappe.get_all("Item", fields=["barcode","item_code","item_name","description","stock_uom"], order_by="barcode DESC")
	fname = os.path.join(frappe.get_site_path(), "public","files", "ProductCodes_barcode.csv")
	with open(fname, 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			writer.writerow(i)	

	items = frappe.get_all("Item", fields=["item_code","barcode","item_name","description","stock_uom"], order_by="item_code DESC")
	fname = os.path.join(frappe.get_site_path(), "public","files", "ProductCodes_itemcode.csv")
	with open(fname, 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			writer.writerow(i)

	items = frappe.get_all("Item", fields=["description","barcode","item_code","item_name","stock_uom"], order_by="description DESC")
	fname = os.path.join(frappe.get_site_path(), "public","files", "ProductCodes_description.csv")
	with open(fname, 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			writer.writerow(i)