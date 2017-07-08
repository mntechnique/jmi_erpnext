// POS page js.

var jmi = {};
jmi.super = erpnext.pos.PointOfSale.prototype;

erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({
	init: function (wrapper) {
		jmi.super.init(wrapper);
		this.add_scanner();
	},
	add_scanner: function() {
		this.page.set_secondary_action("Scanner", function(){
			console.log("scanner")
			var dialog = new frappe.ui.Dialog({
				title: __("Add Barcode"),
				fields: [
					{fieldtype: "Data", fieldname: "barcode_no", label: __("Barcode Number"), reqd:1},
					{fieldtype: "HTML", fieldname: "itemslist", label: __("Items List"), readonly:1}
				]
			});

			dialog.fields_dict.barcode_no.$input.on("change",function() {
				i_list = frappe.get_list("Item", fields=["name", "description"], filters = {"barcode":"barcode"})
				dialog.fields_dict.itemslist.set_input(i_list);	
			});

			dialog.set_primary_action(__("Save"), function() {
				var values = dialog.get_values();

			});
			dialog.show();
		}, "fa fa-barcode", true);
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