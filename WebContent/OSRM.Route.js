// OSRM route classes


// base route class
OSRM.SimpleRoute = function (label, style) {
	this.label = (label ? label : "route");
	this.route = new L.DashedPolyline();
	this.route.setLatLngs( [] );
	if(style) this.route.setStyle( style );

	this.shown = false;
	
 	this.route.on('click', this.onClick); 	
};
OSRM.extend( OSRM.SimpleRoute,{
show: function() {
	map.addLayer(this.route);
	this.shown = true;
},
hide: function() {
	map.removeLayer(this.route);
	this.shown = false;
},
isShown: function() {
	return this.shown;
},
getPositions: function() {
	return this.route.getLatLngs();
},	
setPositions: function(positions) {
	this.route.setLatLngs( positions );
},
setStyle: function(style) {
	this.route.setStyle(style);
},
centerView: function() {
	var bounds = new L.LatLngBounds( this.getPositions() );
	bounds._southWest.lng-=1.02;																// dirty hack
	map.fitBounds( bounds );
},
onClick: function(e) {
	if(my_route.isRoute())
		findViaPosition( e.latlng );
},
toString: function() {
	return "OSRM.Route("+ this.label + ", " + this.route.getLatLngs().length + " points)";
},
});


// multiroute class (several separate route parts)
OSRM.MultiRoute = function (label) {
	this.label = (label ? label : "multiroute");
	this.route = new L.LayerGroup();

	this.shown = false;
};
OSRM.extend( OSRM.MultiRoute,{
show: function() {
	map.addLayer(this.route);
	this.shown = true;
},
hide: function() {
	map.removeLayer(this.route);
	this.shown = false;
},
isShown: function() {
	return this.shown;
},
addRoute: function(positions) {
	var line = new L.DashedPolyline( positions );
	line.on('click', function(e) { my_route.fire('click',e); });
	this.route.addLayer( line );
},
clearRoutes: function() {
	this.route.clearLayers();
},
setStyle: function(style) {
	this.route.invoke('setStyle', style);
},
toString: function() {
	return "OSRM.MultiRoute("+ this.label + ")";
}
});


// main route class
OSRM.Route = function() {
	this._current_route	= new OSRM.SimpleRoute("current" , {dashed:false} );
	this._old_route		= new OSRM.SimpleRoute("old", {dashed:false,color:"#123"} );
	this._unnamed_route	= new OSRM.MultiRoute("unnamed");
	
	this._current_route_style	= {dashed:false,color:'#0033FF', weight:5};
	this._current_noroute_style	= {dashed:true, color:'#222222', weight:2};
	this._old_route_style	= {dashed:false,color:'#112233', weight:5};
	this._old_noroute_style	= {dashed:true, color:'#000000', weight:2};
	this._unnamed_route_style = {dashed:false, color:'#FF00FF', weight:10};
	this._old_unnamed_route_style = {dashed:false, color:'#990099', weight:10};
	
	this._noroute = OSRM.Route.ROUTE;
};
OSRM.Route.NOROUTE = true;
OSRM.Route.ROUTE = false;
OSRM.extend( OSRM.Route,{
	
	showRoute: function(positions, noroute) {
		this._noroute = noroute;
		this._current_route.setPositions( positions );
		if ( this._noroute == OSRM.Route.NOROUTE )
			this._current_route.setStyle( this._current_noroute_style );
		else
			this._current_route.setStyle( this._current_route_style );
		this._current_route.show();
		//this._raiseUnnamedRoute();
	},
	hideRoute: function() {
		this._current_route.hide();
		this._unnamed_route.hide();
	},
	
	showUnnamedRoute: function(positions) {
		this._unnamed_route.clearRoutes();
		for(var i=0; i<positions.length; i++) {
			this._unnamed_route.addRoute(positions[i]);	
		}
		this._unnamed_route.setStyle( this._unnamed_route_style );
		this._unnamed_route.show();
	},
	hideUnnamedRoute: function() {
		this._unnamed_route.hide();
	},
	// TODO: hack to put unnamed_route above old_route -> easier way in Leaglet 0.4+	
	_raiseUnnamedRoute: function() {
		if(this._unnamed_route.isShown()) {
			this._unnamed_route.hide();
			this._unnamed_route.show();
		}		
	},	
	showOldRoute: function() {
		this._old_route.setPositions( this._current_route.getPositions() );
		if ( this._noroute == OSRM.Route.NOROUTE)
			this._old_route.setStyle( this._old_noroute_style );
		else
			this._old_route.setStyle( this._old_route_style );
		this._old_route.show();
		this._raiseUnnamedRoute();
		// change color of unnamed route highlighting - no separate object as dragged route does not have unnamed route highlighting
		this._unnamed_route.setStyle( this._old_unnamed_route_style );
	},
	hideOldRoute: function() {
		this._old_route.hide();
	},
	
	isShown: function() {
		return this._current_route.isShown();
	},
	isRoute: function() {
		return !(this._noroute);
	},	
	getPositions: function() {
		return this._current_route.getPositions();
	},
	fire: function(type,event) {
		this._current_route.route.fire(type,event);
	},
	centerView: function() {
		this._current_route.centerView();
	}
});
