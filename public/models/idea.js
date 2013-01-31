var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
(function( undefined ){

    A.model.Idea  = Backbone.Model.extend({
        urlRoot: IDEA_URL,
        initialize: function(){
            var self = this;
            if(!this.has('id')){
                this.set('id', A.view.helper.guid());
            }
        },
        defaults: {
            text: "empty text...",
            tag_line: "",
            count_supporters: '0',//this.collection.nextOrder(),
            count_questions: '0',//this.collection.nextOrder(),
            count_snapshots: '0',//this.collection.nextOrder(),
            tile_image: '/img/lightblub.png',//this.collection.nextOrder(),
            user_icon_image: '/img/lightblub.png',//this.collection.nextOrder(),
//            original_image: '/img/cog.png',
            created_on: new Date().getTime(),
            modified_on: new Date().getTime(),
            isSynced: 1,
            username:'loading',
            ordering: 0,//A.model.Idea.getOrder()
            horizontal_size:1,
            vertical_size: 1
        },
        clear: function() {
            this.destroy();
        },
//        getOrder: function(){
//            if(_.isUndefined(this.collection)){
//                return 0;
//            }
//            return this.collection.newOrder();
//        },
        djangoSerial: function(){
            var json = this.toJSON()
            delete json.snapshots;
            delete json.supporters;
            delete json.questions;
            delete json.img_tile_src;
            delete json.isSynced;
            delete json.count_supporters;
            delete json.count_questions;
            delete json.count_snapshots;
            delete json.is_supporter;
            delete json.username;
            delete json.icon_image;
            delete json.original_image;
            delete json.user_icon_image;
            delete json.tile_image;
            return json;
        }
    });
    A.model.Ideas = Backbone.PaginatedCollection.extend({
        urlRoot: IDEA_URL,
        model: A.model.Idea,
        comparator : function(model) {
            return -1*model.get('count_supporters')*model.get('created_on');
        },
        localStorage: new Backbone.LocalStorage("Ideas-backbone"),
        initialize: function(){
            this.initializePaginatedCollection();
//            this.initializeSync();
//            _.bindAll(this, "gAdd");
//            this.bind("add", this.gAdd);
//            this.syncOn();
        },
        defaultComparator: function(item) {
            return (-1*item.get('count_supporters'));
        },
        newestComparator: function(item) {
            return item.get("-modified_on");
        },
        oldestComparator: function(item) {
            return item.get("modified_on");
        },
        getOrFetch: function(id, options){
            // Helper function to use this collection as a cache for models on the server
            var model = this.get(id);
            if(model){
                options.success && options.success(model);
                return;
            }
            model = new A.model.Idea({
                id: id
            });
            model.fetch(options);
        }
//    ,
//        reorder: function(new_ordering, old_ordering){
//            old_ordering = parseInt(old_ordering);
//            new_ordering = parseInt(new_ordering);
//            console.log(new_ordering+'<'+old_ordering)
//            var diff =  new_ordering - old_ordering;
//            _(this.models).each(function(model, index, list) {
//                var current_ordering = parseInt(model.get('ordering')) || 0;
//                if(diff < 0){
//                    if(current_ordering >= new_ordering && current_ordering < old_ordering){
//                        model.set('ordering', current_ordering + 1);
//                        model.save({},{noAjax:true});
//                    }
//                }
//                if(diff > 0){
//                    if(current_ordering <= new_ordering && current_ordering > old_ordering){
//                        model.set('ordering', current_ordering - 1);
//                        model.save({},{noAjax:true});
//                    }
//                }
//                if(current_ordering === old_ordering){
//                    model.set('ordering', new_ordering);
//                    model.save();
//                }
//            });
//            //this.sort();
//        },
//        newOrder: function(){
//            var highest_order =  _.max(this, function(idea){ return idea.ordering; });
//            console.log(highest_order);
//            return (highest_order.ordering + 1);
//        }
    });
})();