'use strict';

//dts
import {IAtConfig} from 'suman-types/dts/at-config';

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

//core
import util = require('util');
import path = require('path');

//project
const _suman = global.__suman = (global.__suman || {});

export interface IFindConfig {
  'config': IAtConfig,
  'runPath': string
}

////////////////////////////////////////////////////

export const findPathOfRunDotSh = function (p: string) : string {
  
  if(String(p).match(/\/@target\//)){
    return null;
  }
  
  const root = _suman.projectRoot;
  const ln = root.length;
  
  while (p.length >= ln) {
    
    let dirname = path.dirname(p);
    let map = _suman.markersMap[dirname];
    if (map && map['@run.sh']) {
      return path.resolve(dirname, '@run.sh');
    }
    
    if (map && map['@config.json']) {
      
      try{
        let config = require(path.resolve(dirname, '@config.json'));
        let v;
        if(v = config['@run']){
          if(v.prevent){
            // user has decided to prevent any transform for this file
            return null;
          }
          if(v.plugin && v.plugin.value){
            let plugin = require(v.plugin.value);
            return plugin.getRunPath();
          }
          else if(v.plugin){
            throw new Error('"plugin" should be an object with a "value" property.')
          }
        }
      }
      catch(err){
        _suman.log.warning('Your @config.json file may be malformed at path: ', dirname);
        _suman.log.error(err.message || err);
      }
    }
    
    p = path.resolve(p + '/../')
    
  }
  
  // explicit for your pleasure
  return null;
};


export const findPathAndConfigOfRunDotSh = function (p: string): IFindConfig {
  
  const ret = <IFindConfig>{
    'config': null,
    'runPath': null
  };
  
  
  const root = _suman.projectRoot;
  const ln = root.length;
  
  while (p.length >= ln) {
    
    let dirname = path.dirname(p);
    let map = _suman.markersMap[dirname];
    
    if (map && map['@config.json']) {
      
      try {
        let v, config = require(path.resolve(dirname, '@config.json'));
        if (v = config['@run']) {
          if (v.prevent) {
            // user has decided to prevent running these files
            _suman.log.warning('File with the following path was prevented from running with a setting in @config.json.');
            _suman.log.warning(p);
          }
          if (v.plugin && v.plugin.value) {
            let plugin = require(v.plugin.value);
            ret.runPath =  plugin.getRunPath();
          }
          else if (v.plugin) {
            throw new Error('"plugin" should be an object with a "value" property.')
          }
        }
      }
      catch (err) {
        _suman.log.warning('Your @config.json file may be malformed at path: ', dirname);
        _suman.log.error(err.message || err);
      }
    }
    
    p = path.resolve(p + '/../')
    
  }
  
  // explicit for your pleasure
  return ret;
};

export const findPathOfTransformDotSh = function (p: string): string | null {
  
  if (String(p).match(/\/@target\//)) {
    return null;
  }
  
  const root = _suman.projectRoot;
  const ln = root.length;
  
  while (p.length >= ln) {
    
    let dirname = path.dirname(p);
    let map = _suman.markersMap[dirname];
    if (map && map['@transform.sh']) {
      return path.resolve(dirname, '@transform.sh');
    }
    
    // @transform.sh file takes precedence over @config.json file in same dir
    if (map && map['@config.json']) {
      
      try {
        let v, config = require(path.resolve(dirname, '@config.json'));
        if (v = config['@transform']) {
          if (v.prevent) {
            // user has decided to prevent any transform for this file
            return null;
          }
          if (v.plugin && v.plugin.value) {
            let plugin = require(v.plugin.value);
            return plugin.getTransformPath();
          }
          else if (v.plugin) {
            throw new Error('"plugin" should be an object with a "value" property.')
          }
        }
      }
      catch (err) {
        _suman.log.warning('Your @config.json file may be malformed at path: ', dirname);
        _suman.log.error(err.message || err);
      }
    }
    
    p = path.resolve(p + '/../')
    
  }
  
  // explicit for your pleasure
  return null;
  
};

