var A = A || {};
A.view = A.view || {};
A.model = A.model || {};

$(function(){
    A.model.ideas = new A.model.Ideas();
//    Backbone.Tastypie.apiKey = {
//        username: username,
//        key: api_key
//    }
    A.controller = new A.Controller();
    A.router = new A.Router({
        controller: A.controller,
        ideas: A.model.ideas
    });

    A.view.list = new A.view.ListApp({
        el: $("#app"),
        collection: A.model.ideas
    });
    A.view.idea = new A.view.idea_profile.DetailApp({
        el: $("#app")
    });
    vent.on("render:idea_profile", A.controller.showIdeaProfileManager);
    A.router.bind('route:list', function(){
        this.controller.showIdeasNavi();
    });
    A.router.bind('route:idea', function(idea){
        A.controller.showIdeaProfile(idea);
    });
    A.view.list.bind('navigate', A.router.navigate_to, A.router);
    A.view.idea.bind('home', A.router.navigate_home, A.router);
//    A.timer = new Backbone.syncTimer();
    Backbone.history.start({
        pushState: true
        //silent: A.model.loaded
    });
});
//(function( undefined ){
    A.Router = Backbone.Router.extend({
        routes: {
            '': 'list',
            'idea/:idea': 'idea'
        },
        initialize: function(options){
            this.controller = options.controller;
            this.ideas = options.ideas;
            vent.bind('idea_navigate_to',this.navigate_to, this )
        },
        navigate_home: function(model){
            this.controller.showIdeasNavi();
            this.navigate(''); //, {trigger: true}
        },
        navigate_to: function(model){
            var path = (('idea/' + model) && ('idea/' + model.get('id'))) || '';
            this.controller.showIdeaProfile(model);
            this.navigate(path); //, {trigger: true}
        },
        idea: function(id){
//            var local_events = _.extend({}, Backbone.Events);
//            var model = this.ideas.getOrFetch( id , {//A.model.questions.urlRoot
//                success: function(model){
//                    A.model.ideas.add(model, {silent: true});
//                    A.view.idea.model = model;
//                    console.log(JSON.stringify(model));
//                    A.view.idea.render();
//                }
//            });
//            vent.on("render:idea_profile", this.controller.showIdeaProfileManager);
        },
        list: function(){ //go ideas lists
        }
    });
//    Backbone.Controller= Backbone.Controller || {};
    A.Controller = A.Controller || function(){};
    A.Controller.prototype = {
        showIdeaProfile: function(idea){
            var self = this;
//            var local_events = _.extend({}, Backbone.Events);
            A.model.ideas.getOrFetch( idea , {//A.model.questions.urlRoot
                success: function(model){
//                    console.log(model.collection)
//                    A.model.ideas.add(model, {silent: true});
                    if(_.isUndefined(model.collection)){
                        A.model.ideas.add(model,{silent: true});
                    }
                    console.log(JSON.stringify(model));
                    A.view.idea.model = model;
                    // app.router.bind('route:detail', function(id){
                    // app.answers.getOrFetch(app.answers.urlRoot + id + '/', {
                    // success: function(model){
                    vent.off("render:idea_profile");
                    vent.on("render:idea_profile", self.showIdeaProfileManager);
                    A.view.idea.render();
                }
            });
        },
        showIdeaProfileManager: function(view){
            var snap_list = new A.view.idea_profile.SnapListView({
                collection: view.model.get('snapshots'),
                el: view.$('#snapshots')
            });
            snap_list.addAll_();
            var supporter_list = new A.view.idea_profile.UserListView({
                collection: view.model.get('supporters')
                ,el: view.$('#supporters')
            });
            supporter_list.addAll_();
            var userDetail = new A.view.idea_profile.UserDetailView({
                model: view.model.get('user'),
                el: view.$('#user')
            });
            userDetail.render();
            var snap_input_view = new A.view.idea_profile.SnapInputView({
                model: view.model,
                collection: view.model.get('snapshots'),
                el: view.$('#snapInput')
            });
            vent.off("render:idea_profile");
        },
        showIdeasNavi: function(){
            A.model.ideas.maybeFetch({
                success: _.bind(A.view.list.render, A.view.list)
            });
        }
    };
//})()