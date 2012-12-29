var A = A || {};
A.model = A.model || {};
A.view = A.view || {};

A.view.AnswerView = Backbone.View.extend({
    tagName: 'li',
    className: 'answer',
    // events: {
    // },
    initialize: function(){
        this.model.bind('change', this.render, this);
    },
    render: function(){
        $(this.el).html(A.template.answer(this.model.toJSON()));
        return this;
    }
});

A.view.QuestionView = Backbone.View.extend({
    tagName: 'li',
    className: 'question',
    events: {
        'click .permalink': 'navigate'
        ,'click .upvote': 'upvote'
    },
    initialize: function(){
        this.model.bind('change', this.render, this);
    },
    navigate: function(e){
        vent.trigger('question_navigate_to', this.model);
        e.preventDefault();
    },
    upvote: function(e){
        var ranking = this.$('.ranking').text();
        if(ranking){
            ranking = parseInt(ranking)+1;
            this.model.set({
                ranking: ranking
            });
            this.model.save();
            this.$('.ranking').text(ranking);
        }
    },

    render: function(){
        $(this.el).html(A.template.ask(this.model.toJSON()));
        return this;
    }
});

A.view.DetailApp = Backbone.View.extend({
    initialize: function(){
        //	_.bindAll(this, 'render', 'on_submit');
        //	this.model.on('add', this.render, this);
        //	this.model.bind('reset', this.render, this);
        //_.bindAll(this, 'render');
        //this.model.bind('add:answers', this.render);
    },
    events: {
        'click .home': 'home'
        //,'click .answer': 'createAnswer',
    },

    home: function(e){
        this.trigger('home');
        e.preventDefault();
    },
    render: function(){
        this.model.getRelations();
        this.model.fetchRelated('answers');
        alert(JSON.stringify(this.model));
        //alert('dfs');//JSON.stringify(this.model.get('answers')));
        $(this.el).html(A.template.detail(this.model.toJSON()));
        var list = new A.view.ansListView({
            collection: this.model.get('answers'),
            el: this.$('#answers')
        });
        list.addAll_();
        //list.bind('all', this.rethrow, this);
        var ansView = new A.view.ansView({
            model: this.model,
            collection: this.model.get('answers'),
            el: this.$('#ansInput')
        });
        return this;
    },
    rethrow: function(){
    this.trigger.apply(this, arguments);
    }
});
A.view.ansView = Backbone.View.extend({
    events: {
        'click .answer': 'createAnswer',
        'keypress #text': 'createOnEnter'
    },
    createOnEnter: function(e){
        if((e.keyCode || e.which) == 13){
            this.createAnswer();
            e.preventDefault();
        }
    },
    createAnswer: function(){
        var text = this.$('#text').val();
        if(text){
            this.collection.create({
                text: text,
                question:this.model
            });
            this.model.save({},{noAjax:true});
            this.$('#text').val('');
        }
    }
});

A.view.InputView = Backbone.View.extend({
    events: {
        'click .question': 'createQuestion',
        'keypress #text': 'createOnEnter'
    },
    createOnEnter: function(e){
        if((e.keyCode || e.which) == 13){
            this.createQuestion();
            e.preventDefault();
        }
    },
    createQuestion: function(){
        var text = this.$('#text').val();
        if(text){
            this.collection.create({
                text: text
            });
            this.$('#text').val('');
        }
    }
});

A.view.ansListView = Backbone.View.extend({
    initialize: function(){
        _.bindAll(this, 'addOne', 'addAll_');
        //this.collection.bind('add', this.addOne);
        vent.bind("answers_add", this.addOne, this);
       // this.collection.bind('change', this.addOne);
        this.collection.bind('reset', this.addAll_, this);
        this.views = [];
    },

    addAll_: function(){
        this.views = [];
        var self = this;
        //alert(JSON.stringify(this.collection))
        this.collection.each(this.addOne);
    },
    render: function() {
        //$(this.el).html(this.template(this.model.toJSON()));
      //  alert('render')
        return this;
    },
    addOne: function(answer){
        var view = new A.view.AnswerView({
            model: answer
        });
        $(this.el).prepend(view.render().el);
        this.views.push(view);
      //  view.bind('all', this.rethrow, this);
    }
//    rethrow: function(){
//        this.trigger.apply(this, arguments);
//    }
});

A.view.ListView = Backbone.View.extend({
    initialize: function(){
        _.bindAll(this, 'addOne', 'addAll');
        vent.bind("questions_add", this.addOne, this);
        vent.bind("reset",this.addAll, this);
//        this.collection.bind('add', this.addOne);
//        this.collection.bind('reset', this.addAll, this);
        this.views = [];
    },
    addAll: function(){
        this.views = [];
        this.collection.each(this.addOne);
    },
    addOne: function(question){
        var view = new A.view.QuestionView({
            model: question
        });
        $(this.el).prepend(view.render().el);
        this.views.push(view);
        view.bind('all', this.rethrow, this);
    }
    ,
    rethrow: function(){
        this.trigger.apply(this, arguments);
    }
});

A.view.ListApp = Backbone.View.extend({
    el: "#app",
    initialize: function(options){
    },
    rethrow: function(){
        this.trigger.apply(this, arguments);
    },

    render: function(){
        $(this.el).html(A.template.list({}));
        var list = new A.view.ListView({
            collection: this.collection,
            el: this.$('#questions')
        });
        list.addAll();
    //    list.bind('all', this.rethrow, this);
        new A.view.InputView({
            collection: this.collection,
            el: this.$('#input')
        });
    }
});

A.view.Router = Backbone.Router.extend({
    routes: {
        '': 'list',
        ':id/': 'detail'
    },
    initialize: function(){
        vent.bind('question_navigate_to',this.navigate_to, this )
    },
    navigate_to: function(model){
        var path = (model && model.get('id') + '/') || '';
        this.navigate(path, {trigger: true});
    },
    detail: function(){
       // alert('detail');
    },
    list: function(){ //go questions lists

    }
});