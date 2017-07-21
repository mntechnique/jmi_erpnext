// POS page js.

var jmi = {};
jmi.pos = {};
jmi.pos.super = erpnext.pos.PointOfSale.prototype;

erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({
	init: function (wrapper) {
		jmi.pos.super.init(wrapper);
		this.add_scanner();
		this.dialog_items = [];
		this.render_items_in_dialog();
	},
	make_new_cart: function() {
		console.log("make new cart");
		jmi.pos.super.make_new_cart();
		this.add_scanner();
	},
	add_scanner: function() {
		var me = this;
		
		me.page.set_secondary_action("Scanner", function(){
			var dialog = new frappe.ui.Dialog({
				title: __("New Items"),
				fields: [
					{fieldtype: "HTML", fieldname: "barcode_no", label: __("Barcode Number")},
					{fieldtype: "HTML", fieldname: "scanned_items", label: __("Items List"), readonly:1}
				]
			});
			
			me.make_dialog_search(dialog.fields_dict["barcode_no"].$wrapper);

			dialog.set_primary_action(__("Save"), function() {
				for(var i=0;i<me.dialog_items.length;i++){					
					var existing_cart_items = me.frm.doc.items.filter(function(j) {return j.item_code === me.dialog_items[i].item_code});
					
					if(existing_cart_items.length > 0) {
						//No need. Calculated automatically.
						//existing_cart_items[0].qty = existing_cart_items[0].qty + me.dialog_items[i].qty;
						// existing_items[i]["amt"] = existing_items[i]["rate"] * existing_items[i]["qty"];
					} else {
						me.frm.doc.items.push(me.dialog_items[i]);
					}
				}
				
				me.apply_pricing_rule();
				me.discount_amount_applied = false;
				me._calculate_taxes_and_totals();
				me.calculate_discount_amount();
				me.show_items_in_item_cart();
				me.refresh(true);
				
				
				dialog.clear(); dialog.hide();				
			});
			dialog.show();
			dialog.has_primary_action = false;

		}, "fa fa-barcode", true);
	},
	render_items_in_dialog: function() {
		var me = this;
		if (cur_dialog) {
			dialog_items_html = frappe.render_template("jmi_scanned_items", {"particulars": me.dialog_items})
			cur_dialog.fields_dict.scanned_items.set_value(dialog_items_html);
		}
	},
	make_dialog_search: function(parent) {
		var me = this;
		me.dialog_search = frappe.ui.form.make_control({
			df: {
				"fieldtype": "Data",
				"label": "Item",
				"fieldname": "dialog_item",
				"placeholder": __("Search Item")
			},
			parent: parent,
			only_input: true
		});

		me.dialog_search.make_input();

		me.dialog_search.$input.on("keyup", function (e) {
			var keyCode = e.keyCode || e.which;

			if ((me.dialog_search.$input.val() != "") && (keyCode == 13)){

				var item = me.items.filter(function(i) { return i.barcode === me.dialog_search.$input.val()});
				var existing_item = me.dialog_items.filter(function(i) {return i.barcode === me.dialog_search.$input.val()});

				if (item.length > 0) {
					if(existing_item.length == 0) {
						item[0]["rate"] = me.price_list_data[item[0]["item_code"]];
						item[0]["qty"] = 1;
						item[0]["amt"] = item[0]["rate"] * item[0]["qty"];
						me.dialog_items.push(item[0]);

						me.get_items(item[0]["item_code"]);
					} else {
						existing_item[0].qty += 1;
						existing_item[0]["amt"] = existing_item[0]["rate"] * existing_item[0]["qty"];
					}
				}

				me.render_items_in_dialog();
				me.dialog_search.$input.val();
			}				
		});	
	}

})