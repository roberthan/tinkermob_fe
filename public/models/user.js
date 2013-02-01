var A = A || {};
A.model = A.model || {};
A.view = A.view || {};
(  function( undefined ){
    A.model.User  = Backbone.Model.extend({
        urlRoot: USER_URL,
        initialize: function(){
        },
        url: function(){
            var temp_url;
            if(this.has('username')){
                temp_url = this.urlRoot + this.get('username');
            }
            else{
                temp_url = this.urlRoot + ('?id='+this.id);
            }
            return (temp_url.charAt(temp_url.length - 1) == '/' ? temp_url : temp_url+'/');
        },
        defaults: {
            profile_image: IMG_PATH+'/lightblub.jpg',
            display_name: 'loading',
            location_text: '',
            website: '',
            email: '',
            bio: '',
            count_ideas: 'loading',
            count_followings: 'loading',
            count_followers: 'loading',
            count_support_ideas: 'loading',
            newsletter_setting: '1',
            is_following: 0,
//            created_on: new Date().getTime(),
//            modified_on: new Date().getTime(),
            isSynced: 1
        },
        djangoSerial: function(){
            var json = this.toJSON()
            delete json.ideas;
            delete json.profile_image;
            delete json.tile_image;
            delete json.icon_image;
            delete json.isSynced;
            delete json.count_followers;
            delete json.count_followings;
            delete json.count_ideas;
            return json;
        }
//        ,
//        clear: function() {
//            this.destroy();
//        }
    });

    A.model.Users = Backbone.PaginatedCollection.extend({
        urlRoot: USER_URL,
        model: A.model.User,
        localStorage: new Backbone.LocalStorage("Users-backbone"),
        initialize: function(){
//            this.initializeSync();
            _.bindAll(this, "gAdd");
            this.bind("add", this.gAdd);
            this.initializePaginatedCollection();
//            this.syncOn();
        },
        gAdd: function(model){
            vent.trigger("user_add", model);
        },
//        maybeFetch: function(options){
//            // Helper function to fetch only if this collection has not been fetched before.
//            if(this._fetched){
//                // If this has already been fetched, call the success, if it exists
//                options.success && options.success();
//                return;
//            }
//            // when the original success function completes mark this collection as fetched
//            var self = this,
//                successWrapper = function(success){
//                    return function(){
//                        self._fetched = true;
//                        success && success.apply(this, arguments);
//                    };
//                };
//            options.success = successWrapper(options.success);
//            this.fetch(options);
//        },
        getOrFetch: function(id, options){
            // Helper function to use this collection as a cache for models on the server
            var model = this.get(id);
            if(model){
                options.success && options.success(model);
                return;
            }
            model = new A.model.User({
//                idAttribute: id
                username: id
//                ,id: id
            });
            model.fetch(options);
        }
    });
})()