var A = A || {};
A.view = A.view || {};
A.model = A.model || {};
app = new Backbone.Marionette.Application();
app.container = new Backbone.Marionette.Region({
    el: "#body"
});
app.addInitializer(function(){
    //setup fb
    FB.init({appId: "375972762439949", status: true, cookie: true});
    app.vent.bind('social:fbPost', app.control_helper.postToFB);

    app.mainApp = new A.view.App();
    app.container.show(app.mainApp);
    //render menu
    var menu_web = new A.view.MenuWeb();
    app.mainApp.menu.show(menu_web);
    menu_web.trigger('post:render');
    //models
    app.ideas_col = new A.model.Ideas();
        app.ideas_col.fetch({
            success: function(ideas,res){
            }
        });
    app.users = new A.model.Users();
    //build profile map for logged in user
    if(USER){
        app.follows_col = new A.model.supportFollowings();
        app.supportIdeasCol = new A.model.supportIdeas();
        app.supportQuestionsCol = new A.model.supportQuestions();
        app.supportAnswersCol = new A.model.supportAnswers();
        app.tinker=app.tinker || {};
        app.tinker.owners_col = new A.model.Users();
        app.tinker.owner = new A.model.User();
        app.tinker.owner.set('id', USER);
        app.tinker.owner.set('username', USERNAME);
        app.tinker.owners_col.add(app.tinker.owner,{silent: true});
        app.tinker.owner.fetch({
            success: function(obj){
            }
        });
        app.my_ideas_col = new A.model.Ideas();
        app.my_ideas_col.filtrate({
            filter:{
                user:USER
            },
            success: function(ideas,res){
            },
            useCache:true
        });
//        app.tinker.ideas = new A.model.Ideas();
//        app.tinker.ideas.filtrate({'user':app.tinker.owner.get('username')});
        var self_profile = new A.view.menu.SelfProfile({model:app.tinker.owner});
        menu_web.selfProfile.show(self_profile);
        app.vent.bind('navigate:my_ideas', app.controller.myIdeasNavi);
        app.vent.bind('navigate:logout', app.controller.logout);
        app.vent.bind('navigate:settings', app.controller.settings);
        app.vent.bind('navigate:newIdea', app.controller.newIdea);
        app.vent.bind('navigate:newSnapshot', app.controller.newSnapshot);
        Backbone.startSocket();
    }
    else{
        app.vent.bind('navigate:login', app.controller.login);
        app.vent.bind('navigate:join', app.controller.join);
        window.localStorage.clear()//clears local storage data
    }
    app.vent.bind('navigate:ideaProfile', app.controller.ideaProfile);
    app.vent.bind('navigate:userProfile', app.controller.userProfile);
    app.vent.bind('navigate:browse', app.controller.ideasNavi);
    app.vent.bind('navigate:tag', app.controller.tag);
    app.vent.bind('navigate:snapDetail', app.controller.snapDetail);
    app.vent.bind('navigate:about', app.controller.about);
    app.vent.bind('navigate:home', app.controller.home);
    app.vent.bind('navigate:following', app.controller.follow);
    app.vent.bind('navigate:follower', app.controller.follow);
    $('#body').infiniteScroll({
        threshold: 250,
        onEnd: function() {
//            console.log('No more results!');
        },
        onBottom: function(callback) {
            app.vent.trigger('page:onBottom');
            console.log('on bottom')
            callback(true);
        }
    });
//    A.timer = new Backbone.syncTimer();
});

app.control_helper = {
    viewToBrowse: function(view){
        if(app.STATE !=='browse'){
            if(typeof app.mainApp.my_ideas.currentView !== 'undefined'){
                app.mainApp.my_ideas.currentView.$el.hide();
                app.mainApp.my_ideas.url = window.location.pathname;
            }
            this.slideToBrowse();
            app.mainApp.browse.show(view);
//            app.mainApp.browse.currentView.$el.show();
            if(app.STATE === 'my_ideas'){
                app.vent.trigger('toggle:section',{view:'browse'});
            }
            app.STATE = 'browse';
        }
        else{
            this.slideToBrowse();
            app.mainApp.browse.show(view);
        }
    },
    viewToMyIdeas:function(view){
        if(app.STATE !=='my_ideas'){
            if(typeof app.mainApp.browse.currentView !== 'undefined'){
                app.mainApp.browse.url = window.location.pathname;
            }
            this.slideToMyIdeas();
            app.mainApp.my_ideas.show(view);
            app.vent.trigger('toggle:section',{view:'my_ideas'});
            app.STATE = 'my_ideas';
        }
        else{
//            debugger
            this.slideToMyIdeas();
            app.mainApp.my_ideas.show(view);

        }
    },
    slideToMyIdeas: function(){
        var main = $('#my_ideas, #browse');
        if(main.hasClass('main_toggle_rev')||main.hasClass('main_toggle_my_ideas')){
        }
        else{
            main.addClass('main_toggle_rev').removeClass('main_toggle animation_done main_toggle_my_ideas main_toggle_browse').one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function(e){
                $(this).addClass('animation_done');
            });
        }
    },
    slideToBrowse: function(){
        var main = $('#my_ideas, #browse');
        if(main.hasClass('main_toggle')||main.hasClass('main_toggle_browse')){
        }
        else{
            main.addClass('main_toggle').removeClass('main_toggle_rev animation_done main_toggle_my_ideas main_toggle_browse').one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd', function(e){
                $(this).addClass('animation_done');
            });
        }
    },
    postToFB: function(obj){
        function callback(response) {
            console.log(response['post_id']);
        }
        FB.ui(obj, callback);
    }
}

app.controller = {
    ideaProfile: function(idea){
        app.vent.unbind('page:onBottom');
        var i_col;
        if(typeof idea === 'string' ){
            if(app.STATE !== 'my_ideas'){
                i_col = app.ideas_col;
            }
            else{
                i_col = app.my_ideas_col;
            }
        }
        else{
            i_col=idea.collection;
        }
        var self = this;
        i_col.getOrFetch( idea , {//A.model.questions.urlRoot
            success: function(model){
                if(_.isUndefined(model.collection)){
                    i_col.add(model,{silent: true});
                }
                var ideaView = new A.view.ideaProfile.DetailApp({model:model});
                ideaView.on("item:before:render", function(){
                });
                ideaView.on("item:rendered", function(itemView){
                    var snapshots;
                    var self = this;
                    snapshots = new A.model.Snapshots();
                    snapshots.idea = model
                    var questions;
                    questions = new A.model.Questions();
                    questions.filtrate({filter:{'idea':this.model.id}});
                    this.model.set('snapshots',snapshots);
                    this.model.set('questions',questions);
                    var snapshotView = new A.view.ideaProfile.SnapListView({
                        collection: this.model.get('snapshots')
                    });
                    snapshots.filtrate({filter:{'idea':this.model.id},
                        success: function(snapshots,res){
//                            debugger;
//                            console.log(snapshots);
//                            if(snapshots.length>0){
                            if(snapshots.SYNC_STATE==="ready" && typeof self.snapshots != 'undefined' ){
                                self.snapshots.show(snapshotView);
                            }
                        }});
                    snapshotView.on("render", function(){
                        if(USER===model.get('user')){
                            this.showAddItemView({collection:this.collection, idea_id:model.id});
                        }
                    });
//                    console.log(this.model.get('snapshots'));
                    var questionView = new A.view.ideaProfile.QuestListView({
                        collection: this.model.get('questions')
                    });
                    questionView.on("render", function(){
                            this.showAddItemView(model);
                    });
                    this.questions.show(questionView);
                    //shows snapshots tab
                    this.showSnapshots();
                });
                //TODO check for ownership
                if(app.STATE !== 'my_ideas'){
                    app.control_helper.viewToBrowse(ideaView);
                }
                else{
//                    debugger
//                    app.mainApp.my_ideas.show(ideaView);
                    app.control_helper.viewToMyIdeas(ideaView);
                }
                var path = ('/idea/' + model.get('id')) || '';
                app.router.navigate(path);
            }
        });
    },
    userProfile: function(username){
        app.vent.unbind('page:onBottom');
        if(USERNAME===username){
            app.vent.trigger('navigate:my_ideas',{reset:true});
        }
        else{
            app.users.getOrFetch( username , {//A.model.questions.urlRoot
                success: function(model){
                    //to make websockets work
                    if(_.isUndefined(model.collection)){
                        app.users.add(model,{silent: true});
                    }
                    var userView = new A.view.userProfile.Layout({model:model});
//                    userView.on("item:closed", function(){
//                        userIdeas.reset();
//                    });
                    app.control_helper.viewToBrowse(userView);
                }
            });
        }
        var path = ('/user/' +username) || '';
        app.router.navigate(path);
    },
    ideasNavi: function(options){
        options = options || {};
        app.vent.unbind('page:onBottom');
        if(typeof app.mainApp.my_ideas.currentView !== 'undefined' && app.STATE === 'my_ideas'){
            app.mainApp.my_ideas.url = window.location.pathname;
            app.control_helper.slideToBrowse();
        }
        if(typeof app.mainApp.browse.currentView !== 'undefined' && app.STATE !== 'browse'){
            app.control_helper.slideToBrowse();
            if(typeof app.mainApp.browse.currentView.ideas !== 'undefined'){
                if(typeof app.mainApp.browse.currentView.ideas.currentView !== 'undefined'){
                    app.mainApp.browse.currentView.ideas.currentView.render();
                }
            }
        }
        else{
            if(app.STATE === 'browse' && options.reset===true){
                app.mainApp.browse.currentView.close();
            }
            else if(app.STATE === 'browse'){
                return;
            }
            var ideasView = new A.view.ideasNavi.Layout()
            var list =new A.view.ideasNavi.IdeasView({
                collection: app.ideas_col
            });
            ideasView.on("item:rendered", function(itemview){
            });
            app.mainApp.browse.show(ideasView);
            ideasView.ideas.show(list);
            app.mainApp.browse.url = '';
        }
        app.STATE = 'browse';
        var path = app.mainApp.browse.url || '';
        app.router.navigate(path);
    },
    tag: function(hashtag){
        app.vent.unbind('page:onBottom');
        var ideas = new A.model.Ideas();
        ideas.filtrate({
            filter:{
                hashtag: hashtag
            },
            success: function(ideas,res){
                if(typeof app.mainApp.browse.currentView !== 'undefined'){
                    app.mainApp.browse.currentView.close();
                }
                var ideasView = new A.view.ideasNavi.Layout()
                var list =new A.view.ideasNavi.IdeasView({
                    collection: ideas
                });
                app.control_helper.viewToBrowse(ideasView);
                ideasView.ideas.show(list);
                app.mainApp.browse.url = '/tag/'+hashtag;
                var path = app.mainApp.browse.url || '';
                app.router.navigate(path);
            }
        });
    },
    myIdeasNavi: function(options){
        options = options || {};
        app.vent.unbind('page:onBottom');
        if(!USER){
            app.vent.trigger('navigate:browse',{reset:true});
            return 0;
        }
        if(typeof app.mainApp.browse.currentView !== 'undefined' && app.STATE === 'browse'){
//            app.control_helper.unSetInfiniteScroll(app.mainApp.browse.currentView);
//            app.mainApp.browse.currentView.$el.hide('slow');
            app.mainApp.browse.url = window.location.pathname;
            app.control_helper.slideToMyIdeas();
        }
        if(typeof app.mainApp.my_ideas.currentView !== 'undefined'  && app.STATE !== 'my_ideas'){
//            app.mainApp.my_ideas.currentView.$el.show('slow');
            app.vent.trigger('toggle:section');
            if(typeof app.mainApp.my_ideas.currentView.ideas !== 'undefined'){
                if(typeof app.mainApp.my_ideas.currentView.ideas.currentView !== 'undefined'){
                    app.mainApp.my_ideas.currentView.ideas.currentView.render();
                }
            }
        }
        else{
            if(app.STATE === 'my_ideas' && options.reset===true){
                app.mainApp.my_ideas.currentView.close();
            }
            else if(app.STATE === 'my_ideas'){
                return 0;
            }
            var userView = new A.view.userProfile.Layout({
                model:app.tinker.owner,
                ideas_col:app.my_ideas_col
            });
            app.control_helper.viewToMyIdeas(userView);
            app.mainApp.my_ideas.url='/my-ideas'
        }
        app.STATE = 'my_ideas';
//        app.vent.trigger('toggle:section',{view:'my_ideas'});
        var path = app.mainApp.my_ideas.url || '/my-ideas';
        app.router.navigate(path);
    },
    snapDetail: function(snap){
        var layout = new A.view.static.snapDetail({model:snap});
        app.mainApp.modal_box.show(layout);
//        type = $(this).attr('data-type');
//        var path = '/about'+'?p='+window.location.pathname;
//        app.router.navigate(path);
    },
    newSnapshot: function(snapshot){
        var layout = new A.view.static.newSnapshot({model:snapshot});
        app.mainApp.modal_box.show(layout);
//        type = $(this).attr('data-type');
        var path = window.location.pathname+'/details'+'?p='+window.location.pathname;
        app.router.navigate(path);
    },
    newIdea: function(idea){
        var layout = new A.view.static.newIdea({model:idea});
        app.mainApp.modal_box.show(layout);
//        type = $(this).attr('data-type');
//        var path = '/about'+'?p='+window.location.pathname;
//        app.router.navigate(path);
    },
    about: function(){
        var layout = new A.view.static.Layout();
        app.mainApp.modal_box.show(layout);
//        type = $(this).attr('data-type');
        var path = '/about';
        if(window.location.pathname.indexOf(path)<0){
            path = '/about'+'?prev='+window.location.pathname;
        }
        app.router.navigate(path);
    },
    settings: function(){
        if(USER){
            var layout = new A.view.static.settingsView({model:app.tinker.owner});
            app.mainApp.modal_box.show(layout);
        }
        var path = '/settings';
        if(window.location.pathname.indexOf(path)<0){
            path = '/settings'+'?prev='+window.location.pathname;
        }
        if(typeof app.mainApp.my_ideas.currentView === 'undefined' && typeof app.mainApp.browse.currentView === 'undefined'){
            app.vent.trigger('navigate:browse');
        }
        app.router.navigate(path);
    },
    home: function(){
        if((!USER) || app.STATE === 'browse'){
            app.vent.trigger('navigate:browse',{reset:true});
        }
        else if(app.STATE==='my_ideas'){
            app.vent.trigger('navigate:my_ideas',{reset:true});
        }
    },
    login: function(){
        window.location ='/login';
    },
    logout: function(){
        window.location ='/logout';
    },
    join: function(){
        window.location ='/login#join';
    },
    follow: function(follows){
//        console.log(follows);
        var layout = new A.view.static.follow({follows_col:follows});
        app.mainApp.modal_box.show(layout);
//        type = $(this).attr('data-type');
        var path = '/about'+'?p='+window.location.pathname;
        app.router.navigate(path);
    }
};

$(document).ready(function(){
    var options = {
//        something: "some value",
    };
    app.router = new A.Router({controller: app.controller});
    app.start(options);

    Backbone.history.start({
        pushState: true
        //silent: A.model.loaded
    });
});