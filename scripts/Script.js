"use strict";

QuestForge.prototype.Script = function (props) {
	QuestForge.applyProperties(props, this);
	this.reset();
};

QuestForge.prototype.Script.prototype = {
	id: null,
	
	actions: null,
	pos: 0,
	subpos: 0,
	
	reset: function () {
		this.pos = 0;
		this.subpos = 0;
	},
	
	tick: function () {
		var action;
		
		if (this.actions.length <= this.pos) {
			return false;
		}
		
		action = this.actions[this.pos];
		
		switch (typeof action) {
		case 'function':
			action(this.subpos);
			break;
		
		case 'object':
			if (action instanceof Array) {
				// [object, funcStr, argsArr]
				
				action[0][action[1]].apply(action[0], action[2]);
			}
			break;
		}
		
		++this.pos;
		
		if (typeof this.actions[this.pos] === 'number') {
			// Repeat the last action the given number of times.
			
			++this.subpos;
			
			if (this.subpos <= action) {
				// Repeat the last action.
				
				--this.pos;
			}
			else {
				// Skip to next action.
				
				++this.pos;
				this.subpos = 0;
			}
		}
		
		return true;
	},
};
