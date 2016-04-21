/**
 * Created by denmanm1 on 3/31/16.
 */



define(['react', 'react-dom'], function (React, ReactDOM) {


    return function (Parent, parentProps, Child, childDataArray, documentId) {


        const children = childDataArray.map(function (props) {

            return (
                <Child {...props} />
            )

        });

        ReactDOM.render(
            <Parent {...parentProps}>
                {children}
            </Parent>, document.getElementById(documentId));

    }


});