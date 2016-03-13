"use strict";

QuestForge.prototype.StatusScreenEngine = function (props) {
	this.conf = {
	};
	
	QuestForge.applyProperties(props, this.conf);
};

QuestForge.registerEngine('StatusScreenEngine', []);

QuestForge.prototype.StatusScreenEngine.prototype = {
	conf: null,
	
	init: function (character) {
		QuestForge.current.mainMenuEngine.drawMessage('Not implemented yet');
		
		return false;
	},
};
