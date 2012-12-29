var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
(function( undefined ){

    A.model.supportFollowing  = Backbone.SupportModel.extend({
        urlRoot: SUPPORT_FOLLOWING_URL,
        initialize: function(){
        },
        defaults: {
            created_on: new Date().getTime()
            ,img_tile_src:'/img/lightblub.jpg'
        },
        clear: function() {
            this.destroy();
        }
    });
    A.model.supportFollowings = Backbone.PaginatedCollection.extend({
        urlRoot: SUPPORT_FOLLOWING_URL,
        model: A.model.supportFollowing,
        localStorage: new Backbone.LocalStorage("supportUsers-backbone"),
        initialize: function(){
//            _.bindAll(this, "gAdd");
            this.bind("add", this.gAdd);
            this.initializePaginatedCollection();
//            this.syncOn();
        }
//        ,
//        gAdd: function(model){
//            app.vent.trigger("support_user_add", model);
//        }
    });

    A.model.supportFollower  = Backbone.SupportModel.extend({
        urlRoot: SUPPORT_FOLLOWER_URL,
        initialize: function(){
        },
        defaults: {
            created_on: new Date().getTime()
            ,img_tile_src:'/img/lightblub.jpg'
        },
        clear: function() {
            this.destroy();
        }
    });

    A.model.supportFollowers = Backbone.PaginatedCollection.extend({
        urlRoot: SUPPORT_FOLLOWER_URL,
        model: A.model.supportFollower,
        localStorage: new Backbone.LocalStorage("supportFollowers-backbone"),
        initialize: function(){
            this.initializePaginatedCollection();
        }
    });

    A.model.supportIdea  = Backbone.SupportModel.extend({
        urlRoot: SUPPORT_IDEA_URL,
        initialize: function(){
        },
        defaults: {
            created_on: new Date().getTime(),
            isCreatedOnServer:0
        },
        clear: function() {
            this.destroy();
        }
    });
    A.model.supportIdeas = Backbone.TastypieCollection.extend({
        urlRoot: SUPPORT_IDEA_URL,
        model: A.model.supportIdea,
        localStorage: new Backbone.LocalStorage("supportIdeas-backbone"),
        initialize: function(){
        }
//        ,
//        getOrFetch: function(id, options){
//            // Helper function to use this collection as a cache for models on the server
//            var model = this.get(id);
//            if(model){
//                options.success && options.success(model);
//                return;
//            }
//            model = new A.model.Idea({
//                id: id
//            });
//            model.fetch(options);
//        }
    });
    A.model.supportQuestion  = Backbone.SupportModel.extend({
        urlRoot: SUPPORT_QUESTION_URL,
        initialize: function(){
        },
        defaults: {
            created_on: new Date().getTime(),
            isCreatedOnServer:0
        },
        clear: function() {
            this.destroy();
        }
    });
    A.model.supportQuestions = Backbone.TastypieCollection.extend({
        urlRoot: SUPPORT_QUESTION_URL,
        model: A.model.supportQuestion,
        localStorage: new Backbone.LocalStorage("supportQuestions-backbone"),
        initialize: function(){
        }
//        ,
//        getOrFetch: function(id, options){
//            // Helper function to use this collection as a cache for models on the server
//            var model = this.get(id);
//            if(model){
//                options.success && options.success(model);
//                return;
//            }
//            model = new A.model.Idea({
//                id: id
//            });
//            model.fetch(options);
//        }
    });
    A.model.supportAnswer  = Backbone.SupportModel.extend({
        urlRoot: SUPPORT_ANSWER_URL,
        initialize: function(){
        },
        defaults: {
            created_on: new Date().getTime(),
            isCreatedOnServer:0
        },
        clear: function() {
            this.destroy();
        }
    });
    A.model.supportAnswers = Backbone.TastypieCollection.extend({
        urlRoot: SUPPORT_ANSWER_URL,
        model: A.model.supportAnswer,
        localStorage: new Backbone.LocalStorage("supportAnswers-backbone"),
        initialize: function(){
        }
//        ,
//        getOrFetch: function(id, options){
//            // Helper function to use this collection as a cache for models on the server
//            var model = this.get(id);
//            if(model){
//                options.success && options.success(model);
//                return;
//            }
//            model = new A.model.Idea({
//                id: id
//            });
//            model.fetch(options);
//        }
    });
})();