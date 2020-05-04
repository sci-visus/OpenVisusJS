
var visus1;
let renderer;
let curr_render_type;

//TODO rename 2dCanvas to osdCanvas
let canvas2d_name="leafletCanvas";//"2dCanvas";

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
        case 'uint32':
                return new Uint32Array(buffer)
        case 'int8':
                return new Int8Array(buffer)
        case 'int16':
                return new Int16Array(buffer)
        case 'int32':
                return new Int32Array(buffer)
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
  if(document.getElementById(canvas2d_name).hidden==true){
    document.getElementById('status_bar').hidden=false
    document.getElementById('status').innerHTML="  "+new_text
  }
  else hideStatus();
}

function hideStatus(){ if(document.getElementById('status_bar')) document.getElementById('status_bar').hidden=true }

function fetch_and_draw(query_str, reset_view=1)
{
  data_size=[256, 256, 256]
  dtype=visus1.dtype;

  notifyStatus("Streaming...");

  if(query_str) fetch(query_str, {method:'get'})
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
            renderer = await dvr(document.getElementById('3dCanvas'), 'surface', [0/255, 0/255, 0/255, 1.0])//specify the background color
          }
          else
            renderer = await dvr(document.getElementById('3dCanvas'), 'volume', [0/255, 0/255, 0/255, 1.0])//specify the background color
        }
        
        curr_render_type = visus1.render_type;

        var palette_str = document.getElementById('palette').value;

        var colormap = get_palette_data(palette_str)
        
        var array = toArray(data, visus1.dtype)
        var phy_size = [data_size[0]*visus1.dataset.logic_to_physic[0], data_size[1]*visus1.dataset.logic_to_physic[5],data_size[2]*visus1.dataset.logic_to_physic[10]];

        for(d=0;d<3;d++){
          if(data_size[d]==1)
            phy_size[d] = data_size[d]
        }

        renderer.uploadData(array, visus1.dtype, data_size[0], data_size[1], data_size[2], phy_size[0], phy_size[1], phy_size[2]);

        viewer.style.display = 'block'

        let pal_min= parseFloat(document.getElementById('palette_min').value)
        let pal_max= parseFloat(document.getElementById('palette_max').value)

        //console.log("update color map "+pal_min+" "+pal_max)
        renderer.updateColorMap(document.getElementById('palette').value, pal_min, pal_max);

        var range=renderer.getDataExtent();
        //console.log("R:"+range[0]+", "+range[1])
        document.getElementById('comp_range').innerHTML="["+parseFloat(range[0]).toFixed(3)+", "+parseFloat(range[1]).toFixed(3)+"]"
        
        if(reset_view==1)
          renderer.resetView()

        if(visus1.usePresets)
          loadPresets();

        // if(visus1.render_type!=ISOCONTOUR_RENDER_MODE)
          renderer.present();
        // else if(visus1.usePresets==false)
        //   onSliceChange(50);
        
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

  //want to set bounds here, but they're not part of document, only visus1
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
      var n = value.indexOf("/");
      //console.log("found / at position "+n+" for string "+ value)
      // trimming prefix of the midx to first 3 characters(too long for the menu)
      if(n > 0)
        item.textContent = value.substring(0,Math.min(3,value.length))+value.substring(n,value.length)
      else
        item.textContent = value;
      item.value = value;
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
function updateInfo(dataset) {

  if(!$('#info').length)
    return;

  num_timesteps=1+dataset.timesteps[1]-dataset.timesteps[0]; // todo: / stepsize (not yet passed by visusAsyncLoadDataset)

  volume=dataset.dims[0]*dataset.dims[1];
  if (dataset.dim > 2) volume *= dataset.dims[2];
  
  field_size=4.0; //todo: get size per field (not yet passed by visusAsyncLoadDataset)
  dataset_size_gb=dataset.fields.length*num_timesteps*volume*field_size/(1024*1024*1024);
  size_str=dataset_size_gb.toFixed(2)+" GB";
  if ((dataset_size_gb / 1024) > 1.0)
    size_str=(dataset_size_gb/1024).toFixed(2)+" TB";

  dims_str=dataset.dims[0]+" x "+dataset.dims[1];
  if (dataset.dim > 2) dims_str += " x "+dataset.dims[2];

  var dataset_url=getServer()+"dataset="+dataset.name;

  document.getElementById('info').innerHTML="\
    <span style=\"font-size:20px; padding-left:5px\" onclick=\"openNav()\">"+dataset.name+"</span> \
    <ul> \
      <li>Size: "+size_str+"</li> \
      <li>Dims: "+dims_str+"</li> \
      <li>Timesteps: "+num_timesteps+"</li> \
      <li>Fields: "+dataset.fields.length+"</li> \
    </ul> \
    <p style=\"padding-left:5px\">ViSUS URL: <a href=\""+dataset_url+"\">"+dataset_url+"</a></p>";
}

function addSelectionOSD(){
  selection = visus1.osd.selection({
      onSelection:  function(rect) { 
        //console.log(selection.rect); 
        rectToSelection(selection.rect);

        $('#downloadModal').modal();

      },
      keyboardShortcut:        's',
      prefixUrl:               null, 
      allowRotation:           false,
      showConfirmDenyButtons:  false,
      navImages:               { // overwrites OpenSeadragon's options
        selection: {
            REST:   '../images/selection_rest.png',
            GROUP:  '../images/selection_grouphover.png',
            HOVER:  '../images/selection_hover.png',
            DOWN:   '../images/selection_pressed.png'
        },
        selectionConfirm: {
            REST:   '../images/selection_confirm_rest.png',
            GROUP:  '../images/selection_confirm_grouphover.png',
            HOVER:  '../images/selection_confirm_hover.png',
            DOWN:   '../images/selection_confirm_pressed.png'
        },
        selectionCancel: {
            REST:   '../images/selection_cancel_rest.png',
            GROUP:  '../images/selection_cancel_grouphover.png',
            HOVER:  '../images/selection_cancel_hover.png',
            DOWN:   '../images/selection_cancel_pressed.png',
        },
      }
    });

    selection.cancel = function(){ 
      selection.toggleState(); console.log("CANCEL"); 
      return this.outerTracker.setTracking(!1),this.outerTracker.setTracking(!0),this.viewer.raiseEvent("selection_cancel",!1),this.undraw()
    };
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

  // if MIDX
  if(value.includes("*")){
    console.log("MIDX not supported\n")
    value=value.replace("*","")
    dataset_url=getServer()+'action=read_dataset&dataset='+value
    query_str = visusAsyncLoadMIDXDataset(dataset_url).then(function (midx) {
      console.log("found datasets: ", midx.datasets)
      setDataset(value+"/"+midx.datasets[0])
    });

    return;
  }

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
      time_slider=document.getElementById('time');
      time_slider.min=dataset.timesteps[0];
      time_slider.max=dataset.timesteps[1];
      time_slider.step=1;
      time_edit=document.getElementById('edit_time');
      time_edit.min=dataset.timesteps[0];
      time_edit.max=dataset.timesteps[1];
      time_edit.step=1;
    }   

    if(dataset.dim==2){
      document.getElementById(canvas2d_name).hidden=false
      document.getElementById('3dCanvas').hidden=true
      document.getElementById('view_btn').hidden=true;
      document.getElementById('range_panel').hidden=true;

      if(document.getElementById('rendercontainer')){
        $('#rendercontainer').hide();
        $('#slicenav').hide();
      }

      console.log("USE 2D canvas")

      if(document.getElementById("2dCanvas")){
        visus1=VisusOSD({
          id : '2dCanvas',
          dataset : dataset,
          compression : 'png',
          showNavigator : false,
          debugMode : false
        }); 

        addSelectionOSD();
      }
      
      if($("leafletCanvas")){
        visus1=VisusLeaflet({
          id : 'leafletCanvas',
          url: getServer(),
          dataset : dataset,
          compression : 'png',
          showNavigator : false,
          debugMode : false
        }); 
      }

      document.getElementById('resolution').step=2;

      if(dataset.pow2dims[0] < dataset.pow2dims[1])
        document.getElementById('resolution').min=3
      else
        document.getElementById('resolution').min=2

      onFieldChange(document.getElementById('field').value)

    }else {
      console.log("USE 3D canvas")
      document.getElementById(canvas2d_name).hidden=true;
      document.getElementById('3dCanvas').hidden=false;
      document.getElementById('view_btn').hidden=false;
      document.getElementById('range_panel').hidden=false;
      
      if(document.getElementById('rendercontainer')){
        $('#rendercontainer').show();
        $('#slicenav').show();
      }

      visus1=VisusVR({
        id : '3dCanvas',
        dataset : dataset,
        compression : 'raw',
        showNavigator : false,
        debugMode : false
      }); 

      var bits = dataset.bitmask;

      var bvals=[0,0,0];
      var rcount=0;
      var minres=9000;
      for(var  b= 0; b < bits.length; b++) {
        if(isNaN(bits[b]))
          continue;

        bvals[parseInt(bits[b])] = bvals[parseInt(bits[b])]+1;

        //console.log(rcount, bvals);

        rcount++;

        // min resolution that maintains the aspect ratio
        if(rcount<minres && bvals[0]>=1 && bvals[1]>=1 && bvals[2]>=1)
          minres=rcount;

        // default resolution maintatining aspect ratio
        if(bvals[0]>=7 && bvals[1]>=7 && bvals[2]>=7)
          break;
      }
      //console.log(rcount, bvals);
      
      document.getElementById('resolution').min=minres;
      
      if(!presets) onResolutionChange(rcount);

      visus1.setRenderType(document.getElementById('render_type').value)
      
      document.getElementById('resolution').step=3;
    }

    // use same step and min for resolution view slider
    if (document.getElementById('resolutionview')) {
      document.getElementById('resolutionview').min=document.getElementById('resolution').min;
      document.getElementById('resolutionview').step=document.getElementById('resolution').step;
    }

    // update info pane
    updateInfo(dataset);

    onPaletteChange()

    if(presets){
      loadRenderingTypePreset();
      visus1.usePresets=true;
      loadPresets();
    }

    refreshAll(!presets);

  });  

}

var intervalID;

function onRefreshChange(){
  if(document.getElementById('auto_refresh').checked)
    intervalID = setInterval(function(){refreshAll(0);}, 5000);
  else clearInterval(intervalID);
}

function onSpinChange(){
  if(document.getElementById('auto_spin').checked && renderer)
    intervalID = setInterval(function(){renderer.rotate()}, 200);
  else clearInterval(intervalID);
}

function onAxisChange(value){
  visus1.setAxis(value); refreshAll(0);
}

function setDefaultResolution(){
  onResolutionChange(document.getElementById('resolution').min*1.0+14);
}

function onSliceChange(value){
  visus1.setSlice(value)

  if(visus1.render_type==ISOCONTOUR_RENDER_MODE && renderer){
    var range=renderer.getDataExtent();
    ext = range[1]-range[0]

    real_value=range[0]+(value/100)*ext;
    document.getElementById('edit_slice').value=real_value;
    //console.log("get value "+value+" set value "+real_value)
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
  visus1.setField(value); 

  let palette_min = document.getElementById('palette_min').value
  let palette_max = document.getElementById('palette_max').value
  
  onPaletteChange();

  if(palette_min=="" && palette_max==""){
    visus1.guessRange();
  }

  refreshAll();
}

function onTimeChange(value){
  visus1.setTime(value); 
  document.getElementById('edit_time').value=value;
  document.getElementById('time').value=value;

  refreshAll(0);
}

function onResolutionChange(value, sel_factor=1){
  document.getElementById('resolution').value=value;
  document.getElementById('edit_resolution').value=value;
  level=value
  size=visus1.getDataSize(value)*sel_factor;
  document.getElementById('size_est').innerHTML="~"+parseFloat(size).toFixed(1)+"MB";

  if(document.getElementById('res_lbl'))
    document.getElementById('res_lbl').innerHTML = value

}

function onVRChange(ren_type){

  if(ren_type==SLICE_RENDER_MODE){
    document.getElementById('slice').disabled=false
    document.getElementById('render_slider_lbl').innerHTML="Slice"
    document.getElementById('axis').disabled=false
    document.getElementById('edit_slice').disabled=false
    if(document.getElementById('slicenav'))
      $("#slicenav").show();
  }
  else if(ren_type==VOLUME_RENDER_MODE){
    document.getElementById('axis').disabled=true
    document.getElementById('slice').disabled=true
    document.getElementById('edit_slice').disabled=true
    if(document.getElementById('slicenav'))
      $("#slicenav").hide();
  }
  else if(ren_type==ISOCONTOUR_RENDER_MODE){
    document.getElementById('slice').disabled=false
    document.getElementById('render_slider_lbl').innerHTML="IsoValue"
    document.getElementById('axis').disabled=true
    document.getElementById('axis').hidden=true
    document.getElementById('edit_slice').disabled=false
    document.getElementById('edit_slice').hidden=false
    if(document.getElementById('slicenav'))
      $("#slicenav").show();
  }

  visus1.setRenderType(ren_type);

  if(ren_type == SLICE_RENDER_MODE)
    onSliceChange(50);
  else
    refreshAll(0)

}

function onPaletteChange(){

  var colormap = get_palette_data(document.getElementById('palette').value)
  let pal_min= parseFloat(document.getElementById('palette_min').value)
  let pal_max= parseFloat(document.getElementById('palette_max').value)

  if(isNaN(pal_min)) pal_min = 0;
  if(isNaN(pal_max)) pal_max = 0;

  visus1.setPalette(document.getElementById('palette').value); 
  visus1.setPaletteMin(pal_min); 
  visus1.setPaletteMax(pal_max); 
  //console.log("setting palette min max", pal_min, pal_max)
  // visus1.setPaletteInterp(document.getElementById('palette_interp').value); 

  if(renderer)
    renderer.updateColorMap(colormap,pal_min, pal_max);

  //if(document.getElementById('2dCanvas').hidden==false)
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

function download(box=null){
  sel_level = parseInt(document.getElementById('resolution').value)
  data_url = ""
  if(dataset.dim==2)
    data_url = visus1.download_query(sel_level, box, visus1.dtype.includes("int8"))
  else
    data_url = visus1.refresh(sel_level)

  out_size = []
  out_dtype = ""

  out_ext_file = ".raw"

  if(dataset.dim==3 && visus1.dtype.includes("int8") && document.getElementById('render_type').value==SLICE_RENDER_MODE){
    data_url=data_url.split("compression=raw").join("compression=png");
    out_ext_file = ".png"
  }
  else if(dataset.dim==2 && visus1.dtype.includes("int8")){
    data_url=data_url.split("compression=raw").join("compression=png");
    out_ext_file = ".png"
  }
  else{
    data_url=data_url.split("compression=png").join("compression=raw");

  }

  notifyStatus("Downloading data...");
  console.log(data_url)

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
          document.body.appendChild(a); //required in FF, optional for Chrome
          a.download = visus1.dataset.name+"_"+out_size[0]+"_"+out_size[1]+"_"+out_size[2]+"_"+out_dtype+"_t"+time_value+"_lvl"+sel_level+out_ext_file;
          a.href=url;
          a.target="_self";
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

  link = base_url+"?server="+encodeURIComponent(getServer())+"&dataset="+encodeURIComponent(document.getElementById('dataset').value)
    +"&field="+encodeURIComponent(visus1.field)

  vp=qs=""

  if(dataset.dim>2){
    matrices = renderer.getMatrices()
    q = renderer.getQuaternion()
    view_distance = renderer.getViewDistance()

    vp=matrices.view[0]
    for(i=1;i<16;i++)
      vp+=","+matrices.view[i]

    qs=q.w+","+q.x+","+q.y+","+q.z;

    vp=encodeURIComponent(vp)
    qs=encodeURIComponent(qs)

    vr_status=document.getElementById('render_type').value

    link=link+"&slice="+visus1.slice+"&axis="+document.getElementById('axis').value+"&vr="+vr_status+"&res="+level
    +"&vp="+vp+"&vd="+view_distance+"&q="+qs;
  }
  else{
    bounds=visus1.getBounds();
    link=link+"&bH="+bounds.height+"&bW="+bounds.width+"&bX="+bounds.x+"&bY="+bounds.y+"&bD="+bounds.degrees;
  }

  pmin=isNaN(visus1.palette_min) ? "NaN" : visus1.palette_min
  pmax=isNaN(visus1.palette_max) ? "NaN" : visus1.palette_max

  link=link+"&time="+visus1.time+"&palette="+visus1.palette+"&palette_min="+pmin+"&palette_max="+pmax

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
    $('#render_type option[value="'+pre_vr+'"]').prop("selected", "selected").change();
    //onVRChange(pre_vr)
  }
}

function isRendererDefined(){
  return typeof renderer !== 'undefined';
}

function loadPresets(){
  
  // 3D params
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

  // 2D params
  let pre_bh = getParameterByName('bH')
  let pre_bw = getParameterByName('bW')
  let pre_bx = getParameterByName('bX')
  let pre_by = getParameterByName('bY')
  let pre_bd = getParameterByName('bD')

  if(pre_bh!=null && pre_bw!=null && pre_bx!=null && pre_by!=null && pre_bd!=null){
    bounds = visus1.getBounds()
    bounds.height=parseFloat(pre_bh)
    bounds.width=parseFloat(pre_bw)
    bounds.x=parseFloat(pre_bx)
    bounds.y=parseFloat(pre_by)
    bounds.degrees=parseFloat(pre_bd)
    visus1.setBounds(bounds)
    //console.log(visus1.getBounds())
  }

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
    onResolutionChange(level)
  }
  
  if(pre_palette!=null){
    document.getElementById('palette').value=pre_palette
    onPaletteChange()
  }

  if(pre_palette_min!=null){
    document.getElementById('palette_min').value=pre_palette_min
    onPaletteChange()
  }

  if(pre_palette_max!=null){
    document.getElementById('palette_max').value=pre_palette_max
    onPaletteChange()
  }

  if(document.getElementById('palette_max').value == document.getElementById('palette_min').value){
    document.getElementById('palette_max').value=NaN;
    document.getElementById('palette_min').value=NaN;
  }

  if(pre_vpoint!=null && isRendererDefined()){
    mat = renderer.getMatrices()
    mat.view = pre_vpoint.split(',').map(parseFloat);
    renderer.setMatrices(mat)
  }

  if(pre_q != null && isRendererDefined()){
    q = renderer.getQuaternion()
    qv = pre_q.split(',').map(parseFloat);

    q.w=qv[0]
    q.x=qv[1]
    q.y=qv[2]
    q.z=qv[3]

    renderer.setQuaternion(q)
  }

  if(pre_view_distance != null && typeof renderer !== 'undefined'){
    renderer.setViewDistance(parseFloat(pre_view_distance))
  }

  if(isRendererDefined())
    visus1.usePresets=false;

  setTimeout(function(){ onViewResolution(); }, 3000);

}

if(document.getElementById('3dCanvas')){
  document.getElementById('3dCanvas').addEventListener('webglcontextlost', function(event) { event.preventDefault()}, false)
  document.getElementById('3dCanvas').addEventListener('webglcontextrestored', function(event) {
    console.log("Restored WebGl context")

    parent=document.getElementById('3dCanvas').parentNode
    savedhtml=parent.innerHTML
    parent.removeChild(document.getElementById('3dCanvas'))
    parent.innerHTML=savedhtml


    //console.log("restored correctly", document.getElementById('3dCanvas'))
    //delete renderer
    renderer=null
    refreshAll();
  }, false)
}

