( function( exports ) {
	'use strict';

	function Task(collection, delay, deferredFunction) {
		this.timeout = null;
		
		this.start = this.next = function() {
			var items = collection.next().value;

			if ( items ) {
				this.run( items );
			}
		};

		this.run = function( items ) {
			/*
			 * TODO: fix flow with manual call
			 */
			var ctx = this;
			this.timeout = setTimeout(function() {
				deferredFunction.call(ctx, items);
				ctx.next();
			}, delay);
		};

		this.stop = function() {
			if (this.timeout) {
				clearTimeout(this.timeout);
				collection.reset(1);
				this.timeout = null;
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
		prev: function() {
			this.index = this.index > 0 ? this.index - this.step : 0;
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
		reset: function( steps ) {
			this.index = steps ? this.index - this.step * steps : 0;
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
		this.tasksCount = 0;
	}

	DTM.prototype = {
		add: function(name, callback, collection, delay, chunk, single) {
			if (arguments.length < 3) {
				console.warn('Please specify: name, callback, collection');
				return;
			}
			
			chunk = chunk || 1;
			delay = delay || 0;
			single = single || false;


			if (single) {
				this.unregister( name );
				collection = new Array(1);
				chunk = 1;
			}

			if (this.tasks[name]) {
				// this.tasks[name].extendCollection(collection);
			} else {
				var collectionIterator = new Iterator( collection, chunk );
				var task = new Task( collectionIterator, delay, callback );

				this.tasks[name] = task;
				this.taskCount++;
				task.run();
			}
		},
		unregister: function(name) {
			var task = this.tasks[name];
			if (task) {
				task.stop();
				this.taskCount--;
				delete this.tasks[name];
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