var express = require('express'),
    path = require("path"),
    app = express.createServer(),
    io = require('socket.io').listen(app, {
        'log level':1
    }),
    jade = require('jade'),
    _ = require('underscore')._
    ,request = require('request')
    , passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , FacebookStrategy = require('passport-facebook').Strategy
    ,MemoryStore = express.session.MemoryStore
    ,sessionStore = new MemoryStore()
    ,redis = require("redis")
    ,pubClient = redis.createClient()
    ,http = require('http')
    ,fs = require('fs')
    ,stylus = require('stylus')
//    ,models = require('./models/models')
;

var parseCookie = require('connect').utils.parseCookie;
var FACEBOOK_APP_ID = "375972762439949"
var FACEBOOK_APP_SECRET = "e8c0ba9548d4bb0e78d8e0e1679768e0";
var API_SERVER_URL = "http://api.tinkermob.com";
//var API_SERVER_URL = "http://ec2-107-22-76-107.compute-1.amazonaws.com:8000";
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
    console.log('serial: '+user);
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    console.log('deserial: '+obj);
    var auth={};
    done(null, obj);
});

// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new FacebookStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: "/auth/facebook/callback",
        passReqToCallback:true
    },
    function(req,accessToken, refreshToken, profile, done) {
        var auth={};
        auth.auth_header='?';
        if (req.user){
            auth.user=req.user.user;
            auth.api_key=req.user.api_key;
            auth.auth_header = '?userid='+auth.user+'&api_key='+auth.api_key+'&';
        }
        request(
            {
                method: 'POST'
                , uri: API_SERVER_URL+"/api/v1/social/"+auth.auth_header
                , json: profile
            }
            , function (error, response, body) {
                console.log(response.statusCode);
                if(typeof response==='undefined'){
                    return done(null, false, { message: 'Server Error' });
                }
                if(response.statusCode === 200 || response.statusCode === 201 || response.statusCode === 202){
                    console.log(body)
                    return done(null, body);
                } else {
                    console.log(body);
                    return done(null, false, { message: 'Unknown user' });
                }
            }
        );
    }
));

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, username, password, done) {
        var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
        var url = API_SERVER_URL+"/auth";
        var method = 'GET'
        var headers = {
            "Authorization" : auth
        }
        var form = {};
        if(req.body.new_user==='1'){
            url = API_SERVER_URL+"/auth/join";
            method = 'POST';
            headers = {};
            form = {
                email:username,
                password:password
            }
        }
        else if(typeof req.query.uid !=='undefined'){
            url = API_SERVER_URL+"/password/"+username+'-'+password+'/';
            method = 'GET';
            headers = {};
            form = {}
        }
        request(
            {
                method: method,
                uri: url,
                headers : headers,
                form : form
            }
            , function (error, response, body) {
                if(typeof response==='undefined'){
                    return done(null, false, { message: 'Server Error' });
                }
                if(response.statusCode === 200){
                    var body_object = JSON.parse(body);
                    return done(null, body_object);
                } else {
                    return done(null, false, { message: 'Unknown user' });
                }
            }
        );
    }
));

app.configure(function(){
//setup middleware
    app.use(express.logger());
    app.use(express.bodyParser({ keepExtensions: true }));
    //if(config.debug){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    //}
    //else{
    //    app.use(express.errorHandler());
    //}
    app.use(express.cookieParser());
    app.use(express.session({ secret: "keyboard cat", key: 'express.sid', store: sessionStore }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(stylus.middleware({
        force: true,
        src: __dirname + '/stylus',     // .styl files are located in `views/stylesheets`
        dest: __dirname + '/public',   // .styl resources are compiled `/stylesheets/*.css`
        compile: function(str, path) {
            return stylus(str)
                .set('filename', path)
                .set('warn', true)
                .set('compress', true);
        }
    }));

    //setup public static dir
    app.use(express.static(path.join(__dirname, '.', 'public/')));
    //for session
    app.dynamicHelpers({
        session: function (req, res) {
            return req.session;
        }
    });
});

//configure express to use jade
app.set('view engine', 'jade');
app.set('view options', {layout: false});

//app.get('/*.(js|css|png)', function(req, res){
//    res.sendfile('./'+req.url);
//});
// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
// /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook',{scope:['email']}));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
        failureRedirect: '/login#fail' }));

app.get('/login', function(req, res){
    res.render('login', {img_path:'/img'});
});

//app.get('/tes', function(req, res){
//    var p='{"provider":"facebook","id":"1036290190","username":"robert.han","displayName":"Robert Han","name":{"familyName":"Han","givenName":"Robert"},"gender":"male","profileUrl":"http://www.facebook.com/robert.han","emails":[{"value":"roberthan818@gmail.com"}]}'
//    var profile = JSON.parse(p);
//    var auth={};
//    auth.auth_header='?';
//    if (req.user.user){
//        auth.user=req.user.user;
//        auth.api_key=req.user.api_key;
//        auth.auth_header = '?userid='+auth.user+'&api_key='+auth.api_key+'&';
//        console.log(auth.auth_header)
//        console.log(profile);
//    }
//    request(
//        {
//            method: 'POST'
//            , uri: API_SERVER_URL+"/api/v1/social/"+auth.auth_header
//            , json: profile
//        }
//        , function (error, response, body) {
//            console.log(error);
//            if(response.statusCode === 200){
//                res.send(body);
//            }
//            res.send(body);
//        }
//    );
//});

app.post('/login',
    passport.authenticate('local', { successRedirect: '/',
        failureRedirect: '/login#fail',
        failureFlash: true })
);

app.get('/password/*',
    passport.authenticate('local', { successRedirect: '/settings',
        failureRedirect: '/login#failrest',
        failureFlash: true })
);

app.post('/join',
    passport.authenticate('local', { successRedirect: '/',
        failureRedirect: '/login#join',
        failureFlash: true })
);

app.get('/api/*', function(req, res){
    var auth_header = '';
    if(typeof req.user === 'object'){
        auth_header='?userid='+req.user.user+'&api_key='+req.user.api_key;
    }
    request(
        { method: 'GET'
            , uri: API_SERVER_URL+cleanUri(req.url,auth_header)
      //      , json: data.body
            ,headers: {}
        }
        , function (error, response, body) {
//            var resData={};
            var resData = body||{};
//            resData.url=data.url;
//            resData.method = 'read';
            if(_.has(response,'statusCode')){
                resData.status=response.statusCode;
                if(response.statusCode <= 300 && response.statusCode >= 200){
                    res.send(resData);
                }
                else{
                    res.send(body);
                }
            }
            else {
                res.send(body);
//                console.log('oops: '+response.statusCode)
                console.log(error)
            }
        }
    );
});
app.post('/api/*', function(req, res){
    var auth_header = '';
    if(typeof req.user === 'object'){
        auth_header='?userid='+req.user.user+'&api_key='+req.user.api_key;
    }
    request(
        { method: 'POST'
            , uri: API_SERVER_URL+cleanUri(req.url,auth_header)
            , json: req.body
        }
        , function (error, response, body) {
            if(_.isUndefined(response)){
                console.log(error);
                res.status(500).send(body);
            }
            else{
                res.status(response.statusCode).send(body);
            }
        }
    );
});
app.put('/api/*', function(req, res){
    var auth_header = '';
    if(typeof req.user === 'object'){
        auth_header='?userid='+req.user.user+'&api_key='+req.user.api_key;
    }
    request(
        {
            method: 'PUT'
            , uri: API_SERVER_URL+cleanUri(req.url,auth_header)
            , json: req.body
        }
        , function (error, response, body) {
            if(_.isUndefined(response)){
                console.log(error)
                res.status(500).send(body);
            }
            else{
                res.status(response.statusCode).send(body);
            }
        }
    );
});
app.get('/auth/*', function(req, res){
    request(
        { method: 'GET'
            , uri: API_SERVER_URL+req.url
      //      , json: data.body
        }
        , function (error, response, body) {
//            var resData = body||{};
            if(_.has(response,'statusCode')){
//                resData.statusCode=response.statusCode;
                res.status(response.statusCode).send(body);
            }
            else {
                res.status(500).send(body);
            }
        }
    );
});
app.post('/auth/reset', function(req, res){
    request(
        { method: 'POST'
            , uri: "API_SERVER_URL/password/reset/",
            form: {email:req.body.email}
        }
        , function (error, response, body) {
            if(typeof response !=='undefined'){
                res.send(response.statusCode);
            }else{
                res.status(500).send(body);
            }
        }
    );
});

//app.get('/auth', function(req, res){
//    var auth = 'Basic ' + new Buffer('ubuntu' + ':' + 'test').toString('base64');
//    request(
//        {
//            method: 'GET'
//            , uri: "API_SERVER_URL/auth",
//            headers : {
//                "Authorization" : auth
//            }
//        }
//        , function (error, response, body) {
//            if(response.statusCode < 300 && response.statusCode >= 200){
//                var body_object = JSON.parse(body);
//                var cookies = {}
//                response.headers['set-cookie'][0].split(';').forEach(function( cookie ) {
//                    var parts = cookie.split('=');
//                    cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
//                });
//                body_object.sessionid = cookies.sessionid;
////                return done(null, body[0].api_key);
//                res.send(body_object);
//            } else {
//                res.send(body);
////                return done(null, false, { message: 'Unknown user' });
//            }
//        }
//    );
//
//});

app.get('/', function(req, res){
    if(_.isUndefined(req.user)){
        res.render('index', { user:'', auth_key:'', img_path:'/img'});
    }
    else{
        res.render('index', { user:req.user.user, username:req.user.username, auth_key: req.user.auth_key, img_path:'/img' });
    }
});
app.get('/idea/*', function(req, res){
    if(_.isUndefined(req.user)){
        res.render('index', { user:'', auth_key:'', img_path:'/img'});
    }
    else{
        res.render('index', { user: req.user.user, username:req.user.username,auth_key: req.user.auth_key, img_path:'/img' });
    }
});

app.get('/tag/*', function(req, res){
    if(_.isUndefined(req.user)){
        res.render('index', { user:'', auth_key:'', img_path:'/img'});
    }
    else{
        res.render('index', { user: req.user.user, username:req.user.username,auth_key: req.user.auth_key, img_path:'/img' });
    }
});
app.get('/user/*', function(req, res){
    if(_.isUndefined(req.user)){
        res.render('index', { user:'', auth_key:'', img_path:'/img'});
    }
    else{
        res.render('index', { user: req.user.user,username:req.user.username,auth_key: req.user.auth_key,  img_path:'/img' });
    }
});

app.get('/my-ideas', function(req, res){
    if(_.isUndefined(req.user)){
        res.render('index', { user:'', auth_key:'', img_path:'/img'});
    }
    else{
        res.render('index', { user: req.user.user, username:req.user.username,auth_key: req.user.auth_key, img_path:'/img' });
    }
});

app.get('/settings', function(req, res){
    if(_.isUndefined(req.user)){
        res.render('index', { user:'', auth_key:'', img_path:'/img'});
    }
    else{
        res.render('index', { user: req.user.user, username:req.user.username, auth_key: req.user.auth_key, img_path:'/img' });
    }
});

app.get('/logout', function(req, res){
    req.logOut();
//    var url = "API_SERVER_URL/auth/logout";
//    var method = 'GET'
//    request(
//        {
//            method: method,
//            uri: url
//        }
//        , function (error, response, body) {
//            res.send(response);
//        }
//    );
    res.redirect('/');
});

//function ensureAuthenticated(req, res, next) {
//    if (req.isAuthenticated()) { return next(); }
//    res.redirect('/login')
//}

app.listen(80);

io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['express.sid'];
        // (literally) get the session data from the session store
        sessionStore.get(data.sessionID, function (err, session) {
            if (err || !session) {
                // if we cannot grab a session, turn down the connection
                console.log('CONNECTION DECLINED')
//                accept(null, true);
                accept('Error', false);
            } else {
                // save the session data and accept the connection
//                console.log('session: '+JSON.stringify(session));
                data.session = session;
                accept(null, true);
            }
        });
    } else {
        return accept('No cookie transmitted.', false);
    }
});
//io.sockets.on('connection', function (socket) {
//    console.log('A socket with sessionID ' + socket.handshake.session.passport.user
//        + ' connected!');
//});

io.sockets.on('connection', function (socket) {
    var auth={};
    auth.auth_header='?';
    if(!_.isUndefined(socket.handshake.session.passport.user)){
        var obj = socket.handshake.session.passport.user;
        auth.username=obj.username;
        auth.user=obj.user;
        auth.api_key=obj.api_key;
        auth.auth_string = 'ApiKey ' + new Buffer(auth.username + ':' + auth.api_key).toString('base64');
        auth.auth_header = '?userid='+auth.user+'&api_key='+auth.api_key+'&';
        //new redis sub-client
        var subClient=redis.createClient();
        subClient.psubscribe(auth.username+'*');
        subClient.on("pmessage", function (pattern, channel, message) {
//            console.log("("+  pattern +")" + " client1 received message on " + channel + ": " + message);
            if(auth.username+':'+socket.id!==channel){
//                console.log('triggered'+message);
                socket.emit('revised',JSON.parse(message));
            }
        });
        socket.on('disconnect', function() {
            subClient.punsubscribe();
            subClient.end();
        });
    }
    socket.on('marco', function(data) {
        socket.emit('polo',data);
    });
    socket.on('create', function (data) {
        data = JSON.parse(data);
        request(
            {
                method: 'POST'
                , uri: API_SERVER_URL+cleanUri(data.url,auth.auth_header)
                , json: data.body
            }
            , function (error, response, body) {
                var resData={};
                resData.responseText=body;
                resData.url=data.url;
                resData.method = 'create';
                if(!_.isUndefined(response)){
                    resData.status=response.statusCode;
                    if(response.statusCode === 201){
                        if(_.has(auth,'username')){
                            pubClient.publish(auth.username+':'+socket.id,JSON.stringify(resData));
                        }
                    }
                    else{
                        resData.error = body;
                    }
                    socket.emit('success', resData);
//                    console.log(body)
//                    socket.emit('success', body);
//                    else{
//                        socket.emit('success', resData);
//                    }
                }
                else {
                    console.log('oops: '+response.statusCode)
                }
            }
        );
    });
    socket.on('update', function (data) {
        if(auth.auth_header!=='?'){
            data = JSON.parse(data);
            request(
                {
                    method: 'PUT'
                    , uri: API_SERVER_URL+cleanUri(data.url,auth.auth_header)
                    , json: data.body
                }
                , function (error, response, body) {
                    var resData={};
                    resData.responseText=body;
                    resData.url=data.url;
                    resData.method = 'update';
                    if(!_.isUndefined(error)){
                        resData.error = error;
                    }
                    if(!_.isUndefined(response)){
                        resData.status=response.statusCode;
                        if(response.statusCode === 202){
                            if(_.has(auth,'username')){
                                pubClient.publish(auth.username+':'+socket.id,JSON.stringify(resData));
                            }
                        }
                        else{
                            resData.error = body;
                        }
                        socket.emit('success', resData);
                    }
                    else {
                        socket.emit('success', body);
//                        console.log(error)
                    }
                }
            );
        }
        else{
            console.log('not authorized');
        }
    });
    socket.on('read', function (data) {
        data = JSON.parse(data);
//        console.log('hihi'+auth.auth_header);
//        console.log(API_SERVER_URL+cleanUri(data.url,auth.auth_header));
        request(
            { method: 'GET'
                , uri: API_SERVER_URL+cleanUri(data.url,auth.auth_header)//'?username=ubuntu&api_key=f9746a2eac5bf4e1&')
//                , json: data.body
            }
            , function (error, response, body) {
                var resData={};
                resData.responseText=body;
                resData.url=data.url;
                resData.method = 'read';
//                console.log('oops: '+response.statusCode)
                if(!_.isUndefined(response)){
                    resData.status=response.statusCode;
                    if(response.statusCode === 200){
//                        socket.emit('revised', response);
//                        socket.emit('success', resData);
                        if(response.statusCode >= 200){
                            resData.responseText= body.replace('api_key='+auth.api_key,'');
                        }
                    }
                    else{
                        resData.error = body;
                    }
                    socket.emit('success',resData);
                }
                else {
                    socket.emit('success', body);
//                    console.log(error)
                }
            }
        );
    });
});
var cleanUri = function(url, auth){
    if(url.indexOf("?")===-1){
        return url+auth;
    }
    else{
        return url+auth.replace("?","&");
    }
}