"use strict";

QuestForge.prototype.DialogEngine = function (props) {
	this.conf = {
		defaultX: 4,
		defaultY: 4,
		defaultWidth: null,
		defaultHeight: 8,
		defaultDoubleSpace: true,
	};
	
	QuestForge.applyProperties(props, this.conf);
	
	if (this.conf.defaultWidth === null) {
		this.conf.defaultWidth = QuestForge.current.view.conf.width - this.conf.defaultX * 2;
	}
	
	this.x = this.conf.defaultX;
	this.y = this.conf.defaultY;
	this.width = this.conf.defaultWidth;
	this.height = this.conf.defaultHeight;
	
	this.wordWrapRegExp = new RegExp('(.{1,'+(this.conf.defaultWidth - 2)+'})( +|$\n?)|(.{'+(this.conf.defaultWidth - 2)+'})', 'gm');
	
	this.buffers = {};
	this.queue = [];
};

QuestForge.registerEngine('DialogEngine', ['View']);

QuestForge.prototype.DialogEngine.prototype = {
	conf: null,
	
	currentHeight: 0,
	state: 0,
	message: '',
	messagePos: 0,
	scrollPos: 0,
	endState: 4,
	eventHandler: null,
	
	x: null,
	y: null,
	width: null,
	height: null,
	doubleSpace: null,
	
	bufferName: 'default',
	
	buffers: null,
	queue: null,
	
	prepareTextRegExp: new RegExp('\\{(?:([\\d]+)\\:|)([a-zA-Z0-9.]+)(?:\\:([\\d]+)|)\\}', 'g'),
	wordWrapRegExp: null,
	escapeTextRegExp: new RegExp('\\{', 'g'),
	
	//== Tick function ==//
	
	tick: function () {
		var i, tileset, tileInfo, x, chr, y,
		    view;
		
		view = QuestForge.current.view;
		
		if (this.eventHandler.dialogTick !== undefined) {
			switch (this.state) {
			case 0:
				this.eventHandler.dialogTick(this.state, this.currentHeight + 2);
				break;
			
			case 1:
			case 2:
				this.eventHandler.dialogTick(this.state, this.currentHeight);
				break;
			
			case 3:
				this.eventHandler.dialogTick(this.state, this.currentHeight - 2);
				break;
			}
		}
		
		tileset = view.tilesets.dialog;
		
		switch (this.state) {
		case 0: // Opening the dialog box.
			
			if (this.currentHeight === 0) {
				// Save a buffer.
				
				this.saveBuffer(this.bufferName, this.x, this.y, this.width, this.height);
				
				// Draw the top of the dialog box.
				
				view.drawTile(tileset, 0, 9, this.x, this.y);
				view.drawTile(tileset, 2, 9, this.x + this.width - 1, this.y);
				
				for (x = this.x + 1; x < this.x + this.width - 1; ++x) {
					view.drawTile(tileset, 1, 9, x, this.y);
				}
				
				this.messagePos = 0;
				++this.currentHeight;
			}
			else {
				--this.currentHeight;
				
				for (i = this.currentHeight < this.height - 2 ? 1 : 0; i >= 0; --i) {
					if (this.isDoubleSpace() && (this.currentHeight & 1) === 0) {
						// Blank row.
						
						view.drawTile(tileset, 3, 9, this.x, this.y + this.currentHeight);
						view.drawTile(tileset, 4, 9, this.x + this.width - 1, this.y + this.currentHeight);
						
						for (x = this.x + 1; x < this.x + this.width - 1; ++x) {
							view.drawTile(tileset, 0, 2, x, this.y + this.currentHeight);
						}
					}
					else {
						// New message row.
						
						view.drawTile(tileset, 3, 9, this.x, this.y + this.currentHeight);
						view.drawTile(tileset, 4, 9, this.x + this.width - 1, this.y + this.currentHeight);
						
						for (x = this.x + 1; x < this.x + this.width - 1; ++x) {
							if (this.messagePos >= this.message.length || this.message.charAt(this.messagePos) === '\n') {
								view.drawTile(tileset, 0, 2, x, this.y + this.currentHeight);
							}
							else {
								chr = this.message.charCodeAt(this.messagePos);
								
								view.drawTile(tileset, (chr & 15) + ((chr >>> 4) & ~15), (chr >>> 4) & 15, x, this.y + this.currentHeight);
								
								++this.messagePos;
							}
						}
						
						if (this.message.charAt(this.messagePos) === '\n') {
							++this.messagePos;
						}
					}
					
					++this.currentHeight;
				}
				
				/*
				if (this.currentHeight < this.height - 1) {
					// Following blank row.
					
					view.drawTile(tileset, 3, 9, this.x, this.y + this.currentHeight);
					view.drawTile(tileset, 4, 9, this.x + this.width - 1, this.y + this.currentHeight);
					
					for (x = this.x + 1; x < this.x + this.width - 1; ++x) {
						view.drawTile(tileset, 0, 2, x, this.y + this.currentHeight);
					}
					
					++this.currentHeight;
				}
				*/
			}
			
			// Bottom border.
			
			view.drawTile(tileset, 5, 9, this.x, this.y + this.currentHeight);
			view.drawTile(tileset, 7, 9, this.x + this.width - 1, this.y + this.currentHeight);
			
			for (x = this.x + 1; x < this.x + this.width - 1; ++x) {
				view.drawTile(tileset, 6, 9, x, this.y + this.currentHeight);
			}
			
			++this.currentHeight;
			
			if (this.currentHeight >= this.height) {
				this.state = 1;
			}
			break;
		
		case 1: // In the dialog.
			if (QuestForge.current.input.throttledAction) {
				if (this.messagePos >= this.message.length) {
					this.state = 3;
				}
				else {
					this.scrollPos = this.currentHeight - 2;
					this.state = 2;
				}
			}
			break;
		
		case 2: // Scroll more.
			for (y = 1; y < this.currentHeight - 2; ++y) {
				for (x = this.x + 1; x < this.x + this.width - 1; ++x) {
					tileInfo = view.getTileInfo(x, this.y + y + 1);
					
					view.drawTileUnadjusted(tileInfo[0], tileInfo[1], tileInfo[2], x, this.y + y);
				}
			}
			
			for (x = this.x + 1; x < this.x + this.width - 1; ++x) {
				
				if ((this.isDoubleSpace() === true && (this.scrollPos & 1) === 1) || this.messagePos >= this.message.length || this.message.charAt(this.messagePos) === '\n') {
					view.drawTile(tileset, 0, 2, x, this.y + y);
				}
				else {
					chr = this.message.charCodeAt(this.messagePos);
					
					view.drawTile(tileset, (chr & 15) + ((chr >>> 4) & ~15), (chr >>> 4) & 15, x, this.y + this.currentHeight - 2);
					
					++this.messagePos;
				}
			}
			
			if ((this.isDoubleSpace() === false || (this.scrollPos & 1) === 0) && this.message.charAt(this.messagePos) === '\n') {
				++this.messagePos;
			}
			
			--this.scrollPos;
			
			if (this.scrollPos <= 0) {
				this.state = 1;
			}
			break;
		
		case 3: // Closing the dialog box.
			
			if (this.currentHeight > 2) {
				// If this has an odd-numbered height,
				// we'll first want to shrink it by 1 to
				// make it even-numbered. It'll then
				// proceed as normal.
				
				y = 2 - (this.currentHeight & 1);
				this.currentHeight -= y;
				this.restoreBuffer(this.bufferName, this.x, this.y + this.currentHeight, this.width, y);
				
				// Draw the new bottom border.
				
				view.drawTile(tileset, 5, 9, this.x, this.y + this.currentHeight - 1);
				view.drawTile(tileset, 7, 9, this.x + this.width - 1, this.y + this.currentHeight - 1);
				
				for (x = this.x + 1; x < this.x + this.width - 1; ++x) {
					view.drawTile(tileset, 6, 9, x, this.y + this.currentHeight - 1);
				}
			}
			else {
				this.restoreBuffer(this.bufferName, this.x, this.y, this.width, this.height);
				this.state = 4;
			}
			break;
		}
		
		if (this.state === this.endState) {
			this.currentHeight = 0;
			this.state = 0;
			this.endState = 4;
			
			QuestForge.current.input.action = false;
			
			this.queue.shift();
			
			if (this.queue.length > 0) {
				this.prepareFromQueue();
			}
			else {
				QuestForge.current.game.currentEngine = this.eventHandler;
			}
		}
	},
	
	isDoubleSpace: function () {
		return (this.doubleSpace === true || (this.doubleSpace === null && this.conf.defaultDoubleSpace === true));
	},
	
	//== Basic drawing ==//
	
	drawBox: function (x, y, width, height, isFilled, isInverted) {
		var tileset, tileX1, tileX2, tileYFill, xi, yi,
		    view;
		
		view = QuestForge.current.view;
		tileset = view.tilesets.dialog;
		
		// Reuse the dimension variables as the end coordinates.
		
		width += x - 1;
		height += y - 1;
		
		// Draw the corners.
		
		view.drawTile(tileset, isInverted === true ? 8 : 0, 9, x, y);
		view.drawTile(tileset, isInverted === true ? 9 : 2, 9, width, y);
		view.drawTile(tileset, isInverted === true ? 10 : 5, 9, x, height);
		view.drawTile(tileset, isInverted === true ? 11 : 7, 9, width, height);
		
		// Draw top and bottom edges.
		
		tileX1 = (isInverted === true ? 6 : 1);
		tileX2 = (isInverted === true ? 1 : 6);
		
		for (xi = x + 1; xi < width; ++xi) {
			view.drawTile(tileset, tileX1, 9, xi, y);
			view.drawTile(tileset, tileX2, 9, xi, height);
		}
		
		// Draw left and right edges and fill the center.
		
		tileX1 = (isInverted === true ? 4 : 3);
		tileX2 = (isInverted === true ? 3 : 4);
		tileYFill = (isInverted === true ? 0 : 2);
		
		for (yi = y + 1; yi < height; ++yi) {
			view.drawTile(tileset, tileX1, 9, x, yi);
			view.drawTile(tileset, tileX2, 9, width, yi);
			
			if (isFilled === true) {
				for (xi = x + 1; xi < width; ++xi) {
					view.drawTile(tileset, 0, tileYFill, xi, yi);
				}
			}
		}
	},
	
	drawBoxInverted: function (x, y, width, height, isFilled) {
		var tileset, xi, yi,
		    view;
		
		view = QuestForge.current.view;
		tileset = view.tilesets.dialog;
		
		// Reuse the dimension variables as the end coordinates.
		
		width += x - 1;
		height += y - 1;
		
		// Draw the corners.
		
		view.drawTile(tileset, 0, 9, x, y);
		view.drawTile(tileset, 2, 9, width, y);
		view.drawTile(tileset, 5, 9, x, height);
		view.drawTile(tileset, 7, 9, width, height);
		
		// Draw top and bottom edges.
		
		for (xi = x + 1; xi < width; ++xi) {
			view.drawTile(tileset, 1, 9, xi, y);
			view.drawTile(tileset, 6, 9, xi, height);
		}
		
		// Draw left and right edges and fill the center.
		
		for (yi = y + 1; yi < height; ++yi) {
			view.drawTile(tileset, 3, 9, x, yi);
			view.drawTile(tileset, 4, 9, width, yi);
			
			if (isFilled === true) {
				for (xi = x + 1; xi < width; ++xi) {
					view.drawTile(tileset, 0, 2, xi, yi);
				}
			}
		}
	},
	
	drawText: function (x, y, str, lineSpacing) {
		var chr, i, tileset, xi,
		    view;
		
		view = QuestForge.current.view;
		tileset = view.tilesets.dialog;
		xi = x;
		
		for (i = 0; i < str.length; ++i) {
			chr = str.charCodeAt(i);
			
			if (chr === 10) {
				xi = x;
				y += (lineSpacing !== undefined ? lineSpacing : 2);
			}
			else {
				view.drawTile(tileset, (chr & 15) + ((chr >>> 4) & ~15), (chr >>> 4) & 15, xi, y);
				++xi;
			}
		}
	},
	
	//== Static box ==//
	
	staticBox: function (message, x, y, width, height) {
		this.drawBox(x, y, width, height, true);
		this.drawText(x + 1, y + 1, this.prepareText(message));
	},
	
	//== Expanding box ==//
	
	initBox: function (initState, endState, props) {
		var queueProps;
		
		queueProps = {};
		
		QuestForge.applyProperties(props, queueProps);
		
		queueProps.state = initState;
		queueProps.endState = endState;
		
		if (queueProps.eventHandler === undefined) {
			queueProps.eventHandler = this.queue[0] !== undefined ? this.queue[0].eventHandler : QuestForge.current.game.currentEngine;
		}
		
		if (queueProps.doubleSpace === undefined) {
			queueProps.doubleSpace = null;
		}
		
		this.queue.push(queueProps);
		
		if (this.queue.length === 1) {
			this.prepareFromQueue();
			
			QuestForge.current.game.currentEngine = this;
		}
	},
	
	expandBox: function (props) {
		this.initBox(0, 1, props);
	},
	
	contractBox: function (props) {
		this.initBox(3, 4, props);
	},
	
	customDialog: function (props) {
		this.initBox(0, 4, props);
	},
	
	/*
	initBox: function (initState, endState, bufferName, str, x, y, width, height) {
		this.queue.push([initState, endState, bufferName, str, x, y, width, height]);
		
		if (this.queue.length === 1) {
			this.prepareFromQueue();
			
			this.eventHandler = QuestForge.current.game.currentEngine;
			
			QuestForge.current.game.currentEngine = this;
		}
	},
	
	expandBox: function (bufferName, str, x, y, width, height) {
		this.initBox(0, 1, bufferName, this.prepareText(str), x, y, width, height);
	},
	
	contractBox: function (bufferName, x, y, width, height) {
		this.initBox(3, 4, bufferName, '', x, y, width, height);
	},
	*/
	
	//== Dialog shorthands ==//
	
	dialog: function (str) {
		this.dialogRaw(this.prepareText(str));
	},
	
	dialogRaw: function (str) {
		this.initBox(0, 4, {
			bufferName: 'dialog',
			message: str,
			x: this.conf.defaultX,
			y: this.conf.defaultY,
			width: this.conf.defaultWidth,
			height: this.conf.defaultHeight,
		});
	},
	
	/*
	dialogRaw: function (str) {
		this.initBox(0, 4, 'dialog', str, this.conf.defaultX, this.conf.defaultY, this.conf.defaultWidth, this.conf.defaultHeight);
	},
	*/
	
	//== Text construction ==//
	
	escapeText: function (str) {
		return str.replace(this.escapeTextRegExp, '{7B}');
	},
	
	getDisabledText: function (str) {
		var i, newStr;
		
		str = str.toString();
		newStr = '';
		
		for (i = 0; i < str.length; ++i) {
			newStr += String.fromCharCode(str.charCodeAt(i) + 256);
		}
		
		return newStr;
	},
	
	getXDisabledText: function (str) {
		return this.overlayString(str, '\u009f');
	},
	
	overlayString: function (str, overlay) {
		return overlay+str.substr(overlay.length);
	},
	
	prepareText: function (str) {
		// Replace references.
		
		str = str.replace(this.prepareTextRegExp, this.prepareTextHelper);
		
		// Wrap output.
		
		str = this.wordWrap(str);
		
		return str;
	},
	
	prepareTextHelper: function (str, padLeftSize, reference, padRightSize) {
		var currentReference, i, lineupSlot, padding, replacement;
		
		if (reference.match(/^[0-9a-fA-F]+$/)) {
			// Hexadecimal value.
			
			replacement = 0;
			
			for (i = 0; i < reference.length; ++i) {
				replacement <<= 4;
				replacement += parseInt(reference.charAt(i), 16);
			}
			
			replacement = String.fromCharCode(replacement);
		}
		else {
			// Object reference.
			
			reference = reference.split('.');
			currentReference = QuestForge.current;
			
			for (i = 0; i < reference.length; ++i) {
				currentReference = currentReference[reference[i]];
				
				if (currentReference === undefined) {
					replacement = '';
					break;
				}
			}
			
			if (currentReference !== undefined) {
				replacement = currentReference+'';
			}
		}
		
		padding = '';
		
		if (padLeftSize !== undefined && padLeftSize !== '') {
			replacement = QuestForge.current.game.padLeft(replacement, +padLeftSize);
		}
		else if (padRightSize !== '') {
			replacement = QuestForge.current.game.padRight(replacement, +padRightSize);
		}
		
		return replacement;
	},
	
	wordWrap: function (str) {
		return str.replace(this.wordWrapRegExp, "$1$3\n");
	},
	
	//== Buffers ==//
	
	restoreBuffer: function (id, x, y, width, height) {
		var buffer, tileInfo, xi, yi,
		    view;
		
		view = QuestForge.current.view;
		
		buffer = this.buffers[id];
		width += x;
		height += y;
		
		for (yi = y; yi < height; ++yi) {
			for (xi = x; xi < width; ++xi) {
				tileInfo = buffer[yi][xi];
				
				view.drawTileUnadjusted(tileInfo[0], tileInfo[1], tileInfo[2], xi, yi);
			}
		}
	},
	
	saveBuffer: function (id, x, y, width, height) {
		var buffer, xi, yi,
		    view;
		
		view = QuestForge.current.view;
		
		buffer = {};
		
		width += x;
		height += y;
		
		for (yi = y; yi < height; ++yi) {
			buffer[yi] = {};
			
			for (xi = x; xi < width; ++xi) {
				buffer[yi][xi] = view.getTileInfo(xi, yi);
			}
		}
		
		this.buffers[id] = buffer;
	},
	
	//== Queue ==//
	
	prepareFromQueue: function () {
		var props;
		
		QuestForge.applyProperties(this.queue[0], this);
		this.currentHeight = (this.state === 0 ? 0 : this.height);
	},
};
