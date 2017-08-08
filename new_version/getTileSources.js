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