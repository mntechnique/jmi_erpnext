// POS page js.

frappe.pages['pos'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Point of Sale'),
		single_column: true
	});

	wrapper.pos = new jmi.pos(wrapper);
}

jmi = {};

jmi.pos = erpnext.pos.PointOfSale.extend({
	init: function (wrapper) {
		this.page_len = 20;
		this.freeze = false;
		this.page = wrapper.page;
		this.wrapper = $(wrapper).find('.page-content');
		this.set_indicator();
		this.onload();
		this.make_menu_list();
		this.bind_events();
		this.bind_items_event();
		this.si_docs = this.get_doc_from_localstorage();
		this.add_truck();
	},
	add_truck: function() {
		console.log(this);
		this.page.add_action_icon("fa fa-barcode", function(){console.log("trick")});
	}
})