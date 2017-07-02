
// *************************************************************************************************************************
// this file allows you to create constaints for the Suman test runner
// it allows you to prevent two particular processes from running at the same time, to prevent unwanted interaction
// ************************************************************************************************************************


exports.default = () => {

  return {

    exclusions: [
      {
        list: [

        ]
      },
      {
        groups:[
          {
            list: [

            ]
          },
          {
            list: [

            ]
          }
        ]
      }



    ]

  }
};
