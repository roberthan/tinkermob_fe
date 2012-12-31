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
    tagName: 'div',
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

A.view.ideasNavi.IdeasView =  Backbone.Marionette.CollectionView.extend({
    className: 'idea_tiles infinite_grid',
    itemView : A.view.ideasNavi.IdeaView,
    initialize: function(){
        this.collection.bind('change', this.render,this);
        app.vent.bind('navigate:Next',this.nextPage, this);
        $('.btn_next').show();
//        this.backCacheCollection=new A.model.BackCacheIdeas();
//        this.forwardCacheCollection=new A.model.ForwardCacheIdeas();
    },
    events: {
        'sort_collection':'sortCollection'
    },
    sortCollection: function(e,field_name){
        this.collection.sort_by(field_name);
        switch(field_name){
            case "-modified_on":
                this.collection.comparator = this.collection.newestComparator;
                this.collection.reset();
                this.collection.sort();
                break;
            case "modified_on":
                this.collection.comparator = this.collection.oldestComparator;
                this.collection.reset();
                this.collection.sort();
                break;
            default:
                delete this.collection.comparator;
                this.collection.reset();
                this.collection.fetch();
                this.render();
                break;
        }
    },
    onRender: function(){
        var self = this;
        self.tiles_per_row=2;

    },
    nextPage: function(){
        if(this.collection.nextPage()===false){
//            app.vent.unbind('page:onBottom');
            $('.btn_next').hide();
        }
        else{

        }
    },
    onClose: function(){
        A.view.helper.unbindNextPrev();
    }
//    ,
//    cleanUp: function(){
//        var self = this;
//        self.tiles_per_row=(Math.floor( $('#ideas').outerWidth()/$('.idea_tile').outerWidth()));
//        self.tiles_height=($('.idea_tile').outerHeight());
//        var col =self.collection;
//        if(col.length>=(12*self.tiles_per_row) && self.scroll_down === true){
//            self.scroll_down = false;
//            var removed;
//            var diff =col.length-(12*self.tiles_per_row);
//            for(var i = 0, j = diff; i < j; i += 1){
//                removed=col.shift();
//                self.backCacheCollection.push(JSON.stringify(removed));
//            }
//            $("#ideas_pre_buffer").height(self.backCacheCollection/self.tiles_per_row*self.tiles_height);
//        }
//        $('#temp_stats').text(self.backCacheCollection.length+':'+col.length);
//    }
});
