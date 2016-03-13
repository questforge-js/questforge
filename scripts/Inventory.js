"use strict";

QuestForge.prototype.Inventory = function (props) {
	var i;
	
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('items') === false) {
		this.items = new Array(this.length);
		
		for (i = 0; i < this.length; ++i) {
			this.items[i] = null;
		}
	}
};

QuestForge.prototype.Inventory.prototype = {
	id: null,
	
	items: null,
	length: null,
	
	//== Access ==//
	
	item: function (index) {
		if (this.items[index] === null || this.items[index].num === 0) {
			return null;
		}
		
		return this.items[index].item;
	},
	
	itemName: function (index) {
		if (this.items[index] === null || this.items[index].num === 0) {
			return '';
		}
		
		return this.items[index].item.name;
	},
	
	num: function (index) {
		if (this.items[index] === null) {
			return 0;
		}
		
		return this.items[index].num;
	},
	
	//== Manipulation ==//
	
	add: function (item, quantity) {
		var i, slot;
		
		if (quantity === undefined) {
			quantity = 1;
		}
		
		for (i = 0; quantity > 0 && i < this.items.length; ++i) {
			slot = this.items[i];
			
			if (slot === null) {
				// Add to an empty slot.
				
				if (quantity > item.maxStack) {
					this.items[i] = new QuestForge.current.ItemSlot({item: item, num: item.maxStack});
					quantity -= item.maxStack;
				}
				else {
					this.items[i] = new QuestForge.current.ItemSlot({item: item, num: quantity});
					quantity = 0;
				}
			}
			else if (slot.item.id === item.id && slot.num < item.maxStack) {
				// Add to a partially-filled slot of the same item.
				
				if (quantity > item.maxStack - slot.num) {
					quantity -= item.maxStack - slot.num;
					slot.num = item.maxStack;
				}
				else {
					slot.num += quantity;
					quantity = 0;
				}
			}
		}
		
		// Return amount that couldn't fit.
		
		return quantity;
	},
	
	remove: function (item, quantity) {
		var i, slot;
		
		if (quantity === undefined) {
			quantity = 1;
		}
		
		for (i = this.items.length - 1; quantity > 0 && i >= 0; --i) {
			slot = this.items[i];
			
			if (slot.item.id === item.id) {
				if (quantity >= slot.num) {
					quantity -= slot.num;
					this.items[i] = null;
				}
				else {
					slot.num -= quantity;
					quantity = 0;
				}
			}
		}
		
		// Return amount that couldn't be removed.
		
		return quantity;
	},
	
	swap: function (index1, index2) {
		var slot;
		
		slot = this.items[index1];
		this.items[index1] = this.items[index2];
		this.items[index2] = slot;
	},
};
