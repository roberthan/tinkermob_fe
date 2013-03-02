var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
A.view.ideaProfile = A.view.ideaProfile || {};

A.view.ideaProfile.DetailApp = Backbone.Marionette.Layout.extend({
    template: "#idea_profile_template",
    id: 'idea_profile_view',
    regions: {
        ideaDetails: "#idea_details",
        sharePanel: ".share_panel",
        snapshots: "#idea_profile_snapshots",
//        supporters: "#supporters",
        questions: "#idea_profile_questions"
    },
    initialize: function(options){
//        breaks the page
//        this.model.bind('change', this.render, this);
    },
    events:{
        'click .btn_snapshots': 'showSnapshots',
        'click .btn_questions': 'showQuestions',
        'click .btn_support': 'supportIdea',
        'click .btn_support_pressed': 'unSupportIdea',
        'click .btn_share': 'shareIdea',
        'click .btn_add_snapshot': 'addSnapshot',
        'click .btn_dnd_order': 'dndOrder',
        'change .snapshot_sort': 'sortSnapshots',
        'change .question_sort': 'sortQuestions',
        'click .btn_back': 'historyBack',
        'click .link_tag': 'navigateTag'
//        ,'click #toggle_edit_mode': 'editMode'
    },
    addSnapshot: function(e){
        if(typeof this.snapshots.currentView !== 'undefined'){
            this.snapshots.currentView.$el.trigger('add_snapshot');
        }
    },
    dndOrder: function(e){
        if(typeof this.snapshots.currentView !== 'undefined' && this.model.get('user')===USER){
            this.snapshots.currentView.$el.trigger('dnd_order');
        }
    },
    sortSnapshots: function(e){
        if(typeof this.snapshots.currentView !== 'undefined'){
            var field_name = this.$el.find('.snapshot_sort :selected').val();
            if(field_name!=='ordering'){
                this.$el.find(".btn_dnd_order").hide();
            }
            else{
                this.$el.find(".btn_dnd_order").show();
            }
            this.snapshots.currentView.$el.trigger('sort_collection',field_name);
        }
    },
    sortQuestions: function(e){
        if(typeof this.questions.currentView !== 'undefined'){
            this.questions.currentView.$el.trigger('sort_collection', this.$el.find('.question_sort :selected').val());
        }
    },
    historyBack: function(){
        history.back();
    },
    onRender:function(){
            var btn_support = this.model.get('is_supporter') || false;
            if(btn_support){
                this.$el.find('.btn_support').removeClass('btn_support').addClass('btn_support_pressed');
            }
        this.ideaDetails.show(new A.view.ideaProfile.ideaDetailsView({model:this.model}));
        A.view.helper.unbindScroll();
        var self = this;
//        $(window).bind('scroll', function(){
//            var y_scroll_pos = $(window).scrollTop();//window.pageYOffset;
//            var scroll_pos_test = 190;             // set to whatever you want it to be
//            if(y_scroll_pos > scroll_pos_test) {
//                self.setFixed();
//            }
//            else if(y_scroll_pos <= scroll_pos_test) {
//                self.unSetFixed();
//            }
//        });
//        app.vent.off('page:set_fixed');
//        app.vent.off('page:unset_fixed');
        app.vent.on('page:set_fixed',this.setFixed, this);
        app.vent.on('page:unset_fixed',this.unSetFixed, this);
    },
    navigateTag: function(e){
        var temp = $(e.target).text().split('#');
        if(temp.length> 1){
            app.vent.trigger('navigate:tag', temp[1]);
        }
        e.preventDefault();
    },
    setSupportIdea: function(is_active){
        if(typeof is_active === 'undefined'){
            is_active = 1;
        }
        var supportIdea = new A.model.supportIdea();
        supportIdea.set('idea', this.model.id);
        supportIdea.set('is_active', is_active);
        this.model.set('supportIdea',supportIdea,{silent: true});
        app.supportIdeasCol.add(supportIdea ,{silent: true});
        return supportIdea
    },
    supportIdea: function(){
        this.$el.find('.btn_support').removeClass('btn_support').addClass('btn_support_pressed');
        this.setSupportIdea().save()
    },
    shareIdea: function(){
        var shareView = new A.view.ideaProfile.sharePanel({
                model: this.model
        });
        this.sharePanel.show(shareView);
    },
    unSupportIdea: function(){
        this.$el.find('.btn_support_pressed').removeClass('btn_support_pressed').addClass('btn_support');
        this.setSupportIdea(0).save();
    },
    showSnapshots: function(){
        this.$el.find('.btn_questions').removeClass('btn_pressed').addClass('btn_tab');
        this.$el.find('.btn_snapshots').removeClass('btn_tab').addClass('btn_pressed');
        this.$el.removeClass('qa_view');
//        this.$el.find('.idea_profile_snapshots_settings_container').show();
//        this.$el.find('.idea_profile_questions_settings_container').hide();
        if(typeof this.questions.currentView !== 'undefined'){
            this.questions.currentView.$el.hide();
        }
        if(typeof this.snapshots.currentView !== 'undefined'){
            this.snapshots.currentView.$el.show();
            $('.btn_page_control').show();
        }
//        this.$el.find('#show_more_questions').hide();
    },
    showQuestions: function(){
//        this.$el.find('.idea_profile_snapshots_settings_container').hide();
//        this.$el.find('.idea_profile_questions_settings_container').show();
        this.$el.addClass('qa_view');
        this.$el.find('.btn_snapshots').removeClass('btn_pressed').addClass('btn_tab');
        this.$el.find('.btn_questions').removeClass('btn_tab').addClass('btn_pressed');
        if(typeof this.snapshots.currentView !== 'undefined'){
            this.snapshots.currentView.$el.hide();
        }
        if(typeof this.questions.currentView !== 'undefined'){
            this.questions.currentView.$el.show();
            $('.btn_page_control').hide();
        }
//        this.$el.find('#show_more_questions').show();
    },
    setFixed: function(){
        if(!this.$el.find('.idea_profile_btn_container').hasClass('fixed')){
            this.$el.find('.idea_profile_btn_container').addClass('fixed');
            this.$el.find('.idea_profile_main').addClass('fixed');
        }
    },
    unSetFixed: function(){
        if(this.$el.find('.idea_profile_btn_container').hasClass('fixed')){
            this.$el.find('.idea_profile_btn_container').removeClass('fixed');
            this.$el.find('.idea_profile_main').removeClass('fixed');
        }
    },
    onClose: function(){
        app.vent.off('page:set_fixed', null, this);
        app.vent.off('page:unset_fixed', null, this);
    }
});

A.view.ideaProfile.sharePanel = A.view.Modal_Layout.extend({
    template: "#share_panel_template",
    events:{
        'click .share_reddit': 'shareReddit',
        'click .share_fb': 'shareFb',
        'click .modal_foreground_container': 'stopCloseModal',
        'click .modal_background_container': 'closeModal'
    },
    initialize: function(){
        reddit_url = "http://www.reddit.com/buttons";
        reddit_title = "Buttons!";
        reddit_bgcolor = "FF3";
        reddit_bordercolor = "00F";
    },
    shareReddit: function(){

    },
    shareFb: function(e){
        var obj = {
            method: 'feed',
            redirect_uri: window.location.href,
            link: window.location.href,
            picture:A.view.helper.cleanS3URL(this.model.get('tile_image')),
            name: 'Tinkermob',
            caption: this.model.get('tag_line'),
            description: this.model.get('text')
        };
        app.vent.trigger('social:fbPost', obj);
    }
});

A.view.ideaProfile.ideaDetailsView= Backbone.Marionette.ItemView.extend({
    template: '#idea_details_template',
    tagName: 'div',
    className: 'snap_tile',
    events: {
        'click .idea_profile_pg_btn_edit': 'editIdea',
        'click .owner': 'navigateUser'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
        app.vent.bind('sub_navi:setIdeaImage', this.setIdeaImage, this);
    },
    editIdea: function(){
        app.vent.trigger('navigate:newIdea', this.model);
    },
    navigateUser: function(e){
        app.vent.trigger('navigate:userProfile', this.model.get('username'));
        e.preventDefault();
    },
    setIdeaImage: function(img){
        if(typeof img !== undefined){
            this.model.set('image',img);
            this.model.save();
        }
    },
    onClose: function(){
        app.vent.off('sub_navi:setIdeaImage');
        // custom closing and cleanup goes here
    }
});

A.view.ideaProfile.SnapshotView = Backbone.Marionette.ItemView.extend({
    template: '#snapshot_tile_template',
    tagName: 'li',
    className: 'snap_tile content_tile',
    events: {
        'click .pg_btn_edit': 'editSnapshot',
        'click .link': 'viewDetails',
        'click .snapshot_tile_dnd': 'dndStart',
        'dnd_save' : 'dndSave',
        'dnd_refresh' : 'dndRefresh',
        'click .btn_x_scale': 'x_scale',
        'click .snapshot_tile_profile': 'setIdeaImage'
        ,'click .btn_y_scale': 'y_scale'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
    },
    viewDetails: function(){
        app.vent.trigger('navigate:snapDetail', this.model);
    },
    editSnapshot: function(e){
        app.vent.trigger('navigate:newSnapshot', this.model);
        e.stopPropagation();
    },
    dndStart: function(e){
        var self = this;
        e.stopPropagation();
    },
    dndSave: function(e){
        this.model.save();
    },
    dndRefresh: function(e,new_ordering){
        this.model.set({ordering:new_ordering},{slient:true});
    },
    setIdeaImage: function(e){
        app.vent.trigger('sub_navi:setIdeaImage', this.model.get('image'));
        e.stopPropagation();
    },
    onRender: function(){
        if(this.model.get("display_image")=== IMG_PATH+'/cog.png' && this.model.has("image")=== false){
            this.$el.addClass('no_image');
        }
        var img = this.$el.find('.snapshot_tile');
        switch(this.model.get('horizontal_size'))
        {
            case 1:
                img.removeClass('x_scale2').addClass('x_scale1');
                break;
//            case 2:
//                img.removeClass('x_scale1').removeClass('x_scale3').addClass('x_scale2');
//                break;
            default:
                img.removeClass('x_scale1').addClass('x_scale2');
        }
        var y_scale =this.model.get('vertical_size');
        switch(y_scale)
        {
            case 1:
                img.removeClass('y_scale2').addClass('y_scale1');
                break;
//            case 2:
//                img.removeClass('y_scale1').removeClass('y_scale3').addClass('y_scale2');
//                break;
            default:
                img.removeClass('y_scale1').addClass('y_scale2');
        }
        this.first_time= false;
    },
    x_scale: function(e){
        e.stopPropagation();
        var img = this.$el.find('.snapshot_tile');
        var x_scale =this.model.get('horizontal_size');
        switch(x_scale)
        {
            case 1:
                x_scale=2;
                img.removeClass('x_scale1').addClass('x_scale2');
                break;
//            case 2:
//                x_scale=3;
//                img.removeClass('x_scale2').removeClass('x_scale1').addClass('x_scale3');
//                break;
            default:
                x_scale=1;
                img.removeClass('x_scale2').addClass('x_scale1');
        }
        this.model.set('horizontal_size',x_scale,{silent: true});
        this.model.save();
//            $('#ideas').masonry( 'reload');
    },
    y_scale: function(e){
        e.stopPropagation();
        var img = this.$el.find('.snapshot_tile');
        var y_scale =this.model.get('vertical_size');
        switch(y_scale)
        {
            case 1:
                y_scale=2;
                img.removeClass('y_scale1').addClass('y_scale2');
                break;
//            case 2:
//                y_scale=3;
//                img.removeClass('y_scale2').removeClass('y_scale1').addClass('y_scale3');
//                break;
            default:
                y_scale=1;
                img.removeClass('y_scale2').addClass('y_scale1');
        }
        this.model.set('vertical_size',y_scale,{silent: true});
        this.model.save();
    }
});

A.view.ideaProfile.addSnapshotView = Backbone.Marionette.ItemView.extend({
    template: '#add_snapshot_tile_template',
    tagName: 'li',
    id: 'add_snapshot',
    className: 'snap_tile',
    events: {
        'click .link': 'newSnapshot'
    },
    initialize: function(options){
//        this.model.bind('change', this.render, this);
    },
    newSnapshot: function(){
        app.vent.trigger('navigate:newSnapshot', this.model);
    }
});

A.view.ideaProfile.SnapListView = Backbone.Marionette.PaginatedCollectionView.extend({
    itemView : A.view.ideaProfile.SnapshotView,
    addNewItemView:A.view.ideaProfile.addSnapshotView,
    className:'animated infinite_grid',
    id:'snap_list',
    tagName: 'ul',
    onRender: function(){
        //check comparator, hide drag container if it's not enabled
//        if(this.collection.comparator == this.collection.newestComparator||this.collection.comparator == this.collection.oldestComparator){
//            this.$el.find(".btn_dnd_order").hide();
//            $('#snap_list').addClass('animated');
//        }
    },
    initialize: function(obj){
        this.masonry_enabled = false;
        this.column_width = obj.column_width || 306;
        var self = this;
        this.on("item:removed", function(viewInstance){
            if(this.masonry_enabled && this.$el.find('.content_tile').length>0){
                self.$el.masonry('reload');
            }
        });
//        this.collection.bind('change', this.render,this);
        this.collection.bind('change', this.reload,this);
        this.collection.bind('re_order', this.reloadMasonry,this);
        this.collection.bind('new_item_added', this.showAddItemView, this);
        this.initializePaginated();
    },
    events: {
      'sort_collection':'sortCollection',
      'add_snapshot':'addSnapshot',
      'dnd_order':'dndOrder'
    },
    dndOrder: function(e){
        this.collection.off('change');
        app.vent.trigger('navigate:dndOrder', this.collection);
    },
    reload: function(){
        if(this.masonry_enabled && this.$el.find('li').length>0){
            this.$el.masonry('reload');
        }
    },
//    onDomRefresh: function(){
//        console.log('dom refreshed')
//        if(this.masonry_enabled && this.$el.find('li').length>0){
//            this.$el.masonry('reload');
//        }
//        else{
//            var self = this;
//            this.$el.masonry({
//                itemSelector : '.snap_tile',
//                columnWidth : 306
//            });
//            self.masonry_enabled = true;
//            this.$el.sortable({
//                items: "> li",
//                forcePlaceholderSize: true,
//                handle: ".snapshot_tile_dnd",
////                beforeStop: function( event, ui ) {
////                },
//                change: function( event, ui ) {
//                    self.$el.find('#snap_list').addClass('animated');
//                    //-4 for the borders
//                    $(ui.placeholder).width($(ui.placeholder).width()-4);
//                    $(ui.placeholder).height($(ui.placeholder).height()-4);
//                    $(ui.placeholder).css('border','2px dotted #FFDABF');
//                    $(ui.placeholder).css('visibility','visible');
//                    self.$el.masonry('reload');
//                },
////                start: function( event, ui ) {
////                    $('#snap_list').removeClass('animated');
////                },
////                sort: function( event, ui ) {
////                },
//                stop: function( event, ui ) {
//                    self.$el.removeClass('animated');
//                },
//                update: function( event, ui ) {
//                    self.$el.find('li').each(function(index, item){
//                        $(this).trigger('dnd_refresh', index);
//                    });
//                    ui.item.trigger('dnd_save');
//                    self.collection.sort();
//                    self.render();
//                    self.$el.delay(500).masonry('reload');
//                }
//            });
//        }
//    },
    sortCollection: function(e,field_name){
        this.collection.sort_by(field_name);
        switch(field_name){
            case "-modified_on":
                this.collection.comparator = this.collection.newestComparator;
                break;
            case "modified_on":
                this.collection.comparator = this.collection.oldestComparator;
                break;
            default:
                this.collection.comparator = this.collection.defaultComparator;
                break;
        }
        this.collection.sort();
    },
    onDomRefresh: function(){
        if(this.masonry_enabled){
            this.$el.masonry('reload');
        }
    },
    addSnapshot: function(){
        var model = new A.model.Snapshot;
            model.set('text','',{silent: true});
            model.set('img_tile_src',IMG_PATH+'/new_idea.png',{silent: true});
            model.set('idea',this.collection.idea.id,{silent: true});
            model.set('user',USER,{silent: true});
        model.set('snaps_col',this.collection,{silent: true});
        app.vent.trigger('navigate:newSnapshot', model);
    },
    showAddItemView: function(idea_id){
        if(this.$el.find('#add_snapshot').length<1){
            var model = new A.model.Snapshot;
            model.set('text','',{silent: true});
            model.set('ordering',-1,{silent: true});
            model.set('img_tile_src',IMG_PATH+'/new_idea.png',{silent: true});
            model.set('idea',idea_id,{silent: true});
            model.set('user',USER,{silent: true});
//            console.log(JSON.stringify(model));
            model.set('snaps_col',this.collection,{silent: true});
//            this.addItemView(model, this.addNewItemView, -1);
        }
    },
    onClose: function(){
//        this.$el.sortable("destroy");
        this.off("item:removed");
//        app.vent.off('navigate:newSnapshot');
    },
    onShow: function(view){
//        if(this.masonry_enabled && $('#snap_list li').length>0){
//            $('#snap_list').masonry('reload');
//        }
//        else{
            var self = this;
        this.$el.masonry({
                itemSelector : '.snap_tile',
                columnWidth : self.column_width
            });
            self.masonry_enabled = true;
//        this.$el.sortable({
//                items: "> li",
//                forcePlaceholderSize: true,
//                handle: ".snapshot_tile_dnd",
////                beforeStop: function( event, ui ) {
////                },
//                change: function( event, ui ) {
//                    self.$el.addClass('animated');
//                    //-4 for the borders
//                    $(ui.placeholder).width($(ui.placeholder).width()-4);
//                    $(ui.placeholder).height($(ui.placeholder).height()-4);
//                    $(ui.placeholder).css('border','2px dotted #FFDABF');
//                    $(ui.placeholder).css('visibility','visible');
//                    self.$el.masonry('reload');
//                },
////                start: function( event, ui ) {
////                    $('#snap_list').removeClass('animated');
////                },
////                sort: function( event, ui ) {
////                },
//                stop: function( event, ui ) {
//                   self.$el.removeClass('animated');
//                },
//                update: function( event, ui ) {
////                    console.log(self.$el.find('li'))
//                    console.log(ui.item)
//
//                    self.$el.find('li').each(function(index, item){
//                        $(this).trigger('dnd_refresh', index);
//                    });
//                    $(ui.item).trigger('dnd_save');
//                    self.collection.sort();
//                    self.render();
//                    self.$el.delay(500).masonry('reload');
//                }
//            });
    },
    reloadMasonry: function(){
        this.collection.sort();
//        this.render();
        if(this.masonry_enabled){
            this.$el.masonry('reload');
        }
        else{
            this.render();
        }
        this.collection.bind('change', this.render,this);
//        console.log(this.collection.map(function(item){ return item.get('text') +' - '+ item.get('ordering'); }));
    }
    ,
    appendHtml: function(collectionView, itemView, index){
        if(index <= 0){
            collectionView.$el.prepend(itemView.el);
        }
        else if(typeof index !== "undefined" && collectionView.$el.find(".content_tile").length>1){
            if((index+1) >= collectionView.$el.find(".content_tile").length && this.masonry_enabled===true){
                collectionView.$el.append(itemView.el).masonry('appended', itemView.$el);
            }
            else{
                collectionView.$el.find("li:nth-child("+index+")").after(itemView.el);
                if(this.masonry_enabled){
                    this.$el.masonry('reload');
                }
            }
        }
        else{
            collectionView.$el.append(itemView.el);
        }
    }
});

A.view.ideaProfile.QuestionView = Backbone.Marionette.Layout.extend({
    template: '#question_template',
    tagName: 'div',
    className: 'question',
    events: {
          'click .up_rank': 'upRank',
          'click .down_rank': 'downRank',
          'click .up_rank_pressed': 'upRankPressed',
          'click .down_rank_pressed': 'downRankPressed',
          'click .qa_show_more': 'showMore',
          'click .qa_profile_pic_container': 'navigateUser'
    },
    regions: {
        answers_region: ".qa_answers"
    },
    initialize: function(){
        this.ans = new A.model.Answers();
        if(this.model.has('preview_answers')){
            this.ans.add(this.model.get('preview_answers'));
        }
        this.model.set('answers',this.ans,{silent: true});
        this.model.bind('change', this.render, this);
    },
    onRender: function(){
//        if(this.model.has('answers')){
//            //on filtrate might still throw an error
//            if(this.model.get('count_answers') > 2){
//                var answers = this.model.get('answers');
//                answers.filtrate({filter:{'question':this.model.id}});
////                console.log(answers);
//            }
//        }
//        else{
//            var answers = new A.model.Answers();
//            answers.filtrate({filter:{'question':this.model.id}});
//            this.model.set('answers',answers);
//        }
//        var ans_col;
        var self = this;
        var answerView = new A.view.ideaProfile.AnsListView({
            collection:this.ans
        });
        answerView.off("render");
        answerView.on("render", function(){
            if(self.model.get('show_more')){
                this.showAddItemView(self.model);
            }
        });

        this.answers_region.show(answerView);

        var btn_rank = this.model.get('is_ranked') || 0;
        if(btn_rank===1){
            this.$el.find('.up_rank').first().removeClass('up_rank').addClass('up_rank_pressed');
        }
        else if(btn_rank===-1){
            this.$el.find('.down_rank').first().removeClass('down_rank').addClass('down_rank_pressed');
        }
        if(this.model.get('show_more')){
            this.showMore();
        }
    },
    navigateUser: function(e){
        app.vent.trigger('navigate:userProfile', this.model.get('username'));
        e.preventDefault();
    },
    showMore: function(){
//        this.$el.find('.new_answer').show();
        this.ans.filtrate({filter:{'question':this.model.id}});
        app.vent.trigger('question:showAnswers', this);
        this.$el.find('.qa_show_more').hide();
        this.model.set('show_more',1,{silent: true});
    },
    setRankQuestion: function(is_active, up_rank){
        if(typeof is_active === 'undefined'){
            is_active = 1;
        }
        if(typeof up_rank === 'undefined'){
            up_rank  = 1;
        }
        var supportQuestion = this.model.get('supportQuestion') || new A.model.supportQuestion();
        var rank = this.model.get('rank') || 0;
        var is_ranked = this.model.get('is_ranked') || 0;
        if(up_rank===1 && is_active ===1){
            rank = rank + 1 - is_ranked;
            is_ranked = 1;
        }
        else if(up_rank===-1 && is_active ===1){
            rank = rank - 1 - is_ranked;
            is_ranked = -1;
        }
        else if(up_rank===1 && is_active ===0){
            rank = rank - 1;
            is_ranked = 0;
        }
        else if(up_rank===-1 && is_active ===0){
            rank = rank + 1;
            is_ranked = 0;
        }
        this.model.set('is_ranked',is_ranked,{silent: true});
        this.model.set('rank',rank);
        supportQuestion.set('question', this.model.id);
        supportQuestion.set('is_active', is_active);
        supportQuestion.set('up_rank', up_rank);
        this.model.set('supportQuestion',supportQuestion,{silent: true});
        app.supportQuestionsCol.add(supportQuestion ,{silent: true});
        return supportQuestion
    },
    downRank: function(){
        this.$el.find('.down_rank').first().removeClass('down_rank').addClass('down_rank_pressed');
        this.$el.find('.up_rank_pressed').first().removeClass('up_rank_pressed').addClass('up_rank');
        this.setRankQuestion(1,-1).save()
    },
    upRank: function(){
        this.$el.find('.up_rank').first().removeClass('up_rank').addClass('up_rank_pressed');
        this.$el.find('.down_rank_pressed').first().removeClass('down_rank_pressed').addClass('down_rank');
        this.setRankQuestion(1,1).save();
    },
    downRankPressed: function(){
        this.$el.find('.down_rank_pressed').first().removeClass('down_rank_pressed').addClass('down_rank');
        this.setRankQuestion(0,-1).save();
    },
    upRankPressed: function(){
        this.$el.find('.up_rank_pressed').first().removeClass('up_rank_pressed').addClass('up_rank');
        this.setRankQuestion(0,1).save();
    }
});

A.view.ideaProfile.addQuestionView = Backbone.Marionette.ItemView.extend({
    template: '#add_question_template',
    id: 'add_question',
    tagName: 'div',
    className: 'question',
    events: {
        'click .pg_btn_add': 'newQuestion'
        ,'keypress .textarea_question': 'createOnEnter',
        'click .qa_profile_pic_container': 'navigateUser'
    },
    initialize: function(options){
//        this.model.bind('change', this.render, this);
    },
    newQuestion: function(){
        var text = this.$el.find('.textarea_question').val();
        if(text){
            var idea = this.model.get('idea');
            var question = new A.model.Question();
            this.ans = new A.model.Answers();
            question.set('answers',this.ans,{silent: true});
            question.set('text',text,{silent: true});
            question.set('idea',idea.id,{silent: true});
            if(idea.get('user')===USER){
                question.set('is_owner',1,{silent: true});
            }
            question.set('user',USER,{silent: true});
            question.set('username',USERNAME,{silent: true});
//            question.set('answers',new A.model.Answers(),{silent: true});
            idea.get('questions').add(question,{index: 0});
            question.save();
            this.$el.find('.textarea_question').val('');
        }
    },
    navigateUser: function(e){
        app.vent.trigger('navigate:userProfile', this.model.get('username'));
        e.preventDefault();
    },
    createOnEnter: function(e){
        if((e.keyCode || e.which) == 13){
            this.newQuestion();
            e.preventDefault();
        }
    }
});

A.view.ideaProfile.QuestListView = Backbone.Marionette.CollectionView.extend({
    itemView : A.view.ideaProfile.QuestionView,
    addNewItemView:A.view.ideaProfile.addQuestionView,
    className:"content_list",
    initialize: function(){
        A.view.helper.unbindScroll();
        app.vent.bind('page:onBottom',this.onBottom, this);
    },
    events: {
        'sort_collection':'sortCollection'
    },
    sortCollection: function(e,field_name){
        this.collection.sort_by(field_name);
        switch(field_name){
            case "-modified_on":
                this.collection.comparator = this.collection.newestComparator;
                break;
            case "modified_on":
                this.collection.comparator = this.collection.oldestComparator;
                break;
            default:
                this.collection.comparator = this.collection.defaultComparator;
                break;
        }
        this.collection.sort();
    },
    onRender: function(){
//        console.log($('.btn_page_control'))
    },
    onBottom: function(){
        if(this.collection.nextPage()===false){
            app.vent.unbind('page:onBottom');
        }
    },
    addChildView: function(item, collection, options){
        this.closeEmptyView();
        var ItemView = this.getItemView(item);
        var index;
        if(options && options.index){
            index = options.index;
        } else {
            index = collection.indexOf(item);
        }
        return this.addItemView(item, ItemView, index);
    },
    showAddItemView: function(idea){
        var model = new A.model.Question();
        model.set('idea', idea);
        model.set('created_on',new Date());
        if(USERNAME){
            model.set('user_icon_image',app.tinker.owner.get('profile_image'));
        }
        model.set('username',USERNAME);
        this.addItemView(model, this.addNewItemView,-1);
    },
    appendHtml: function(collectionView, itemView, index){
        if(index < 0){
            collectionView.$el.prepend(itemView.el);
        }
        else if(index===0 && collectionView.$el.find(".question").length>1){
            collectionView.$el.find(".question:first-child").after(itemView.el)
        }
        else{
            collectionView.$el.append(itemView.el);
        }
    }
});

A.view.ideaProfile.AnswerView = Backbone.Marionette.ItemView.extend({
    template: '#answer_template',
    tagName: 'div',
    className: 'answer',
    events: {
        'click .up_rank': 'upRank',
        'click .down_rank': 'downRank',
        'click .up_rank_pressed': 'upRankPressed',
        'click .down_rank_pressed': 'downRankPressed',
        'click .qa_profile_pic_container': 'navigateUser'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
    },
    navigateUser: function(e){
        app.vent.trigger('navigate:userProfile', this.model.get('username'));
        e.preventDefault();
    },
    onRender: function(){
        var btn_rank = this.model.get('is_ranked') || 0;
        if(btn_rank===1){
            this.$el.find('.up_rank').removeClass('up_rank').addClass('up_rank_pressed');
        }
        else if(btn_rank===-1){
            this.$el.find('.down_rank').removeClass('down_rank').addClass('down_rank_pressed');
        }
    },
    setRankAnswer: function(is_active, up_rank){
        if(typeof is_active === 'undefined'){
            is_active = 1;
        }
        if(typeof up_rank === 'undefined'){
            up_rank  = 1;
        }
        var supportAnswer = app.supportAnswersCol.get(this.model.get('supportAnswer'))|| new A.model.supportAnswer();
        var rank = this.model.get('rank') || 0;
        var is_ranked = this.model.get('is_ranked') || 0;
        if(up_rank===1 && is_active ===1){
            rank = rank + 1 - is_ranked;
            is_ranked = 1;
        }
        else if(up_rank===-1 && is_active ===1){
            rank = rank - 1 - is_ranked;
            is_ranked = -1;
        }
        else if(up_rank===1 && is_active ===0){
            rank = rank - 1;
            is_ranked = 0;
        }
        else if(up_rank===-1 && is_active ===0){
            rank = rank + 1;
            is_ranked = 0;
        }
        this.model.set('is_ranked',is_ranked,{silent: true});
        this.model.set('rank',rank);
        supportAnswer.set('answer', this.model.id);
        supportAnswer.set('is_active', is_active);
        supportAnswer.set('up_rank', up_rank);
        this.model.set('supportAnswer',supportAnswer.id,{silent: true});
        if(typeof supportAnswer.collection === 'undefined'){
            app.supportAnswersCol.add(supportAnswer ,{silent: true});
        }
        return supportAnswer
    },
    downRank: function(e){
        e.stopImmediatePropagation();
        this.$el.find('.down_rank').first().removeClass('down_rank').addClass('down_rank_pressed');
        this.$el.find('.up_rank_pressed').first().removeClass('up_rank_pressed').addClass('up_rank');
        this.setRankAnswer(1,-1).save()
    },
    upRank: function(e){
        e.stopImmediatePropagation();
        this.$el.find('.up_rank').first().removeClass('up_rank').addClass('up_rank_pressed');
        this.$el.find('.down_rank_pressed').first().removeClass('down_rank_pressed').addClass('down_rank');
        this.setRankAnswer(1,1).save();
    },
    downRankPressed: function(e){
        e.stopImmediatePropagation();
        this.$el.find('.down_rank_pressed').first().removeClass('down_rank_pressed').addClass('down_rank');
        this.setRankAnswer(0,-1).save();
    },
    upRankPressed: function(e){
        e.stopImmediatePropagation();
        this.$el.find('.up_rank_pressed').first().removeClass('up_rank_pressed').addClass('up_rank');
        this.setRankAnswer(0,1).save();
    }
});

A.view.ideaProfile.addAnswerView = Backbone.Marionette.ItemView.extend({
    template: '#add_answer_template',
    tagName: 'div',
    className: 'answer new_answer',
    events: {
        'click .pg_btn_add': 'newAnswer'
        ,'keypress .textarea_question': 'createOnEnter',
        'click .qa_profile_pic_container': 'navigateUser'
    },
    initialize: function(options){
    },
    newAnswer: function(){
        var text = this.$el.find('.textarea_question').val();
        if(text){
            this.model.set('text',text,{silent: true});
            this.model.set('user',USER,{silent: true});
            this.model.set('username',USERNAME,{silent: true});
            this.model.ans.add(this.model,{index: 0});
            this.model.save();
            this.$el.find('.textarea_question').val('');
        }
    },
    navigateUser: function(e){
        app.vent.trigger('navigate:userProfile', this.model.get('username'));
        e.preventDefault();
    },
    createOnEnter: function(e){
        if((e.keyCode || e.which) == 13){
            this.newAnswer();
            e.preventDefault();
        }
    }
});

A.view.ideaProfile.AnsListView = Backbone.Marionette.CollectionView.extend({
    itemView : A.view.ideaProfile.AnswerView,
    addNewItemView:A.view.ideaProfile.addAnswerView,
    onRender: function(){
    },
    initialize: function(){
    },
    showAddItemView: function(question){
        var model = new A.model.Answer();
        model.set('question',question.id,{silent: true});
        if(question.get('user')===USER){
            model.set('is_owner',1,{silent: true});
        }
        else{
            model.set('is_owner',0,{silent: true});
        }
        if(USERNAME){
            model.set('user_icon_image',app.tinker.owner.get('profile_image'));
        }
        model.set('username',USERNAME);
        model.ans = this.collection;
        this.addItemView(model, this.addNewItemView, -1);
    },
    addChildView: function(item, collection, options){
        this.closeEmptyView();
        var ItemView = this.getItemView(item);
        var index;
        if(options && options.index){
            index = options.index;
        } else {
            index = collection.indexOf(item);
        }
        return this.addItemView(item, ItemView, index);
    },
    appendHtml: function(collectionView, itemView, index){
        if(index < 0){
            collectionView.$el.prepend(itemView.el);
        }
        else if(index===0 && collectionView.$el.find(".answer").length>1){
            collectionView.$el.find(".answer:first-child").after(itemView.el)
        }
        else{
            collectionView.$el.append(itemView.el);
        }
    }
});