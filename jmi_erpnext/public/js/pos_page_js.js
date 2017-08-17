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
			console.log(event)
			console.log(me.serach_item)
			if((me.serach_item.$input.val() != "") && (event.which == 13)){
				console.log("inside if")
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
	}
})	