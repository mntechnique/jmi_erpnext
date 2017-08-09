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
				if ((dialog.fields_dict.barcode_no.$input.val() != "") && (event.which == 13)){
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


	// Code from develop branch
	
	// },
	// add_scanner: function() {
	// 	var me = this;

	// 	me.page.add_menu_item(__("Scanner"), function () {
	// 		var dialog = new frappe.ui.Dialog({
	// 			title: __("New Items"),
	// 			fields: [
	// 				{fieldtype: "HTML", fieldname: "barcode_no", label: __("Barcode Number")},
	// 				{fieldtype: "HTML", fieldname: "scanned_items", label: __("Items List"), readonly:1}
	// 			]
	// 		});
			
	// 		me.make_dialog_search(dialog.fields_dict["barcode_no"].$wrapper);

			dialog.set_primary_action(__("Save"), function() {
				for(var i=0;i<me.dialog_items.length;i++){					
					var existing_cart_items = me.frm.doc.items.filter(function(j) {return j.item_code === me.dialog_items[i].item_code});
					if(existing_cart_items.length > 0) {
						existing_cart_items[0].qty = existing_cart_items[0].qty + me.dialog_items[i].qty;
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
			.html(frappe.render_template("jmi_scanned_items", {"particulars": me.dialog_items,"items_total":me.calculate_item_total()}))

				$(cur_dialog.fields_dict['scanned_items'].wrapper).find(".item_name").on("click",function(e){
					//enables the input field
					$(this).parent().parent('tr').children('.qty_td').children('.qty').removeAttr("disabled");
					//shows save-check icon
					$(this).parent().parent('tr').children('td').children('.fa-check-square').removeClass("hidden");
					//hides the delete icon
					$(this).parent().parent('tr').children('td').children('.fa-times').addClass("hidden");
				});
				$(cur_dialog.fields_dict['scanned_items'].wrapper).find(".save_check").on("click",function(){
					//disables the field
					$(this).parent().parent('tr').children('.qty_td').children('.qty').attr("disabled","true");
					//hides the save-check icon
					$(this).parent().parent('tr').children('td').children('.fa-check-square').addClass("hidden");
					//shows the delete icon
					$(this).parent().parent('tr').children('td').children('.fa-times').removeClass("hidden");					

					//edits the changed dialog item
					var id = $(this).parent().parent('tr').children('td').children('.item_name')[0].id;
					
					var existing_dialog_item = me.dialog_items.find(function(item) {return id === item.barcode});

					existing_dialog_item.qty = $(this).parent().parent('tr').children('.qty_td').children('.qty')[0].value;
					existing_dialog_item.amt = (existing_dialog_item.qty)*(existing_dialog_item.rate);

					me.apply_pricing_rule();
					me.discount_amount_applied = false;
					me._calculate_taxes_and_totals();
					me.calculate_discount_amount();
					me.show_items_in_item_cart();
					me.refresh(true);
					me.render_items_in_dialog();
				});
				$(cur_dialog.fields_dict['scanned_items'].wrapper).find(".del_item").on("click",function(e){
					var id = $(this).parent().parent('tr').children('td').children('.item_name')[0].id;
					me.dialog_items.splice(me.dialog_items.indexOf(me.dialog_items.find(function(i) { return i.barcode == id})), 1);

					me.apply_pricing_rule();
					me.discount_amount_applied = false;
					me._calculate_taxes_and_totals();
					me.calculate_discount_amount();
					me.show_items_in_item_cart();
					me.refresh(true);	

					me.render_items_in_dialog();
				});
		}	

			// dialog_items_html = frappe.render_template("jmi_scanned_items", {"particulars": me.dialog_items});
			// cur_dialog.fields_dict.scanned_items.set_value(dialog_items_html);
	},
	calculate_item_total: function(){
		var me=this;
		var total = 0.0;
		for(i=0;i<me.dialog_items.length;i++){
			total = total + me.dialog_items[i].amt;
		}
		return total;
	},


	// Below is the code from develop branch
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
	},
	make_menu_list: function() {
		var me = this;
		jmi.pos.super.make_menu_list();
		this.add_scanner();
	}
})