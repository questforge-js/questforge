"use strict";

QuestForge.prototype.Ability = function (props) {
	QuestForge.applyProperties(props, this);
	
	// Selection types:
	// 0: Individuals only
	// 1: Invididuals or all
	// 2: All only
	// 3: Slain individuals only
	// 4: Slain individuals or all slain
	// 5: All slain only
	// 6: Self only
	
	// To do: Selection types 3 - 5
	
	if (props.hasOwnProperty('applyBattleConsequences') === false) {
		this.applyBattleConsequences = QuestForge.current.Ability.battleFightConsequences;
	}
	
	if (props.hasOwnProperty('battleGroupEffectTick') === false) {
		this.battleSingleEffectTick = QuestForge.current.Ability.simpleBattleGroupEffectTick;
	}
	
	if (props.hasOwnProperty('battleSingleEffectTick') === false) {
		this.battleSingleEffectTick = QuestForge.current.Ability.simpleBattleSingleEffectTick;
	}
};

QuestForge.prototype.Ability.prototype = {
	id: null,
	
	name: '',
	menu: null,
	
	selectionType: 0,
	
	// Simple effect settings (may be ignored by abilities with fancier effects).
	
	effectType: 0,
	effectX: 0,
	effectY: 0,
	
	prepareBattleAction: function (action) {
	},
	
	applyBattleConsequences: null,
	
	battleTick: function (action) {
		return action.tick();
	},
	
	battleStepForwardTick: function (action) {
		action.stepForwardTick();
	},
	
	battleGroupEffectTick: function (action) {
		action.nextStage();
		this.battleTick(action);
	},
	
	battleSingleEffectTick: null,
	
	battleStepBackwardTick: function (action) {
		action.stepBackwardTick();
	},
	
	battleCooldownTick: function (action) {
		action.cooldownTick();
	},
	
	payItemDues: function (action) {
		if (action.item === null) {
			return null;
		}
		
		if (action.src.character.mp < action.item.mp) {
			return 'Not enough MP!';
		}
		
		if (action.item.consumable === true && QuestForge.current.game.currentParty.items.remove(action.item, 1) !== 0) {
			return 'Out of '+action.item.name+'!';
		}
		
		action.src.character.mp -= action.item.mp;
		
		return null;
	},
};

//== Templates ==//

QuestForge.prototype.Ability.prepareBattleActionFight = function (action) {
	var evadeChances, hitChances, hitRating, i, j;
	
	// Calculate the number of hits.
	
	hitChances = action.src.character.getHitChances();
	hitRating = action.target.character.stats.hitRating;
	evadeChances = (action.target.side === 0 ? action.target.character.getEvadeChances() : 0);
	
	if (action.target.row === 0) {
		hitRating = hitRating >>> 1;
	}
	
	action.hits = hitChances;
	action.hitResults = new Array(hitChances);
	
	for (i = 0; i < hitChances; ++i) {
		if (Math.floor(Math.random() * 100) <= hitRating) {
			action.hitResults[i] = 1;
			
			for (j = 0; j < evadeChances; ++j) {
				if (Math.floor(Math.random() * 100) <= action.target.character.stats.evade) {
					action.hitResults[i] = -1;
					--action.hits;
				}
			}
		}
		else {
			action.hitResults[i] = 0;
			--action.hits;
		}
	}
};

QuestForge.prototype.Ability.battleFightConsequences = function (action) {
	var damage, hitDamage, i;
	
	damage = 0;
	
	for (i = 0; i < action.hits; ++i) {
		hitDamage = action.src.character.stats.attack;
		
		if (action.target.character.effects.asleep || action.target.character.effects.paralyzed) {
			hitDamage *= 1.25;
		}
		
		hitDamage = Math.random() * hitDamage / 2 + hitDamage - action.target.character.stats.defense;
		
		if (action.critical > 0) {
			hitDamage *= action.critical;
		}
		
		hitDamage = Math.floor(hitDamage);
		
		if (hitDamage <= 0) {
			hitDamage = 1;
		}
		
		damage += hitDamage;
	}
	
	QuestForge.current.battleEngine.applyDamage(action.target, damage);
};

QuestForge.prototype.Ability.simpleBattleGroupEffectTick = function (action) {
	var q;
	
	q = QuestForge.current;
	
	if (this.effectType === 0 && action.src.isPortrait === false) {
		// Casting effect forward.
		action.src.stance = 3;
		
		q.battleEngine.view.drawAvatarSprite(action.src, q.view.tilesets.effects, effectSpriteX, effectSpriteY + (action.frame % 8 < 4 ? 0 : 1), 2, 2, action.src.arenaX - q.battleEngine.conf.avatarWidth * q.view.conf.tileWidth, action.src.arenaY, 1);
	}
	
	++action.frame;
};

QuestForge.prototype.Ability.simpleBattleSingleEffectTick = function (action) {
	var effect, hitSuccessful, i, item, itemEffect, itemSpriteX, itemSpriteY, q, x, y;
	
	q = QuestForge.current;
	
	if (action.frame === 0) {
		if (q.battleEngine.conf.enableEffectsDuringSelection === false && q.battleEngine.view.effects.length > 0) {
			// Wait for effects to finish.
			return;
		}
		
		action.effects = [];
		this.prepareBattleAction(action);
	}
	
	if (action.frame >= action.hitResults.length * 8) {
		if (q.battleEngine.conf.enableEffectsDuringSelection === false && q.battleEngine.view.effects.length > 0) {
			// Wait for effects to finish.
			return;
		}
		
		if (action.hits === 0) {
			q.battleEngine.view.addEffectMiss(action.target);
		}
		else {
			this.applyBattleConsequences(action);
		}
		
		action.nextTarget();
		return;
	}
	
	item = (action.src.character.equipment.rHand.num(0) > 0 ? action.src.character.equipment.rHand.item(0) : null);
	
	if (item === null) {
		itemSpriteX = 14;
		itemSpriteY = null;
		itemSpriteX = action.src.character.battleSprite * 2;
		itemSpriteY = 6;
		itemEffect = 1;
	}
	else {
		itemSpriteX = item.spriteX;
		itemSpriteY = item.spriteY;
		itemEffect = item.effect;
	}
	
	if (this.effectType === -1) {
		// Using equipped weapon.
		
		if (action.hits >= 1 && action.src.side === 0 && action.frame < 4 && q.input.throttledCritical === true && action.critical === 0) {
			switch (action.frame) {
			case 0:
				action.critical = 2;
				q.view.setBackground('#f83800');
				break;
			
			case 1:
				action.critical = 1;
				q.view.setBackground('#fcfcfc');
				break;
			
			case 2:
				action.critical = .5;
				q.view.setBackground('#bcbcbc');
				break;
			
			case 3:
				action.critical = .25;
				q.view.setBackground('#7c7c7c');
				break;
			}
		}
		
		if (action.frame === 7 && action.critical > 0) {
			q.view.setBackground('#000');
		}
	}
	
	if (action.src.isPortrait === false) {
		if (action.frame % 8 < 4) {
			action.src.stance = 2;
			
			if (itemSpriteY !== null) {
				switch (itemEffect) {
				case 1:
					break;
				
				default:
					q.battleEngine.view.drawAvatarSprite(action.src, q.view.tilesets.effects, itemSpriteX, itemSpriteY, 2, 1, action.src.arenaX + (q.view.conf.tileWidth >>> 1), action.src.arenaY - (q.view.conf.tileHeight >>> 1), 1, true);
				}
			}
		}
		else {
			action.src.stance = 1;
			
			if (itemSpriteY !== null) {
				switch (itemEffect) {
				case 1:
					q.battleEngine.view.drawAvatarSprite(action.src, q.view.tilesets.effects, itemSpriteX, itemSpriteY, 2, 2, action.src.arenaX - q.battleEngine.conf.avatarWidth * q.view.conf.tileWidth + (q.view.conf.tileWidth >>> 2), action.src.arenaY + q.view.conf.tileHeight, 1);
					break;
				
				default:
					q.battleEngine.view.drawAvatarSprite(action.src, q.view.tilesets.effects, itemSpriteX, itemSpriteY, 2, 2, action.src.arenaX - q.battleEngine.conf.avatarWidth * q.view.conf.tileWidth, action.src.arenaY, 1);
				}
			}
		}
	}
	
	if (action.hitResults[action.frame >>> 3] === 1) {
		switch (this.effectType === -1 ? itemEffect : this.effectType) {
		case 1: // Punch.
			if (action.frame % 4 === 0) {
				x = Math.floor(Math.random() * action.target.getPixelWidth() / -2);
				y = Math.floor((Math.random() - .5) * action.target.getPixelHeight() * 3 / 4);
				
				q.battleEngine.view.addEffect({
					target: action.target,
					spriteX: 0,//itemSpriteX,
					spriteY: 5,//2,
					width: 2,
					x: x - q.view.conf.tileWidth,
					y: y - q.view.conf.tileHeight,
					duration: 12,
				});
				
				q.battleEngine.view.addEffect({
					target: action.target,
					spriteX: 0,//itemSpriteX,
					spriteY: 5,//2,
					width: 2,
					x: x - q.view.conf.tileWidth,
					y: y,
					isFlippedY: true,
					duration: 12,
				});
			}
			break;
		
		case 2: // Slash.
			switch (action.frame % 8) {
			case 0:
				q.battleEngine.view.addEffect({
					target: action.target,
					spriteX: itemSpriteX,
					spriteY: 3,
					x: q.view.conf.tileWidth * -3 + 3,
					y: q.view.conf.tileHeight * -3 + 3,
					duration: 2,
				});
				
				q.battleEngine.view.addEffect({
					target: action.target,
					spriteX: itemSpriteX + 1,
					spriteY: 3,
					x: q.view.conf.tileWidth * -2 + 2,
					y: q.view.conf.tileHeight * -2 + 2,
					duration: 2,
				});
				break;
			
			case 1:
				q.battleEngine.view.addEffect({
					target: action.target,
					spriteX: itemSpriteX + 1,
					spriteY: 3,
					x: q.view.conf.tileWidth * -1 + 1,
					y: q.view.conf.tileHeight * -1 + 1,
					duration: 2,
				});
				
				q.battleEngine.view.addEffect({
					target: action.target,
					spriteX: itemSpriteX + 1,
					spriteY: 3,
					x: q.view.conf.tileWidth * 0 - 1,
					y: q.view.conf.tileHeight * 0 - 1,
					duration: 2,
				});
				break;
			
			case 2:
				q.battleEngine.view.addEffect({
					target: action.target,
					spriteX: itemSpriteX + 1,
					spriteY: 3,
					x: q.view.conf.tileWidth * 1 - 2,
					y: q.view.conf.tileHeight * 1 - 2,
					duration: 2,
				});
				
				q.battleEngine.view.addEffect({
					target: action.target,
					spriteX: itemSpriteX,
					spriteY: 3,
					x: q.view.conf.tileWidth * 2 - 3,
					y: q.view.conf.tileHeight * 2 - 2,
					isFlippedX: true,
					isFlippedY: true,
					duration: 2,
				});
				break;
			}
		}
	}
	
	++action.frame;
	
	if (action.frame % 8 === 0) {
		while (action.hitResults[action.frame >>> 3] < 1) {
			action.frame += 8;
		}
	}
};
