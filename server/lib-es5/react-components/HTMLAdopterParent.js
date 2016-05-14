"use strict";

/**
 * Created by denmanm1 on 3/30/16.
 */

var React = require('react');

module.exports = function (children) {

    return React.createClass({

        renderChildren: function renderChildren() {

            return children.map(function (item) {

                var Comp = item.comp;
                var props = item.props;

                return React.createElement(
                    "div",
                    null,
                    React.createElement(Comp, props)
                );
            });
        },

        render: function render() {

            return React.createElement(
                "html",
                { lang: "en" },
                React.createElement(
                    "head",
                    null,
                    React.createElement("meta", { charSet: "UTF-8" }),
                    React.createElement(
                        "title",
                        null,
                        "Title"
                    )
                ),
                React.createElement(
                    "body",
                    null,
                    React.createElement(
                        "div",
                        null,
                        this.renderChildren()
                    )
                )
            );
        }

    });
};