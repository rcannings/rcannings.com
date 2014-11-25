/*
 * This file contain all the scripts related to the posts functions of Zenzero
 *
 */
(function($) {
    "use strict";

    /*
     * Dynamically load disqus comments
     */
    var get_disqus_num_replies = function() {
        // YOU NEED TO CHANGE 'zenzero' WITH THE NAME OF YOUR BLOG
        var disqus_shortname = 'zenzero';
        // Please do not change anything except the name of the blog
        var links = document.getElementsByTagName('a');
        var query = '?';
        for (var i = 0; i < links.length; i++) {
            if (links[i].href.indexOf('#disqus_thread') >= 0) {
                query += 'url' + i + '=' + encodeURIComponent(links[i].href) + '&';
            }
        }
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = '//' + disqus_shortname + '.disqus.com/get_num_replies.js' + query;
        var body = document.getElementsByTagName('body')[0];
        body.appendChild(s);
    };

    /*
     * This class handle all the posts related functions
     *
     */
    var PostHandler = function() {

        this.$post = $('.post');
        this.$pagination = $("[data-paginationurl]");
        this.$tagMenu = $('.menu-list-tag:not(.single-post-tags)');
        this.$container = $('.post-container');
        this.tagMenuHeight = 41; // .view-menu height If you change the .view-menu, maybe you will need to change this value
        this.postCount = 0;
        this.postPerPage = 0;
        this.pageCount = 0;
        this.actualPage = 1;
        this.showedPost = 0;
        this.paginationUrl = '';
        this.allPosts = [];
        this.postQueue = [];
        this.tags = [];
        this.filter = '';
        this.allFilter = '';

        var self = this;

        /*
         * Check if there is the pagination element
         *
         * @returns {Bool}
         *
         */
        function checkPagination() {
            return (self.$pagination.length > 0);
        }

        /*
         * If there is the pagination, load other pages url and the total number of pages
         *
         */
        function setPaginationData() {
            self.postCount = self.postPerPage = self.$post.length;
            if (checkPagination) {
                self.paginationUrl = self.$pagination.attr('data-paginationurl');
                self.pageCount = self.$pagination.attr('data-pagecount');
            }
        }
        /*
         * Make an ajax call to load a new page; if the call is successful, addPost() function is called with the result
         *
         * @param {String} The url of the page to load
         * @param {Integer} The page number
         * @param {Function} Function to be called after all posts have been preloaded
         *
         */
        function ajaxCall(url, page, callback) {
            var request = $.ajax({
                url: url,
                type: "GET",
                dataType: "html"
            });

            request.done(function(html) {
                var postObj,
                    post = $(html).find('.post');

                addPost(post, page, callback);
            });

            request.fail(function(jqXHR, textStatus) {
                alert("Request failed: " + textStatus);
            });
        }

        /*
         * Is there is more than one page, preload all the posts using ajaxCall() function
         * @param {Function} Function to be called after all posts have been preloaded
         *
         */
        function ajaxPreload(loadedCallback) {
            if (checkPagination()) {
                var urlAr = self.paginationUrl.split('/'),
                    p = -1,
                    newUrl;

                for (var i = urlAr.length - 1; i >= 0; i--) {
                    if (parseInt(urlAr[i], 10) > 1) {
                        p = i;
                    }
                }

                for (var j = parseInt(urlAr[p], 10); j <= self.pageCount; j++) {
                    urlAr[p] = j;
                    newUrl = urlAr.join('/');
                    if (j == self.pageCount && typeof loadedCallback === 'function'){
                        ajaxCall(newUrl, j, loadedCallback);
                    }
                    else{
                        ajaxCall(newUrl, j);
                    }
                }
            } else {
                $('.pagination').hide();
                if (typeof loadedCallback === 'function')
                    loadedCallback();
            }
        }

        /*
         * Add the post's tags to the tag menu, checking that are no duplicated values
         *
         * @param {Object} JQuery object of a post
         *
         */

        function setPostTags($post) {

            var res = [],
                term;

            $post.find('.hidden-tag-list li').each(function(index, el) {
                term = $(el).text();
                res.push(term);
                if (self.tags.indexOf(term) < 0) {
                    self.tags.push(term);
                    self.$tagMenu.append('<li><a href="#" data-tag="' + term + '">' + term + '</a></li>');
                }
            });

            return res;
        }

        /*
         * Fetch the post object and add it to the preloaded collection
         *
         * @param {Array} List of html of all post loaded inside a single
         * @param {Integer} Page number
         * @param {Function} Function to be called after all posts have been preloaded
         *
         */
        function addPost(posts, page, callback) {
            var postObj;
            $.each(posts, function(index, val) {
                postObj = {
                    page: page,
                    html: val,
                    classes: setPostTags($(val))
                };
                self.allPosts.push(postObj);
            });
            
            if (typeof callback === 'function') {
                callback();
            }
        }

        /*
         * Refresh the $post collection and its lenght
         *
         */
        function updateShowedPostCount() {
            self.$post = $('.post');
            self.showedPost = self.$post.length;
        }

        /*
         * Append a post to the page
         *
         * @param {Object} Post object to append
         *
         */
        function appendPost(post) {
            var $pst = $(post.html).hide();
            self.$container.append($pst).append('<hr>');
            $pst.fadeIn('slow');
            checkMedia();
            get_disqus_num_replies();
        }

        /*
         * Check if the post contains a image or an Iframe and add a class to the post
         *
         */
        function checkMedia() {
            $('.post').each(function(index, val) {
                if ($(val).find('.post-image iframe, .post-image img').length > 0) {
                    $(val).addClass('has-image');
                } else {
                    $(val).addClass('no-image');
                }
            });
        }

        //Public methods

        /*
         * Constructor; it sets all the elements and preload all the posts
         *
         */
        this.init = function() {
            setPaginationData();
            var allTagTxt = $('.btn-select').text(),
                $allTagEl = $('<li><a href="#" data-tag="' + allTagTxt + '">' + allTagTxt + '</a></li>').hide();
            self.allFilter = allTagTxt;
            self.filter = allTagTxt;
            self.$tagMenu.append($allTagEl);
            addPost(self.$post, 1);
            updateShowedPostCount();
            ajaxPreload(function() {
                self.tagMenuHeight = self.$tagMenu.height();
                self.$tagMenu.css({
                    height: 0
                });
            });

            checkMedia();
            get_disqus_num_replies();

            if ($('.single-post-tags li').length === 0) {
                $('.post-content-tag').hide();
            }
        };

        /*
         * Load another page, depending on which tag filter is active
         *
         */
        this.loadPage = function() {
            if (self.filter === self.allFilter) {
                if (self.actualPage < self.pageCount) {
                    var $pst;
                    self.actualPage++;
                    $.each(self.allPosts, function(index, val) {
                        if (val.page == self.actualPage) {
                            appendPost(val);
                        }
                    });
                    updateShowedPostCount();
                    if (self.actualPage >= self.pageCount) {
                        self.$pagination.hide();
                    }
                }
            } else {
                updateShowedPostCount();
                if (self.postQueue.length >= self.showedPost) {
                    self.actualPage++;
                    for (var i = self.showedPost; i < self.postQueue.length; i++) {
                        appendPost(self.postQueue[i]);
                    }
                    updateShowedPostCount();
                    if (self.showedPost >= self.postQueue.length) {
                        self.$pagination.hide();
                    }
                }
            }
            // This event is fired to be catched by optimizeGrid.js (see that file form more infos)
            self.$container.trigger("customChange");
        };

        /*
         * Display the tag menu list
         *
         */
        this.showTags = function() {
            self.$tagMenu.animate({
                height: self.tagMenuHeight
            }, 200);
        };

        /*
         * Hide the tag menu list
         *
         */
        this.hideTags = function() {
            self.$tagMenu.animate({
                height: 0
            }, 200);
        };

        /*
         * Combine showTags and hideTags method; mainly used to be attached to touch events
         *
         */
        this.showHideTags = function() {
            if (self.$tagMenu.css('height') === 0) {
                showTags();
            } else {
                hideTags();
            }
        };

        /*
         * Filter the displayed posts hiding posts without the selected tag
         *
         * @param {String} The tag to use for filtering
         */
        this.filterPosts = function(tag) {
            self.filter = tag;
            self.postQueue = [];
            self.$container.html('');

            $('.btn-select').text(tag);
            self.$tagMenu.find('li').show();
            $('[data-tag="' + tag + '"]').parent('li').hide();

            $.each(self.allPosts, function(index, el) {
                if (el.classes.indexOf(tag) >= 0 || tag === self.allFilter) {
                    self.postQueue.push(el);
                    if (self.postQueue.length <= (self.postPerPage * self.actualPage)) {
                        appendPost(el);
                    }
                }
            });
            updateShowedPostCount();
            if (self.showedPost >= self.postQueue.length) {
                self.$pagination.hide();
            } else {
                self.$pagination.show();
            }
            self.$container.trigger("customChange");
        };
    };



    $(document).ready(function() {
        // Script initialization
        var poster = new PostHandler();
        poster.init();
        // Load more posts
        $('.load-more-post').on('click', function(e) {
            e.preventDefault();
            poster.loadPage();
        });
        // Tag menu visibility for mouse events
        $('.btn-select').on('mouseenter', poster.showTags);
        $('.menu-list-tag').on('mouseleave', poster.hideTags);
        // Tag menu visibility for touch events
        $('.btn-select, .menu-list-tag').on('tap', poster.showHideTags);
        // Filter menu events
        $(document).on('click', '.menu-list-tag a', function(e) {
            e.preventDefault();
            poster.filterPosts($(this).attr('data-tag'));
        });
    });
}(jQuery));