// POS page js.
try {
	erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({
		// make_search: function () {
		// 	var me = this;
		// 	this.serach_item = frappe.ui.form.make_control({
		// 		df: {
		// 			"fieldtype": "Data",
		// 			"label": "Item",
		// 			"fieldname": "pos_item",
		// 			"placeholder": __("Search Item")
		// 		},
		// 		parent: this.wrapper.find(".search-item"),
		// 		only_input: true,
		// 	});

		// 	this.serach_item.make_input();
		// 	this.serach_item.$input.on("keypress", function (event) {
		// 		if((me.serach_item.$input.val() != "") || (event.which == 13)){
		// 			me.items = me.get_items();
		// 			me.make_item_list();
		// 		}
		// 	});

		// 	this.search_item_group = this.wrapper.find('.search-item-group');
		// 	sorted_item_groups = this.get_sorted_item_groups()
		// 	var dropdown_html = sorted_item_groups.map(function(item_group) {
		// 		return "<li><a class='option' data-value='"+item_group+"'>"+item_group+"</a></li>";
		// 	}).join("");

		// 	this.search_item_group.find('.dropdown-menu').html(dropdown_html);

		// 	this.search_item_group.on('click', '.dropdown-menu a', function() {
		// 		me.selected_item_group = $(this).attr('data-value');
		// 		me.search_item_group.find('.dropdown-text').text(me.selected_item_group);

		// 		me.page_len = 20;
		// 		me.items = me.get_items();
		// 		me.make_item_list();
		// 	})

		// 	me.toggle_more_btn();

		// 	this.wrapper.on("click", ".btn-more", function() {
		// 		me.page_len += 20;
		// 		me.items = me.get_items();
		// 		me.make_item_list();
		// 		me.toggle_more_btn();
		// 	});

		// 	this.page.wrapper.on("click", ".edit-customer-btn", function() {
		// 		me.update_customer()
		// 	})
		// },

		// make_customer: function () {
		// 	var me = this;

		// 	if(!this.party_field) {
		// 		if(this.page.wrapper.find('.pos-bill-toolbar').length === 0) {
		// 			$(frappe.render_template('customer_toolbar', {
		// 				allow_delete: this.pos_profile_data["allow_delete"]
		// 			})).insertAfter(this.page.$title_area.hide());
		// 		}

		// 		this.party_field = frappe.ui.form.make_control({
		// 			df: {
		// 				"fieldtype": "Data",
		// 				"options": this.party,
		// 				"label": this.party,
		// 				"fieldname": this.party.toLowerCase(),
		// 				"placeholder": __("Select or add new customer")
		// 			},
		// 			parent: this.page.wrapper.find(".party-area"),
		// 			only_input: true,
		// 		});

		// 		this.party_field.make_input();
		// 		setTimeout(this.set_focus.bind(this), 500);
		// 		me.toggle_delete_button();
		// 	}

		// 	this.party_field.awesomeplete =
		// 		new Awesomplete(this.party_field.$input.get(0), {
		// 			minChars: 0,
		// 			maxItems: 99,
		// 			autoFirst: true,
		// 			list: [],
		// 			filter: function (item, input) {
		// 				if (item.value.includes('is_action')) {
		// 					return true;
		// 				}

		// 				input = input.toLowerCase();
		// 				item = this.get_item(item.value);
		// 				result = item ? item.searchtext.includes(input) : '';
		// 				if(!result) {
		// 					me.prepare_customer_mapper(input);
		// 				} else {
		// 					return result;
		// 				}
		// 			},
		// 			item: function (item, input) {
		// 				var d = this.get_item(item.value);
		// 				var html = "<span>" + __(d.label || d.value) + "</span>";
		// 				if(d.customer_name) {
		// 					var addx = me.address[d.value];
		// 					html += '<br><span class="text-muted ellipsis">' + __(d.customer_name) + '</span>';
		// 					// if (addx) {
		// 					// 	html += '<br><div class="text-muted ellipsis">' 
		// 					// 	html +=	addx.address_line1 ? __(addx.address_line1) + "<br>" : ""
		// 					// 	html +=	addx.address_line2 ? __(addx.address_line2) + "<br>" : ""
		// 					// 	html += addx.city ? __(addx.city) + "<br>" : "",
		// 					// 	html += addx.state ? __(addx.state) : ""
		// 					// 	+ '</div>';
		// 					// }
		// 				}

		// 				return $('<li></li>')
		// 					.data('item.autocomplete', d)
		// 					.html('<a><p>' + html + '</p></a>')
		// 					.get(0);
		// 			}
		// 		});

		// 	this.prepare_customer_mapper()
		// 	this.autocomplete_customers();

		// 	this.party_field.$input
		// 		.on('input', function (e) {
		// 			if(me.customers_mapper.length <= 1) {
		// 				me.prepare_customer_mapper(e.target.value);
		// 			}
		// 			me.party_field.awesomeplete.list = me.customers_mapper;
		// 		})
		// 		.on('awesomplete-select', function (e) {
		// 			var customer = me.party_field.awesomeplete
		// 				.get_item(e.originalEvent.text.value);
		// 			if (!customer) return;
		// 			// create customer link
		// 			if (customer.action) {
		// 				customer.action.apply(me);
		// 				return;
		// 			}
		// 			me.toggle_list_customer(false);
		// 			me.toggle_edit_button(true);
		// 			me.update_customer_data(customer);
		// 			me.refresh();
		// 			me.set_focus();
		// 			me.frm.doc["offline_pos_name"] = null;
		// 			me.frm.doc["address"] = null;
		// 			if(me.pos_profile_data.jmi_show_customer_details == 1){
		// 				me.fetch_and_render_customer_info(customer);
		// 			}

		// 			me.list_customers_btn.removeClass("view_customer");
		// 		})
		// 		.on('focus', function (e) {
		// 			$(e.target).val('').trigger('input');
		// 			me.toggle_edit_button(false);

		// 			if(me.frm.doc.items.length) {
		// 				me.toggle_list_customer(false)
		// 				me.toggle_item_cart(true)
		// 			} else {
		// 				me.toggle_list_customer(true)
		// 				me.toggle_item_cart(false)
		// 			}
		// 		})
		// 		.on("awesomplete-selectcomplete", function (e) {
		// 			var item = me.party_field.awesomeplete
		// 				.get_item(e.originalEvent.text.value);
		// 			// clear text input if item is action
		// 			if (item.action) {
		// 				$(this).val("");
		// 			}
		// 		});
		// },

		// fetch_and_render_customer_info: function(customer) {
		// 	var me = this;
		// 	frappe.call({
		// 		method: "jmi_erpnext.api.jmi_get_customer_information",
		// 		args:{
		// 			"customer_name": customer.value
		// 		},
		// 		callback: function(r){
		// 			var address_dict = me.address[customer.customer_name];
		// 			if(address_dict.address_line2){ var line2 = address_dict.address_line2}
		// 			else{line2 = ""}
		// 			if(address_dict.city){ var city = address_dict.city}
		// 			else{city = ""}						
		// 			if(address_dict.pincode){ var pincode = address_dict.pincode}
		// 			else{pincode = ""}
		// 			if(address_dict.state){ var state = address_dict.state}
		// 			else{state = ""}
		// 			if(address_dict.country){ var state = address_dict.country}
		// 			else{country = ""}
		// 			var address = address_dict.address_line1 + "<br>" +
		// 				line2 + " " + city + " " + pincode + "<br>" +
		// 				state + country;

		// 			me.frm.doc["address"] = address;
					

		// 			var customer_info = {
		// 			 	"customer": customer, 
		// 			 	"address": address,
		// 				"cust_id" : r.message
		// 			};
									
		// 			var html = frappe.render_template("jmi_customer_info", {"customer_info": customer_info})

		// 			var customer_info = $(".customer-info");

		// 			$(".customer-info").remove();
		// 			me.page.wrapper.find(".pos").prepend(html);

		// 			me.page.wrapper.find(".po-no").on("input", function (event) {
		// 				me.frm.doc["jmi_po_no"] = me.page.wrapper.find(".po-no").val();
		// 			});
		// 		}
		// 	})	
		// }
	});

} catch (e){ //online POS
	class PointOfSale extends erpnext.pos.PointOfSale {
		constructor(wrapper){
			super(wrapper);
		}

		make_cart() {
			this.cart = new POSCart({
				frm: this.frm,
				wrapper: this.wrapper.find('.cart-container'),
				events: {
					on_customer_change: (customer) => {
						this.frm.set_value('customer', customer);
						if(this.frm.doc.customer&&this.frm.doc.show_additional_customer_details){
							this.fetch_and_render_customer_info(this.frm.doc);
						}
					},
					on_field_change: (item_code, field, value) => {
						this.update_item_in_cart(item_code, field, value);
					},
					on_numpad: (value) => {
						if (value == 'Pay') {
							if (!this.payment) {
								this.make_payment_modal();
							} else {
								this.frm.doc.payments.map(p => {
									this.payment.dialog.set_value(p.mode_of_payment, p.amount);
								});

								this.payment.set_title();
							}
							this.payment.open_modal();
						}
					},
					on_select_change: () => {
						this.cart.numpad.set_inactive();
						this.set_form_action();						
					},
					get_item_details: (item_code) => {
						return this.items.get(item_code);
					}
				}
			});
		}

		fetch_and_render_customer_info(pos_doc) {
			var me = this;
			frappe.call({
				method: "jmi_erpnext.api.jmi_get_customer_information",
				args:{
					"customer_name": pos_doc.customer
				},
				callback: function(r){
					var customer_info = {
						"cust_id" : r.message
					};
					me.wrapper.find("input[data-fieldname ='jmi_customer_id']").val(customer_info.cust_id);
					me.frm.set_value("jmi_customer_id",customer_info.cust_id);
					if(me.additional_si_fields.length>0){
						for(var i=0;i<me.additional_si_fields.length;i++){
							// Saves value of jmi_customer_id
							if(me.additional_si_fields[i].df.fieldname == "jmi_customer_id"){
								me.additional_si_fields[i].value = customer_info.cust_id;
							}
						}
					}
					
					// var html = frappe.render_template("jmi_customer_info", {"customer_info": customer_info})
					// var customer_info = $(".customer-info");

					// $(".customer-info").remove();
					// me.page.wrapper.find(".pos").prepend(html);
					
					// me.page.wrapper.find(".po-no").on("input", function (event) {
					// });
				}
			});
		}
	};

	erpnext.pos.PointOfSale = PointOfSale;
}