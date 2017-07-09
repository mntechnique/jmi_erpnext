// POS page js.

var jmi = {};
jmi.super = erpnext.pos.PointOfSale.prototype;

erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({
	init: function (wrapper) {
		jmi.super.init(wrapper);
		this.add_scanner();
		this.dialog_items = [];
		this.render_items_in_dialog();
	},
	add_scanner: function() {
		var me = this;
		
		me.page.set_secondary_action("Scanner", function(){
			console.log("scanner")
			var dialog = new frappe.ui.Dialog({
				title: __("New Items"),
				fields: [
					{fieldtype: "Data", fieldname: "barcode_no", label: __("Barcode Number")},
					{fieldtype: "HTML", fieldname: "scanned_items", label: __("Items List"), readonly:1}
				]
			});

			dialog.fields_dict.barcode_no.$input.on("keypress",function(event) {
				if ((dialog.fields_dict.barcode_no.$input.val() != "") && (event.which == 13)){
					var item = jmi.super.items.filter(function(i) { return i.barcode === dialog.fields_dict.barcode_no.$input.val()});
					
					var existing_item = me.dialog_items.filter(function(i) {return i.barcode === dialog.fields_dict.barcode_no.$input.val()});
					
					console.log("Scanned barcode: ", dialog.fields_dict.barcode_no.$input.val(), ", Item:", item[0]);

					if (item.length > 0) {
						if(existing_item.length == 0) {
							item[0]["rate"] = jmi.super.price_list_data[item[0]["item_code"]];
							item[0]["qty"] = 1;
							item[0]["amt"] = item[0]["rate"] * item[0]["qty"];
							me.dialog_items.push(item[0]);
						} else {
							existing_item[0].qty += 1;
							existing_item[0]["amt"] = existing_item[0]["rate"] * existing_item[0]["qty"];
						}
					}

					me.render_items_in_dialog();
					dialog.fields_dict.barcode_no.set_value();
				}				
			});

			dialog.set_primary_action(__("Save"), function() {
				var values = dialog.get_values();
			});
			dialog.show();

		}, "fa fa-barcode", true);
	},
	render_items_in_dialog: function() {
		var me = this;
		if (cur_dialog) {
			dialog_items_html = frappe.render_template("jmi_scanned_items", {"particulars": me.dialog_items})
			cur_dialog.fields_dict.scanned_items.set_value(dialog_items_html);
		}

	}
})



function show_items_list(frm) {
	// frappe.call({
	// 	doc: frm.doc,
	// 	method: "get_service_details",
	// 	callback: function(r) {
	// 		$(frm.fields_dict['service_details_html'].wrapper)
  //          .html("<div class='text-muted text-center' style='padding-top:5%;'>No Records.</div>");

	// 	    $(frm.fields_dict['service_details_html'].wrapper)
	// 	        .html(frappe.render_template("service_vehicle_details",{"service_vehicle_details":r.message || []}));
	// 	}
	// });
}