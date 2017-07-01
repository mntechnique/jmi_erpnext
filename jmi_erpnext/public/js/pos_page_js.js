// POS page js.

var jmi = {};
jmi.super = erpnext.pos.PointOfSale.prototype;

erpnext.pos.PointOfSale = erpnext.pos.PointOfSale.extend({
	init: function (wrapper) {
		jmi.super.init(wrapper);
		this.add_scanner();
	},
	add_scanner: function() {
		this.page.set_secondary_action("Scanner", function(){console.log("scanner")}, "fa fa-barcode", true);
	}
})