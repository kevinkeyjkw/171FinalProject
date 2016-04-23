// References
// http://stackoverflow.com/questions/10224856/jquery-ui-slider-labels-under-slider

var months = ["Jan", "Feb", "Mar", "Apr","May", "Jun","Jul" , "Aug", "Sept", "Oct", "Nov", "Dec" ];
var months_dict = {}
months.forEach(function(d, idx){
    months_dict[idx+1] = d;
});

var dayInterval, secondsPassed = 0, dayNumber = 0;
var notes = [], notesDelay = 7, noteInterval, notesPassed;
var noteFadeIn = 3, noteFadeOut = notesDelay - noteFadeIn;
var filterCountryCriteria = [];
var filterConflictCriteria = [];
var timeline;

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
var timelapse_totaltime = 90;
var dayDelay = timelapse_totaltime/365.0;

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
var map = L.map('map',{
    scrollWheelZoom: false
}).setView([19.89072, 90.7470], 4);
map.on('mouseout',function(){
        map.scrollWheelZoom.disable();

});
map.on('click', function() {
    //if (map.scrollWheelZoom.enabled()) {
    //    map.scrollWheelZoom.disable();
    //}
    //else {
    //    map.scrollWheelZoom.enable();
    //}
    map.scrollWheelZoom.enable();
});

L.tileLayer('http://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

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

var svg3 = d3.select("#day").append("svg")
    .attr("height", 50)
    .attr("width", 50);

var dateFormat = d3.time.format("%d-%B-%Y");

var cleanedData;
var cleanedDataFeatures = [];
var featureCollection;
var conflictTypes = [];
//var c20 = d3.scale.category10();
var c20 = d3.scale.ordinal();
var fatalitiesScale = d3.scale.linear();

var dayConflictDict = {};

function readData(){
    d3.csv("ACLED-Asia-Version-1-20151.csv", function(allData){

        // Convert strings to numbers
        allData.forEach(function(d){
            d.EVENT_DATE = dateFormat.parse(d.EVENT_DATE);
            d.FATALITIES = +d.FATALITIES;
            d.LATITUDE = +d.LATITUDE;
            d.LONGITUDE = +d.LONGITUDE;

            // Determine how many types of conflicts, needed for legend
            if(conflictTypes.indexOf(d.EVENT_TYPE.trim().toLowerCase()) == -1){
                conflictTypes.push(d.EVENT_TYPE.trim().toLowerCase());
            }
        });

        c20.domain(conflictTypes).range(["#000000", "#FFFF00", "red", "#FF34FF",
            "orange", "green", "#0000A6", "#1CE6FF"]);

        // Legend for map
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
        console.log('cleaned data');
        console.log(cleanedData);
        // Create timeline
        // {Date(): numFatalities, etc}
        cleanedData.forEach(function(d){
            if(d.EVENT_DATE.getTime() in dayConflictDict){
                dayConflictDict[d.EVENT_DATE.getTime()] += 1;
            }else{
                dayConflictDict[d.EVENT_DATE.getTime()] = 1;
            }
        });
        console.log(Object.keys(dayConflictDict).sort());
        console.log(dayConflictDict);
        createTimeline(dayConflictDict);

        // Mean of fatalities
        var fatMean = d3.mean(cleanedData.map(function(d){return d.FATALITIES;}));

        // Scale for circle radius
        fatalitiesScale.domain([d3.min(cleanedData, function(d){
            if(d.FATALITIES != null){
                return d.FATALITIES;
            }
            // the data has no fatality number, return mean
            return fatMean;
        }),d3.max(cleanedData, function(d){
            if(d.FATALITIES != null){
                return d.FATALITIES;
            }
            return fatMean;
        })]);


        // Find short notes to display
        var i = 0;
        while(notes.length < timelapse_totaltime/notesDelay && i < cleanedData.length){

            if(cleanedData[i] != undefined) {
                if (cleanedData[i].NOTES != undefined && cleanedData[i].NOTES.length < 160) {
                    notes.push(cleanedData[i].NOTES);

                }
            }
            i += 1;
        }

        // Convert data to this format for display on map
        cleanedData.forEach(function(d){
            if(d.LATITUDE != null && d.LONGITUDE != null){
                cleanedDataFeatures.push({
                        "type": "Feature",
                        "properties": {"country": d.COUNTRY,
                        "date": d.EVENT_DATE,
                        "conflict_type": d.EVENT_TYPE.trim().toLowerCase(),
                        "notes": d.NOTES,
                        "fatalities": d.FATALITIES
                    },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [d.LONGITUDE, d.LATITUDE]
                                }
                    });
            }

        });

        featureCollection = convertToFeatures(cleanedDataFeatures);
    });
}

// Read in data
readData();

// Takes in array of features and converts to this format
function convertToFeatures(features){
    return {"type": "FeatureCollection", "features": features};
}

// Tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Calculate the delay for each circle
function calculateDelay(date, startDate){
    var daysSinceStart = (date.getMonth() - startDate.getMonth())*30 - startDate.getDate() + date.getDate();
    //var t = (date.getMonth() * (timelapse_totaltime/12) + date.getDate() * ((timelapse_totaltime/12)/30))*1000;
    var t = daysSinceStart * dayDelay * 1000;
    return t;
}

// stop time lapse
function stop(){
    g.selectAll("circle").transition();
    g.selectAll("circle").remove();
    clearInterval(noteInterval);
    clearInterval(dayInterval);
    timeline.ticker.select("line.tickerline").transition();
    timeline.ticker.select("line.tickerline").remove();
    $("#day").html("");
}


// Filter data based on checkboxes
function filterCheckboxes(){
    filterCountryCriteria = [];
    filterConflictCriteria = [];
    // Push user criteria into one array
    $("#checkbox_countries :checked").each(function(){
        filterCountryCriteria.push($(this).val());
    });
    $("#checkbox_conflicts :checked").each(function(){
        filterConflictCriteria.push($(this).val());
    });

    return (filterCountryCriteria.length == 0) ?
        (filterConflictCriteria.length == 0 ? cleanedDataFeatures: cleanedDataFeatures.filter(function(d){
            return filterConflictCriteria.indexOf(d.properties.conflict_type) != -1;
        }))
        : filterConflictCriteria.length== 0 ? (cleanedDataFeatures.filter(function(d){
        return filterCountryCriteria.indexOf(d.properties.country) != -1;
    })):cleanedDataFeatures.filter(function(d){
        return filterCountryCriteria.indexOf(d.properties.country) != -1 && filterConflictCriteria.indexOf(d.properties.conflict_type) != -1;
    });
}


// Play timelapse
function addlocations(filteredCities, startDate){
    // Remove current circles and notes
    g.selectAll("circle").remove();
    svg2.selectAll("text.notes").remove();

    // Don't filter if no criteria was set
    //var filteredCities = convertToFeatures(
    //    // Filter depending on user selection
    //    filterCheckboxes()
    //);

    // Scale used for radius of circle
    fatalitiesScale.range([15, 100]);

    // Add circles
    var locations = g.selectAll("circle")
        .data(filteredCities.features)
        .enter()
        .append("circle")
        .style("opacity", 0.0)
        .attr("fill", "transparent");
        locations.transition()
            .delay(function (d) {
                //return speed*d.properties.t;
                return calculateDelay(d.properties.date, startDate);
            })
            .attr("fill", function(d){
                return c20(d.properties.conflict_type);
            })
            .style("opacity", 0.7)
            .attr("class", "points")
            .attr("r", 1)
            .transition()
            .style("opacity",0.0)
            .attr("r", function(d){
                return fatalitiesScale(d.properties.fatalities);
            })
            .duration(1500)
            .transition()
            .style("opacity", 0.7)
            .attr("r", 1)
            .duration(0)
            ;


    secondsPassed = 0;
    dayNumber = startDate.getMonth()*30 + startDate.getDate();

    // Display running day count
    dayInterval = window.setInterval(function(){
        if(dayNumber > 365){
            clearInterval(dayInterval);
            return;
        }
       $("#day").html(dayNumber);
        dayNumber += 1;
    }, dayDelay * 1000);

    // Running notes at intervals
    notesPassed = 0;
    $("#note").html('" ' + notes[notesPassed] + ' "').fadeIn(noteFadeIn*1000);
    $("#note").html('" ' + notes[notesPassed] + ' "').fadeOut(noteFadeOut*1000);
    noteInterval = window.setInterval(function(){

        if(notesPassed > notes.length){
            clearInterval(noteInterval);
            return;
        }
        notesPassed += 1;
        $("#note").html('" ' + notes[notesPassed] + ' "').fadeIn(noteFadeIn*1000);
        $("#note").html('" ' + notes[notesPassed] + ' "').fadeOut(noteFadeOut*1000);
    }, notesDelay * 1000);

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

// Update time lapse with slider
function slideUpdateTimelapse(month){
    // stop time lapse
    g.selectAll("circle").transition();
    g.selectAll("circle").remove();
    // stop day count and note
    clearInterval(dayInterval);
    clearInterval(noteInterval);

    // Filter depending on user selection
    var filteredCities = convertToFeatures(
        filterCheckboxes().filter(function(d){
            return d.properties.date.getMonth()+1 == month;
        })
    );

    fatalitiesScale.range([2,70]);
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
        .attr("r", function(d){
            return fatalitiesScale(d.properties.fatalities);
        })
        ;

    reset();
    map.on("viewreset", reset);

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
        orientation: "vertical",
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
            //var el = $('<label>' + months_dict[i + 1] + '</label>').css('top', (i/vals*100) + '%');
            var el = $('<label>' + months_dict[i + 1] + '</label>').css(
                {
                    top: (i/vals*100)-8 + '%',
                    right: -30
                }
            );

            // Add the element inside #slider
            $("#slider").append(el);

        }

    });

function createTimeline(data){
    timeline = new Timeline("timeline", data);
};

function brushed() {

    // TO-DO: React to 'brushed' event
    //areachart.x.domain(
    //    timeline.brush.empty() ?  timeline.x.domain(): timeline.brush.extent()
    //);
    //areachart.wrangleData();
    //console.log(timeline.brush.empty() ?  timeline.x.domain(): timeline.brush.extent());
}
