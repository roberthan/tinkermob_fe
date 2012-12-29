var A = A || {};
A.model = A.model || {};
A.view = A.view || {};

A.view.helper = {
    parseDate: function(timestamp){
        var d = new Date(timestamp);
        if((d- new Date()/(1000*60*60*24*30))>=1){
            return moment(d).format('MMM do YY');
        }
        else{
            return moment(d).fromNow();
        }
    },
    guid: function() {
        if(typeof USER ==='undefined'){
            return ('ANYN'+'-'+new Date().getTime());
        }
        return (USER+'-'+new Date().getTime());
    },
    parseTagLine: function(tagline){
        var temp_list = tagline.split(' ');
        var len=temp_list.length;
        for (var i=0; i<len; i++) {
            var value = temp_list[i];
            if(value.split('')[0]=='#'){
                value=value.substring(1,value.length);
                var new_value='<a href="/tag/'+value+'" class="link_tag">#'+value+'</a>';
                temp_list[i]=new_value;
            }
        }
        return temp_list.join(' ');
    },
    parseTagLine2: function(tagline){
        var temp_list = tagline.split(' ');
        var len=temp_list.length;
        for (var i=0; i<len; i++) {
            var value = temp_list[i];
            if(value.split('')[0]=='#'){
                value=value.substring(1,value.length);
                var new_value='<span href="/tag/'+value+'" class="link_tag">#'+value+'</span>';
                temp_list[i]=new_value;
            }
        }
        return temp_list.join(' ');
    },
    validateEmail: function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },
    validateFile:  function (e){
        var file = e.target.files[0];
        var parts = file.name.split('.');
        var file_ext = parts[parts.length - 1].toLowerCase();
        var valid_ext = ['png','jpg', 'bmp','jpeg','gif']
        //TODO validate file upload
        if(file.size <= 10485760){
            if(valid_ext.indexOf(file_ext)!==-1){
                return true;
            }
            else{
                alert('invalid file type');
                return false;
            }
        }
        else{
            alert('file too big');
            return false;
        }
    },
    cleanS3URL: function(url){
        return url.split('?')[0]
    },
    setPrevURL: function(router){
        var s = window.location.search.split('prev=')
        var path='/';
        if(s.length>1){
            path = s[1];
        }
        router.navigate(path);
    },
    setInfiniteGrid:function(){

    },
    setFollow: function(is_active, user){
        if(typeof is_active === 'undefined'){
            is_active = 1;
        }
        var following = new A.model.supportFollowing();
        var user_id;
        if(user.has('user')){
            user_id=user.get('user');
        }
        else{
            user_id=user.id;
        }
        following.set('user', user_id);
        following.set('is_active', is_active);
        user.set('is_following',is_active,{silent: true});
        app.follows_col.add(following ,{silent: true});
        var temp = app.tinker.owner.get('count_followings');
        if(is_active === 1){
            temp = temp +1;
        }
        else{
            temp = temp - 1;
        }
        app.tinker.owner.set('count_followings', temp);
        //TODO delete itself on save
        return following
    }
}