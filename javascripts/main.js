
$(function(){

    var router = new Grapnel.Router();

    router.get('docs', function(){
        $('#documentation').show();
        $('#basic-usage').hide();
        $('ul.nav li').removeClass('active').parent().find('li[data-active="documentation"]').addClass('active');
    });

    router.get('usage', function(){
        $('#basic-usage').show();
        $('#documentation').hide();
        $('ul.nav li').removeClass('active').parent().find('li[data-active="usage"]').addClass('active');
    });

    if(!router.state){
        router.anchor.set('usage');
    }
}); 