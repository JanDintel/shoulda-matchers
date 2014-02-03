window.StickyHeaders = (function ($) {
  var me = {};

  var config = {
    scrollContainer: document
  };
  var selectors = [];
  var headers = [];
  var headerRanges = [];

  var scrollContainer;
  var currentHeaderRangeIndex = -1;
  var currentScrollOffset = 0;
  var lastScrollOffset = 0;
  var isScrolling = false;

  function setHeaders() {
    scrollContainer = $(config.scrollContainer);

    var elements = [];
    $.each(selectors, function (i, selector) {
      var foundElements = scrollContainer.find(selector);
      $.each(foundElements, function (i, element) {
        var $element = $(element);
        // position() takes scrollTop into account which we don't want
        var topOffset = $element.offset().top - $element.offsetParent().offset().top;
        var height = $element.height();
        var outerHeight = $element.outerHeight(true);
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
    for (var i = 0, len = headers.length; i < len; i++) {
      var start = headers[i].topOffset;
      var end;
      if (headers[i+1]) {
        end = headers[i+1].topOffset;
      }
      headerRanges.push({
        start: start,
        end: end,
        element: headers[i].element
      });
    }

  }

  function setCurrentHeaderIndex() {
    var scrollTop = scrollContainer.scrollTop();
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
      .appendTo(config.scrollContainer);
  }

  function render() {
    var clonedHeader;
    if (currentHeaderRangeIndex < 0 || currentHeaderRangeIndex > headerRanges.length-1) {
      header.empty().hide();
    } else {
      clonedHeader = $(headerRanges[currentHeaderRangeIndex].element).clone();
      header.html(clonedHeader).show();
    }
    return me;
  }

  function isWithinRange(number, range) {
    return (number >= range.start && number <= range.end);
  }

  function onScroll() {
    currentScrollOffset = scrollContainer.scrollTop();

    console.log('currentScrollOffset', currentScrollOffset);

    if (currentScrollOffset > headerRanges[0].start) {
      var newCurrentHeaderRangeIndex = currentHeaderRangeIndex;
      var currentHeaderRange = headerRanges[newCurrentHeaderRangeIndex];

      if (newCurrentHeaderRangeIndex === -1) {
        newCurrentHeaderRangeIndex = 0;
      }

      if (currentScrollOffset < lastScrollOffset) {
        console.log('scrolling up');

        while (true) {
          currentHeaderRange = headerRanges[newCurrentHeaderRangeIndex];
          if (!currentHeaderRange || isWithinRange(currentScrollOffset, currentHeaderRange)) {
            break;
          } else {
            newCurrentHeaderRangeIndex--;
            // repeat
          }
        }
      }
      else {
        console.log('scrolling down');

        while (true) {
          currentHeaderRange = headerRanges[newCurrentHeaderRangeIndex];
          if (!currentHeaderRange || isWithinRange(currentScrollOffset, currentHeaderRange)) {
            break;
          } else {
            newCurrentHeaderRangeIndex++;
            // repeat
          }
        }
      }
    } else {
      newCurrentHeaderRangeIndex = -1;
    }

    // only re-render when necessary
    if (newCurrentHeaderRangeIndex !== undefined && currentHeaderRangeIndex !== newCurrentHeaderRangeIndex) {
      console.log('setting currentHeaderRangeIndex to', newCurrentHeaderRangeIndex);
      currentHeaderRangeIndex = newCurrentHeaderRangeIndex;
      render();
    } else {
      console.log('currentHeaderRangeIndex did not change');
    }

    console.log({currentHeaderRangeIndex: currentHeaderRangeIndex});

    lastScrollOffset = currentScrollOffset;
  }

  function listenToScrollEvery(element, callback, interval) {
    element.on('scroll', function () {
      isScrolling = true;
    })

    setInterval(function () {
      if (isScrolling) {
        callback();
        isScrolling = false;
      }
    }, interval);
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
    scrollContainer = $(config.scrollContainer);
    setHeaders();
    setHeaderRanges();
    setCurrentHeaderIndex();
    createStickyHeader();

    console.log({
      selectors: selectors,
      headers: headers,
      headerRanges: headerRanges
    });

    listenToScrollEvery(scrollContainer, onScroll, 500);

    return me;
  }

  return me;
})(jQuery);
