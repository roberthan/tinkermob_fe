var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
A.view.ideasNavi = A.view.ideasNavi || {};

A.view.ideasNavi.Layout = Backbone.Marionette.Layout.extend({
    template: "#ideas_navi_layout_template",
//    className:'main_toggle_target',
    regions: {
        ideas: "#ideas"
    },
    events:{
        'change .idea_sort': 'sortIdeas'
    },
    sortIdeas: function(e){
        if(typeof this.ideas.currentView !== 'undefined'){
            this.ideas.currentView.$el.trigger('sort_collection', this.$el.find('.idea_sort :selected').val());
        }
    }
});

A.view.ideasNavi.IdeaView = Backbone.Marionette.ItemView.extend({//Backbone.dragAndDrop.extend({
    tagName: 'li',
    className: 'idea_tile',
    template: '#idea_tile_template',
    events: {
        'click .link': 'navigate',
        'click .link_tag': 'navigateTag',
        'click .idea_tile_details_owner': 'navigateUser',
        'click .idea_tile_details_profile': 'navigateUser'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
    },
    onRender: function(){
        if(this.model.has("original_image")=== false){
            this.$el.addClass('no_image');
        }
    },
    navigate: function(e){
        app.vent.trigger('navigate:ideaProfile', this.model);
        e.preventDefault();
    },
    navigateUser: function(e){
        app.vent.trigger('navigate:userProfile', this.model.get('username'));
        e.preventDefault();
    },
    navigateTag: function(e){
        var temp = $(e.target).text().split('#');
        if(temp.length> 1){
            app.vent.trigger('navigate:tag', temp[1]);
        }
        e.preventDefault();
        e.stopPropagation();
    }
});

A.view.ideasNavi.IdeasView =  Backbone.Marionette.PaginatedCollectionView.extend({
    tagName: 'ul',
    className: 'idea_tiles infinite_grid',
    itemView : A.view.ideasNavi.IdeaView,
    initialize: function(){
        this.initializePaginated();
        this.collection.bind('change', this.render, this);
    },
    events: {
        'sort_collection':'sortCollection'
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
    onDomRefresh: function(){
    }
});
