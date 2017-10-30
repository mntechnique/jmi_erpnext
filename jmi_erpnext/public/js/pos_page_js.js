// POS page js.

var jmi = {};
jmi.pos = {};
jmi.pos.super = erpnext.pos.PointOfSale.prototype;

erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({

	make_search: function () {
		var me = this;
		this.serach_item = frappe.ui.form.make_control({
			df: {
				"fieldtype": "Data",
				"label": "Item",
				"fieldname": "pos_item",
				"placeholder": __("Search Item")
			},
			parent: this.wrapper.find(".search-item"),
			only_input: true,
		});

		this.serach_item.make_input();
		this.serach_item.$input.on("keypress", function (event) {
			if((me.serach_item.$input.val() != "") || (event.which == 13)){
				me.items = me.get_items();
				me.make_item_list();
			}
		});

		this.search_item_group = this.wrapper.find('.search-item-group');
		sorted_item_groups = this.get_sorted_item_groups()
		var dropdown_html = sorted_item_groups.map(function(item_group) {
			return "<li><a class='option' data-value='"+item_group+"'>"+item_group+"</a></li>";
		}).join("");

		this.search_item_group.find('.dropdown-menu').html(dropdown_html);

		this.search_item_group.on('click', '.dropdown-menu a', function() {
			me.selected_item_group = $(this).attr('data-value');
			me.search_item_group.find('.dropdown-text').text(me.selected_item_group);

			me.page_len = 20;
			me.items = me.get_items();
			me.make_item_list();
		})

		me.toggle_more_btn();

		this.wrapper.on("click", ".btn-more", function() {
			me.page_len += 20;
			me.items = me.get_items();
			me.make_item_list();
			me.toggle_more_btn();
		});

		this.page.wrapper.on("click", ".edit-customer-btn", function() {
			me.update_customer()
		})
	},

	make_customer: function () {
		var me = this;

		if(!this.party_field) {
			if(this.page.wrapper.find('.pos-bill-toolbar').length === 0) {
				$(frappe.render_template('customer_toolbar', {
					allow_delete: this.pos_profile_data["allow_delete"]
				})).insertAfter(this.page.$title_area.hide());
			}

			this.party_field = frappe.ui.form.make_control({
				df: {
					"fieldtype": "Data",
					"options": this.party,
					"label": this.party,
					"fieldname": this.party.toLowerCase(),
					"placeholder": __("Select or add new customer")
				},
				parent: this.page.wrapper.find(".party-area"),
				only_input: true,
			});

			this.party_field.make_input();
			setTimeout(this.set_focus.bind(this), 500);
			me.toggle_delete_button();
		}

		this.party_field.awesomeplete =
			new Awesomplete(this.party_field.$input.get(0), {
				minChars: 0,
				maxItems: 99,
				autoFirst: true,
				list: [],
				filter: function (item, input) {
					if (item.value.includes('is_action')) {
						return true;
					}

					input = input.toLowerCase();
					item = this.get_item(item.value);
					result = item ? item.searchtext.includes(input) : '';
					if(!result) {
						me.prepare_customer_mapper(input);
					} else {
						return result;
					}
				},
				item: function (item, input) {
					var d = this.get_item(item.value);
					var html = "<span>" + __(d.label || d.value) + "</span>";

					if(d.customer_name) {
						var addx = me.address[d.value];
						html += '<br><span class="text-muted ellipsis">' + __(d.customer_name) + '</span>';
						if (addx) {
							html += '<br><div class="text-muted ellipsis">' 
							html +=	addx.address_line1 ? __(addx.address_line1) + "<br>" : ""
							html +=	addx.address_line2 ? __(addx.address_line2) + "<br>" : ""
							html += addx.city ? __(addx.city) + "<br>" : "",
							html += addx.state ? __(addx.state) : ""
							+ '</div>';
						}
					}

					return $('<li></li>')
						.data('item.autocomplete', d)
						.html('<a><p>' + html + '</p></a>')
						.get(0);
				}
			});

		this.prepare_customer_mapper()
		this.autocomplete_customers();

		this.party_field.$input
			.on('input', function (e) {
				if(me.customers_mapper.length <= 1) {
					me.prepare_customer_mapper(e.target.value);
				}
				me.party_field.awesomeplete.list = me.customers_mapper;
			})
			.on('awesomplete-select', function (e) {
				var customer = me.party_field.awesomeplete
					.get_item(e.originalEvent.text.value);
				if (!customer) return;
				// create customer link
				if (customer.action) {
					customer.action.apply(me);
					return;
				}
				me.toggle_list_customer(false);
				me.toggle_edit_button(true);
				me.update_customer_data(customer);
				me.refresh();
				me.set_focus();
				me.render_customer_info(customer);

				me.list_customers_btn.removeClass("view_customer");
			})
			.on('focus', function (e) {
				$(e.target).val('').trigger('input');
				me.toggle_edit_button(false);

				if(me.frm.doc.items.length) {
					me.toggle_list_customer(false)
					me.toggle_item_cart(true)
				} else {
					me.toggle_list_customer(true)
					me.toggle_item_cart(false)
				}
			})
			.on("awesomplete-selectcomplete", function (e) {
				var item = me.party_field.awesomeplete
					.get_item(e.originalEvent.text.value);
				// clear text input if item is action
				if (item.action) {
					$(this).val("");
				}
			});
	},
	render_customer_info: function(customer) {
		var me = this;
		var address = me.address[customer.customer_name];

		var customer_info = {"customer": customer, "address": address};
		
		var html = frappe.render_template("jmi_customer_info", {"customer_info": customer_info})
		debugger;

		$(".customer-info").remove();
		me.page.wrapper.find(".pos").prepend(html);
	},

	// prepare_customer_mapper: function(key) {

	// 	var me = this;
	// 	var customer_data = '';

	// 	if (key) {
	// 		key = key.toLowerCase().trim();
	// 		var re = new RegExp('%', 'g');
	// 		var reg = new RegExp(key.replace(re, '\\w*\\s*[a-zA-Z0-9]*'));


	// 		customer_data =  $.grep(this.customers, function(data) {
	// 			contact = me.contacts[data.name];
	// 			address = me.address[data.name]; //New
	// 			// console.log("AL1: ", address["address_line1"], "Reg: ", reg.test(address["address_line1"]));
	// 			// console.log("AL2: ", address["address_line2"], "Reg: ", reg.test(address["address_line1"]));
	// 			// console.log("City: ", address["city"], "Reg: ", reg.test(address["city"]));
	// 			// console.log("State: ", address["state"], "Reg: ", reg.test(address["state"]));
				
	// 			if(reg.test(data.name.toLowerCase())
	// 				|| reg.test(data.customer_name.toLowerCase())
	// 				|| (contact && reg.test(contact["mobile_no"]))
	// 				|| (contact && reg.test(contact["phone"]))
	// 				|| (address && reg.test(address["address_line1"])) //New
	// 				|| (address && reg.test(address["address_line2"])) //New
	// 				|| (address && reg.test(address["city"])) //New
	// 				|| (address && reg.test(address["state"])) //New
	// 				|| (data.customer_group && reg.test(data.customer_group.toLowerCase()))) {
	// 					return data;
	// 			}
	// 		})
	// 	} else {
	// 		console.log("NOT FOUND", key);
	// 		customer_data = this.customers;
	// 	}

	// 	this.customers_mapper = [];

	// 	customer_data.forEach(function (c, index) {
	// 		if(index < 30) {
	// 			contact = me.contacts[c.name];
	// 			address = me.address[c.name]; //New

	// 			if(contact && !c['phone']) {
	// 				c["phone"] = contact["phone"];
	// 				c["email_id"] = contact["email_id"];
	// 				c["mobile_no"] = contact["mobile_no"];
	// 			}
				
	// 			if(address) {
	// 				c["address_line1"] = address["address_line1"];
	// 				c["address_line2"] = address["address_line2"];
	// 				c["city"] = address["city"];
	// 				c["state"] = address["state"];
	// 			}

	// 			me.customers_mapper.push({
	// 				label: c.name,
	// 				value: c.name,
	// 				customer_name: c.customer_name,
	// 				customer_group: c.customer_group,
	// 				territory: c.territory,
	// 				phone: contact ? contact["phone"] : '',
	// 				mobile_no: contact ? contact["mobile_no"] : '',
	// 				email_id: contact ? contact["email_id"] : '',
	// 				address_line1: address ? c.address_line1 : '', //New
	// 				address_line2: address ? c.address_line2 : '', //New
	// 				city: address ? c.city : '', //New
	// 				state: address ? c.state : '', //New
	// 				searchtext: ['customer_name', 'customer_group', 'name', 'value',
	// 					'label', 'email_id', 'phone', 'mobile_no', 'address_line1', 'address_line2', 'city', 'state'] //New
	// 					.map(key => c[key]).join(' ')
	// 					.toLowerCase()
	// 			});
	// 		} else {
	// 			return;
	// 		}
	// 	});

	// 	this.customers_mapper.push({
	// 		label: "<span class='text-primary link-option'>"
	// 		+ "<i class='fa fa-plus' style='margin-right: 5px;'></i> "
	// 		+ __("Create a new Customer")
	// 		+ "</span>",
	// 		value: 'is_action',
	// 		action: me.add_customer
	// 	});
	// },
})