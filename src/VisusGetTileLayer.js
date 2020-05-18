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
function VisusGetTileLayer(server, dataset, w, h, maxh, minLevel, max_levels, tile_size) {
    return L.TileLayer.extend({
          options: {
              width: w,
              height: h,
              imageFormat: 'jpg',
              tileSize: tile_size,
              noWrap: true,
              minZoom: (minLevel%2)+2,
              maxZoom: max_levels,
              updateWhenIdle: true,
              continuousWorld: false,
              fitBounds: false,
            },
          getTileUrl: function(coords) {
              level=coords.z;
              x=coords.x
              y=coords.y
              //num_levels = parseInt(maxh / 2, 10);
              num_levels = max_levels;//rc.zoomLevel();//parseInt(Math.pow(2,18)/tile_size, 10);//parseInt(Math.log2(h/tile_size))//parseInt(max_levels / 2, 10);
              //console.log("num levels", num_levels)

              //console.log(mymap.project(coords))
              // var tilePos = this._getTilePos(coords);
              // var key = this._tileCoordsToKey(coords);
              //console.log("tilepos", tilePos, "key", key)
              //console.log("coords",coords)

              //console.log("proj coords", rc.unproject([x,y]))
              //console.log("requesting tile ", coords.z, coords.x, coords.y, tilePos, key);
              //return "";
              var scale = Math.pow(2, num_levels - level);
              var level_tile_size = tile_size * scale;
              //console.log("tile size level:", level_tile_size)
              var x1 = level_tile_size * x; var x2 = Math.min(level_tile_size * (x + 1) - 1, w)
              var y2 = h - level_tile_size * y; var y1 = h - Math.min(level_tile_size * (y + 1) - 1, h);

              //

              // var xDiff = (x2 - x1);
              // var yDiff = (y2 - y1);

              // var sizex = Math.ceil(xDiff / scale);
              // var sizey = Math.ceil(yDiff / scale);
              //if(xDiff < tile_size)

              //console.log("size", sizex, sizey, xDiff, yDiff)

              var url = server + "/mod_visus?";

              var toh = Math.min(maxh, minLevel*2 + level*2);//Math.min(maxh, Math.max(minLevel*2, parseInt((level+1)*Math.ceil(maxh/num_levels))));

              // if(sizex < tile_size || sizey < tile_size){
              //   toh++;
              // }

              //console.log("level", level, "toh", toh, "scale", scale)

              url += "&action=boxquery";
              url += "&compression=jpg";
              url += "&box=" + x1 + "%20" + x2 + "%20" + y1 + "%20" + y2;
              url += "&dataset=" + encodeURIComponent(dataset);
              url += "&maxh=" + maxh;
              url += "&toh=" + toh; 

              return url;
          },
    })
}
