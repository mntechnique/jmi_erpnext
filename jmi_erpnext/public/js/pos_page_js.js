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
		// $(".btn-secondary").click(function(){
	 //        // $(".modal-dialog").modal({backdrop: "static"});
	 //    });
	},
	make_new_cart: function() {
		jmi.pos.super.make_new_cart();
		this.add_scanner();
	},	
	add_scanner: function() {
		var me = this;
		
		me.page.set_secondary_action("Scanner", function(){
			var dialog = new frappe.ui.Dialog({
				title: __("New Items"),
				fields: [
					{fieldtype: "Data", fieldname: "barcode_no", label: __("Barcode Number")},
					{fieldtype: "HTML", fieldname: "scanned_items", label: __("Items List"), readonly:1}
				]
			});
			dialog.fields_dict.barcode_no.$input.on("keydown",function(event) { 
				if ((dialog.fields_dict.barcode_no.$input.val() != "") && (event.which == 9)){
					event.preventDefault();
					var item = me.items.filter(function(i) { return i.barcode === dialog.fields_dict.barcode_no.$input.val()});
					var existing_item = me.dialog_items.filter(function(i) {return i.barcode === dialog.fields_dict.barcode_no.$input.val()});

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
					dialog.fields_dict.barcode_no.set_value();
				}				
			});



			dialog.set_primary_action(__("Save"), function() {
				for(var i=0;i<me.dialog_items.length;i++){					
					var existing_cart_items = me.frm.doc.items.filter(function(j) {return j.item_code === me.dialog_items[i].item_code});
			
					if(existing_cart_items.length > 0) {
						existing_cart_items[0].qty = existing_cart_items[0].qty + me.dialog_items[i].qty;
						// existing_items[i]["amt"] = existing_items[i]["rate"] * existing_items[i]["qty"];
					}else{
						me.frm.doc.items.push(me.dialog_items[i]);
					}
				}
				
				me.apply_pricing_rule();
				me.discount_amount_applied = false;
				me._calculate_taxes_and_totals();
				me.calculate_discount_amount();
				me.show_items_in_item_cart();
				me.refresh(true);
				
				me.dialog_items = [];
				dialog.clear(); dialog.hide();				
			});
			dialog.show();
			dialog.has_primary_action = false;

		}, "fa fa-barcode", true);
	},
	render_items_in_dialog: function() {
		var me = this;
		if (cur_dialog) {
			$(cur_dialog.fields_dict['scanned_items'].wrapper)
			.html(frappe.render_template("jmi_scanned_items", {"particulars": me.dialog_items}))

			// for(i=0;i<me.dialog_items.length;i++){
				console.log(this);
				$(cur_dialog.fields_dict['scanned_items'].wrapper).find(".item_name").on("click",function(e){

					// $(this).find('name="qty"data-item-code=""')

					$(this).parent().parent('tr').children('.qty_td').children('.qty').removeAttr("disabled");
			
					$(this).parent().parent('tr').children('td').children('.fa-check-square').removeClass("hidden");
				});
				$(cur_dialog.fields_dict['scanned_items'].wrapper).find(".save_check").on("click",function(){

					$(this).parent().parent('tr').children('.qty_td').children('.qty').attr("disabled","true");

					$(this).parent().parent('tr').children('td').children('.fa-check-square').addClass("hidden");

					me.apply_pricing_rule();
					me.discount_amount_applied = false;
					me._calculate_taxes_and_totals();
					me.calculate_discount_amount();
					me.show_items_in_item_cart();
					me.refresh(true);
				});
			// }	


			// dialog_items_html = frappe.render_template("jmi_scanned_items", {"particulars": me.dialog_items});
			// cur_dialog.fields_dict.scanned_items.set_value(dialog_items_html);
		}

	}
})