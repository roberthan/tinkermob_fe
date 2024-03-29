var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
A.view.userProfile = A.view.userProfile || {};

A.view.userProfile.Layout = Backbone.Marionette.Layout.extend({
    template: "#user_profile_template",
    id:'user_profile_view',
    regions: {
        ideas: "#user_ideas"
//        ,support_ideas: "#support_ideas"
    },
    events: {
        'click .following_count': 'showFollowing',
        'click .follower_count': 'showFollower',
        'click .support_ideas_count': 'showSupportIdeas',
        'click .ideas_count': 'showIdeas',
        'click .btn_add_idea': 'addIdea',
        'change .idea_sort': 'sortIdeas',
        'click .user_profile_pg_btn_follow': 'follow',
        'click .user_profile_pg_btn_follow_pressed': 'unFollow',
        'click .btn_back': 'historyBack'
    },
    initialize: function(options){
        if(typeof options.ideas_col !== 'undefined'){
            this.ideas_col = options.ideas_col;
        }
        else{
            this.ideas_col = new A.model.Ideas();
            this.ideas_col.filtrate({
                filter:{
                    user:this.model.id
                },
                success: function(ideas,res){
                }
            });
        }
        this.support_ideas_col = new A.model.Ideas();
        this.support_ideas_col.filtrate({
            filter:{
                support:this.model.id
            },
            success: function(ideas,res){
            }
        });
        var following = new A.model.supportFollowings();
        following.filtrate({
            filter:{
                supporter:this.model.id
            },
            success: function(ideas,res){
            }
        });
        this.model.set('following',following);
        var follower = new A.model.supportFollowers();
        follower.filtrate({
            filter:{
                user:this.model.id
            },
            success: function(ideas,res){
            }
        });
        //TODO make saves consistent
        this.model.set('follower',follower);
        this.$el.find('.ideas_count').addClass('btn_pressed');
        this.model.bind('change', this.render, this);
        var self = this;
//        $(window).bind('scroll', function(){
//            var y_scroll_pos = $(window).scrollTop();//window.pageYOffset;
//            var scroll_pos_test = 190;             // set to whatever you want it to be
//            if(y_scroll_pos > scroll_pos_test) {
//                self.setFixed();
//                console.log('s')
//            }
//            else if(y_scroll_pos <= scroll_pos_test) {
//                self.unSetFixed();
//            }
//        });
    },
    historyBack: function(){
        history.back();
    },
    follow: function(){
        this.$el.find('.user_profile_pg_btn_follow').removeClass('user_profile_pg_btn_follow').addClass('user_profile_pg_btn_follow_pressed');
        A.view.helper.setFollow(1,this.model).save();
    },
    unFollow: function(){
        this.$el.find('.user_profile_pg_btn_follow_pressed').removeClass('user_profile_pg_btn_follow_pressed').addClass('user_profile_pg_btn_follow');
        A.view.helper.setFollow(0,this.model).save();
    },
    showFollowing: function(e){
        app.vent.trigger('navigate:following', this.model.get('following'));
    },
    showFollower: function(e){
        app.vent.trigger('navigate:follower', this.model.get('follower'));
    },
    showSupportIdeas: function(){
        this.$el.find('.ideas_count').removeClass('btn_pressed');
        this.$el.find('.support_ideas_count').addClass('btn_pressed');
        var list_view = new A.view.ideasNavi.IdeasView({
            collection: this.support_ideas_col
        });
        this.ideas.show(list_view);
    },
    showIdeas: function(){
        this.$el.find('.support_ideas_count').removeClass('btn_pressed');
        this.$el.find('.ideas_count').addClass('btn_pressed');
        this.ideas_col.user = parseInt(this.model.id);
        var list_view = new A.view.userProfile.ListView({
            collection: this.ideas_col
        });
        this.ideas.show(list_view);
//        if(USER === parseInt(this.model.id)){
//            list_view.showAddItemView();
//        }
    },
    sortIdeas: function(e){
        if(typeof this.ideas.currentView !== 'undefined'){
            this.ideas.currentView.$el.trigger('sort_collection', this.$el.find('.idea_sort :selected').val());
        }
    },
    addIdea: function(e){
        if(typeof this.ideas.currentView !== 'undefined'){
            this.ideas.currentView.$el.trigger('add_idea');
        }
    }
    ,onRender: function(){
        this.showIdeas();
//        app.vent.off('page:set_fixed');
//        app.vent.off('page:unset_fixed');
        app.vent.on('page:set_fixed',this.setFixed, this);
        app.vent.on('page:unset_fixed',this.unSetFixed, this);
    },
    onClose: function(){
        app.vent.off('page:set_fixed', null, this);
        app.vent.off('page:unset_fixed', null, this);
    },
    setFixed: function(){
        if(!this.$el.find('.user_profile_stats_container').hasClass('fixed')){
            this.$el.find('.user_profile_main_container').addClass('fixed');
            this.$el.find('.user_profile_stats_container').addClass('fixed');
        }
    },
    unSetFixed: function(){
        if(this.$el.find('.user_profile_stats_container').hasClass('fixed')){
            this.$el.find('.user_profile_main_container').removeClass('fixed');
            this.$el.find('.user_profile_stats_container').removeClass('fixed');
        }
    }
});

A.view.userProfile.IdeaView = Backbone.Marionette.ItemView.extend({//Backbone.dragAndDrop.extend({
    tagName: 'li',
    className: 'my_idea_tile',
    template: '#my_idea_tile_template',
//    attributes:{'data-x_scale':"1",'data-y_scale':"1"},//,el: this.model.get('id'),
    events: {
        'click .link': 'navigate'
        ,'click .link_tag': 'navigateTag'
//        ,'click .support': 'support'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
    }
    ,onRender: function(){
//        this.model.collection.sort();
        if(this.model.has("original_image")=== false){
            this.$el.addClass('no_image');
        }
    },
    navigateTag: function(e){
        var temp = $(e.target).text().split('#');
        if(temp.length> 1){
            app.vent.trigger('navigate:tag', temp[1]);
        }
        e.preventDefault();
        e.stopPropagation();
    },
    navigate: function(e){
        app.vent.trigger('navigate:ideaProfile', this.model);
        e.preventDefault();
    }
});

A.view.userProfile.addIdeaView = Backbone.Marionette.ItemView.extend({
    template: '#add_idea_template',
    tagName: 'li',
    id: 'add_idea',
    className: 'my_idea_tile',
    events: {
        'click .link': 'newIdea'
    },
    initialize: function(options){
//        this.model.bind('change', this.render, this);
    }
    ,
    newIdea: function(){
        app.vent.trigger('navigate:newIdea');
    }
});

A.view.userProfile.ListView =  Backbone.Marionette.PaginatedCollectionView.extend({
    tagName: 'ul',
    itemView : A.view.userProfile.IdeaView,
    addNewItemView: A.view.userProfile.addIdeaView,
    className: 'idea_tiles infinite_grid',
    events: {
        'sort_collection':'sortCollection',
        'add_idea':'addIdea'
    },
    initialize: function(){
//        this.collection.bind('change', this.render,this);
        this.initializePaginated();
    },
    sortCollection: function(e,field_name){
        this.collection.sort_by(field_name);
        switch(field_name){
            case "-modified_on":
                this.collection.comparator = this.collection.newestComparator;
                this.collection.reset({silent:true});
                this.collection.sort({silent:true});
                break;
            case "modified_on":
                this.collection.comparator = this.collection.oldestComparator;
                this.collection.reset({silent:true});
                this.collection.sort({silent:true});
                break;
            default:
//                delete this.collection.comparator;
                this.collection.comparator = this.collection.defaultComparator;
                this.collection.reset({silent:true});
                this.collection.fetch({silent:true});
//                this.render();
                break;
        }
    },
    showAddItemView: function(){
        var model = new Backbone.Model();
        model.set('created_on',new Date());
        model.set('ordering',-1);
        model.set('img_tile_src','/img/new_idea.png');
        this.addItemView(model, this.addNewItemView, -1);
    },
    addIdea: function(){
        app.vent.trigger('navigate:newIdea');
    },
    onRender: function(){
        if(USER === this.collection.user){
            this.showAddItemView();
        }
    },
    onClose: function(){
        console.log('off:sub_navigate:newIdea');
        app.vent.unbind('sub_navigate:newIdea');
    }
//    ,
//    appendHtml: function(collectionView, itemView, index){
//        if(index < 0){
//            collectionView.$el.prepend(itemView.el);
//        }
//        else{
//            collectionView.$el.append(itemView.el);
//        }
//    }
});
