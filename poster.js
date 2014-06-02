

//load posters
function showPosters(){
	//get posters
	ajaxLoadPosters(function(returned_text){
		var postersJson = JSON.parse(returned_text);
		global.postersJson = postersJson;

		if(postersJson.length > 0){
			//build html for pics
			buildPictures(postersJson);
			//applay hover and roatation to pics
			setUpPics();
			//set up lazy loading funcaitonality
			setUpLazyLoad();
			//build global hash
			buildGlobalHash();
		}
		//set up search even if nothing returns
		setUpSearchBar($("#searchBar"));
	});	
}



function setUpPics(){
	//set a random rotation angle
	$(".pic").each(function(){
		//rand between 1 and 3
		var rotate = Math.floor((Math.random()*3)+1);
		//rand between 0 and 1
		var cc = Math.floor(Math.random()*2);
		cc = (cc == 1)? "cc" : "";
		
		var zIndex = Math.floor((Math.random()*10)+1);
		
		//set rotate class with num and cc (counter clockwise), and zIndex
		var cssClass = 'rotate'+rotate+cc;
		$(this).addClass(cssClass).css("z-index",zIndex).attr("zIndex",zIndex);
	});
	$(".pic").hover(function(){
		$(this).addClass('noRotation').addClass('highlightPic').css("z-index",99);
	},function(){
		var originalZindex = $(this).attr("zIndex");
		$(this).removeClass('noRotation').removeClass('highlightPic').css("z-index",originalZindex-0);
	});
}

function setUpLazyLoad()
{
	$('.lazy').lazyload({
			//Required
			onLoad: function($this){
			}
	});
	//force loading for current viewport
	$('.lazy').trigger('scroll');
}

function setUpFBox(){
	$(".fancy").fancybox({
	    	openEffect	: 'elastic',
	    	closeEffect	: 'elastic',
	    	 helpers:  {
		        overlay : { locked: false },/*keep page from resiszing when using bootstrap responsive ui*/
		        title	: { type : 'inside' }
		    },
		    beforeLoad: function() {
		    	//set width and height manually TODO:will probably have to edit source. it ignore this
		    	
		    	//set the title with info about the event
		    	//TODO: get the attr id and look it up in the json
		    	var id = $(this.element).attr('posterId');
		    	var posterInfo = global["id"+id];
		    	var $info = buildInfo(posterInfo);
		    	//set fbox titla
		    	this.title = $info.html();		    	
		    },
		    afterShow: function(){
		    	//set up edit button
		    	var id = $(this.element).attr('posterId');
		    	var posterInfo = global["id"+id];
		    	setUpEditButton(posterInfo);
		    }
	    });
}

function setUpLocationDropDown(){
	ajaxGetCities(function(returned_text){
		var locationJson = JSON.parse(returned_text);
		if(locationJson.length>0){
			$("#cityState").attr('locationID',locationJson[0].id).html(locationJson[0].city+', '+locationJson[0].state+'<b class="caret"><\/b>');	
		}
		$("#morePlaces").click(function(){
			_gaq.push(['_trackEvent', 'Feature', 'Click', 'More Cities Coming']);
		})
	});		


}

function setUpFilters(){
	$("#todayFilter").change(function(){
		var checked = $(this).is(':checked');
		//checked, show pics
		if(checked){
			showFilteredPics();
		}else{ 
			//filter pics
			showOriginalPics();
		}
	});
}

//create an alert
function createAlert(message, isError)
{
	$uploadInfo = $( document.createElement('div') ).attr('id','uploadInfo');
	$uploadInfo.addClass('alert alert-fixed-top '+((isError)?'alert-error':'alert-success')+' fade in')
	$uploadInfo.html(message);
	
    $('body').append($uploadInfo)

	//keep at top of page on scroll
    var $window    = $(window);
    var offset     = $("#uploadInfo").offset();
    //set at top
	fixToTopOfPage($uploadInfo, $window, offset);
    //attach to scroll event
    $window.scroll(function() {
    	var $uploadInfo = $("#uploadInfo");
    	//if the alert still exists
    	if($uploadInfo.length != 0){
    		fixToTopOfPage($uploadInfo, $window, offset);
    	}
    });
	
	setTimeout(function(){ $("#uploadInfo").alert('close'); }, 3000);//3 seconds
}
//fix an element to the top of a page
//the $target must have CSS 'position:fixed'
function fixToTopOfPage($target, $window, offset){
    var topPadding = 0;

	if ($window.scrollTop() > offset.top) {
    	//not visible, set to top
    	$target.css('margin-top', $window.scrollTop() - offset.top + topPadding + 'px');
    } else {
    	//visible
       $target.css('margin-top', 0+'px');
    }	
}
/*
	<div class="row">	
		<div class="span3 smoothTransition">
			<div class="picContainer center">
				<!-- fancy box, parent href is large image. child is thunbnail, rel is gallery -->
				<div class="pic smoothTransition fancy" href="images/testimgs/loaded.png" data-fancybox-group="gallery">
					<!-- lazy load the thumbnail, src is loader img, and data-original is loaded thumbnail -->
					<img class="lazy" src="images/testimgs/art1.png" data-original="images/testimgs/loaded.png">
					<!--img src="images/testimgs/art1.png" alt=""/-->
				</div>
				<div>aaa</div>
			</div>
		</div>
		.
		.
		.
	</div>
*/
function buildPictures(postersJson){
	var $container = $('#mainContainer');
	var posterIndex = 0;
	var totalPosters = postersJson.length;
	var totalRows = totalPosters/4;

	//for each row add 4 spans that contain pictures
	for(var i=0; i<totalRows; i++){
		var $row = $( document.createElement('div') ).addClass('row');
		
		for(var j=0; j<(totalPosters >= 4)?4:totalPosters; j++){
			var id = postersJson[posterIndex].id;
			var thumbnail = postersJson[posterIndex].postrThumb;
			var large = postersJson[posterIndex].postrLarge;
			var title = decodeURI( postersJson[posterIndex].title );
			var when = decodeURI( postersJson[posterIndex].when );
			var where = decodeURI( postersJson[posterIndex].where );
			var description = decodeURI( postersJson[posterIndex].description );
			var height = calcHeight(postersJson[posterIndex].ratio, 150); //120 is the CSS height of .picContainer and .pic
			
			//build html
			var $span3 = $( document.createElement('div') ).addClass('span3 smoothTransition');
				var $picContainer = $( document.createElement('div') ).addClass('picContainer center').css('height',height);
					var $pic = $( document.createElement('div') ).addClass('pic smoothTransition fancy').css('height',height);
					//fancy box, parent href is large image. child is thunbnail
					$pic.attr("href",large).attr('data-fancybox-group', 'gallery').attr('posterId', id).attr('when',when);
						//lazy load the thumbnail, src is loader img, and data-original is loaded thumbnail
						var $img = $( document.createElement('img') ).addClass('lazy');
						$img.attr('src','images/testimgs/img_loader.gif').attr('data-original',thumbnail);

					$pic.append($img);
					$picContainer.append($pic);

					var $info = $( document.createElement('div') ).addClass('searchText').html(title+description+where);
				$picContainer.append($info);
			$span3.append($picContainer);

			$row.append($span3);
			posterIndex++;
			totalPosters--;
			if(j == 3){
				break;
			}
		}
		//append row to container
		$container.append($row);
	}
}

//build the info for a poster
/*
<div class="row">
		<div class="span12 well">
			<div class="span12 center">The title</div>
			<div class="row">
				<div class="span1">
					 <label>When</label>
				</div>	
				<div class="span12 text-left well">
					 <div class>
					 words
					 </div>
				</div>	
			</div>
		</div>
	</div>
	*/
function buildInfo(posterInfo){
	var title =	 		decodeURI( posterInfo.title );
	var description = 	decodeURI( posterInfo.description );
	var when = 			decodeURI( posterInfo.when );
	var where = 		decodeURI( posterInfo.where );
	when = when.substr(0, (when.indexOf('T'))); //strip out hours minuets seconds

	var $container = $( document.createElement('div') );

	var $row = $( document.createElement('div') ).css('position','relative');
		var $well = $( document.createElement('div') ).addClass('well');
		var $title = $( document.createElement('div') ).addClass('infoTitle').html('<span>'+title +"<\/span><br>"+ when);
		$well.append($title);

		//add details on the desktop only. not enough room in mobile view
		if(!global.isMobile){
			var $infoContainer = $( document.createElement('div') ).addClass('infoContainer');
				
				if(where!='null'){
				var $whereContainer = $( document.createElement('div') ).addClass('whereContainer');
					var $whereLabel = $( document.createElement('div') ).addClass('infoContainerWhereLabel').html("<label><strong>Where:<\/strong><\/label>");
					var $where = $( document.createElement('div') ).addClass('infoContainerWhere').html( where );
				$whereContainer.append($whereLabel).append($where);
				}
				if(description!='...' && description!='null'){
				var $descContainer = $( document.createElement('div') ).addClass('descContainer');
					var $descLabel = $( document.createElement('div') ).addClass('infoContainerDescLabel').html("<label><strong>Description:<\/strong><\/label>");
					var $desc = $( document.createElement('div') ).addClass('infoContainerDesc').html( description );
				$descContainer.append($descLabel).append($desc);
				}
			$infoContainer.append($whereContainer).append($descContainer);
			$well.append($infoContainer);
		}

	$row.append($well);
	//edit button. not in mobil view
	if(!global.isMobile){
		var editTemptHTML = '<div id="editTemptButton" class="label" data-toggle="collapse" data-target="#accessCodeRow">Edit</div>';
		$row.append(editTemptHTML);
	}
	//can edit button
	var $accessCodeRow = $( document.createElement('div') ).attr('id', 'accessCodeRow').addClass('form-horizontal collapse');
	var acRowHTML = '<div class="control-group accessCodeControl">';
        acRowHTML +=   '<label class="control-label" for="ac_access_code">Access Code<\/label>';
        acRowHTML +=   '<div class="controls">';
        acRowHTML +=      '<input id="ac_access_code" placeholder="" type="text"\/>';
        acRowHTML +=      '<button id="canEditButton" type="button" class="btn btn-info">Submit<\/button>';
        acRowHTML +=   '<\/div>';

        acRowHTML +='<\/div>';
    	//acRowHTML +='</div>';
	$accessCodeRow.html(acRowHTML);
	$row.append($accessCodeRow)

	$container.append($row);
	return $container;
}


//-------------------
//build an inmemory hash of all the posters. this allows us to get quick access to any poster
function buildGlobalHash(){
	var postersJson = global.postersJson;

	for(var i=0; i<postersJson.length; i++){
		var posterInfo = postersJson[i];
		//set key
		global["id"+posterInfo.id] = posterInfo;
	}
}

//return the height in pixels of the pic container ased on the ratio of width to height
function calcHeight(ratio, width)
{
	var height = width/ratio;
	height = Math.round(height);
	return height+"px";
}

function setUpEditButton(posterInfo){
	$("#canEditButton").click(function(){
		$(this).html("checking...");
		
		ajaxCheckAccessCode(posterInfo.id, $("#ac_access_code").val(), function(returned_text){
			var resultJson = JSON.parse(returned_text);
			if(resultJson.canEdit=="true"){
				//close and set input fields to editable with blue background
				$("#accessCodeRow").collapse('hide');
				$("#canEditButton").html("Submit");
				startEditMode( posterInfo );
				_gaq.push(['_trackEvent', 'Edit', 'Success', 'Correct code']);
			}else{
				//show error by highlight and setting button to failed temporarly
				$("#ac_access_code").stop(true, true).effect("highlight", {queue:false, duration:2000 } );
				$("#canEditButton").html("Incorrect code").removeClass('btn-info').addClass('btn-danger');
				setTimeout(function(){ $("#canEditButton").html("Submit").removeClass('btn-danger').addClass('btn-info'); },2000);
				_gaq.push(['_trackEvent', 'Edit', 'Failed', 'Invalid code']);
			}
			
		});
	});
}

var _editMode = {
	title:"",
	where:"",
	description:""
}
function startEditMode(posterInfo){
	//hide edit tempt button
	$("#editTemptButton").hide();

	var $title = $(".infoTitle span");
	var $where = $(".infoContainerWhere");
	var $desc =  $(".infoContainerDesc");
	//save unedited info
	_editMode.title = $title.html();
	_editMode.where = $where.html();
	_editMode.description = $desc.html();
	
	//set contents to be editable
	$title.html('<input id="edit_title"  class="editing" type="text"\/>');

	$where.html('<input id="edit_where"  class="editing" type="text"\/>');
	$desc.html('<textarea id="edit_desc" class="editing" rows="3" maxlength="256"><\/textarea>');

	$("#edit_title").val(_editMode.title);
	$("#edit_where").val(_editMode.where);
	$("#edit_desc").val(_editMode.description);

	//add row of buttons
	var buttonsHTML = '<div id="editButtons" class="center">';
		buttonsHTML += '<button id="editCancelButton" type="button" class="btn btn-info">Cancel<\/button>';		
		buttonsHTML += '<button id="editSubmitButton" type="button" class="btn btn-info">Submit<\/button>';
		buttonsHTML +='<\/div>'
	$('.infoTitle').parent().append(buttonsHTML);

	//on cancel
	$("#editCancelButton").click(function(){
		//reset contents
		$title.html(_editMode.title);
		$where.html(_editMode.where);
		$desc.html(_editMode.description);
		//remove uncessary elements
		endEditMode();
		_gaq.push(['_trackEvent', 'Editing', 'Canceled', 'Done']);
	});

	//on submit
	$("#editSubmitButton").click(function(){
		ajaxUpdatePoster(posterInfo.id, 
			$("#ac_access_code").val(), 
			encodeURI( $("#edit_title").val()),
			"",//TODO: add when
			encodeURI( $("#edit_where").val()),
			encodeURI( $("#edit_desc").val()),
			function(returned_text){
				//update feilds
				var postersJson = JSON.parse(returned_text);
				$title.html( decodeURI( postersJson.title ) );
				$where.html( decodeURI( postersJson.where ) );
				$desc.html(  decodeURI( postersJson.description  ) );
				//remove uncessary elements
				endEditMode();
				_gaq.push(['_trackEvent', 'Editing', 'Submit', 'Done']);
			});
	});

}

function endEditMode(){
	//remove buttons
	$("#editButtons").remove();
	//show edit tempt button
	$("#editTemptButton").show();
	//clear cache
	_editMode.title = "";
	_editMode.where = "";
	_editMode.description = "";
}

function showFilteredPics(){
	var filtered = filterPics();
	//remove all pics
	$('.smoothTransition').remove();

	if(filtered.length > 0){
			//build html for pics
			buildPictures(filtered);
			//applay hover and roatation to pics
			setUpPics();
			//set up lazy loading functionality
			setUpLazyLoad();
			//do not use buildGlobalHash, it stays the same
	}
}

function showOriginalPics(){
	//remove all pics
	$('.smoothTransition').remove();

	if(global.postersJson.length > 0){
			//build html for pics
			buildPictures(global.postersJson);
			//applay hover and roatation to pics
			setUpPics();
			//set up lazy loading functionality
			setUpLazyLoad();
			//do not use buildGlobalHash, it stays the same
	}
}

//filters out all pics for today
function filterPics(){
	var postersJson = global.postersJson;
	var today = new XDate(true).clearTime();

	var filteredPosters = new Array();
	for(var i=0; i<postersJson.length; i++){
		if(postersJson[i].when != null){
			var when = new XDate(postersJson[i].when, true).clearTime();	
			if(today.getTime() == when.getTime()){
				filteredPosters.push(postersJson[i]);
			}
		}
	}

	return filteredPosters;
}