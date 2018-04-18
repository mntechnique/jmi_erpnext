# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

from __future__ import unicode_literals
import frappe
from frappe.utils import flt
from frappe import msgprint, _

def execute(filters=None):
	return _execute(filters)

def _execute(filters, additional_table_columns=None, additional_query_columns=None):
	if not filters: filters = frappe._dict({})

	invoice_list = get_invoices(filters, additional_query_columns)
	columns = get_columns(invoice_list, additional_table_columns)

	if not invoice_list:
		msgprint(_("No record found"))
		return columns, invoice_list

	invoice_income_map = get_invoice_income_map(invoice_list)
	
	invoice_cc_wh_map = get_invoice_cc_wh_map(invoice_list)
	invoice_so_dn_map = get_invoice_so_dn_map(invoice_list)
	company_currency = frappe.db.get_value("Company", filters.get("company"), "default_currency")
	mode_of_payments = get_mode_of_payments([inv.name for inv in invoice_list])

	data = []
	for inv in invoice_list:
		# invoice details
		sales_order = list(set(invoice_so_dn_map.get(inv.name, {}).get("sales_order", [])))
		delivery_note = list(set(invoice_so_dn_map.get(inv.name, {}).get("delivery_note", [])))
		cost_center = list(set(invoice_cc_wh_map.get(inv.name, {}).get("cost_center", [])))
		warehouse = list(set(invoice_cc_wh_map.get(inv.name, {}).get("warehouse", [])))

		if additional_query_columns:
			for col in additional_query_columns:
				row.append(inv.get(col))
		
		
		si_county = get_county(inv.name)
		item_list = get_item_details(inv.name)
		
		for a_entry in item_list:
			if a_entry.get("item code"):
				gl_acc = 40200
			else:
				gl_acc = 23100

			if a_entry.get("item code"):
				tax_type = 1
			else:
				tax_type = 0	
			row = [
			 inv.customer, inv.name, inv.posting_date, inv.po_no , (""),("")  ,("") , "Next 30 Days", inv.owner,inv.debit_to, si_county
		]

			row +=[
			len(item_list) ,("") 
		]
			row +=[
				a_entry.get("quantity"), a_entry.get("item code") , a_entry.get("desc") , gl_acc , a_entry.get("rate") , tax_type , a_entry.get("amt"),
				("") ,("")  ,
				a_entry.get("quantity") , a_entry.get("rate") , a_entry.get("sr_no"), si_county 
				
			]

			data.append(row)
			

	return columns, data

def get_columns(invoice_list, additional_table_columns):
	columns = [
		_("Customer") + ":Link/Customer:120",
		_("Invoice No") + ":Link/Sales Invoice:120", _("Posting Date") + ":Date:100" , _("Customer PO No") + ":Link/Sales Invoice:120"
		
	]

	if additional_table_columns:
		columns += additional_table_columns

	columns +=[
		_("Ship Via") + "::80", _("Ship Date") + "::80", _("Date Due") + "::80", _("Displayed Terms") + "::120",
		_("Sales Representative ID") + "::120",	  
		 _("Accounts Receivable Account") + ":Link/Account:120", _("Sales Tax Id") + "::80",
		 _("Number of Distributions") + "::120",  _("Invoice/CM Distribution") + "::120" ,
		 _("Quantity") + "::100", _("Item ID") + "::100", _("Description") + "::100",
		 _("G/L Account") + "::100" , _("Unit Price") + ":Currency:100" , _("Tax Type") + "::100" ,
		 _("Amount") + ":Currency:80" , _("U/M ID") + "::80" , _("U/M No of Stocking units") + "::180",
		 _("Stocking Quantity") + "::120" , _("Stocking Unit Price") + ":Currency:150" ,
		 _("Serial Number") + "::100" , _("Sales Tax Agency") + "::120"		
	]

	return columns

def get_conditions(filters):
	conditions = ""

	if filters.get("company"): conditions += " and company=%(company)s"
	if filters.get("customer"): conditions += " and customer = %(customer)s"

	if filters.get("from_date"): conditions += " and posting_date >= %(from_date)s"
	if filters.get("to_date"): conditions += " and posting_date <= %(to_date)s"

	if filters.get("owner"): conditions += " and owner = %(owner)s"

	if filters.get("mode_of_payment"):
		conditions += """ and exists(select name from `tabSales Invoice Payment`
			 where parent=`tabSales Invoice`.name
			 	and ifnull(`tabSales Invoice Payment`.mode_of_payment, '') = %(mode_of_payment)s)"""

	if filters.get("cost_center"):
		conditions +=  """ and exists(select name from `tabSales Invoice Item`
			 where parent=`tabSales Invoice`.name
			 	and ifnull(`tabSales Invoice Item`.cost_center, '') = %(cost_center)s)"""

	if filters.get("warehouse"):
		conditions +=  """ and exists(select name from `tabSales Invoice Item`
			 where parent=`tabSales Invoice`.name
			 	and ifnull(`tabSales Invoice Item`.warehouse, '') = %(warehouse)s)"""

	return conditions

def get_invoices(filters, additional_query_columns):
	if additional_query_columns:
		additional_query_columns = ', ' + ', '.join(additional_query_columns)

	conditions = get_conditions(filters)
	return frappe.db.sql("""
		select name, posting_date, debit_to, project, customer, po_no,
		customer_name, owner, address_display, remarks, territory, tax_id, customer_group,
		base_net_total, base_grand_total, base_rounded_total, outstanding_amount {0}
		from `tabSales Invoice`
		where docstatus = 1 and is_pos = 1 %s order by posting_date desc, name desc""".format(additional_query_columns or '') %
		conditions, filters, as_dict=1)

def get_invoice_income_map(invoice_list):
	income_details = frappe.db.sql("""select parent, count(item_name) as c, qty, income_account, sum(base_net_amount) as amount
		from `tabSales Invoice Item` where parent in (%s) group by parent, income_account""" %
		', '.join(['%s']*len(invoice_list)), tuple([inv.name for inv in invoice_list]), as_dict=1)

	invoice_income_map = {}
	for d in income_details:
		invoice_income_map.setdefault(d.parent, frappe._dict()).setdefault(d.income_account, [])
		invoice_income_map[d.parent][d.income_account] = flt(d.amount)

	return invoice_income_map

def get_invoice_so_dn_map(invoice_list):
	si_items = frappe.db.sql("""select parent, sales_order, delivery_note, so_detail
		from `tabSales Invoice Item` where parent in (%s)
		and (ifnull(sales_order, '') != '' or ifnull(delivery_note, '') != '')""" %
		', '.join(['%s']*len(invoice_list)), tuple([inv.name for inv in invoice_list]), as_dict=1)

	invoice_so_dn_map = {}
	for d in si_items:
		if d.sales_order:
			invoice_so_dn_map.setdefault(d.parent, frappe._dict()).setdefault(
				"sales_order", []).append(d.sales_order)

		delivery_note_list = None
		if d.delivery_note:
			delivery_note_list = [d.delivery_note]
		elif d.sales_order:
			delivery_note_list = frappe.db.sql_list("""select distinct parent from `tabDelivery Note Item`
				where docstatus=1 and so_detail=%s""", d.so_detail)

		if delivery_note_list:
			invoice_so_dn_map.setdefault(d.parent, frappe._dict()).setdefault("delivery_note", delivery_note_list)

	return invoice_so_dn_map

def get_invoice_cc_wh_map(invoice_list):
	si_items = frappe.db.sql("""select parent, cost_center, warehouse
		from `tabSales Invoice Item` where parent in (%s)
		and (ifnull(cost_center, '') != '' or ifnull(warehouse, '') != '')""" %
		', '.join(['%s']*len(invoice_list)), tuple([inv.name for inv in invoice_list]), as_dict=1)

	invoice_cc_wh_map = {}
	for d in si_items:
		if d.cost_center:
			invoice_cc_wh_map.setdefault(d.parent, frappe._dict()).setdefault(
				"cost_center", []).append(d.cost_center)

		if d.warehouse:
			invoice_cc_wh_map.setdefault(d.parent, frappe._dict()).setdefault(
				"warehouse", []).append(d.warehouse)

	return invoice_cc_wh_map

def get_mode_of_payments(invoice_list):
	mode_of_payments = {}
	if invoice_list:
		inv_mop = frappe.db.sql("""select parent, mode_of_payment
			from `tabSales Invoice Payment` where parent in (%s) group by parent, mode_of_payment""" %
			', '.join(['%s']*len(invoice_list)), tuple(invoice_list), as_dict=1)

		for d in inv_mop:
			mode_of_payments.setdefault(d.parent, []).append(d.mode_of_payment)

	return mode_of_payments

def get_item_details(inv_name):

	item_entries = frappe.get_doc("Sales Invoice" , inv_name)
	z = []

	for x in xrange(0,len(item_entries.items)):
		z.append({
			"parent" : item_entries.items[x].parent,
			"item": item_entries.items[x].item_name ,
			"quantity": item_entries.items[x].qty , 
			"item code": item_entries.items[x].item_code ,
			"desc" : item_entries.items[x].description ,
			"rate" : item_entries.items[x].rate ,
			"amt" : item_entries.items[x].amount ,
			"sr_no" : item_entries.items[x].serial_no })
	
	for y in xrange(0, len(item_entries.taxes)):
		z.append({		
			"parent" : item_entries.taxes[y].parent,
			"desc" : item_entries.taxes[y].description,
			"amt" : item_entries.taxes[y].total })

	return z

def get_county(inv_name):

	get_address = frappe.get_doc("Address" , frappe.get_doc("Sales Invoice" , inv_name).customer_address).county

	return get_address