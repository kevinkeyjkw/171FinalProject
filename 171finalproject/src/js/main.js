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



// appending the SVG to the Leaflet map pane
// g (group) element will be inside the svg
var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");


var transform = d3.geo.transform({point: projectPoint});
var d3path = d3.geo.path().projection(transform);

var svg2 = d3.select("#time").append("svg")
    .attr("height", 20)
    .attr("class", "time");

var time = svg2.append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("class", "time")
    .style("font-size", "20px")
    .text("Date:");

var dateFormat = d3.time.format("%d-%B-%Y");

var cleanedData;
var cleanedDataFeatures = [];
var featureCollection;

function readData(){
    d3.csv("ACLED-Asia-Version-1-20151.csv", function(allData){

        allData.forEach(function(d){
            d.EVENT_DATE = dateFormat.parse(d.EVENT_DATE);
            d.FATALITIeS = +d.FATALITIES;
            d.LATITUDE = +d.LATITUDE;
            d.LONGITUDE = +d.LONGITUDE;
        });

        cleanedData = allData;
        cleanedData.forEach(function(d){
            if(d.LATITUDE != null && d.LONGITUDE != null){
                cleanedDataFeatures.push(   {"type": "Feature", "properties": {"country": d.COUNTRY, "date": d.EVENT_DATE},"geometry": {"type": "Point", "coordinates": [d.LONGITUDE, d.LATITUDE]}});
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

function addlocations(){

    g.selectAll("circle.points").remove();

    // Filter depending on user selection
    var filteredCities = convertToFeatures(
        cleanedDataFeatures.filter(function(d){
            return d.properties.date.getMonth() == 4;
        })
    );


    var locations = g.selectAll("circle")
        .data(filteredCities.features)
        .enter()
        .append("circle")
        .style("fill", "red")
        .attr("class", "points")
        .attr("r", 2);



    reset();
    map.on("viewreset", reset);


    function reset() {
        var bounds = d3path.bounds(cities), topLeft = bounds[0], bottomRight = bounds[1];

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

//function addlocations(){
//
//    g.selectAll("circle.points").remove();
//
//    // Filter depending on user selection
//    var filteredCities = cleanedDataFeatures;
//
//    var locations = g.selectAll("circle")
//        .data(filteredCities.features)
//        .enter()
//        .append("circle")
//        .style("opacity", 0.0);
//
//        locations.transition()
//            .delay(function (d) {
//                //return speed*d.properties.t;
//                return 1;
//            })
//        .style("fill", function(d){
//            return conflictTypeColor(d);
//        })
//        .style("opacity", 0.7)
//        .attr("class", "points")
//        .attr("r", 3)
//        .transition()
//        .style("opacity",0.0)
//        .attr("r", 30)
//        .duration(1500)
//        .transition()
//        .style("opacity", 0.7)
//        .attr("r", 3)
//        .duration(0)
//        ;
//
//
//    var timer= svg2.selectAll(".text")
//        .data(filteredCities.features).enter().append("text")
//        .transition()
//        .delay(function (d) {
//            //return speed* d.properties.t;
//            return 1;
//        })
//        .attr("x", 80)
//        .attr("y", 18)
//        .attr("class", "timer")
//        .style("font-size", "20px")
//        .style("opacity", 1)
//        .text(function (d) {
//            return d.properties.name;
//        })
//        .transition()
//        ////.duration(speed*0.5)
//        .style("opacity", 0);
//
//
//    reset();
//    map.on("viewreset", reset);
//
//
//    function reset() {
//        var bounds = d3path.bounds(cities), topLeft = bounds[0], bottomRight = bounds[1];
//
//        // Setting the size and location of the overall SVG container
//        svg
//            .attr("width", bottomRight[0] - topLeft[0] + 120)
//            .attr("height", bottomRight[1] - topLeft[1] + 120)
//            .style("left", topLeft[0] - 50 + "px")
//            .style("top", topLeft[1] - 50 + "px");
//
//        g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");
//
//        locations.attr("transform",
//            function(d) {
//                return "translate(" +
//                    applyLatLngToLayer(d).x + "," +
//                    applyLatLngToLayer(d).y + ")";
//            });
//    }
//
//
//
//}

function conflictTypeColor(d){
    // Return color depending on d conflict type
    return "#FF4545";
}

function slideUpdateTimelapse(month){
    g.selectAll("circle.points").remove();

    // Filter depending on user selection
    var filteredCities = convertToFeatures(
        cleanedDataFeatures.filter(function(d){
            return d.properties.date.getMonth()+1 == month;
        })
    );

    var locations = g.selectAll("circle")
        .data(filteredCities.features)
        .enter()
        .append("circle")
        .style("fill", "red")
        .attr("class", "points")
        .attr("r", 2);

    console.log("slide!");

    reset();
    map.on("viewreset", reset);


    function reset() {
        var bounds = d3path.bounds(cities), topLeft = bounds[0], bottomRight = bounds[1];

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
