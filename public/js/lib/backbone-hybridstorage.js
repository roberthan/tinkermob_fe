/**
 * Backbone localStorage Adapter
 * https://github.com/jeromegn/Backbone.localStorage
 */
// A simple module to replace `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object.

var vent = _.extend({}, Backbone.Events);
(function() {

// Hold reference to Underscore.js and Backbone.js in the closure in order
// to make things work even if they are removed from the global namespace
    var _ = this._;
    var Backbone = this.Backbone;

// Our Store is represented by a single JS object in *localStorage*. Create it
// with a meaningful name, like the name you'd give a table.
// window.Store is deprectated, use Backbone.LocalStorage instead
    Backbone.LocalStorage = window.Store = function(name) {
        this.name = name;
        var store = this.localStorage().getItem(this.name);
        this.records = (store && store.split(",")) || [];
    };

    _.extend(Backbone.LocalStorage.prototype, {
        // Save the current state of the **Store** to *localStorage*.
        save: function() {
            this.localStorage().setItem(this.name, this.records.join(","));
        },
         ajaxSyncWrapper: function(method, model, options) {
             var self = this;
                if(model.get('isSynced')===1){
                    model.set("modified_on", new Date().getTime());
                }
                model.set("isSynced", 0);
                var ajaxOptions = options || {};
                var thisModel = model;
                thisModel.collection.syncOff();//gets rid of duplicates
                thisModel.collection.syncOn();
                ajaxOptions.complete= function(data, request_timestamp ){
                    self.onSync(model,data, request_timestamp);
                }
                if(model.has("revision")===false){
                    method='create';
                    ajaxOptions.url=model.urlRoot;
                }
                else if(model.get("revision")>=0){
                    method='update';
                }
                Backbone.djangoSync(method, model, ajaxOptions);
        },
        create: function(method, model,options) {
            if (!model.id) {
                var id = A.view.helper.guid();
                model.set('id', id);
            }
            if(!options.noAjax){
                this.ajaxSyncWrapper(method,model,options);
            }
            this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
            this.records.push(model.id.toString());
            this.save();
            return model;
        },
        // Update a model by replacing its copy in `this.data`.
        update: function(method,model,options) {
//           if(model.changedAttributes() || model.get('isCreatedOnServer') !==1){
            if(!options.noAjax){
                this.ajaxSyncWrapper(method,model,options);
            }
            this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
            if (!_.include(this.records, model.id.toString())) this.records.push(model.id.toString());
            this.save();
            return model;
        },
        onSync: function(model, data, request_timestamp, options){
            options = options || {};
            console.log('ajax success - '+ request_timestamp);
            switch(data.statusCode){
                case 201://create success
                    if(_.has(data,'body')){
                        data.body.isSynced=1;
//                        data.body.isCreatedOnServer=1;
                        model.set(data.body);
                        model.save({},{noAjax:true});
                        if(model.get('destroy')===true){
                            model.destroy({noAjax:true});
                        }
                        if(model.noCache === true){
                            this.localStorage().removeItem(this.name+"-"+model.id);
                            this.records = _.reject(this.records, function(record_id){return record_id == model.id.toString();});
                            this.save();
                        }
                    }
//                    localModel.collection.syncOff();
                    break;
                case 202://update success
                    if(_.has(data,'body')){
                        data.body.isSynced=1;
                        model.set(data.body);
                        model.save({},{noAjax:true});
                        console.log(model)
                        if(model.get('destroy')===true){
                            model.destroy({noAjax:true});
                        }
                        if(model.noCache === true){
                            this.localStorage().removeItem(this.name+"-"+model.id);
                            this.records = _.reject(this.records, function(record_id){return record_id == model.id.toString();});
                            this.save();
                        }
                    }
                    break;
                case 200://read success
                    //check if the request is the most recent
                    if(!_.has(model,'collection')){//if model is not a collection
                        if(model.request_timestamp>request_timestamp){
                            return;
                        }
                        model.request_timestamp=request_timestamp;
                    }
//                    console.log(model.request_timestamp)
//                    console.log(options)
                    //put data into array
                    var new_data=[];
                    var final_data=[];
                    if(!_.isArray(data.body.objects)){
                        new_data.push(JSON.parse(data.body));
                    }
                    else{
                        new_data=data.body.objects;
                        console.log('check '+new_data);
                    }
                    //check if it's already loaded
                    new_data.forEach(function(object, index){
                        if(_.has(options.existing, object.id) ){
                            //check for revision id + is synced
                            if(options.existing[object.id]<object.revision){
                                final_data.push(object);
                            }
                        }
                        else{
                            final_data.push(object);
                        }
                    });
                    if(_.has(options,'success')){
                        if(typeof model.models !== 'undefined'){
                            model.SYNC_STATE='ready';
                        }
                        else{
                            model.collection.SYNC_STATE='ready';
                        }
                        if(_.has(model,'collection')){//if model is not a collection
                            model.set(final_data[0]);
                        }
                        else{
//                            console.log(final_data[0].objects)
//                            model.set(final_data[0]);
//                            var temp = {}
//                            temp.objects=final_data[0].objects;
//                            temp.meta = data.body.meta || {};
//                            console.log(data.body.meta)
//                            options.success(temp);
                            options.success(final_data[0]);
                        }
//                        console.log(JSON.stringify(final_data));
//                        console.log(model);
//                        options.success(final_data);
                    }
                    break;
                default://error
                    console.log('ERROR: '+data.statusCode);
                    console.log(JSON.stringify(data));
                    break;
            }
        },
        // Retrieve a model from `this.data` by id.
        find: function(model, options) {
            console.log('find one');
            var objects=[];
            if(options.useCache === true){
                objects.push(JSON.parse(this.localStorage().getItem(this.name+"-"+model.id)));
            }
            return this.ajaxGet(objects, model, options);
        },
        // Return the array of all models currently in storage.
        findAll: function(collection, options){
//            console.log(collection);
            options.url=collection.url();
            if(options.useCache === true){
                var objects =_(this.records).chain()
                    .map(function(id){
                        var temp = JSON.parse(this.localStorage().getItem(this.name+"-"+id));
                        if(_.isObject(collection.filter_options)&&_.isObject(temp)){
    //                    if(_.has(collection,'filter_options')){
                            _.each(_.intersection(_.keys(collection.filter_options),_.keys(temp)),function(value){
                                if(temp[value]!==collection.filter_options[value]){
                                    temp = false;
                                }
                            });
                        }
                        return temp;
                    }, this)
                    .compact()
                    .value();
            }
            return this.ajaxGet(objects, collection, options);
        },
        ajaxGet:function(objects,model, options){
            //objects is existing data
            //get list of keys and change days
            var self = this;
            var existing={};
            objects = objects || [];
            if(options.useCache === true){
                console.log('using cache')
                objects.forEach(function(object){
                    if(_.isObject(object)){
                        if(_.has(object,'revision')&&_.has(object,'isSynced')){
                            existing[object.id]=object.revision;
                        }
                    }
                });
            }

            if(typeof model.models !== 'undefined'){
                model.SYNC_STATE='syncing';
            }
            else{
                model.collection.SYNC_STATE='syncing';
            }
//            var old_success=options.success;
//            options.add = true;
         //   options.success=function(){};
            options.complete=function(data, request_timestamp){
                if(data.statusCode === 200){
                    options.existing = existing;
                    self.onSync(model,data, request_timestamp,options);
                }
            }
            //socket.io
            Backbone.djangoSync('read', model, options);
            return objects;
        },
        // Delete a model from `this.data`, returning it.
        destroy: function(method, model,options) {
            if(!options.noAjax){
                this.ajaxSyncWrapper(method, model,options);
            }
            this.localStorage().removeItem(this.name+"-"+model.id);
            this.records = _.reject(this.records, function(record_id){return record_id == model.id.toString();});
            this.save();
            return model;
        },
        localStorage: function() {
            return localStorage;
        }
    });

// hybridSync delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
// window.Store.sync and Backbone.hybridSync is deprectated, use Backbone.LocalStorage.sync instead
    Backbone.LocalStorage.sync = window.Store.sync = Backbone.hybridSync = function(method, model, options, error) {
        var store = model.localStorage || model.collection.localStorage;
        // Backwards compatibility with Backbone <= 0.3.3
        if (typeof options == 'function') {
            options = {
                success: options,
                error: error
            };
        }
        var resp;
        if(method){
            console.log('backend: '+method);
        }
        switch (method) {
            case "read":    resp = model.id != undefined ? store.find(model, options) : store.findAll(model, options); break;
            case "create":  resp = store.create(method, model,options);                            break;
            case "update":  resp = store.update(method, model,options);                            break;
            case "delete":  resp = store.destroy(method, model,options);                           break;
        }
        if (resp) {
            options.success(resp);
        } else {
            options.error("Record not found");
        }
    };
    //original
    Backbone.ajaxSync = Backbone.sync;

    //web socket
    Backbone.djangoSync =function(method, model, options ){
        var socket = Backbone.socket || Backbone.startSocket();
        var data = {};
         data.url= options.url || model.url();
        //adds slash for django
        if(data.url.indexOf('?')===-1){
            data.url=(data.url.charAt(data.url.length - 1) == '/' ? data.url:data.url+'/');
        }
        if(method !== 'read'){
            //class the model's specific django data reduction function
            if(typeof model.djangoSerial !== 'undefined'){
                data.body = model.djangoSerial();
            }
            else{
                data.body = model || {};
            }
        }
//        console.log('data body: '+JSON.stringify(data.body));
        console.log('emit- '+method +' data_url: ' +data.url);
        $('#loading_bar').show();
        socket.emit(method, JSON.stringify(data));
        var request_timestamp = new Date().getTime();
        vent.on(method+':'+data.url,function(data) {
            options.complete(data, request_timestamp);//success(data);
        });
    }

    Backbone.startSocket= function(){
        Backbone.socket = io.connect(DOMAIN);
        //bound socket response listener
        Backbone.socket.on('success', function(data){
//           console.log('trigger: ' + data.method+'-'+JSON.stringify(data));
            $('#loading_bar').hide();
           vent.trigger(data.method+':'+data.url,data);
        });
        Backbone.socket.on('revised', function(data){
           console.log('revised: ' + data.method+':'+JSON.stringify(data));
           vent.trigger(data.method+':'+data.url,data);
        });
        Backbone.socket.on('reconnect', function(){
//            alert('connection reconnected');
            vent.trigger("ajaxSync");
// console.log("Connection " + socket.id + " terminated.");
        });
//        Backbone.socket.on('disconnect', function(){
//            alert('connection terminated');
//        });
        return Backbone.socket;
    }

    Backbone.getSyncMethod = function(model) {
        if((model.localStorage || (model.collection && model.collection.localStorage)) && USER !=='')
        {
            return Backbone.hybridSync;
        }
        return Backbone.ajaxSync;
    };
// Override 'Backbone.sync' to default to hybridSync,
// the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
    Backbone.sync = function(method, model, options, error) {
        return Backbone.getSyncMethod(model).apply(this, [method, model, options, error]);
    };
})();

Backbone.syncTimer = function(){
    this.isOn=false;
    this.failedCount=0;
    this.c=0;
    if (!this.isOn)
    {
        this.isOn=true;
        this.timedCount(5);
    }
}
Backbone.syncTimer.prototype={
    timedCount: function(delay){
        var self = this;
        this.c=this.c+1;
        console.log('event triggered');
        vent.trigger("ajaxSync");
        delay=Math.min(200000,parseInt(delay));
        setTimeout("A.timer.timedCount(5)",delay*5000);
    }
}