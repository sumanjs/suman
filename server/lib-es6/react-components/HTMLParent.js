/**
 * Created by denmanm1 on 3/30/16.
 */



const React = require('react');

const TestFileSuite = require('./TestFileSuite');


module.exports = React.createClass({
    
    
   render: function(){

      return (

          <html lang="en">
          <head>
              <meta charset="UTF-8"></meta>
                  <title>Title</title>
          </head>
          <body>

              <div>
                  <TestFileSuite items={this.props.items}/>
              </div>

          </body>
          </html>

      )

   } 

});