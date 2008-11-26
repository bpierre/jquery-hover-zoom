;(function($){
/*
 * jQuery Hover Zoom 0.2
 *
 * Copyright (c) 2008-2009, Pierre Bertet, http://www.pierrebertet.net
 * Licensed under the MIT (MIT-LICENSE.txt) License.
 */
 
/*
 * TODO
 *
 * - Gestion manuelle du show / hide pour le preview
 * - Gestion de l'opacité simplifiée (sans animation)
 * - Définition globale des paramètres ( jQuery.hoverzoom.settings = {} )
 * - Possibilité d'ajouter un délai avant l'ouverture et la fermeture du preview
 * - Load de la vignette si pas IE, sinon window.load
 */

// Hover Zoom
$.fn.hoverzoom = function( oSettings ) {
	
	var oSettings = $.extend({
		preload: false,
		previewCursor: "simple",
		customPreviewElt: '<div class="hoverzoom-preview"></div>',
		loadingClass: "hoverzoom-loading",
		customInsert: function(jPreview, jLink) {
			jLink.after(jPreview);
		},
		onMouseEnter: function(){},
		onMouseLeave: function(){}
	}, oSettings);
	
	var bUseCursor = (!!oSettings.previewCursor && (oSettings.previewCursor == "simple" || oSettings.previewCursor == "mask"));
	
	return this.each(function() {
		
		var jLink = $(this);
		var jThumb = jLink.find("img:first");
		var jPreview = $( oSettings.customPreviewElt );
		var jPreload;// = $( '<img src="' + jLink.attr("href") + '" style="position:absolute;left:-9999px">' );
		var jCursor;
		var bIsLoaded = false;
		var hover = false;
		
		var nWidthRatio, nHeightRatio,
			nPreviewWidth, nPreviewHeight,
			nImgWidth, nImgHeight,
			nThumbWidth, nThumbHeight,
			nCursorWidth, nCursorHeight,
			nThumbPosX, nThumbPosY,
			nMouseX, nMouseY = 0;
		
		// Insert Preview Element
		oSettings.customInsert( jPreview, jLink );
		
		// Hide Preview Element
		jPreview.addClass(oSettings.loadingClass).hide();
		
		// Prevent default click event
		jLink.click(function(e) { e.preventDefault() });
		
		// Preload ?
		if (oSettings.preload) initLoading();
		
		// Thumb load event
		//jThumb.load(function(){
		$(window).load(function(){
			
			// Thumb
			nThumbWidth = jThumb.width();
			nThumbHeight = jThumb.height();
			
			// Set display:block to thumb
			jThumb.css("display", "block");
			
			// Style link to fit thumb dimensions
			jLink.css({
				position: "relative",
				display: "block",
				width: nThumbWidth + "px",
				overflow: "hidden"
			})
			
			// Hover events
			.hover(
				
				// On mouse enter
				function() {
					
					hover = true;
					
					// Add "hover" class
					jThumb.addClass("hover");
					
					// Get thumb offset
					nThumbPosX = jThumb.offset().left;
					nThumbPosY = jThumb.offset().top;
					
					// Show cursor ?
					if (bUseCursor && bIsLoaded) {
						jCursor.show();
						
					} else if (!oSettings.preload && !bIsLoaded) {
						initLoading(); // Load image
					}
					
					jLink.bind("mousemove", onMouseMove);
					
					// Custom mouseenter function
					oSettings.onMouseEnter({"link": jLink, "thumb": jThumb, "preview": jPreview, "cursor": jCursor, "preload": jPreload});
					
					// Show image
					jPreview.show();
				},
				
				// On mouse leave
				function() {
					
					hover = false;
					
					jLink.unbind("mousemove");
					
					if (bUseCursor && bIsLoaded) jCursor.hide();
					
					jThumb.removeClass("hover");
					
					jPreview.hide();
					
					// Custom mouseleave function
					oSettings.onMouseLeave({"link": jLink, "thumb": jThumb, "preview": jPreview, "cursor": jCursor, "preload": jPreload});
				}
			);
		});
		
		// On "mousemove" event
		function onMouseMove(e) {
			
			// Mouse position
			nMouseX = e.pageX || nMouseX;
			nMouseY = e.pageY || nMouseY;
			
			// Preview position
			var nPreviewPosX = -( ( (nMouseX - nThumbPosX) * nWidthRatio ) - nPreviewWidth/2 );
			var nPreviewPosY = -( ( (nMouseY - nThumbPosY) * nHeightRatio ) - nPreviewHeight/2 );
			
			// Cursor position
			if (bUseCursor) {
				var nCursorPosX = e.pageX - nThumbPosX - nCursorWidth/2;
				var nCursorPosY = e.pageY - nThumbPosY - nCursorHeight/2;
			}
			
			// X limit
			if ( nPreviewPosX > 0 ) { // left
				nPreviewPosX = nCursorPosX = 0;
				
			} else if ( nPreviewPosX < ( nPreviewWidth - nImgWidth ) ) { // right
				nPreviewPosX = -nImgWidth + nPreviewWidth;
				if (bUseCursor) nCursorPosX = Math.ceil(nThumbWidth - nCursorWidth);
			}
			
			// Y limit
			if ( nPreviewPosY > 0 ) { // top
				nPreviewPosY = nCursorPosY = 0;
				
			} else if ( nPreviewPosY < ( nPreviewHeight - nImgHeight ) ) { // bottom
				nPreviewPosY = -nImgHeight + nPreviewHeight;
				if (bUseCursor) nCursorPosY = Math.ceil(nThumbHeight - nCursorHeight);
			}
			
			// Set preview position
			jPreview.css("backgroundPosition", nPreviewPosX + "px " + nPreviewPosY + "px");
			
			// Cursor
			if (bIsLoaded && bUseCursor) {
				
				// Set cursor position ( "simple" )
				if (oSettings.previewCursor == "simple") {
					jCursor.css({
						left: nCursorPosX + "px",
						top: nCursorPosY + "px"
					});
				
				// Set cursor clip ( "mask" )
				} else if (oSettings.previewCursor == "mask") {
					jCursor.css("clip", "rect("+ nCursorPosY + "px " + (nCursorPosX + nCursorWidth) + "px " + (nCursorPosY + nCursorHeight) + "px " + nCursorPosX + "px)");
				}
			}
			
		};
		
		// Init image loading
		function initLoading() {
			
			jPreload = $( '<img src="' + jLink.attr("href") + '" style="position:absolute;left:-9999px">' )
			
			// Image load event
			.load(function() {
				
				// Apply background to preview element
				jPreview.css("background", "url(" + jLink.attr("href") + ") no-repeat");
				
				// Preview element
				nPreviewWidth = jPreview.width();
				nPreviewHeight = jPreview.height();
				
				// Big image
				nImgWidth = jPreload.width();
				nImgHeight = jPreload.height();
				
				// Ratio
				nWidthRatio = nImgWidth / nThumbWidth;
				nHeightRatio = nImgHeight / nThumbHeight;
				
				// Remove loaded image
				jPreload.remove();
				
				// Remove loading class
				jPreview.removeClass(oSettings.loadingClass);
				
				// Insert preview cursor ?
				if (bUseCursor) {
					
					nCursorWidth = nPreviewWidth/nWidthRatio;
					nCursorHeight = nPreviewHeight/nHeightRatio;
					
					// Style cursor
					jCursor = $('<span></span>').appendTo( jLink.css("position", "relative") ).css({
						position: "absolute",
						top: 0,
						left: 0,
						display: "none"
					});
					
					// "simple"
					if (oSettings.previewCursor == "simple") {
						jCursor.css({
							width: nCursorWidth,
							height: nCursorHeight
						});
						
					// "mask"
					} else if (oSettings.previewCursor == "mask") {
						jCursor.css({
							width: nThumbWidth,
							height: nThumbHeight,
							background: "url("+ jThumb.attr("src") +") no-repeat"
						});
					}
					
					if (hover) {
						jCursor.show();
					}
					
				}
				
				// Image loaded
				bIsLoaded = true;
			})
			
			// Append to body
			.appendTo("body");
		};
		
	});
};

})(jQuery);