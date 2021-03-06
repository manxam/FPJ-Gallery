//if (data.length != 0) {
$(function(){

	// Global variables that hold state

	var page = 0,
		per_page = 100,
		photo_default_size = 120,
		picture_width = photo_default_size,
		picture_height = photo_default_size,
		max_w_photos, max_h_photos
		//data = [];

	// Global variables that cache selectors

	var win = $(window),
		loading = $('#loading'),
		gallery = $('#gallery');

	// Fetch all the available images with 
	// a GET AJAX request

	/*$.get('load.php', function(response){

		// response.data holds the photos

		data = response.data;

		// Trigger our custom data-ready event
		gallery.trigger('data-ready');

	});*/

	// Redraw the photos on screen
	gallery.on('data-ready window-resized page-turned', function(event, direction){

		var cache = [],
			deferreds = [];

		gallery.trigger('loading');

		// The photos that we should be showing on the new screen
		var set = data.slice(get_page_start(), get_page_start() + get_per_page());

		$.each(set, function(){

			// Create a deferred for each image, so
			// we know when they are all loaded
			deferreds.push($.loadImage(this.thumb));

			// build the cache
			cache.push('<a href="' + this.large + '" class="swipebox"' +
						'style="width:' + picture_width + 'px;height:' + picture_height + 'px;background-image:url(' + this.thumb + ')">'+
						'</a>');
		});

		if(is_prev_page()){
			cache.unshift('<a class="prev" style="width:' + picture_width + 'px;height:' + picture_height + 'px;"></a>');
		}

		if(is_next_page()){
			cache.push('<a class="next" style="width:' + picture_width + 'px;height:' + picture_height + 'px;"></a>');
		}

		if(!cache.length){
			// There aren't any images
			return false;
		}

		// Call the $.when() function using apply, so that 
		// the deferreds array is passed as individual arguments.
		// $.when(arg1, arg2) is the same as $.when.apply($, [arg1, arg2])

		$.when.apply($, deferreds).always(function(){

			// All images have been loaded!

			if(event.type == 'window-resized'){

				// No need to animate the photos
				// if this is a resize event

				gallery.html(cache.join(''));
				show_photos_static();

				// Re-initialize the swipebox
				$('#gallery .swipebox').swipebox();

			}
			else{

				// Create a fade out effect
				gallery.fadeOut(function(){

					// Add the photos to the gallery
					gallery.html(cache.join(''));

					if(event.type == 'page-turned' && direction == 'br'){
						show_photos_with_animation_br();
					}
					else{
						show_photos_with_animation_tl();
					}

					// Re-initialize the swipebox
					$('#gallery .swipebox').swipebox();

					gallery.show();

				});
			}

			gallery.trigger('loading-finished');
		});

	});


	gallery.on('loading',function(){
		// show the preloader
		loading.show();
	});

	gallery.on('loading-finished',function(){
		// hide the preloader
		loading.hide();
	});

	gallery.on('click', '.next', function(){
		page++;
		gallery.trigger('page-turned',['br']);
	});

	gallery.on('click', '.prev', function(){
		page--;
		gallery.trigger('page-turned',['tl']);
	});

	
	// Monitor window resizing or changing device orientation
	win.on('resize', function(e){

		var width = $("#gallery").innerWidth(),
			height = $(window).height() - 100,
            //height = $(window).height() - $("div.navbar.navbar-top").height(),
            gallery_width, gallery_height,
			difference;
        //document.write(height);
        //document.write(width);

		// How many photos can we fit on one line?
		max_w_photos = Math.ceil(width/photo_default_size);

		// Difference holds how much we should shrink each of the photos
		difference = (max_w_photos * photo_default_size - width) / max_w_photos;

		// Set the global width variable of the pictures.
		picture_width = Math.ceil(photo_default_size - difference);

		// Set the gallery width
		gallery_width = max_w_photos * picture_width;

		// Let's do the same with the height:

		max_h_photos = Math.ceil(height/photo_default_size);
		difference = (max_h_photos * photo_default_size - height) / max_h_photos;
		picture_height = Math.ceil(photo_default_size - difference);
		gallery_height = max_h_photos * picture_height;

		// How many photos to show per page?
		per_page = max_w_photos*max_h_photos;

		// Resize the gallery holder
		gallery.width(gallery_width).height(gallery_height);

		gallery.trigger('window-resized');

	}).resize();

	function show_photos_static(){

		// Show the images without any animations
		gallery.find('a').addClass('static');

	}

	function show_photos_with_animation_tl(){

		// Animate the images from the top-left

		var photos = gallery.find('a');

		for(var i=0; i<max_w_photos + max_h_photos; i++){

			var j = i;

			// Loop through all the lines
			for(var l = 0; l < max_h_photos; l++){

				// If the photo is not of the current line, stop.
				if(j < l*max_w_photos) break;

				// Schedule a timeout. It is wrapped in an anonymous
				// function to preserve the value of the j variable

				(function(j){
					setTimeout(function(){
						photos.eq(j).addClass('show');
					}, i*50);
				})(j);

				// Increment the counter so it points to the photo
				// to the left on the line below

				j += max_w_photos - 1;
			}
		}
	}

	function show_photos_with_animation_br(){

		// Animate the images from the bottom-right

		var photos = gallery.find('a');

		for(var i=0; i<max_w_photos + max_h_photos; i++){

			var j = per_page - i;

			// Loop through all the lines
			for(var l = max_h_photos-1; l >= 0; l--){

				// If the photo is not of the current line, stop.
				if(j > (l+1)*max_w_photos-1) break;

				// Schedule a timeout. It is wrapped in an anonymous
				// function to preserve the value of the j variable

				(function(j){
					setTimeout(function(){
						photos.eq(j).addClass('show');
					}, i*50);
				})(j);

				// Decrement the counter so it points to the photo
				// to the right on the line above

				j -= max_w_photos - 1;
			}
		}
	}

	/* Helper functions */

	function get_per_page(){

		// How many pictures should be shown on current page

		// The first page has only one arrow,
		// so we decrease the per_page argument with 1
		if(page == 0){
			return per_page - 1;
		}

		// Is this the last page?
		if(get_page_start() + per_page - 1 > data.length - 1){
			// It also has 1 arrow.
			return per_page - 1;
		}

		// The other pages have two arrows.
		return per_page - 2;
	}

	function get_page_start(p){

		// Which position holds the first photo
		// that is to be shown on the give page

		if(p === undefined){
			p = page;
		}

		if(p == 0){
			return 0;
		}

		// (per_page - 2) because the arrows take up two places for photos
		// + 1 at the end because the first page has only a next arrow.

		return (per_page - 2)*p + 1;
	}

	function is_next_page(){

		// Should we show the next arrow?

		return data.length > get_page_start(page + 1);
	}

	function is_prev_page(){

		// Should we show the previous arrow?

		return page > 0;
	}

});
//}
//else {
//    alert("Sorry, no people currently share those tags. Returning...")
//    //window.location = "/pictures/tags/"
//}