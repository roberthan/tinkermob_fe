var A = A || {};
A.view = A.view || {};
A.model = A.model || {};

A.Router = Backbone.Marionette.AppRouter.extend({
//    controller: app.controller
    // "someMethod" must exist at controller.someMethod
    appRoutes: {
        '': 'ideasNavi',
        '_=_': 'ideasNavi',
        'my-ideas': 'myIdeasNavi',
        'idea/:idea': 'ideaProfile',
        'user/:username': 'userProfile',
        'tag/:hashtag': 'tag',
        'settings': 'settings',
        'about': 'about'
    }
    /* standard routes can be mixed with appRoutes/Controllers above */
//    ,routes : {
//        "some/otherRoute" : "someOtherMethod"
//    },
//    someOtherMehod : function(){
//        // do something here.
//    }
});

