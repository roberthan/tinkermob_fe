jQuery(function( $ ){
    $(document).ready(function(){
        if(window.location.hash.indexOf('reset')!==-1) {
            $('#form_login').hide();
            $('#form_join').hide();
            $('#form_reset_password').show();
        }
        else if(window.location.hash.indexOf('join')!==-1) {
            $('#form_login').hide();
            $('#form_join').show();
            $('#form_reset_password').hide();
        }
        if(window.location.hash.indexOf('fail')!==-1) {
            $('.text_warning').text('Oops, no account matched this email/username and password pair');
        }
        $('#btn_reset_form_show').click(function(){
            $('#form_login').hide();
            $('#form_join').hide();
            $('#form_reset_password').show();
        });
        $('.btn_login_form_show').click(function(){
            $('#form_reset_password').hide();
            $('#form_join').hide();
            $('#form_login').show();
        });
        $('#btn_join_form_show').click(function(){
            $('#form_reset_password').hide();
            $('#form_login').hide();
            $('#form_join').show();
        });
        $('#btn_login_submit').click(function(){
            $('.text_warning').text('');
            var email_input = $('#form_login .txt_email').val();
            if(email_input===''){
                $('#form_login .txt_email').addClass('warning_placeholder').focus().blur();
                $('.text_warning').text('Please enter your email or username');
                return false;
            }
            if($('#form_login .txt_password').val()===''){
                $('#form_login .txt_password').addClass('warning_placeholder').focus().blur();
                $('.text_warning').text('Please enter your password');
                return false;
            }
            $('#form_login.auth_form').submit();
        });
        $('#btn_join_submit').click(function(e){
            $('.text_warning').text('');
            e.preventDefault();
            var email_input = $('#form_join .txt_email').val();
            if(!A.view.helper.validateEmail(email_input)){
                $('#form_join .txt_email').addClass('warning_placeholder').focus().blur();
                $('.text_warning').text('Oops, it seems your email is invalid');
                return false;
            }
            if($('#form_join .txt_password').val()===''){
                $('#form_join .txt_password').addClass('warning_placeholder').focus().blur();
                $('.text_warning').text('Please enter your password');
                return false;
            }
            $.ajax({
                url: '/auth/is_unique?email='+email_input,
                success: function(data, textStatus, jqXHR){
                    var res_data = JSON.parse(data)[0];
                    if(_.isObject(res_data)){
                       if(res_data.email===false){
                           $('#form_join .txt_email').addClass('warning_placeholder').focus().blur();
                           $('.text_warning').text('That email address is already in use');
                       }
                       else{
                           $('#form_join.auth_form').submit();
                       }
                    }
                    return false;
                }
            });
        });
        $('#btn_reset_submit').click(function(){
            $('.text_warning').text('');
            var email_input= $('#form_reset_password').find('.txt_reset_email').val();
            if(!A.view.helper.validateEmail(email_input)){
                $('#form_reset_password .txt_reset_email').addClass('warning_placeholder').focus().blur();
                $('.text_warning').text('Oops, it seems your email is invalid');
                return false;
            }
            $.ajax({
                type: "POST",
                url: '/auth/reset',
                data: $('#form_reset_password.auth_form').serialize(), // serializes the form's elements.
                success: function(data){
                    $('.text_warning').text('Please check your email to reset password');
                },
                error: function(data){
                    $('.text_warning').text('Please check your email to reset password');
                }
            });
            return false;
        })
        $('#btn_fb_auth').click(function(){
            window.location ='/auth/facebook';
        });
        $('#btn_twitter_auth').click(function(){
            window.location ='/auth/twitter';
        });
    });
});
