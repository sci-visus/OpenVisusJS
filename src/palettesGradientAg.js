

//Updates svg element with new linear gradient based upon text name cmaptype
function updatePaletteView(cmaptype) {
    var svgns = 'http://www.w3.org/2000/svg';
    //console.log("In palette View svg edit" + cmaptype);

    // Create <svg>, <defs>, <linearGradient> and <rect> elements using createElementNS to apply the SVG namespace.
    // (https://developer.mozilla.org/en-US/docs/Web/API/Document/createElementNS)
    //var svg = document.createElementNS(svgns, 'svg');
    var defs = document.getElementById('svg-palette-view-defs') ;
    var gradient = document.getElementById('svg-palette-lg') ;
    document.getElementById('svg-palette-lg').innerHTML= '';


    // Store an array of stop information for the <linearGradient>
    if (cmaptype == 'NDVI_Beach') {  //NDVI_Beach
        //console.log("In palette View svg edit: NDVI_Beach");
        var stops = [
            {
                "color": "#8bc4f9",
                "offset": "5%"
            }, {
                "color": "#c9995c",
                "offset": "27.5%"
            }
            , {
                "color": "#c7d270",
                "offset": "50%"
            }
            , {
                "color": "#8add60",
                "offset": "72.5%"
            }
            , {
                "color": "#097210",
                "offset": "95%"
            }
        ];
    }
    else if (cmaptype == 'NDVI_Bright') {
        //console.log("In palette View svg edit   NDVI_Bright");
        var stops = [   //NDVI_Bright
            {
                "color": "#640000",
                "offset": "5%"
            }, {
                "color": "#ff0000",
                "offset": "27.5%"
            }
            , {
                "color": "#ffff00",
                "offset": "50%"
            }
            , {
                "color": "#00c800",
                "offset": "72.5%"
            }
            , {
                "color": "#006400",
                "offset": "85%"
            }
        ];
    }
    else if (cmaptype == 'NDVI_Forest') {

        var  stops = [  // NDVI_Forest
        {
            "color": "#6e462c",
            "offset": "5%"
        }, {
            "color": "#9c8448",
            "offset": "27.5%"
        }
        , {
            "color": "#cccc66",
            "offset": "50%"
        }
        , {
            "color": "#9cab68",
            "offset": "72.5%"
        }
        , {
            "color": "#306466",
            "offset": "85%"
        }];
    }
    else if (cmaptype == 'NDVI_VIRIDIS') {
    var stops = [   //NDVI_VIRIDIS
        {
            "color": "#40004f",
            "offset": "5%"
        }, {
            "color": "#20908c",
            "offset": "50%"
        }
        , {
            "color": "#fae622",
            "offset": "95%"
        }
    ];
    }
    else if (cmaptype == 'NDVI_BlueGreen') {
    var  stops = [   //NDVI_Other
        {
            "color": "#091b54",
            "offset": "5%"
        }
        , {
            "color": "#fcfbf9",
            "offset": "50%"
        },
        {
            "color": "#bda57b",
            "offset": "60%"
        }, {
            "color": "#2a8900",
            "offset": "75%"
        }
        , {
            "color": "#000000",
            "offset": "90%"
        }
    ];
    }
    else if (cmaptype == 'NDVI_Rainbow') {
    var  stops = [   //NDVI_BlueGreen
        {
            "color": "#ffffff",
            "offset": "0%"
        }
        , {
            "color": "#000000",
            "offset": "50%"
        },
        {
            "color": "#8e4a93",
            "offset": "51%"
        }, {
            "color": "#bd200f",
            "offset": "62%"
        }
        , {
            "color": "#eb7d2e",
            "offset": "73%"
        }, {
            "color": "#fffb00",
            "offset": "84%"
        }
        , {
            "color": "#199410",
            "offset": "95%"
        }, {
            "color": "#134721",
            "offset": "100%"
        }



    ];
    }
    else if (cmaptype == 'LinearGray4')
        var stops = createStopsFromViSUSColorMaps(LinearGray4_colormap);
    else if (cmaptype == 'LinearGray5')
        var stops = createStopsFromViSUSColorMaps(LinearGray5_colormap);
    else if (cmaptype == 'AsymmetricBlueGreenDivergent')
        var stops = createStopsFromViSUSColorMaps(AsymmetricBlueGreenDivergent_colormap);
    else if (cmaptype == 'AsymmetricBlueOrangeDivergent')
        var stops = createStopsFromViSUSColorMaps(AsymmetricBlueOrangeDivergent_colormap);
    else if (cmaptype == 'brg')
        var stops = createStopsFromViSUSColorMaps(bry_colormap);

    else if (cmaptype == 'red')
        var stops = createStopsFromViSUSColorMaps(red_colormap);

    else if (cmaptype == 'green')
        var stops = createStopsFromViSUSColorMaps(green_colormap);

    else if (cmaptype == 'blue')
        var stops = createStopsFromViSUSColorMaps(blue_colormap);

    else {
        var stops = [{
            "color": "#ffffff",
            "offset": "0%"
        }, {
                "color": "#000000",
                "offset": "50%"
            },];
    }



    // Parses an array of stop information and appends <stop> elements to the <linearGradient>
    for (var i = 0, length = stops.length; i < length; i++) {

        // Create a <stop> element and set its offset based on the position of the for loop.
        var stop = document.createElementNS(svgns, 'stop');
        stop.setAttribute('offset', stops[i].offset);
        stop.setAttribute('stop-color', stops[i].color);

        // Add the stop to the <lineargradient> element.
        gradient.appendChild(stop);

    }


}

function createStopsFromViSUSColorMaps(visuscolormap) {
    var stops = [];
    var num_stops = visuscolormap.length / 4;
    var stopnum = 0;
    for (var i = 0, length = visuscolormap.length; i < length; i = i + 4) {
        stops.push({
            "color": "rgba("+parseInt(visuscolormap[i+0]  )+", "
            + parseInt(visuscolormap[i + 1]  )+", "+ parseInt(visuscolormap[i + 2]  )+", "+ parseInt(visuscolormap[i + 3]  )+")",
            "offset": 100*( stopnum / (num_stops-1) )+ "%"
        })
        stopnum ++;
    }
    return(stops);
}

function convertToHex (rgb) {
    return hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2])
}

function getStopsFromFile(txt) {
    var stops = [];
    return fetch('file:/'+txt)
        .then(function(response){
            conosle.log('here');
            return(response.text())
        })
        .then(function (text) {
            console.log('Using :'+ text);
            stops = processStopsFromFile(text);
            return (stops);
        })
        .catch(function (error) {
            console.log("Catch on getStopsFromFile: " +txt+ '   ' + error);
        });
    // outputs the content of the text file

//     const fs = require('fs');
// // First I want to read the file
//     fs.readFile(txt, function read(err, data) {
//         if (err) {
//             throw err;
//         }
//         const content = data;
//
//         // Invoke the next step here however you like
//         console.log(content);   // Put all of the code here (not the best solution)
//         return (processStopsFromFile(content));   // Or put the next step in a function and invoke it
//     });

}


function processStopsFromFile(content){
    var stops = [];

    var textByLine = content.split("\n");
    var whichline = 0;
    textByLine.forEach((line) => {
        whichline = whichline + 1;
        console.log(line);
        rgb = line.split(' ');
        console.log('r = ' + rgb[0] + ' b= ' + rgb[1] + ' b= ' + rgb[2]);
        stops.add({
            "color": convertToHex(rgb),
            "offset": whichline / (textByLine.length) + "%"
        })
    });

    console.log(stops);
    return(stops);
}