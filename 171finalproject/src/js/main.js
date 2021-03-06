/* References
 * http://stackoverflow.com/questions/10224856/jquery-ui-slider-labels-under-slider
 * http://bl.ocks.org/jhubley/68423588d4b15bea5236
 * http://alignedleft.com/tutorials/d3
 * http://stackoverflow.com/questions/2015667/how-do-i-set-span-background-color-so-it-colors-the-background-throughout-the-li
 * http://www.w3schools.com/
 * https://www.dashingd3js.com/table-of-contents
 */

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
var barchart;

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
var global_collection;
// appending the SVG to the Leaflet map pane
// g (group) element will be inside the svg
var svg = d3.select(map.getPanes().overlayPane).append("svg");
var g = svg.append("g").attr("class", "leaflet-zoom-hide");
var transform = d3.geo.transform({point: projectPoint});
var d3path = d3.geo.path().projection(transform);

// Overlay region svg onto map
d3.json("subregion_South-Eastern_Asia_subunits.json", function(error, collection){
    if(error){
        console.log(error);
    }
//    d3.json("subregion_South-Eastern_Asia_subunits.json", function(error2, collection2){
//        if(error2){
//            console.log(error2);
//        }
//        collection.features = collection.features.concat(collection2.features);
        console.log(collection);
        var feature = g.selectAll("path")
            .data(collection.features)
            .enter()
            .append("path")
            .attr("value", function(d){
                return d.properties.name_long.toLowerCase();
            })
            .attr("class", "country_path")
            .on("click", function(d){
                $(this).toggleClass("country_clicked");
                barchart.updateVisualization();
            });

        // Set a random country to selected to show user you can select countries

        $($(".country_path")[2]).toggleClass("country_clicked");
        $($(".country_path")[1]).toggleClass("country_clicked");
        $($(".country_path")[0]).toggleClass("country_clicked");
        global_collection = collection;
        reset();
        map.on("viewreset", reset);

        function reset() {
            var bounds = d3path.bounds(collection), topLeft = bounds[0], bottomRight = bounds[1];

            // Setting the size and location of the overall SVG container
            svg
                .attr("width", bottomRight[0] - topLeft[0] + 520)
                .attr("height", bottomRight[1] - topLeft[1] + 120)
                .style("left", topLeft[0] - 50 + "px")
                .style("top", topLeft[1] - 50 + "px");

            g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");

            feature.attr("d", d3path);
        }
 //   })


});

//function reset() {
//    var bounds = d3path.bounds(global_collection), topLeft = bounds[0], bottomRight = bounds[1];
//
//    // Setting the size and location of the overall SVG container
//    svg
//        .attr("width", bottomRight[0] - topLeft[0] + 520)
//        .attr("height", bottomRight[1] - topLeft[1] + 120)
//        .style("left", topLeft[0] - 50 + "px")
//        .style("top", topLeft[1] - 50 + "px");
//
//    g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");
//
//    feature.attr("d", d3path);
//}


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
        console.log(conflictTypes);
        c20.domain(conflictTypes).range(["#000000", "#FFFF00", "#B21018", "#fff8dc", "orange", "green", "#0000A6", "#1CE6FF"]);
            //["#e7969c", "#6baed6", "#98df8a", "#ffbb78", "#c5b0d5", "#f7b6d2", "#bcbd22", "#9edae5"]);
            //


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

        $("#checkAll").click(function(){
            $(".check").prop('checked', $(this).prop('checked'));
        });
        $(".check").prop('checked', true);
        $(".check").click(function(){
           barchart.updateVisualization();
        });

        cleanedData = allData;

        // Create stacked barchart
        createBarchart(cleanedData);


        cleanedData.forEach(function(d){
            if(d.EVENT_DATE.getTime() in dayConflictDict){
                dayConflictDict[d.EVENT_DATE.getTime()] += 1;
            }else{
                dayConflictDict[d.EVENT_DATE.getTime()] = 1;
            }
        });

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
                        "properties": {"country": d.COUNTRY.toLowerCase(),
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

// play time lapse from beginning
function play(){
    // Filter by checkbox
    var filteredFeatures = filterCheckboxes(cleanedDataFeatures);
    if(filteredFeatures.length == 0){
        alert("Select at least one feature");
        return;
    }
    // Filter by country
    filteredFeatures = filterCountry(filteredFeatures);
    if(filteredFeatures.length == 0){
        alert("Select at least one country");
        return;
    }
    var filteredCities = convertToFeatures(
        filteredFeatures
    );

    stop();
    var firstDay = new Date("January 1, 2015");
    // Time lapse on map
    addlocations(filteredCities, firstDay);
    timeline.moveTicker(firstDay);
}
// stop time lapse
function stop(){
    g.selectAll("circle").transition();
    g.selectAll("circle").remove();
    clearInterval(noteInterval);
    clearInterval(dayInterval);
    timeline.ticker.select("line.tickerline").transition();
    timeline.ticker.select("line.tickerline").remove();
    $("#day").empty();
    $("#note").empty();
}


// Filter data based on checkboxes
function filterCheckboxes(filteredFeatures){
    var selectedConflictTypes = [];
    // Get selected conflict types
    $("input[name='conflictTypes']:checked").each(function(){
        selectedConflictTypes.push($(this).val());
    });

    // Filter based on conflict type from checkboxes
    filteredFeatures = filteredFeatures.filter(function(x){
        return selectedConflictTypes.indexOf(x.properties.conflict_type) != -1;
    });
    return filteredFeatures;
}

function filterCountry(filteredFeatures){
    var selectedCountryTypes = [];

    $(".country_clicked").each(function(){
        selectedCountryTypes.push($(this).attr('value'));
    });


    // Filter based on conflict type from checkboxes
    filteredFeatures = filteredFeatures.filter(function(x){
        return selectedCountryTypes.indexOf(x.properties.country) != -1;
    });
    return filteredFeatures;
}


// Play timelapse
function addlocations(filteredCities, startDate){
    // Remove current circles and notes
    //g.selectAll("circle").remove();
    //stop();
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
        var bounds = d3path.bounds(global_collection), topLeft = bounds[0], bottomRight = bounds[1];

        // Setting the size and location of the overall SVG container
        //svg
        //    .attr("width", bottomRight[0] - topLeft[0] + 520)
        //    .attr("height", bottomRight[1] - topLeft[1] + 120)
        //    .style("left", topLeft[0] - 50 + "px")
        //    .style("top", topLeft[1] - 50 + "px");
        //
        //g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");

        svg
            .attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        g.attr("transform", "translate(" + (-topLeft[0]) + "," + (-topLeft[1]) + ")");

        locations.attr("transform",
            function(d) {
                return "translate(" +
                    applyLatLngToLayer(d).x + "," +
                    applyLatLngToLayer(d).y + ")";
            });
    }



}

function createLinechart(data){
    linechart = new Linechart("line-chart-1", data);
}

function createTimeline(data){
    timeline = new Timeline("timeline", data);
};

function createBarchart(data){
    barchart = new Barchart("barchart", data);
    $("#y-type").change(function(){
        barchart.updateVisualization();
    });
};

$.fn.scrollView = function () {
    return this.each(function () {
        $('html, body').animate({
            scrollTop: $(this).offset().top-50
        }, 1000);
    });
}
$(window).load(function(){
    //$('#myModal').modal('show');
});
$("#myModalCloseButton").on("click", function(){
    $('#startHere').scrollView();
});
function brushed() {

    if(!timeline.brush.empty()) {

        stop();
        // Filter depending on brush
        var tmp = cleanedDataFeatures.filter(function (d) {
            return d.properties.date >= timeline.brush.extent()[0] && d.properties.date <= timeline.brush.extent()[1];
        });

        // Filter by checkbox
        tmp = filterCheckboxes(tmp);

        // Filter by country selected
        tmp = filterCountry(tmp);
        console.log("TMP!");
        console.log(tmp);
        var filteredCities = convertToFeatures(
            //Filter based on checkboxes
            tmp
        );

        if(filteredCities.features.length == 0){
            return;
        }
        fatalitiesScale.range([2,70]);
        //// Add circles

        var locations = g.selectAll("circle")
            .data(filteredCities.features)
            .enter()
            .append("circle")
            .attr("fill", function (d) {
                return c20(d.properties.conflict_type);
            })
            .style("opacity", 0.4)
            .attr("class", "points")
            .attr("r", function (d) {
                return fatalitiesScale(d.properties.fatalities);
            })
            ;

        reset();
        map.on("viewreset", reset);

        function reset() {

            var bounds = d3path.bounds(global_collection), topLeft = bounds[0], bottomRight = bounds[1];

            // Setting the size and location of the overall SVG container
            svg
                .attr("width", bottomRight[0] - topLeft[0] + 120)
                .attr("height", bottomRight[1] - topLeft[1] + 120)
                .style("left", topLeft[0] - 50 + "px")
                .style("top", topLeft[1] - 50 + "px");

            g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");

            locations.attr("transform",
                function (d) {
                    return "translate(" +
                        applyLatLngToLayer(d).x + "," +
                        applyLatLngToLayer(d).y + ")";
                });
        }
    }
}
