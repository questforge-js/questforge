"use strict";

QuestForge.prototype.MapEditorEngine = function (props) {
	var player, view;
	
	this.conf = {
		basePad: '\n\t\t',
		padChar: '\t'
	};
	
	QuestForge.applyProperties(props, this.conf);
	
	player = QuestForge.current.mapEngine.player;
	view = QuestForge.current.view;
	
	this.x = player.x;
	this.y = player.y;
	
	this.viewOffsetX = (view.conf.width >>> 1) - 2;
	this.viewOffsetY = (view.conf.height >>> 1);
};

QuestForge.registerEngine('MapEditorEngine', ['MapEngine', 'View']);

QuestForge.prototype.MapEditorEngine.prototype = {
	conf: null,
	
	cursorAnimation: 0,
	activePatternId: 0,
	x: 0,
	y: 0,
	viewOffsetX: null,
	viewOffsetY: null,
	
	dialogTick: function (dialogState, newHeight) {
		this.cursorAnimation = 1;
		this.drawCursor();
		
		QuestForge.current.mapEngine.dialogTick(dialogState, newHeight);
	},
	
	displayTileInfo: function (x, y) {
		var info, pattern,
		    dialogEngine;
		
		pattern = QuestForge.current.mapEngine.getTilePatternAt(x, y);
		
		info = '('+x+', '+y+') - Tile ID: '+pattern.id+'\n';
		
		if (pattern.editorInfo !== undefined && pattern.editorInfo.name !== undefined) {
			info += pattern.editorInfo.name+'\n';
		}
		
		this.drawCursorPattern();
		QuestForge.current.dialogEngine.dialogRaw(info);
		
		//QuestForge.current.dialogEngine.initBox(0, 4, 'patternInfo', "Tile ID: "+patternId, 2, 2, QuestForge.current.view.conf.width - 4, 13);
	},
	
	drawCursor: function () {
		var view;
		
		view = QuestForge.current.view;
		
		if ((this.cursorAnimation & 15) === 0 || this.cursorAnimation) {
			if ((this.cursorAnimation >>> 4) === 0) {
				this.drawCursorPattern();
			}
			else {
				QuestForge.current.mapEngine.repaint(this.viewOffsetX, this.viewOffsetY, 2, 2);
			}
		}
		
		view.drawSprite(view.tilesets.effects, 24 + (this.cursorAnimation >>> 4) * 2, 0, view.conf.tileWidth * 2, view.conf.tileHeight * 2, view.conf.tileWidth * this.viewOffsetX, view.conf.tileHeight * this.viewOffsetY, 8);
	},
	
	drawCursorPattern: function () {
		var map, view;
		
		map = QuestForge.current.mapEngine.map;
		view = QuestForge.current.view;
		
		view.drawTile(map.tileset, map.tilePatterns[this.activePatternId].tileX * 2, map.tilePatterns[this.activePatternId].tileY * 2, this.viewOffsetX, this.viewOffsetY);
		view.drawTile(map.tileset, map.tilePatterns[this.activePatternId].tileX * 2 + 1, map.tilePatterns[this.activePatternId].tileY * 2, this.viewOffsetX + 1, this.viewOffsetY);
		view.drawTile(map.tileset, map.tilePatterns[this.activePatternId].tileX * 2, map.tilePatterns[this.activePatternId].tileY * 2 + 1, this.viewOffsetX, this.viewOffsetY + 1);
		view.drawTile(map.tileset, map.tilePatterns[this.activePatternId].tileX * 2 + 1, map.tilePatterns[this.activePatternId].tileY * 2 + 1, this.viewOffsetX + 1, this.viewOffsetY + 1);
	},
	
	init: function (map, x, y) {
		var i, mapEngine;
		
		mapEngine = QuestForge.current.mapEngine;
		
		mapEngine.loadMap(map, x, y);
		this.x = x;
		this.y = y;
		
		// If there's a tile miscount, correct it.
		
		if (mapEngine.tiles.length !== map.width * map.height) {
			i = mapEngine.tiles.length;
			mapEngine.tiles.length = map.width * map.height;
			
			while (i < mapEngine.tiles.length) {
				mapEngine.tiles[i] = 0;
				++i;
			}
		}
		
		this.setActivePatternId(0);
		mapEngine.repaintAll();
		QuestForge.current.game.currentEngine = this;
	},
	
	setActivePatternId: function (patternId) {
		this.activePatternId = patternId;
		document.title = 'Map '+QuestForge.current.mapEngine.map.id+' - '+QuestForge.current.mapEngine.map.tilePatterns[patternId].editorInfo.name;
	},
	
	setNextActivePatternId: function () {
		if (this.activePatternId === null || this.activePatternId >= QuestForge.current.mapEngine.map.tilePatterns.length - 1) {
			this.setActivePatternId(0);
		}
		else {
			this.setActivePatternId(this.activePatternId + 1);
		}
	},
	
	setPreviousActivePatternId: function () {
		if (this.activePatternId === null || this.activePatternId <= 0) {
			this.setActivePatternId(QuestForge.current.mapEngine.map.tilePatterns.length - 1);
		}
		else {
			this.setActivePatternId(this.activePatternId - 1);
		}
	},
	
	shiftPatternIds: function (startIndex, amount, tilesOnly) {
		var i, mapEngine, pattern, patternId;
		
		if (startIndex === undefined) {
			startIndex = 0;
		}
		
		if (amount === undefined) {
			amount = 1;
		}
		
		if (tilesOnly === undefined) {
			tilesOnly = false;
		}
		
		mapEngine = QuestForge.current.mapEngine;
		
		if (tilesOnly === false) {
			if (amount < 0) {
				mapEngine.map.tilePatterns.splice(startIndex + amount, -amount);
			}
			else {
				mapEngine.map.tilePatterns = mapEngine.map.tilePatterns.slice(0, startIndex).concat(new Array(amount), mapEngine.map.tilePatterns.slice(startIndex));
			}
			
			for (i = startIndex + amount; i < mapEngine.map.tilePatterns.length; ++i) {
				pattern = mapEngine.map.tilePatterns[i];
				pattern.id += amount;
				
				if (pattern.lowerTilePatternId !== null && pattern.lowerTilePatternId >= startIndex) {
					pattern.lowerTilePatternId += amount;
				}
			}
			
			for (i = 0; i < amount; ++i) {
				mapEngine.map.tilePatterns[startIndex + i] = new QuestForge.current.MapPattern(mapEngine.map.tilePatterns[startIndex > 0 ? 0 : amount]);
			}
		}
		
		for (i = 0; i < mapEngine.tiles.length; ++i) {
			patternId = mapEngine.tiles[i];
			
			if (patternId >= startIndex) {
				mapEngine.tiles[i] += amount;
			}
			else if (patternId >= startIndex + amount) {
				mapEngine.tiles[i] = 0;
			}
		}
		
		mapEngine.repaintAll();
	},
	
	tick: function () {
		var i,
		    input, mapEngine;
		
		input = QuestForge.current.input;
		mapEngine = QuestForge.current.mapEngine;
		
		if (input.throttledCycleDown === true) {
			// Cycle to next pattern.
			
			this.setNextActivePatternId();
			this.cursorAnimation = 0;
		}
		
		if (input.throttledCycleUp === true) {
			// Cycle to previous pattern.
			
			this.setPreviousActivePatternId();
			this.cursorAnimation = 0;
		}
		
		if (input.grab === true) {
			// Grab the hovered pattern.
			
			this.setActivePatternId(mapEngine.getTilePatternIdAt(this.x, this.y));
			
			this.cursorAnimation = 40;
			this.drawCursorPattern();
		}
		
		if (input.plot === true && this.activePatternId !== null) {
			// Plot the pattern.
			
			mapEngine.setTilePatternIdAt(this.x, this.y, this.activePatternId);
			mapEngine.repaint(this.viewOffsetX, this.viewOffsetY, 2, 2);
			
			this.cursorAnimation = 56;
		}
		
		if (input.throttledPatternInfo === true) {
			// Display information about the hovered pattern.
			
			this.displayTileInfo(this.x, this.y);
		}
		
		if (input.throttledRight || (input.right === true && input.run === true)) {
			// Move right.
			
			for (i = 1; i > 0; --i) {
				if (this.x === mapEngine.map.width - 1) {
					this.x = 0;
				}
				else {
					++this.x;
				}
				
				QuestForge.current.mapEngine.repaint(this.viewOffsetX, this.viewOffsetY, 2, 2);
				mapEngine.scrollRight();
			}
			
			this.cursorAnimation = 0;
		}
		
		if (input.throttledLeft === true || (input.left === true && input.run === true)) {
			// Move left.
			
			for (i = (input.run === true ? 1 : 1); i > 0; --i) {
				if (this.x === 0) {
					this.x = mapEngine.map.width - 1;
				}
				else {
					--this.x;
				}
				
				QuestForge.current.mapEngine.repaint(this.viewOffsetX, this.viewOffsetY, 2, 2);
				mapEngine.scrollLeft();
			}
			
			this.cursorAnimation = 0;
		}
		
		if (input.throttledDown === true || (input.down === true && input.run === true)) {
			// Move down.
			
			for (i = (input.run === true ? 1 : 1); i > 0; --i) {
				if (this.y === mapEngine.map.height - 1) {
					this.y = 0;
				}
				else {
					++this.y;
				}
				
				QuestForge.current.mapEngine.repaint(this.viewOffsetX, this.viewOffsetY, 2, 2);
				mapEngine.scrollDown();
			}
			
			this.cursorAnimation = 0;
		}
		
		if (input.throttledUp === true || (input.up === true && input.run === true)) {
			// Move up.
			
			for (i = (input.run === true ? 1 : 1); i > 0; --i) {
				if (this.y === 0) {
					this.y = mapEngine.map.height - 1;
				}
				else {
					--this.y;
				}
				
				QuestForge.current.mapEngine.repaint(this.viewOffsetX, this.viewOffsetY, 2, 2);
				mapEngine.scrollUp();
			}
			
			this.cursorAnimation = 0;
		}
		
		if (input.throttledExport === true) {
			// Enter menu.
			
			this.saveMap();
		}
		
		this.drawCursor();
		
		if ((this.cursorAnimation & 15) === 15 && this.cursorAnimation > 15) {
			this.cursorAnimation = 0;
		}
		else {
			++this.cursorAnimation;
		}
		
		// Draw map sprites.
		
		mapEngine.drawSprites();
	},
	
	saveMap: function () {
		var code, outputWindow, range;
		
		QuestForge.current.mapEngine.map.tilesEncoded = this.getEncodedTiles();
		
		code = this.getMapCode().replace(/[<&]/g, function (match) {
			return (match[0] == '<' ? '&lt;' : '&amp;');
		});
		
		outputWindow = window.open('about:blank');
		outputWindow.document.write('<!DOCTYPE html><html lang="en"><head><title>Map data</title></head><body><pre>'+code+'</pre></body></html>');
		outputWindow.document.close();
		range = outputWindow.document.createRange();
		range.selectNode(outputWindow.document.getElementsByTagName('pre')[0]);
		outputWindow.getSelection().addRange(range);
	},
	
	getEncodedTiles: function () {
		var i, runLength, tile, tiles, tilesEncoded;
		
		tiles = QuestForge.current.mapEngine.tiles;
		tilesEncoded = [];
		
		for (i = 0; i < tiles.length;) {
			runLength = 1;
			tile = tiles[i];
			
			for (++i; i < tiles.length && tiles[i] === tile; ++i, ++runLength);
			
			tilesEncoded.push(runLength);
			tilesEncoded.push(tile);
		}
		
		return tilesEncoded;
	},
	
	getMapCode: function () {
		var battleSet, code, foundMatch, isFirst, match, pad,
		    pattern, regexp,
		    i, j, k, k2, n, t, game, mapEngine;
		
		n = this.conf.basePad;
		t = this.conf.padChar;
		game = QuestForge.current.game;
		mapEngine = QuestForge.current.mapEngine;
		
		code = n+'// Map '+mapEngine.map.id+' BEGIN';
		code += n+'QuestForge.current.game.addMap({';
		
		isFirst = true;
		
		for (k in mapEngine.map) {
			if (mapEngine.map.hasOwnProperty(k) === true) {
				switch (k) {
				case 'id':
				case 'sprites':
				case 'tilePatterns':
					break;
				
				default:
					if (isFirst === true) {
						isFirst = false;
					}
					else {
						code += ',';
					}
					
					code += n+t+this.stringify(k)+': ';
					
					switch (k) {
					case 'battles':
						code += '[';
						
						for (i = 0; i < mapEngine.map.battles.length; ++i) {
							if (i > 0) {
								code += ',';
								
								if (i % Math.ceil(mapEngine.map.width / mapEngine.map.domainWidth) === 0) {
									code += n+t+t;
								}
							}
							
							code += n+t+t+'{';
							
							isFirst = true;
							
							for (k2 in mapEngine.map.battles[i]) {
								if (mapEngine.map.battles[i].hasOwnProperty(k2) === true) {
									if (isFirst === true) {
										isFirst = false;
									}
									else {
										code += ', ';
									}
									
									code += this.stringify(k2)+': [';
									battleSet = mapEngine.map.battles[i][k2];
									
									for (j = 0; j < battleSet.length; ++j) {
										if (j > 0) {
											code += ', ';
										}
										
										if (QuestForge.current.custom.battles !== undefined) {
											match = game.findMatchingProperty(QuestForge.current.custom.battles, battleSet[j], 'id');
											
											if (match !== -1) {
												code += 'this.battles['+this.stringify(match)+'].id';
												continue;
											}
										}
										
										code += this.stringify(battleSet[j]);
									}
									
									code += ']';
								}
							}
							
							code += '}';
						}
						
						code += n+t+']';
						break;
					
					case 'tilesEncoded':
						code += this.stringify(mapEngine.map.tilesEncoded).replace(/.{120}.*?,/g, '$&\n');
						break;
					
					case 'tileset':
						match = game.findMatchingProperty(QuestForge.current.view.tilesets, mapEngine.map.tileset);
						
						if (match === -1) {
							code += this.stringify(mapEngine.map.tileset);
						}
						else {
							code += 'QuestForge.current.view.tilesets['+this.stringify(match)+']';
						}
						break;
					
					default:
						code += this.stringify(mapEngine.map[k]);
					}
					break;
				}
			}
		}
		
		if (isFirst === true) {
			isFirst = false;
		}
		else {
			code += ',';
		}
		
		code += n+t+'"defs": {';
		
		// Tile patterns.
		
		code += n+t+t+'"tilePatterns": [';
		
		for (i = 0; i < mapEngine.map.tilePatterns.length; ++i) {
			pattern = mapEngine.map.tilePatterns[i];
			
			if (i !== 0) {
				code += ', // '+(i - 1);
			}
			
			code += n+t+t+t+'{';
			code += this.getMapPatternCode(pattern, ' ');
			code += '}';
		}
		
		code += ' // '+(i - 1);
		code += n+t+t+']';
		
		// Sprites.
		
		code += ','+n+t+t+'"sprites": [';
		
		for (i = 0; i < mapEngine.map.sprites.length; ++i) {
			pattern = mapEngine.map.sprites[i];
			
			if (i !== 0) {
				code += ',';
			}
			
			code += n+t+t+t+'{ // '+i;
			pad = n+t+t+t+t;
			
			if (pattern.template !== null) {
				code += pad+'"template": {';
				code += pad+t+'"type": '+this.stringify(pattern.template.type)+',';
				code += pad+t+'"props": {';
				pattern = pattern.template.props;
				pad += t+t;
			}
			
			code += pad+this.getMapPatternCode(pattern, pad);
			
			if (mapEngine.map.sprites[i].template !== null) {
				code += n+t+t+t+t+t+'}';
				code += n+t+t+t+t+'}';
			}
			
			code += n+t+t+t+'}';
		}
		
		code += n+t+t+']';
		
		code += n+t+'}'+n+'});';
		code += n+'// Map '+mapEngine.map.id+' END\n';
		
		return code;
	},
	
	getMapPatternCode: function (pattern, pad) {
		var code, isFirst, k, match,
		    game;
		
		game = QuestForge.current.game;
		
		code = '';
		isFirst = true;
		
		for (k in pattern) {
			if (pattern.hasOwnProperty(k) === true) {
				switch (k) {
				case 'id':
				case 'map':
					break;
				
				default:
					if (isFirst === true) {
						isFirst = false;
					}
					else {
						code += ','+pad;
					}
					
					code += this.stringify(k)+': ';
					
					switch (k) {
					case 'currentVehicle':
						match = game.findMatchingProperty(QuestForge.current.game.vehicles, pattern.currentVehicle);
						
						if (match === -1) {
							code += pattern.currentVehicle.toSource();
						}
						else {
							code += 'QuestForge.current.game.vehicles['+this.stringify(match)+']';
						}
						break;
					
					case 'tileset':
						match = game.findMatchingProperty(QuestForge.current.view.tilesets, pattern.tileset);
						
						if (match === -1) {
							code += this.stringify(pattern.tileset);
						}
						else {
							code += 'QuestForge.current.view.tilesets['+this.stringify(match)+']';
						}
						break;
					
					case 'treasure':
						if (QuestForge.current.custom.items !== undefined) {
							match = game.findMatchingProperty(QuestForge.current.custom.items, pattern.treasure, 'id');
							
							if (match !== -1) {
								code += 'this.items['+this.stringify(match)+'].id';
								continue;
							}
						}
						
						code += this.stringify(pattern.treasure);
						break;
					
					default:
						if (typeof pattern[k] === 'function') {
							match = game.findMatchingProperty(QuestForge.current.MapPattern, pattern[k]);
							
							if (match === -1) {
								code += pattern[k].toSource();
							}
							else {
								code += 'QuestForge.current.MapPattern['+this.stringify(match)+']';
							}
						}
						else {
							code += this.stringify(pattern[k]);
						}
					}
				}
			}
		}
		
		return code;
	},
	
	// Serialize a value as JSON, and then replace any control
	// characters and non-ASCII characters with escape sequences.
	//
	// Preferably, the escape sequence replacement would happen
	// during JSON string serialization, before JSON delimiters are
	// added, but that can't be done without rolling a custom JSON
	// serializer.
	//
	// Note: if JSON.stringify were to format the output with added
	// line breaks and/or tab indentation, this function would yield
	// incorrect results! The correctness of this function depends
	// on all of the added JSON syntax being in the 32-126 character
	// code range, excluding the string contents themselves.
	
	stringify: function (input) {
		return this.encodeChars(JSON.stringify(input));
	},
	
	// Replace control characters and non-ASCII characters with
	// JavaScript escape sequences.
	
	encodeChars: function (input) {
		var charCode, game, i, output;
		
		game = QuestForge.current.game;
		
		output = '';
		
		for (i = 0; i < input.length; ++i) {
			charCode = input.charCodeAt(i);
			
			if (charCode >= 32 && charCode <= 126) {
				output += input[i];
			}
			else {
				output += '\\u'+game.padLeft(charCode.toString(16), 4, '0');
			}
		}
		
		return output;
	},
};
