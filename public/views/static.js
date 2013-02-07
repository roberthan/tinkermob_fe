var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
A.view.static = A.view.static || {};

A.view.static.Layout = A.view.Modal_Layout.extend({
    template: "#static_template",
    events:{
        'click .modal_foreground_container': 'stopCloseModal',
        'click .modal_background_container': 'closeModal',
        'click .close': 'closeModal'
    },
    urlPath: function(){
        A.view.helper.setPrevURL(app.router);
    }
});

A.view.static.snapDetail = A.view.Modal_Layout.extend({
    template: "#snap_detail_template",
    events:{
        'click .btn_modal_show_more': 'showMore',
        'click .modal_foreground_container': 'stopCloseModal',
        'click .modal_background_container': 'closeModal',
        'click .close': 'closeModal'
    },
    showMore: function(e){
        this.$el.find('.modal_foreground_container').toggleClass('modal_show_more');
        if(this.$el.find('.modal_foreground_container').hasClass('modal_show_more')){
            this.$el.find('.btn_modal_show_more').text('Hide text');
        }
        else{
            this.$el.find('.btn_modal_show_more').text('Show more');
        };
    }
});

A.view.static.newSnapshot = A.view.Modal_Layout.extend({
    template: "#new_snapshot_template",
    className:"modal_add_snapshot",
    events:{
        'click .zoomin': 'stopCloseModal',
        'click #input_modal': 'closeModal',
        'click .btn_add': 'createSnapshot',
        'keypress .textarea_details': 'createOnEnter',
        'change .upload_file': 'validateFile',
        'click .toggle_delete': 'deleteSnapshot',
        'click .btn_cancel': 'closeModal'
    },
    initialize: function(){
        this.imageValid = false;
    },
    validateFile : function(e){
//            console.log(e.target.files);
        this.imageValid = A.view.helper.validateFile(e);
//        var file = e.target.files[0];
//        var parts = file.name.split('.');
//        var file_ext = parts[parts.length - 1].toLowerCase();
//        var valid_ext = ['png','jpg', 'bmp','jpeg','gif']
//        //TODO validate file upload
//        if(file.size <= 10485760){
//            if(valid_ext.indexOf(file_ext)!==-1){
//                this.imageValid = true;
//            }
//            else{
//                alert('invalid file type')
//            }
//        }
//        else{
//            alert('file too big');
//        }
    },
    createOnEnter: function(e){
        if((e.keyCode || e.which) == 13){
            this.createSnapshot();
            e.preventDefault();
        }
    },
    createSnapshot: function(e){
        var self = this;
        var formData = new FormData(this.$el.find('.new_snapshot_form')[0]);
        var text = this.$el.find('.textarea_details').val();
        function progressHandlingFunction(e){
            if(e.lengthComputable){
                self.$el.find('.upload_progress').attr({value:e.loaded,max:e.total});
            }
        }
        var snapshot = this.model;
        snapshot.set('text',text);
        if(this.imageValid===true){
            var image_id = A.view.helper.guid();
            formData.append('id',image_id);
            snapshot.set('image',image_id);
            $.ajax({
                url: IMG_URL+'?userid='+USER+'&authkey='+AUTHKEY,  //server script to process data
                type: 'POST',
                xhr: function() {  // custom xhr
                    myXhr = $.ajaxSettings.xhr();
                    if(myXhr.upload){ // check if upload property exists
                        myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // for handling the progress of the upload
                    }
                    return myXhr;
                },
                //Ajax events
//                beforeSend: beforeSendHandler,
                success: function(req, status, jqXHR){
                    console.log(jqXHR.responseText);
                    if(status==='success'){
                        var data = JSON.parse(jqXHR.responseText)[0];
                        if(_.has(data,'original_image')){
                            snapshot.set('original_image',data.original_image);
                            snapshot.set('tile_image',data.tile_image);
                            snapshot.save({},{noAjax:true});
                        }
                    }
                    self.closeModal();
                },
//                error: errorHandler,
                // Form data
                data: formData,
                //Options to tell JQuery not to process data or worry about content-type
                cache: false,
                contentType: false,
                processData: false
            });
        }
        if(typeof this.model.collection==='undefined'){
            var snaps = this.model.get('snaps_col');
            snapshot.unset('snaps_col');
            snaps.add(snapshot);
        }
        snapshot.save();
        if(this.imageValid!==true){
            this.model.collection.trigger('new_item_added', this.model.get('idea'))
            self.closeModal();
        }
        if(this.model.get('is_active')===0){
            this.model.collection.remove(this.model);
        }
    },
    deleteSnapshot: function(e){
        var obj=this.$el.find('.toggle_delete');
        if(this.model.get('is_active')===0){
            this.toggleSwitch(obj,false);
            $('.toggle_selection_delete').text('');
            this.model.unset('is_active');
        }
        else{
            this.toggleSwitch(obj,true);
            this.model.set('is_active',0);
            $('.toggle_selection_delete').text('Deleted');
        }
    },
    toggleSwitch: function(obj, forward){
        if(typeof forward === 'undefined'){
            forward=true;
        }
        var toggle = $(obj).find('.button');
        if(forward){
            toggle.css('-webkit-animation','animate_toggle .75s');
            toggle.css('-webkit-animation-fill-mode','forwards');
        }
        else{
            toggle.css('-webkit-animation','animate_toggle_rev .75s');
            toggle.css('-webkit-animation-fill-mode','forwards');
        }
    }
});

A.view.static.newIdea = A.view.Modal_Layout.extend({
    template: "#new_idea_template",
    events:{
        'click .zoomin': 'stopCloseModal',
        'click #input_modal': 'closeModal',
        'click .btn_add': 'createIdea',
        'keypress .textarea_tag_line': 'createOnEnter',
        'click .btn_cancel': 'closeModal'
    },
    initialize: function(){
        if(typeof this.model === 'undefined'){
            this.model = new A.model.Idea;
        }
    },
    createOnEnter: function(e){
        var l = this.$el.find('.textarea_tag_line').val().length;
        var warning_field= this.$el.find('.char_count .count');
        warning_field.text(l);
        if(l >= 140){
            warning_field.addClass('warning');
        }
        else{
            warning_field.removeClass('warning');
        }
        if((e.keyCode || e.which) == 13){
            this.createIdea();
            e.preventDefault();
        }
    },
    createIdea: function(e){
        var self = this;
        var formData = new FormData(this.$el.find('.new_idea_form')[0]);
        var text_field = this.$el.find('.textarea_tag_line');
        var text = text_field.val();
        if(text.length > 0 && text.length<=140){
            var ideas=app.my_ideas_col;
            this.model.set('tag_line',text);
            ideas.add(this.model);
            this.model.save();
            self.closeModal();
        }
        else{
            text_field.addClass('warning_placeholder').focus();
        }
    }
});

A.view.static.settingsView = A.view.Modal_Layout.extend({
    template: "#settings_template",
    initialize: function(){
        this.imageValid = false;
        this.imageUploadAttmpt = false;
        this.change_email= false;
        this.change_username= false;
    },
    events:{
        'click .zoomin': 'stopCloseModal',
        'click #input_modal': 'closeModal',
        'change .upload_file': 'validateFile',
        'click #toggle_fb': 'fbAuth',
        'click #toggle_twitter': 'twitterAuth',
        'click #toggle_newsletter': 'newsletter',
        'click .btn_save': 'submitForm',
        'click .btn_cancel': 'closeModal',
        'change .upload_file': 'validateFile',
        'change .txt_email': 'validateEmail',
        'change .txt_username': 'validateUsername'
    },
    onRender: function(){
        this.model.bind('change', this.render,this);
        this.showModal();
        //set newsletter settings
        this.toggleSwitch(this.$el.find('#toggle_newsletter'),this.model.get('newsletter_setting'));
        if(this.model.get('facebook_auth')!==0&&this.model.has('facebook_auth')){
            this.toggleSwitch(this.$el.find('#toggle_fb'),true);
        }
        if(this.model.get('twitter_auth')!==0&&this.model.has('twitter_auth')){
            this.toggleSwitch(this.$el.find('#toggle_twitter'),true);
        }
        //set dropdown setting
        this.$el.find("#dropdown_notify_on option[value='"+this.model.get('notify_setting')+"']").attr('selected', 'selected');
        this.$el.find("#dropdown_twitter_push option[value='"+this.model.get('twitter_push')+"']").attr('selected', 'selected');
//        this.$el.find("#dropdown_fb_push option[value='"+this.model.get('fb_push')+"']").attr('selected', 'selected');
    },
    validateFile : function(e){
        console.log(A.view.helper.validateFile(e));
        this.imageValid =A.view.helper.validateFile(e);
        this.imageUploadAttmpt = true;
    },
    validateUsername : function(e){
        var username_input = this.$el.find('.txt_username');
        var warning = this.$el.find('.text_warning');
        var current_username = this.model.get('username');
        var warning_text = 'This username is already in use';
        $.ajax({
            url: '/auth/is_unique?username='+username_input.val(),
            success: function(data, textStatus, jqXHR){
                var res_data = JSON.parse(data)[0];
                if(_.isObject(res_data)){
                    if(res_data.username===false && current_username!==username_input.val()){
                        username_input.addClass('warning_placeholder').focus().blur();
                        warning.text(warning_text);
                    }
                    else{
                        username_input.removeClass('warning_placeholder').focus().blur();
                        if (warning.text()===warning_text){
                            warning.text('');
                        }
                    }
                }
//                return false;
            }
        });
        if(current_username!==username_input.val()){
            this.change_username= true;
        }
    },
    validateEmail : function(e){
        var email_input = this.$el.find('.txt_email');
        var warning = this.$el.find('.text_warning');
        var current_email = this.model.get('email');
        var warning_text = 'That email address is already in use or not valid';
        $.ajax({
            url: '/auth/is_unique?email='+email_input.val(),
            success: function(data, textStatus, jqXHR){
                var res_data = JSON.parse(data)[0];
                if(_.isObject(res_data)){
                    if(res_data.email===false && current_email!==email_input.val()){
                        email_input.addClass('warning_placeholder').focus().blur();
                        warning.text(warning_text);
                    }
                    else{
                        email_input.removeClass('warning_placeholder').focus().blur();
                        if (warning.text()===warning_text){
                            warning.text('');
                        }
                    }
                }
//                return false;
            }
        });
        if(current_email!==email_input.val()){
            this.change_email= true;
        }
    },
    submitForm: function(e){
        if(this.$el.find('.txt_password1').val()!==this.$el.find('.txt_password2').val()){
            this.$el.find('.txt_password2').addClass('warning_placeholder').focus().blur();
            this.$el.find('.txt_password1').addClass('warning_placeholder').focus().blur();
            this.$el.find('.text_warning').text("Confirmation passwords must match");
            return false;
        }
        else{
            this.model.set('password',this.$el.find('.txt_password1').val(),{ silent: true });
        }
        var self = this;
        var formData = new FormData(this.$el.find('.settings_form')[0]);
        this.model.set('display_name',this.$el.find('.txt_name').val(),{ silent: true });
        this.model.set('location_text',this.$el.find('.txt_location').val(),{ silent: true });
        this.model.set('website',this.$el.find('.txt_website').val(),{ silent: true });
        this.model.set('email',this.$el.find('.txt_email').val(),{ silent: true });
        this.model.set('username',this.$el.find('.txt_username').val(),{ silent: true });
        this.model.set('bio',this.$el.find('.textarea_bio').val(),{ silent: true });
        this.model.set('fb_push',this.$el.find('.textarea_bio').val(),{ silent: true });
//        this.model.set('isSynced', 0,{ silent: true; });
        if(this.$el.find('#toggle_selection_newsletter').text()==='Off'){
            this.model.set('newsletter_setting', false,{ silent: true });
        }
        else{
            this.model.set('newsletter_setting', true,{ silent: true });
        }
        function progressHandlingFunction(e){
            if(e.lengthComputable){
                self.$el.find('.text_warning').text("Image uploading, might take a minute or two");
                self.$el.find('.upload_progress').attr({value:e.loaded,max:e.total});
            }
        }
        if(this.imageValid===true){
            var image_id = A.view.helper.guid();
            var self = this;
            formData.append('id',image_id);
            this.model.set('image', image_id,{ silent: true });
            $.ajax({
                url: IMG_URL+'?userid='+USER+'&authkey='+AUTHKEY,  //server script to process data
                type: 'POST',
                xhr: function() {  // custom xhr
                    myXhr = $.ajaxSettings.xhr();
                    if(myXhr.upload){ // check if upload property exists
                        myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // for handling the progress of the upload
                    }
                    return myXhr;
                },
                //Ajax events
//                beforeSend: beforeSendHandler,
                success: function(req, status, jqXHR){
//                    console.log(jqXHR.responseText);
                    if(status==='success'){
                        var data = JSON.parse(jqXHR.responseText)[0];
                        if(_.has(data,'original_image')){
                            self.model.set('display_image',data.original_image,{ silent: true });
                            self.model.set('original_image',data.original_image,{ silent: true });
                            self.model.set('tile_image',data.tile_image,{ silent: true });
                            self.model.save({},{noAjax:true});
                        }
                    }
                    self.closeModal();
                    if(self.change_username){
                        window.location='/logout?next=/login'
                    }
                },
//                error: errorHandler,
                // Form data
                data: formData,
                //Options to tell JQuery not to process data or worry about content-type
                cache: false,
                contentType: false,
                processData: false
            });
        }
//        this.model.set('fb_push', this.$el.find('#dropdown_fb_push option:selected').val(),{ silent: true });
//        this.model.set('twitter_push', this.$el.find('#dropdown_twitter_push option:selected').val(),{ silent: true });
        this.model.set('notify_setting', this.$el.find('#dropdown_notify_on option:selected').val(),{ silent: true });
        this.model.save();
        self.model.unset('password',{ silent: true });
        self.model.save({},{noAjax:true});
        if(this.imageUploadAttmpt===false){
            this.closeModal();
            if(this.change_username){
                setTimeout(window.location='/logout?next=/login', 2000);
            }
        }
    },
    fbAuth: function(e){
        var obj=this.$el.find('#toggle_fb');
        if(this.model.get('facebook_auth')!==0&&this.model.has('facebook_auth')){
            this.toggleSwitch(obj,false);
            $('#toggle_selection_fb').text('Off');
            this.model.set('facebook_auth',0, {slient:true})
        }
        else{
            this.toggleSwitch(obj,true);
            $('#toggle_selection_fb').text('On');
            window.location ='/auth/facebook';
        }
    },
    twitterAuth: function(e){
        var obj=this.$el.find('#toggle_twitter');
        if(this.model.get('twitter_auth')!==0&&this.model.has('twitter_auth')){
            this.toggleSwitch(obj,false);
            $('#toggle_selection_twitter').text('Off');
            this.model.set('twitter_auth',0, {slient:true})
        }
        else{
            this.toggleSwitch(obj,true);
            $('#toggle_selection_twitter').text('On');
            window.location ='/auth/twitter';
        }
    },
    newsletter: function(e){
        var temp_val = this.model.get('newsletter_setting');
        var obj=this.$el.find('#toggle_newsletter');
        if(temp_val){
            $('#toggle_selection_newsletter').text('Off');
            this.toggleSwitch(obj,false);
        }
        else{
            $('#toggle_selection_newsletter').text('On');
            this.toggleSwitch(obj,true);
        }
    },
    toggleSwitch: function(obj, forward){
        if(typeof forward === 'undefined'){
            forward=true;
        }
        var toggle = $(obj).find('.button');
        if(forward){
            toggle.css('-webkit-animation','animate_toggle .75s');
            toggle.css('-webkit-animation-fill-mode','forwards');
        }
        else{
            toggle.css('-webkit-animation','animate_toggle_rev .75s');
            toggle.css('-webkit-animation-fill-mode','forwards');
        }
    },
    urlPath:function(){
        A.view.helper.setPrevURL(app.router);
    }
});

A.view.static.follow = A.view.Modal_Layout.extend({
    template: "#follow_template",
    regions: {
        follows: "#follow_items"
    },
    events:{
        'click .btn_cancel': 'closeModal',
        'click .modal_foreground_container': 'stopCloseModal',
        'click .modal_background_container': 'closeModal'
    },
    initialize: function(options){
        this.follows_col = options.follows_col;
    },
    onRender: function(){
        this.showModal();
        var list_view = new A.view.static.UserListView({collection:this.follows_col});
        this.follows.show(list_view);
    }
});

A.view.static.userDetailView = Backbone.Marionette.ItemView.extend({
    tagName: 'div',
//    className: 'user_detail',
    template: '#user_list_template',
    events:{
        'click .btn_follow': 'follow',
        'click .btn_follow_pressed': 'unFollow',
        'click .username': 'navigateUser',
        'click .profile_img_container': 'navigateUser'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
    },
    follow: function(){
        this.$el.find('.btn_follow').removeClass('btn_follow').addClass('btn_follow_pressed');
        A.view.helper.setFollow(1,this.model).save();
    },
    unFollow: function(){
        this.$el.find('.btn_follow_pressed').removeClass('btn_follow_pressed').addClass('btn_follow');
        A.view.helper.setFollow(0,this.model).save();
    },
    navigateUser: function(e){
        app.vent.trigger('navigate:userProfile', this.model.get('username'));
        e.preventDefault();
    }
    //moved to helper
//    setFollow: function(is_active){
//        if(typeof is_active === 'undefined'){
//            is_active = 1;
//        }
//        var following = new A.model.supportFollowing();
//        following.set('user', this.model.get('user'));
//        following.set('is_active', is_active);
//        this.model.set('is_following',is_active,{silent: true});
//        app.follows_col.add(following ,{silent: true});
//        var temp = app.tinker.owner.get('count_followings');
//        if(is_active === 1){
//           temp = temp +1;
//        }
//        else{
//            temp = temp - 1;
//        }
//        app.tinker.owner.set('count_followings', temp);
//        //TODO delete itself on save
//        return following
//    }
});

A.view.static.UserListView =  Backbone.Marionette.CollectionView.extend({
    id: 'user_list',
    itemView : A.view.static.userDetailView
});

A.view.static.dndOrder =  A.view.Modal_Layout.extend({
    template: "#dnd_order_snapshot_template",
    regions: {
        snapshots: "#dnd_snapshot_list_container"
    },
    events:{
        'click .modal_foreground_container': 'stopCloseModal',
        'click .modal_background_container': 'closeModal',
        'click .btn_cancel': 'closeModal'
    },
    initialize: function(options){
        this.col = options.collection;
    },
    onRender: function(){
        this.showModal();
        var list_view = new A.view.static.OrderSnapListView({collection:this.col});
        this.snapshots.show(list_view);
    }
});

A.view.static.OrderSnapView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    className:"dnd_snapshot_item",
    template: '#dnd_snapshot_item_template',
    events:{
        'dnd_refresh' : 'dndRefresh',
        'dnd_save' : 'dndSave'
//        'click .btn_follow': 'follow',
//        'click .btn_follow_pressed': 'unFollow'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
    },
    dndSave: function(e){
        this.model.save();
    },
    dndRefresh: function(e,new_ordering){
//        console.log("save " + new_ordering);
        this.model.set({ordering:new_ordering},{slient:true});
    }
});

A.view.static.OrderSnapListView =  Backbone.Marionette.CollectionView.extend({
//    id: 'user_list',
    tagName: 'ul',
    className:"dnd_snapshot_list",
    itemView : A.view.static.OrderSnapView,
    initialize: function(){
//        this.model.bind('change', this.render, this);
    },
    onClose: function(){
//        this.$el.sortable("destroy");
//        this.off("item:removed");
    },
    onShow: function(view){
        var self = this;
        this.$el.sortable({
//                items: "> li",
            scroll:false,
                forcePlaceholderSize: true,
                handle: ".dnd_snapshot_dnd_container",
//                beforeStop: function( event, ui ) {
//                },
                change: function( event, ui ) {
                },
                start: function( event, ui ) {
                },
                sort: function( event, ui ) {
                },
                stop: function( event, ui ) {
                },
                update: function( event, ui ) {
                     var min_spacer = Math.min.apply(null, self.collection.pluck('ordering'))
                    self.$el.find('li').each(function(index, item){
                        $(this).trigger('dnd_refresh', min_spacer+index);
                    });
                    $(ui.item).trigger('dnd_save');
                }
            });
    }
});