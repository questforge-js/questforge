"use strict";

QuestForge.prototype.Track = function (props) {
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('urls') === false) {
		this.urls = {};
	}
	
	if (props.hasOwnProperty('buffers') === false) {
		this.buffers = {};
	}
};

QuestForge.prototype.Track.prototype = {
	id: null,
	
	name: null,
	urls: null,
	loopStart: 0,
	loopEnd: null,
	buffers: null,
};
