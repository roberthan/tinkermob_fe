Backbone.dragAndDrop =  Backbone.Marionette.ItemView.extend({
    initializeDragnDrop: function(){
        this.$el.attr("draggable", "true")
        this.$el.bind("dragstart", _.bind(this._dragStartEvent, this));
        this.$el.bind("dragover", _.bind(this._dragOverEvent, this));
        this.$el.bind("dragenter", _.bind(this._dragEnterEvent, this));
        this.$el.bind("dragleave", _.bind(this._dragLeaveEvent, this));
        this.$el.bind("drop", _.bind(this._dropEvent, this));
        this._draghoverClassAdded = false;
        this.in_motion=false
    },
    _dragStartEvent: function (e) {
        var data
        if (e.originalEvent) e = e.originalEvent
//        e.dataTransfer.effectAllowed = "move" // default to copy
        data = this.dragStart(this, e);
        window._backboneDragDropObject = null;
        if (data !== undefined) {
            window._backboneDragDropObject = data; // we cant bind an object directly because it has to be a string, json just won't do
        }
    },
    dragStart: function (dataTransfer, e) {
//        var temp = this.$el.find('.pic').attr('class').replace('pic ','');
        return dataTransfer;//dataTransfer;
    }, // override me, return data to be bound to drag

    _dragOverEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent
        var data = this._getCurrentDragData(e);
        if (this.dragOver(data, e.dataTransfer, e) !== false) {
            if (e.preventDefault) e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'; // default
        }
    },

    _dragEnterEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent;
        if (e.preventDefault) e.preventDefault();
        //remove existing placeholder
        if(this.in_motion===false){
            this.$el.addClass("dnd_draghover");
            var d =document.createElement('div');
            var data = this._getCurrentDragData(e);
            this.$el.parent().find('.dnd_placeholder').remove();
            var temp_class = data.$el.find('.pic').attr('class').replace('pic ','');
            var placeholder = $(d).addClass('snap_tile dnd_placeholder '+temp_class).attr("draggable", "true");

//        debugger;
            this.$el.before(placeholder);
//            .bind("drop", _.bind(this._dropEvent, this))
//            placeholder.bind('dragenter', this._dropEvent, false);
//            placeholder.bind('dragover', _.bind(this._dummyDropTest, this));
            placeholder.bind("drop", this._dummyDropEvent(data));
//            placeholder.get()[0].addEventListener('drop', this._dummyDropEvent, false);
//            placeholder.on("dragend", this._dummyDropEvent(this));
//        this.$el.hide();
            $('#snap_list').masonry('reload');
            this.in_motion = true;
            var self = this;
            var a = setTimeout(function(){
                self.in_motion=false;
            },350);
        }
//        }
    },

    _dragLeaveEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent
        var data = this._getCurrentDragData(e);
        this.dragLeave(data, e.dataTransfer, e);
//        this.$el.parent().find('.dnd_placeholder').remove();
    },

    _dropEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent
        var data = this._getCurrentDragData(e);
        if (e.preventDefault) e.preventDefault()
        if (e.stopPropagation) e.stopPropagation() // stops the browser from redirecting
        if (this._draghoverClassAdded) this.$el.removeClass("dnd_draghover");
        this.drop(data, this, e);
    },

    _dummyDropEvent: function (data) {
        if(data === this){
            return 1;
        }
        var dataTransfer = this;
        if(_.isObject(dataTransfer)){
//            debugger;

//            data.$el.detach();
            data.$el.parent().find('.dnd_placeholder').replaceWith(data.$el);
//            data.$el.remove();
            $('#snap_list').masonry('reload');
//            data.$el.fadeOut(20, function() {
//                dataTransfer.$el.before(data.$el);
//                data.$el.fadeIn(500);
//            });
            var old_ordering=data.model.get('ordering');//old ordering
            var new_ordering=dataTransfer.model.get('ordering');//new ordering
            data.model.set('ordering',new_ordering,{silent:true});//old ordering
            data.model.save();
            data.model.collection.reorder(old_ordering,new_ordering);//);

            if(old_ordering > new_ordering){
            }
            else{
//                data.model.collection.reorder(new_ordering-1,old_ordering);//);
            }
        }
//        var data = this._getCurrentDragData(e);
//        if (e.originalEvent) e = e.originalEvent;
//        if (e.preventDefault) e.preventDefault()
//        if (e.stopPropagation) e.stopPropagation() // stops the browser from redirecting
//        if (this._draghoverClassAdded) this.$el.removeClass("dnd_draghover");
//        this.drop(data, this, e);
    },
    _dummyDropTest: function (e) {
        console.log('Test')
    },

    _getCurrentDragData: function (e) {
        var data = null;
        if (window._backboneDragDropObject) data = window._backboneDragDropObject
        return data;
    },

    dragOver: function (data, dataTransfer, e) { // optionally override me and set dataTransfer.dropEffect, return false if the data is not droppable

        this._draghoverClassAdded = true;
    },

    dragLeave: function (data, dataTransfer, e) { // optionally override me
//        data.$el.show();
        if (this._draghoverClassAdded) this.$el.removeClass("dnd_draghover")
    },

    drop: function (data, dataTransfer, e) {
        if(data === dataTransfer){
            return 1;
        }
        if(_.isObject(dataTransfer)){
//            debugger;
            data.$el.detach();
            dataTransfer.$el.before(data.$el);
            $('#snap_list').masonry('reload');
//            data.$el.fadeOut(20, function() {
//                dataTransfer.$el.before(data.$el);
//                data.$el.fadeIn(500);
//            });
            data.$el.parent().find('.dnd_placeholder').remove();
            var old_ordering=data.model.get('ordering');//old ordering
            var new_ordering=dataTransfer.model.get('ordering');//new ordering
            data.model.set('ordering',new_ordering,{silent:true});//old ordering
            data.model.save();
            data.model.collection.reorder(old_ordering,new_ordering);//);

            if(old_ordering > new_ordering){
            }
            else{
//                data.model.collection.reorder(new_ordering-1,old_ordering);//);
            }
        }
    } // override me!  if the draggable class returned some data on 'dragStart' it will be the first argument
});