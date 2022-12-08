

const container = document.getElementById('popup');
const contentCoords = document.getElementById('popup-coords');
const contentR = document.getElementById('popup-r-script');
const contentPython = document.getElementById('popup-python-script');
const closer = document.getElementById('popup-closer');



//////////////////////////////////////////////////////////////////////
function VisusOL(params) 
{
  var self=this;
  
  self.id             = params['id'];
  self.url            = params['url'];
  self.dataset        = params['dataset'];
  self.compression    = params['compression']    || 'png';
  self.showNavigator  = params['showNavigator']  || true;
  self.debugMode      = params['debugMode']      || false;
  self.baseMap        = params['basemap']        || "http://mt1.google.com/vt/lyrs=s&hl=pl&&x={x}&y={y}&z={z}";
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

        //console.log("field", self.field,"using min max ", self.palette_min, self.palette_max)
      }
    }
  }
  
  //see https://github.com/openseadragon/openseadragon/issues/866
  self.refresh=function() 
  { 
    guessRange();
    self.VisusLayer.getSource().refresh();
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

    level=coords[0];
    x=coords[1];
    y=coords[2];

    
    if (self.dataset.dim==2)
    {
      
      //toh=level*2;
      if (self.dataset.crs_name) {
	toh = self.dataset.maxh - 2 * (self.maxLevel - level);
	vs = Math.pow(2, self.maxLevel-level);
	
	w = self.tile_size[0] * vs;
	x1 = x * w - self.datasetCorner[0];
	x2 = x1 + w - 1;

	h = self.tile_size[1] * vs;
	y1 = y * h + (self.datasetCorner[1] + self.dataset.dims[Y]);
	y2 = y1 + h - 1;
      }
      else {
	toh = Math.min(self.dataset.maxh, self.minLevel*2 + level*2);
	vs = Math.pow(2, this.options.maxZoom-level);

	w = self.tile_size[0] * vs;
	x1 = x * w;
	x2 = x1 + w - 1;

	h = self.tile_size[1] * vs;
	y1 = y * h;
	y2 = y1 + h - 1;
      }

      
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
        +'&pad=1'
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
  };

  
  //download_query
  self.download_query=function(req_lev=self.level, box=null, is_rgb=true)  { 
    base_url=self.dataset.base_url
      +'&dataset='+self.dataset.name
      +'&compression='+self.compression             
      +'&maxh='+ self.dataset.maxh
      +'&time='+self.time
      +'&field='+self.field;

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

    sessionStorage.setItem("ui-field", value);
  };
  
  //getTime
  self.getTime=function() {
    return self.time; 
  };
  
  //setTime
  self.setTime=function(value) {
    self.time=value;
  };

  //getBaseMap
  self.getBaseMap=function() {
     return self.baseMap;
  };

  //setBaseMap
  self.setBaseMap=function(value) {
    self.baseMap=value;
    sessionStorage.setItem("ui-baseMap", value);
  };

  //getPalette
  self.getPalette=function() {
    return self.palette;
  };
  
  //setPalette
  self.setPalette=function(value) {
    self.palette=value;
    sessionStorage.setItem("ui-palette", value);
  };

  //getPaletteMin
  self.getPaletteMin=function() {
    return self.palette_min;
  };
  
   //setPaletteMin
  self.setPaletteMin=function(value) {
    self.palette_min=value;
    sessionStorage.setItem("ui-paletteMin", value);
  } ;
  
   //getPaletteMax
  self.getPaletteMax=function() {
    return self.palette_max;
  };
  
  //setPaletteMax
  self.setPaletteMax=function(value) {
    self.palette_max=value;
    sessionStorage.setItem("ui-paletteMax", value);
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
  }

  self.selfpresetbounds=function(){
  }

  self.setOpacity=function(value) {
    self.VisusLayer.setOpacity(value);
    sessionStorage.setItem("ui-opacity", value);
  }
	  
  
  self.getDatasetName=function() {
      dataproduct = getUrlParameter('dataproduct');
      site = getUrlParameter('site');
      month = getUrlParameter('month');
      if (dataproduct && site && month)
         return( dataproduct + " " + site + " " + month  );
      else
          return ('')
    }

  self.updateBaseMap = function(){

      baseMapLayer = jQuery.grep(self.map.getLayers().getArray(), function(layer) {
          return layer.get('title') == 'baseMap';
      })[0];
      baseMapLayer.setSource(new ol.source.XYZ({ url: self.baseMap}) );
      // baseMapLayer.setOpacity(0.5);

      self.map.changed();
      self.map.getLayers().forEach(layer => layer.getSource().refresh());

  };

  self.getNeonRCode = function() {

    view = self.map.getView();
    center = view.getCenter();
    extent = view.calculateExtent(self.map.getSize());
    size = Math.min(extent[2]-extent[0],
		    extent[3]-extent[1]);

    xmin = Math.floor(Math.max(extent[0], self.datasetCorner[0])/1000) * 1000;
    xmax = Math.floor(Math.min(extent[2], self.datasetCorner[0]+self.dataset.dims[X])/1000) * 1000;
    ymin = Math.floor(Math.max(extent[1], self.datasetCorner[1])/1000) * 1000;
    ymax = Math.floor(Math.min(extent[3], self.datasetCorner[1]+self.dataset.dims[Y])/1000) * 1000;
    
    dataproduct = getUrlParameter('dataproduct');
    site = getUrlParameter('site');
    month = getUrlParameter('month');
    code =  (
      'library(neonUtilities)\n' +
        'for (i in seq('+xmin+', '+xmax+', 1000)) {\n' +
	'  for (j in seq('+ymin+', '+ymax+', 1000)) {\n' +
	'    byTileAOP(dpID="' + dataproduct + '",\n' +
	'              site="' + site + '",\n' +
	'              year="' + month + '",\n' +
	'              buffer=0,\n' +
	'              easting=i,\n' +
	'              northing=j,\n' +
	'              check.size=FALSE)\n' +
	'  }\n' +
	'}\n'
    );
    
    return code;
  };


  self.getVisusPythonCode = function() {

      view = self.map.getView();
      res = view.getResolution();
      level = self.tileGrid.getZForResolution(res);
      toh = self.dataset.maxh - 2 * (self.maxLevel - level)
      center = view.getCenter();
      extent = view.calculateExtent(self.map.getSize());
      size = Math.min(extent[2]-extent[0],
		      extent[3]-extent[1]);

      xmin = extent[0] - self.datasetCorner[0];
      xmax = extent[2] - self.datasetCorner[0];
      ymin = extent[1] - self.datasetCorner[1];
      ymax = extent[3] - self.datasetCorner[1];

      xmin = xmin | 0;
      xmax = xmax | 0;
      ymin = ymin | 0;
      ymax = ymax | 0;
      
      server_url = getServer();
      dataset_url= server_url+"dataset="+self.dataset.name;
      
      code =  (
'from OpenVisus import *\n' + 
'from PIL import Image\n' + 
'import numpy\n' + 
'\n' + 
'\n' + 
'\n' + 
'def BattelleNEONQuery(data_url,\n' + 
'                      field,\n' + 
'                      easting,\n' + 
'                      northing,\n' + 
'                      resolution):\n' + 
'\n' + 
'    dataset=LoadDataset(data_url)\n' + 
'    access=dataset.createAccess()\n' + 
'    query=dataset.createBoxQuery(BoxNi(PointNi(easting[0], northing[0]),\n' + 
'                                       PointNi(easting[1], northing[1])),\n' + 
'                                 dataset.getField(field),\n' + 
'                                 0)\n' + 
'    query.setResolutionRange(0, resolution)\n' + 
'    dataset.beginBoxQuery(query)\n' + 
'    dataset.executeBoxQuery(access,query)\n' + 
'    data=Array.toNumPy(query.buffer,bSqueeze=True,bShareMem=False)\n' + 
'    data = numpy.flip(data, 0)\n' + 
'    return data\n' + 
'\n' + 
'\n' + 
'DbModule.attach()\n' + 
'\n' + 
'data = BattelleNEONQuery(\"' + dataset_url + '\",\n' + 
'                         \"'+self.field+'\",\n' + 
'                         ('+xmin+','+xmax+'),\n' + 
'                         ('+ymin+','+ymax+'),\n' + 
'                        '+toh+')\n' + 
'\n' + 
'Image.fromarray(data).save("out.tif")\n' + 
'\n' + 
'DbModule.detach()\n' +
'\n');
    
    return code;
  };
    
/*
  datamap_slider = document.getElementById("datamapOpacitySlider");
  datamap_output = document.getElementById("datamapOpacityValue");
  datamap_output.innerHTML = (parseFloat(datamap_slider.value)/100).toString();
  datamap_slider.oninput = function() {
      datamap_output.innerHTML = (parseFloat(this.value)/100).toString();
      test = self.map.getLayers().getArray();
      allDataLayers = (test[1]).getLayers().getArray();
      idxDataLayer = jQuery.grep(allDataLayers, function(layer) {
              return layer.get('title') == 'IDX';
      })[0];

      idxDataLayer.setOpacity(parseFloat(this.value)/100)
  };
*/
  
  self.setAxis(2);
  self.setSlice(0);
  self.setField(self.dataset.fields[0].name);
  self.setTime(self.dataset.timesteps[0]);
  self.setPalette("rich");
  self.setPaletteMin(0);
  self.setPaletteMax(1);
  self.setPaletteInterp("Default");
  
  permutation=[[1,2,0],[0,2,1],[0,1,2]];
  X = permutation[self.axis][0];
  Y = permutation[self.axis][1];
  Z = permutation[self.axis][2];  
  
  dimX = Math.pow(2, Math.ceil(Math.log(self.dataset.dims[X])/Math.log(2)));
  dimY = Math.pow(2, Math.ceil(Math.log(self.dataset.dims[Y])/Math.log(2)));
  //console.log(dimX, dimY)

 
  self.datasetCorner = self.dataset.crs_offset; // min projected coordinates

  res = []
  for (i=0; i<=self.maxLevel; i++) {
    res.push(Math.pow(2, self.maxLevel-i));
  }

  var proj4def = proj4list[self.dataset.crs_name][1];
  if (getUrlParameter('dataproduct') == "DP3.30010.001") {
    // special case for DP3.30010.001, which doesn't use 1 pixel per meter resolution
    proj4def = proj4def.replace('+units=m', '+to_meter=0.1');
  }

  proj4.defs("visuscrs", proj4def);
  ol.proj.proj4.register(proj4);
  var proj = new ol.proj.get("visuscrs");

  self.tileGrid = new ol.tilegrid.TileGrid({
    resolutions: res,
    tileSize: [256,256],
    extent: [self.datasetCorner[0],
	     self.datasetCorner[1],
	     self.datasetCorner[0] + self.dataset.dims[X],
	     self.datasetCorner[1] + self.dataset.dims[Y]],
    origin: [0,
	     0]
  });

  var tileSource = new ol.source.TileImage({
    tileUrlFunction: self.getTileUrl,
    tileGrid: tileGrid,
    projection: proj
  });

  var tileLayer = new ol.layer.Tile({
    source: tileSource,
    projection: proj,
    opacity: 0.5,
      title: 'IDX'
  });
  self.VisusLayer = tileLayer;

  var view = new ol.View({
    projection: proj,
  });
  view.fit([self.datasetCorner[0],
	    self.datasetCorner[1],
	    self.datasetCorner[0] + self.dataset.dims[X],
	    self.datasetCorner[1] + self.dataset.dims[Y]]);

  dataproduct = getUrlParameter('dataproduct');
  site = getUrlParameter('site');
  reloadingDataset = false;

  lastDataproduct = sessionStorage.getItem("dataproduct");
  lastSite = sessionStorage.getItem("site");
  lastCenter = JSON.parse(sessionStorage.getItem("view-center"));
  lastResolution = JSON.parse(sessionStorage.getItem("view-resolution"));
  lastRotation = JSON.parse(sessionStorage.getItem("view-rotation"));
  lastField = sessionStorage.getItem("ui-field");
  lastBaseMap = sessionStorage.getItem("ui-baseMap");
  lastPalette = sessionStorage.getItem("ui-palette");
  lastPaletteMin = sessionStorage.getItem("ui-paletteMin");
  lastPaletteMax = sessionStorage.getItem("ui-paletteMax");
  lastOpacity = sessionStorage.getItem("ui-opacity");
  sessionStorage.clear();
  
  if (dataproduct == lastDataproduct &&
      site == lastSite) {
    reloadingDataset = true;
    
    if (lastCenter) {
      view.setCenter(lastCenter);
    }

    if (lastResolution) {
      view.setResolution(lastResolution);
    }

    if (lastRotation) {
      view.setRotation(lastRotation);
    }
  }

  view.on('change', function(){
    sessionStorage.setItem("view-center", JSON.stringify(view.getCenter()));
    sessionStorage.setItem("view-resolution", JSON.stringify(view.getResolution()));
    sessionStorage.setItem("view-rotation", JSON.stringify(view.getRotation()));
  });
  sessionStorage.setItem("dataproduct", dataproduct);
  sessionStorage.setItem("site", site);
  sessionStorage.setItem("view-center", JSON.stringify(view.getCenter()));
  sessionStorage.setItem("view-resolution", JSON.stringify(view.getResolution()));
  sessionStorage.setItem("view-rotation", JSON.stringify(view.getRotation()));
  
  
  const overlay = new ol.Overlay({
      element: container,
      positioning: "bottom-left",
  });

  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };


  if (0)
  self.map = new ol.Map({
    target: self.id,
    layers: [
      new ol.layer.Tile({ title: 'baseMap', source: new ol.source.XYZ({ url: self.baseMap})}),
      tileLayer,

    ],
    view: view,
    overlays: [overlay],
    controls: [new ol.control.Rotate({ autoHide: false })],
  });

  else
    self.map = new ol.Map({
        view: view,
        overlays: [overlay],
        controls: [new ol.control.Rotate({ autoHide: false })],
        target: self.id,
        layers: [
            new ol.layer.Group({
                title: 'Base map',
                layers: [
                    new ol.layer.Tile({
                        title: 'World Topo Map (ArcGIS)',
                        source: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'NatGeo (ArcGIS)',
                        source: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'USA Topo (ArcGIS)',
                        source: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Shaded Relief (ArcGIS)',
                        source: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Street (ArcGIS)',
                        source: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Terrain (ArcGIS)',
                        source: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}"}),
                        type: 'base'
                    }),

                    new ol.layer.Tile({
                        title: 'Open Street Map',
                        source: new ol.source.XYZ({ url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Road Map (Google)',
                        source: new ol.source.XYZ({ url: "http://mt1.google.com/vt/lyrs=m&hl=pl&&x={x}&y={y}&z={z}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Road Names (Google)',
                        source: new ol.source.XYZ({ url: "http://mt1.google.com/vt/lyrs=h&hl=pl&&x={x}&y={y}&z={z}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Road without Building (Google)',
                        source: new ol.source.XYZ({ url: "http://mt1.google.com/vt/lyrs=r&hl=pl&&x={x}&y={y}&z={z}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Satellite & Roads (Google)',
                        source: new ol.source.XYZ({ url: "http://mt1.google.com/vt/lyrs=y&hl=pl&&x={x}&y={y}&z={z}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Terrain & Roads (Google) ',
                        source: new ol.source.XYZ({ url: "http://mt1.google.com/vt/lyrs=p&hl=pl&&x={x}&y={y}&z={z}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Terrain (Google)',
                        source: new ol.source.XYZ({ url: "http://mt1.google.com/vt/lyrs=t&hl=pl&&x={x}&y={y}&z={z}"}),
                        type: 'base'
                    }),
                    new ol.layer.Tile({
                        title: 'Satellite (Google) ',
                        source: new ol.source.XYZ({ url: "http://mt1.google.com/vt/lyrs=s&hl=pl&&x={x}&y={y}&z={z}"}),
                        type: 'base'
                    }),

                    // new ol.layer.Tile({
                    //     title: 'MODIS',
                    //     source: new ol.source.XYZ({ url: "https://www.neonscience.org/field-sites/field-sites-map/ABBY"}),
                    //     type: 'base'
                    // }),

                    // new ol.layer.WMS(
                    //     "NASA Global Mosaic",
                    //     "http://wms.jpl.nasa.gov/wms.cgi",
                    //     {
                    //     layers: "global_mosaic"
                    //     }),
                    //
                    // new ol.layer.WMS(
                    //     "NASA Modis",
                    //     "http://wms.jpl.nasa.gov/wms.cgi",
                    //     {
                    //      layers: "modis"
                    // }),
                ]
            }),
            new ol.layer.Group({
                title: 'WMS Layers',
		/*
                layers: [
                    new ol.layer.Tile({
                        title: 'ahocevar ',
                        //extent: [-13884991, 2870341, -7455066, 6338219],
                        source: new ol.source.TileWMS({
                            url: 'https://ahocevar.com/geoserver/wms',
                            params: {'LAYERS': 'topp:states', 'TILED': true},
                            serverType: 'geoserver',
                            // Countries have transparency, so do not fade tiles:
                            transition: 0,
                        }),
                    }),
                    new ol.layer.Tile({
                        title: 'mesonet weather ',
                       // extent:  transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857'),
                        source: new ol.source.TileWMS({
                            attributions: ['Iowa State University'],
                            url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi',
                            params: {'LAYERS': 'nexrad-n0r-wmst'},
                        }),
                    }),

                    new ol.layer.Tile({
                        title: 'NLCD ',
                        //extent:  transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857'),
                        source: new ol.source.TileWMS(
                            'https://www.mrlc.gov/geoserver/mrlc_display/wms?service=WMS&',
                        {
                            layers: 'NLCD_2019_Impervious_descriptor_L48',
                            //layers: '',
                            opacity: 0.5,
                        }),
                    }),
                    new ol.layer.Tile({
                        title: 'One Earth ',
                        //extent:  transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857'),
                        source: new ol.source.TileWMS(
                            'http://onearth.jpl.nasa.gov/wms.cgi?',
                            {
                                layers: 'global_mosaic',
                                //layers: '',
                                opacity: 0.5,
                            }),
                    }),



                    // new ol.layer.Tile({
                    //     title: 'Daymet ',
                    //     //extent:  transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857'),
                    //     source: new ol.source.TileWMS({
                    //         attributions: ['Daymet'],
                    //         url: 'https://daymet.ornl.gov/data/send/saveData?lat={lat}&lon={lon}&measuredParams=prcp,tmax,tmin&year={year}',
                    //         transparent: true,
                    //     }, {
                    //         opacity: 0.5,
                    //         singleTile: true
                    //     }),
                    // }),
                    //# Daymet URL. It is important that the URL is structured correctly
                    //daymeturl = "https://daymet.ornl.gov/data/send/saveData?lat={lat}&lon={lon}&measuredParams=prcp,tmax,tmin&year={year}"

                    new ol.layer.Tile({
                        title: 'NASA MODIS daily terra ',
                        //extent:  transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857'),
                        source: new ol.source.TileWMS({
                            attributions: ['NASA Modis'],
                            url: 'http://wms.jpl.nasa.gov/wms.cgi',
                            layers: "daily_terra", // "modis,global_mosaic",
                            transparent: true,
                        }, {
                            opacity: 0.5,
                            singleTile: true
                        }),
                    }),
                    new ol.layer.Tile({
                        title: 'MODIS NEON   MOD17A3HGF ',
                        //extent:  transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857'),
                        source: new ol.source.TileWMS({
                            attributions: ['NASA Modis'],
                            url: 'https://modis.ornl.gov/cgi-bin/',
                            layers: "modis,global_mosaic",
                            transparent: true,
                            params: {'network': 'NEON','network_siteid': 'ABBY','product': 'MOD17A3HGF', },
                        }, {
                            opacity: 0.5,
                            singleTile: true
                        }),
                    }),
                    new ol.layer.Tile({
                        title: 'LifeMapper ',
                        //extent:  transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857'),
                        source: new ol.source.TileWMS({
                            attributions: ['LifeMapper '],
                            url: 'http://www.lifemapper.org/Services/WMS/',
                            //layers: "modis,global_mosaic",
                            transparent: true,
                            params: {'ScientificName': 'Ursus%20americanus' },
                        }, {
                            opacity: 0.5,
                            singleTile: true
                        }),
                    }),
                ]
*/
            }),
            new ol.layer.Group({
                title: 'Data',
                layers: [
                    tileLayer,
                    // new ol.layer.Vector({
                    //     title: 'Natura biotopes',
                    //     source: new ol.source.Vector({
                    //         format: new ol.format.WFS(),
                    //         url: naturaUrl
                    //     })
                    // })
                ]
            }),
            new ol.layer.Group({
                title: 'Flight Boundaries',
                layers: []
            }),
            new ol.layer.Group({
                title: 'Sampling Boundaries',
                layers: []
            })
        ],
    });



  self.addLayerToGroup = function(newlayer, groupTitle) {
    self.map.getLayers().forEach(function(layer) {
      if (layer instanceof ol.layer.Group &&
	  layer.get("title") === groupTitle &&
	  layer.getLayers) {
	innerLayers = layer.getLayers();
	innerLayers.push(newlayer);
	if (innerLayers instanceof ol.Collection) {
	  layer.setLayers(innerLayers);
	}
      }
    });
  };

  self.addGeoJsonLayer = function(url, title){
    var vector_source = new ol.source.Vector({
      projection : 'EPSG:4326',
      url: url,
      format: new ol.format.GeoJSON()
    });
    vector_layer = new ol.layer.Vector({
      title: title,
      source: vector_source,
      visible: false,
    });
    self.addLayerToGroup(vector_layer, 'Sampling Boundaries');
  };

  self.addKMLLayer = function(url, title){
    var vector_source = new ol.source.Vector({
      projection : 'EPSG:4326',
      url: url,
      format: new ol.format.KML()
    });
    vector_layer = new ol.layer.Vector({
      title: title,
      source: vector_source,
      visible: false
    });
    self.addLayerToGroup(vector_layer, 'Flight Boundaries');
  };
  
  vectorUrl = self.dataset.protocol + "//" + self.dataset.host + "/raw_data/" + self.dataset.name + "/vector/";
  vectorIndexUrl = vectorUrl + "index.json";
  $.getJSON(vectorIndexUrl,
	    data => {
	      data.forEach(el => self.addKMLLayer(vectorUrl + el, el));
	    });
  
  
  self.addGeoJsonLayer(self.dataset.protocol + "//" + self.dataset.host + "/site_boundaries/terrestrialSamplingBoundairies/" + getUrlParameter('site') + ".geojson", "Terrestrial Sampling");
  self.addGeoJsonLayer(self.dataset.protocol + "//" + self.dataset.host + "/site_boundaries/plotCentroids/" + getUrlParameter('site') + ".geojson", "Plot Centroids");
  self.addGeoJsonLayer(self.dataset.protocol + "//" + self.dataset.host + "/site_boundaries/plotPoints/" + getUrlParameter('site') + ".geojson", "Plot Points");
  self.addGeoJsonLayer(self.dataset.protocol + "//" + self.dataset.host + "/site_boundaries/plotPolygons/" + getUrlParameter('site') + ".geojson", "Plot Polygons");
  
  
  self.map.addControl(new ol.control.LayerSwitcher());
  

  if (self.ADD_SCALE_LEGEND == 1) {
    //map.addControl(new ol.control.ScaleLine({units: "metric"}));
    self.map.addControl(new ol.control.ScaleLine({units: "us"}));
  }


  // query the value under the cursor when the mouse is clicked
  self.map.on('singleclick', function (evt) {
    const coordinate = evt.coordinate;
    const lonLat = ol.proj.toLonLat(coordinate, self.map.getView().getProjection())
    const crsCoord = ol.proj.fromLonLat(lonLat, proj);

    toh = self.dataset.maxh;
    x = Math.trunc(crsCoord[0] - self.datasetCorner[0]);
    y = Math.trunc(crsCoord[1] - self.datasetCorner[1]);

    if (x < 0 || x >= self.dataset.dims[0] ||
	y < 0 || y >= self.dataset.dims[1]) {
      return;
    }

    base_url=self.dataset.base_url
      +'&dataset='+self.dataset.name
      +'&compression='//+self.compression             
      +'&maxh='+ self.dataset.maxh
      +'&time='+self.time
      +'&field='+self.field;

    url = base_url
      +'&action=boxquery'
      +'&box='
      +x+'%20'+x+'%20'
      +y+'%20'+y
      +'&toh='+toh;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
      if (this.status == 200) {
	  dv = new DataView(this.response);
	  f = 0;
	  if (dv.byteLength == 4) {
	      f = dv.getFloat32(0, true);
	  }
	  else if (dv.byteLength == 8) {
	      f = dv.getFloat64(0, true);
	  }
	  contentCoords.innerHTML =
	  '<p>' +
	  'Coordinate: <code>' + Math.round(lonLat[1]*100)/100 + ' ' + Math.round(lonLat[0]*100)/100 + '</code></p><p>'+self.field+
	  ' Value: <code>'+ Math.round(f*1000000)/1000000 +'</code>' +
	  '</p>';
	  contentR.innerHTML = '<p><code font-size:0.65rem>' + self.getNeonRCode() + '</code></p>';
	  contentPython.innerHTML = '<p><code font-size:0.65rem>' + self.getVisusPythonCode() + '</code></p>';

	overlay.setPosition(coordinate);
	console.log(self.getNeonRCode());
	console.log(self.getVisusPythonCode());
      }
    };
    xhr.send();
  });

    const mapScreenshotParam = {
        dim: [190, 160]
    };

    // document.getElementById('export-jpeg-button').onclick = async() => {
    //     doDonwload('map-screenshot.jpg');
    // };

    //document.getElementById('export-png-button').onclick = async() => {
     //   mapScreenshotParam.format = "png";
        //doDonwload('map-screenshot.png'); //AAG took out.. errors..
    //};

    // document.getElementById('export-pdf-button').onclick = async() => {
    //     mapScreenshotParam.format = "jpeg";
    //     const response = await doScreenshot();
    //     createPDFDocument(response);
    // };

    function createPDFDocument(data) {
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.setFont("times");
        pdf.setFontSize(16);
        pdf.setFontStyle("bold");
        const title = "ol-map-screenshop example!";
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.text((pageWidth / 2) - (title.length), 20, title);
        pdf.text(pageWidth, 20, title);
        pdf.setFontSize(10);
        pdf.setFontStyle("italic");
        pdf.text(10, 28, "Location: Córdoba, Andalucia, España");
        pdf.addImage(data.img, 'JPEG', 10, 30, data.w, data.h);
        pdf.save('map-screenshot.pdf');
    }

    async function doDonwload(fileName) {
        const response = await doScreenshot();
        const element = document.createElement('a');
        element.setAttribute('href', response.img);
        element.setAttribute('download', fileName);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    
    async function doScreenshot(map) {
        try {
            return await olMapScreenshot.getScreenshot(map, mapScreenshotParam);
        } catch (ex) {
            showloader(false);
            alert(ex.message);
        }
    }

    self.onSaveScreenShot = function() {
        doScreenshot(self.map)
    }

  // self.onSaveScreenShot = function(){
  //
  //         map.once('rendercomplete', function () {
  //             const mapCanvas = document.createElement('canvas');
  //             const size = self.map.getSize();
  //             mapCanvas.width = size[0];
  //             mapCanvas.height = size[1];
  //             const mapContext = mapCanvas.getContext('2d');
  //             Array.prototype.forEach.call(
  //                 document.querySelectorAll('.ol-layer canvas'),
  //                 function (canvas) {
  //                     if (canvas.width > 0) {
  //                         const opacity = canvas.parentNode.style.opacity;
  //                         mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
  //                         const transform = canvas.style.transform;
  //                         // Get the transform parameters from the style's transform matrix
  //                         const matrix = transform
  //                             .match(/^matrix\(([^\(]*)\)$/)[1]
  //                             .split(',')
  //                             .map(Number);
  //                         // Apply the transform to the export map context
  //                         CanvasRenderingContext2D.prototype.setTransform.apply(
  //                             mapContext,
  //                             matrix
  //                         );
  //                         mapContext.drawImage(canvas, 0, 0);
  //                     }
  //                 }
  //             );
  //             if (navigator.msSaveBlob) {
  //                 // link download attribute does not work on MS browsers
  //                 navigator.msSaveBlob(mapCanvas.msToBlob(), 'neon_map.png');
  //             } else {
  //
  //                 const link = document.getElementById('image-download');
  //                 link.download = 'neon_map' + '.png';
  //                 link.href = mapCanvas.toDataURL();
  //                 link.click();
  //             }
  //         });
  //         self.map.renderSync();
  //
  // };

  field = self.dataset.fields[0].name;
  palette = "NDVI_Beach";
  paletteMin = 0;
  paletteMax = 1;
  opacity = 0.5;
  baseMap = null;

  
  if (reloadingDataset) {
    field = lastField;
    baseMap = lastBaseMap;
    palette = lastPalette;
    paletteMin = lastPaletteMin;
    paletteMax = lastPaletteMax;
    opacity = lastOpacity;
  }

  // call this later, after the visus object is done setting up
  setTimeout(updateUI, 0, field, baseMap, palette, paletteMin, paletteMax, opacity);

  return self;
};
