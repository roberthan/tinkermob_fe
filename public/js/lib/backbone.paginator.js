/*! backbone.paginator - v0.1.54 - 6/30/2012
 * http://github.com/addyosmani/backbone.paginator
 * Copyright (c) 2012 Addy Osmani; Licensed MIT */

Backbone.Paginator = (function ( Backbone, _, $ ) {
    "use strict";

    var Paginator = {};
    Paginator.version = "0.15";

    // @name: clientPager
    //
    // @tagline: Paginator for client-side data
    //
    // @description:
    // This paginator is responsible for providing pagination
    // and sort capabilities for a single payload of data
    // we wish to paginate by the UI for easier browsering.
    //
    Paginator.clientPager = Backbone.Collection.extend({

        // Default values used when sorting and/or filtering.
        initialize: function(){
            this.useDiacriticsPlugin = true; // use diacritics plugin if available
            this.useLevenshteinPlugin = true; // use levenshtein plugin if available

            this.sortColumn = "";
            this.sortDirection = "desc";
            this.lastSortColumn = "";

            this.fieldFilterRules = [];
            this.lastFieldFilterRiles = [];

            this.filterFields = "";
            this.filterExpression = "";
            this.lastFilterExpression = "";
        },

        sync: function ( method, model, options ) {

            var self = this;

            // Create default values if no others are specified
            _.defaults(self.paginator_ui, {
                firstPage: 0,
                currentPage: 1,
                perPage: 5,
                totalPages: 10
            });

            // Change scope of 'paginator_ui' object values
            _.each(self.paginator_ui, function(value, key) {
                if( _.isUndefined(self[key]) ) {
                    self[key] = self.paginator_ui[key];
                }
            });

            // Some values could be functions, let's make sure
            // to change their scope too and run them
            var queryAttributes = {};
            _.each(self.server_api, function(value, key){
                if( _.isFunction(value) ) {
                    value = _.bind(value, self);
                    value = value();
                }
                queryAttributes[key] = value;
            });

            var queryOptions = _.clone(self.paginator_core);
            _.each(queryOptions, function(value, key){
                if( _.isFunction(value) ) {
                    value = _.bind(value, self);
                    value = value();
                }
                queryOptions[key] = value;
            });

            // Create default values if no others are specified
            queryOptions = _.defaults(queryOptions, {
                timeout: 25000,
                cache: false,
                type: 'GET',
                dataType: 'jsonp'
            });

            queryOptions = _.extend(queryOptions, {
                jsonpCallback: 'callback',
                data: decodeURIComponent($.param(queryAttributes)),
                processData: false,
                url: _.result(queryOptions, 'url')
            }, options);

            return $.ajax( queryOptions );

        },

        nextPage: function () {
            this.currentPage = ++this.currentPage;
            this.pager();
        },

        previousPage: function () {
            this.currentPage = --this.currentPage || 1;
            this.pager();
        },

        goTo: function ( page ) {
            if(page !== undefined){
                this.currentPage = parseInt(page, 10);
                this.pager();
            }
        },

        howManyPer: function ( perPage ) {
            if(perPage !== undefined){
                var lastPerPage = this.perPage;
                this.perPage = parseInt(perPage, 10);
                this.currentPage = Math.ceil( ( lastPerPage * ( this.currentPage - 1 ) + 1 ) / perPage);
                this.pager();
            }
        },


        // setSort is used to sort the current model. After
        // passing 'column', which is the model's field you want
        // to filter and 'direction', which is the direction
        // desired for the ordering ('asc' or 'desc'), pager()
        // and info() will be called automatically.
        setSort: function ( column, direction ) {
            if(column !== undefined && direction !== undefined){
                this.lastSortColumn = this.sortColumn;
                this.sortColumn = column;
                this.sortDirection = direction;
                this.pager();
                this.info();
            }
        },

        // setFieldFilter is used to filter each value of each model
        // according to `rules` that you pass as argument.
        // Example: You have a collection of books with 'release year' and 'author'.
        // You can filter only the books that were released between 1999 and 2003
        // And then you can add another `rule` that will filter those books only to
        // authors who's name start with 'A'.
        setFieldFilter: function ( fieldFilterRules ) {
            if( !_.isEmpty( fieldFilterRules ) ) {
                this.lastFieldFilterRiles = this.fieldFilterRules;
                this.fieldFilterRules = fieldFilterRules;
                this.pager();
                this.info();
            }
        },

        // setFilter is used to filter the current model. After
        // passing 'fields', which can be a string referring to
        // the model's field, an array of strings representing
        // each of the model's fields or an object with the name
        // of the model's field(s) and comparing options (see docs)
        // you wish to filter by and
        // 'filter', which is the word or words you wish to
        // filter by, pager() and info() will be called automatically.
        setFilter: function ( fields, filter ) {
            if( fields !== undefined && filter !== undefined ){
                this.filterFields = fields;
                this.lastFilterExpression = this.filterExpression;
                this.filterExpression = filter;
                this.pager();
                this.info();
            }
        },

        // pager is used to sort, filter and show the data
        // you expect the library to display.
        pager: function () {
            var self = this,
                disp = this.perPage,
                start = (self.currentPage - 1) * disp,
                stop = start + disp;

            // Saving the original models collection is important
            // as we could need to sort or filter, and we don't want
            // to loose the data we fetched from the server.
            if (self.origModels === undefined) {
                self.origModels = self.models;
            }

            self.models = self.origModels;

            // Check if sorting was set using setSort.
            if ( this.sortColumn !== "" ) {
                self.models = self._sort(self.models, this.sortColumn, this.sortDirection);
            }

            // Check if field-filtering was set using setFieldFilter
            if ( !_.isEmpty( this.fieldFilterRules ) ) {
                self.models = self._fieldFilter(self.models, this.fieldFilterRules);
            }

            // Check if filtering was set using setFilter.
            if ( this.filterExpression !== "" ) {
                self.models = self._filter(self.models, this.filterFields, this.filterExpression);
            }

            // If the sorting or the filtering was changed go to the first page
            if ( this.lastSortColumn !== this.sortColumn || this.lastFilterExpression !== this.filterExpression || !_.isEqual(this.fieldFilterRules, this.lastFieldFilterRiles) ) {
                start = 0;
                stop = start + disp;
                self.currentPage = 1;

                this.lastSortColumn = this.sortColumn;
                this.lastFieldFilterRiles = this.fieldFilterRules;
                this.lastFilterExpression = this.filterExpression;
            }

            // We need to save the sorted and filtered models collection
            // because we'll use that sorted and filtered collection in info().
            self.sortedAndFilteredModels = self.models;

            self.reset(self.models.slice(start, stop));
        },

        // The actual place where the collection is sorted.
        // Check setSort for arguments explicacion.
        _sort: function ( models, sort, direction ) {
            models = models.sort(function (a, b) {
                var ac = a.get(sort),
                    bc = b.get(sort);

                if ( !ac || !bc ) {
                    return 0;
                } else {
                    /* Make sure that both ac and bc are lowercase strings.
                     * .toString() first so we don't have to worry if ac or bc
                     * have other String-only methods.
                     */
                    ac = ac.toString().toLowerCase();
                    bc = bc.toString().toLowerCase();
                }

                if (direction === 'desc') {

                    // We need to know if there aren't any non-number characters
                    // and that there are numbers-only characters and maybe a dot
                    // if we have a float.
                    if((!ac.match(/[^\d\.]/) && ac.match(/[\d\.]*/)) &&
                        (!bc.match(/[^\d\.]/) && bc.match(/[\d\.]*/))
                        ){

                        if( (ac - 0) < (bc - 0) ) {
                            return 1;
                        }
                        if( (ac - 0) > (bc - 0) ) {
                            return -1;
                        }
                    } else {
                        if (ac < bc) {
                            return 1;
                        }
                        if (ac > bc) {
                            return -1;
                        }
                    }

                } else {

                    //Same as the regexp check in the 'if' part.
                    if((!ac.match(/[^\d\.]/) && ac.match(/[\d\.]*/)) &&
                        (!bc.match(/[^\d\.]/) && bc.match(/[\d\.]*/))
                        ){
                        if( (ac - 0) < (bc - 0) ) {
                            return -1;
                        }
                        if( (ac - 0) > (bc - 0) ) {
                            return 1;
                        }
                    } else {
                        if (ac < bc) {
                            return -1;
                        }
                        if (ac > bc) {
                            return 1;
                        }
                    }

                }

                return 0;
            });

            return models;
        },

        // The actual place where the collection is field-filtered.
        // Check setFieldFilter for arguments explicacion.
        _fieldFilter: function( models, rules ) {

            // Check if there are any rules
            if ( _.isEmpty(rules) ) {
                return models;
            }

            var filteredModels = [];

            // Iterate over each rule
            _.each(models, function(model){

                var should_push = true;

                // Apply each rule to each model in the collection
                _.each(rules, function(rule){

                    // Don't go inside the switch if we're already sure that the model won't be included in the results
                    if( !should_push ){
                        return false;
                    }

                    should_push = false;

                    // The field's value will be passed to a custom function, which should
                    // return true (if model should be included) or false (model should be ignored)
                    if(rule.type === "function"){
                        var f = _.wrap(rule.value, function(func){
                            return func( model.get(rule.field) );
                        });
                        if( f() ){
                            should_push = true;
                        }

                        // The field's value is required to be non-empty
                    }else if(rule.type === "required"){
                        if( !_.isEmpty( model.get(rule.field).toString() ) ) {
                            should_push = true;
                        }

                        // The field's value is required to be greater tan N (numbers only)
                    }else if(rule.type === "min"){
                        if( !_.isNaN( Number( model.get(rule.field) ) ) &&
                            !_.isNaN( Number( rule.value ) ) &&
                            Number( model.get(rule.field) ) >= Number( rule.value ) ) {
                            should_push = true;
                        }

                        // The field's value is required to be smaller tan N (numbers only)
                    }else if(rule.type === "max"){
                        if( !_.isNaN( Number( model.get(rule.field) ) ) &&
                            !_.isNaN( Number( rule.value ) ) &&
                            Number( model.get(rule.field) ) <= Number( rule.value ) ) {
                            should_push = true;
                        }

                        // The field's value is required to be between N and M (numbers only)
                    }else if(rule.type === "range"){
                        if( !_.isNaN( Number( model.get(rule.field) ) ) &&
                            _.isObject( rule.value ) &&
                            !_.isNaN( Number( rule.value.min ) ) &&
                            !_.isNaN( Number( rule.value.max ) ) &&
                            Number( model.get(rule.field) ) >= Number( rule.value.min ) &&
                            Number( model.get(rule.field) ) <= Number( rule.value.max ) ) {
                            should_push = true;
                        }

                        // The field's value is required to be more than N chars long
                    }else if(rule.type === "minLength"){
                        if( model.get(rule.field).toString().length >= rule.value ) {
                            should_push = true;
                        }

                        // The field's value is required to be no more than N chars long
                    }else if(rule.type === "maxLength"){
                        if( model.get(rule.field).toString().length <= rule.value ) {
                            should_push = true;
                        }

                        // The field's value is required to be more than N chars long and no more than M chars long
                    }else if(rule.type === "rangeLength"){
                        if( _.isObject( rule.value ) &&
                            !_.isNaN( Number( rule.value.min ) ) &&
                            !_.isNaN( Number( rule.value.max ) ) &&
                            model.get(rule.field).toString().length >= rule.value.min &&
                            model.get(rule.field).toString().length <= rule.value.max ) {
                            should_push = true;
                        }

                        // The field's value is required to be equal to one of the values in rules.value
                    }else if(rule.type === "oneOf"){
                        if( _.isArray( rule.value ) &&
                            _.include( rule.value, model.get(rule.field) ) ) {
                            should_push = true;
                        }

                        // The field's value is required to be equal to the value in rules.value
                    }else if(rule.type === "equalTo"){
                        if( rule.value === model.get(rule.field) ) {
                            should_push = true;
                        }

                        // The field's value is required to match the regular expression
                    }else if(rule.type === "pattern"){
                        if( model.get(rule.field).toString().match(rule.value) ) {
                            should_push = true;
                        }

                        //Unknown type
                    }else{
                        should_push = false;
                    }

                });

                if( should_push ){
                    filteredModels.push(model);
                }

            });

            return filteredModels;
        },

        // The actual place where the collection is filtered.
        // Check setFilter for arguments explicacion.
        _filter: function ( models, fields, filter ) {

            //  For example, if you had a data model containing cars like { color: '', description: '', hp: '' },
            //  your fields was set to ['color', 'description', 'hp'] and your filter was set
            //  to "Black Mustang 300", the word "Black" will match all the cars that have black color, then
            //  "Mustang" in the description and then the HP in the 'hp' field.
            //  NOTE: "Black Musta 300" will return the same as "Black Mustang 300"

            // We accept fields to be a string, an array or an object
            // but if string or array is passed we need to convert it
            // to an object.

            var self = this;

            var obj_fields = {};

            if( _.isString( fields ) ) {
                obj_fields[fields] = {cmp_method: 'regexp'};
            }else if( _.isArray( fields ) ) {
                _.each(fields, function(field){
                    obj_fields[field] = {cmp_method: 'regexp'};
                });
            }else{
                _.each(fields, function( cmp_opts, field ) {
                    obj_fields[field] = _.defaults(cmp_opts, { cmp_method: 'regexp' });
                });
            }

            fields = obj_fields;

            //Remove diacritic characters if diacritic plugin is loaded
            if( _.has(Backbone.Paginator, 'removeDiacritics') && self.useDiacriticsPlugin ){
                filter = Backbone.Paginator.removeDiacritics(filter);
            }

            // 'filter' can be only a string.
            // If 'filter' is string we need to convert it to
            // a regular expression.
            // For example, if 'filter' is 'black dog' we need
            // to find every single word, remove duplicated ones (if any)
            // and transform the result to '(black|dog)'
            if( filter === '' || !_.isString(filter) ) {
                return models;
            } else {
                var words = filter.match(/\w+/ig);
                var pattern = "(" + _.uniq(words).join("|") + ")";
                var regexp = new RegExp(pattern, "igm");
            }

            var filteredModels = [];

            // We need to iterate over each model
            _.each( models, function( model ) {

                var matchesPerModel = [];

                // and over each field of each model
                _.each( fields, function( cmp_opts, field ) {

                    var value = model.get( field );

                    if( value ) {

                        // The regular expression we created earlier let's us detect if a
                        // given string contains each and all of the words in the regular expression
                        // or not, but in both cases match() will return an array containing all
                        // the words it matched.
                        var matchesPerField = [];

                        if( _.has(Backbone.Paginator, 'removeDiacritics') && self.useDiacriticsPlugin ){
                            value = Backbone.Paginator.removeDiacritics(value.toString());
                        }else{
                            value = value.toString();
                        }

                        // Levenshtein cmp
                        if( cmp_opts.cmp_method === 'levenshtein' && _.has(Backbone.Paginator, 'levenshtein') && self.useLevenshteinPlugin ) {
                            var distance = Backbone.Paginator.levenshtein(value, filter);

                            _.defaults(cmp_opts, { max_distance: 0 });

                            if( distance <= cmp_opts.max_distance ) {
                                matchesPerField = _.uniq(words);
                            }

                            // Default (RegExp) cmp
                        }else{
                            matchesPerField = value.match( regexp );
                        }

                        matchesPerField = _.map(matchesPerField, function(match) {
                            return match.toString().toLowerCase();
                        });

                        _.each(matchesPerField, function(match){
                            matchesPerModel.push(match);
                        });

                    }

                });

                // We just need to check if the returned array contains all the words in our
                // regex, and if it does, it means that we have a match, so we should save it.
                matchesPerModel = _.uniq( _.without(matchesPerModel, "") );

                if(  _.isEmpty( _.difference(words, matchesPerModel) ) ) {
                    filteredModels.push(model);
                }

            });

            return filteredModels;
        },

        // You shouldn't need to call info() as this method is used to
        // calculate internal data as first/prev/next/last page...
        info: function () {
            var self = this,
                info = {},
                totalRecords = (self.sortedAndFilteredModels) ? self.sortedAndFilteredModels.length : self.length,
                totalPages = Math.ceil(totalRecords / self.perPage);

            info = {
                totalUnfilteredRecords: self.origModels.length,
                totalRecords: totalRecords,
                currentPage: self.currentPage,
                perPage: this.perPage,
                totalPages: totalPages,
                lastPage: totalPages,
                previous: false,
                next: false,
                startRecord: totalRecords === 0 ? 0 : (self.currentPage - 1) * this.perPage + 1,
                endRecord: Math.min(totalRecords, self.currentPage * this.perPage)
            };

            if (self.currentPage > 1) {
                info.prev = self.currentPage - 1;
            }

            if (self.currentPage < info.totalPages) {
                info.next = self.currentPage + 1;
            }

            info.pageSet = self.setPagination(info);

            self.information = info;
            return info;
        },


        // setPagination also is an internal function that shouldn't be called directly.
        // It will create an array containing the pages right before and right after the
        // actual page.
        setPagination: function ( info ) {
            var pages = [], i = 0, l = 0;


            // How many adjacent pages should be shown on each side?
            var ADJACENT = 3,
                ADJACENTx2 = ADJACENT * 2,
                LASTPAGE = Math.ceil(info.totalRecords / info.perPage),
                LPM1 = -1;

            if (LASTPAGE > 1) {
                // not enough pages to bother breaking it up
                if (LASTPAGE < (7 + ADJACENTx2)) {
                    for (i = 1, l = LASTPAGE; i <= l; i++) {
                        pages.push(i);
                    }
                }
                // enough pages to hide some
                else if (LASTPAGE > (5 + ADJACENTx2)) {

                    //close to beginning; only hide later pages
                    if (info.currentPage < (1 + ADJACENTx2)) {
                        for (i = 1, l = 4 + ADJACENTx2; i < l; i++) {
                            pages.push(i);
                        }
                    }

                    // in middle; hide some front and some back
                    else if (LASTPAGE - ADJACENTx2 > info.currentPage && info.currentPage > ADJACENTx2) {
                        for (i = info.currentPage - ADJACENT; i <= info.currentPage + ADJACENT; i++) {
                            pages.push(i);
                        }
                    }
                    // close to end; only hide early pages
                    else {
                        for (i = LASTPAGE - (2 + ADJACENTx2); i <= LASTPAGE; i++) {
                            pages.push(i);
                        }
                    }
                }
            }

            return pages;
        }

    });


    // @name: requestPager
    //
    // Paginator for server-side data being requested from a backend/API
    //
    // @description:
    // This paginator is responsible for providing pagination
    // and sort capabilities for requests to a server-side
    // data service (e.g an API)
    //
    Paginator.requestPager = Backbone.Collection.extend({

        sync: function ( method, model, options ) {

            var self = this;

            // Create default values if no others are specified
            _.defaults(self.paginator_ui, {
                firstPage: 0,
                currentPage: 1,
                perPage: 5,
                totalPages: 10
            });

            // Change scope of 'paginator_ui' object values
            _.each(self.paginator_ui, function(value, key) {
                if( _.isUndefined(self[key]) ) {
                    self[key] = self.paginator_ui[key];
                }
            });

            // Some values could be functions, let's make sure
            // to change their scope too and run them
            var queryAttributes = {};
            _.each(self.server_api, function(value, key){
                if( _.isFunction(value) ) {
                    value = _.bind(value, self);
                    value = value();
                }
                queryAttributes[key] = value;
            });

            var queryOptions = _.clone(self.paginator_core);
            _.each(queryOptions, function(value, key){
                if( _.isFunction(value) ) {
                    value = _.bind(value, self);
                    value = value();
                }
                queryOptions[key] = value;
            });

            // Create default values if no others are specified
            queryOptions = _.defaults(queryOptions, {
                timeout: 25000,
                cache: false,
                type: 'GET',
                dataType: 'jsonp'
            });

            queryOptions = _.extend(queryOptions, {
                jsonpCallback: 'callback',
                data: decodeURIComponent($.param(queryAttributes)),
                processData: false,
                url: _.result(queryOptions, 'url')
            }, options);

            return $.ajax( queryOptions );

        },

        requestNextPage: function ( options ) {
            if ( this.currentPage !== undefined ) {
                this.currentPage += 1;
                return this.pager( options );
            } else {
                var response = new $.Deferred();
                response.reject();
                return response.promise();
            }
        },

        requestPreviousPage: function ( options ) {
            if ( this.currentPage !== undefined ) {
                this.currentPage -= 1;
                return this.pager( options );
            } else {
                var response = new $.Deferred();
                response.reject();
                return response.promise();
            }
        },

        updateOrder: function ( column ) {
            if (column !== undefined) {
                this.sortField = column;
                this.pager();
            }

        },

        goTo: function ( page, options ) {
            if ( page !== undefined ) {
                this.currentPage = parseInt(page, 10);
                return this.pager( options );
            } else {
                var response = new $.Deferred();
                response.reject();
                return response.promise();
            }
        },

        howManyPer: function ( count ) {
            if( count !== undefined ){
                this.currentPage = this.firstPage;
                this.perPage = count;
                this.pager();
            }
        },

        sort: function () {
            //assign to as needed.
        },

        info: function () {

            var info = {
                // If parse() method is implemented and totalRecords is set to the length
                // of the records returned, make it available. Else, default it to 0
                totalRecords: this.totalRecords || 0,

                currentPage: this.currentPage,
                firstPage: this.firstPage,
                totalPages: this.totalPages,
                lastPage: this.totalPages,
                perPage: this.perPage
            };

            this.information = info;
            return info;
        },

        // fetches the latest results from the server
        pager: function ( options ) {
            if ( !_.isObject(options) ) {
                options = {};
            }
            return this.fetch( options );
        }


    });

    return Paginator;

}( Backbone, _, jQuery ));