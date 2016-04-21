/**
 * Created by denmanm1 on 3/31/16.
 */

define(['react', 'react-dom'], function (React, ReactDOM) {

    return function (Parent, parentProps, Child, childDataArray, documentId) {

        const children = childDataArray.map(function (props) {

            return React.createElement(Child, props);
        });

        ReactDOM.render(React.createElement(
            Parent,
            parentProps,
            children
        ), document.getElementById(documentId));
    };
});