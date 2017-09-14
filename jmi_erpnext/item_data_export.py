import frappe
import csv, json, os
from frappe import _

@frappe.whitelist()
def export_item_sheets():
	items = frappe.get_all("Item", fields=["barcode","item_code","item_name","description","stock_uom"])

	items = sorted(items, key=lambda v:v.get("barcode"), reverse=True)
	fieldnames = ["barcode","item_code","item_name","description","stock_uom"]
	fname = os.path.join(frappe.get_site_path(), "public","files", "ProductCodes_barcode.csv")
	with open(fname, 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			row = check_blank_fields(i,fieldnames)
			writer.writerow(row)

	items = sorted(items, key=lambda v:v.get("item_code"), reverse=True)
	fieldnames = ["item_code","barcode","item_name","description","stock_uom"]
	fname = os.path.join(frappe.get_site_path(), "public","files", "ProductCodes_itemcode.csv")
	with open(fname, 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			row = check_blank_fields(i,fieldnames)
			writer.writerow(row)

	items = sorted(items, key=lambda v:v.get("description"), reverse=True)
	fieldnames = ["description","barcode","item_code","item_name","stock_uom"]
	fname = os.path.join(frappe.get_site_path(), "public","files", "ProductCodes_description.csv")
	with open(fname, 'wb') as csvfile:
		writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
		for i in items:
			row = check_blank_fields(i,fieldnames)
			writer.writerow(row)


def check_blank_fields(i,fieldnames):
	for fieldname in fieldnames:
		if (getattr(i, fieldname) == "") or (i.get(fieldname) == None):
			setattr(i,fieldname,"-")
	return i