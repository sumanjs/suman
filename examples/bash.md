```
function test_temporal_filter(){
        # manually set date to 23:30 04/06/2016
        date 233004062016;
        # run mocha enrichment tests
        mocha test_temporal_filter.js
        # use ntp to reset the date
        ntpdate us.pool.ntp.org
}

function test_enrichment(){
        mocha test/integration/testEnrichment.js
}

function test_some_other_scenario(){
        suman test/whatever/*.js
}

test_temoral_filter();
test_enrichment();
test_some_other_scenario();
```