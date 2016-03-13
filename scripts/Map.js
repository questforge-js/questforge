"use strict";

QuestForge.prototype.Map = function (props) {
	var i, sprite;
	
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('tilePatterns') === false) {
		this.tilePatterns = [];
	}
	
	if (props.hasOwnProperty('sprites') === false) {
		this.sprites = [];
	}
	
	if (props.hasOwnProperty('tilesEncoded') === false) {
		this.tilesEncoded = [];
	}
	
	if (props.hasOwnProperty('defs') === true) {
		if (this.defs.tilePatterns !== undefined) {
			for (i = 0; i < this.defs.tilePatterns.length; ++i) {
				this.addPattern(this.defs.tilePatterns[i]);
			}
		}
		
		if (this.defs.sprites !== undefined) {
			for (i = 0; i < this.defs.sprites.length; ++i) {
				sprite = this.defs.sprites[i];
				
				if (sprite.template !== undefined && sprite.template !== null) {
					this['add'+sprite.template.type](sprite.template.props);
				}
				else {
					this.addSprite(sprite);
				}
			}
		}
		
		delete this.defs;
	}
};

QuestForge.prototype.Map.prototype = {
	id: null,
	
	width: null,
	height: null,
	tileset: null,
	
	defs: null,
	tilePatterns: null,
	sprites: null,
	tilesEncoded: null,
	
	domainWidth: 64,
	domainHeight: 64,
	music: null,
	battles: null,
	
	addPattern: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.MapPattern, this.tilePatterns, props, {
			map: this,
		});
	},
	
	addSprite: function (props) {
		return QuestForge.addIdentifiable(QuestForge.current.MapPattern, this.sprites, props, {
			map: this,
			isSprite: true,
		});
	},
	
	addWalkingNpc: function (props) {
		return this.addTemplatedSprite(props, {
			template: {
				type: 'WalkingNpc',
				props: props,
			},
			tileset: QuestForge.current.view.tilesets.mapChars,
			currentVehicle: QuestForge.current.game.vehicles[0],
			terrainLevel: 70,
			ontouch: QuestForge.current.MapPattern.npcTouchHandler,
			tick: QuestForge.current.MapPattern.npcTick,
			onaction: QuestForge.current.MapPattern.npcActionHandler,
		});
	},
	
	addTemplatedSprite: function (props, defaults) {
		var key, sprite;
		
		sprite = this.addSprite(props);
		
		for (key in defaults) {
			if (defaults.hasOwnProperty(key) === true && props.hasOwnProperty(key) === false) {
				sprite[key] = defaults[key];
			}
		}
		
		return sprite;
	},
};
