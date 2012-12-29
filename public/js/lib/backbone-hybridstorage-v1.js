/**
 * Backbone localStorage Adapter
 * https://github.com/jeromegn/Backbone.localStorage
 */
function ISODateString(d){
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'
        + pad(d.getUTCMonth()+1)+'-'
        + pad(d.getUTCDate()) +' '
        + pad(d.getUTCHours())+':'
        + pad(d.getUTCMinutes())+':'
        + pad(d.getUTCSeconds())
}
function StringToDate(textdate){
    return new Date(textdate);
}

var vent = _.extend({}, Backbone.Events);
(function() {
// A simple module to replace `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.

// Hold reference to Underscore.js and Backbone.js in the closure in order
// to make things work even if they are removed from the global namespace
    var _ = this._;
    var Backbone = this.Backbone;

// Generate a pseudo-GUID by concatenating random hexadecimal.
    function guid() {
        return (USER+'-'+new Date().getTime());
    };

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
            if(!options.noAjax){
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
                if(model.get("isCreatedOnServer")===0){
                    ajaxOptions.url=model.uriPath;
                    method='create';
                }
                Backbone.webSync(method, model, ajaxOptions);
            }
        },
        create: function(method, model,options) {
            if (!model.id) {
                var id = guid();
                model.set('id', id);
            }
            this.ajaxSyncWrapper(method,model,options);
            this.localStorage().setItem(this.name+"-"+model.id, JSON.stringify(model));
            this.records.push(model.id.toString());
            this.save();
            return model;
        },
        // Update a model by replacing its copy in `this.data`.
        update: function(method,model,options) {
           if(model.changedAttributes() || model.get('isCreatedOnServer') !==1){
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
                        data.body.isCreatedOnServer=1;
                        model.set(data.body);
                        model.save({},{noAjax:true});
                    }
//                    localModel.collection.syncOff();
                    break;
                case 202://update success
                    if(_.has(data,'body')){
                        data.body.isSynced=1;
                        model.set(data.body);
                        model.save({},{noAjax:true});
                    }
                    break;
                case 200://read success
                    //check if the request is the most recent
                    if(!_.has(model,'collection')){//if model is not a collection
//                        if(model.collection.request_timestamp>request_timestamp){
//                            return;
//                        }
//                        model.collection.request_timestamp=request_timestamp;
//                    }
//                    else{
                        if(model.request_timestamp>request_timestamp){
                            return;
                        }
                        model.request_timestamp=request_timestamp;
                    }
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
                            if(options.existing[object.id]!=='0:'+object.revision){
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
            objects.push(JSON.parse(this.localStorage().getItem(this.name+"-"+model.id)));
            return this.ajaxGet(objects, model, options);
        },
        // Return the array of all models currently in storage.
        findAll: function(collection, options){
//            console.log(collection);
            options.url=collection.url();
            var objects =_(this.records).chain()
                .map(function(id){
                    var temp = JSON.parse(this.localStorage().getItem(this.name+"-"+id));
                    if(_.has(collection,'filter_options')){
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
            return this.ajaxGet(objects, collection, options);
        },
        ajaxGet:function(objects,model, options){
            //objects is existing data
            //get list of keys and change days
            var self = this;
            var existing={};
            objects = objects || [];
            objects.forEach(function(object){
                if(_.isObject(object)){
                    if(_.has(object,'revision')&&_.has(object,'isSynced')){
                        existing[object.id]=object.isSynced+':'+object.revision;
                    }
                }
            });
            if(typeof model.models !== 'undefined'){
                model.SYNC_STATE='syncing';
            }
            else{
                model.collection.SYNC_STATE='syncing';
            }
//            var old_success=options.success;
            options.add = true;
         //   options.success=function(){};
            options.complete=function(data, request_timestamp){
                if(data.statusCode === 200){
                    options.existing = existing;
                    self.onSync(model,data, request_timestamp,options);
                }
            }
            //socket.io
            Backbone.webSync('read', model, options);
            return objects;
        },
        // Delete a model from `this.data`, returning it.
        destroy: function(method, model,options) {
            this.ajaxSyncWrapper(method, model,options);
            this.localStorage().removeItem(this.name+"-"+model.id);
            this.records = _.reject(this.records, function(record_id){return record_id == model.id.toString();});
            this.save();
            return model;
        },
        localStorage: function() {
            return localStorage;
        }
    });

// localSync delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
// window.Store.sync and Backbone.localSync is deprectated, use Backbone.LocalStorage.sync instead
    Backbone.LocalStorage.sync = window.Store.sync = Backbone.localSync = function(method, model, options, error) {
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
    Backbone.imageUploadSync = function(method, model, options ){
    }

    //web socket
    Backbone.webSync =function(method, model, options ){
        var socket = Backbone.socket || Backbone.startSocket();
        var data = {};
        if(model.id && method !== 'create'){
            data.id = model.id;
//            data.url=model.uriPath+data.id+'/';
        }
//        else if(){
//            data.url=model.uriPath;
//        }
//        else{
        console.log(options.url);
         data.url= options.url || model.url();
        //adds slash for django
        if(data.url.indexOf('?')===-1){
            data.url=(data.url.charAt(data.url.length - 1) == '/' ? data.url:data.url+'/');
        }
//        }
        if(method !== 'read'){
            data.body = model || {};
        }
        console.log('data body: '+JSON.stringify(data.body));
//        console.log('emit- '+method +' data: ' +JSON.stringify(data));
        console.log('emit- '+method +' data_url: ' +data.url);
        $('#loading_bar').show();
        socket.emit(method, JSON.stringify(data));
        vent.on(method+':'+data.url,function(data) {
            var request_timestamp = new Date().getTime();
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
            return Backbone.localSync;
        }
        return Backbone.ajaxSync;
    };
// Override 'Backbone.sync' to default to localSync,
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