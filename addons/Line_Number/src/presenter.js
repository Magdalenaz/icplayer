function AddonLine_Number_create() {
    function log(s) {
        console.log(s);
    }

    var presenter = function () {};

    var eventBus; // Modules communication
    var playerController;

    presenter.configuration = {};

    presenter.errorCodes = {
        'MIN01' : 'Min value cannot be empty.',
        'MIN02' : 'Min value must be a number.',
        'MAX01' : 'Max value cannot be empty.',
        'MAX02' : 'Max value must be a number',
        'MIN03' : 'Min value does not fit the separator.',
        'MAX03' : 'Max value does not fit the separator.',
        'MIN/MAX01' : 'Min value cannot be lower than Max value.',
        'RAN01' : 'One or more ranges are invalid.',
        'RAN02' : 'One or more ranges are invalid. Please make sure, that all ranges start/end can be displayed on X axis.',
        'STEP01' : 'The value in Step property is invalid.',
        'STEP02' : 'The value in Step does not fit the separator.',
        'VAL01' : 'One or more X axis values are invalid.',
        'VAL02' : 'One or more X axis do not fit the separator.',
        'OOR01' : 'Can not resolve which range is currently selected.',
        'DSE01' : 'Semicolon is a reserved symbol.'
    };

    presenter.CLICKED_POSITION = {
        START: 1,
        MIDDLE: 2,
        END: 3,
        NONE: 4
    };

    presenter.run = function(view, model) {
        presenter.presenterLogic(view, model, false);
    };

    presenter.createPreview = function (view, model) {
        presenter.presenterLogic(view, model, true);
    };

    presenter.removeZIndexes = function () {
        var selector = '.outer .infinity-left, .outer .infinity-right, .x-axis, .rangeImage, .addon_Line_Number .currentMousePosition, .clickArea, .selectedRange';
        presenter.$view.find(selector).css('z-index', '0');
    };

    presenter.presenterLogic = function (view, model, isPreview) {
        presenter.$view = $(view);
        presenter.$view.disableSelection();
        presenter.configuration = presenter.readConfiguration(model);
        presenter.configuration.isPreview = isPreview;

        if ( presenter.configuration.isError ) {
            return DOMOperationsUtils.showErrorMessage(presenter.$view, presenter.errorCodes, presenter.configuration.errorCode)
        }

        presenter.createSteps();

        if ( !isPreview ) {
            presenter.bindInfinityAreas();
        }

        presenter.drawRanges(presenter.configuration.shouldDrawRanges);

        presenter.configuration.isInitialDraw = false;

        if ( !presenter.configuration.isVisibleByDefault ) {
            presenter.hide();
        }

        if ( isPreview ) {
            // z-index in Editor breaks down properties popups
            presenter.removeZIndexes();
        }
    };

    presenter.bindInfinityAreas = function() {
        var infinityLeft = presenter.$view.find('.infinity-left');
        var infinityRight = presenter.$view.find('.infinity-right');

        infinityLeft.on('touchstart', function (e){
            e.preventDefault();
            presenter.configuration.touchData.lastEvent = e;
        });

        infinityLeft.on('touchend', function (e){
            e.preventDefault();

            if ( presenter.configuration.touchData.lastEvent.type != e.type ) {
                var eventData = event.touches[0] || event.changedTouches[0];
                clickLogic(eventData.target);
            }

        });

        infinityLeft.on('click', function(e) {
            e.preventDefault();
            clickLogic($(e.target));
        });

        infinityRight.on('touchstart', function (e){
            e.preventDefault();
            presenter.configuration.touchData.lastEvent = e;
        });

        infinityRight.on('touchend', function (e){
            e.preventDefault();

            if ( presenter.configuration.touchData.lastEvent.type != e.type ) {
                var eventData = event.touches[0] || event.changedTouches[0];
                clickLogic(eventData.target);
            }
        });

        infinityRight.on('click', function(e) {
            e.preventDefault();
            clickLogic($(e.target));
        });
    };

    function calculateStepWidth(xAxisValues) {
        var xAxisWidth = presenter.$view.find('.x-axis').width();
        return xAxisWidth / (xAxisValues.length);
    }

    function getXAxisValues() {
        var configuration = presenter.configuration,
            xAxisValues = [], i;
        var sorted = [];
        var step = configuration.step;

        for (i = 0; i >= configuration.min; i -= step) {
            xAxisValues.push(i);
        }

        for (i = 0; i <= configuration.max; i += step) {
            xAxisValues.push(i);
        }

        var sorted = xAxisValues.sort( function( a, b ){ return a - b });
        sorted.splice( sorted.indexOf(0), 1 );

        var allRanges = presenter.configuration.otherRanges.concat(presenter.configuration.shouldDrawRanges);

        $.each(allRanges, function() {

            if ( (sorted.indexOf(this.start.value) == -1
                || sorted.indexOf(this.end.value) == -1)
                && ( !isValueInfinity(this.start.value)
                && !isValueInfinity(this.end.value) )) {

                presenter.configuration.isError = true;
                DOMOperationsUtils.showErrorMessage(presenter.$view, presenter.errorCodes, 'RAN02');

                return false;
            }

            return true;
        });

        return sorted;
    }

    function setClickedRanges(e) {
        var ranges = presenter.configuration.drawnRangesData.ranges;
        var value = parseRangeStartOrEnd($(e).attr('value'));
        presenter.configuration.mouseData.clickedRanges = [];

        $.each(ranges, function() {
            if ( $.inArray(value, this.values) >= 0  ) {
                presenter.configuration.mouseData.clickedRanges.push(this);
            }
        });

    }

    function getClickedRangePosition(e) {
        var range = presenter.configuration.mouseData.clickedRanges[0];

        if ( $(e).attr('value') == '-INF' ) {
            return presenter.CLICKED_POSITION.START;
        }

        else if ( $(e).attr('value') == 'INF' ) {
            return presenter.CLICKED_POSITION.END;
        }

        else if (range.start.element[0] == $(e).parent()[0]) {
            return presenter.CLICKED_POSITION.START;
        }

        else if (range.end.element[0] == $(e).parent()[0]) {
            return presenter.CLICKED_POSITION.END;
        }

        else {
            return presenter.CLICKED_POSITION.MIDDLE;
        }
    }

    presenter.removeRange = function(range, removeIncludeImages) {
        var stepLine = range.start.element;
        $(stepLine).find('.selectedRange').remove();
        if (!range.values) { range.values = [] }

        var index = presenter.configuration.drawnRangesData.ranges.indexOf(range);

        if (index >= 0) {
            var removed = presenter.configuration.drawnRangesData.ranges.splice(index, 1);

            if (removeIncludeImages && removed.length > 0) {
                var start = parseElement(removed[0].start.element);
                var end = parseElement(removed[0].end.element);
                $(start).find('.rangeImage').remove();
                $(end).find('.rangeImage').remove();
                $(start).find('.selectedRange').remove();
            }
        }

        $.each(range.values, function() {
            var value = parseRangeStartOrEnd(this);
            var index = presenter.configuration.drawnRangesData.values.indexOf(value);
            presenter.configuration.drawnRangesData.values.splice(index, 1);
        });

    };

    function splitRange(range, e) {
        presenter.removeRange(range, false);
        var clickedArea = $(e);

        var firstRange = {
            'start' : range.start,
            'end' : createRangeElement(clickedArea, clickedArea.attr('value'), false)
        };

        var secondRange = {
            'start' : firstRange.end,
            'end' : range.end
        };

        presenter.drawRanges([firstRange, secondRange]);
    }

    function joinRanges(ranges) {
        var firstRange, secondRange;
        var min = 1000, max = -1000;

        $.each(ranges, function() {
            if (this.end.value > max) {
                max = this.end.value;
                secondRange = this;
            }

            if (this.start.value < min) {
                min = this.start.value;
                firstRange = this;
            }
        });

        $.each(ranges, function() {
            presenter.removeRange(this, true);
        });

        var joinedRange = {
            'start' : firstRange.start,
            'end' : secondRange.end
        };

        removeRangesBetweenRange(joinedRange);

        presenter.drawRanges([joinedRange]);

    }

    function setClicks(e) {
        var element = $(e);
        var position;

        if ( presenter.isMouseAboveExistingRange(e) ) {
            position = getClickedRangePosition(e);
        } else {
            position = presenter.CLICKED_POSITION.NONE;
        }

        var click = {
            element: element,
            position: position,
            time: new Date().getTime()
        };

        presenter.configuration.mouseData.clicks.push( click );
    }

    function displayCurrentMousePosition(e) {
        presenter.$view.find('.currentMousePosition').remove();
        var circle = $('<div></div>');
        circle.addClass('currentMousePosition');
        $(e).parent().append(circle);
    }

    function hideCurrentMousePosition() {
        presenter.$view.find('.currentMousePosition').remove();
    }

    function createClickArea(element, value) {
        var clickArea = $('<div></div>');
        var selectedRange = $('<div></div>');

        selectedRange.addClass('selectedRange');
        clickArea.addClass('clickArea');

        $(element).append(clickArea);
        clickArea.attr('value', value);

        if (!presenter.configuration.isPreview) {
            clickArea.on('mouseleave', function () {
                hideCurrentMousePosition();
            });

            clickArea.on('mouseenter', function (e) {
                e.preventDefault();
                displayCurrentMousePosition($(e.target));
            });

            clickArea.on('contextmenu', function (e) {
                e.preventDefault();
            });

            clickArea.on('touchstart', function (e){
                e.preventDefault();
                presenter.configuration.touchData.lastEvent = e;
            });

            clickArea.on('touchend', function (e){
                e.preventDefault();

                if ( presenter.configuration.touchData.lastEvent.type != e.type ) {
                    var eventData = event.touches[0] || event.changedTouches[0];
                    clickLogic(eventData.target);
                }

            });
        }

        var width = presenter.configuration.stepWidth, left = - (presenter.configuration.stepWidth / 2) + 'px';

        if ( value == presenter.configuration.min || value == presenter.configuration.max ) {
            width = width / 2;
        }

        if ( value == presenter.configuration.min ) {
            left = 0;
        }

        if ( value == presenter.configuration.max ) {
            left = - width;
        }

        clickArea.css({
            'width' : width,
            'left' : left
        });

        if (!presenter.configuration.isPreview) {
            clickArea.on('click', function (e) {
                e.preventDefault();
                var eventTarget = $(e.target);
                clickLogic(eventTarget);
            });
        }

        moveYAxisClickArea();
    }

    function isFirstClick() {
        return presenter.configuration.mouseData.clicks.length == 1;
    }

    function isSecondClick() {
        return presenter.configuration.mouseData.clicks.length == 2;
    }

    function areBothClicksNone() {
        return presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.NONE
            && presenter.configuration.mouseData.clicks[1].position == presenter.CLICKED_POSITION.NONE;
    }

    function isFirstClickNoneAndSecondNotNone() {
        return presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.NONE
        && presenter.configuration.mouseData.clicks[1].position != presenter.CLICKED_POSITION.NONE;
    }

    function areTwoClickedRanges() {
        return presenter.configuration.mouseData.clickedRanges.length == 2;
    }

    function isClickedStartOrEnd() {
        return presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.END
        || presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.START;
    }

    function isClickedMiddle() {
        return presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.MIDDLE;
    }

    function isFirstStartOrEndAndSecondMiddleClicked() {
        return presenter.configuration.mouseData.clicks[1].position == presenter.CLICKED_POSITION.MIDDLE
            && isClickedStartOrEnd()
            && isBothClicksTheSameRange()
    }

    function isFirstStartOrEndAndSecondNoneClicked() {
        return presenter.configuration.mouseData.clicks[1].position == presenter.CLICKED_POSITION.NONE
            && isClickedStartOrEnd();
    }

    // toggle include image when this situation happens
    function isTheSameRangeEndOrStartClickedInBothClicks() {
        return presenter.configuration.mouseData.clicks[0].position == presenter.configuration.mouseData.clicks[1].position
        && presenter.configuration.mouseData.clicks[0].element[0] == presenter.configuration.mouseData.clicks[1].element[0];
    }

    // this is when range should be deleted when both clicks were on the same range or joined when 1st/2nd click is on different range
    function isBothClicksTheSameRangeStartOrEnd() {
        return presenter.configuration.mouseData.clicks[0].element[0] != presenter.configuration.mouseData.clicks[1].element[0]
            && (presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.END
            || presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.START)
            && (presenter.configuration.mouseData.clicks[1].position == presenter.CLICKED_POSITION.END
            || presenter.configuration.mouseData.clicks[1].position == presenter.CLICKED_POSITION.START);
    }

    function isBothClicksTheSameRange() {
        var firstClickRange = getRangeByValue( presenter.configuration.mouseData.clicks[0].element.attr('value') );
        var secondClickRange = getRangeByValue( presenter.configuration.mouseData.clicks[1].element.attr('value') );
        return compareRanges(firstClickRange, secondClickRange);
    }

    function setCurrentClickedRange() {
        var first, second;

        if ( presenter.configuration.mouseData.twoClickedRangesCount == 1 ) {

            if ( presenter.configuration.mouseData.clickedRanges[0].start.value > presenter.configuration.mouseData.clickedRanges[1].start.value ) {
                first = presenter.configuration.mouseData.clickedRanges[1];
                second = presenter.configuration.mouseData.clickedRanges[0];
            } else {
                first = presenter.configuration.mouseData.clickedRanges[0];
                second = presenter.configuration.mouseData.clickedRanges[1];
            }

        } else {

            if ( presenter.configuration.mouseData.clickedRanges[0].start.value > presenter.configuration.mouseData.clickedRanges[1].start.value ) {
                first = presenter.configuration.mouseData.clickedRanges[0];
                second = presenter.configuration.mouseData.clickedRanges[1];
            } else {
                first = presenter.configuration.mouseData.clickedRanges[1];
                second = presenter.configuration.mouseData.clickedRanges[0];
            }

        }

        presenter.configuration.mouseData.clickedRanges = [first, second];
    }

    function resetClicks() {

        if ( presenter.configuration.notCurrentSelectedRange ) {

            if ( presenter.configuration.mouseData.twoClickedRangesCount == 1 ) {
                addEndRangeImage( presenter.configuration.notCurrentSelectedRange.start.element, false );
            } else if ( presenter.configuration.mouseData.twoClickedRangesCount == 2 ) {
                addEndRangeImage( presenter.configuration.notCurrentSelectedRange.end.element, false );
            }

        }

        presenter.$view.find('.currentSelectedRange').removeClass('currentSelectedRange');

        presenter.configuration.mouseData.clicks = [];
        presenter.configuration.mouseData.twoClickedRangesCount = 0;
        presenter.configuration.notCurrentSelectedRange = null;
    }

    function clickLogic(eventTarget) {
        if (presenter.configuration.isActivity && presenter.configuration.isShowErrorsMode) return false;
        if (presenter.configuration.isDisabled) return;

        if (presenter.configuration.mouseData.twoClickedRangesCount > 3) {
            presenter.configuration.mouseData.twoClickedRangesCount = 0;
        }

        setClickedRanges(eventTarget);

        setClicks(eventTarget);

        var firstClick = presenter.configuration.mouseData.clicks[0];

        if ( isFirstClick() ) {

            if ( firstClick.position == presenter.CLICKED_POSITION.NONE ) {

                var value = parseRangeStartOrEnd(presenter.configuration.mouseData.clicks[0].element.attr('value'));

                if ( !isValueInfinity(value) ) {
                    addEndRangeImage(presenter.configuration.mouseData.clicks[0].element.parent(), true);

                }

            }

            else if ( areTwoClickedRanges() ) {

                presenter.configuration.mouseData.twoClickedRangesCount++;

                if ( presenter.configuration.mouseData.twoClickedRangesCount == 1 ) {
                    var selectedRange = presenter.configuration.mouseData.clickedRanges[0].start.element.find('.selectedRange');
                    selectedRange.addClass('currentSelectedRange');
                }

                presenter.configuration.notCurrentSelectedRange = presenter.configuration.mouseData.clickedRanges[1];

            }

            else if ( isClickedStartOrEnd() ) {

                var selectedRange = presenter.configuration.mouseData.clickedRanges[0].start.element.find('.selectedRange');
                selectedRange.addClass('currentSelectedRange');

            }

            else if ( isClickedMiddle() ) {

                splitRange( presenter.configuration.mouseData.clickedRanges[0], eventTarget );

                resetClicks();

            }

        }

        else if ( isSecondClick() ) {

            var secondClick = presenter.configuration.mouseData.clicks[1];
            var newRange;
            var firstValue = parseRangeStartOrEnd(firstClick.element.attr('value'));
            var secondValue = parseRangeStartOrEnd(secondClick.element.attr('value'));

            if ( areBothClicksNone() ) {

                var timeDiff = presenter.configuration.mouseData.clicks[1].time - presenter.configuration.mouseData.clicks[0].time;

                if ( timeDiff < 250 && timeDiff > 0 ) {

                    newRange = {
                        start: createRangeElement(firstClick.element, firstValue, true),
                        end: createRangeElement(firstClick.element, firstValue, true)
                    };

                    setRangeValues(newRange, true);
                    addToDrawnRanges(newRange);

                } else {

                    if ( firstValue > secondValue ) {

                        newRange = {
                            start: createRangeElement(secondClick.element, secondValue, true),
                            end: createRangeElement(firstClick.element, firstValue, true)
                        };

                        removeRangesBetweenRange(newRange);
                        presenter.drawRanges([newRange]);

                    } else if ( firstValue < secondValue ) {

                        newRange = {
                            start: createRangeElement(firstClick.element, firstValue, true),
                            end: createRangeElement(secondClick.element, secondValue, true)
                        };

                        removeRangesBetweenRange(newRange);
                        presenter.drawRanges([newRange]);

                    } else {

                        var rangeImage = firstClick.element.parent().find('.rangeImage');

                        if ( rangeImage.hasClass('include') ) {
                            rangeImage.remove();
                        } else {
                            rangeImage.removeClass('exclude');
                            rangeImage.addClass('include');
                        }

                    }
                }

                resetClicks();

            }

            else if ( isFirstClickNoneAndSecondNotNone() ) {

                if ( firstValue >  secondValue) {

                    newRange = {
                        start: createRangeElement(secondClick.element, secondValue, true),
                        end: createRangeElement(firstClick.element, firstValue, true)
                    };

                } else if ( firstValue < secondValue ) {

                    newRange = {
                        start: createRangeElement(firstClick.element, firstValue, true),
                        end: createRangeElement(secondClick.element, secondValue, true)
                    };

                }

                joinRanges([newRange, presenter.configuration.mouseData.clickedRanges[0]]);

                resetClicks();

            }

            else if ( isFirstStartOrEndAndSecondMiddleClicked() ) {

                var clickedRange = presenter.configuration.mouseData.clickedRanges[0];

                if ( firstClick.position == presenter.CLICKED_POSITION.START ) {

                    newRange = {
                        start: createRangeElement( secondClick.element, secondValue, firstClick.element.parent().find('.rangeImage').hasClass('include') ),
                        end: createRangeElement( clickedRange.end.element, clickedRange.end.value, clickedRange.end.include )
                    };

                } else if ( firstClick.position == presenter.CLICKED_POSITION.END ) {

                    newRange = {
                        end: createRangeElement( secondClick.element, secondValue, firstClick.element.parent().find('.rangeImage').hasClass('include') ),
                        start: createRangeElement( clickedRange.start.element, clickedRange.start.value, clickedRange.start.include )
                    };

                }

                presenter.removeRange(clickedRange, true);
                presenter.drawRanges([newRange]);

                resetClicks();

            }

            else if ( areTwoClickedRanges() ) {

                presenter.configuration.mouseData.twoClickedRangesCount++;

                if ( presenter.configuration.mouseData.twoClickedRangesCount == 2 ) {

                    var currentSelectedRange = presenter.configuration.mouseData.clickedRanges[0].start.element.find('.selectedRange')
                    var selectedRange = presenter.configuration.mouseData.clickedRanges[1].start.element.find('.selectedRange');
                    selectedRange.addClass('currentSelectedRange');
                    currentSelectedRange.removeClass('currentSelectedRange');
                    presenter.configuration.mouseData.clicks = presenter.configuration.mouseData.clicks.slice(0, 1);
                    presenter.configuration.mouseData.clicks[0].position = presenter.CLICKED_POSITION.START;
                    presenter.configuration.notCurrentSelectedRange = presenter.configuration.mouseData.clickedRanges[0];

                } else if ( presenter.configuration.mouseData.twoClickedRangesCount == 3 ) {

                    joinRanges( presenter.configuration.mouseData.clickedRanges );

                    resetClicks();

                } else {

                    presenter.removeRange(getRangeByValue( firstValue ), true);
                    addEndRangeImage(secondClick.element.parent(), false);

                    resetClicks();
                }


                setCurrentClickedRange();

            }

            else if ( isFirstStartOrEndAndSecondNoneClicked() ) {

                if ( firstValue > secondValue ) {

                    newRange = {
                        start: createRangeElement(secondClick.element, secondValue, firstClick.element.parent().find('.rangeImage').hasClass('include')),
                        end: createRangeElement(firstClick.element, firstValue, firstClick.element.parent().find('.rangeImage').hasClass('include'))
                    };

                    joinRanges( [newRange, getRangeByValue( firstValue )] );

                } else if ( firstValue < secondValue ) {

                    newRange = {
                        start: createRangeElement(firstClick.element, firstValue, firstClick.element.parent().find('.rangeImage').hasClass('include') ),
                        end: createRangeElement(secondClick.element, secondValue, firstClick.element.parent().find('.rangeImage').hasClass('include') )
                    };

                    joinRanges( [newRange, getRangeByValue( firstValue )] );

                }

                resetClicks();

            }

            else if ( isTheSameRangeEndOrStartClickedInBothClicks() ) {

                var imageWrapper = firstClick.element.parent().find('.rangeImage');
                var shouldInclude = !imageWrapper.hasClass('include');
                var index = presenter.configuration.drawnRangesData.ranges.indexOf(presenter.configuration.mouseData.clickedRanges[0]);

                if ( presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.START ) {

                    presenter.configuration.drawnRangesData.ranges[index].start.include = shouldInclude;

                } else if ( presenter.configuration.mouseData.clicks[0].position == presenter.CLICKED_POSITION.END ) {

                    presenter.configuration.drawnRangesData.ranges[index].end.include = shouldInclude;

                }

                toggleIncludeImage( imageWrapper, shouldInclude );

                if ( presenter.configuration.drawnRangesData.ranges[index].values.length == 1 ) {

                    presenter.removeRange( presenter.configuration.drawnRangesData.ranges[index], true );
                    imageWrapper.remove();

                }

                presenter.$view.find('.currentSelectedRange').removeClass('currentSelectedRange');

                var rangeString = presenter.convertRangeToString(presenter.configuration.drawnRangesData.ranges[index]);
                var eventData = presenter.createEventData(rangeString, false, checkIsRangeCorrect(presenter.configuration.drawnRangesData.ranges[index]));

                eventBus.sendEvent('ValueChanged', eventData);

                if ( presenter.allRangesCorrect() ) {
                    var eventData = presenter.createAllOKEventData();
                    eventBus.sendEvent('ValueChanged', eventData);
                }

                resetClicks();

            }

            else if ( isBothClicksTheSameRangeStartOrEnd() ) {

                var firstClickRange = getRangeByValue( firstValue );
                var secondClickRange = getRangeByValue( secondValue );

                if ( compareRanges(firstClickRange, secondClickRange) ) {

                    presenter.removeRange(firstClickRange, true);

                    var rangeString = presenter.convertRangeToString(firstClickRange);
                    var eventData = presenter.createEventData(rangeString, true, !checkIsRangeCorrect(firstClickRange));
                    eventBus.sendEvent('ValueChanged', eventData);

                    if ( presenter.allRangesCorrect() ) {
                        var eventData = presenter.createAllOKEventData();
                        eventBus.sendEvent('ValueChanged', eventData);
                    }

                } else {

                    joinRanges([ getRangeByValue( firstValue ), getRangeByValue( secondValue ) ]);

                }

                resetClicks();

            } else {

                resetClicks();

            }

        }

    }

    function removeRangesBetweenRange(range) {
        var currentRanges = [];
        currentRanges = currentRanges.concat(presenter.configuration.drawnRangesData.ranges);

        for( var i = 0; i < currentRanges.length; i++) {
            var drawnRange = currentRanges[i];
            var drawnStartValue = drawnRange.start.value;
            var drawnEndValue = drawnRange.end.value;

            if ( drawnStartValue == -Infinity ) {
                drawnStartValue = presenter.configuration.min;
            }

            if ( drawnEndValue == Infinity ) {
                drawnEndValue = presenter.configuration.max;
            }

            if ( range.start.value < drawnEndValue && range.end.value > drawnStartValue ) {
                presenter.removeRange(drawnRange, true);
            }
        }

    }

    function getRangeByValue(value) {
        value = parseRangeStartOrEnd(value);
        var ranges = [];

        $.each(presenter.configuration.drawnRangesData.ranges, function() {
            if ( this.values.indexOf(value) >= 0 ) {
                ranges.push(this);
            }

            return true;
        });

        if (ranges.length == 2) {

            if (presenter.configuration.mouseData.twoClickedRangesCount == 1) {

                return ranges[0];

            } else if (presenter.configuration.mouseData.twoClickedRangesCount == 2) {

                return ranges[1];

            }

        } else if (ranges.length == 1) {

            return ranges[0];

        } else {

            presenter.configuration.isError = true;
            presenter.configuration.errorCode = 'OOR01';
            return null;

        }
    }

    function createRangeElement(element, value, include) {
        if (element.hasClass('clickArea')) {
            element = element.parent();
        }
        return {
            element: parseElement(element),
            value: parseRangeStartOrEnd(value),
            include: include
        }
    }

    presenter.isMouseAboveExistingRange = function( e ) {
        var value = parseRangeStartOrEnd($(e).attr('value'));
        return $.inArray( value, presenter.configuration.drawnRangesData.values ) >= 0;
    };

    presenter.isValueInRange = function( value, range, takeExcludeIntoConsideration ) {

        var start, end;
        if (takeExcludeIntoConsideration) {
            start = range.start.include ? range.start.value : range.start.value + 1;
            end = range.end.include ? range.end.value + 1 : range.end.value;
        } else {
            start = range.start.value;
            end = range.end.value + 1;
        }

        for( var i = start; i < end; i++ ) {
            if ( i == value ) {
                return true;
            }
        }
        return false;
    };

    function toggleIncludeImage(imageWrapper, shouldInclude) {
        if (shouldInclude) {
            imageWrapper.addClass('include');
            imageWrapper.removeClass('exclude');
        } else {
            imageWrapper.addClass('exclude');
            imageWrapper.removeClass('include');
        }
    }

    presenter.drawRanges = function(ranges) {

        $.each(ranges, function() {
            var startValue = Math.min(this.start.value, this.end.value);
            var endValue = Math.max(this.start.value, this.end.value);
            var isEndInfinity = isValueInfinity(endValue);
            var isStartInfinity = isValueInfinity(startValue);
            var startElement, endElement;

            if ( isStartInfinity ) {
                startElement = presenter.$view.find('.clickArea[value="' + presenter.configuration.min + '"]').parent();
            } else {
                startElement = presenter.$view.find('.clickArea[value="' + startValue + '"]').parent();
            }

            if ( isEndInfinity ) {
                endElement = presenter.$view.find('.clickArea[value="' + presenter.configuration.max + '"]').parent();
            } else {
                endElement = presenter.$view.find('.clickArea[value="' + endValue + '"]').parent();
            }

            var start = parseFloat($(startElement).css('left'));
            var end = parseFloat(endElement.css('left'));
            var difference =  Math.abs(start - end);
            var range = $('<div></div>');

            if (!this.start.element || !this.end.element) {
                this.start.element = startElement;
                this.end.element = endElement;
            }

            range.addClass('selectedRange');

            if ( isStartInfinity && isEndInfinity ) {
                range.addClass(isStartInfinity ? 'infinityBoth' : '');
            } else {
                range.addClass(isStartInfinity ? 'infinityLeft' : '');
                range.addClass(isEndInfinity ? 'infinityRight' : '');
            }

            // when range is ending in infinity then it should be wider because there is space between arrowhead and last step line
            // + 2 is because stepLine is 2 px width
            var width = isEndInfinity ? difference + presenter.configuration.stepWidth + 'px' : difference + 2 + 'px';

            range.css('width', width);
            startElement.append(range);

            if (start > end) {
                range.css('left', - (difference) + 'px');
            }

            addToDrawnRanges(this);

            setRangeValues(this, true);

            addEndRangeImages(this, startElement, endElement, isStartInfinity, isEndInfinity);

        });

    };

    function isValueInfinity(value) {
        return ( value == -Infinity
            || value == Infinity )
    }

    function setRangeValues(range, shouldAddToDrawn) {
        range.values = [];
        var startValue = Math.min(range.start.value, range.end.value);
        var endValue = Math.max(range.start.value, range.end.value);

        if (startValue == -Infinity) {
            range.values.push(-Infinity);
            if (shouldAddToDrawn) {
                presenter.configuration.drawnRangesData.values.push(-Infinity);
            }
            startValue = presenter.configuration.min;
        }

        if (endValue == Infinity) {
            range.values.push(Infinity);
            if (shouldAddToDrawn) {
                presenter.configuration.drawnRangesData.values.push(Infinity);
            }
            endValue = presenter.configuration.max;
        }


        for ( var i = startValue; i <= endValue; i = i + (presenter.configuration.step) ) {

            range.values.push(i);

            if (shouldAddToDrawn) {
                presenter.configuration.drawnRangesData.values.push(i);
            }
        }

    }

    function addEndRangeImages(range, startElement, endElement, isStartInfinity, isEndInfinity) {

        if ( !isEndInfinity ) {
            addEndRangeImage( endElement, range.end.include );
        } else {
            addInfinityBox( startElement );
        }

        if ( startElement[0] != endElement[0] ) {

            if ( !isStartInfinity ) {
                addEndRangeImage( startElement, range.start.include );
            } else {
                addInfinityBox( startElement );
            }

        }
    }

    function addInfinityBox( element ) {
        // TODO
    }

    presenter.convertRangeToString = function( range ) {
        var startInclude = range.start.include ? '<' : '(';
        var endInclude = range.end.include ? '>' : ')';
        var startValue = isValueInfinity(range.start.value) ? '-INF' : range.start.value;
        var endValue = isValueInfinity(range.end.value) ? 'INF' : range.end.value;

        return startInclude +
            transformValueToDisplayVersion(startValue) +
            '; ' +
            transformValueToDisplayVersion(endValue) + endInclude;
    };

    function addEndRangeImage(element, include) {

        var currentImages = element.find('.rangeImage');
        currentImages.remove();

        var imageContainer = $('<div></div>');
        imageContainer.addClass('rangeImage');

        imageContainer.addClass(include ? 'include' : 'exclude');
        element.append(imageContainer);
        return imageContainer;
    }

    presenter.createSteps = function () {
        var xAxisValues = getXAxisValues();
        presenter.configuration.stepWidth = calculateStepWidth(xAxisValues);
        var isDrawOnlyChosen = presenter.configuration.axisXValues.length > 0;

        for (var i = 0; i < xAxisValues.length; i++) {
            var stepLine = $('<div></div>');
            stepLine.addClass('stepLine');

            if (xAxisValues[i] == 0) {
                var innerHeight = presenter.$view.find('.inner').height();
                var yAxis = presenter.$view.find('.y-axis');
                var xAxis = presenter.$view.find('.x-axis');

                yAxis.height(innerHeight);
                yAxis.css({
                    'top' : - (innerHeight / 2),
                    'left' : presenter.configuration.stepWidth * i
                });
                xAxis.append(yAxis);
            } else {
                var text = $('<div></div>');
                text.addClass('stepText');
                text.html( transformValueToDisplayVersion( xAxisValues[i] ) );
                text.css('left', - new String(xAxisValues[i]).length * (4) + 'px');


                if (isDrawOnlyChosen && presenter.configuration.showAxisXValues) {
                    if ($.inArray(xAxisValues[i], presenter.configuration.axisXValues) !== -1) {
                        stepLine.append(text);
                    }
                } else if (presenter.configuration.showAxisXValues) {
                    stepLine.append(text);
                }

            }

            stepLine.css('left', presenter.configuration.stepWidth * i);
            createClickArea(stepLine, xAxisValues[i]);
            presenter.$view.find('.x-axis').append(stepLine);
        }
    };

    function transformValueToDisplayVersion(value) {
        return ('' + value).replace('.', presenter.configuration.separator);
    }

    function moveYAxisClickArea() {
        var yAxis = presenter.$view.find('.y-axis');
        var yAxisClickArea = yAxis.find('.clickArea');
        yAxisClickArea.css('top', (yAxis.height() / 2) - 50 + 'px');
    }

    function checkIsMinLowerThanMax(min, max) {
        var parsedMin = parseRangeStartOrEnd(min);
        var parsedMax = parseRangeStartOrEnd(max);
        return parsedMin < parsedMax;
    }

    presenter.getState = function () {
        $.each(presenter.configuration.drawnRangesData.ranges, function() {
            this.start.element = null;
            this.end.element = null;
        });

        return JSON.stringify({
            drawnRangesData: presenter.configuration.drawnRangesData,
            isVisible: presenter.configuration.isCurrentlyVisible,
            isDisabled: presenter.configuration.isDisabled
        });
    };

    presenter.redrawRanges = function (rangesToDraw) {
        $.each(rangesToDraw, function () {
            this.start.element = presenter.$view.find('.clickArea[value="' + this.start.value + '"]').parent();
            this.end.element = presenter.$view.find('.clickArea[value="' + this.end.value + '"]').parent();
        });

        $.each(presenter.configuration.shouldDrawRanges, function () {
            presenter.removeRange(this, true);
        });

        presenter.drawRanges(rangesToDraw);
    };

    presenter.setState = function (state) {
        if (ModelValidationUtils.isStringEmpty(state)) return;

        var parsedState = JSON.parse(state);

        presenter.redrawRanges(parsedState.drawnRangesData.ranges);

        presenter.configuration.isCurrentlyVisible = parsedState.isVisible;
        presenter.setVisibility(parsedState.isVisible);

        presenter.configuration.isDisabled = parsedState.isDisabled;
    };

    presenter.reset = function() {
        var rangesToRemove = [].concat(presenter.configuration.drawnRangesData.ranges);

        $.each(rangesToRemove, function() {
            presenter.removeRange(this, true);
        });

        presenter.drawRanges(presenter.configuration.shouldDrawRanges);

        presenter.configuration.mouseData.clicks = [];

        presenter.configuration.isCurrentlyVisible = presenter.configuration.isVisibleByDefault;
        presenter.setVisibility(presenter.configuration.isVisibleByDefault);

        presenter.configuration.isShowErrorsMode = false;
        presenter.configuration.isDisabled = presenter.configuration.isDisabledByDefault;
    };

    presenter.setShowErrorsMode = function() {
        presenter.configuration.isShowErrorsMode = true;
        var validated = validateDrawnRanges();

        $.each(validated.correct, function() {
            if ( isValueInfinity(this.start.value) ) {
                presenter.$view.find('.clickArea[value="' + presenter.configuration.min + '"]').parent().find('.selectedRange').addClass('correct');
            } else {
                this.start.element.find('.selectedRange').addClass('correct');
            }
            addCorrectnessClassToRangeEnds(this, 'correct');
        });

        $.each(validated.wrong, function() {
            this.start.element.find('.selectedRange').addClass('wrong');
            addCorrectnessClassToRangeEnds(this, 'wrong');
        });

    };

    function addCorrectnessClassToRangeEnds(range, includePrefix) {
        var startImage = range.start.element.find('.rangeImage ');
        var endImage = range.end.element.find('.rangeImage');

        if( startImage.hasClass('include') ) {
            startImage.removeClass('include');
            startImage.addClass(includePrefix + 'RangeInclude');
        } else {
            startImage.removeClass('exclude');
            startImage.addClass(includePrefix + 'RangeExclude');
        }

        if( endImage.hasClass('include') ) {
            endImage.removeClass('include');
            endImage.addClass(includePrefix + 'RangeInclude');
        } else {
            endImage.removeClass('exclude');
            endImage.addClass(includePrefix + 'RangeExclude');
        }
    }

    presenter.setWorkMode = function() {
        presenter.configuration.isShowErrorsMode = false;

        presenter.$view.find('.correct').removeClass('correct');
        presenter.$view.find('.wrong').removeClass('wrong');
        presenter.$view.find('.correctRangeExclude, .wrongRangeExclude').removeClass('correctRangeExclude wrongRangeExclude').addClass('exclude');
        presenter.$view.find('.correctRangeInclude, .wrongRangeInclude').removeClass('correctRangeInclude wrongRangeInclude').addClass('include');
    };

    presenter.getScore = function() {
        var validated = validateDrawnRanges();
        return validated.correct.length;
    };

    presenter.getMaxScore = function () {
        return presenter.configuration.otherRanges.length + presenter.configuration.shouldDrawRanges.length;
    };

    presenter.getErrorCount = function () {
        var validated = validateDrawnRanges();
        return validated.wrong.length;
    };

    function validateDrawnRanges() {
        var correctSelectedRanges = [];
        var wrongSelectedRanges = [];
        var ranges = presenter.configuration.otherRanges.concat(presenter.configuration.shouldDrawRanges);

        $.each( presenter.configuration.drawnRangesData.ranges, function() {
            var drawnRange = this;

            $.each( ranges, function() {
                setRangeValues(this, false);

                if (compareRanges(this, drawnRange)) {
                    correctSelectedRanges.push(drawnRange);
                }
            });

            if (correctSelectedRanges.indexOf(drawnRange) == -1) {
                wrongSelectedRanges.push(drawnRange)
            }
        });

        return  {
            correct: correctSelectedRanges,
            wrong: wrongSelectedRanges
        }
    }

    function checkIsRangeCorrect( range ) {
        var ranges = presenter.configuration.otherRanges.concat(presenter.configuration.shouldDrawRanges);
        var isCorrect = false;

        setRangeValues(range, false);

        $.each( ranges, function() {
            setRangeValues(this, false);
            if ( compareRanges(this, range) ) {
                isCorrect = true;
                return false; // breaks each loop
            }
        });


        return isCorrect;
    }

    function addToDrawnRanges ( range ) {
        presenter.configuration.drawnRangesData.ranges.push( range );

        if ( !presenter.configuration.isPreview && !presenter.configuration.isInitialDraw ) {
            var rangeString = presenter.convertRangeToString(range);
            var isRangeCorrect = checkIsRangeCorrect(range);
            var eventData = presenter.createEventData(rangeString, false, isRangeCorrect);
            eventBus.sendEvent('ValueChanged', eventData);

            if ( presenter.allRangesCorrect() ) {
                var eventData = presenter.createAllOKEventData();
                eventBus.sendEvent('ValueChanged', eventData);
            }
        }
    }

    presenter.allRangesCorrect = function() {
        return presenter.getScore() - presenter.getMaxScore() == 0;
    };

    function compareRanges(rangeA, rangeB) {
        return (compareArray(rangeA.values, rangeB.values)
            && rangeA.start.include == rangeB.start.include
            && rangeA.end.include == rangeB.end.include)
    }

    function compareArray(arrA, arrB) {
        var i = arrA.length;
        if (i != arrB.length) return false;

        while ( i-- ) {
            if (arrA[i] !== arrB[i]) return false;
        }

        return true;
    }

    function parseElement( element ) {
        switch (element) {
            case element.find('.infinity-left').length > 0:
                return presenter.$view.find('.clickArea[value="' + presenter.configuration.min + '"]').parent();
            case element.find('.infinity-right').length > 0:
                return presenter.$view.find('.clickArea[value="' + presenter.configuration.max + '"]').parent();
            default:
                return element;
        }
    }

    function parseRangeStartOrEnd (value) {

        if ( value == '-INF' || value == -Infinity ) {
            return -Infinity;
        }
        else if ( value == 'INF' || value == Infinity ) {
            return Infinity;
        }
        else {
            var parsedValue = presenter.parseValueWithSeparator(value, presenter.configuration.separator);
            return parseFloat( parsedValue );
        }
    }

    presenter.validateDecimalSeparator = function (decimalSeparator) {
        if ( ModelValidationUtils.isStringEmpty(decimalSeparator) ) {
            return {
                value: '.',
                isValid: true
            }
        }

        if ( $.trim(decimalSeparator) == ';' ) {
            return {
                value: null,
                isValid: false,
                errorCode: 'DSE01'
            }
        }

        return {
            value: decimalSeparator,
            isValid: true
        }
    };

    presenter.validateRanges = function (ranges, separator) {
        if (separator == undefined) {
            separator = '.';
        }

        var rangesList = Helpers.splitLines(ranges);
        separator = escapeRegexSpecialCharacters(separator);
        var rangesPattern = new RegExp('(\\(|<){1}[(?P \\d|(-){1}INF' + separator + ')-]+;[(?P \\d|(-){1}INF' + separator + ')-]+(\\)|>){1};[ ]*(0|1){1}', 'i'); // matches i.e. (1; 0); 0 or <2; 15); 1, <-INF; 10); 1, <1.5; 2.5); 0
//        var rangesPattern = /(\(|<){1}[(?P \d|(-){1}INF\.)-]+;[(?P \d|(-){1}INF\.)-]+(\)|>){1};[ ]*(0|1){1}/i;
        var validatedShouldDrawRanges = [];
        var validatedOtherRanges = [];
        var isError = false,
            errorCode = '';

        $.each(rangesList, function() {
            var rangeString = this.toString();

            if( !rangesPattern.test(rangeString) ) {
                isError = true;
                errorCode = 'RAN01';

                return false; // Breaks jQuery.each loop
            }

            var regexResult = rangesPattern.exec(rangeString)[0];
            var brackets = regexResult.match(/[\(\)<>]+/g);
            var onlyNumbersAndCommas = regexResult.replace(/[ \(\)<>]*/g, '');
            var onlyNumbers = onlyNumbersAndCommas.split(';');
            var min = parseRangeStartOrEnd(onlyNumbers[0]);
            var max = parseRangeStartOrEnd(onlyNumbers[1]);
            var minInclude = brackets[0] == '<' || min == -Infinity;
            var maxInclude = brackets[1] == '>' || max == Infinity;
            var shouldDrawRange = onlyNumbers[2] == '1';

            if ( (min > max)
                || (min == Infinity && max == Infinity)
                || (min == -Infinity && max == -Infinity) ) {

                isError = true;
                errorCode = 'MIN/MAX01';

                return false; // Breaks jQuery.each loop
            }

            var validatedRange = {
                start: { value : min, include: minInclude, element: null },
                end: { value: max, include: maxInclude, element: null }
            };

            if (shouldDrawRange) {
                validatedShouldDrawRanges.push(validatedRange);
            } else {
                validatedOtherRanges.push(validatedRange);
            }

            return true; // jQuery.each continue statement
        });

        return {
            isError: isError,
            errorCode: errorCode,
            shouldDrawRanges : validatedShouldDrawRanges,
            otherRanges : validatedOtherRanges
        };
    };

    function escapeRegexSpecialCharacters(value) {
        return (value + '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape regex special characters
    }

    presenter.validateValueWithSeparator = function (value, separator) {
        var escapedSeparator = escapeRegexSpecialCharacters(separator);

        var pattern = new RegExp('^(-{0,1}\\d+)' + escapedSeparator + '{0,1}\\d*$', 'i');

        if ( pattern.test(value) ) {
            return {
                'isValid' : true,
                'value' : presenter.parseValueWithSeparator(value, separator)
            }
        } else {
            return {
                'isValid' : false,
                'value' : null
            }
        }
    };

    presenter.parseValueWithSeparator = function (value, separator) {
        return (value + '').replace(separator, '.');
    };

    presenter.readConfiguration = function(model) {
        var separator = presenter.validateDecimalSeparator(model['Decimal Separator']);

        if (!separator.isValid) {
            return { 'isError' : true, 'errorCode' : 'DSE01' };
        }

        presenter.configuration.separator = separator.value;

        if( ModelValidationUtils.isStringEmpty(model['Min']) ) {
            return { 'isError' : true, 'errorCode' : 'MIN01' };
        }

        if( ModelValidationUtils.isStringEmpty(model['Max']) ) {
            return { 'isError' : true, 'errorCode' : 'MAX01' };
        }

        var min, max, validatedMin, validatedMax;

        var validatedMinWithSeparator = presenter.validateValueWithSeparator(model['Min'], separator.value);

        if ( !validatedMinWithSeparator.isValid ) {
            return { 'isError' : true, 'errorCode' : 'MIN03' };
        }

        var validatedMaxWithSeparator = presenter.validateValueWithSeparator(model['Max'], separator.value);

        if ( !validatedMaxWithSeparator.isValid ) {
            return { 'isError' : true, 'errorCode' : 'MAX03' };
        }

        validatedMin = ModelValidationUtils.validateFloat( validatedMinWithSeparator.value );
        validatedMax = ModelValidationUtils.validateFloat( validatedMaxWithSeparator.value );

        if ( !validatedMin.isValid ) {
            return { 'isError': true, 'errorCode': 'MIN02' };
        }

        min = validatedMin.parsedValue;

        if ( !validatedMax.isValid ) {
            return { 'isError': true, 'errorCode': 'MAX02' };
        }

        max = validatedMax.parsedValue;

        if( !checkIsMinLowerThanMax(min, max) ) {
            return { 'isError' : true, 'errorCode' : 'MIN/MAX01' };
        }

        var ranges = presenter.validateRanges(model['Ranges'], separator.value);

        var validatedIsActivity = !ModelValidationUtils.validateBoolean(model['Not Activity']);
        var validatedStep = { value : 1 };

        if ( model['Step'] ) {
            validatedStep = presenter.validateValueWithSeparator( model['Step'], separator.value );

            if (!validatedStep.isValid) {
                return {
                    'isError' : true,
                    'errorCode' : 'STEP02'
                }
            }

            validatedStep = ModelValidationUtils.validateFloatInRange(validatedStep.value, 50, 0);

            if (!validatedStep.isValid) {
                return {
                    'isError' : true,
                    'errorCode' : 'STEP01'
                }
            }
        }

        var validatedAxisXValues = [];

        if (model['Axis X Values'] !== '') {
            var splittedValues = model['Axis X Values'].split(';');
            for (var i = 0; i < splittedValues.length; i++) {
                var value = splittedValues[i].replace(' ', '');

                var validatedValue = presenter.validateValueWithSeparator(value, separator.value);

                if (!validatedValue.isValid) {
                    return {
                        'isError' : true,
                        'errorCode' : 'VAL02'
                    }
                }

                validatedValue = ModelValidationUtils.validateFloatInRange(validatedValue.value, max, min);

                if (!validatedValue.isValid) {
                    return {
                        'isError' : true,
                        'errorCode' : 'VAL01'
                    }
                }

                validatedAxisXValues.push(validatedValue.parsedValue);
            }
        }

        var validatedShowAxisXValues = ModelValidationUtils.validateBoolean(model['Show Axis X Values']);
        var isVisible = ModelValidationUtils.validateBoolean(model['Is Visible']);
        var isDisabled = ModelValidationUtils.validateBoolean(model['Disable']);

        return {
            isError : false,
            min : min,
            max : max,
            shouldDrawRanges : ranges.shouldDrawRanges,
            otherRanges : ranges.otherRanges,
            isActivity : validatedIsActivity,
            step : validatedStep.parsedValue,
            showAxisXValues : validatedShowAxisXValues,
            axisXValues : validatedAxisXValues,
            mouseData : {
                clickedRanges : [],
                clicks : [],
                twoClickedRangesCount : 0
            },
            drawnRangesData : {
                isDrawn : false,
                ranges : [],
                values : []
            },
            touchData : {
                lastEvent : null
            },
            isShowErrorsMode : false,
            isCurrentlyVisible: isVisible,
            isVisibleByDefault: isVisible,
            notCurrentSelectedRange : null,
            addonID : model['ID'],
            isInitialDraw : true,
            isDisabled: isDisabled,
            isDisabledByDefault: isDisabled,
            separator: separator.value
        }
    };

    presenter.executeCommand = function(name, params) {
        var commands = {
            'show': presenter.show,
            'hide': presenter.hide,
            'drawRange' : presenter.drawRange,
            'enable': presenter.enable,
            'disable': presenter.disable
        };

        Commands.dispatch(commands, name, params, presenter);
    };

    presenter.setVisibility = function(isVisible) {
        presenter.$view.children('div').css("visibility", isVisible ? "visible" : "hidden");
    };

    presenter.show = function () {
        presenter.configuration.isCurrentlyVisible = true;
        presenter.setVisibility(true);
    };

    presenter.hide = function () {
        presenter.configuration.isCurrentlyVisible = false;
        presenter.setVisibility(false);
    };

    presenter.setDisableState = function(isDisabled) {
        var element = presenter.$view.find('.outer');

        if (isDisabled) {
            element.addClass("disable");
        } else {
            element.removeClass("disable");
        }

        presenter.configuration.isDisabled = isDisabled;
    };

    presenter.enable = function() {
        presenter.setDisableState(false);
        resetClicks();
    };

    presenter.disable = function() {
        presenter.setDisableState(true);
    };

    presenter.drawRange = function (rangeList) {
        var rangeString = rangeList.join('\n\r');
        var validatedRanges = presenter.validateRanges(rangeString);

        $.each(validatedRanges.shouldDrawRanges, function() {
            removeRangesBetweenRange(this);
        });

        presenter.drawRanges(validatedRanges.shouldDrawRanges);

    };

    presenter.setPlayerController = function(controller) {
        playerController = controller;
        eventBus = controller.getEventBus();
    };

    presenter.createEventData = function (rangeString, isRemove, isRangeCorrect) {
        return {
            'source': presenter.configuration.addonID,
            'item': rangeString,
            'value': isRemove ? '0' : '1',
            'score': isRangeCorrect ? '1' : '0'
        };
    };

    presenter.createAllOKEventData = function () {
        return {
            'source': presenter.configuration.addonID,
            'item': 'all',
            'value': '',
            'score': ''
        };
    };


    return presenter;
}       