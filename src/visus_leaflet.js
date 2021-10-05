//////////////////////////////////////////////// Leaflet utils
;(function (factory) {
  var L
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['leaflet'], factory)
  } else if (typeof module !== 'undefined') {
    // Node/CommonJS
    L = require('leaflet')
    module.exports = factory(L)
  } else {
    // Browser globals
    if (typeof window.L === 'undefined') {
      throw new Error('Leaflet must be loaded first')
    }
    factory(window.L)
  }
})



//////////////////////////////////////////////////////////////////////
function VisusLeaflet(params) 
{
  var self=this;
  
  self.id             = params['id'];
  self.url            = params['url'];
  self.dataset        = params['dataset'];
  self.compression    = params['compression']    || 'png';
  self.showNavigator  = params['showNavigator']  || true;
  self.debugMode      = params['debugMode']      || false;
  self.palette        = params['palette']        || "";
  self.palette_min    = params['palette_min']    || '0';
  self.palette_max    = params['palette_max']    || '0';
  self.palette_interp = params['palette_interp'] || 'Default';
  self.dtype          = params['dtype']          || 'uint8';
  self.ADD_SCALE_LEGEND = 1;
  self.ADD_NORTH_LEGEND = 1;
  self.ADD_TITLE_LEGEND = 1;
  self.ADD_CAPTION_LEGEND = 1;

    if (self.dataset.dim==2)
  {
    self.tile_size=[1,1,1];
    for (I=0;I<self.dataset.bitsperblock;I++) 
      self.tile_size[self.dataset.bitmask[self.dataset.maxh-I]]*=2;     
  }
  else
  {
    self.tile_size=self.dataset.dims;     
  }

  self.guessRange=function(){
    for(i=0; i< self.dataset.fields.length; i++){
      d=self.dataset.fields[i]
      if(d.name == self.field){
        if(d.min != d.max){
          self.palette_min = d.min; 
          self.palette_max = d.max;
        }

        console.log("field", self.field,"using min max ", self.palette_min, self.palette_max)
      }
    }
  }
  
  //see https://github.com/openseadragon/openseadragon/issues/866
  self.refresh=function() 
  { 
    guessRange();
    self.VisusLayer.redraw();
  };

  //getTileUrl
  self.getTileUrl = function(coords) {
    base_url=self.dataset.base_url
      +'&dataset='+self.dataset.name
      +'&compression='+self.compression             
      +'&maxh='+ self.dataset.maxh
      +'&time='+self.time
      +'&field='+self.field
      +'&palette='+self.palette
      +'&palette_min='+self.palette_min
      +'&palette_max='+self.palette_max
      +'&palette_interp='+self.palette_interp;

    level=coords.z;
    x=coords.x;
    y=coords.y;

    
    if (self.dataset.dim==2)
    {
      
      //toh=level*2;
      toh = self.dataset.maxh - 2 * (self.maxLevel - level);
      vs = Math.pow(2, self.maxLevel-level);

      w = self.tile_size[0] * vs;
      x1 = x * w - self.datasetCorner[0];
      x2 = x1 + w - 1;

      h = self.tile_size[1] * vs;
      y1 = y * h + (self.datasetCorner[1] + self.dataset.dims[Y]);
      y2 = y1 + h - 1;
      
      //mirror y
      {
        yt = y1; 
        y1 = self.dataset.dims[1] - y2; 
        y2 = self.dataset.dims[1] - yt;
      }

      // NOTE: removed clamp because Leflet always needs tiles of the same size
      // +clamp(x1, 0, self.dataset.dims[0])+'%20'+(clamp(x2, 0, self.dataset.dims[0])-1)+'%20'
      // +clamp(y1, 0, self.dataset.dims[1])+'%20'+(clamp(y2, 0, self.dataset.dims[1])-1)

      if (x2 < 0 || x1 >= self.dataset.dims[0] ||
	  y2 < 0 || y1 >= self.dataset.dims[1]) {
	return null;
      }
      
      ret = base_url
        +'&action=boxquery'
        +'&box='
          +x1+'%20'+x2+'%20'
          +y1+'%20'+y2
        +'&toh='+toh;

    }
    else
    {
      toh=self.dataset.maxh-(this.options.maxZoom-level)*3;

      box=[];
      box[X]=[0,self.dataset.dims[X]];
      box[Y]=[0,self.dataset.dims[Y]];
      box[Z]=[self.slice,self.slice];       
      
      ret = base_url
        +'&action=pointquery' 
        +'&box='
          +box[0][0]+'%20'+box[1][0]+'%20'+box[2][0]+'%20'
          +box[0][1]+'%20'+box[1][1]+'%20'+box[2][1]
        +'&toh='+toh;    
    }

    self.setTitle();
    return ret;
  };

  
  //download_query
  self.download_query=function(req_lev=self.level, box=null, is_rgb=true)  { 
    base_url=self.dataset.base_url
      +'&dataset='+self.dataset.name
      +'&compression='+self.compression             
      +'&maxh='+ self.dataset.maxh
      +'&time='+self.time
      +'&field='+self.field

      //if(is_rgb)
        base_url+='&palette='+self.palette
        +'&palette_min='+self.palette_min
        +'&palette_max='+self.palette_max
        +'&palette_interp='+self.palette_interp;
    
      toh=clamp(req_lev,0,self.maxLevel*2);
      
      if(box==null)
        ret = base_url +'&action=boxquery&box=0%20'+self.dataset.dims[0]+'%200%20'+((self.dataset.dims[1])-1)+'&toh='+toh;
      else
        ret = base_url +'&action=boxquery&box='+box[0]+'%20'+box[1]+'%20'+box[2]+'%20'+box[3]+'&toh='+toh;
      //console.log("download query"+ret);

      self.query_str = ret;

      return ret;
  };
  
  if (self.dataset.dim==2)
  {
    // the levels are pretty much arbitrary, as long as the max level maps to the finest resolution
    // and the resolutions array has "1" as the finest 
    self.minLevel=0;
    self.maxLevel=8;
  }
  else
  {
    self.minLevel=0;
    self.maxLevel=5;
  }
  
  self.getDataSize=function(level){
    var sample_size = 1;
    
    sd=[1,1,1];
    for (I=0;I<level;I++) 
      sd[self.dataset.bitmask[self.dataset.maxh-I]]*=2;

    for(d=0;d<3;d++)
      if(sd[d]>dataset.dims[d])
        sd[d]=dataset.dims[d]

    sd[axis] = 1

    mag=sd[0]*sd[1]*sd[2]
    //console.log("level "+level+" nsamples "+mag+"="+sd)

    return (mag*sample_size)/1024.0/1024.0

  }

  self.setDType=function(value) {
    self.dtype=value;
  }

  //getAxis
  self.getAxis=function() {
    return self.axis; 
  };
  
  //setAxis
  self.setAxis=function(value) {
    self.axis=value;
    self.slice=clamp(self.slice,0,self.dataset.pow2dims[axis]-1);
  };
  
  //getSlice
  self.getSlice=function() {
    return self.slice;
  };
  
  //setSlice
  self.setSlice=function(value) {
    self.slice=clamp(value,0,self.dataset.pow2dims[axis]-1);
  } ; 
  
  //getField
  self.getField=function() {
    return self.field;
  };
  
  //setField
  self.setField=function(value) {
    self.field=value;
    for(f of self.dataset.fields)
      if(f.name==value){
        self.setDType(f.dtype)
        break;
      }
    console.log("dtype = "+self.dtype)
  };
  
  //getTime
  self.getTime=function() {
    return self.time; 
  };
  
  //setTime
  self.setTime=function(value) {
    self.time=value;
  };
  
  //getPalette
  self.getPalette=function() {
    return self.palette;
  };
  
  //setPalette
  self.setPalette=function(value) {
    self.palette=value;
  };
  
  //getPaletteMin
  self.getPaletteMin=function() {
    return self.palette_min;
  };
  
   //setPaletteMin
  self.setPaletteMin=function(value) {
    self.palette_min=value;
  } ;
  
   //getPaletteMax
  self.getPaletteMax=function() {
    return self.palette_max;
  };
  
  //setPaletteMax
  self.setPaletteMax=function(value) {
    self.palette_max=value;
  }  ;
  
  //getPaletteInterp
  self.getPaletteInterp=function() {
    return self.palette_interp;
  };
  
  //setPaletteInterp
  self.setPaletteInterp=function(value) {
    self.palette_interp=value;
  }; 

  self.getBounds=function() {
    // TODO implement getBounds
    return null;
  }

  self.setBounds=function(new_bounds) {
    // TODO implement set view to the input bounds
    self.pre_bounds = new_bounds;
    //self.refresh()
  }

  self.selfpresetbounds=function(){
    self.osd.viewport.fitBounds(self.pre_bounds,true);
  }

  self.setTitle=function() {
      var title = getUrlParameter('title');

      if (title)
          $("#titlelbl").html("<b>" + decodeURI(title) + "</b>");
      else {
          title = getUrlParameter('dataproduct');
          if (title)
              $("#titlelbl").html("<b>" + decodeURI(title) + "</b>");
          var title2 = getUrlParameter('datasitemonth');
          if (title2)
              $("#titlelbl").html("<b>" + decodeURI(title) + ' : '+decodeURI(title2) +"</b>");

          else
            $("#titlelbl").html("<b>" + 'Data Title' + "</b>");
      }
  }

  self.setAxis(2);
  self.setSlice(0);
  self.setField(self.dataset.fields[0].name);
  self.setTime(self.dataset.timesteps[0]);
  self.setPalette("NDVI_Beach");
  self.setPaletteMin(0);
  self.setPaletteMax(1);
  self.setPaletteInterp("Default");
  self.setTitle('Viewer')

  permutation=[[1,2,0],[0,2,1],[0,1,2]];
  X = permutation[self.axis][0];
  Y = permutation[self.axis][1];
  Z = permutation[self.axis][2];  
  
  dimX = Math.pow(2, Math.ceil(Math.log(self.dataset.dims[X])/Math.log(2)));
  dimY = Math.pow(2, Math.ceil(Math.log(self.dataset.dims[Y])/Math.log(2)));
  //console.log(dimX, dimY)

 
  if(self.pre_bounds != null){
    self.setBounds(self.pre_bounds)
    setTimeout(self.selfpresetbounds, 2000)
  }

  resolutions = []
  for (i=0; i<=self.maxLevel; i++) {
    resolutions.push(Math.pow(2, self.maxLevel-i));
  }

  if (self.dataset.crs_name) {
    self.datasetCorner = self.dataset.crs_offset; // min projected coordinates
    var crs = new L.Proj.CRS(proj4list[self.dataset.crs_name][0],
			     proj4list[self.dataset.crs_name][1],
			     {
			       resolutions: resolutions,
			     });

  }
  else {
    self.datasetCorner = [0,0];
    var crs = L.CRS.EPSG3857;
  }

  
  
  corner1 = crs.unproject(L.point(self.datasetCorner[0],
				  self.datasetCorner[1]));
  corner2 = crs.unproject(L.point(self.datasetCorner[0] + self.dataset.dims[X],
				  self.datasetCorner[1] + self.dataset.dims[Y]));
  
  self.map = L.map(self.id,
		   {
		     crs: crs
		   }).fitBounds(L.latLngBounds(corner1, corner2));

  
  // console.log("dims", self.dataset.dims[X], self.dataset.dims[Y])
  // console.log("zoom level", self.rc.zoomLevel(), self.dataset.maxh)
  // console.log("min level", self.minLevel, "max level", self.maxLevel)
  // console.log("tile_size", self.tile_size)
  // console.log(self.rc.unproject([self.dataset.dims[X], self.dataset.dims[Y] ]))


  self.tileLayer =  L.TileLayer.extend({
    options: {
      imageFormat: self.compression,
      tileSize: self.tile_size[X],
      noWrap: true,
      minZoom: self.minLevel,
      maxZoom: self.maxLevel,
      updateWhenIdle: false,
      continuousWorld: false,
      fitBounds: false,
      setMaxBounds: false
    },
    getTileUrl: self.getTileUrl
  });

  self.VisusLayer = new self.tileLayer();

  self.VisusLayer.addTo(self.map);

  
  // only add base layer if we have a crs that makes sense
  if (self.dataset.crs_name) {
    map.on('click', function(e) {
      alert("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
    });
  
    var baseLayer = L.tileLayer.wms('https://maps.omniscale.net/v2/private-john-schreiner-6525978d/style.default/map',
				    {
				      attribution: '&copy; 2021 &middot; <a href="https://maps.omniscale.com/">Omniscale</a> ' +
					'&middot; Map data: <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
				      opacity: 0.5,
				    }).addTo(map);
    

    /*
      var wmsLayer = L.tileLayer.wms('https://www.mrlc.gov/geoserver/mrlc_display/wms?service=WMS&',
      {
      layers: 'NLCD_2019_Impervious_descriptor_L48',
      //layers: '',
      opacity: 0.5,
      }).addTo(map);
    */
  }
  
  
  if (self.ADD_SCALE_LEGEND == 1)
    L.control.scale().addTo(self.map);  //AAG: 9.26.2021


  self.addNorth = function( map){ //AAG: 9.26.2021
    var north = L.control({position: "bottomright"});
    north.onAdd = function (map) {
      var div = L.DomUtil.create("div", "info legend");
      div.innerHTML = '<img width=110 height=""110 src="visus/src/icons/North.png">';
      return div;
    }
    north.addTo( map);
  }
  if (self.ADD_NORTH_LEGEND ==1)
    self.addNorth(self.map)
  

  return self;
};
