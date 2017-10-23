/// <reference types="node" />
import { ISumanOpts } from 'suman-types/dts/global';
import EventEmitter = NodeJS.EventEmitter;
import { IRet } from 'suman-types/dts/reporters';
declare const _default: (s: EventEmitter, sumanOpts: ISumanOpts, expectations: Object) => IRet;
export default _default;
