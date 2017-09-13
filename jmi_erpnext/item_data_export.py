import frappe
import csv, json
from frappe import _

@frappe.whitelist()
def export_item_sheets():
	fieldnames = ["barcode","item_code","item_name","description","stock_uom"]

	items = frappe.get_all("Item", fields=["barcode","item_code","item_name","description","stock_uom"], order_by="barcode DESC")
	with open('ProductCodes_barcode.csv', 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			writer.writerow(i)

	items = frappe.get_all("Item", fields=["barcode","item_code","item_name","description","stock_uom"], order_by="item_code DESC")
	with open('ProductCodes_itemcode.csv', 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			writer.writerow(i)

	items = frappe.get_all("Item", fields=["barcode","item_code","item_name","description","stock_uom"], order_by="description DESC")
	with open('ProductCodes_description.csv', 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			writer.writerow(i)