var A = A || {};
A.model = A.model || {};
A.view = A.view || {};

(  function( undefined ){

    A.model.Question  = Backbone.Model.extend({
        urlRoot: QUEST_URL,
        initialize: function(){
            if(!this.has('id')){
                this.set('id', A.view.helper.guid());
            }
        },
        defaults: {
//            user: "",
            is_owner: 0,
            text: "empty text...",
            count_answers: 0,
            rank: 0,
            user_icon_image: IMG_PATH+'/lightblub.png',//this.collection.nextOrder(),
            created_on: new Date().getTime(),
            modified_on: new Date().getTime(),
            isSynced: 1,
            isCreatedOnServer:0
        },
        clear: function() {
            this.destroy();
        },
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
            return json;
        }
    });

    A.model.Questions = Backbone.PaginatedCollection.extend({
        urlRoot: QUEST_URL,
        model: A.model.Question,
        comparator : function(model) {
            return model.get('-rank');
        },
        localStorage: new Backbone.LocalStorage("Questions-backbone"),
        initialize: function(){
//            _.bindAll(this, "gAdd");
//            this.bind("add", this.gAdd);
            this.initializePaginatedCollection();
//            this.syncOn();
        },
        defaultComparator: function(item) {
//            console.log('default called')
            return (-1*item.get("rank"));
        },
        newestComparator: function(item) {
            return (-1*item.get("modified_on"));
        },
        oldestComparator: function(item) {
            return item.get("modified_on");
        }
//        gAdd: function(model){
//            app.vent.trigger("questions_add", model);
//        },
//        getOrFetch: function(id, options){
//            // Helper function to use this collection as a cache for models on the server
//            var model = this.get(id);
//            if(model){
//                options.success && options.success(model);
//                return;
//            }
//            model = new A.model.Question({
//                id: id
//            });
//            model.fetch(options);
//        }
    });
})()