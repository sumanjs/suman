const util = require('util');
const F = require('frankenstop').default;

const AtConfigDotJSON = F.bestow(function (obj, isPreValidate) {
  
  Object.keys(obj).forEach(k => {
    this[k] = obj[k];
  });
  
  //this may throw an error, for purposes of failing-fast for devs
  F.call(this, isPreValidate);
});

AtConfigDotJSON.getSchema = function getDuckSchema() {
  
  return Object.freeze({
    
    prevalidateAllFields: true,
    allowExtraneousProperties: false,
    
    properties: {
      
      '@run': {
        type: 'object',
        required: true,
        properties: {
          plugin: {
            type: 'object',
            required: false,
            properties: {
              location: {
                type: 'string'
              },
              value: {
                type: 'string'
              }
            }
          },
          env: {
            required: false,
            type: 'object',
            values: {
              type: 'string'
            }
          }
        }
      },
      
      '@transform': {
        type: 'object',
        required: false,
        properties: {
          plugin: {
            type: 'object',
            required: false,
            properties: {
              location: {
                type: 'string'
              },
              value: {
                type: 'string'
              }
            }
          },
          env: {
            required: false,
            type: 'object',
            values: {
              type: 'string'
            }
          }
        }
      },
      
    }
  })
  
};

F.validateFrankenstopSchema(AtConfigDotJSON);
module.exports = AtConfigDotJSON;
