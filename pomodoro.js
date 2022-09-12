var byId = document.getElementById.bind(document);

function updateTime() {
    var
        time = new Date(),
        // take 1800 seconds (30 minutes) and substract the remaining minutes and seconds
        // 30 minutes mark is rest of (+30 divided by 60); *60 in seconds; substract both, mins & secs
        secsRemaining = 3600 - (time.getUTCMinutes() + 30) % 60 * 60 - time.getUTCSeconds(),
        // integer division
        mins = Math.floor(secsRemaining / 60),
        secs = secsRemaining % 60;
    //byId('min-total').textContent = secsRemaining;
    byId('min-part').textContent = mins;
    byId('sec-part').textContent = secs;

    // let's be sophisticated and get a fresh time object
    // to calculate the next seconds shift of the clock
    setTimeout(updateTime, 1000 - (new Date()).getUTCMilliseconds());
}
updateTime();