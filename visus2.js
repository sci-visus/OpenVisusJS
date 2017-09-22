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
function getTileSources(server, dataset, w, h, max_levels, tile_size, bXRoad) {
    num_levels = parseInt(max_levels / 2, 10);
    return {
        height: h,
        width: w,
        tileSize: tile_size,
        minLevel: 0,
        maxLevel: num_levels,
        getTileUrl: function (level, x, y) {
            var scale = Math.pow(2, num_levels - level);
            var level_tile_size = tile_size * scale;
            var x1 = level_tile_size * x; var x2 = Math.min(level_tile_size * (x + 1) - 1, w)
            var y2 = h - level_tile_size * y; var y1 = h - Math.min(level_tile_size * (y + 1) - 1, h);

            var url = "";
            if (bXRoad)
                url = "mod_visus.ashx?server=" + encodeURIComponent(server);
            else 
                url = server + "/mod_visus?";

            url += "&action=boxquery";
            url += "&compression=jpg";
            url += "&box=" + x1 + "%20" + x2 + "%20" + y1 + "%20" + y2;
            url += "&dataset=" + encodeURIComponent(dataset);
            url += "&maxh=" + max_levels;
            url += "&toh=" + level * 2;;

            return url;
        }
    };
}