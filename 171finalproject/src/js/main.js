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
var linechart;

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
}).setView([20.5937, 78.9629], 4);//19.89072, 90.7470
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

//L.tileLayer('http://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
//    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//}).addTo(map);

var accessToken = 'pk.eyJ1IjoicWlrZXZpbmprdyIsImEiOiJjaW5idXkxZXgwbngzdjhrdnZoNmJseXUxIn0.W629lItHk7qOvhFkqR5vqw';
var mapType = "qikevinjkw.pon119c5";//qikevinjkw.pon1d56a
L.tileLayer('https://api.mapbox.com/v4/'+mapType+'/{z}/{x}/{y}.png?access_token=' +
    accessToken, { attribution: '© <a href="https://www.mapbox.com/map-feedback/">' +
'Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);

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

        c20.domain(conflictTypes).range(["#000000", "#FFFF00", "#B21018", "#fff8dc",
            "orange", "green", "#0000A6", "#1CE6FF"]);

        // Add legend to right panel
        for(var i=0;i<conflictTypes.length;i++){
            if(i == 0){
                $("#legend").append("<label><input type='checkbox' class='check' id='checkAll'>&nbsp;&nbsp;&nbsp;" +"All");
            }
            $("#legend").append("<label><input type='checkbox' name='conflictTypes' class='check' value='"+ conflictTypes[i] +"'>&nbsp;&nbsp;&nbsp;" +
                conflictTypes[i] +"&nbsp;&nbsp;<span class='squared' style='position: absolute;right: 20px; background:" +
                    c20(conflictTypes[i]) + "'>&nbsp;</span>" +
                "</label>");
        }

        cleanedData = allData;

        cleanedData.forEach(function(d){
            if(d.EVENT_DATE.getTime() in dayConflictDict){
                dayConflictDict[d.EVENT_DATE.getTime()] += 1;
            }else{
                dayConflictDict[d.EVENT_DATE.getTime()] = 1;
            }
        });

        createTimeline(dayConflictDict);
        //createLinechart(cleanedData);

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
$("#checkAll").click(function(){
    $(".check").prop('checked', $(this).prop('checked'));
});
$(".check").prop('checked', true);

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
    $("#note").html("");
}


// Filter data based on checkboxes
function filterCheckboxes(){
    filterCountryCriteria = [];
    filterConflictCriteria = [];
    // Push user criteria into one array
    //$("#checkbox_countries :checked").each(function(){
    //    filterCountryCriteria.push($(this).val());
    //});
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
    //g.selectAll("circle").remove();
    stop();
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

    // Running notes at intervals
    notesPassed = 0;
    $("#note").html('" ' + notes[notesPassed] + ' "').fadeIn(noteFadeIn*1000);
    $("#note").html('" ' + notes[notesPassed] + ' "').fadeOut(noteFadeOut*1000);
    noteInterval = window.setInterval(function(){
        notesPassed += 1;
        $("#note").html('" ' + notes[notesPassed] + ' "').fadeIn(noteFadeIn*1000);
        $("#note").html('" ' + notes[notesPassed] + ' "').fadeOut(noteFadeOut*1000);
    }, notesDelay * 1000);

    // Display running day count
    secondsPassed = 0;
    dayNumber = startDate.getMonth()*30 + startDate.getDate();
    dayInterval = window.setInterval(function(){
        if(dayNumber > 365){
            clearInterval(dayInterval);
            clearInterval(noteInterval);
            return;
        }
        $("#day").html('Day '+dayNumber);
        dayNumber += 1;
    }, dayDelay * 1000);

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

function createLinechart(data){
    linechart = new Linechart("line-chart-1", data);
}

function createTimeline(data){
    timeline = new Timeline("timeline", data);
};

$.fn.scrollView = function () {
    return this.each(function () {
        $('html, body').animate({
            scrollTop: $(this).offset().top-50
        }, 1000);
    });
}
$(window).load(function(){
    $('#myModal').modal('show');
});
$("#myModalCloseButton").on("click", function(){
    $('#startHere').scrollView();
});
function brushed() {

    // TO-DO: React to 'brushed' event
    //areachart.x.domain(
    //    timeline.brush.empty() ?  timeline.x.domain(): timeline.brush.extent()
    //);
    //areachart.wrangleData();
    //console.log(timeline.brush.empty() ?  timeline.x.domain(): timeline.brush.extent());
}
