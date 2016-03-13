"use strict";

QuestForge.prototype.View = function (props) {
	var tilesets, i, tileset, id, rows, y, cols, x, sprites;
	
	this.conf = {
		autoview: false,
		showScanlines: false,
		enableBlur: false,
		
		centerViewport: false,
		
		maxSprites: 256,
		
		tileWidth: 8,
		tileHeight: 8,
		
		scaleX: 1,
		scaleY: 1,
		
		// The width and height include a hidden 2-tile buffer on all sides.
		width: 36,
		height: 32,
	};
	
	QuestForge.applyProperties(props, this.conf);
	
	this.tiles = [];
	this.tileInfo = [];
	this.sprites = [];
	this.spriteInfo = [];
	
	this.tilesets = {};
	this.tilesetList = [];
	this.tilesetUrls = [];
	
	if (this.conf.autoview === true) {
		this.conf.scaleX = Math.floor(QuestForge.current.baseElement.clientWidth / ((this.conf.width - 4) * this.conf.tileWidth));
		this.conf.scaleY = Math.floor(QuestForge.current.baseElement.clientHeight / ((this.conf.height - 4) * this.conf.tileHeight));
		
		if (this.conf.scaleY > this.conf.scaleX) {
			this.conf.scaleY = this.conf.scaleX;
		}
		else {
			this.conf.scaleX = this.conf.scaleY;
		}
		
		if (this.conf.scaleX < 1) {
			this.conf.scaleX = 1;
			this.conf.scaleY = 1;
		}
		
		if (props.hasOwnProperty('centerViewport') === false) {
			this.conf.centerViewport = true;
		}
		
		if (props.hasOwnProperty('showScanlines') === false) {
			this.conf.showScanlines = (this.conf.scaleY > 1);
		}
	}
};

QuestForge.registerEngine('View', []);

QuestForge.prototype.View.prototype = {
	conf: null,
	
	viewport: null,
	tiles: null,
	tileInfo: null,
	sprites: null,
	spriteContainer: null,
	spriteInfo: null,
	numSpritesDrawn: 0,
	previousNumSpritesDrawn: 0,
	
	offsetX: 0,
	offsetY: 0,
	offsetDOM: null,
	
	tilesets: null,
	tilesetList: null,
	numTilesetsLoaded: 0,
	tilesetsDiv: null,
	
	//== Functions ==//
	
	addTileset: function (props) {
		var tileset, urlId;
		
		tileset = QuestForge.addIdentifiable(QuestForge.current.Tileset, this.tilesetList, props);
		this.tilesets[tileset.name] = tileset;
		urlId = QuestForge.arrayIndexOf(this.tilesetUrls, tileset.url);
		
		if (urlId !== -1) {
			tileset.urlId = urlId;
		}
		else {
			tileset.urlId = this.tilesetUrls.length;
			this.tilesetUrls.push(tileset.url);
		}
		
		return tileset;
	},
	
	// Fill a region of the viewport with a single repeating tile.
	
	draw: function (tileset, tileX, tileY, x, y, destWidth, destHeight) {
		var i, j;
		
		for (i = destHeight - 1; i >= 0; --i) {
			for (j = destWidth - 1; j >= 0; --j) {
				this.drawTile(tileset, tileX, tileY, x + j, y + i);
			}
		}
	},
	
	// Draw a region of tiles onto the viewport.
	
	drawRegion: function (tileset, tileX, tileY, width, height, x, y) {
		var i, j;
		
		for (i = height - 1; i >= 0; --i) {
			for (j = width - 1; j >= 0; --j) {
				this.drawTile(tileset, tileX + j, tileY + i, x + j, y + i);
			}
		}
	},
	
	drawSprite: function (tileset, tileX, tileY, width, height, x, y, z, isFlippedH, isFlippedV) {
		var positionLiteral, sprite, spriteInfo, style, transformValue;
		
		/*
		if (x + width < 0 || x >= this.conf.tileWidth * this.conf.width || y + height < 0 || y >= this.conf.tileHeight * this.conf.height) {
			// Outside the viewport.
			
			return;
		}
		*/
		
		if (this.numSpritesDrawn === this.sprites.length) {
			if (this.sprites.length >= this.conf.maxSprites) {
				// Maximum number of sprites reached.
				
				return;
			}
			
			// Dynamically add an available sprite.
			
			sprite = document.createElement('span');
			
			style = sprite.style;
			
			style.backgroundRepeat = 'no-repeat';
			style.display = 'block';
			style.position = 'absolute';
			
			this.sprites.push(this.spriteContainer.appendChild(sprite));
			spriteInfo = this.spriteInfo.push([true, null, null, null, null, null, null, null, null, null, null]);
		}
		else {
			style = this.sprites[this.numSpritesDrawn].style;
			spriteInfo = this.spriteInfo[this.numSpritesDrawn];
		}
		
		tileX += tileset.offsetX;
		tileY += tileset.offsetY;
		
		if (spriteInfo[1] !== tileset.urlId) {
			spriteInfo[0] = true;
			spriteInfo[1] = tileset.urlId;
			spriteInfo[2] = tileX;
			spriteInfo[3] = tileY;
			
			style.backgroundImage = 'url('+tileset.url+')';
			style.backgroundPosition = this.getPositionLiteral(tileX, tileY);
		}
		else if (spriteInfo[0] === false || spriteInfo[2] !== tileX || spriteInfo[3] !== tileY) {
			spriteInfo[0] = true;
			spriteInfo[2] = tileX;
			spriteInfo[3] = tileY;
			
			style.backgroundPosition = this.getPositionLiteral(tileX, tileY);
		}
		
		if (spriteInfo[4] !== width) {
			style.width = (width * this.conf.scaleX)+'px';
			spriteInfo[4] = width;
		}
		
		if (spriteInfo[5] !== height) {
			style.height = (height * this.conf.scaleY)+'px';
			spriteInfo[5] = height;
		}
		
		if (spriteInfo[6] !== x || spriteInfo[7] !== y) {
			if (spriteInfo[6] !== x) {
				style.left = (x * this.conf.scaleX)+'px';
				spriteInfo[6] = x;
			}
			
			if (spriteInfo[7] !== y) {
				style.top = (y * this.conf.scaleY)+'px';
				spriteInfo[7] = y;
			}
		}
		
		if (spriteInfo[8] !== z) {
			style.zIndex = (z + 1) * this.conf.maxSprites - 1 - this.numSpritesDrawn;
			spriteInfo[8] = z;
		}
		
		isFlippedH = (isFlippedH === true);
		isFlippedV = (isFlippedV === true);
		
		if (spriteInfo[9] !== isFlippedH || spriteInfo[10] !== isFlippedV) {
			transformValue = (isFlippedH === true ? 'scaleX(-1) ' : '')+(isFlippedV === true ? 'scaleY(-1)' : '');
			
			style.WebkitTransform = transformValue;
			style.MsTransform = transformValue;
			style.transform = transformValue;
			
			spriteInfo[9] = isFlippedH;
			spriteInfo[10] = isFlippedV;
		}
		
		/*
		if (spriteInfo[0] === false) {
			style.visibility = 'visible';
			spriteInfo[0] = true;
		}
		*/
		
		++this.numSpritesDrawn;
	},
	
	drawTile: function (tileset, tileX, tileY, x, y) {
		this.drawTileUnadjusted(tileset.urlId, tileX + tileset.offsetX, tileY + tileset.offsetY, x, y);
	},
	
	drawTileUnadjusted: function (tilesetUrlId, tileX, tileY, x, y) {
		var style, tileInfo;
		
		tileInfo = this.tileInfo[y][x];
		
		if (tileInfo[0] !== tilesetUrlId) {
			tileInfo[0] = tilesetUrlId;
			tileInfo[1] = tileX;
			tileInfo[2] = tileY;
			
			style = this.tiles[y][x].style;
			
			style.backgroundImage = 'url('+this.tilesetUrls[tilesetUrlId]+')';
			style.backgroundPosition = this.getPositionLiteral(tileX, tileY);
		}
		else if (tileInfo[1] !== tileX || tileInfo[2] !== tileY) {
			tileInfo[1] = tileX;
			tileInfo[2] = tileY;
			
			this.tiles[y][x].style.backgroundPosition = this.getPositionLiteral(tileX, tileY);
		}
	},
	
	getPositionLiteral: function (tileX, tileY) {
		return (-1 * this.conf.scaleX * this.conf.tileWidth * tileX)+'px '+(-1 * this.conf.scaleY * this.conf.tileHeight * tileY)+'px';
	},
	
	getTileInfo: function (x, y) {
		var tileInfo;
		
		tileInfo = this.tileInfo[y][x];
		
		return [tileInfo[0], tileInfo[1], tileInfo[2]];
	},
	
	// Set up the HTML DOM.
	
	init: function () {
		var i, j, m, height, width,
		    outerDiv, innerDiv, overlayDiv, paintDiv, spritesDiv,
		    tilesetsDiv, tilesetImg,
		    viewportTable, viewportTbody, viewportTr;
		
		//== Set up viewport. ==//
		
		width = this.conf.width * this.conf.tileWidth * this.conf.scaleX;
		height = this.conf.height * this.conf.tileHeight * this.conf.scaleY;
		
		// Outer div.
		
		outerDiv = document.createElement('div');
		
		if (this.conf.centerViewport === true) {
			outerDiv.style.left = '50%';
			outerDiv.style.position = 'absolute';
			outerDiv.style.top = '50%';
		}
		else {
			outerDiv.style.height = height+'px';
			outerDiv.style.width = width+'px';
		}
		
		// Inner div.
		
		innerDiv = document.createElement('div');
		
		innerDiv.style.background = '#000';
		innerDiv.style.clip = 'rect('+(2 * this.conf.tileHeight * this.conf.scaleY)+'px, '+((this.conf.width - 2) * this.conf.tileWidth * this.conf.scaleX)+'px, '+((this.conf.height - 2) * this.conf.tileHeight * this.conf.scaleY)+'px, '+(2 * this.conf.tileWidth * this.conf.scaleX)+'px)';
		innerDiv.style.height = height+'px';
		innerDiv.style.overflow = 'hidden';
		innerDiv.style.position = 'absolute';
		innerDiv.style.width = width+'px';
		innerDiv.style.zIndex = '0';
		
		if (this.conf.centerViewport === true) {
			innerDiv.style.left = (width / -2)+'px';
			innerDiv.style.top = (height / -2)+'px';
		}
		
		// Overlay.
		
		overlayDiv = document.createElement('div');
		
		if (this.conf.showScanlines === true) {
			overlayDiv.style.background = 'linear-gradient(rgba(0, 0, 0, .5) 0%, rgba(0, 0, 0, 0) 33.33%, rgba(0, 0, 0, .5) 100%)';
			overlayDiv.style.backgroundSize = '100% '+this.conf.scaleY+'px';
		}
		
		overlayDiv.style.backgroundPosition = 'top left';
		overlayDiv.style.bottom = '0';
		overlayDiv.style.left = '0';
		overlayDiv.style.position = 'absolute';
		overlayDiv.style.right = '0';
		overlayDiv.style.top = '0';
		overlayDiv.style.zIndex = '1';
		
		innerDiv.appendChild(overlayDiv);
		
		paintDiv = document.createElement('div');
		paintDiv.style.background = '#000';
		paintDiv.style.bottom = '0';
		paintDiv.style.left = '0';
		paintDiv.style.position = 'absolute';
		paintDiv.style.right = '0';
		paintDiv.style.top = '0';
		paintDiv.style.zIndex = '0';
		
		if (this.conf.enableBlur === true && this.conf.scaleY > 1) {
			// Apply blur filter. Currently, Webkit doesn't support
			// fractions of a pixel, and a whole pixel is too much
			// blur, so we'll err on the side of no blur.
			
			paintDiv.style.WebkitFilter = 'blur('+(this.conf.scaleY / 12)+'px)';
			paintDiv.style.filter = 'blur('+(this.conf.scaleY / 12)+'px)';
		}
		
		// Sprites.
		
		spritesDiv = document.createElement('div');
		this.spriteContainer = spritesDiv;
		
		for (i = 0; i < 64; ++i) {
			// Sprite.
			
			m = document.createElement('span');
			
			m.style.backgroundRepeat = 'no-repeat';
			m.style.backgroundSize = ((this.conf.width - 4) * this.conf.tileWidth * this.conf.scaleX)+'px auto';
			m.style.MsInterpolationMode = 'nearest-neighbor';
			m.style.imageRendering = 'pixelated';
			m.style.imageRendering = '-moz-crisp-edges';
			m.style.imageRendering = 'crisp-edges';
			m.style.display = 'block';
			m.style.position = 'absolute';
			
			this.sprites.push(m);
			spritesDiv.appendChild(m);
			
			this.spriteInfo.push([false, null, null, null, null, null, null, null, null, null, null]);
		}
		
		paintDiv.appendChild(spritesDiv);
		
		// Viewport table.
		
		viewportTable = document.createElement('table');
		viewportTable.cellSpacing = 0;
		
		viewportTable.style.borderWidth = '0';
		viewportTable.style.borderCollapse = 'separate';
		viewportTable.style.borderSpacing = '0';
		viewportTable.style.emptyCells = 'show';
		viewportTable.style.height = height+'px';
		viewportTable.style.margin = '0'
		viewportTable.style.position = 'relative';
		viewportTable.style.tableLayout = 'fixed';
		viewportTable.style.width = width+'px';
		
		this.viewport = viewportTable;
		this.offsetDOM = viewportTable.style;
		
		// Viewport tbody.
		
		viewportTbody = document.createElement('tbody');
		
		for (i = 0; i < this.conf.height; ++i) {
			// Viewport row.
			
			viewportTr = document.createElement('tr');
			
			this.tiles[i] = [];
			this.tileInfo[i] = [];
			
			for (j = 0; j < this.conf.width; ++j) {
				// Viewport td.
				
				m = document.createElement('td');
				
				m.style.backgroundRepeat = 'no-repeat';
				m.style.backgroundSize = ((this.conf.width - 4) * this.conf.tileWidth * this.conf.scaleX)+'px auto';
				m.style.MsInterpolationMode = 'nearest-neighbor';
				m.style.imageRendering = 'pixelated';
				m.style.imageRendering = '-moz-crisp-edges';
				m.style.imageRendering = 'crisp-edges';
				m.style.borderWidth = '0';
				m.style.height = (this.conf.tileHeight * this.conf.scaleY)+'px';
				m.style.padding = '0';
				m.style.width = (this.conf.tileWidth * this.conf.scaleX)+'px';
				
				this.tiles[i][j] = m;
				this.tileInfo[i][j] = [null, null, null];
				viewportTr.appendChild(m);
			}
			
			viewportTbody.appendChild(viewportTr);
		}
		
		viewportTable.appendChild(viewportTbody);
		paintDiv.appendChild(viewportTable);
		innerDiv.appendChild(paintDiv);
		outerDiv.appendChild(innerDiv);
		
		QuestForge.current.baseElement.appendChild(outerDiv);
		
		//== Preload tilesets ==//
		
		tilesetsDiv = document.createElement('div');
		
		tilesetsDiv.style.height = '0';
		tilesetsDiv.style.overflow = 'hidden';
		
		for (i = this.tilesetUrls.length - 1; i >= 0; --i) {
			tilesetImg = document.createElement('img');
			
			(function (self, q) {
				tilesetImg.addEventListener('load', function () {self.tilesetLoaded(q);}, false);
			})(this, QuestForge.current);
			
			tilesetImg.src = this.tilesetUrls[i];
			tilesetsDiv.appendChild(tilesetImg);
			++QuestForge.current.numPreloads;
		}
		
		this.tilesetsDiv = tilesetsDiv;
		
		QuestForge.current.baseElement.appendChild(tilesetsDiv);
	},
	
	// Offset the whole viewport's contents by the following numbers of pixels.
	
	offset: function (x, y) {
		var style;
		
		this.offsetX = x;
		this.offsetY = y;
		
		this.offsetDOM.left = (x * this.conf.scaleX)+'px';
		this.offsetDOM.top = (y * this.conf.scaleY)+'px';
	},
	
	// Set the viewport's CSS background style to the given value.
	
	setBackground: function (background) {
		this.viewport.parentNode.style.background = background;
	},
	
	// Shift the contents of all viewport tiles one tile in the given direction.
	
	shiftDown: function () {
		var viewportGrid;
		
		viewportGrid = this.viewport.firstChild;
		
		viewportGrid.insertBefore(viewportGrid.removeChild(viewportGrid.lastChild), viewportGrid.firstChild);
		this.tiles.unshift(this.tiles.pop());
		this.tileInfo.unshift(this.tileInfo.pop());
	},
	
	shiftLeft: function () {
		var y, tileRow, viewportRow;
		
		for (y = this.conf.height - 1; y >= 0; --y) {
			tileRow = this.tiles[y];
			viewportRow = this.viewport.firstChild.childNodes[y];
			
			tileRow.push(viewportRow.appendChild(viewportRow.removeChild(tileRow.shift())));
			this.tileInfo[y].push(this.tileInfo[y].shift());
		}
	},
	
	shiftRight: function () {
		var y, tileRow, viewportRow;
		
		for (y = this.conf.height - 1; y >= 0; --y) {
			tileRow = this.tiles[y];
			viewportRow = this.viewport.firstChild.childNodes[y];
			
			tileRow.unshift(viewportRow.insertBefore(viewportRow.removeChild(tileRow.pop()), viewportRow.firstChild));
			this.tileInfo[y].unshift(this.tileInfo[y].pop());
		}
	},
	
	shiftUp: function () {
		var viewportGrid;
		
		viewportGrid = this.viewport.firstChild;
		
		viewportGrid.appendChild(viewportGrid.removeChild(viewportGrid.firstChild));
		this.tiles.push(this.tiles.shift());
		this.tileInfo.push(this.tileInfo.shift());
	},
	
	skippedFrameTick: function () {
		this.numSpritesDrawn = 0;
	},
	
	tick: function () {
		var i, num, sprites, spriteInfo;
		
		sprites = this.sprites;
		num = sprites.length;
		
		for (i = this.numSpritesDrawn; i < num; ++i) {
			spriteInfo = this.spriteInfo[i];
			
			if (spriteInfo[0] === false) {
				break;
			}
			
			spriteInfo[0] = false;
			
			// Clear the sprite.
			
			sprites[i].style.backgroundPosition = (spriteInfo[4] * this.conf.scaleX)+'px '+(spriteInfo[5] * this.conf.scaleY)+'px';
		}
		
		this.numSpritesDrawn = 0;
	},
	
	tilesetLoaded: function (questForgeInstance) {
		++this.numTilesetsLoaded;
		
		if (this.numTilesetsLoaded >= this.tilesetUrls.length) {
			questForgeInstance.baseElement.removeChild(this.tilesetsDiv);
		}
		
		questForgeInstance.itemPreloaded();
	},
};
