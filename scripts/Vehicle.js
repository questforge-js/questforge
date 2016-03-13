"use strict";

QuestForge.prototype.Vehicle = function (props) {
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('autoSwitchVehicles') === false) {
		this.autoSwitchVehicles = [];
	}
};

QuestForge.prototype.Vehicle.prototype = {
	id: null,
	
	minTerrainLevel: 40,
	maxTerrainLevel: 69,
	terrainStep: 1,
	tileX: 0,
	tileY: 0,
	speed: 1,
	bob: -1,
	autoSwitchVehicles: null,
	overrideSprite: false,
};
