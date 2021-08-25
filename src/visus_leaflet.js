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
}(function (L) {
  /**
   * L.RasterCoords
   * @param {L.map} map - the map used
   * @param {Array} imgsize - [ width, height ] image dimensions
   * @param {Number} [tilesize] - tilesize in pixels. Default=256
   */
  L.RasterCoords = function (map, imgsize, tilesize) {
    this.map = map
    this.width = imgsize[0]
    this.height = imgsize[1]
    this.tilesize = tilesize || 256
    this.zoom = this.zoomLevel()
    if (this.width && this.height) {
      this.setMaxBounds()
    }
  }

  L.RasterCoords.prototype = {
    /**
     * calculate accurate zoom level for the given image size
     */
    zoomLevel: function () {
      return Math.ceil(
        Math.log(
          Math.max(this.width, this.height) /
          this.tilesize
        ) / Math.log(2)
      )
    },
    /**
     * unproject `coords` to the raster coordinates used by the raster image projection
     * @param {Array} coords - [ x, y ]
     * @return {L.LatLng} - internal coordinates
     */
    unproject: function (coords) {
      return this.map.unproject(coords, this.zoom)
    },
    /**
     * project `coords` back to image coordinates
     * @param {Array} coords - [ x, y ]
     * @return {L.LatLng} - image coordinates
     */
    project: function (coords) {
      return this.map.project(coords, this.zoom)
    },
    /**
     * sets the max bounds on map
     */
    setMaxBounds: function () {
      var southWest = this.unproject([0, this.height])
      var northEast = this.unproject([this.width, 0])
      this.map.setMaxBounds(new L.LatLngBounds(southWest, northEast))
    }
  }

  return L.RasterCoords
}))
////////////////////////////////////////////////



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

    //self.VisusLayer = function() { return new self.tileLayer(); }

    if(self.pre_bounds != null){
      self.setBounds(self.pre_bounds)
      setTimeout(self.selfpresetbounds, 2000)
    }

    let viewCenter = null;
    let viewZoom = null;
    if (self.map != undefined) {
      viewCenter = self.map.getCenter();
      viewZoom = self.map.getZoom();
      self.map.remove();
    } 
    self.map = L.map(self.id)/*, {
			       scrollWheelZoom: false, // disable original zoom function
			       smoothWheelZoom: true,  // enable smooth zoom 
			       smoothSensitivity: 1,   // zoom speed. default is 1
			       })*/

    self.rc = new L.RasterCoords(self.map, [self.dataset.dims[X], self.dataset.dims[Y]], 256)

    // console.log("dims", self.dataset.dims[X], self.dataset.dims[Y])
    // console.log("zoom level", self.rc.zoomLevel(), self.dataset.maxh)
    // console.log("min level", self.minLevel, "max level", self.maxLevel)
    // console.log("tile_size", self.tile_size)
    // console.log(self.rc.unproject([self.dataset.dims[X], self.dataset.dims[Y] ]))
    if (viewCenter != null) {
      self.map.setView(viewCenter, viewZoom)
    }
    else {
      self.map.setView(self.rc.unproject([self.dataset.dims[X]/2, self.dataset.dims[Y]/2]), self.minLevel/2)
    }

    // var bounds = [[0,0], [self.dataset.dims[X], self.dataset.dims[Y]]];
    // self.map.fitBounds(bounds)

    //self.tileLayer= VisusGetTileLayer(self.dataset.base_url, self.dataset.name,
    //        self.dataset.dims[X],self.dataset.dims[Y], self.dataset.maxh, self.minLevel, rc.zoomLevel(), 256)

    self.tileLayer =  L.TileLayer.extend({
      options: {
        imageFormat: self.compression,
        tileSize: self.tile_size[X],
        noWrap: true,
        minZoom: (self.minLevel%2)+2,
        maxZoom: rc.zoomLevel(),
        updateWhenIdle: false,
        continuousWorld: false,
        fitBounds: false,
        setMaxBounds: false
      },
      getTileUrl: self.getTileUrl
    });

    self.VisusLayer = function() { return new self.tileLayer(); }

    self.VisusLayer().addTo(self.map);
  };
  

  //getTileUrl
  self.getTileUrl= function(coords) {
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
      toh = Math.min(self.dataset.maxh, self.minLevel*2 + level*2);
      vs = Math.pow(2, this.options.maxZoom-level); 
      w=self.tile_size[0] * vs; x1=x * w; x2=x1 + w;
      h=self.tile_size[1] * vs; y1=y * h; y2=y1 + h;
      
      //mirror y
      {
        yt = y1; 
        y1 = self.dataset.dims[1] - y2; 
        y2 = self.dataset.dims[1] - yt;
      }

      // NOTE: removed clamp because Leflet always needs tiles of the same size
      // +clamp(x1, 0, self.dataset.dims[0])+'%20'+(clamp(x2, 0, self.dataset.dims[0])-1)+'%20'
      // +clamp(y1, 0, self.dataset.dims[1])+'%20'+(clamp(y2, 0, self.dataset.dims[1])-1)
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
    return ret;
/*
    var xDiff = (x2 - x1);
    var yDiff = (y2 - y1);

    var size = Math.ceil(xDiff / vs) + ',';
    //if (_this.type === 'ImageService3') {
      // Cannonical URI Syntax for v3
      size = size + Math.ceil(yDiff / vs);
    //}

    // var sizex = Math.ceil(xDiff / vs);
    // var sizey = Math.ceil(yDiff / vs);

    temp = L.Util.template(ret, L.extend({
      format: this.options.tileFormat,
      //quality: this.quality,
      region: [x1, y1, xDiff, yDiff].join(','),
      rotation: 0,
      size: size
    }, this.options));

    console.log(size, [x1, y1, xDiff, yDiff])

    */

  };

  
  //download_query
  self.download_query=function(req_lev=self.level, box=null, is_rgb=true)  { 
    base_url=self.dataset.base_url
      +'&dataset='+self.dataset.name
      +'&compression='+self.compression             
      +'&maxh='+ self.dataset.maxh
      +'&time='+self.time
      +'&field='+self.field

      if(is_rgb)
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
    //each open sea dragon level is a "01" in visus
    //euristic, for each OSD level I have two Visus levels, so I have to double the tile_size 
    //in order to get the same number of samples
    self.minLevel=Math.floor(self.dataset.bitsperblock/2);
    self.maxLevel=Math.floor(self.dataset.maxh/2);  
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
  
  self.setAxis(2);
  self.setSlice(0);
  self.setField(self.dataset.fields[0].name);
  self.setTime(self.dataset.timesteps[0]);
  self.setPalette("");
  self.setPaletteMin(0);
  self.setPaletteMax(0);
  self.setPaletteInterp("Default");   
  
  permutation=[[1,2,0],[0,2,1],[0,1,2]];
  X = permutation[self.axis][0];
  Y = permutation[self.axis][1];
  Z = permutation[self.axis][2];  
  
  dimX = Math.pow(2, Math.ceil(Math.log(self.dataset.dims[X])/Math.log(2)));
  dimY = Math.pow(2, Math.ceil(Math.log(self.dataset.dims[Y])/Math.log(2)));
  //console.log(dimX, dimY)

  self.refresh();

  return self;
};
