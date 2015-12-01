( function( exports ) {
	'use strict';

	function Task1(name, params, dtm) {
		var self = this;
		
		params = params || {};

		this.name = name;
		this.single = params.single || false;
		this.collection = [].concat(params.collection || []);
		this.delay = params.delay || 0;
		this.partialItemsCount = params.partialItemsCount || 1;
		this.deferredFunction = getTaskFunction(params.deferredFunction);
		this.timeout = undefined;

		function getTaskFunction(func) {
			return function() {
				func && func.apply(this, arguments);
				this.endTask();
			}
		}

		this.getPartialItems = function() {
			return this.collection.splice(0, this.partialItemsCount || 1);
		};

		this.runDeferredFunction = function(partialItems) {
			var status = this.deferredFunction.call(this, partialItems);

			return status;
		};

		this.extendCollection = function(collection) {
			this.collection.push.apply(this.collection, collection);
			//var _spliceHelper = [0,0];
			//_spliceHelper.push.apply(_spliceHelper, collection);
			//this.collection.splice.apply(this.collection, _spliceHelper);
		};

		this.startTask = function() {
			this.timeout = setTimeout(function() {
				var data = self.getPartialItems();
				self.runDeferredFunction(data);
			}, this.delay);
		};

		this.endTask = function() {
			this.timeout = null;
			if (this.collection.length > 0) {
				this.startTask();
			} else {
				dtm.unregister(this.name);
			}
		};
	}

	function Iterator( collection, step ) {
		this.index = 0;
		this.step = step || 1;
		this.items = collection;
	}

	Iterator.prototype = {
		first: function() {
			this.reset();
			return this.next();
		},
		next: function() {
			var nextIndex = this.index + this.step,
				items = Array.prototype.slice.call(this.items, this.index, nextIndex);
			this.index = nextIndex;
			return {
				value: items.length ? items : undefined,
				done: this.done()
			};
		},
		done: function() {
			return this.index >= this.items.length + this.step;
		},
		reset: function() {
			this.index = 0;
		},
		each: function( callback ) {
			var item = this.first();
			while (!item.done) {
				callback( item.value );
				item = this.next();
			}
		}
	};

	function Task(cb, partialItems, partialItemsCount) {

		this.run = function() {
			//cb.apply(this, Array.prototype.slice.call(arguments, 1));
			cb.apply(this, arguments);
		};
	}

	function DTM(params) {
		params = params || {};
		
		this.tasks = { };
		this.taskCount = 0;
		
		this.onStart = params.onStart || this.onStart;
		this.onFinish = params.onFinish || this.onFinish;
	}

	DTM.prototype = {
		onStart: function() {
			//console.log('onStart');
		},
		onFinish: function() {
			//console.log('onFinish');
		},
		add: function(name, params) {
			if (this.taskCount === 0) {
				this.onStart();
			}

			if (params.single) {
				this.unregister(name);
				params.collection = ["single"];
			}

			if (this.tasks[name]) {
				this.tasks[name].extendCollection(params.collection);
			} else {
				this.tasks[name] = new Task1(name, params, this);
				this.taskCount++;
				this.tasks[name].startTask();
			}
		},
		unregister: function(name) {
			if (this.tasks[name]) {
				if (this.tasks[name].timeout) {
					clearTimeout(this.tasks[name].timeout);
					this.tasks[name].timeout = null;
				}
				this.taskCount--;
				delete this.tasks[name];
			}

			if (this.taskCount === 0) {
				this.onFinish();
			}
		},
		unregisterAll: function() {
			for (var name in this.tasks) {
				if ( this.tasks.hasOwnProperty(name) ) {
					this.unregister(name);
				}
			}
		}
	};

	exports.DTM = DTM;
	exports.Task = Task;
	exports.Iterator = Iterator;
}( this ) );