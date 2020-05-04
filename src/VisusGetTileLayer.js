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


// function VisusGetTileLayer(server, dataset, w, h, maxh, max_levels, tile_size) {
//     return L.TileLayer.extend({
//           options: {
//               imageFormat: 'png',
//               tileSize: tile_size,
//               updateWhenIdle: true,
//               continuousWorld: true,
//               fitBounds: true,
//               setMaxBounds: false
//           },
//           initialize: function(url, options) {
//             options = typeof options !== 'undefined' ? options : {};

//             if (options.maxZoom) {
//               this._customMaxZoom = true;
//             }

//             // Check for explicit tileSize set
//             if (options.tileSize) {
//               this._explicitTileSize = true;
//             }

//             // Check for an explicit quality
//             // if (options.quality) {
//             //   this._explicitQuality = true;
//             // }

//             options = L.setOptions(this, options);
//             this._infoPromise = null;
//             this._infoUrl = url;
//             //this._baseUrl = this._templateUrl();
//             this._getInfo();
//           },
//           getTileUrl: function(coords) {
//             var _this = this,
//             x = coords.x,
//             y = (coords.y),
//             zoom = _this._getZoomForUrl(),
//             scale = Math.pow(2, _this.maxNativeZoom - zoom),
//             tileBaseSize = _this.options.tileSize * scale,
//             minx = (x * tileBaseSize),
//             miny = _this.y - Math.min(tileBaseSize * (y + 1) - 1, _this.y);
//             //miny = (y * tileBaseSize),
//             maxx = Math.min(minx + tileBaseSize, _this.x),
//             //maxy = Math.min(miny + tileBaseSize, _this.y);
//             maxy = _this.y - tileBaseSize * y; 

          
//             console.log("maxNativeZoom", _this.maxNativeZoom, "z", coords.z, "tileSize", tileBaseSize)

//             var xDiff = (maxx - minx);
//             var yDiff = (maxy - miny);

//             // Canonical URI Syntax for v2
//             var size = Math.ceil(xDiff / scale) + ',';
//             if (_this.type === 'ImageService3') {
//               // Cannonical URI Syntax for v3
//               size = size + Math.ceil(yDiff / scale);
//             }

//             console.log("size", size)

//             var url = server + "/mod_visus?";

//             var toh = Math.min(maxh, Math.max(_this.maxNativeZoom*2, parseInt((zoom+2)*Math.ceil(maxh/_this.maxNativeZoom))));;
//             console.log("level", zoom, "toh", toh, "scale", scale)

//             var x1 = tileBaseSize * x; var x2 = Math.min(tileBaseSize * (x + 1) - 1, w)
//             var y2 = h - tileBaseSize * y; var y1 = h - Math.min(tileBaseSize * (y + 1) - 1, h);

//             url += "&action=boxquery";
//             url += "&compression=jpg";
//             url += "&box=" + x1 + "%20" + x2 + "%20" + y1 + "%20" + y2;
//             url += "&dataset=" + encodeURIComponent(dataset);
//             url += "&maxh=" + maxh; 
//             url += "&toh=" + toh; 

//             //this._baseUrl
//             return url;/*L.Util.template(url, L.extend({
//               format: _this.options.tileFormat,
//             //  quality: _this.quality,
//               region: [minx, miny, xDiff, yDiff].join(','),
//               rotation: 0,
//               size: size
//             }, this.options));*/
//           },
//           onAdd: function(map) {
//             var _this = this;

//             // Wait for info.json fetch and parse to complete
//             Promise.all([_this._infoPromise]).then(function() {
//               // Store unmutated imageSizes
//               _this._imageSizesOriginal = _this._imageSizes.slice(0); 

//               // Set maxZoom for map
//               map._layersMaxZoom = _this.maxZoom;

//               // Call add TileLayer
//               L.TileLayer.prototype.onAdd.call(_this, map);

//               // Set minZoom and minNativeZoom based on how the imageSizes match up
//               var smallestImage = _this._imageSizes[0];
//               var mapSize = _this._map.getSize();
//               var newMinZoom = 0;
//               // Loop back through 5 times to see if a better fit can be found.
//               for (var i = 1; i <= 5; i++) {
//                 if (smallestImage.x > mapSize.x || smallestImage.y > mapSize.y) {
//                   smallestImage = smallestImage.divideBy(2);
//                   _this._imageSizes.unshift(smallestImage);
//                   newMinZoom = -i;
//                 } else {
//                   break;
//                 }
//               }
//               _this.options.minZoom = newMinZoom;
//               _this.options.minNativeZoom = newMinZoom;
//               _this._prev_map_layersMinZoom = _this._map._layersMinZoom;
//               _this._map._layersMinZoom = newMinZoom;

//               if (_this.options.fitBounds) {
//                 _this._fitBounds();
//               }

//               if(_this.options.setMaxBounds) {
//                 _this._setMaxBounds();
//               }

//               // Reset tile sizes to handle non 256x256 IIIF tiles
//               _this.on('tileload', function(tile, url) {

//                 var height = tile.tile.naturalHeight,
//                   width = tile.tile.naturalWidth;

//                 // No need to resize if tile is 256 x 256
//                 if (height === 256 && width === 256) return;

//                 tile.tile.style.width = width + 'px';
//                 tile.tile.style.height = height + 'px';

//               });
//             })
//             .catch(function(err){
//                 console.error(err);
//             });
//           },
//           onRemove: function(map) {
//             var _this = this;
            
//             map._layersMinZoom = _this._prev_map_layersMinZoom;
//             _this._imageSizes = _this._imageSizesOriginal;

//             // Remove maxBounds set for this image
//             if(_this.options.setMaxBounds) {
//               map.setMaxBounds(null);
//             }

//             // Call remove TileLayer
//             L.TileLayer.prototype.onRemove.call(_this, map);
//           },
//           _fitBounds: function() {
//             var _this = this;

//             // Find best zoom level and center map
//             var initialZoom = _this._getInitialZoom(_this._map.getSize());
//             var offset = _this._imageSizes.length - 1 - _this.options.maxNativeZoom;
//             var imageSize = _this._imageSizes[initialZoom + offset];
//             var sw = _this._map.options.crs.pointToLatLng(L.point(0, imageSize.y), initialZoom);
//             var ne = _this._map.options.crs.pointToLatLng(L.point(imageSize.x, 0), initialZoom);
//             var bounds = L.latLngBounds(sw, ne);

//             _this._map.fitBounds(bounds, true);
//           },
//           _setMaxBounds: function() {
//             var _this = this;

//             // Find best zoom level, center map, and constrain viewer
//             var initialZoom = _this._getInitialZoom(_this._map.getSize());
//             var imageSize = _this._imageSizes[initialZoom];
//             var sw = _this._map.options.crs.pointToLatLng(L.point(0, imageSize.y), initialZoom);
//             var ne = _this._map.options.crs.pointToLatLng(L.point(imageSize.x, 0), initialZoom);
//             var bounds = L.latLngBounds(sw, ne);

//             _this._map.setMaxBounds(bounds, true);
//           },
//           _getInfo: function() {
//             var _this = this;

//             _this.y = h;
//             _this.x = w;

//             var tierSizes = [],
//               imageSizes = [],
//               scale,
//               width_,
//               height_,
//               tilesX_,
//               tilesY_;

//             // Set quality based off of IIIF version
//             // if (data.profile instanceof Array) {
//             //   _this.profile = data.profile[0];
//             // }else {
//             //   _this.profile = data.profile;
//             // }
//             // _this.type = data.type;

//             // _this._setQuality();

//             // Unless an explicit tileSize is set, use a preferred tileSize
//             if (!_this._explicitTileSize) {
//               // Set the default first
//               _this.options.tileSize = 256;
//               if (tile_size) {
//                 _this.options.tileSize = tile_size;
//               } 
//             }

//             function ceilLog2(x) {
//               return Math.ceil(Math.log(x) / Math.LN2);
//             };

//             // Calculates maximum native zoom for the layer
//             _this.maxNativeZoom = Math.max(
//               ceilLog2(_this.x / _this.options.tileSize),
//               ceilLog2(_this.y / _this.options.tileSize),
//               0
//             );
//             _this.options.maxNativeZoom = _this.maxNativeZoom;

//             // Enable zooming further than native if maxZoom option supplied
//             if (_this._customMaxZoom && _this.options.maxZoom > _this.maxNativeZoom) {
//               _this.maxZoom = _this.options.maxZoom;
//             }
//             else {
//               _this.maxZoom = _this.maxNativeZoom;
//             }
            
//             for (var i = 0; i <= _this.maxZoom; i++) {
//               scale = Math.pow(2, _this.maxNativeZoom - i);
//               width_ = Math.ceil(_this.x / scale);
//               height_ = Math.ceil(_this.y / scale);
//               tilesX_ = Math.ceil(width_ / _this.options.tileSize);
//               tilesY_ = Math.ceil(height_ / _this.options.tileSize);
//               tierSizes.push([tilesX_, tilesY_]);
//               imageSizes.push(L.point(width_,height_));
//             }

//             _this._tierSizes = tierSizes;
//             _this._imageSizes = imageSizes;
          
//           },
//           // _setQuality: function() {
//           //   var _this = this;
//           //   var profileToCheck = _this.profile;

//           //   if (_this._explicitQuality) {
//           //     return;
//           //   }

//           //   // If profile is an object
//           //   if (typeof(profileToCheck) === 'object') {
//           //     profileToCheck = profileToCheck['@id'];
//           //   }

//           //   // Set the quality based on the IIIF compliance level
//           //   switch (true) {
//           //     case /^http:\/\/library.stanford.edu\/iiif\/image-api\/1.1\/compliance.html.*$/.test(profileToCheck):
//           //       _this.options.quality = 'native';
//           //       break;
//           //     // Assume later profiles and set to default
//           //     default:
//           //       _this.options.quality = 'default';
//           //       break;
//           //   }
//           // },
//           // _infoToBaseUrl: function() {
//           //   return this._infoUrl.replace('info.json', '');
//           // },
//           // _templateUrl: function() {
//           //   return this._infoToBaseUrl() + '{region}/{size}/{rotation}/{quality}.{format}';
//           // },
//           // _isValidTile: function(coords) {
//           //   var _this = this;
//           //   var zoom = _this._getZoomForUrl();
//           //   var sizes = _this._tierSizes[zoom];
//           //   var x = coords.x;
//           //   var y = coords.y;
//           //   if (zoom < 0 && x >= 0 && y >= 0) {
//           //     return true;
//           //   }

//           //   if (!sizes) return false;
//           //   if (x < 0 || sizes[0] <= x || y < 0 || sizes[1] <= y) {
//           //     return false;
//           //   }else {
//           //     return true;
//           //   }
//           // },
//           // _tileShouldBeLoaded: function(coords) {
//           //   return this._isValidTile(coords);
//           // },
//           _getInitialZoom: function (mapSize) {
//             var _this = this;
//             var tolerance = 0.8;
//             var imageSize;
//             // Calculate an offset between the zoom levels and the array accessors
//             var offset = _this._imageSizes.length - 1 - _this.options.maxNativeZoom;
//             for (var i = _this._imageSizes.length - 1; i >= 0; i--) {
//               imageSize = _this._imageSizes[i];
//               if (imageSize.x * tolerance < mapSize.x && imageSize.y * tolerance < mapSize.y) {
//                 return i - offset;
//               }
//             }
//             // return a default zoom
//             return 2;
//           }
//     });
// }



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

              // var xDiff = (x2 - x1);
              // var yDiff = (y2 - y1);

              // var sizex = Math.ceil(xDiff / scale);
              // var sizey = Math.ceil(yDiff / scale);

              // console.log("size", sizex, sizey, xDiff, yDiff)

              var url = server + "/mod_visus?";

              var toh = Math.min(maxh, minLevel*2 + level*2);//Math.min(maxh, Math.max(minLevel*2, parseInt((level+1)*Math.ceil(maxh/num_levels))));

              // if(sizex < tile_size || sizey < tile_size){
              //   toh++;
              // }

              console.log("level", level, "toh", toh, "scale", scale)

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
