'use strict';

import {IGlobalSumanObj} from "../../dts/global";

//project
const _suman: IGlobalSumanObj = global.__suman = (global.__suman || {});


_suman.log = _suman.log || console.log.bind(console,' => [suman] => ');


_suman.logError = _suman.logError || console.error.bind(console,' => [suman] => ');
