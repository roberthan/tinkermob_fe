var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
(  function( undefined ){

    Backbone.Model.prototype.idAttribute = 'id';

    Backbone.SupportModel = Backbone.Model.extend({
        url: function(){
        var temp_url = this.urlRoot;// + (this.id || "");
        console.log(temp_url)
        return temp_url;
        }
        ,
        noCache: true
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
            app.vent.bind("ajaxSync", this.getNeedSync, this);
        },
        syncOff: function(){
            app.vent.unbind("ajaxSync", this.getNeedSync, this);
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
        }
//        ,
//        url: function(model){
//            var temp_url = this.urlRoot + (this.model.id || "");
//            console.log(temp_url)
//            return temp_url;
//        }
    });


    Backbone.PaginatedCollection = Backbone.Collection.extend({
        initializePaginatedCollection: function() {
            _.bindAll(this, 'parse', 'url', 'pageInfo', 'nextPage', 'previousPage', 'filtrate', 'sort_by');
            typeof(options) != 'undefined' || (options = {});
            typeof(this.limit) != 'undefined' || (this.limit = 8);
            typeof(this.offset) != 'undefined' || (this.offset = 0);
            typeof(this.filter_options) != 'undefined' || (this.filter_options = {});
            typeof(this.sort_field) != 'undefined' || (this.sort_field = '');
        },
        fetch: function(options) {
            typeof(options) != 'undefined' || (options = {});
            var self = this;
            var success = options.success;
            options.success = function(resp) {
                //self.trigger("fetched");
                if(success) { success(self, resp); }
            };
            return Backbone.Collection.prototype.fetch.call(this, options);
        },
        parse: function(resp) {
            if(_.has(resp,'meta')){
                this.offset = resp.meta.offset;
                this.limit = resp.meta.limit;
                this.total = resp.meta.total_count;
                return resp.objects;
            }
            else{
                return resp.objects || resp;
            }
        },
        url: function() {
//            if(_.isArray(models)){
////                console.log(this.uriPath + ( models ? 'set/' + _.pluck( models, 'id' ).join(';') + '/' : '' ));
//                return this.uriPath + ( models ? 'set/' + _.pluck( models, 'id' ).join(';') + '/' : '' );
//            }
//            else{
                urlparams = {offset: this.offset, limit: this.limit};
                urlparams = $.extend(urlparams, this.filter_options);
                if (this.sort_field) {
                    urlparams = $.extend(urlparams, {order_by: this.sort_field});
                }
                return this.urlRoot + '?' + $.param(urlparams);
//            }

        },
        pageInfo: function() {
            var info = {
                total: this.total,
                offset: this.offset,
                limit: this.limit,
                pages: Math.ceil(this.total / this.limit),
                prev: false,
                next: false
            };

            var max = Math.min(this.total, this.offset + this.limit);

            if (this.total == this.pages * this.limit) {
                max = this.total;
            }

            info.range = [(this.offset + 1), max];

            if (this.offset > 0) {
                info.prev = (this.offset - this.limit) || 1;
            }

            if (this.offset + this.limit < info.total) {
                info.next = this.offset + this.limit;
            }
            return info;
        },
        nextPage: function(limit) {
            var l = limit || this.limit;
            if (!this.pageInfo().next) {
                return false;
            }
            this.offset = this.offset + l;
            return this.fetch({add: true});
        },
        previousPage: function(limit) {
            var l = limit || this.limit;
            if (!this.pageInfo().prev) {
                return false;
            }
            this.offset = (this.offset - l) || 0;
            return this.fetch({add: true, append_to_front:true});
        },
        hasNext: function() {
            if (!this.pageInfo().next) {
                return false;
            }
            return true;
        },
        hasPrevious: function() {
            if (!this.pageInfo().prev) {
                return false;
            }
            return true;
        },
        filtrate: function (options) {
            options = options || {};
            this.filter_options = options.filter || {};
            this.offset = 0;
            return this.fetch(options);
        },
        sort_by: function (field) {
            this.sort_field = field;
            this.offset = 0;
            return this.fetch();
        },
        getNeedSync: function(){
//            console.log('syncing');
            var target = this.where({isSynced: 0});
            target.forEach(function(each){
                each.save();
//                console.log(each);
            });
            return target;
        },
        syncOn: function(){
            app.vent.bind("ajaxSync", this.getNeedSync, this);
        },
        syncOff: function(){
            app.vent.unbind("ajaxSync", this.getNeedSync, this);
        }
    });

})()