"use strict";

QuestForge.prototype.Item = function (props) {
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('equippableBy') === false) {
		this.equippableBy = [];
	}
	
	if (props.hasOwnProperty('equipPositions') === false) {
		this.equipPositions = [];
	}
	
	if (props.hasOwnProperty('stats') === false) {
		this.stats = {};
	}
};

QuestForge.prototype.Item.prototype = {
	id: null,
	
	name: '',
	
	battleAbility: null,
	menuAbility: null,
	
	consumable: false,
	equipMaxStack: 1,
	equippableBy: null,
	equipPositions: null,
	maxStack: 99,
	mp: 0,
	spriteX: 0,
	spriteY: 0,
	effect: 2, // Type of visual effect displayed over target combatant.
	stats: null,
	
	isEquippableAt: function (equipSlot) {
		return QuestForge.arrayIndexOf(this.equipPositions, equipSlot) !== -1;
	},
	
	isEquippableBy: function (subject) {
		var candidate, i;
		
		for (i = 0; i < this.equippableBy.length; ++i) {
			candidate = this.equippableBy[i];
			
			if (subject instanceof QuestForge.current.Character) {
				if (candidate instanceof QuestForge.current.Character) {
					if (subject.id === candidate.id) {
						return true;
					}
				}
				else if (candidate instanceof QuestForge.current.Job) {
					if (subject.job.id === candidate.id) {
						return true;
					}
				}
			}
			else if (subject instanceof QuestForge.current.Job) {
				if (candidate instanceof QuestForge.current.Job) {
					if (subject.id === candidate.id) {
						return true;
					}
				}
			}
		}
		
		return false;
	},
};
