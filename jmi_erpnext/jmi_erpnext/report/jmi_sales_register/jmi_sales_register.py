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
	columns, mop  = get_columns(invoice_list, additional_table_columns, filters)

	if not invoice_list:
		msgprint(_("No record found"))
		return columns, invoice_list

	invoice_income_map = get_invoice_income_map(invoice_list)
	invoice_tax_map = get_invoice_tax_map(invoice_list)
	#Cost Center & Warehouse Map
	invoice_cc_wh_map = get_invoice_cc_wh_map(invoice_list)
	invoice_so_dn_map = get_invoice_so_dn_map(invoice_list)
	# customers = list(set([inv.customer for inv in invoice_list]))
	company_currency = frappe.db.get_value("Company", filters.get("company"), "default_currency")
	mode_of_payments = get_mode_of_payments([inv.name for inv in invoice_list])

	data = []
	for inv in invoice_list:
		sales_order = list(set(invoice_so_dn_map.get(inv.name, {}).get("sales_order", [])))
		delivery_note = list(set(invoice_so_dn_map.get(inv.name, {}).get("delivery_note", [])))
		cost_center = list(set(invoice_cc_wh_map.get(inv.name, {}).get("cost_center", [])))
		warehouse = list(set(invoice_cc_wh_map.get(inv.name, {}).get("warehouse", [])))
		
		row=[]
		row.append(inv.name)
		row.append(inv.customer_name)


		
		total = ([im.get("total") for im in invoice_income_map if im.name == inv.name])[0]
		total_taxes_and_charges = ([im.get("total_taxes_and_charges") for im in invoice_tax_map if im.name == inv.name])[0]
		grand_total = ([im.get("grand_total") for im in invoice_income_map if im.name == inv.name])[0]

 		row += [total, total_taxes_and_charges,  grand_total]
		
		amt_list = get_amount_entries(inv.name)
		for col in mop:
			credit = [a_entry.amount for a_entry in amt_list if a_entry.mode_of_payment == col]
			row.append(credit[0] if len(credit) > 0 else 0.0)

		change_amount = ([im.get("change_amount") for im in invoice_income_map if im.name == inv.name])[0]
		
		row.append(change_amount)
		row.append(inv.owner)

		data.append(row)

	return columns, data

def get_columns(invoice_list, additional_table_columns,filters):
	"""return columns based on filters"""
	columns = [
		_("Invoice") + ":Link/Sales Invoice:100",
	 	_("Customer Name") + "::120",
	]

	if additional_table_columns:
		columns += additional_table_columns

	columns = columns + [_("Net Total") + ":Currency/currency:100"] + [_("Total Tax") + ":Currency/currency:100"] + [_("Grand Total") + ":Currency/currency:100"]

	mop_columns = []
	mop = frappe.db.sql_list(
		"""
		select distinct
		mode_of_payment
		from `tabSales Invoice Payment`
		""".format(
			 conditions=get_conditions(filters)
		),
		filters)
	
	for a in mop:
		mop_columns = _(a) + ":Currency/currency:110"
		columns.append(mop_columns)  

	columns.append(_("Change Amount") + ":Currency/Currency:100")
	columns.append(_("Owner") + "::150")

	return columns, mop

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
	return frappe.db.sql("""select name, posting_date, customer, customer_name, owner,
		base_net_total, base_grand_total, base_rounded_total, outstanding_amount {0}
		from `tabSales Invoice`
		where docstatus = 1 and is_pos= 1 %s order by posting_date desc, name desc""".format(additional_query_columns or '') %
		conditions, filters, as_dict=1)

def get_invoice_income_map(invoice_list):
	income_details = frappe.db.sql("""select name, total, grand_total , change_amount from `tabSales Invoice` where docstatus = 1 and is_pos= 1 group by name desc""", as_dict=1)

	return income_details


def get_invoice_tax_map(invoice_list):
	tax_details = frappe.db.sql("""select name, total_taxes_and_charges from `tabSales Invoice`where docstatus = 1 and is_pos= 1 group by name desc""", as_dict=1)

	return tax_details

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

def get_customer_details(customers):
	customer_map = {}
	for cust in frappe.db.sql("""select name, territory, customer_group from `tabCustomer`
		where name in (%s)""" % ", ".join(["%s"]*len(customers)), tuple(customers), as_dict=1):
			customer_map.setdefault(cust.name, cust)

	return customer_map

def get_mode_of_payments(invoice_list):
	mode_of_payments = {}
	if invoice_list:
		inv_mop = frappe.db.sql("""select parent, mode_of_payment
			from `tabSales Invoice Payment` where parent in (%s) group by parent, mode_of_payment""" %
			', '.join(['%s']*len(invoice_list)), tuple(invoice_list), as_dict=1)

		for d in inv_mop:
			mode_of_payments.setdefault(d.parent, []).append(d.mode_of_payment)

	return mode_of_payments

def get_amount_entries(inv_name):
	amt_entries = frappe.db.sql(
		"""select parent, mode_of_payment, amount
			from `tabSales Invoice Payment`
			where parent = '{inv_name}'
			order by parent desc"""
			.format(
			inv_name = inv_name
		),
		as_dict=1)
	return amt_entries