# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "jmi_erpnext"
app_title = "JMI ERPNext"
app_publisher = "MN Technique"
app_description = "ERPNext Customization for JMI"
app_icon = "fa fa-barcode"
app_color = "#800000"
app_email = "support@mntechnique.com"
app_license = "GPL v3"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/css/jmi.min.css"
app_include_js = "/assets/js/jmi.min.js"

# include js, css files in header of web template
# web_include_css = "/assets/jmi_erpnext/css/jmi_erpnext.css"
# web_include_js = "/assets/jmi_erpnext/js/jmi_erpnext.js"

# include js in page
page_js = {
	"pos" : "public/js/pos_page_js.js",
	"point-of-sale" : "public/js/pos_page_js.js"
}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "jmi_erpnext.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "jmi_erpnext.install.before_install"
# after_install = "jmi_erpnext.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "jmi_erpnext.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

doc_events = {
	"Item": {
		"after_insert": "jmi_erpnext.api.item_on_insert",
		"on_update": "jmi_erpnext.api.item_on_update",
		"on_trash": "jmi_erpnext.api.item_on_trash"
	}
}

# Scheduled Tasks
# ---------------

# scheduler_even	ts = {
# 	"all": [
# 		"jmi_erpnext.tasks.all"
# 	],
# 	"daily": [
# 		"jmi_erpnext.tasks.daily"
# 	],
# 	"hourly": [
# 		"jmi_erpnext.tasks.hourly"
# 	],
# 	"weekly": [
# 		"jmi_erpnext.tasks.weekly"
# 	]
# 	"monthly": [
# 		"jmi_erpnext.tasks.monthly"
# 	]
# }

scheduler_events = {
	"hourly": [
		"jmi_erpnext.item_data_export.export_item_sheets"
	]
}

# Testing
# -------

# before_tests = "jmi_erpnext.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "jmi_erpnext.event.get_events"
# }

fixtures = [
	{
		"dt":"Custom Field",
		"filters":[
			["name", "in", [
			"Customer-sb_jmi_customer_id",
			"Customer-jmi_customer_id",
			"Sales Invoice-section_break_167",
			"Sales Invoice-jmi_customer_id",
			"Sales Invoice-column_break_169",
			"Sales Invoice-jmi_po_no"
			]],
		]
	},
	{"dt": "Print Format", "filters": [["name", "in", ["Stationary - POS Invoice","Mobile - POS Invoice"]]]},
	{"dt": "Letter Head", "filters": [["name", "in", ["Majestic Solutions"]]]},
	{"dt": "Property Setter", "filters": [["name", "in", [
		"POS Profile-print_format-default",
		"POS Profile-print_format_for_online-default"
	]]]},
]
