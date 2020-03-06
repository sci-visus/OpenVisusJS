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

//getTileSources
function VisusGetTileLayer(server, dataset, w, h, max_levels, tile_size) {
    return L.TileLayer.extend({
          options: {
              width: w,
              height: h,
              imageFormat: 'png',
              tileSize: tile_size,
              minZoom: 1,
              maxZoom: max_levels
            },
          getTileUrl: function(coords) {
              level=coords.z // - 8
              x=coords.x
              y=coords.y
              num_levels = rc.zoomLevel();//parseInt(Math.pow(2,18)/tile_size, 10);//parseInt(Math.log2(h/tile_size))//parseInt(max_levels / 2, 10);
              //console.log("num levels", num_levels)

              //console.log(mymap.project(coords))
              var tilePos = this._getTilePos(coords);
              var key = this._tileCoordsToKey(coords);
              //console.log("tilepos", tilePos, "key", key)
              //console.log("coords",coords)
              /*
              var latLng = mymap.layerPointToLatLng(coords);
              console.log("latlng coords", latLng)

              orig_xyz=mymap.project([ 38.297937422435105 ,  -109.44451991552009 ],coords.z)
              curr_xyz=mymap.project(latLng,coords.z)
              //mymap.latLngToLayerPoint([ 38.297937422435105 ,  -109.44451991552009 ])
              offset=[(curr_xyz.x-orig_xyz.x)/tile_size,(curr_xyz.y-orig_xyz.y)/tile_size]
              console.log("offset", offset)
              x=parseInt(x-offset[0])
              y=parseInt(y-offset[1])
              */
              //console.log("proj coords", rc.unproject([x,y]))
              //console.log("requesting tile ", coords.z, coords.x, coords.y, tilePos, key);
              //return "";
              var scale = Math.pow(2, num_levels - level);
              var level_tile_size = tile_size * scale;
              //console.log("tile size level:", level_tile_size)
              var x1 = level_tile_size * x; var x2 = Math.min(level_tile_size * (x + 1) - 1, w)
              var y2 = h - level_tile_size * y; var y1 = h - Math.min(level_tile_size * (y + 1) - 1, h);

              var url = server + "/mod_visus?";

              url += "&action=boxquery";
              url += "&compression=jpg";
              url += "&box=" + x1 + "%20" + x2 + "%20" + y1 + "%20" + y2;
              url += "&dataset=" + encodeURIComponent(dataset);
              url += "&maxh=" + max_levels;
              url += "&toh=" + Math.max(20, Math.min(max_levels,parseInt((level+1)* Math.ceil(max_levels/num_levels))));

              return url;
          },
    })
}