(function ($) {
	"use strict";

	/*
	* Dynamically set the url to share
	*/
	function setShareUrl(){
		var twitterUrl = 'http://twitter.com/share?text={title}&url={url}'.replace('{url}',window.location).replace('{title}',encodeURIComponent(document.title).replace(/%20/g,'+'));
		var facebookUrl = 'https://www.facebook.com/sharer/sharer.php?u={url}'.replace('{url}',window.location);
		var googleUrl = 'https://plus.google.com/share?url={url}'.replace('{url}',window.location);

		$('a.icon-twitter').attr('href',twitterUrl);
		$('a.icon-facebook').attr('href',facebookUrl);
		$('a.icon-google-plus').attr('href',googleUrl);

	}

	/*
	* Check and set the active page
	*/
	function checkPageActive(){
		var pageName = window.location.pathname.replace(/\//g,'');
		if(pageName){
			$('.cont-top-nav > ul > li > a').each(function() {
				if($(this).attr('href').indexOf(pageName) >= 0){
					$(this).addClass('active');
				} else {
					$(this).removeClass('active');
				}
			});
		}
	}
	/*
	* Hide the h5 tag inside the detail, when there are no tag
	*/
	function hideTagTitle(){
		if($('.single-post-tags li').length === 0){
			$('.single-post-content-tag').hide();
		}
	}
	/*
	* Animate the page to scroll smoothly to an element
	*
	* @param {String} elementSelector Css selector of the element
	*
	*/
	function smoothScrollTo(elementSelector){
		var topOffset = $(elementSelector).offset().top,
			speed = 1500;
		$('body, html').animate({
			scrollTop: topOffset
		}, speed,removeHash);
	}
	/*
	* Remove the hash from the address bar
	*
	*/
	function removeHash(){
		history.pushState('', document.title, window.location.pathname);
	}
	/*
	* Add a CSS3 animation class to an element only when it's in the viewport.
	* The class is taken from the attribute data-animate.
	* es: data-animate='className' become class='className' when in viewport
	*
	*/
	function animateClasses(){
		var top = $(window).scrollTop()+$(window).height();
		$('[data-animate]').each(function(){
			if($(this).offset().top < top){
				$(this).addClass($(this).attr('data-animate'));
			}
		});
	}
	/*
	* Calculate the optmal position for every post
	*/
	function optimize(){
		if($('.post-container').hasClass('grid-cont-post')){
			var $el,
				containerW = $('.post-container').outerWidth(),
				actualW = 0,
				actualH = 0,
				totalH = 0,
				w,h,
				cols = [0,0],
				l = 0;

			$('.post-container .post').each(function(index, el) {
				$el = $(el);
				w = $el.outerWidth(true);
				h = $el.outerHeight(true);
				l = (cols[0] > cols[1]) ? 1 : 0;
				if(l === 0){
					$el.css({left : 0,top: cols[0]});
					cols[0] += h;
				} else {
					$el.css({left : actualW,top: cols[1]});
					cols[1] += h;
				}
				actualW = w;
				
				totalH = (cols[0] > cols[1]) ? cols[0] : cols[1];
			});
			$('.post-container').css({height : totalH});
		} else {
			$('.post').animate({
				top: 0,
				left: 0},
				600, function() {
				$('.post-container').height('auto');
			});
			
			$('.post-container hr').not(':last-child').show();
			$('.post-container hr:last-child').hide();
		}
		$('.post-container').animate({opacity : 1},1000,function(){
			$(".post").fitVids();
		});
	}
	
	$(document).ready(function(){
		checkPageActive();
		hideTagTitle();
		$(".post").fitVids();
		setShareUrl();
		// Start CSS3 visible animations
		animateClasses();
		/*
		* Events handlers
		*/
		// Click on the arrow will make the page scroll and hide the header image
		$('.arrow-header').on('click',function(e){
			e.preventDefault();
			smoothScrollTo('#blog');
		});
		// same thing will happen when the Blog anchor in the menu is clicked (only when we allready are in the blog page)
		$('.cont-top-nav a').on('click',function(e){
			if($(this).attr('href').indexOf('#blog') >= 0 && $(this).hasClass('active')){
				e.preventDefault();
				smoothScrollTo('#blog');
			}
		});
		// CSS3 animation applied when elements become visibles
		$(window).on('scroll',animateClasses);


		// Set grid view active
		$('.grid-view').on('click',function(e){
			e.preventDefault();
			$('.post-container').css({opacity : 0});
			$(this).addClass('grid-view-active');
			$('.list-view').removeClass('list-view-active');
			$('.post-container').removeClass('list-cont-post').addClass('grid-cont-post').trigger( "customChange");
		});
		// Set list view active
		$('.list-view').on('click',function(e){
			e.preventDefault();
			$('.post-container').css({opacity : 0});
			$(this).addClass('list-view-active');
			$('.grid-view').removeClass('grid-view-active');
			$('.post-container').addClass('list-cont-post').removeClass('grid-cont-post').trigger( "customChange");
		});
		// Prepare the post container for the loading animation
		$('.post-container').css({opacity : 0});
		// When something happen (es: a post is loaded) , we need to re-optimize the posts position
		$('.post-container').on('customChange',function(){
			optimize();
		});
		// We re-optimize the posts position alse when document size change
		$(document).on('resize',function(){
			optimize();
		});
	});
	
	$(window).load(function(){
		// When the page is fully loaded, hide the hash.
		// We use window.onload event, because removing the hash when document.onready is fired would prevent the page from
		// change the offset
		removeHash();
		// We wait untill all the images are loaded to optimize the posts position
		optimize();
	});
}(jQuery));