"use strict";

var QuestForge;

QuestForge = function (baseElement, props) {
	this.baseElement = baseElement !== undefined ? baseElement : document.body;
	this.engines = {};
	this.conf = {};
	
	QuestForge.applyProperties(props, this.conf);
	QuestForge.current = this;
	
	// Custom game world and engine modifications.
	
	this.custom = new (props.custom !== undefined ? props.custom : QuestForge.current.Custom)();
	
	// Set up all registered engines.
	
	this.setUpEngines(QuestForge.registeredEngines);
};

QuestForge.prototype = {
	id: null,
	conf: null,
	
	enginesSetUp: null,
	engines: null,
	numPreloads: 0,
	tick: null,
	
	//== Functions ==//
	
	setUpEngines: function (engineNames) {
		var engine, engineName, engineNameLower, i, len,
		    custom;
		
		custom = this.custom;
		len = engineNames.length;
		
		for (i = 0; i < len; ++i) {
			engineName = engineNames[i];
			
			if (this.engines[engineName] === undefined) {
				// The engine has not yet been loaded.
				
				engine = QuestForge.current[engineName];
				
				if (engine === undefined) {
					// Couldn't find the object for the engine name.
					
					return false;
				}
				
				if (this.setUpEngines(QuestForge.engineDependencies[engineName]) === false) {
					// Failed to satisfy dependencies.
					
					return false;
				}
				
				// Dependencies are satisfied. Construct the engine.
				
				engineNameLower = engineName.substr(0, 1).toLowerCase()+engineName.substr(1);
				
				engine = new engine(this.conf.hasOwnProperty(engineNameLower) ? this.conf[engineNameLower] : {});
				engine.engineName = engineName;
				this.engines[engineName] = engine;
				
				// Add the short reference, if the name is not already taken.
				
				if (this[engineNameLower] === undefined) {
					this[engineNameLower] = engine;
				}
				
				// Run the custom engine setup function, if present.
				
				if (custom.engineSetup !== undefined && custom.engineSetup[engineNameLower] !== undefined) {
					custom.engineSetup[engineNameLower](engine);
				}
			}
		}
		
		// The engine is set up.
		
		return true;
	},
	
	itemPreloaded: function () {
		--this.numPreloads;
		
		if (this.numPreloads <= 0) {
			this.startUp();
		}
	},
	
	startUp: function () {
		QuestForge.current = this;
		
		// Start the game.
		
		this.custom.start();
	},
};

//== Static ==//

QuestForge.current = null;
QuestForge.instances = [];

QuestForge.registeredEngines = [];
QuestForge.engineDependencies = {};

QuestForge.add = function (baseElement, props) {
	var q;
	
	if (QuestForge.instances.length === 0) {
		// This is the first instance. Add global event listeners.
		
		window.addEventListener('keydown', QuestForge.eventKeyDown, false);
		window.addEventListener('keyup', QuestForge.eventKeyUp, false);
		window.addEventListener('blur', QuestForge.eventBlur, false);
	}
	
	q = new QuestForge(baseElement, props);
	q.id = QuestForge.instances.length;
	QuestForge.instances.push(q);
	return q;
};

QuestForge.addIdentifiable = function (objClass, collection, props, defaults) {
	var i, object;
	
	if (props === undefined) {
		props = {};
	}
	
	object = new objClass(props);
	
	if (props.hasOwnProperty('id') === false) {
		object.id = collection.length;
	}
	
	if (defaults !== undefined) {
		for (i in defaults) {
			if (defaults.hasOwnProperty(i) === true && props.hasOwnProperty(i) === false) {
				object[i] = defaults[i];
			}
		}
	}
	
	collection.push(object);
	return object;
};

QuestForge.applyProperties = function (src, dest) {
	var key;
	
	for (key in src) {
		if (src.hasOwnProperty(key) === true) {
			dest[key] = src[key];
		}
	}
};

QuestForge.arrayIndexOf = function (array, value) {
	var i;
	
	if (Array.prototype.indexOf !== undefined && array.indexOf !== undefined) {
		return array.indexOf(value);
	}
	
	for (i = array.length - 1; i >= 0; --i) {
		if (array[i] === value) {
			return i;
		}
	}
	
	return -1;
};

QuestForge.cloneProperties = function (src, dest) {
	var key, value;
	
	for (key in src) {
		if (src.hasOwnProperty(key) === true) {
			value = src[key];
			
			if (value === null) {
				dest[key] = null;
			}
			else if (typeof value === 'object') {
				if (typeof dest[key] !== 'object' || dest[key] === null) {
					dest[key] = {};
				}
				
				this.cloneProperties(dest[key], value);
			}
			else {
				dest[key] = value;
			}
		}
	}
};

QuestForge.keyChange = function (e, keyIsDown) {
	var i, keyCode, matched;
	
	if (e === undefined && event !== undefined) {
		e = event;
	}
	
	keyCode = e.keyCode;
	matched = false;
	
	for (i = QuestForge.instances.length - 1; i >= 0; --i) {
		if (QuestForge.instances[i].inputEngine.keyChange(keyCode, keyIsDown) === true) {
			matched = true;
		}
	}
	
	if (matched === true) {
		if (e.preventDefault !== undefined) {
			e.preventDefault();
		}
		
		return false;
	}
	
	return true;
};

QuestForge.registerEngine = function (engineName, dependencies) {
	QuestForge.registeredEngines.push(engineName);
	QuestForge.engineDependencies[engineName] = dependencies;
};

QuestForge.setTimeout = function (func, delay) {
	var args, f;
	
	args = Array.prototype.slice.call(arguments, 2);
	f = (function () {func.apply(null, args);});
	
	return window.setTimeout(f, delay);
};

//== Static event handlers (not called in QuestForge scope) ==//

QuestForge.eventKeyDown = function (e) {
	return QuestForge.keyChange(e, true);
};

QuestForge.eventKeyUp = function (e) {
	return QuestForge.keyChange(e, false);
};

QuestForge.eventBlur = function (e) {
	var i;
	
	for (i = QuestForge.instances.length - 1; i >= 0; --i) {
		QuestForge.instances[i].inputEngine.blur();
	}
};

QuestForge.tick = function (instance, lateness) {
	QuestForge.current = instance;
	instance.game.tick(lateness);
};
