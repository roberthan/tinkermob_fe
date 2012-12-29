var A = A || {};
A.model = A.model || {};
A.view = A.view || {};

(  function( undefined ){
    A.model.Image  = Backbone.Model.extend({
        urlRoot: IMG_URL,
//        uriPath: IMG_Path,
        initialize: function(){
            //    this.setUri();
        },
        defaults: {
            id: A.view.helper.guid(),//this.get('resource_uri'),
//            text: "empty text...",
            created_on: new Date().getTime(),
            modified_on: new Date().getTime(),
            isSynced: 1,
            isCreatedOnServer:0
        },
        clear: function() {
            this.destroy();
        }
    });

    A.model.Images = Backbone.Collection.extend({
        urlRoot: IMG_URL,
//        uriPath: IMG_Path,
        model: A.model.Image,
//        storage: Backbone.imageSync(),

//        localStorage: new Backbone.LocalStorage("Snapshots-backbone"),
        initialize: function(){
//            _.bindAll(this, "gAdd");
//            this.bind("add", this.gAdd);
//            this.syncOn();
        }

    });
})()