"use strict";

QuestForge.prototype.Battle = function (props) {
	QuestForge.applyProperties(props, this);
	
	if (props.hasOwnProperty('enemyPacks') === null) {
		this.enemyPacks = [];
	}
};

QuestForge.prototype.Battle.prototype = {
	id: null,
	enemyPacks: null,
	fromBehind: false,
	
	init: function (props) {
		if (QuestForge.current.battleEngine.conf.enableFromBehind === true && Math.random() < .1) {
			this.fromBehind = true;
		}
		else {
			this.fromBehind = false;
		}
	},
	
	getPlayerLineup: function () {
		var i, lineup, lineupSlot, sourceLineup,
		    battleEngineConf;
		
		battleEngineConf = QuestForge.current.battleEngine.conf;
		
		lineup = [];
		sourceLineup = QuestForge.current.game.currentParty.lineup;
		
		for (i = 0; i < sourceLineup.length; ++i) {
			lineupSlot = new QuestForge.current.LineupSlot(sourceLineup[i]);
			lineupSlot.lineup = lineup;
			lineupSlot.side = 0;
			lineupSlot.arenaBaseX = QuestForge.current.view.conf.width - 4 - battleEngineConf.avatarWidth;
			lineupSlot.arenaBaseY = battleEngineConf.avatarHeight * i + battleEngineConf.arenaY;
			
			if (this.fromBehind === true) {
				lineupSlot.row = 1 - lineupSlot.row;
			}
			
			lineup.push(lineupSlot);
		}
		
		return lineup;
	},
	
	getEnemyLineup: function () {
		var character, enemyPack, i, lineup, lineupSlot,
		    colWidth, initY, x, y,
		    battleEngineConf;
		
		battleEngineConf = QuestForge.current.battleEngine.conf;
		
		initY = battleEngineConf.arenaY;
		x = 4;
		y = initY;
		colWidth = 0;
		lineup = [];
		enemyPack = this.enemyPacks[Math.floor(Math.random() * this.enemyPacks.length)];
		
		for (i = 0; i < enemyPack.length; ++i) {
			character = enemyPack[i];
			
			if (character !== null) {
				character = new QuestForge.current.Character(character);
			}
			
			lineupSlot = new QuestForge.current.LineupSlot({
				lineup: lineup,
				character: character,
				position: lineup.length,
				
				side: 1,
				isPortrait: true
			});
			
			if (character !== null) {
				if (y + ((lineupSlot.isPortrait === true) ? character.portraitHeight : battleEngineConf.avatarHeight) > battleEngineConf.arenaHeight + initY) {
					y = initY;
					x += colWidth;
					colWidth = ((lineupSlot.isPortrait === true) ? character.portraitWidth : battleEngineConf.avatarWidth + 6);
				}
				else if (((lineupSlot.isPortrait === true) ? character.portraitWidth : battleEngineConf.avatarWidth + 6) > colWidth) {
					colWidth = (lineupSlot.isPortrait === true ? character.portraitWidth : battleEngineConf.avatarWidth + 6);
				}
			}
			
			lineupSlot.arenaBaseX = x;
			lineupSlot.arenaBaseY = y;
			
			lineup.push(lineupSlot);
			
			if (lineupSlot.isPortrait === true) {
				if (character === null) {
					++y;
				}
				else {
					y += character.portraitHeight;
				}
			}
			else {
				y += this.conf.avatarHeight;
			}
		}
		
		return lineup;
	},
};
