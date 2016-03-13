"use strict";

QuestForge.prototype.ItemSlot = function (props) {
	QuestForge.applyProperties(props, this);
};

QuestForge.prototype.ItemSlot.prototype = {
	id: null,
	
	item: null,
	num: 1,
};
