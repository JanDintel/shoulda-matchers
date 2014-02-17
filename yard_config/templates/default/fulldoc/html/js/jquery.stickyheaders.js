window.StickyHeaders = (function ($) {
  var me = {};

  var config = {
    switchOnCollisionWith: 'top',
    copy: 'element'
  };
  var selectors = [];
  var headers = [];
  var headerRanges = [];

  var body;
  var contentContainer;
  var stickyHeaderContainer;
  var currentHeaderRangeIndex = -1;
  var currentScrollOffset = 0;
  var lastScrollOffset = 0;
  var isScrolling = false;

  function setHeaders() {
    contentContainer = $(config.contentContainer || 'body');
    stickyHeaderContainer = config.stickyHeaderContainer ? $(config.stickyHeaderContainer) : contentContainer;

    var elements = [];
    $.each(selectors, function (i, selector) {
      var foundElements = contentContainer.find(selector);
      $.each(foundElements, function (i, element) {
        var $element = $(element);
        // position() takes scrollTop into account which we don't want
        var topOffset = (
          $element.offset().top +
          (-$element.offsetParent().offset().top) +
          parseFloat($element.css('margin-top'), 10) +
          parseFloat($element.css('padding-top'), 10) +
          //(-parseFloat($element.css('font-size'), 10) / 2) +
          -30
          //-(i * 0.4)
        );
        var height = Math.round($element.height());
        var outerHeight = Math.round($element.outerHeight(true));
        var bottomOffset = topOffset + outerHeight;

        headers.push({
          element: element,
          topOffset: topOffset,
          bottomOffset: bottomOffset
        });
      })
    })
  }

  function setHeaderRanges() {
    var offsetProp = config.switchOnCollisionWith + 'Offset';
    var start, end
    for (var i = 0, len = headers.length; i < len; i++) {
      start = headers[i][offsetProp];
      if (headers[i+1]) {
        end = headers[i+1][offsetProp];
      } else {
        end = null
      }
      headerRanges.push({
        start: start,
        end: end,
        element: headers[i].element
      });
    }

  }

  function setCurrentHeaderIndex() {
    var scrollTop = contentContainer.scrollTop();
    for (var i = 0, len = headers.length; i < len; i++) {
      if (scrollTop < headers[i].bottomOffset) {
        break;
      }
      currentHeaderIndex = i;
    }
  }

  function createStickyHeader() {
    header = $('<div>')
      .attr('id', 'sticky-header')
      .hide()
      .appendTo(stickyHeaderContainer);
  }

  /*
  function getTextContentOf(node) {
    var content = "";

    for (var i = 0, len = node.childNodes.length; i < len; i++) {
      if (node.childNodes[i].nodeType === 3) {
        content += node.childNodes[i].textContent;
      }
    }

    return content;
  }
  */

  function render() {
    var clonedHeader;
    if (currentHeaderRangeIndex < 0 || currentHeaderRangeIndex > headerRanges.length-1) {
      header.empty().hide();
      body.removeClass('has-sticky-header');
    } else {
      var realHeader = $(headerRanges[currentHeaderRangeIndex].element);
      if (typeof config.fillHeadersWith === 'function') {
      }
      if (config.fillHeadersWith === 'content') {
        header.html(realHeader.clone().html());
      } else {
        header.html(realHeader.clone());
      }
      header.show();
      body.addClass('has-sticky-header');
    }
    return me;
  }

  function isWithinRange(number, range) {
    return (
      number >= range.start &&
      (
        range.end === undefined ||
        range.end === null ||
        number <= range.end
      )
    );
  }

  function onScroll() {
    currentScrollOffset = contentContainer.scrollTop();

    /*
    console.log('currentScrollOffset', currentScrollOffset);
    console.log('headerRanges[0].start', headerRanges[0].start);
    */

    if (currentScrollOffset > headerRanges[0].start) {
      var newCurrentHeaderRangeIndex = currentHeaderRangeIndex;
      var currentHeaderRange = headerRanges[newCurrentHeaderRangeIndex];

      if (newCurrentHeaderRangeIndex < 0) {
        newCurrentHeaderRangeIndex = 0;
      }

      if (currentScrollOffset < lastScrollOffset) {
        //console.log('scrolling up');

        while (true) {
          currentHeaderRange = headerRanges[newCurrentHeaderRangeIndex];
          if (!currentHeaderRange || isWithinRange(currentScrollOffset, currentHeaderRange)) {
            break;
          } else {
            newCurrentHeaderRangeIndex--;
            //console.log('rewinding newCurrentHeaderRangeIndex to ' + newCurrentHeaderRangeIndex);
            // repeat
          }
        }
      } else {
        //console.log('scrolling down');

        while (true) {
          currentHeaderRange = headerRanges[newCurrentHeaderRangeIndex];
          if (!currentHeaderRange || isWithinRange(currentScrollOffset, currentHeaderRange)) {
            break;
          } else {
            if (newCurrentHeaderRangeIndex === 16) {
              console.error('NOPE!!!');
              //console.log('currentScrollOffset', currentScrollOffset);
              //console.log('currentHeaderRange', currentHeaderRange);
              //console.log('Was within range', isWithinRange(currentScrollOffset, currentHeaderRange));
              break;
            }
            newCurrentHeaderRangeIndex++;
            //console.log('bumping newCurrentHeaderRangeIndex to ' + newCurrentHeaderRangeIndex);
            // repeat
          }
        }
      }
    } else {
      newCurrentHeaderRangeIndex = -1;
    }

    /*
    if (newCurrentHeaderRangeIndex > headerRanges.length-1) {
      newCurrentHeaderRangeIndex = headerRanges.length-1;
    }
    */

    // only re-render when necessary
    if (newCurrentHeaderRangeIndex !== undefined && currentHeaderRangeIndex !== newCurrentHeaderRangeIndex) {
      //console.log('setting currentHeaderRangeIndex to', newCurrentHeaderRangeIndex);
      currentHeaderRangeIndex = newCurrentHeaderRangeIndex;
      render();
    } else {
      //console.log('currentHeaderRangeIndex did not change');
    }

    //console.log({currentHeaderRangeIndex: currentHeaderRangeIndex});

    lastScrollOffset = currentScrollOffset;
  }

  function listenToScroll(element, callback, options) {
    options = options || {};

    if (options.every) {
      element.on('scroll', function () {
        isScrolling = true;
      })

      setInterval(function () {
        if (isScrolling) {
          callback();
          isScrolling = false;
        }
      }, options.every);
    }
    else {
      element.on('scroll', callback);
    }
  }

  me.set = function (/* key, value | config */) {
    if ($.isPlainObject(arguments[0])) {
      $.extend(config, arguments[0]);
    } else {
      config[arguments[0]] = arguments[1];
    }
    return me;
  }

  me.add = function (/* selectors... */) {
    selectors.push.apply(selectors, arguments);
    return me;
  }

  me.activate = function () {
    body = $('body');
    contentContainer = $(config.contentContainer);
    setHeaders();
    setHeaderRanges();
    setCurrentHeaderIndex();
    createStickyHeader();

    /*
    console.log({
      headerRanges: headerRanges
    });
    */

    listenToScroll(contentContainer, onScroll);

    return me;
  }

  return me;
})(jQuery);
