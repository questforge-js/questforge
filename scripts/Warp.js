"use strict";

QuestForge.prototype.Warp = function (props) {
	QuestForge.applyProperties(props, this);
};

QuestForge.prototype.Warp.prototype = {
	id: null,
	
	map: null,
	x: 0,
	y: 0,
	vehicle: null,
};
