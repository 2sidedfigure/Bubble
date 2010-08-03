(function($) {
    //define all the necessary defaults
    var _defaults = {
        content: null,
        cancelDefault: true,
        showEvent: 'mouseover',
        hideEvent: 'mouseout',

        //callbacks
        onShow: null,
        onHide: null,

        //transistions
        showTransition: null,
        hideTransition: null,

        //markup defaults
        markup: '<div></div>',
        bubbleClass: 'jqBbl',
        appendElement: 'body',
        addClass: null,

        //positioning
        position: { x: 'r', y: 'b' }, //user should specify like css, i.e. 'right bottom'
        preventOffScreen: false,
        positionClasses: { //position classes
            top: 'top',
            right: 'right',
            bottom: 'bottom',
            left: 'left',
            vCenter: 'vCenter',
            vCenterTop: 'vCenterTop',
            vCenterBottom: 'vCenterBottom',
            hCenter: 'hCenter',
            hCenterLeft: 'hCenterLeft',
            hCenterRight: 'hCenterRight'
        },
        positionAdjust: { //how to adjust the bubble position when preventOffScreen == true; user should specify like css
            t: { y: 'b' }, // '? bottom'
            r: { x: 'l' }, // 'left ?'
            b: { y: 't' }, // '? top'
            l: { x: 'r' }  // 'right ?'
        },

        //bind-once features
        bindElement: 'body',
        eventNamespace: 'jqBbl'
    };

    //allowed position values (normalized)
    //  because single/double letters are easier to handle (e.g. spelling errors)
    var availablePositionValues = {
        center: /^(c|m)$/,
        x: /^(l|cl|c|cr|r)$/,
        y: /^(t|ct|c|cb|b)$/
    };

    //retrieve the second piece of the position
    function getSubPosition(str) {
        var subpos = '';

        if (str.indexOf('-') > -1) {
            var split = str.split('-');
            subpos = split[1].charAt(0).toLowerCase();
        }

        return subpos;
    }

    //get a position object
    function getPositionObject(position) {
        //split into x and y components
        var pos = position.split(" ");

        var x = pos[0].charAt(0).toLowerCase();
        //normalize the value and get the subposition
        if (availablePositionValues.center.test(x))
            x = 'c' + getSubPosition(pos[0]);

        var y = pos[1].charAt(0).toLowerCase();
        //normalize the value and get the subposition
        if (availablePositionValues.center.test(y))
            y = 'c' + getSubPosition(pos[1]);

        var obj = {};

        if (availablePositionValues.x.test(x))
            obj.x = x;

        if (availablePositionValues.y.test(y))
            obj.y = y;

        return obj;
    }

    //calculate the position of the bubble
    function calculatePosition(bbl, target, options) {
        var css = {};

        //find target element's sides relative to the document
        var pos = {};
        pos.t = target.offset().top;
        pos.l = target.offset().left;
        pos.b = pos.t + target.outerHeight();
        pos.r = pos.l + target.outerWidth();

        //strip all position classes
        var stripClasses = '';
        for (var p in options.positionClasses) {
            stripClasses += options.positionClasses[p] + ' ';
        }
        bbl.removeClass(stripClasses);

        //vertical position
        switch (options.position.y) {
            case 't': //align to top of target
                css.top = pos.t - bbl.outerHeight();
                bbl.addClass(options.positionClasses.top);
                break;
            case 'ct': // align top of bubble to top of target
                css.top = pos.t;
                bbl.addClass(options.positionClasses.vCenterTop);
                break;
            case 'c': //align to center of target
                css.top = pos.t + ((pos.b - pos.t)/2) - (bbl.outerHeight()/2);
                bbl.addClass(options.positionClasses.vCenter);
                break;
            case 'cb': //align bottom of bubble to bottom of target
                css.top = pos.b - bbl.outerHeight();
                bbl.addClass(options.positionClasses.vCenterBottom);
                break;
            case 'b': //align to bottom of target
            default:
                css.top = pos.b;
                bbl.addClass(options.positionClasses.bottom);
                break;
        }

        //horizontal position
        switch (options.position.x) {
            case 'l': //align to left of target
                css.left = pos.l - bbl.outerWidth();
                bbl.addClass(options.positionClasses.left);
                break;
            case 'cl': //align left of bubble to left of target
                css.left = pos.l;
                bbl.addClass(options.positionClasses.hCenterLeft);
                break;
            case 'c': //align to center of target
                css.left = pos.l + ((pos.r - pos.l)/2) - (bbl.outerWidth()/2);
                bbl.addClass(options.positionClasses.hCenter);
                break;
            case 'cr': //align right of bubble to right of target
                css.left = pos.r - bbl.outerWidth();
                bbl.addClass(options.positionClasses.hCenterRight);
                break;
            case 'r': //align to right of target
            default:
                css.left = pos.r;
                bbl.addClass(options.positionClasses.right);
                break;
        }

        return css;
    }

    //find any edges of the bubble outside the viewport
    function getOffScreenEdges(viewport, bbl) {
        var out = [];

        for (var edge in viewport) {
            if (edge == 't' || edge == 'l') {
                if (viewport[edge] > bbl[edge])
                    out.push(edge);
            } else {
                if (bbl[edge] > viewport[edge])
                    out.push(edge);
            }
        }

        return out.length > 0 ? out : false;
    }

    //adjust the position of the bubble
    function adjustPosition(bbl, target, options, css) {
        var w = $(window);

        //viewport
        var vp = {};
        vp.t = w.scrollTop();
        vp.l = w.scrollLeft();
        vp.b = vp.t + w.height();
        vp.r = vp.l + w.width();

        //bubble dimensions
        var eDim = {};
        eDim.t = css.top;
        eDim.l = css.left;
        eDim.b = eDim.t + bbl.outerHeight(true);
        eDim.r = eDim.l + bbl.outerWidth(true);

        //overlapping edges
        var edge = getOffScreenEdges(vp, eDim);

        if (edge === false)
            return css;

        //merge the adjustments into a new position
        var newpos = {};
        for (var e in edge) {
            console.log(options.positionAdjust[edge[e]]);
            newpos = $.extend(newpos, options.positionAdjust[edge[e]]);
        }

        console.log(newpos);
        var newopts = $.extend(true, {}, options, {position: newpos});

        return calculatePosition(bbl, target, newopts);
    }

    //implement bind-once behind the scenes so the user can blindly bind to selected elements
    function init(argObj, selector, context) {
        var mergeObj = argObj || {};

        //convert the human-friendly position string to something easier to work with
        if (argObj && argObj.position)
            mergeObj.position = getPositionObject(argObj.position);

        //convert the human-friendlt positionAdjust strings to something easier to work with
        if (argObj && argObj.positionAdjust) {
            var posAdjust = {};
            for (var p in argObj.positionAdjust) {
                posAdjust[p] = getPositionObject(argObj.positionAdjust[p]);
            }
            mergeObj.positionAdjust = posAdjust;
        }

        var options = $.extend(true, {}, _defaults, mergeObj);
        //var context = this.context;
        //var selector = this.selector;
        var bbl;

        var be = $(options.bindElement);

        //always need a show event
        be.bind(options.showEvent + '.' + options.eventNamespace, function(e) {
            var origTarget = $(e.target);
            var target = origTarget.closest(selector);

            if (target.length > 0) {
                //create (if necessary)
                if (!bbl) {
                    //use transparency to hide so width and height can still be calculated
                    bbl = $(options.markup).addClass(options.bubbleClass).fadeTo(0, 0);

                    //make sure we get accurate size readings of the bubble when positioning
                    bbl.css({ position: 'absolute', top: 0, left: 0 });

                    if (options.addClass)
                        bbl.addClass(options.addClass);

                    //these need to be defined here so bbl gets scoped properly
                    var cleanup = function() {
                        bbl.remove();
                        bbl = null;
                    };

                    var hide = function() {
                        if (options.hideTransition) {
                            //not sure how this will work yet
                            //options.hideTransition
                        } else {
                            bbl.fadeOut(300, queueAdvance);
                        }

                        //call the hide callback
                        if (options.onHide)
                            options.onHide(bbl, target); //keep this scoped to the assigning object, pass the bubble as an argument
                    };

                    var show = function() {
                        if (options.showTransition) {
                            //not sure how this will work yet
                            //options.showTransition
                        } else {
                            bbl.stop(true)
                               .queue(options.eventNamespace, [])
                               .fadeTo(0, 0)
                               .show()
                               .fadeTo(300, 1, queueAdvance);
                        }

                        //call the show callback
                        if (options.onShow)
                            options.onShow(bbl, target); //keep this scoped to the assigning object, pass the bubble as an argument
                    }

                    var destroy = function() {
                        bbl.queue(options.eventNamespace, function() {
                            $(this).trigger('hide');
                        }).queue(options.eventNamespace, function() {
                            $(this).trigger('cleanup')
                                   .trigger('queueAdvance');
                        }).trigger('queueAdvance');
                    };

                    var queueAdvance = function() {
                        if (bbl)
                            bbl.dequeue(options.eventNamespace);
                    };

                    bbl.bind('cleanup', cleanup);
                    bbl.bind('hide', hide);
                    bbl.bind('show', show);
                    bbl.bind('destroy', destroy);
                    bbl.bind('queueAdvance', queueAdvance);

                    //render the element
                    $(options.appendElement).append(bbl);
                } else {
                    //clear the queue
                    bbl.queue(options.eventNamespace, []);
                }

                //fill with content
                //currently only support function-based content as it's most flexible
                if (options.content) {
                    options.content.call(bbl, target, options);
                } else {
                    bbl.html(target.clone(true));
                }

                //get position
                var css = calculatePosition(bbl, target, options);

                //adjust position if called for and necessary
                if (options.preventOffScreen)
                    css = adjustPosition(bbl, target, options, css);

                bbl.css(css);

                //show
                bbl.trigger('show');
            }
        });

        //may not always need/want/have a hide event
        if (options.hideEvent) {
            be.bind(options.hideEvent + '.' + options.eventNamespace, function(e) {
                var origTarget = $(e.target);
                var target = origTarget.closest(selector);

                if (target.length > 0) {
                    //hide bubble
                    bbl.trigger('destroy');
                }
            });
        }
    }

    $.fn.bubble = function(argObj) {
        init(argObj, this.selector, this.context);
    };

    $.bubble = function(selector, argObj) {
        init(argObj, selector, document);
    };
})(jQuery);
