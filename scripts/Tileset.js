"use strict";

QuestForge.prototype.Tileset = function (props) {
	QuestForge.applyProperties(props, this);
};

QuestForge.prototype.Tileset.prototype = {
	id: null,
	
	name: null,
	url: null,
	urlId: null,
	offsetX: 0,
	offsetY: 0,
};
