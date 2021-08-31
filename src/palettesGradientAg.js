
//Updates svg element with new linear gradient based upon text name cmaptype
function updatePaletteView(cmaptype) {
    var svgns = 'http://www.w3.org/2000/svg';
    console.log("In palette View svg edit" + cmaptype);

    // Create <svg>, <defs>, <linearGradient> and <rect> elements using createElementNS to apply the SVG namespace.
    // (https://developer.mozilla.org/en-US/docs/Web/API/Document/createElementNS)
    //var svg = document.createElementNS(svgns, 'svg');
    var defs = document.getElementById('svg-palette-view-defs') ;
    var gradient = document.getElementById('svg-palette-lg') ;
    document.getElementById('svg-palette-lg').innerHTML= '';


    // Store an array of stop information for the <linearGradient>
    if (cmaptype == 'NDVI_Beach') {  //NDVI_Beach
        console.log("In palette View svg edit: NDVI_Beach");
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
        console.log("In palette View svg edit   NDVI_Bright");
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
    else if (cmaptype == 'LinearGray4') {
        var stops = getStopsFromFile('/Users/amygooch/GIT/SCI/VISUS/SVN/2021_BattelleNeon/SCI_palettes/linearGray4.transfer_function')
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

function convertToHex (rgb) {
    return hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
}


function getStopsFromFile(txt){
    var stops = [];
    var reader = new FileReader();
    reader.onload = (event) => {
        const file = event.target.result;
        const allLines = file.split(/\r\n|\n/);
        // Reading line by line
        var whichline = 0
        allLines.forEach((line) => {
            whichline =  whichline+1
            console.log(line);
            rgb= line.split(' ');
            console.log('r = '+ rgb[0]+ ' b= '+ rgb[1]+ ' b= '+ rgb[2])
            stops.add({
                "color": convertToHex(rgb),
                "offset": whichline/(allLines.length) + "%"
            })
        });
    };

    reader.onerror = (event) => {
        alert(event.target.error.name);
    };

    reader.readAsText(txt);
    console.log(stops);
}