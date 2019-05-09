/*
 * Copyright (c) 2017 University of Utah 
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

const SLICE_RENDER_MODE = '0'
const VOLUME_RENDER_MODE = '1'
const ISOCONTOUR_RENDER_MODE = '2'

//////////////////////////////////////////////////////////////////////
//example http://atlantis.sci.utah.edu/mod_visus?action=list&format=json
function visusAsyncGetListOfDatasets(url) 
{
  return fetch(url,{method:'get'})
  .then(function (response) {  
    
    if (response.headers.get("content-type").indexOf("application/json") == -1) 
      throw new TypeError('Response from " + url + " is not application/json"');
    
    return response.json();
  })
  .then(function(obj) {
    //console.log("url " + url + " response.json(): " + obj);
    
    var arr=obj.childs;
    var ret=[];
    while (arr.length > 0) 
    {
      item = arr.shift();
      if (item.name == "group" && 'childs' in item)
        arr = item.childs.concat(arr);
      else if ('childs' in item)
        arr = item.childs.concat(arr);
      else if (item.name == "dataset")
        ret.push(item.attributes.name);
      else
        console.log("unknown item encountered: "+item.name);
    }
    
    ret=ret.sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
    
    //console.log("List of datasets: "+ret);
    return ret;
  }) 
}



//////////////////////////////////////////////////////////////////////
//example http://atlantis.sci.utah.edu/mod_visus?action=readdataset&dataset=2kbit1
function visusAsyncLoadDataset(url) 
{
  return fetch(url,{method:'get'})
  .then(function (response) {
    
    if (response.headers.get("content-type").indexOf("application/octet-stream")==-1) 
      throw new TypeError('Response from "' + url + '" is not application/octet-stream"');
      
    return response.text();
  })
  .then(function (content) {
    
    var lines = content.split('\n');

    ret={};
    ret.url=url;
    
    //"http://example.com:3000/pathname/?search=test#hash"; 
    var parseUrl=function(url) {
      
      var a = document.createElement('a');
      a.href = url;  
      
      ret={};
      ret.protocol = a.protocol; // "http:"
      ret.hostname = a.hostname; // "example.com"
      ret.port     = a.port;     // "3000"
      ret.pathname = a.pathname; // "/pathname/"
      ret.search   = a.search;   // "?search=test"
      ret.hash     = a.hash;     // "#hash"
      ret.host     = a.host;     // "example.com:3000"   
      
      ret.getSearchVariable=function(name) 
      {
        var query = ret.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) 
        {
          var pair = vars[i].split('=');
          if (decodeURIComponent(pair[0]) == name) {
            return decodeURIComponent(pair[1]);
          }
        }
      };
      
      return ret; 
    };    
    
    parse_url= parseUrl(ret.url);  
    ret.name=parse_url.getSearchVariable("dataset");
    ret.base_url = parse_url.protocol+'//'+parse_url.hostname+':'+parse_url.port+parse_url.pathname+'?';
    
    ret.timesteps=[0,0];
  
    for(var i = 0;i < lines.length;i++)
    {
      //box
      if (lines[i]=="(box)") 
      {
        var dims=lines[++i].split(' ');
        ret.dims=[];
        ret.dims[0]=parseInt(dims[1])+1;
        ret.dims[1]=parseInt(dims[3])+1;
        ret.dims[2]=parseInt(dims[5])+1;
        continue;
      }
      
      //bits
      if (lines[i]=="(bits)") 
      {
        ret.bitmask=lines[++i];
        ret.maxh=ret.bitmask.length-1;
        continue;  
      }
      
      //bitsperblock
      if (lines[i]=="(bitsperblock)") 
      {
        ret.bitsperblock=parseInt(lines[++i]);
        continue;  
      }        
      
      //fields
      if (lines[i]=="(fields)") 
      {
        ret.fields=[];
        var buf="";
        do {
          buf=buf.concat(lines[++i]);
        } 
        while (!lines[i+1].startsWith("("));
        
        var v=buf.split('+');
        for (var j=0;j<v.length;j++) 
        {
          var s=v[j].trim().split(' ');
          
          var field={};
          field.name=s[0];
          field.min=0;
          field.max=0;
          for (var k=1;k<s.length;k++) 
          {
            if (s[k].substring(0,3)=="min") 
            {
              var minval=parseFloat(s[k].substring(4,s[k].length-1));
              field.min=minval;
            }
            if (s[k].substring(0,3)=="max") 
            {
              var maxval=parseFloat(s[k].substring(4,s[k].length-1));
              field.max=maxval;
            }
          }
          ret.fields.push(field);
        }
        
        continue;
      }
      
      //time
      if (lines[i]=="(time)") 
      {
        var s=lines[++i].trim().split(' ');
        if (s[0]=="*") 
        {
          console.log("TODO: I don't know what * means for timesteps");
        }
        else 
        {
          var start=parseInt(s[0]);
          
          //old format
          if (!isNaN(start)) 
          {  
            var end=parseInt(s[1]);
            ret.timesteps=[start,end];
          }
          
          //new format (start,end,step)
          else 
            { 
            for (t=1;t<s.length;t++) 
            {
              var range=s[t].substring(1,s[t].length-1).split(','); 
              var start=parseInt(range[0]);
              var end  =parseInt(range[1]);
              //just ignore step for now
              ret.timesteps=[Math.min(start,ret.timesteps[0]),Math.max(end,ret.timesteps[1])];
            }
          }
        }
        
        continue;
      }
    }
    
    correct_bitmask=ret.bitmask;
    
    ret.nbits=[0,0,0];
    ret.pow2dims=[1,1,1];
    ret.bitmask=['V'];
    
    for (I=1;I<correct_bitmask.length;I++)  
    {
      A=correct_bitmask.charCodeAt(I)-"0".charCodeAt(0);
      ret.bitmask.push(A);
      ret.nbits[A]+=1;
      ret.pow2dims[A]*=2;
    }  
    
    ret.dim=ret.nbits[2]>1? 3 :2;  
    

    console.log("Dataset details: ");
    console.log("  url: "+ret.url);
    console.log("  base_url: "+ret.base_url);
    console.log("  name: "+ret.name);
    console.log("  dim: "+ret.dim);    
    console.log("  dims: "+ret.dims);
    console.log("  bitmask: "+ret.bitmask);
    console.log("  maxh: "+ret.maxh);
    console.log("  bitsperblock: "+ret.bitsperblock);
    console.log("  nbits: "+ret.nbits);
    console.log("  pow2dims: "+ret.pow2dims);
    console.log("  fields: "+JSON.stringify(ret.fields));
    console.log("  timesteps: "+ret.timesteps);
    
    return ret;
  })
}

//////////////////////////////////////////////////////////////////////
function clamp(value,a,b) {
  if (value<a) return a;
  if (value>b) return b;
  return value; 
}  



//////////////////////////////////////////////////////////////////////
function VisusOSD(params) 
{
  var self=this;
  
  self.id             = params['id'];
  self.url            = params['url'];
  self.dataset        = params['dataset'];
  self.compression    = params['compression']    || 'png';
  self.showNavigator  = params['showNavigator']  || true;
  self.debugMode      = params['debugMode']      || false;
  self.palette        = params['palette']        || "";
  self.palette_min    = params['palette_min']    || 0;
  self.palette_max    = params['palette_max']    || 0;
  self.palette_interp = params['palette_interp'] || 'Default';
  
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
        //if(d.min != "0" || d.max != "0"){
          self.palette_min = d.min; 
          self.palette_max = d.max;
          //console.log("field", self.field,"using min max ", d.min, d.max)
        //}
      }
    }
  }

  //getTileUrl
  self.getTileUrl=function(level,x,y) {  
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
    
    if (self.dataset.dim==2)
    {
      toh=level*2;
      vs = Math.pow(2, self.maxLevel-level); 
      w=self.tile_size[0] * vs; x1=x * w; x2=x1 + w;
      h=self.tile_size[1] * vs; y1=y * h; y2=y1 + h;
      
      //mirror y
    	{
    	  yt = y1; 
    	  y1 = self.dataset.dims[1] - y2; 
    	  y2 = self.dataset.dims[1] - yt;
    	}

    	ret = base_url
    	  +'&action=boxquery'
    	  +'&box='
    	    +clamp(x1, 0, self.dataset.dims[0])+'%20'+(clamp(x2, 0, self.dataset.dims[0])-1)+'%20'
    	    +clamp(y1, 0, self.dataset.dims[1])+'%20'+(clamp(y2, 0, self.dataset.dims[1])-1)
    	  +'&toh='+toh;

    }
    else
    {
      toh=self.dataset.maxh-(self.maxLevel-level)*3;

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
    
    //console.log(ret);
    return ret;
  }; 
  
  //download_query
  self.download_query=function(req_lev=self.level, box=null)  { 
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
    return self.osd.viewport.getBounds();
  }

  self.setBounds=function(new_bounds) {
    self.osd.viewport.fitBounds(new_bounds,true);
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
  
  self.tileSource= {
      width:      self.dataset.dims[X],
      height:     self.dataset.dims[Y],  
      tileWidth:  self.tile_size[X], 
      tileHeight: self.tile_size[Y],
      minLevel:   self.minLevel, 
      maxLevel:   self.maxLevel, 
      getTileUrl: self.getTileUrl
    };
  
  //here I'm tring to preserve the viewort
  var bRecycleOSD=false;
  if (self.osd && self.osd.world.getItemAt(0))
  {
    var source=self.osd.world.getItemAt(0).source;
    bRecycleOSD=
      source.width==self.dataset.dims[X]   &&
      source.height==self.dataset.dims[Y]  && 
      source.tileWidth==self.tile_size[X]  &&
      source.tileHeight==self.tile_size[Y] && 
      source.minLevel==self.minLevel       &&
      source.maxLevel==self.maxLevel       &&
      source.getTileUrl==self.getTileUrl;
  }
  
  if (bRecycleOSD)
  {
    console.log("Using existing OpenSeadragon instance");
  }
  else
  {
    console.log("Creating OpenSeadragon instance");
    var osd_id=self.id+"_osd";
    document.getElementById(self.id).innerHTML="<div id='"+osd_id+"' style='width: 100%;height: 85vh'></div>";     
    
    self.osd=OpenSeadragon({
      id : osd_id,
      prefixUrl : 'https://raw.githubusercontent.com/sci-visus/OpenVisusJS/master/images/', //'https://raw.githubusercontent.com/openseadragon/openseadragon/master/images/',
      tileSources: self.tileSource
    }); 
  }
  
  self.osd.showNavigator=self.showNavigator;
  self.osd.preserveViewport= true;
  self.osd.debugMode=self.debugMode;
  self.pre_bounds = null;
    
  //see https://github.com/openseadragon/openseadragon/issues/866
  self.refresh=function() 
  { 
    guessRange();

    var oldImage=self.osd.world.getItemAt(0);

    self.osd.addTiledImage({
      tileSource : self.tileSource,
      success : function() {
        if (oldImage){
          self.osd.world.removeItem(oldImage);
          // we are keeping only one item to avoid rendering of mixed tiles
          while(visus1.osd.world.getItemCount() > 1)
            visus1.osd.world.removeItem(self.osd.world.getItemAt(1))
        }
      }    
    });  

    if(self.pre_bounds != null){
      self.setBounds(self.pre_bounds)
      setTimeout(self.selfpresetbounds, 2000)
    }
  };

  if (bRecycleOSD) {
    self.refresh();
  }
  
  return self;
};

//////////////////////////////////////////////////////////////////////
function VisusVR(params) 
{

  var self=this;
  
  self.id             = params['id'];
  self.url            = params['url'];
  self.dataset        = params['dataset'];
  self.compression    = params['compression']    || 'raw';
  self.showNavigator  = params['showNavigator']  || true;
  self.debugMode      = params['debugMode']      || false;
  self.palette        = params['palette']        || "";
  self.palette_min    = params['palette_min']    || NaN;
  self.palette_max    = params['palette_max']    || NaN;
  self.palette_interp = params['palette_interp'] || 'Default';
  
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

  level=24

  x=0
  y=0
  z=0

  self.minLevel=0;
  self.maxLevel=33;
  self.compression='raw'
  self.render_type=SLICE_RENDER_MODE
  self.nsamples=[]

  // var div=document.getElementById(self.id);

  // var osd_id=self.id+"_osd";

  // div.innerHTML="<div id='"+osd_id+"' style='width: 100%;height: 100%'></div>"; 

  //refresh
  self.refresh=function(req_lev=self.level) 
  { 
    //permutation=[[1,2,0],[0,2,1],[0,1,2]];
    X = 0;//permutation[self.axis][0];
    Y = 1;//permutation[self.axis][1];
    Z = 2;//permutation[self.axis][2];
   
    // if(!self.render_type && req_lev==self.level)
    req_lev=level= 24 > self.dataset.maxh ? self.dataset.maxh : level
    //console.log("using level "+level+" with maxh "+self.dataset.maxh)

    base_url=self.dataset.base_url
      +'&dataset='+self.dataset.name
      +'&compression='+self.compression             
      +'&maxh='+ self.dataset.maxh
      +'&time='+self.time
      +'&field='+self.field
      //+'&palette='+self.palette
      //'&palette_min='+self.palette_min
      //'&palette_max='+self.palette_max
      //'&palette_interp='+self.palette_interp;
    
      toh=clamp(req_lev,0,self.maxLevel);
      vs = Math.pow(2, self.maxLevel-req_lev); 
      w=self.tile_size[0] * vs; x1=x * w; x2=x1 + w;
      h=self.tile_size[1] * vs; y1=y * h; y2=y1 + h;
      d=self.tile_size[2] * vs; z1=z * d; z2=z1 + d;
      
      if(render_type==SLICE_RENDER_MODE){
        //console.log("slice "+self.slice+" axis "+self.axis);
        if(self.axis=='0'){
          x1=Math.floor(self.dataset.dims[0]*(self.slice/100.0))
          x2=x1
          //console.log("box "+x1+" "+x2)
        }else if(self.axis=='1'){
          y1=Math.floor(self.dataset.dims[1]*(self.slice/100.0))
          y2=y1+1
        }else if(self.axis=='2'){
          z1=Math.floor(self.dataset.dims[2]*(self.slice/100.0))
          z2=z1+1;
        }
        
        ret = base_url
          +'&action=pointquery'
          +'&box='
          +clamp(x1, 0, self.dataset.dims[0])+'%20'+(clamp(y1, 0, self.dataset.dims[0]))+'%20'+clamp(z1, 0, self.dataset.dims[2])+'%20'
          +clamp(x2, 0, self.dataset.dims[0]-1)+'%20'+(clamp(y2, 0, self.dataset.dims[1])-1)+'%20'+(clamp(z2, 0, self.dataset.dims[2])-1)
          +'&toh='+toh;

      }else{
        ret = base_url
          +'&action=boxquery'
          +'&box='
            +clamp(x1, 0, self.dataset.dims[0])+'%20'+(clamp(x2, 0, self.dataset.dims[0])-1)+'%20'
            +clamp(y1, 0, self.dataset.dims[1])+'%20'+(clamp(y2, 0, self.dataset.dims[1])-1)+'%20'
            +clamp(z1, 0, self.dataset.dims[2])+'%20'+(clamp(z2, 0, self.dataset.dims[2])-1)
          +'&toh='+toh;

      }

      //console.log(ret);

      self.query_str = ret;

      return ret;
  }; 
  
  self.setRenderType=function(value){
    self.render_type=value;
  };

  //getAxis
  self.getAxis=function() {
    return self.axis; 
  };
  
  //setAxis
  self.setAxis=function(value) {
    self.axis=value;
    self.slice=clamp(self.slice,0,100);//self.dataset.pow2dims[axis]-1);
  };
  
  //getSlice
  self.getSlice=function() {
    return self.slice;
  };
  
  //setSlice
  self.setSlice=function(value) {
    self.slice=clamp(value,0,100);//self.dataset.pow2dims[axis]-1);
  } ; 
  
  // //getField
  self.getField=function() {
    return self.field;
  };

  self.setNSamples=function(value) {
    self.nsamples=value;
  }
  
  self.getNSamples=function(){
    return self.nsamples;
  }

  self.setDType=function(value) {
    self.dtype=value;
  }

  self.getDataSize=function(level){
    var sample_size = 0;

    if(self.dtype.includes("8"))
      sample_size=1
    if(self.dtype.includes("32"))
      sample_size=4
    if(self.dtype.includes("64"))
      sample_size=8
    
    sd=[1,1,1];
    for (I=0;I<level;I++) 
      sd[self.dataset.bitmask[self.dataset.maxh-I]]*=2;

    for(d=0;d<3;d++)
      if(sd[d]>dataset.dims[d])
        sd[d]=dataset.dims[d]

    if(self.render_type==SLICE_RENDER_MODE)
      sd[axis] = 1

    mag=sd[0]*sd[1]*sd[2]
    //console.log("level "+level+" nsamples "+mag+"="+sd)

    return (mag*sample_size)/1024.0/1024.0

  }

  // //setField
  self.setField=function(value) {
    self.field=value;
  };
  
  // //getTime
  self.getTime=function() {
    return self.time; 
  };
  
  //setTime
  self.setTime=function(value) {
    self.time=value;
  };
  
  // //getPalette
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
   
  self.setAxis(2);
  self.setSlice(50);
  self.setField(self.dataset.fields[0].name);
  self.setTime(self.dataset.timesteps[0]);
  self.setPalette("");
  self.setPaletteMin(NaN);
  self.setPaletteMax(NaN);
  self.setPaletteInterp("Default");
  
  self.refresh();
  
  return self;
};
