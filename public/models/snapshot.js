var A = A || {};
A.model = A.model || {};
A.view = A.view || {};

(  function( undefined ){
    A.model.Snapshot  = Backbone.Model.extend({
        urlRoot: SNAP_URL,
        initialize: function(){
            if(!this.has('id')){
                this.set('id', A.view.helper.guid());
            }
        },
        defaults: {
            text: "",
            tile_image: IMG_PATH+'/cog.png',
            original_image: IMG_PATH+'/cog.png',
            ordering: 0,
            horizontal_size:1,
            vertical_size: 1,
            created_on: new Date().getTime(),
            modified_on: new Date().getTime(),
            isSynced: 1,
            isCreatedOnServer:0
        },
        clear: function() {
            this.destroy();
        }
    });

    A.model.Snapshots = Backbone.PaginatedCollection.extend({
        urlRoot: SNAP_URL,
        model: A.model.Snapshot,
        comparator : function(model) {
            return model.get('ordering')//*model.get('created_on');
        },
        localStorage: new Backbone.LocalStorage("Snapshots-backbone"),
        initialize: function(){
//            _.bindAll(this, "gAdd");
//            this.bind("add", this.gAdd);
            this.initializePaginatedCollection();
//            this.syncOn();
        },
//        gAdd: function(model){
//            app.vent.trigger("snapshots_add", model);
//        },
//        reorder: function(old_ordering, new_ordering){
////            console.log(old_ordering+' '+ new_ordering)
//            var set;
//            var diff;
//            if(old_ordering > new_ordering){
//                set = this.filter(function(item){
//                    return (item.get('ordering') > (new_ordering-1)&&item.get('ordering') < (old_ordering)) ;
//                });
//                diff = 1;
//            }
//            else if(old_ordering < new_ordering){
//                set = this.filter(function(item){
//                    return (item.get('ordering') < (new_ordering+1)&&item.get('ordering') > (old_ordering)) ;
//                });
//                diff = -1;
//            }
//            for(var i in set){
//                var item = set[i]
////                console.log(JSON.stringify(item.attributes));
//                var temp_ordering = item.get('ordering')+diff;
//                item.set('ordering', temp_ordering,{silent:true});
//                item.save({noAjax:true});
//            }
//        },
        defaultComparator: function(item) {
            return item.get("ordering");
        },
        newestComparator: function(item) {
            return item.get("-modified_on");
        },
        oldestComparator: function(item) {
            return item.get("modified_on");
        }
//        ,
//        getOrFetch: function(id, options){
//            // Helper function to use this collection as a cache for models on the server
//            var model = this.get(id);
//            if(model){
//                options.success && options.success(model);
//                return;
//            }
//            model = new A.model.Snapshot({
//                id: id
//            });
//            model.fetch(options);
//        }
    });
})()