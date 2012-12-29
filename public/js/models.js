var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
Backbone.Model.prototype.idAttribute = 'resource_uri';
Backbone.Model.prototype.url = function() {
    // Use the id if possible
    var url = DOMAIN+this.id;

    // If there's no idAttribute, use the 'urlRoot'. Fallback to try to have the collection construct a url.
    // Explicitly add the 'id' attribute if the model has one.
    if ( url===DOMAIN ) {
        url = this.urlRoot;
        url = url || this.collection && ( _.isFunction( this.collection.url ) ? this.collection.url() : this.collection.url );

        if ( url && this.has( 'id' ) ) {
            url = addSlash( url ) + this.get( 'id' );
        }
    }

    url = url && addSlash( url );

    return url || null;
};
var addSlash = function( str ) {
    return str + ( ( str.length > 0 && str.charAt( str.length - 1 ) === '/' ) ? '' : '/' );
}
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
Backbone.TastypieRelationalModel = Backbone.RelationalModel.extend({
//    base_url: function() {
//        var temp_url = Backbone.Model.prototype.url.call(this);
//        return (temp_url.charAt(temp_url.length - 1) == '/' ? temp_url : temp_url+'/');
//    },
//    url: function() {
//        alert(this.url());
//        return this.base_url();
//    }//,
//    setUri: function(){
//        this.set('uri', this.uriPath+this.id+'/');
//        return this.get('uri');
//    }// Generate four random hex digits.
});

Backbone.TastypieCollection = Backbone.Collection.extend({
    initializeSync: function(){
        _.bindAll(this, 'getNeedSync');
   //     vent.bind("ajaxSync", this.getNeedSync, this);
  //      vent.unbind("ajaxSync", this.getNeedSync, this);
    },
    parse: function(response) {
        this.recent_meta = response.meta || {};
        return response.objects || response;
    },
    getNeedSync: function(){
        console.log('syncing');
        var target = this.where({isSynced: 0});
        target.forEach(function(each){
            each.save();
            console.log(each);
        });
        return target;
    },
    syncOn: function(){
        vent.bind("ajaxSync", this.getNeedSync, this);
    },
    syncOff: function(){
        vent.unbind("ajaxSync", this.getNeedSync, this);
    },
    convertId:function(guid){
        return this.uriPath + guid + '/';
    }
//    url: function() {
//        alert('url clean up here');
//    }
});

A.model.Question  = Backbone.TastypieRelationalModel.extend({
    urlRoot: API_URL,
    uriPath: API_Path,
    initialize: function(){
    //    this.setUri();
    },
    defaults: {
            //id:  this.get('resource_uri'),
            text: "empty text...",
            ranking: 0,//this.collection.nextOrder(),
            createdOn: ISODateString(new Date()),
            changedOn: ISODateString(new Date()),
            isSynced: 1,
            isCreatedOnServer:0
    },
    relations: [{
        type: Backbone.HasMany,
        key: 'answers',
        relatedModel: 'A.model.Answer',
        collectionType: 'A.model.Answers',
        reverseRelation: {
            key: 'question',
            includeInJSON: Backbone.Model.prototype.idAttribute//'uri'//Backbone.TastypieRelationalModel.prototype.uriId//'resourceUrl'
        }
    }],
    clear: function() {
        this.destroy();
    }
});

A.model.Answer  = Backbone.TastypieRelationalModel.extend({
    urlRoot: ANS_URL,
    uriPath: ANS_Path,
    initialize: function(){
    //    this.setUri();
    },
    defaults: {
        //id:  this.get('resource_uri'),
        text: "empty text...",
        createdOn: ISODateString(new Date()),
        changedOn: ISODateString(new Date()),
        isSynced: 1,
        isCreatedOnServer:0
    },
    clear: function() {
        this.destroy();
    }
});
A.model.Questions = Backbone.TastypieCollection.extend({
    urlRoot: API_URL,
    uriPath: API_Path,
    model: A.model.Question,
    localStorage: new Backbone.LocalStorage("Questions-backbone"),
    initialize: function(){
        this.initializeSync();
        _.bindAll(this, "gAdd");
        this.bind("add", this.gAdd);
        this.syncOn();
    },
    gAdd: function(model){
        vent.trigger("questions_add", model);
    },
    maybeFetch: function(options){
        // Helper function to fetch only if this collection has not been fetched before.
        if(this._fetched){
            // If this has already been fetched, call the success, if it exists
            options.success && options.success();
            return;
        }
        // when the original success function completes mark this collection as fetched
        var self = this,
            successWrapper = function(success){
                return function(){
                    self._fetched = true;
                    success && success.apply(this, arguments);
                };
            };
        options.success = successWrapper(options.success);
        this.fetch(options);
    },

    getOrFetch: function(id, options){
        // Helper function to use this collection as a cache for models on the server
        var model = this.get(this.convertId(id));
        if(model){
            options.success && options.success(model);
            return;
        }
        model = new A.model.Question({
            idAttribute: this.convertId(id)
        });
        console.log(model);
        //     alert(JSON.stringify(model.toJSON()));
        model.fetch(options);
    }
});

A.model.Answers = Backbone.TastypieCollection.extend({
    urlRoot: ANS_URL,
    uriPath: ANS_Path,
    model: A.model.Answer,
    localStorage: new Backbone.LocalStorage("Answers-backbone"),
    initialize: function(){
        _.bindAll(this, "gAdd");
        this.bind("add", this.gAdd);
        this.initializeSync();
        this.syncOn();
    },
    gAdd: function(model){
        vent.trigger("answers_add", model);
    },
    maybeFetch: function(options){
        // Helper function to fetch only if this collection has not been fetched before.
        if(this._fetched){
            // If this has already been fetched, call the success, if it exists
            options.success && options.success();
            return;
        }
        // when the original success function completes mark this collection as fetched
        var self = this,
            successWrapper = function(success){
                return function(){
                    self._fetched = true;
                    success && success.apply(this, arguments);
                };
            };
        options.success = successWrapper(options.success);
        this.fetch(options);
    },

    getOrFetch: function(id, options){
        // Helper function to use this collection as a cache for models on the server
        var model = this.get(id);

        if(model){
            options.success && options.success(model);
            return;
        }

        model = new A.model.Question({
            resource_uri: id
        });

        model.fetch(options);
    }
});
//
//
//A.model.Question = Backbone.RelationalModel.extend({
//    relations: [{
//        type: Backbone.HasMany,
//        key: 'answers',
//        relatedModel: 'window.Answer',
//        collectionType: 'window.Answers',
//        reverseRelation: {
//            key: 'question',
//            includeInJSON: '_id',
//        },
//    }],
//    urlRoot: API_URL
//});
//
//A.model.Questions = Backbone.Collection.extend({
//    urlRoot: API_URL,
//    model: A.model.Question,
//    initialize: function() {},
//    maybeFetch: function(options){
//        // Helper function to fetch only if this collection has not been fetched before.
//        if(this._fetched){
//            // If this has already been fetched, call the success, if it exists
//            options.success && options.success();
//            return;
//        }
//
//        // when the original success function completes mark this collection as fetched
//        var self = this,
//            successWrapper = function(success){
//                return function(){
//                    self._fetched = true;
//                    success && success.apply(this, arguments);
//                };
//            };
//        options.success = successWrapper(options.success);
//        this.fetch(options);
//    },
//
//    getOrFetch: function(id, options){
//        // Helper function to use this collection as a cache for models on the server
//        var model = this.get(id);
//
//        if(model){
//            options.success && options.success(model);
//            return;
//        }
//
//        model = new Question({
//            resource_uri: id
//        });
//
//        model.fetch(options);
//    }
//
//});