"use strict";

QuestForge.prototype.BattleAction = function (props) {
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('timeRemaining') === false) {
		this.timeRemaining = QuestForge.current.game.settings.battleSpeed;
	}
};

QuestForge.prototype.BattleAction.prototype = {
	id: null,
	
	src: null,
	target: null,
	targetIsAll: false,
	
	ability: null,
	item: null,
	critical: 0,
	hits: 1,
	hitResults: null,
	timeRemaining: null,
	
	stage: 0,
	frame: 0,
	effects: null,
	
	nextStage: function (amount) {
		this.stage += (amount !== undefined ? amount : 1);
		this.frame = 0;
	},
	
	nextTarget: function () {
		var previousTargetPosition;
		
		if (this.targetIsAll === true) {
			previousTargetPosition = this.target.position;
			this.target = QuestForge.current.battleEngine.arena.getPreviousSelectableCombatant(this.target);
			
			if (this.target !== null && this.target.position < previousTargetPosition) {
				// Repeat this action stage with the new target.
				this.frame = 0;
				return true;
			}
		}
		
		if (this.src.isPortrait === true) {
			this.nextStage(2);
		}
		else {
			this.nextStage();
		}
		
		return false;
	},
	
	tick: function () {
		switch (this.stage) {
		case 0:
			this.ability.battleStepForwardTick(this);
			break;
		
		case 1:
			this.ability.battleGroupEffectTick(this);
			break;
		
		case 2:
			this.ability.battleSingleEffectTick(this);
			break;
		
		case 3:
			this.ability.battleStepBackwardTick(this);
			break;
		
		case 4:
			this.ability.battleCooldownTick(this);
			break;
		
		case 5:
			// Done with the action.
			return false;
			break;
		}
		
		return true;
	},
	
	stepForwardTick: function () {
		var message;
		
		++this.frame;
		
		if (this.frame > 16) {
			if (this.frame === 48) {
				QuestForge.current.battleEngine.view.contractBox('event');
				this.src.stance = null;
				this.nextStage(3);
			}
			
			return;
		}
		
		if (this.src.side === 0 && QuestForge.current.input.throttledCritical === true && this.critical === 0) {
			this.critical = -1;
		}
		
		this.src.stance = (this.frame % 4) >>> 1;
		
		if (this.src.isPortrait === true) {
			switch (this.frame % 4) {
			case 2:
				QuestForge.current.battleEngine.view.drawPortrait(this.src, true);
				break;
			
			case 0:
				QuestForge.current.battleEngine.view.drawPortrait(this.src);
				break;
			}
		}
		else {
			this.src.arenaX -= 2;
		}
		
		if (this.frame === 16) {
			message = this.ability.payItemDues(this);
			
			if (message === null) {
				if (this.src.isPortrait === true) {
					this.nextStage(2);
				}
				else {
					this.nextStage();
				}
			}
			else {
				QuestForge.current.battleEngine.view.expandBox('event', message);
			}
		}
	},
	
	stepBackwardTick: function () {
		++this.frame;
		
		this.src.stance = (this.frame % 4) >>> 1;
		
		if (this.src.isPortrait === false) {
			this.src.arenaX += 2;
		}
		
		if (this.frame >= 16) {
			this.src.stance = null;
			this.nextStage();
		}
	},
	
	cooldownTick: function () {
		++this.frame;
		
		if ((QuestForge.current.battleEngine.conf.enableActiveTime === false || this.frame >= QuestForge.current.game.settings.battleSpeed) && (QuestForge.current.battleEngine.conf.enableEffectsDuringSelection === true || QuestForge.current.battleEngine.view.effects.length === 0)) {
			this.nextStage();
		}
	},
};
