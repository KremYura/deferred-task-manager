var DTM = function(params) {
	params = params || {};
	
	this.tasks = { };
	this.taskCount = 0;
	
	this.onStart = params.onStart || this.onStart;
	this.onFinish = params.onFinish || this.onFinish;

	this.Task = function(name, params, dtm) {
		var self = this;
		
		params = params || {};

		this.name = name;
		this.single = params.single || false;
		this.collection = [].concat(params.collection || []);
		this.delay = params.delay || 0;
		this.partialItemsCount = params.partialItemsCount || 1;
		this.deferredFunction = params.deferredFunction || function(partialItems) { this.endTask(); };
		this.timeout = undefined;

		if (this.deferredFunction.toString().indexOf('.endTask()') == -1) {
			alert('Task: "'+name+'" initialized without endTask method call. Please add this.endTask(); in deferredFunction logic');
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
	};
};

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
			this.tasks[name] = new this.Task(name, params, this);
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
			this.unregister(name);
		}
	}
};