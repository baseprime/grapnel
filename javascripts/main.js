
$(function(){

    var router = new Grapnel({ pushState : true, root : (window.location.href.match(/github\.io/gi)) ? '/Grapnel.js' : '/' });

    router.get('/docs', function(){
        $('#documentation').show();
        $('#basic-usage').hide();
        $('ul.nav li').removeClass('active').parent().find('li[data-active="documentation"]').addClass('active');
    });

    router.get('/', function(){
        $('#basic-usage').show();
        $('#documentation').hide();
        $('ul.nav li').removeClass('active').parent().find('li[data-active="usage"]').addClass('active');
    });

    $('a[rel]').click(function(e){
        e.preventDefault();
        router.navigate($(this).attr('rel'));
    });

}); 