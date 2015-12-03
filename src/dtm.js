( function( exports ) {
	'use strict';

	function Task(collection, delay, deferredFunction) {
		this.timeout = null;
		
		this.next = function() {
			var items = collection.next().value;

			if ( items ) {
				this.start( items );
			}
		};

		this.start = function(items) {
			var ctx = this;
			this.timeout = setTimeout(function() {
				deferredFunction.call(ctx, items);
				ctx.next();
			}, delay);
		};

		this.stop = function() {
			if (this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
		};

		this.run = function() {
			this.next();
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
		done: function() { // returns !hasNext
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
				//this.tasks[name] = new Task1(name, params, this);
				//debugger;
				this.tasks[name] = new Iterator( params.collection, params.partialItemsCount );
				this.taskCount++;
				this.startTask( this.tasks[name], params.delay, params.deferredFunction );
			}
		},
		startTask: function( collectionIterator, delay, deferredFunction ) {
			/*task.each(function( items ) {
				setTimeout( function() {
					deferredFunction( items );
				}, delay );
			});*/
			var task = new Task(collectionIterator, delay, deferredFunction);
			task.run();
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