// References
// http://stackoverflow.com/questions/10224856/jquery-ui-slider-labels-under-slider

var months = ["Jan", "Feb", "Mar", "Apr","May", "Jun","Jul" , "Aug", "Sept", "Oct", "Nov", "Dec" ];
var months_dict = {}
months.forEach(function(d, idx){
    months_dict[idx+1] = d;
});



var cities={"type": "FeatureCollection", "features": [

        {"type": "Feature", "properties": {"name":"India", "t":1},"geometry": {"type": "Point", "coordinates": [78.962880, 20.593684]}},
        {"type": "Feature", "properties": {"name":"Sri Lanka", "t":2},"geometry": {"type": "Point", "coordinates": [80.771797, 7.873054]}},
        {"type": "Feature", "properties": {"name":"Pakistan", "t":3},"geometry": {"type": "Point", "coordinates": [69.345116, 30.375321]}},

    ]};

var time_lkup=[
    {"t":1, "date":"01-01-2015"},
    {"t":2, "date":"02-01-2015"},
    {"t":3, "date":"03-01-2015"},
];

var speed=800;
var timelapse_totaltime = 240;

function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}
// similar to projectPoint this function converts lat/long to
// svg coordinates except that it accepts a point from our
// GeoJSON
function applyLatLngToLayer(d) {
    var y = d.geometry.coordinates[1]
    var x = d.geometry.coordinates[0]
    return map.latLngToLayerPoint(new L.LatLng(y, x))
}



//create map object and set default positions and zoom level
var map = L.map('map').setView([19.89072, 90.7470], 4);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png',
    {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);

// Markers
var markers;
var latitude = 1;
var longitude = 0;

// appending the SVG to the Leaflet map pane
// g (group) element will be inside the svg
var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");

var legend = L.control({position: 'topright'});


var transform = d3.geo.transform({point: projectPoint});
var d3path = d3.geo.path().projection(transform);

var svg2 = d3.select("#time").append("svg")
    .attr("height", 200)
    .attr("width", 800)
    .attr("class", "time");

var time = svg2.append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("class", "time")
    .style("font-size", "20px");

var dateFormat = d3.time.format("%d-%B-%Y");

var cleanedData;
var cleanedDataFeatures = [];
var featureCollection;
var conflictTypes = [];
var c20 = d3.scale.category20();
var notes = []
var notesDelay = 7;

function readData(){
    d3.csv("ACLED-Asia-Version-1-20151.csv", function(allData){

        allData.forEach(function(d){
            d.EVENT_DATE = dateFormat.parse(d.EVENT_DATE);
            d.FATALITIeS = +d.FATALITIES;
            d.LATITUDE = +d.LATITUDE;
            d.LONGITUDE = +d.LONGITUDE;
            if(conflictTypes.indexOf(d.EVENT_TYPE) == -1){
                conflictTypes.push(d.EVENT_TYPE);
            }
        });
        //console.log(allData);
        console.log(conflictTypes);
        legend.onAdd = function(map){
            var div = L.DomUtil.create('div', 'info legend'),
                labels = [];

            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < conflictTypes.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + c20(conflictTypes[i]) + '"></i> ' +
                    conflictTypes[i] + '<br>';
            }

            return div;
        };

        legend.addTo(map);
        cleanedData = allData;
        var i = 0;
        while(notes.length < timelapse_totaltime/notesDelay){
            if(cleanedData[i].NOTES != null){
                notes.push(cleanedData[i].NOTES);
            }
            i += 1;
        }
        console.log(notes);
        cleanedData.forEach(function(d){
            if(d.LATITUDE != null && d.LONGITUDE != null){
                cleanedDataFeatures.push({
                        "type": "Feature",
                        "properties": {"country": d.COUNTRY,
                        "date": d.EVENT_DATE,
                        "conflict_type": d.EVENT_TYPE,
                        "notes": d.NOTES
                    },
                        "geometry": {"type": "Point",
                                "coordinates": [d.LONGITUDE, d.LATITUDE]
                                }
                    });
            }

        });

        featureCollection = convertToFeatures(cleanedDataFeatures);
        console.log(featureCollection);

    });
}
readData();

function convertToFeatures(features){
    return {"type": "FeatureCollection", "features": features};
}

// Tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function calculateDelay(date){
    var t = (date.getMonth() * (timelapse_totaltime/12) + date.getDate() * ((timelapse_totaltime/12)/30))*1000;
    //console.log('coef',(timelapse_totaltime/12));
    //console.log('month',date.getMonth() * (timelapse_totaltime/12) * 1000);
    //console.log('day',date.getDate() * ((timelapse_totaltime/12)/30));
    //console.log(t);
    return t;
}

function stop(){

    g.selectAll("circle").transition();
    svg2.selectAll(".timer").transition().delay(0);
    //reset();
    //map.on("viewreset", reset);

}
// Play timelapse
function addlocations(){

    g.selectAll("circle").remove();
    svg2.selectAll(".timer").remove();

    // Filter depending on user selection

    var filteredCities = convertToFeatures(
        cleanedDataFeatures.filter(function(d){return d.properties.date.getMonth() < 5;})
    );

    var locations = g.selectAll("circle")
        .data(filteredCities.features)
        .enter()
        .append("circle")
        .style("opacity", 0.0)
        .attr("fill", "transparent");

    //locations
        //.on("mouseover", function(d) {
        //    console.log("tooltip");
        //    tooltip.transition()
        //        .duration(200)
        //        .style("opacity", .9);
        //    tooltip.html(d.properties.country);
        //})
        //.on("mouseout", function(d) {
        //    tooltip.transition()
        //        .duration(500)
        //        .style("opacity", 0);
        //});

        locations.transition()
            .delay(function (d) {
                //return speed*d.properties.t;
                return calculateDelay(d.properties.date);
            })
            .attr("fill", function(d){
                return c20(d.properties.conflict_type);
            })
            .style("opacity", 0.7)
            .attr("class", "points")
            .attr("r", 1)
            .transition()
            .style("opacity",0.0)
            .attr("r", 20)
            .duration(1500)
            .transition()
            .style("opacity", 0.7)
            .attr("r", 1)
            .duration(0)
            ;


    //var timer= svg2.selectAll(".text")
    //    .data(notes).enter().append("text")
    //    ;

    var timer= svg2.selectAll("foreignObject")
        .data(notes).enter().append('foreignObject')
        //.attr('width', 800)
        //.attr('height', 200)
        .append("xhtml:div")
        .html(function(d){
            return '<div style="width: 1000px;font-size: 20px;"><strong>"' + d + '"</strong></div>';
        }).style("opacity", 0.0);

    timer
        .transition()
        .delay(function (d, idx) {
            console.log(d,idx);
            //return speed* d.properties.t;
            return idx * notesDelay * 1000;
        })
        .attr("x", 100)
        .attr("y", 12)
        .attr("class", "timer")
        .style("opacity", 1.0)
        .transition()
        .duration(notesDelay*800)
        .style("opacity", 0.0)
        ;


    reset();
    map.on("viewreset", reset);


    function reset() {
        var bounds = d3path.bounds(filteredCities), topLeft = bounds[0], bottomRight = bounds[1];

        // Setting the size and location of the overall SVG container
        svg
            .attr("width", bottomRight[0] - topLeft[0] + 520)
            .attr("height", bottomRight[1] - topLeft[1] + 120)
            .style("left", topLeft[0] - 50 + "px")
            .style("top", topLeft[1] - 50 + "px");

        g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");

        locations.attr("transform",
            function(d) {
                return "translate(" +
                    applyLatLngToLayer(d).x + "," +
                    applyLatLngToLayer(d).y + ")";
            });
    }



}

function slideUpdateTimelapse(month){
    //if(markers != null){
    //    map.removeLayer(markers);
    //}
    //
    //markers = L.layerGroup().addTo(map);
    g.selectAll("circle.points").remove();

    // Filter depending on user selection
    var filteredCities = convertToFeatures(
        cleanedDataFeatures.filter(function(d){
            return d.properties.date.getMonth()+1 == month;
        })
    );

    // Add circles
    var locations = g.selectAll("circle")
        .data(filteredCities.features)
        .enter()
        .append("circle")
        .attr("fill", function(d){
            return c20(d.properties.conflict_type);
        })
        .style("opacity", 0.4)
        .attr("class", "points")
        .attr("r", 5)
        ;


//.attr("data-legend",function(d){
//        return d.properties.conflict_type;
//    })
    //legend = svg.append("g")
    //    .attr("class", "legend")
    //    .attr("transform", "translate(520,30)")
    //    .style("font-size", "12px")
    //    .call(d3.legend);

    console.log("conflict type legend",c20.domain(),c20.range());
    reset();
    map.on("viewreset", reset);

    //cleanedDataFeatures.filter(function(d){
    //    return d.properties.date.getMonth()+1 == month;
    //}).forEach(function(d, idx){
    //    var popupContent = "<strong>" + d.properties.country + "</strong>";
    //    var marker = L.marker([d.geometry.coordinates[latitude], d.geometry.coordinates[longitude]])
    //        .bindPopup(popupContent)
    //        .addTo(map);
    //    markers.addLayer(marker);
    //});

    function reset() {
        var bounds = d3path.bounds(filteredCities), topLeft = bounds[0], bottomRight = bounds[1];

        // Setting the size and location of the overall SVG container
        svg
            .attr("width", bottomRight[0] - topLeft[0] + 120)
            .attr("height", bottomRight[1] - topLeft[1] + 120)
            .style("left", topLeft[0] - 50 + "px")
            .style("top", topLeft[1] - 50 + "px");

        g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");

        locations.attr("transform",
            function(d) {
                return "translate(" +
                    applyLatLngToLayer(d).x + "," +
                    applyLatLngToLayer(d).y + ")";
            });
    }
}


$("#slider").slider({
        value: 4,
        min: 1,
        max: 12,
        step: 1,
        slide: function( event, ui ) {
            $( "#amount" ).val( "$" + ui.value );
            slideUpdateTimelapse(ui.value);
        }
    })
    .each(function() {

        // Add labels to slider whose values
        // are specified by min, max

        // Get the options for this slider (specified above)
        var opt = $(this).data().uiSlider.options;

        // Get the number of possible values
        var vals = opt.max - opt.min;

        // Position the labels
        for (var i = 0; i <= vals; i++) {

            // Create a new element and position it with percentages
            var el = $('<label>' + months_dict[i + 1] + '</label>').css('left', (i/vals*100) + '%');

            // Add the element inside #slider
            $("#slider").append(el);

        }

    });
