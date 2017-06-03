

//////////////////////////////////////////////////////////////////////
//example http://atlantis.sci.utah.edu/mod_visus?action=list&format=json
function visusAsyncGetListOfDatasets(url) 
{
  fetch(url,{method:'get'})
  .then(function (response) {  
    
    if (response.headers.get("content-type").indexOf("application/json") == -1) 
      throw new TypeError('Response from " + url + " is not application/json"');
    
    return response.json();
  })
  .then(function(obj) {
    console.log("url " + url + " response.json(): " + obj);
    
    var arr=obj.childs;
    var ret=[];
    while (arr.length > 0) 
    {
      item = arr.shift();
      if (item.name == "group" && 'childs' in item)
        arr = item.childs.concat(arr);
      else if (item.name == "dataset")
        ret.push(item.attributes.name);
      else
        console.log("unknown item encountered: "+item.name);
    }
    
    console.log("List of datasets: "+ret);
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
    ret.base_url = parse_url.protocol+'//'+parse_url.hostname+':'+parse_url.port+'/mod_visus?';    
    
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
  
  //createDefaultGui
  self.createDefaultGui=function() 
  {
    self.gui={};
    
    var body=(
        "<table style='width: 100%;height: 100%;border-spacing:0px;padding:0px;'>"+
        "  <tr style='width: 100%;height: 100%;'><td>"+
        "    <table style='width: 100%;height:100%;border-spacing:0px;padding:0px;'>"+
        "      <tr style='height:100%;'>"+
        "        <td ><div id='$(id)osd' style='width: 100%;height: 100%;background-color:#66ccff;'></div></td>"+
        "      </tr>"+
        "    </table>"+
        "  <tr style='width: 100%;'><td>"+      
        "    <table style='width: 100%;border-spacing:0px;padding:0px;'>"+     
        "      <tr style='width:100%;'>"+
        "        <td>Field"+
        "        <td><select id='$(id)field' ></select>"+   
        "        <td>Axis"+
        "        <td>"+
        "          <select id='$(id)axis'>"+
        "            <option value='0'>X</option>"+
        "            <option value='1'>Y</option>"+
        "            <option value='2'>Z</option>"+
        "          </select>"+
        "        <td>Slice"+
        "        <td width='100%'>"+
        "          <input id='$(id)slice' type='range' step='1' style='width:100%;'>"+
        "        <td><output id='$(id)show_slice'>Value</output>"+
        "      </tr>"+
        "    </table>"+
        "  </tr>"+
        "  <tr style='width: 100%;'><td>"+      
        "    <table style='width: 100%;border-spacing:0px;padding:0px;'>"+
        "      <tr style='width:100%;'>"+
        "        <td>Time"+
        "        <td><input  id='$(id)time' type='range' step='1' >"+
        "        <td><output id='$(id)show_time'>Value</output>"+
        "        <td>Palette"+
        "        <td><select id='$(id)palette'></select>"+
        "        <td>Min<td ><input  id='$(id)palette_min' >"+
        "        <td>Max<td ><input  id='$(id)palette_max' >"+
        "        <td>Interpolation"+
        "          <select id='$(id)palette_interp'>"+
        "            <option value='Default'>Default</option>"+
        "            <option value='Flat'>Flat</option>"+
        "            <option value='Inverted'>Inverted</option>"+
        "          </select>"+        
        "      </tr>"+
        "    </table>"+
        "  </tr>"+          
        "</table>")
      .split("$(id)").join(self.id);
    
    document.getElementById(self.id).innerHTML=body;
    
    self.gui.osd = document.getElementById(self.id+'osd');
    
    self.gui.axis = document.getElementById(self.id+'axis');
    if (self.gui.axis)
      self.gui.axis.onchange=function(){ self.setSlice(self.gui.axis.value,self.gui.slice.value); self.refresh();};     
    
    self.gui.slice = document.getElementById(self.id+'slice');
    if (self.gui.slice)
    {
      self.gui.slice.oninput=function(){self.setSlice(self.gui.axis.value,self.gui.slice.value); self.refresh();}   
      self.gui.slice.min=0;
      self.gui.slice.step=1;  
    }
    
    self.gui.show_slice = document.getElementById(self.id+'show_slice');
    
    self.gui.field = document.getElementById(self.id+'field');
    if (self.gui.field)
    {
      self.gui.field.onchange=function(){ 
        self.setField(self.gui.field.value); 
        self.refresh();
      };    
      
      for(var i = 0; i < self.dataset.fields.length; i++) {
        var fieldname = self.dataset.fields[i].name;
        var item = document.createElement("option");
        item.textContent = item.value = fieldname;
        self.gui.field.appendChild(item);
      } 
    } 
    
    self.gui.time = document.getElementById(self.id+'time');
    if (self.gui.time)
    {
      self.gui.time.min=self.dataset.timesteps[0];
      self.gui.time.max=self.dataset.timesteps[1];
      self.gui.time.step=1;  
      self.gui.time.oninput=function(){ 
        self.setTime(self.gui.time.value); 
        self.refresh();
      }   
    }; 
    
    self.gui.show_time = document.getElementById(self.id+'show_time');
    
    self.gui.palette = document.getElementById(self.id+'palette');
    if (self.gui.palette)
    {
      palettes=['','grayopaque','graytransparent','hsl' ,'banded','bry','bgry','gamma'
        ,'hot1','hot2','ice' ,'lighthues','rich','smoothrich','lut16'
        ,'BlueGreenDivergent','AsymmetricBlueGreenDivergent' ,'GreenGold'
        ,'LinearGreen','LinearTurquois','MutedBlueGreen','ExtendedCoolWarm','AsymmetricBlueOrangeDivergent'
        ,'LinearYellow','LinearGray5','LinearGray4'];
        
      for(var i = 0; i < palettes.length; i++) {
        var item = document.createElement("option");
        item.textContent = item.value = palettes[i];
        self.gui.palette.appendChild(item);
      }  
    }
    
    self.gui.palette_min    = document.getElementById(self.id+'palette_min');
    self.gui.palette_max    = document.getElementById(self.id+'palette_max');
    self.gui.palette_interp = document.getElementById(self.id+'palette_interp');
    
    //refreshGui
    self.refreshGui=function()
    {
      if (self.gui.axis)
        self.gui.axis.value=self.axis;
        
      if (self.gui.slice)
      {
        self.gui.slice.max=self.dataset.pow2dims[self.axis]-1;  
        self.gui.slice.value=self.slice; 
      }
      
      if (self.gui.show_slice)
        self.gui.show_slice.value=self.slice;
        
      if (self.gui.field)
        self.gui.field.value=self.field;
        
      if (self.gui.time)
        self.gui.time.value=self.time;
        
      if (self.gui.show_time)
        self.gui.show_time.value=self.time;
        
      if (self.gui.palette)
        self.gui.palette.value=self.palette;
        
      if (self.gui.palette_min)
        self.gui.palette_min.value=self.palette_min;
        
      if (self.gui.palette_max)
        self.gui.palette_max.value=self.palette_max;
        
      if (self.gui.palette_interp)
        self.gui.palette_interp.value=self.palette_interp;    
    }    
  };
  
  //refresh
  self.refresh=function() 
  { 
    self.refreshGui();
    
    permutation=[[1,2,0],[0,2,1],[0,1,2]];
    X = permutation[self.axis][0];
    Y = permutation[self.axis][1];
    Z = permutation[self.axis][2];
    
    document.getElementById(self.id+'osd').innerHTML=""; 
    self.osd=OpenSeadragon({
      id: self.id+'osd', 
      prefixUrl: 'https://raw.githubusercontent.com/openseadragon/svg-overlay/master/openseadragon/images/', 
      showNavigator: self.showNavigator, 
      debugMode: self.debugMode, 
      tileSources: {
        width:      self.dataset.dims[X],
        height:     self.dataset.dims[Y],  
        tileWidth:  self.tile_size[X], 
        tileHeight: self.tile_size[Y],
        minLevel:   self.minLevel, 
        maxLevel:   self.maxLevel, 
        getTileUrl: function(level,x,y)
        {  
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
        }
      }
    });    
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
  
  //setSlice
  self.setSlice=function(axis,slice)
  {
    self.axis =parseInt(axis);
    self.slice=clamp(parseInt(slice),0,self.dataset.pow2dims[axis]-1);
  }  
  
  //setField
  self.setField=function(value)
  {
    self.field=value;
  }
  
  //setTime
  self.setTime=function(value)
  {
    self.time=value;
  }
  
  //setPalette
  self.setPalette=function(value,min,max,interp)
  {
    self.palette=value;
    self.palette_min=min;
    self.palette_max=max;
    self.palette_interp=interp;
  }
  
  self.createDefaultGui();
  
  self.setSlice(2,0,false); 
  self.setField(self.dataset.fields[0].name);
  self.setTime(self.dataset.timesteps[0]);
  self.setPalette("",0,0,"Default");
  
  self.refresh();
  
  return self;
};
