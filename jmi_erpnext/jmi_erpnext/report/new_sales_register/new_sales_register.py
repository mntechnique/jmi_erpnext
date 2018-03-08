# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

from __future__ import unicode_literals
import frappe
from erpnext import get_company_currency, get_default_company
from erpnext.accounts.report.utils import get_currency, convert_to_presentation_currency
from frappe.utils import getdate, cstr, flt, fmt_money
from erpnext.accounts.utils import get_account_currency
from frappe import msgprint, _

def execute(filters=None):
	return _execute(filters)


def _execute(filters, additional_table_columns=None, additional_query_columns=None):
	
	if not filters: filters = frappe._dict({})

	invoice_list = get_invoices(filters, additional_query_columns)

	columns, income_accounts, tax_accounts = get_columns(invoice_list, additional_table_columns, filters)

	if not invoice_list:
		msgprint(_("No record found"))
		return columns, invoice_list

	invoice_income_map = get_invoice_income_map(invoice_list)
	invoice_income_map, invoice_tax_map = get_invoice_tax_map(invoice_list,
		invoice_income_map, income_accounts)
	#Cost Center & Warehouse Map
	invoice_cc_wh_map = get_invoice_cc_wh_map(invoice_list)
	invoice_so_dn_map = get_invoice_so_dn_map(invoice_list)
	customers = list(set([inv.customer for inv in invoice_list]))
	customer_map = get_customer_details(customers)
	company_currency = frappe.db.get_value("Company", filters.get("company"), "default_currency")
	mode_of_payments = get_mode_of_payments([inv.name for inv in invoice_list])

	data = []
	for inv in invoice_list:
		# invoice details
		sales_order = list(set(invoice_so_dn_map.get(inv.name, {}).get("sales_order", [])))
		delivery_note = list(set(invoice_so_dn_map.get(inv.name, {}).get("delivery_note", [])))
		cost_center = list(set(invoice_cc_wh_map.get(inv.name, {}).get("cost_center", [])))
		warehouse = list(set(invoice_cc_wh_map.get(inv.name, {}).get("warehouse", [])))

		customer_details = customer_map.get(inv.customer, {})
		row = [
			inv.name,
			inv.customer_name
		]

		if additional_query_columns:
			for col in additional_query_columns:
				row.append(inv.get(col))

		# map income values
		base_net_total = 0
		for income_acc in income_accounts:
			income_amount = flt(invoice_income_map.get(inv.name, {}).get(income_acc))
			base_net_total += income_amount
			row.append(income_amount)

		# net total
		row.append(base_net_total or inv.base_net_total)

		# tax account
		total_tax = 0
		for tax_acc in tax_accounts:
			if tax_acc not in income_accounts:
				tax_amount = flt(invoice_tax_map.get(inv.name, {}).get(tax_acc))
				total_tax += tax_amount
				row.append(tax_amount)

		gl_list = get_gl_entries(filters,inv.name)
		for x in xrange(1,10):
			print "gl",gl_list
			print "col",columns
		
			# for a in columns:
			# 	acc = a.split(":")
			# 	print "split",acc[0]
			
		for entry in gl_list:
		# 		if entry.against == acc[0]:
			# t = [a.split(":") for a in columns if entry.against == acc[0]]
			# print "t",t
			
			print "EC",entry.get("credit"),entry.credit				
			v = entry.credit
			# total tax, grand total, outstanding amount & rounded total
			# print "R",row
			row += [total_tax, inv.base_grand_total, inv.outstanding_amount,v,10,10,10,10]


		data.append(row)

	return columns, data

def set_account_currency(filters):
	if not (filters.get("account") or filters.get("party")):
		return filters
	else:
		filters["company_currency"] = frappe.db.get_value("Company", filters.company, "default_currency")
		account_currency = None

		if filters.get("account"):
			account_currency = get_account_currency(filters.account)
		elif filters.get("party"):
			gle_currency = frappe.db.get_value(
				"GL Entry", {
					"party_type": filters.party_type, "party": filters.party, "company": filters.company
				},
				"account_currency"
			)

			if gle_currency:
				account_currency = gle_currency
			else:
				account_currency = None if filters.party_type == "Employee" else \
					frappe.db.get_value(filters.party_type, filters.party, "default_currency")

		filters["account_currency"] = account_currency or filters.company_currency

		if filters.account_currency != filters.company_currency:
			filters["show_in_account_currency"] = 1

	return filters

def get_columns(invoice_list, additional_table_columns, filters):
	"""return columns based on filters"""
	#column1
	columns = [
		_("Invoice") + ":Link/Sales Invoice:120",
		 _("Customer Name") + "::120"
	]

	if additional_table_columns:
		columns += additional_table_columns

	income_accounts = tax_accounts = income_columns = tax_columns = against_accounts_columns = []

	if invoice_list:
		income_accounts = frappe.db.sql_list("""select distinct income_account
			from `tabSales Invoice Item` where docstatus = 1 and parent in (%s)
			order by income_account""" %
			', '.join(['%s']*len(invoice_list)), tuple([inv.name for inv in invoice_list]))

		tax_accounts = 	frappe.db.sql_list("""select distinct account_head
			from `tabSales Taxes and Charges` where parenttype = 'Sales Invoice'
			and docstatus = 1 and base_tax_amount_after_discount_amount != 0
			and parent in (%s) order by account_head""" %
			', '.join(['%s']*len(invoice_list)), tuple([inv.name for inv in invoice_list]))

	income_columns = [("Net Total" + ":Currency/currency:120")]
	for account in tax_accounts:
		if account not in income_accounts:
			tax_columns.append(account + ":Currency/currency:120")

	#column2
	columns = columns + income_columns + [_("Net Total") + ":Currency/currency:120"] + tax_columns + \
		[_("Total Tax") + ":Currency/currency:120", _("Grand Total") + ":Currency/currency:120",
		_("Outstanding Amount") + ":Currency/currency:120"]


	# select_fields = """, sum(debit_in_account_currency) as debit_in_account_currency,
	# 	sum(credit_in_account_currency) as credit_in_account_currency""" \

	against_accounts = frappe.db.sql_list(
		"""
		select distinct
		against
		from `tabGL Entry`
		where voucher_type IN ('Payment Entry' , 'Sales Invoice' , 'Journal Voucher') and against_voucher_type = "Sales Invoice"
		""".format(
			 conditions=get_conditions(filters)
		),
		filters)
	
	#column3
	for a in against_accounts:
		against_accounts_columns = _(a) + ":Currency/currency:120"
		# [{
		# 	"label": a,
		# 	"fieldname": a,
		# 	"fieldtype": "Currency",
		# 	"width": 100
		#   	}]
		columns.append(against_accounts_columns)  	

	for x in xrange(1,10):
		print "a",columns

	return columns, income_accounts, tax_accounts


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
	return frappe.db.sql("""select name, debit_to, customer, customer_name,
		base_net_total, base_grand_total, base_rounded_total, outstanding_amount {0}
		from `tabSales Invoice`
		where docstatus = 1 %s order by posting_date desc, name desc""".format(additional_query_columns or '') %
		conditions, filters, as_dict=1)

def get_invoice_income_map(invoice_list):
	income_details = frappe.db.sql("""select parent, income_account, sum(base_net_amount) as amount
		from `tabSales Invoice Item` where parent in (%s) group by parent, income_account""" %
		', '.join(['%s']*len(invoice_list)), tuple([inv.name for inv in invoice_list]), as_dict=1)

	invoice_income_map = {}
	for d in income_details:
		invoice_income_map.setdefault(d.parent, frappe._dict()).setdefault(d.income_account, [])
		invoice_income_map[d.parent][d.income_account] = flt(d.amount)

	return invoice_income_map

def get_invoice_tax_map(invoice_list, invoice_income_map, income_accounts):
	tax_details = frappe.db.sql("""select parent, account_head,
		sum(base_tax_amount_after_discount_amount) as tax_amount
		from `tabSales Taxes and Charges` where parent in (%s) group by parent, account_head""" %
		', '.join(['%s']*len(invoice_list)), tuple([inv.name for inv in invoice_list]), as_dict=1)

	invoice_tax_map = {}
	for d in tax_details:
		if d.account_head in income_accounts:
			if invoice_income_map[d.parent].has_key(d.account_head):
				invoice_income_map[d.parent][d.account_head] += flt(d.tax_amount)
			else:
				invoice_income_map[d.parent][d.account_head] = flt(d.tax_amount)
		else:
			invoice_tax_map.setdefault(d.parent, frappe._dict()).setdefault(d.account_head, [])
			invoice_tax_map[d.parent][d.account_head] = flt(d.tax_amount)

	return invoice_income_map, invoice_tax_map

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
	for cust in frappe.db.sql("""select name from `tabCustomer`
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

def get_gl_entries(filters,inv_name):

	gl_entries = frappe.db.sql(
		"""
		select
			account,
			credit,
			voucher_type,
			against_voucher_type, against_voucher, against
		from `tabGL Entry`
		where against_voucher_type = "Sales Invoice" and voucher_type IN ('Payment Entry' , 'Sales Invoice' , 'Journal Voucher')
		order by posting_date desc, name desc
		""".format(
			inv_name = inv_name
		),
		filters, as_dict=1)
	# or against_voucher = {inv_name}
	return gl_entries