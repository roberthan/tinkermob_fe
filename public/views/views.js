var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
A.view.menu = A.view.menu || {};
//function gup( name ){
//    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
//    var regexS = "[\\?&]"+name+"=([^&#]*)";
//    var regex = new RegExp( regexS );
//    var results = regex.exec( window.location.href );
//    if( results == null )    return "";
//    else    return results[1];}

A.view.App = Backbone.Marionette.Layout.extend({
    tagName: 'div',
    id:'body_container',
    template: "#main_app_template",
    regions: {
        menu: '#menu',
        browse: "#browse",
        my_ideas: "#my_ideas",
        modal_box: "#modal_box"
    }
});

A.view.MenuWeb = Backbone.Marionette.Layout.extend({
    template: "#menu_web_template",
    regions: {
        selfProfile: '#selfprofile_user_name'
    },
    events: {
        'click .navi_left': 'navigateHome',
        'click .btn_next': 'navigateNext',
        'click .btn_prev': 'navigatePrev',
        'click .btn_about': 'navigateAbout',
        'click .btn_login': 'navigateLogin',
        'click .btn_logout': 'navigateLogout',
        'click .btn_join': 'navigateJoin',
        'click .btn_settings': 'navigateSettings',
        'click .btn_my_ideas': 'navigateMyIdeas',
//        'click a.about_link': 'navigateAbout',
        'click .toggle': 'navigateMain',
        'click .my_ideas': 'navigateMyIdeas',
        'click .browse': 'navigateBrowse'
    },
    initialize: function(){
        this.bind('post:render', this.postRender);
        app.vent.bind('toggle:section', this.toggleSwitch);
    },
    postRender: function(){
        var self = this;
        var main = $('#my_ideas, #browse')
        $('.navi_middle_toggle .button').draggable({
            containment: "parent",
            axis: "x",
            start: function(event, ui) {
                $(this).removeClass('toggle_animate toggle_animate_rev');
                main.removeClass('main_toggle main_toggle_rev');
            },
            drag: function( event, ui ) {
                if(ui.position.left!==this.prev_left){
                    this.prev_left = ui.position.left;
                    main.css('margin-left','-'+((ui.position.left/36)*100)+'%');
                }
            },
            stop: function( event, ui ) {
                if(ui.position.left>18){
                    $(this).addClass('toggle_on').removeClass('toggle_off');
                    main.addClass('main_toggle_rev').removeClass('main_toggle');
//                    main.addClass('main_toggle_my_ideas').removeClass('main_toggle_browse');
                    app.vent.trigger('navigate:my_ideas');
                }
                else{
                    $(this).addClass('toggle_off').removeClass('toggle_on');
                    main.addClass('main_toggle').removeClass('main_toggle_rev');
//                    main.addClass('main_toggle_browse').removeClass('main_toggle_my_ideas');
                    app.vent.trigger('navigate:browse');
                }
                $(this).css('left','');
                main.css('margin-left','');
            }
        });
    },
    onRender: function(){
    },
    navigateHome: function(e){
        app.vent.trigger('navigate:home');
        e.preventDefault();
    },
    navigateNext: function(e){
        app.vent.trigger('navigate:Next');
        e.preventDefault();
    },
    navigatePrev: function(e){
        app.vent.trigger('navigate:Prev');
        e.preventDefault();
    },
    navigateAbout: function(e){
        app.vent.trigger('navigate:about');
        e.preventDefault();
    },
    navigateLogin: function(e){
        app.vent.trigger('navigate:login');
        e.preventDefault();
//        e.stopPropagation();
    },
    navigateLogout: function(e){
        app.vent.trigger('navigate:logout');
        e.preventDefault();
    },
    navigateJoin: function(e){
        app.vent.trigger('navigate:join');
        e.preventDefault();
//        e.stopPropagation();
    },
//    navigateMyIdeas: function(e){
//        app.vent.trigger('navigate:my_ideas',{reset:true});
//        e.preventDefault();
////        e.stopPropagation();
//    },
    navigateSettings: function(e){
        app.vent.trigger('navigate:settings');
        e.preventDefault();
//        e.stopPropagation();
    },
    navigateMain: function(e){
        app.STATE = app.STATE || 'browse';
        this.toggleSwitch();
        if(app.STATE === 'browse'){
            app.vent.trigger('navigate:my_ideas',{reset:true});
        }
        else{
            app.vent.trigger('navigate:browse',{reset:true});
        }
        e.preventDefault();
    },
    toggleSwitch: function(){
        var toggle = $('.navi_middle_toggle .button');
        if(app.STATE === 'browse' || typeof app.STATE === 'undefined'){
            if(toggle.hasClass('toggle_animate')||toggle.hasClass('toggle_on')){
            }else{
                toggle.removeClass('toggle_animate_rev').addClass('toggle_animate');
                toggle.removeClass('toggle_on').removeClass('toggle_off')
            }
        }
        else{
            if(toggle.hasClass('toggle_animate_rev')||toggle.hasClass('toggle_off')){
            }
            else{
                toggle.removeClass('toggle_animate').addClass('toggle_animate_rev');
                toggle.removeClass('toggle_on').removeClass('toggle_off');
            }
        }

    },
    navigateMyIdeas: function(e){
        app.STATE = app.STATE || 'browse';
        if(app.STATE !== 'my_ideas'){
            this.toggleSwitch();
        }
        app.vent.trigger('navigate:my_ideas',{reset:true});
        e.preventDefault();
    },
    navigateBrowse: function(e){
        app.STATE = app.STATE || 'browse';
        if(app.STATE !== 'browse'){
            this.toggleSwitch();
        }
        app.vent.trigger('navigate:browse',{reset:true});
        e.preventDefault();
    }
});

A.view.menu.SelfProfile = Backbone.Marionette.ItemView.extend({//Backbone.dragAndDrop.extend({
//    tagName: 'li',
    className: 'wrapper',
    template: '#menu_self_profile_template',
//    attributes:{'data-x_scale':"1",'data-y_scale':"1"},//,el: this.model.get('id'),
    events: {
//        'click .permalink': 'navigate'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
    }
//    ,
//    navigate: function(e){
//        app.vent.trigger('navigate:ideaProfile', this.model);
//        e.preventDefault();
//    }
});

Backbone.Marionette.PaginatedCollectionView =  Backbone.Marionette.CollectionView.extend({
    initializePaginated: function(){
        var self= this;
        this.on("render", function(){
            A.view.helper.unbindNextPrev();
            app.vent.bind('navigate:Next',this.nextPage, self);
            app.vent.bind('navigate:Prev',this.prevPage, self);
            if(this.collection.hasPrevious()){
                $('.btn_prev').show();
            }
            if(this.collection.hasNext()){
                $('.btn_next').show();
            }
        });
        $('.btn_next').show();
        this.on("collection:before:close", function(){
            A.view.helper.unbindNextPrev();
        });
        this.initial_page = true;
        this.is_previous = false;
        this.on("after:item:added", function(viewInstance){
            if(this.collection.hasPrevious()){
                $('.btn_prev').show();
            }
            if(this.collection.hasNext()){
                $('.btn_next').show();
            }
//            var to_be_removed = this.collection.length-16;
//            if(to_be_removed>0){
//                if(this.is_previous){
//                    this.collection.remove(this.collection.last(1));
//                }
//                else{
//                    this.collection.remove(this.collection.first(1));
//                }
//                console.log('removed');
//                console.log(this.collection.length);
//            }
        });
    },
    clearOld: function(is_previous){
        var to_be_removed = this.collection.length-8;
//        console.log(to_be_removed)
        if(to_be_removed>0){
            if(is_previous){
                this.collection.remove(this.collection.last(to_be_removed));
            }
            else{
                this.collection.remove(this.collection.first(to_be_removed));
            }
        }
//        console.log(this.collection.length)
//        if(this.masonry_enabled){
//            $('#snap_list').masonry('reload');
//        }
    },
    nextPage: function(){
        if(this.collection.hasNext()){
            this.clearOld(false);
            if(this.is_previous){
                this.collection.nextPage(8);
                $('.btn_prev').show();
            }
            else{
                this.collection.nextPage();
            }
        }
        if(this.collection.hasPrevious()){
            $('.btn_prev').show();
        }
        $('.btn_next').hide();
        this.is_previous = false;
    },
    prevPage: function(){
        if(this.collection.hasPrevious()){
            this.clearOld(true);
            if(this.is_previous){
                this.collection.previousPage();
            }
            else{
                this.collection.previousPage(16);
                $('.btn_next').show();
            }
        }
        if(this.collection.hasNext()){
            $('.btn_next').show();
        }
        $('.btn_prev').hide();
        this.is_previous = true;
    },
    appendHtml: function(collectionView, itemView, index){
        if(index <= 0){
            collectionView.$el.prepend(itemView.el);
        }
        else if(typeof index !== "undefined" && collectionView.$el.find("li").length>1){
            collectionView.$el.find("li:nth-child("+index+")").after(itemView.el);
        }
        else{
            collectionView.$el.append(itemView.el);
        }
    }
//    addChildView: function(item, collection, options){
//        this.closeEmptyView();
//        var ItemView = this.getItemView(item);
//
//        var index;
//        if(options && options.index ){
//            index = options.index;
//            if(typeof options.append_to_front !== 'undefined'){
//                index = 0;
//            }
//        } else {
//            index = 0;
//        }
//        console.log(options)
//        return this.addItemView(item, ItemView, index);
//    }
});
