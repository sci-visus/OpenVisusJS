<html>

<div id="result"> </div>
<style type="text/css">
  .datagrid table { border-collapse: collapse; text-align: left; width: 100%; } .datagrid {font: normal 12px/150% Arial, Helvetica, sans-serif; background: #fff; overflow: hidden; -webkit-border-radius: 3px; -moz-border-radius: 3px; border-radius: 3px; }.datagrid table td, .datagrid table th { padding: 3px 10px; }.datagrid table thead th {background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #006699), color-stop(1, #00557F) );background:-moz-linear-gradient( center top, #006699 5%, #00557F 100% );filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#006699', endColorstr='#00557F');background-color:#006699; color:#FFFFFF; font-size: 15px; font-weight: bold; border-left: 1px solid #0070A8; } .datagrid table thead th:first-child { border: none; }.datagrid table tbody td { color: #00557F; border-left: 1px solid #E1EEF4;font-size: 12px;font-weight: normal; }.datagrid table tbody .alt td { background: #E1EEF4; color: #00557F; }.datagrid table tbody td:first-child { border-left: none; }.datagrid table tbody tr:last-child td { border-bottom: none; }.datagrid table tfoot td div { border-top: 1px solid #006699;background: #E1EEF4;} .datagrid table tfoot td { padding: 0; font-size: 12px } .datagrid table tfoot td div{ padding: 2px; }.datagrid table tfoot td ul { margin: 0; padding:0; list-style: none; text-align: right; }.datagrid table tfoot  li { display: inline; }.datagrid table tfoot li a { text-decoration: none; display: inline-block;  padding: 2px 8px; margin: 1px;color: #FFFFFF;border: 1px solid #006699;-webkit-border-radius: 3px; -moz-border-radius: 3px; border-radius: 3px; background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #006699), color-stop(1, #00557F) );background:-moz-linear-gradient( center top, #006699 5%, #00557F 100% );filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#006699', endColorstr='#00557F');background-color:#006699; }.datagrid table tfoot ul.active, .datagrid table tfoot ul a:hover { text-decoration: none;border-color: #00557F; color: #FFFFFF; background: none; background-color:#006699;}div.dhtmlx_window_active, div.dhx_modal_cover_dv { position: fixed !important; }
</style>

<script src="config.js"></script>

<script>  

var server_url = DEFAULT_SERVER.substring(0,DEFAULT_SERVER.indexOf("mod_visus?"))
var read_dataset_url = server_url+"/mod_visus?action=read_dataset&dataset="
var convert_dataset_url = server_url+"/cgi-bin/cdat_to_idx_create.cgi?dataset="
var web_dataset_url = server_url+"/viewer?server=http%3A%2F%2Flocalhost%3A80%2Fmod_visus%3F&dataset="

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function checkDataset(name)
{
  var url=read_dataset_url+name+"_idx";
  
  var ret = visusAsyncLoadDataset(url, name)

}

function triggerConvert(name){
  convert_url = convert_dataset_url+name+".nc"
  fetch(convert_url,{method:'get'}).then(function(response){
    // TODO handle errors

    return response.text();
  })

}

//example http://atlantis.sci.utah.edu/mod_visus?action=readdataset&dataset=2kbit1
function visusAsyncLoadDataset(url, name) 
{
  return fetch(url,{method:'get'})
  .then(function (response) {
    
    if (response.headers.get("content-type").indexOf("application/octet-stream")==-1) {
      
      convert_url = convert_dataset_url+name+".nc"
      fetch(convert_url,{method:'get'}).then(function(response){
        // TODO handle errors
        sleep(2000)
        return visusAsyncLoadDataset(url, name); 
      })
      
      throw new TypeError('IDX dataset not found, converting...'); //Response from "' + url + '" is not application/octet-stream"');
    }
      
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
    //console.log(ret.name)

    if(ret.name == name+"_idx"){
      window.location.href = convert_dataset_url+name
    }
    else
      console.log("IDX Dataset DOES NOT exist")

    return ret;
    //ret.base_url = parse_url.protocol+'//'+parse_url.hostname+':'+parse_url.port+'/mod_visus?';    
    }
  )
}



</script>

<?php
echo "<h1>Available NetCDF files</h1>";
$mydir = '/data/xml';
$cache_dir = '/data/idx';

if ($handle = opendir($mydir)) {

    echo "<table>";
    while (false !== ($entry = readdir($handle))) {
        if ($entry != "." && $entry != ".." && strpos($entry, ".nc") > 0) {
          //echo "<script>console.log( 'Debug Objects: " . strpos($entry, ".nc") . "' );</script>";
            $name = substr($entry, 0, strpos($entry, ".nc")); 
            //$name = explode(".", $entry)[0]; // TODO remove only extension

            echo '<tr><td>', $entry; //, '</td><td><a href="http://localhost/cgi-bin/cdat_to_idx_create.cgi?dataset='.$entry.'">view</a></td>';
            echo '<td><button onclick=\'checkDataset("'.$name.'")\'>View</button></td>';
            echo '</tr>';
        }
    }
    echo "</table>";
    closedir($handle);
}

    $io = popen ( '/usr/bin/du -sk ' . $cache_dir, 'r' );
    $size = fgets ( $io, 4096);
    $size = substr ( $size, 0, strpos ( $size, "\t" ) );
    pclose ( $io );
    echo 'Cache Size: ' . $size/1024 . 'KB';
?>
  <body>
  </body>
</html>