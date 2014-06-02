
/************************************
 * HIDDEN WIDGET DETECTION
 * ***********************************/

//bring the current widget to the front
function bringToFront(element){
	var highestZ = 0;
	//for each sorter
	$('.column > .sorter').map(function(){
		//find highest zIndex
		var thisZ = $(this).css("z-index");
		if (thisZ != 'auto') {
			thisZ = thisZ - 0;
			highestZ = (thisZ > highestZ) ? thisZ : highestZ;
		}
		//else skip. 'auto' represents the newly dropped element 				
	});
		//set the highest index
		element.css("z-index", highestZ+1);
}

//detect hidden widgets given a tabContentId
function detectHiddenWidgets(tabContentId){
		var stepX = 0;
		var stepY = 0;
		//the grid for ray tracing is predefined. Detection will work as long as a widget is never smaller the quadGRID_x and quadGRID_y
		var quadGRID_X = 112.5; //1/4th standard widget length
		var quadGRID_Y = 75; //1/3rd standard widget height
		var quadrantArea = quadGRID_X * quadGRID_Y; 
		var col = $('.column');
		
		//set step to middle of the first quadrant
		stepX = col.offset().left + (quadGRID_X/2);
		stepY = col.offset().top  + (quadGRID_Y/2);
		
		//get all widgets
		var widgetsInLayout = getAllWidgetsDetectInTab(tabContentId);
		
		if(widgetsInLayout.length > 0){
			//step through each quadrant
			for (stepY; stepY < (col.offset().top + col.height()); stepY = stepY + quadGRID_Y) {
				for (stepX; stepX < (col.offset().left + col.width()); stepX = stepX + quadGRID_X) {
					
					//test if each widget is in this quadrant
					var inQuad = new Array();
					for(var wObj in widgetsInLayout){
						if( isWidgetInQuadrant(stepX, stepY, widgetsInLayout[wObj]) ){
							inQuad.push( widgetsInLayout[wObj] );
						}
					}
					//find hidden widgets
					//sort from lowest to highest z-index
					inQuad = inQuad.sort(function(a,b){ return a.zIndex - b.zIndex});
					if ((inQuad.length - 1) > 0) {//if there is only 1 widget in this quadrant, then it is visible
						//for each hidden widget (do not use last index in array, because that widget is visible)
						for (var i = 0; i < (inQuad.length - 1); i++) {
							//subtract the area of this quadrant from the detected widget
							inQuad[i].area = inQuad[i].area - quadrantArea;
						}
						
						//merge
						$.extend(false, widgetsInLayout, inQuad);
					}
				}
				//reset stepX to beginning of the next row
				stepX = col.offset().left + (quadGRID_X/2);
			}
			
			//determine if any widgets are completely hidden (their areas are <= 0)
			for(var wObj in widgetsInLayout){
				//is widget completely hidden
				if(widgetsInLayout[wObj].area <= 0){
						//delete it
						//IE fix. use tabContentId as scope, otherwise IE6 cannot correctly find parent
						$("#" + widgetsInLayout[wObj].id, $("#"+tabContentId)).remove();
						//alert("deleting: "+widgetsInLayout[wObj].id);
				}
			}
			
		}//else
		//no hidden widgets, do nothing
}
//widget objects, used for hidden detection
function widgetDetectObj(id, left, top, right, bottom, width, height, zIndex)
{
	this.id=id;
	this.left=left;
	this.top=top;
	this.right=right;
	this.bottom=bottom;
	this.zIndex=zIndex;
	this.width = (width == undefined)? right - left : width;
	this.height =(height == undefined)? bottom - top: height;
	this.area = this.width * this.height;
}
//get all the widgets in the current .column
function getAllWidgetsDetect(){
	var widgetsInLayout = new Array();
	var i=0;
	$('.column > .sorter').map(function(){
		var aWidget = $(this);
		var wObj = new widgetDetectObj(
				aWidget.attr("id"), 
				aWidget.offset().left, 
				aWidget.offset().top, 
				aWidget.offset().left+$(this).width(), 
				aWidget.offset().top+$(this).height(),
				$(this).width(),
				$(this).height(),
				(aWidget.css("z-index") - 0)
			);
		
		widgetsInLayout[i] = wObj;
		i++;
	});
	return widgetsInLayout;
}

//get all the widgets in the given #tabContent
function getAllWidgetsDetectInTab(tabContentId){
	var widgetsInLayout = new Array();
	var i=0;
	var isNotDisplayed = false;
	//is this tab hidden
	if($("#"+tabContentId).parent().css("display") == "none"){
		isNotDisplayed = true;
	}
	
	$("#"+tabContentId+" > .sorter").map(function(){
		var aWidget = $(this);
		var wObj = null;
		
		if(isNotDisplayed){
			//widget has display:none so it has no offset params 
			//create a clone
			var cloned = $(this).clone()
                      .attr("id", false)
					  .html("") //remove inner html for faster deletion
                      .css({visibility:"hidden", display:"block", position:"absolute"});
			
			$("#tabContent"+currentlySelectedTab()).append(cloned);
			//set offset params
			wObj = new widgetDetectObj(
				aWidget.attr("id"), //save original id
				cloned.offset().left, 
				cloned.offset().top, 
				cloned.offset().left + cloned.width(), 
				cloned.offset().top + cloned.height(),
				cloned.width(),
				cloned.height(),
				(cloned.css("z-index") - 0)
			);
			
			cloned.remove();
		}else{
			wObj = new widgetDetectObj(
				aWidget.attr("id"), 
				aWidget.offset().left, 
				aWidget.offset().top, 
				aWidget.offset().left+$(this).width(), 
				aWidget.offset().top+$(this).height(),
				$(this).width(),
				$(this).height(),
				(aWidget.css("z-index") - 0)
			);
		}
		
		widgetsInLayout[i] = wObj;
		i++;
	});
	return widgetsInLayout;
}

function isWidgetInQuadrant(stepX, stepY, wObj){
	if(
		(stepX > wObj.left &&	stepX < wObj.right) 
		&&
		(stepY > wObj.top  &&  stepY < wObj.bottom)
	){
		return true;			
	}//else
	return false;
}

var configUILoaded = 1;