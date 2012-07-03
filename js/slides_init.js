$(".slider").click(function(){
	$(this).next().toggle('normal').css('left', $(this).position().left).css('top', $(this).position().bottom);
}).next().hide();
$('#toc').html('<h2>Table of Contents</h2>');
var $toc = $('<table>').append('<caption>Table of Contents</caption>');
var number = 0;
$('.slide-wrapper>.slide').each(function(){
	var inner = $(this).children('.inner');
	inner.children('section').children().first().filter('h1,h2,h3,h4')
	  .wrap('<header></header>').parent().insertBefore(inner);
	var title = $(this).children('header').text();
	var class_ = $(this).children('header').children().is('h2,h3,h4')?' class="sub" ':'';
	$(this).children('footer').find('.slide_num').text(number);
	number += 1;
	if (title) {
		$toc.append('\
			<tr id="toc-row-'+number+'"'+class_+'>\
			<th><a href="#slide'+number+'">'+title+'</a></th>\
			<td><a href="#slide'+number+'">'+(number-1)+'</a></td>\
			</tr>'
		);
	}
});
$toc.appendTo('#toc');

var slide_comment = function (){
	$('#slide_comment').slideToggle();
}

$(document).ready(function(){
	$(document).everyTime(1000, function(i) {
	  $('.timer').text(i);
	});
	$(document).keydown(function(ev){
		if (ev.which == 69) { // e
			slide_comment();
			return false;
		}
	});
})

// TODO:
// 1. beautiful timer and page number solution
// 2. custom titlepage
