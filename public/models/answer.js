var A = A || {};
A.model = A.model || {};
A.view = A.view || {};

(  function( undefined ){

    A.model.Answer  = Backbone.Model.extend({
        urlRoot: ANS_URL,
        initialize: function(){
            //    this.setUri();
            if(!this.has('id')){
                this.set('id', A.view.helper.guid());
            }
        },
        defaults: {
            user: "",
            is_owner: 0,
            text: "empty text...",
            rank: 0,
            user_icon_image: IMG_PATH+'/lightblub.png',//this.collection.nextOrder(),
            created_on: new Date().getTime(),
            modified_on: new Date().getTime(),
            isSynced: 1,
            isCreatedOnServer:0
        },
        clear: function() {
            this.destroy();
        }
    });

    A.model.Answers = Backbone.PaginatedCollection.extend({
        urlRoot: ANS_URL,
        model: A.model.Answer,
        comparator : function(model) {
            return (-1*item.get("rank"));
        },
        localStorage: new Backbone.LocalStorage("Answers-backbone"),
        initialize: function(){
//            _.bindAll(this, "gAdd");
//            this.bind("add", this.gAdd);
            this.initializePaginatedCollection();
//            this.syncOn();
        }
//        ,
//        gAdd: function(model){
//            app.vent.trigger("answers_add", model);
//        },
//        getOrFetch: function(id, options){
//  //          Helper function to use this collection as a cache for models on the server
//            var model = this.get(id);
//            if(model){
//                options.success && options.success(model);
//                return;
//            }
//            model = new A.model.Answer({
//                id: id
//            });
//            model.fetch(options);
//        }
    });
})()