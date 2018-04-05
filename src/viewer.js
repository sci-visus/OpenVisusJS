
var visus1;
let renderer;
let curr_render_type;

function
toArray(buffer, dataType)
{
   switch (dataType) {
        case 'uint8':
                return new Uint8Array(buffer)
        case 'uint8[3]':
                return new Uint8Array(buffer)
        case 'uint8[4]':
                return new Uint8Array(buffer)
        case 'uint16':
                return new Uint16Array(buffer)
        case 'int8':
                return new Int8Array(buffer)
        case 'int16':
                return new Int16Array(buffer)
        case 'float32':
                return new Float32Array(buffer)
        case 'float64':
                return new Float32Array(buffer)
        default:
           console.err("Data type not supported")
    }
}

function notifyStatus(new_text)
{
  if(document.getElementById('2dCanvas').hidden==true){
    document.getElementById('status_bar').hidden=false
    document.getElementById('status').innerHTML="  "+new_text
  }
  else hideStatus();
}

function hideStatus(){ document.getElementById('status_bar').hidden=true }

function fetch_and_draw(query_str, reset_view=1)
{
  data_size=[256, 256, 256]
  dtype='uint8'

  notifyStatus("Streaming...");

  fetch(query_str, {method:'get'})
    .then(response => {
      if (!response.ok)
        throw new Error('Response not ok: ' + response.statusText)
      
      nsamples=response.headers.get('visus-nsamples')
      var dims=nsamples.split(' ');
      data_size[0]=parseInt(dims[0]);
      data_size[1]=parseInt(dims[1]);
      data_size[2]=parseInt(dims[2]);
      
      if(isNaN(data_size[2]))
        data_size[2]=1

      visus1.setNSamples(data_size)
      //console.log(data_size)

      dtype=response.headers.get('visus-dtype')

      //console.log(dtype)

      return response.arrayBuffer()
    }).then(data => {
      
      notifyStatus("Rendering...");

      const start = async function() {
        if (!renderer || (visus1.render_type != curr_render_type)){
          //console.log("creating renderer type "+visus1.render_type)
          if(visus1.render_type==ISOCONTOUR_RENDER_MODE){
            renderer = await dvr(document.getElementById('3dCanvas'), 'surface')
          }
          else
            renderer = await dvr(document.getElementById('3dCanvas'), 'volume')
        }
        
        curr_render_type = visus1.render_type;

        var palette_str = document.getElementById('palette').value;

        var colormap = get_palette_data(palette_str)
        
        var array = toArray(data, visus1.dtype)
        renderer.uploadData(array, visus1.dtype, data_size[0], data_size[1], data_size[2], data_size[0], data_size[1], data_size[2]);

        viewer.style.display = 'block'

        let pal_min= parseFloat(document.getElementById('palette_min').value)
        let pal_max= parseFloat(document.getElementById('palette_max').value)

        //console.log("update color map "+pal_min+" "+pal_max)
        renderer.updateColorMap(pal_min, pal_max);

        var range=renderer.getDataExtent();
        //console.log("R:"+range[0]+", "+range[1])
        document.getElementById('comp_range').innerHTML="["+parseFloat(range[0]).toFixed(3)+", "+parseFloat(range[1]).toFixed(3)+"]"
        
        if(reset_view==1)
          renderer.resetView()

        if(visus1.usePresets)
          loadPresets();

        if(visus1.render_type!=ISOCONTOUR_RENDER_MODE)
          renderer.present();
        else{
          renderer.present().isovalue(0.5);
        }

        hideStatus();
      }

      start()

    }).catch(e => {
      console.log(e);
    });

}


//refreshAll
async function refreshAll(reset_view=1)
{

  if(dataset.dim==2)
    query_str = visus1.refresh();
  else
    query_str = visus1.refresh(level);

  fetch_and_draw(query_str, reset_view)
  
  // document.getElementById('slice').max=visus1.dataset.pow2dims[visus1.getAxis()]-1;  
  document.getElementById('axis').value=visus1.getAxis();
  //document.getElementById('slice').value=visus1.getSlice();
  // document.getElementById('edit_slice').value=visus1.getSlice();
  document.getElementById('field').value=visus1.getField();
  document.getElementById('time').value=visus1.getTime();
  document.getElementById('edit_time').value=visus1.getTime();

  // document.getElementById('palette').value=visus1.getPalette();
  // document.getElementById('palette_min').value=visus1.getPaletteMin();
  // document.getElementById('palette_max').value=visus1.getPaletteMax();
  // document.getElementById('palette_interp').value=visus1.getPaletteInterp();

}

///////////////////////////////////////////////////////
function getServer() {
  return document.getElementById('server').value;
}

///////////////////////////////////////////////////////
async function setServer(value,pre_dataset=null)
{
  document.getElementById('server').value=value;
  
  visusAsyncGetListOfDatasets(value+'&action=list&format=json')
  .then(function (datasets) 
  { 
    dataset_widget=document.getElementById('dataset');
    dataset_widget.options.length = 0;
    for(var i = 0; i < datasets.length; i++) 
    {
      var value = datasets[i];
      var item = document.createElement("option");
      item.textContent = value;
      item.value=item.value = value;
      dataset_widget.appendChild(item);
    }     
    
    if(pre_dataset==null)
      setDataset(datasets[0]);
    else
      setDataset(pre_dataset, true)

  });
}


///////////////////////////////////////////////////////
function getDataset() {
  return document.getElementById('dataset').value;
}

///////////////////////////////////////////////////////
function setDataset(value, presets=false) 
{
  document.getElementById('dataset').value=value;

  // reset palette
  // document.getElementById('palette_min').value="";
  // document.getElementById('palette_max').value="";

  //document.getElementById('render_type').checked=true
  //document.getElementById('axis').disabled=true
  //document.getElementById('axis').value='2'
  //document.getElementById('slice').disabled=true
  //document.getElementById('edit_slice').disabled=true

  dataset_url=getServer()+'action=read_dataset&dataset='+value

  query_str = visusAsyncLoadDataset(dataset_url).then(function (dataset) {

    //update fieldnames
    {
      field_widget=document.getElementById('field');
      field_widget.options.length = 0;
      for(var i = 0; i < dataset.fields.length; i++) 
      {
        var fieldname = dataset.fields[i].name;
        var item = document.createElement("option");
        item.textContent = fieldname;
        item.value=item.value = fieldname;
        field_widget.appendChild(item);
      }  
    }   
    
    document.getElementById('resolution').max=dataset.maxh

    //update time range
    {
      time_widget=document.getElementById('time');
      time_widget.min=dataset.timesteps[0];
      time_widget.max=dataset.timesteps[1];
      time_widget.step=1;
    }   

    if(dataset.dim==2){
      document.getElementById('2dCanvas').hidden=false
      document.getElementById('3dCanvas').hidden=true
      document.getElementById('view_btn').hidden=true;

      document.getElementById('range_panel').hidden=true;

      console.log("USE 2D canvas")
      visus1=VisusOSD({
        id : '2dCanvas',
        dataset : dataset,
        compression : 'png',
        showNavigator : false,
        debugMode : false
      }); 
    }else {
      console.log("USE 3D canvas")
      document.getElementById('2dCanvas').hidden=true
      document.getElementById('3dCanvas').hidden=false
      document.getElementById('view_btn').hidden=false;

      visus1=VisusVR({
        id : '3dCanvas',
        dataset : dataset,
        compression : 'raw',
        showNavigator : false,
        debugMode : false
      }); 

      visus1.setRenderType(document.getElementById('render_type').value)
    }
    
    if(presets){
      loadRenderingTypePreset();
      visus1.usePresets=true;
     }

    refresh();

    refreshAll(!presets);

  });  

}

var intervalID;

function onRefreshChange(){
  if(document.getElementById('auto_refresh').checked)
    intervalID = setInterval(function(){refreshAll(0);}, 5000);
  else clearInterval(intervalID);
}

function onAxisChange(value){
  visus1.setAxis(value); refreshAll(0);
}

function onSliceChange(value){
  visus1.setSlice(value); 

  // if(!renderer){
  //   refreshAll(0)
  //   return
  // }

  //console.log("get value "+value+" set value "+range[0]+(value/100)*ext)
  if(visus1.render_type==ISOCONTOUR_RENDER_MODE){
    var range=renderer.getDataExtent();
    ext = range[1]-range[0]

    document.getElementById('edit_slice').value=range[0]+(value/100)*ext;
  }
  else
    document.getElementById('edit_slice').value=value;

  document.getElementById('slice').value=value;

  if(visus1.render_type==ISOCONTOUR_RENDER_MODE && renderer){
    renderer.present().isovalue(value/100);
  }
  else
    refreshAll(0);
}

function onFieldChange(value){
  visus1.setField(value); refreshAll();
}

function onTimeChange(value){
  visus1.setTime(value); 
  document.getElementById('edit_time').value=value;
  document.getElementById('time').value=value;
  refreshAll(0);
}

function onResolutionChange(value){
  document.getElementById('resolution').value=value;
  document.getElementById('edit_resolution').value=value;
  level=value
  size=visus1.getDataSize(value);
  document.getElementById('size_est').innerHTML="~"+parseFloat(size).toFixed(1)+"MB";

}

function onVRChange(ren_type){

  if(ren_type==SLICE_RENDER_MODE){
    document.getElementById('slice').disabled=false
    document.getElementById('render_slider_lbl').innerHTML="Slice"
    document.getElementById('axis').disabled=false
    document.getElementById('edit_slice').disabled=false
    console.log("using slice")
  }
  else if(ren_type==VOLUME_RENDER_MODE){
    document.getElementById('axis').disabled=true
    document.getElementById('slice').disabled=true
    document.getElementById('edit_slice').disabled=true
  }
  else if(ren_type==ISOCONTOUR_RENDER_MODE){
    document.getElementById('slice').disabled=false
    document.getElementById('render_slider_lbl').innerHTML="IsoValue"
    document.getElementById('axis').disabled=true
    document.getElementById('axis').hidden=true
    document.getElementById('axis_label').hidden=true
    document.getElementById('edit_slice').disabled=false
    document.getElementById('edit_slice').hidden=false
  }

  visus1.setRenderType(ren_type);

  if(ren_type == SLICE_RENDER_MODE)
    onSliceChange(50);
  else
    refreshAll(0)
}

function onPaletteChange(){
  visus1.setPalette(document.getElementById('palette').value); 
  visus1.setPaletteMin(parseFloat(document.getElementById('palette_min').value)); 
  visus1.setPaletteMax(parseFloat(document.getElementById('palette_max').value)); 
  // visus1.setPaletteInterp(document.getElementById('palette_interp').value); 

  let pal_min= parseFloat(document.getElementById('palette_min').value)
  let pal_max= parseFloat(document.getElementById('palette_max').value)

  var colormap = get_palette_data(document.getElementById('palette').value)

  if(renderer)
    renderer.updateColorMap(pal_min, pal_max);

  if(document.getElementById('2dCanvas').hidden==false)
    refreshAll(0);
}

function onViewResolution(){
  sel_level = parseInt(document.getElementById('resolution').value)
  size=parseFloat(visus1.getDataSize(sel_level))

  if(size > 10000)
    alert("This request might take a while, go have some fun!")

  data_url = visus1.refresh(sel_level)

  fetch_and_draw(data_url,0)
}

function download(){
  sel_level = parseInt(document.getElementById('resolution').value)

  data_url = ""
  if(dataset.dim==2)
    data_url = visus1.download_query(sel_level)
  else
    data_url = visus1.refresh(sel_level)

  out_size = []
  out_dtype = ""

  out_ext_file = ".raw"

  if(dataset.dim==3 && visus1.dtype.includes("int8") && !document.getElementById('render_type').value==VOLUME_RENDER_MODE){
    data_url=data_url.split("compression=raw").join("compression=png");
    out_ext_file = ".png"
  }
  else if(dataset.dim==2){
    //TODO use dtype also for 2D
    data_url=data_url.split("compression=raw").join("compression=png");
    out_ext_file = ".png"
  }

  notifyStatus("Downloading data...");

  fetch(data_url, { method: 'GET'
        }).then(response => {
          nsamples=response.headers.get('visus-nsamples')
          var dims=nsamples.split(' ');
          out_size[0]=parseInt(dims[0]);
          out_size[1]=parseInt(dims[1]);
          out_size[2]=parseInt(dims[2]);
         
          if(isNaN(out_size[2]))
            out_size[2]=1

          //console.log(out_size)

          out_dtype=response.headers.get('visus-dtype')

          time_value = document.getElementById('time').value

          //console.log(out_dtype)

          response.blob().then( blob => {

          var url = window.URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = visus1.dataset.name+"_"+out_size[0]+"_"+out_size[1]+"_"+out_size[2]+"_"+out_dtype+"_t"+time_value+"_lvl"+sel_level+out_ext_file;
          a.click();                    
        
          hideStatus();
        });
      });
}

// palette
// palette_min palette_max
// position

//window.onload = function (){

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

let pre_server = getParameterByName('server'); 
let pre_dataset = getParameterByName('dataset'); 

if(pre_server==null)
  setServer(DEFAULT_SERVER)
else
  setServer(pre_server, pre_dataset)

function shareLink(){

  base_url=window.location.href.split('?')[0]

  matrices = renderer.getMatrices()
  q = renderer.getQuaternion()
  view_distance = renderer.getViewDistance()

  vp=matrices.view[0]
  for(i=1;i<16;i++)
    vp+=","+matrices.view[i]

  qs=q.w+","+q.x+","+q.y+","+q.z;

  vp=encodeURIComponent(vp)
  qs=encodeURIComponent(qs)

  pmin=isNaN(visus1.palette_min) ? "NaN" : visus1.palette_min
  pmax=isNaN(visus1.palette_max) ? "NaN" : visus1.palette_max

  vr_status=document.getElementById('render_type').value
  link = base_url+"?server="+encodeURIComponent(getServer())+"&dataset="+encodeURIComponent(document.getElementById('dataset').value)
    +"&field="+encodeURIComponent(visus1.field)+"&slice="+visus1.slice+"&axis="+document.getElementById('axis').value+"&time="+visus1.time+"&vr="+vr_status+"&res="+level
    +"&palette="+visus1.palette+"&palette_min="+pmin+"&palette_max="+pmax
    +"&vp="+vp+"&vd="+view_distance+"&q="+qs;

  document.getElementById('link_text').value = link;

  document.getElementById('row_link').hidden=false

}

function onCopy(){
  
  document.getElementById('link_text').select();
  var successful = document.execCommand('copy');

  if(successful)
    document.getElementById('link_text').value = 'The URL has been copied to your clipboard'

  setTimeout(function(){ document.getElementById('row_link').hidden=true }, 3000);

}


function loadRenderingTypePreset(){
  let pre_vr = getParameterByName('vr')

  if(pre_vr!=null){
    document.getElementById('render_type').value=pre_vr

    if(dataset.dim>2)
      visus1.setRenderType(pre_vr);
  }
}

function loadPresets(){
  
  let pre_slice = getParameterByName('slice')
  let pre_time = getParameterByName('time')
  let pre_palette = getParameterByName('palette')
  let pre_palette_min = getParameterByName('palette_min')
  let pre_palette_max = getParameterByName('palette_max')
  let pre_vpoint = getParameterByName('vp')
  let pre_q = getParameterByName('q')
  let pre_view_distance = getParameterByName('vd')
  let pre_resolution = getParameterByName('res')
  let pre_axis = getParameterByName('axis')
  let pre_field = getParameterByName('field')

  if(pre_slice!=null){
    document.getElementById('edit_slice').value=pre_slice;
    document.getElementById('slice').value=pre_slice;
    onSliceChange(parseInt(pre_slice));
  }

  if(pre_axis!=null){
    document.getElementById('axis').value=parseInt(pre_axis);
    visus1.setAxis(parseInt(pre_axis));
  }

  if(pre_field!=null){
    document.getElementById('field').value=pre_field;
    visus1.setField(pre_field);
  }

  if(pre_time!=null){
    document.getElementById('time').value=parseInt(pre_time)
    document.getElementById('edit_time').value=parseInt(pre_time)
    visus1.setTime(parseInt(pre_time))
  }

  if(pre_resolution!=null){
    level=parseInt(pre_resolution)
    document.getElementById('resolution').value=level
  }else
    level=24
  
  if(pre_palette!=null){
    document.getElementById('palette').value=pre_palette
    onPaletteChange()
  }

  if(pre_palette_min!=null && pre_palette_min!="NaN"){
    document.getElementById('palette_min').value=pre_palette_min
    onPaletteChange()
  }

  if(pre_palette_max!=null && pre_palette_max!="NaN"){
    document.getElementById('palette_max').value=pre_palette_max
    onPaletteChange()
  }

  if(pre_vpoint!=null){
    mat = renderer.getMatrices()
    mat.view = pre_vpoint.split(',').map(parseFloat);
    renderer.setMatrices(mat)
  }

  if(pre_q != null){
    q = renderer.getQuaternion()
    qv = pre_q.split(',').map(parseFloat);

    q.w=qv[0]
    q.x=qv[1]
    q.y=qv[2]
    q.z=qv[3]

    renderer.setQuaternion(q)
  }

  if(pre_view_distance != null){
    renderer.setViewDistance(parseFloat(pre_view_distance))
  }

  visus1.usePresets=false;

}
